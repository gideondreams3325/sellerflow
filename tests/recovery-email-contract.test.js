import assert from 'node:assert';
import http from 'node:http';

console.log('--- Testing Recovery Email Response Contract & Error Formatter ---');

// Helper to make local HTTP requests
function request(path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const req = http.request({
      hostname: '127.0.0.1',
      port: 3000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers
      }
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(raw); } catch (_) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          raw,
          json
        });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  // Test 1: Invalid email input
  console.log('Test 1: Invalid email rejection');
  const res1 = await request('/api/auth/add-recovery-email', { email: 'not-an-email' });
  assert.strictEqual(res1.status, 400);
  assert(res1.headers['content-type']?.includes('application/json'), 'Must return application/json');
  assert.strictEqual(res1.json?.success, false);
  assert.strictEqual(res1.json?.code, 'INVALID_EMAIL');
  assert.strictEqual(res1.json?.error, 'Please enter a valid recovery email address.');
  console.log('  ✓ 400 INVALID_EMAIL returned correctly with application/json');

  // Test 2: Unauthenticated session
  console.log('Test 2: Unauthenticated request rejection');
  const res2 = await request('/api/auth/add-recovery-email', { email: 'valid@example.com' });
  assert.strictEqual(res2.status, 401);
  assert(res2.headers['content-type']?.includes('application/json'), 'Must return application/json');
  assert.strictEqual(res2.json?.success, false);
  assert.strictEqual(res2.json?.code, 'AUTH_REQUIRED');
  assert.strictEqual(res2.json?.error, 'Your session has expired. Please sign in again.');
  console.log('  ✓ 401 AUTH_REQUIRED returned correctly');

  // Test 3: Authenticated request when email service is unconfigured
  console.log('Test 3: Email service unconfigured response');
  const res3 = await request('/api/auth/add-recovery-email', {
    email: 'testuser_recovery@example.com',
    username: 'test_contract_user',
    uid: 'test_contract_uid_123'
  });
  assert.strictEqual(res3.status, 503);
  assert(res3.headers['content-type']?.includes('application/json'), 'Must return application/json');
  assert.strictEqual(res3.json?.success, false);
  assert.strictEqual(res3.json?.configured, false);
  assert.strictEqual(res3.json?.code, 'EMAIL_SERVICE_UNAVAILABLE');
  assert.strictEqual(res3.json?.error, 'Recovery email service is temporarily unavailable. Please try again later.');
  assert(res3.raw.includes('Email delivery is not configured on the server'), 'Maintains diagnostics message');
  console.log('  ✓ 503 EMAIL_SERVICE_UNAVAILABLE returned correctly');

  // Test 4: Verification code submission with invalid length
  console.log('Test 4: Verify code invalid format');
  const res4 = await request('/api/auth/verify-recovery-email', { code: '123' });
  assert.strictEqual(res4.status, 400);
  assert.strictEqual(res4.json?.code, 'INVALID_CODE');
  assert.strictEqual(res4.json?.error, 'Please enter the 6-digit verification code.');
  console.log('  ✓ 400 INVALID_CODE returned correctly');

  // Test 5: Verify code with expired/missing challenge
  console.log('Test 5: Verify code expired or not found');
  const res5 = await request('/api/auth/verify-recovery-email', {
    code: '123456',
    email: 'nobody@example.com',
    uid: 'non_existent_uid'
  });
  assert.strictEqual(res5.status, 400);
  assert.strictEqual(res5.json?.code, 'CODE_EXPIRED');
  assert.strictEqual(res5.json?.error, 'This verification code has expired. Please request a new code.');
  console.log('  ✓ 400 CODE_EXPIRED returned correctly');

  // Test 6: Verify formatSellerFlowError in index.html satisfies all expected user experiences
  console.log('Test 6: Verify formatSellerFlowError implementation in index.html');
  const fs = await import('node:fs');
  const html = fs.readFileSync('index.html', 'utf8');
  assert(html.includes("if (code === 'INVALID_EMAIL') return 'Please enter a valid recovery email address.';"));
  assert(html.includes("if (code === 'AUTH_REQUIRED') return 'Your session has expired. Please sign in again.';"));
  assert(html.includes("if (code === 'EMAIL_ALREADY_IN_USE') return 'This recovery email is already associated with another account.';"));
  assert(html.includes("if (code === 'EMAIL_SERVICE_UNAVAILABLE') return 'Recovery email service is temporarily unavailable. Please try again later.';"));
  assert(html.includes("toast('Verification code sent', 'success'"));
  assert(html.includes("toast('Check your recovery email for the 6-digit code.', 'info'"));
  console.log('  ✓ formatSellerFlowError matches all expected messages exactly');

  console.log('--- All Contract Tests Passed Successfully! ---');
}

runTests().catch(err => {
  console.error('Test failure:', err);
  process.exit(1);
});
