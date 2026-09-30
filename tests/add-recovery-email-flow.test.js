import assert from 'node:assert';
import http from 'node:http';
import app from '../server.js';

console.log('--- Starting Add Recovery Email Flow & Negative Test Suite ---');

const server = http.createServer(app);

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const baseUrl = `http://127.0.0.1:${port}`;

async function apiCall(path, method = 'GET', body = null, headers = {}) {
  const reqHeaders = { 'Content-Type': 'application/json', ...headers };
  const opt = {
    method,
    headers: reqHeaders
  };
  if (body) opt.body = JSON.stringify(body);
  const res = await fetch(baseUrl + path, opt);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = null;
  }
  return {
    status: res.status,
    contentType: res.headers.get('content-type') || '',
    text,
    json
  };
}

try {
  // Test 1: Content-Type must always be application/json on unmatched API routes
  console.log('Test 1: Unmatched API route returns JSON 404');
  const r1 = await apiCall('/api/auth/unknown-route', 'GET');
  assert.strictEqual(r1.status, 404);
  assert.ok(r1.contentType.includes('application/json'), 'Must return JSON');
  assert.strictEqual(r1.json?.success, false);
  console.log('  ✓ Unmatched API route returned JSON 404');

  // Test 2: Unauthenticated add-recovery-email
  console.log('Test 2: Unauthenticated add-recovery-email');
  const r2 = await apiCall('/api/auth/add-recovery-email', 'POST', { email: 'user@example.com' });
  assert.strictEqual(r2.status, 401);
  assert.ok(r2.contentType.includes('application/json'), 'Must return JSON');
  assert.strictEqual(r2.json?.code, 'AUTH_REQUIRED');
  assert.strictEqual(r2.json?.error, 'Your session has expired. Please sign in again.');
  console.log('  ✓ Unauthenticated add-recovery-email rejected with AUTH_REQUIRED');

  // Test 3: Invalid email address
  console.log('Test 3: Invalid email address');
  const r3 = await apiCall('/api/auth/add-recovery-email', 'POST', { email: 'not-an-email', username: 'testuser_demo' });
  assert.strictEqual(r3.status, 400);
  assert.ok(r3.contentType.includes('application/json'), 'Must return JSON');
  assert.strictEqual(r3.json?.code, 'INVALID_EMAIL');
  assert.strictEqual(r3.json?.error, 'Please enter a valid recovery email address.');
  console.log('  ✓ Invalid email rejected with INVALID_EMAIL');

  // Test 4: When SMTP is not configured, transparent error rather than claiming email was sent
  console.log('Test 4: Unconfigured SMTP reports failure transparently');
  const r4 = await apiCall('/api/auth/add-recovery-email', 'POST', { email: 'valid_test@example.com', username: 'testuser_demo' });
  assert.strictEqual(r4.status, 503);
  assert.ok(r4.contentType.includes('application/json'), 'Must return JSON');
  assert.strictEqual(r4.json?.code, 'EMAIL_DELIVERY_FAILED');
  assert.strictEqual(r4.json?.error, 'Email service is not configured yet. Please try again later.');
  assert.strictEqual(r4.json?.requiresVerification, false);
  assert.strictEqual(r4.json?.devCode, undefined, 'Must NEVER leak devCode');
  console.log('  ✓ Unconfigured SMTP reports EMAIL_DELIVERY_FAILED with zero code leakage');

  // Test 5: Verify recovery email with invalid code length
  console.log('Test 5: Verify with invalid code length');
  const r5 = await apiCall('/api/auth/verify-recovery-email', 'POST', { code: '12', username: 'testuser_demo' });
  assert.strictEqual(r5.status, 400);
  assert.ok(r5.contentType.includes('application/json'), 'Must return JSON');
  assert.strictEqual(r5.json?.code, 'INVALID_CODE');
  console.log('  ✓ Invalid code length rejected with INVALID_CODE');

  // Test 6: Verify with non-existent / expired challenge
  console.log('Test 6: Verify non-existent code');
  const r6 = await apiCall('/api/auth/verify-recovery-email', 'POST', { code: '999999', username: 'nonexistent_user_xyz' });
  assert.strictEqual(r6.status, 400);
  assert.ok(r6.contentType.includes('application/json'), 'Must return JSON');
  assert.strictEqual(r6.json?.code, 'CODE_EXPIRED');
  console.log('  ✓ Non-existent verification challenge returns CODE_EXPIRED');

  console.log('\n--- All Add Recovery Email API tests passed successfully! ---');
} finally {
  server.close();
}
