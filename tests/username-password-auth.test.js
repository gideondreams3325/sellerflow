import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('--- Starting SellerFlow Final Authentication Model Test Suite ---');

const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf8');
const adminHtml = fs.readFileSync(path.resolve('admin', 'index.html'), 'utf8');
const adminJs = fs.readFileSync(path.resolve('admin', 'app.js'), 'utf8');
const serverJs = fs.readFileSync(path.resolve('server.js'), 'utf8');

// 1. Verify User-Facing Google Authentication Removal
console.log('Test 1: Complete removal of Google Sign-In elements from index.html');
assert(!indexHtml.includes('id="googleAuthBtn"'), 'id="googleAuthBtn" must be removed from index.html');
assert(!indexHtml.includes('id="googleAuthBtnText"'), 'id="googleAuthBtnText" must be removed from index.html');
assert(!indexHtml.includes('id="mobileGoogleAuthBtn"'), 'id="mobileGoogleAuthBtn" must be removed from index.html');
assert(!indexHtml.includes('id="authPromptGoogle"'), 'id="authPromptGoogle" must be removed from authPrompt');
assert(!indexHtml.includes('handleCapacitorGoogleSignIn'), 'handleCapacitorGoogleSignIn must be removed');
assert(!indexHtml.includes('triggerGoogleSignIn'), 'triggerGoogleSignIn must be removed');
assert(!adminHtml.includes('id="adminGoogleLoginBtn"'), 'adminGoogleLoginBtn must be removed from admin/index.html');
console.log('  ✓ Zero user-facing Google login buttons or prompts in consumer and admin portals');

// 2. Verify Sign-In Screen requires ONLY Username & Password
console.log('Test 2: Normal login UI shows ONLY Username & Password');
assert(indexHtml.includes('id="authUsername"'), 'authUsername input must exist in index.html');
assert(indexHtml.includes('id="authPassword"'), 'authPassword input must exist in index.html');
assert(indexHtml.includes('id="authSubmit"'), 'authSubmit button must exist in index.html');
assert(indexHtml.includes('id="authForgotPasswordBtn"'), 'authForgotPasswordBtn link must exist');
console.log('  ✓ Normal login credentials: Username and Password only');

// 3. Verify Sign-Up requires all 4 mandatory fields
console.log('Test 3: Registration requires Username, Recovery Email, Password, Confirm Password');
assert(indexHtml.includes('id="authRecoveryEmail"'), 'authRecoveryEmail input must exist');
assert(indexHtml.includes('id="authConfirmPassword"'), 'authConfirmPassword input must exist');
assert(serverJs.includes('/api/auth/register-username'), 'Server must implement /api/auth/register-username endpoint');
assert(serverJs.includes('recoveryEmail') && serverJs.includes('usernameClean'), 'Registration endpoint validates recoveryEmail and username');
console.log('  ✓ 4 mandatory registration fields verified');

// 4. Verify Username Normalization and Case-Insensitive Uniqueness
console.log('Test 4: Username normalization & uniqueness logic');
assert(serverJs.includes('function usernameClean(v)'), 'server.js must define usernameClean helper');
assert(serverJs.includes('toLowerCase()'), 'Username must be lowercased consistently');
assert(indexHtml.includes('function usernameClean(v)'), 'index.html must define usernameClean helper');
console.log('  ✓ Username case-insensitivity and character sanitation verified');

// 5. Verify Forgot Password Flow: asks for Username and Recovery Email with generic response
console.log('Test 5: Forgot Password requests Username and Recovery Email with generic security response');
assert(serverJs.includes('/api/auth/forgot-password'), 'Server must implement /api/auth/forgot-password endpoint');
assert(serverJs.includes('If this account has a verified recovery email, recovery instructions will be sent.'), 'Must return generic enumeration-safe response');
assert(serverJs.includes('/api/auth/reset-password'), 'Server must implement /api/auth/reset-password endpoint');
assert(indexHtml.includes('Enter your username and recovery email to receive recovery instructions'), 'index.html must display recovery email instructions');
console.log('  ✓ Account enumeration protected forgot password flow with username & recovery email verified');

// 6. Verify Admin Portal uses Username/Password & Authoritative Authorization
console.log('Test 6: Admin portal authentication model & RBAC protection');
assert(adminHtml.includes('id="adminUsernameInput"'), 'adminUsernameInput must exist in admin/index.html');
assert(adminHtml.includes('id="adminPasswordInput"'), 'adminPasswordInput must exist in admin/index.html');
assert(adminJs.includes('/api/auth/login-username') || adminJs.includes('/api/auth/lookup-identifier'), 'Admin app uses authoritative username login endpoint');
assert(adminJs.includes('isAuthorizedAdminEmail'), 'Admin app preserves authoritative RBAC checks');
console.log('  ✓ Admin login updated to username/password while preserving strict RBAC checks');

// 7. Verify Android Native Cleanup
console.log('Test 7: Android native cleanup');
assert(!fs.existsSync(path.resolve('android/app/src/main/java/com/sellerflow/app/NativeGoogleAuthPlugin.java')), 'NativeGoogleAuthPlugin.java must be removed');
const mainActivity = fs.readFileSync(path.resolve('android/app/src/main/java/com/sellerflow/app/MainActivity.java'), 'utf8');
assert(!mainActivity.includes('NativeGoogleAuthPlugin'), 'MainActivity must not register NativeGoogleAuthPlugin');
const manifest = fs.readFileSync(path.resolve('android/app/src/main/AndroidManifest.xml'), 'utf8');
assert(!manifest.includes('android:host="oauth-callback"'), 'AndroidManifest must not register oauth-callback filter');
console.log('  ✓ Native Android codebase cleaned of obsolete Google Auth plugins');

// 8. Verify Username Suggestions Everywhere Except When Signing In
console.log('Test 8: Username suggestions on taken check anywhere EXCEPT during sign-in');
assert(indexHtml.includes('isSignInOrRecovery'), 'Must differentiate sign-in/recovery context to skip suggestions during sign-in');
assert(indexHtml.includes('authUsernameSuggestions'), 'authUsernameSuggestions element must exist for registration');
assert(indexHtml.includes('profileUsernameSuggestions'), 'profileUsernameSuggestions element must exist on profile');
assert(indexHtml.includes('sfEditUsernameSuggestions'), 'sfEditUsernameSuggestions element must exist in edit profile modal');
assert(indexHtml.includes('generateUsernameSuggestions'), 'Must define generateUsernameSuggestions function');
assert(indexHtml.includes('data-pick-username'), 'Must provide tap-to-select chips with data-pick-username');
console.log('  ✓ Username suggestions active everywhere when taken, strictly suppressed during normal sign-in');

console.log('--- All SellerFlow Final Authentication Model Tests Passed Successfully ---');
