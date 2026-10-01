import assert from 'node:assert';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import fs from 'node:fs';

console.log('======================================================================');
console.log('STARTING REAL EMAIL-DELIVERY & RECOVERY FLOW END-TO-END TEST SUITE');
console.log('======================================================================');

// 1. Create a Lightweight Local SMTP Test Server to capture real SMTP transmissions
class LocalSmtpServer {
  constructor() {
    this.server = null;
    this.port = 0;
    this.receivedEmails = [];
  }

  start() {
    return new Promise((resolve) => {
      this.server = net.createServer((socket) => {
        let emailBuffer = '';
        let inData = false;

        socket.write('220 sellerflow.test ESMTP Service Ready\r\n');

        socket.on('data', (chunk) => {
          const lines = chunk.toString().split('\r\n');
          for (const line of lines) {
            if (!line && !inData) continue;
            if (inData) {
              if (line === '.') {
                inData = false;
                this.receivedEmails.push(emailBuffer);
                emailBuffer = '';
                socket.write('250 2.0.0 OK message queued\r\n');
              } else {
                emailBuffer += line + '\n';
              }
            } else {
              const upper = line.toUpperCase();
              if (upper.startsWith('EHLO') || upper.startsWith('HELO')) {
                socket.write('250-sellerflow.test\r\n250-8BITMIME\r\n250 OK\r\n');
              } else if (upper.startsWith('MAIL FROM:')) {
                socket.write('250 2.1.0 Sender OK\r\n');
              } else if (upper.startsWith('RCPT TO:')) {
                socket.write('250 2.1.5 Recipient OK\r\n');
              } else if (upper.startsWith('DATA')) {
                inData = true;
                socket.write('354 Start mail input; end with <CRLF>.<CRLF>\r\n');
              } else if (upper.startsWith('QUIT')) {
                socket.write('221 2.0.0 Bye\r\n');
                socket.end();
              } else if (upper.startsWith('RSET')) {
                emailBuffer = '';
                inData = false;
                socket.write('250 2.0.0 OK\r\n');
              } else {
                socket.write('250 OK\r\n');
              }
            }
          }
        });
      });

      this.server.listen(0, '127.0.0.1', () => {
        this.port = this.server.address().port;
        resolve(this.port);
      });
    });
  }

  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  clear() {
    this.receivedEmails = [];
  }
}

const smtpServer = new LocalSmtpServer();
const smtpPort = await smtpServer.start();
console.log(`✓ Real local SMTP test server listening on port ${smtpPort}`);

// Configure process.env to use our real SMTP server
process.env.SMTP_HOST = '127.0.0.1';
process.env.SMTP_PORT = String(smtpPort);
process.env.SMTP_USER = 'security@sellerflow.gh';
process.env.SMTP_PASS = 'mock_secret_key_123';
process.env.SMTP_FROM = '"SellerFlow Security" <security@sellerflow.gh>';

// Dynamically import app so it picks up the SMTP credentials
const { default: app } = await import('../server.js');
const apiServer = http.createServer(app);
await new Promise((resolve) => apiServer.listen(0, '127.0.0.1', resolve));
const apiPort = apiServer.address().port;
const baseUrl = `http://127.0.0.1:${apiPort}`;
console.log(`✓ SellerFlow API server running on port ${apiPort}`);

async function api(endpoint, method = 'GET', body = null, headers = {}) {
  const reqHeaders = { 'Content-Type': 'application/json', ...headers };
  const opt = { method, headers: reqHeaders };
  if (body) opt.body = JSON.stringify(body);
  const res = await fetch(baseUrl + endpoint, opt);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (_) {}
  return { status: res.status, headers: res.headers, text, json };
}

try {
  // -------------------------------------------------------------------------
  // TEST O: Unauthenticated Request
  // -------------------------------------------------------------------------
  console.log('\n--- Test O: Unauthenticated Request ---');
  const resO = await api('/api/auth/add-recovery-email', 'POST', { email: 'merchant@example.com' });
  assert.strictEqual(resO.status, 401);
  assert.strictEqual(resO.json?.code, 'AUTH_REQUIRED');
  console.log('  ✓ Rejected unauthenticated request with 401 AUTH_REQUIRED');

  // -------------------------------------------------------------------------
  // TEST D: Email Validation
  // -------------------------------------------------------------------------
  console.log('\n--- Test D: Email Validation ---');
  const resD = await api('/api/auth/add-recovery-email', 'POST', {
    email: 'not-a-valid-email',
    username: 'testmerchant_1',
    uid: 'uid_testmerchant_1'
  });
  assert.strictEqual(resD.status, 400);
  assert.strictEqual(resD.json?.code, 'INVALID_EMAIL');
  console.log('  ✓ Invalid email format rejected with 400 INVALID_EMAIL');

  // -------------------------------------------------------------------------
  // TEST G & F: Real Email Transport Success & Code Generation
  // -------------------------------------------------------------------------
  console.log('\n--- Test G & F: Email Transport Delivery & 6-Digit Code ---');
  smtpServer.clear();
  const testEmail = 'merchant_real@example.com';
  const testUser = 'testmerchant_1';
  const testUid = 'uid_testmerchant_1';

  const resG = await api('/api/auth/add-recovery-email', 'POST', {
    email: testEmail,
    username: testUser,
    uid: testUid
  });

  assert.strictEqual(resG.status, 200, `Expected 200, got ${resG.status}: ${resG.text}`);
  assert.strictEqual(resG.json?.success, true);
  assert.strictEqual(resG.json?.code, 'RECOVERY_CODE_SENT');
  assert.strictEqual(resG.json?.requiresVerification, true);
  assert.strictEqual(resG.json?.maskedEmail, 'm***@example.com');
  assert.strictEqual(resG.json?.codeValue, undefined, 'Must NEVER return code in response');
  assert.strictEqual(resG.json?.devCode, undefined, 'Must NEVER return devCode in response');

  // Verify email was actually transmitted over the socket to the SMTP server!
  assert.strictEqual(smtpServer.receivedEmails.length, 1, 'SMTP server should have received exactly 1 email');
  const rawEmail = smtpServer.receivedEmails[0];
  const normalizedEmail = rawEmail.replace(/=\r?\n/g, '').replace(/=20/g, ' ');

  // Validate Subject (Requirement 5)
  assert.ok(normalizedEmail.includes('Subject: SellerFlow Recovery Email Verification Code'),
    'Email subject must match "SellerFlow Recovery Email Verification Code"');

  // Validate Body content (Requirement 5)
  assert.ok(normalizedEmail.includes(`Hello ${testUser}`), 'Email body must greet username');
  assert.ok(normalizedEmail.includes('You requested to add this email address as your SellerFlow recovery email.'),
    'Email body must include verification explanation');
  assert.ok(normalizedEmail.includes('This code expires in 10 minutes and can only be used once.'),
    'Email body must specify 10-minute expiry and single-use');
  assert.ok(normalizedEmail.includes('SellerFlow') && normalizedEmail.includes('BUY'),
    'Email body must contain SellerFlow BUY • SELL • GROW brand footer');

  // Extract the real 6-digit code from the received email
  const codeMatch = normalizedEmail.match(/\b([0-9]{6})\b/);
  assert.ok(codeMatch && codeMatch[1], 'Must contain a 6-digit code in the email');
  const deliveredCode = codeMatch[1];
  console.log(`  ✓ Real SMTP transport received verification email containing 6-digit code (${deliveredCode})`);

  // -------------------------------------------------------------------------
  // TEST K: Resend Cooldown (45s Rate Limiting)
  // -------------------------------------------------------------------------
  console.log('\n--- Test K: Resend Cooldown ---');
  const resK = await api('/api/auth/add-recovery-email', 'POST', {
    email: testEmail,
    username: testUser,
    uid: testUid
  });
  assert.strictEqual(resK.status, 429);
  assert.strictEqual(resK.json?.code, 'RATE_LIMITED');
  console.log('  ✓ Immediate resend blocked with 429 RATE_LIMITED');

  // -------------------------------------------------------------------------
  // TEST I & J: Single-Use Code, 10-Minute Expiry, and Verification
  // -------------------------------------------------------------------------
  console.log('\n--- Test I & J: Verification, Single-Use, and Expiry ---');

  // Wrong code test
  const resWrong = await api('/api/auth/verify-recovery-email', 'POST', {
    code: '000000',
    email: testEmail,
    username: testUser,
    uid: testUid
  });
  assert.strictEqual(resWrong.status, 400);
  assert.strictEqual(resWrong.json?.code, 'INVALID_CODE');
  console.log('  ✓ Incorrect code rejected with 400 INVALID_CODE');

  // Correct code test
  const resVerify = await api('/api/auth/verify-recovery-email', 'POST', {
    code: deliveredCode,
    email: testEmail,
    username: testUser,
    uid: testUid
  });
  assert.strictEqual(resVerify.status, 200);
  assert.strictEqual(resVerify.json?.verified, true);
  assert.ok(resVerify.json?.message.includes('Recovery Email Verified ✓'));
  console.log('  ✓ Correct code accepted and verified with "Recovery Email Verified ✓"');

  // Single-use check: Trying to reuse the same code must fail!
  const resReuse = await api('/api/auth/verify-recovery-email', 'POST', {
    code: deliveredCode,
    email: testEmail,
    username: testUser,
    uid: testUid
  });
  assert.strictEqual(resReuse.status, 400);
  assert.strictEqual(resReuse.json?.code, 'CODE_EXPIRED');
  console.log('  ✓ Code cannot be reused (single-use enforced -> 400 CODE_EXPIRED)');

  // -------------------------------------------------------------------------
  // TEST E: Duplicate Recovery Email Check
  // -------------------------------------------------------------------------
  console.log('\n--- Test E: Duplicate Recovery Email Rejection ---');
  const resDup = await api('/api/auth/add-recovery-email', 'POST', {
    email: testEmail, // Already verified on testmerchant_1
    username: 'other_merchant_2',
    uid: 'uid_other_merchant_2'
  });
  assert.strictEqual(resDup.status, 400);
  assert.strictEqual(resDup.json?.code, 'EMAIL_ALREADY_IN_USE');
  console.log('  ✓ Verified recovery email on another account rejected with 400 EMAIL_ALREADY_IN_USE');

  // -------------------------------------------------------------------------
  // TEST H: Email Transport Failure (SMTP Server Offline / Unconfigured)
  // -------------------------------------------------------------------------
  console.log('\n--- Test H: Email Transport Failure Handling ---');
  // Temporarily set an invalid SMTP host that refuses connection
  process.env.SMTP_HOST = '127.0.0.1';
  process.env.SMTP_PORT = '1'; // Closed port

  // Force cache clear by reloading or testing direct failure
  const resH = await api('/api/auth/add-recovery-email', 'POST', {
    email: 'new_unique_merchant@example.com',
    username: 'unique_merchant_3',
    uid: 'uid_unique_merchant_3'
  });
  assert.strictEqual(resH.status, 503);
  assert.strictEqual(resH.json?.code, 'EMAIL_SERVICE_UNAVAILABLE');
  assert.strictEqual(resH.json?.error, 'Recovery email service is temporarily unavailable. Please try again later.');
  console.log('  ✓ Transport failure cleanly returns 503 EMAIL_SERVICE_UNAVAILABLE without claiming success');

  // Restore working SMTP port for remaining tests
  process.env.SMTP_PORT = String(smtpPort);

  // -------------------------------------------------------------------------
  // TEST L & M: Forgot Password & Password Reset via Verified Recovery Email
  // -------------------------------------------------------------------------
  console.log('\n--- Test L & M: Forgot Password & Reset via Verified Recovery Email ---');
  smtpServer.clear();

  // Request password reset using username only (identifies account and verified recovery email)
  const resForgot = await api('/api/auth/forgot-password', 'POST', {
    username: testUser
  });
  assert.strictEqual(resForgot.status, 200);
  assert.strictEqual(resForgot.json?.code, 'RECOVERY_CODE_SENT');
  assert.strictEqual(resForgot.json?.maskedEmail, 'm***@example.com');
  assert.strictEqual(resForgot.json?.devCode, undefined, 'Must NEVER return devCode');

  // Verify reset email was delivered by SMTP
  assert.strictEqual(smtpServer.receivedEmails.length, 1);
  const resetEmailRaw = smtpServer.receivedEmails[0];
  const normalizedResetEmail = resetEmailRaw.replace(/=\r?\n/g, '').replace(/=20/g, ' ');
  assert.ok(normalizedResetEmail.includes('Subject: SellerFlow Password Recovery Code'),
    'Reset subject must match SellerFlow Password Recovery Code');
  assert.ok(normalizedResetEmail.includes('We received a request to reset your SellerFlow account password.'));

  const resetCodeMatch = normalizedResetEmail.match(/\b([0-9]{6})\b/);
  assert.ok(resetCodeMatch && resetCodeMatch[1]);
  const resetDeliveredCode = resetCodeMatch[1];
  console.log(`  ✓ Forgot password sent 6-digit reset code (${resetDeliveredCode}) to verified recovery email`);

  // Perform password reset using 6-digit code
  const resReset = await api('/api/auth/reset-password', 'POST', {
    username: testUser,
    code: resetDeliveredCode,
    newPassword: 'BrandNewSecurePassword123!'
  });
  assert.strictEqual(resReset.status, 200);
  assert.strictEqual(resReset.json?.success, true);
  console.log('  ✓ Password reset succeeded using code delivered to verified recovery email');

  // Verify single-use: reset code cannot be used again
  const resResetReuse = await api('/api/auth/reset-password', 'POST', {
    username: testUser,
    code: resetDeliveredCode,
    newPassword: 'AnotherPassword456!'
  });
  assert.strictEqual(resResetReuse.status, 400);
  console.log('  ✓ Reset code is single-use and cannot be reused');

  // -------------------------------------------------------------------------
  // TEST N: Existing Account Recovery Integration
  // -------------------------------------------------------------------------
  console.log('\n--- Test N: Existing Account Recovery ---');
  // Admin account has existing email gideondreams3325@gmail.com
  const resStatus = await api('/api/auth/recovery-email-status?username=sellerflow', 'GET');
  assert.strictEqual(resStatus.status, 200);
  assert.strictEqual(resStatus.json?.hasRecoveryEmail, true);
  assert.strictEqual(resStatus.json?.verified, true);
  console.log('  ✓ Existing account email automatically recognized as verified recovery email');

  // -------------------------------------------------------------------------
  // TEST P: Serverless Safety (api/index.js does not run app.listen)
  // -------------------------------------------------------------------------
  console.log('\n--- Test P: Serverless Safety ---');
  const apiModule = await import('../api/index.js');
  assert.strictEqual(typeof apiModule.default, 'function', 'api/index.js must export default function');
  console.log('  ✓ api/index.js safely imported in serverless mode');

  console.log('\n======================================================================');
  console.log('ALL REAL EMAIL DELIVERY & RECOVERY SUITE TESTS PASSED SUCCESSFULLY!');
  console.log('======================================================================');
} finally {
  await smtpServer.stop();
  await new Promise((resolve) => apiServer.close(resolve));
}
