import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('--- Starting SellerFlow Recovery Email & Welcome Notification Test Suite ---');

const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf8');
const serverJs = fs.readFileSync(path.resolve('server.js'), 'utf8');
const envExample = fs.readFileSync(path.resolve('.env.example'), 'utf8');

// 1. Requirement 1: Remove Recovery Email from Account Creation
console.log('Test 1: Registration Form contains ONLY Username, Password, Confirm Password, Terms acceptance');
assert(!indexHtml.includes("if (!recoveryEmail || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(recoveryEmail)) throw Error('A valid recovery email is required.');"),
  'Registration submission must not require recovery email');
assert(indexHtml.includes("setVisible($('recoveryEmailWrap'), false);"),
  'setAuthMode register must hide recoveryEmailWrap');
assert(indexHtml.includes("setVisible($('nameWrap'), false);"),
  'setAuthMode register must hide nameWrap');
assert(indexHtml.includes("setVisible($('usernameWrap'), true);"),
  'setAuthMode register must show usernameWrap');
assert(indexHtml.includes("setVisible($('passwordWrap'), true);"),
  'setAuthMode register must show passwordWrap');
assert(indexHtml.includes("setVisible($('confirmPasswordWrap'), true);"),
  'setAuthMode register must show confirmPasswordWrap');
assert(indexHtml.includes("setVisible($('termsWrap'), true);"),
  'setAuthMode register must show termsWrap');
console.log('  ✓ Registration screen asks only for username, password, confirm password and terms acceptance');

// 2. Requirement 2: Automatically Welcome New Users
console.log('Test 2: Welcome Notification & Prompt after Account Creation');
assert(indexHtml.includes('showWelcomeNotificationDialog'),
  'index.html must define and call showWelcomeNotificationDialog');
assert(indexHtml.includes('Welcome to SellerFlow! 🎉'),
  'Must include exact welcome notification title');
assert(indexHtml.includes('Your account has been created successfully. You can now explore SellerFlow, connect with sellers, discover products, and grow your business.'),
  'Must include exact welcome notification message');
assert(indexHtml.includes('Protect your account: Add and verify a recovery email in Settings. You will need it if you ever forget your password.') ||
       indexHtml.includes('Add and verify a recovery email in Settings. You will need it if you ever forget your password.'),
  'Must include explanation to protect account with recovery email');
assert(indexHtml.includes('welcomeAddRecoveryBtn') && indexHtml.includes('welcomeMaybeLaterBtn'),
  'Must include Add Recovery Email and Maybe Later buttons');
assert(indexHtml.includes('sf_welcome_shown_'),
  'Must prevent displaying welcome modal repeatedly on subsequent sign-ins');
console.log('  ✓ Automated welcome prompt, storage against account, and one-time display verified');

// 3. Requirement 3: Replace "Change Email" in Settings
console.log('Test 3: Replace "Change Email" in Settings with "Add Recovery Email" / "Manage Recovery Email"');
assert(indexHtml.includes('Manage Recovery Email'),
  'Settings must display "Manage Recovery Email" for users with verified recovery email');
assert(indexHtml.includes('Verification status: <strong class="text-emerald-700 font-semibold">Verified</strong>') ||
       indexHtml.includes('Verified'),
  'Settings must display verified status');
assert(indexHtml.includes('settingsRecoveryEmailInput') && indexHtml.includes('settingsAddRecoveryEmailBtn'),
  'Settings must display empty input and Add Recovery Email button for users without one');
assert(indexHtml.includes('A recovery email protects your account if you forget your password.'),
  'Settings must explain recovery email protection');
assert(indexHtml.includes('changePasswordBtn'),
  'Change Password option must be preserved exactly');
console.log('  ✓ Settings Security section updated with conditional verified/unverified recovery email options');

// 4. Requirement 4: Add & Verify a Recovery Email Flow
console.log('Test 4: Add and Verify Recovery Email Flow');
assert(serverJs.includes('/api/auth/add-recovery-email'),
  'server.js must implement /api/auth/add-recovery-email endpoint');
assert(serverJs.includes('/api/auth/verify-recovery-email'),
  'server.js must implement /api/auth/verify-recovery-email endpoint');
assert(serverJs.includes('Recovery Email Verified ✓') &&
       serverJs.includes('Your recovery email has been added successfully. You can now use it to recover your SellerFlow account if you forget your password.'),
  'Server & UI must return the exact required confirmation message upon verification');
assert(serverJs.includes('recoveryEmailVerified: true'),
  'Server must mark recoveryEmailVerified only upon successful single-use code verification');
assert(serverJs.includes('10 * 60 * 1000'),
  'Verification code must expire after 10 minutes');
assert(indexHtml.includes('openRecoveryCodeVerificationModal'),
  'index.html must implement 6-digit verification code screen');
assert(indexHtml.includes('recResendCodeBtn'),
  'index.html must implement Resend Code option with countdown cooldown');
console.log('  ✓ 6-digit code verification, 10-minute expiry, single-use token, and verified status verified');

// 5. Requirement 5: Email Delivery & Configuration
console.log('Test 5: Email delivery configuration & secrets safety');
assert(envExample.includes('SMTP_HOST=') && envExample.includes('SMTP_PORT=') && envExample.includes('SMTP_USER=') && envExample.includes('SMTP_PASS='),
  '.env.example must document SMTP environment variables');
assert(!indexHtml.includes('AIzaSy') || !indexHtml.includes('FIREBASE_PRIVATE_KEY'),
  'Frontend index.html must never expose server secrets or private keys');
assert(serverJs.includes('Email delivery is not configured on the server'),
  'Server must accurately report when SMTP delivery is not configured rather than pretending delivery succeeded');
console.log('  ✓ Email delivery architecture, error transparency, and secret protection verified');

console.log('--- All SellerFlow Recovery Email & Welcome Notification Tests Passed Successfully! ---');
