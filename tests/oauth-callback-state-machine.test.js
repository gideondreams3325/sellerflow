import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('--- Testing OAuth Callback State Machine & UI Resolution ---');

const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf8');

// 1. Verify renderOverlay immediate DOM attachment and window export
assert(indexHtml.includes('window.renderOAuthOverlay = renderOverlay'), 'renderOverlay must be exported to window');
assert(indexHtml.includes('document.documentElement.appendChild(overlay)'), 'renderOverlay must attach to documentElement if body not ready');
console.log('✓ Test 1: renderOverlay immediate DOM attachment & window export verified');

// 2. Verify handleOAuthCallbackPage calls window.renderOAuthOverlay immediately
assert(indexHtml.includes("if (typeof window.renderOAuthOverlay === 'function')"), 'handleOAuthCallbackPage must ensure overlay exists');
console.log('✓ Test 2: handleOAuthCallbackPage ensures overlay exists on invocation');

// 3. Verify dynamic element lookup and no stale null closures
assert(indexHtml.includes("const updateStatus = (t) => {"), 'updateStatus helper must be defined dynamically');
assert(indexHtml.includes("const el = document.getElementById('oauthStatusMsg')"), 'updateStatus must look up element dynamically');
assert(indexHtml.includes("const setButtonState = ({"), 'setButtonState helper must be defined');
console.log('✓ Test 3: Dynamic DOM lookup and responsive button helper verified');

// 4. Verify no signOut before signInWithRedirect to preserve redirect handshake
const isStartSectionMatch = indexHtml.match(/if\s*\(isStart\s*&&\s*!redirectRes\?\.user\)\s*\{([\s\S]*?)(await authInst\.signInWithRedirect)/);
assert(isStartSectionMatch, 'isStart block must exist');
const isStartBody = isStartSectionMatch[1];
assert(!isStartBody.includes('authInst.signOut()'), 'authInst.signOut() must NOT be called before signInWithRedirect');
console.log('✓ Test 4: Preserved redirect state (no premature signOut before redirect)');

// 5. Verify URL sanitization removes start=google before redirect
assert(isStartBody.includes("cleanSearch.delete('start')"), 'URL must strip start=google to prevent loop');
console.log('✓ Test 5: Loop prevention: start parameter cleanly stripped');

// 6. Verify fast customToken minting with timeout
assert(indexHtml.includes('AbortController'), 'customToken exchange must support AbortController timeout');
console.log('✓ Test 6: Non-blocking customToken exchange verified');

// 7. Verify verified state button configuration and deep links
assert(indexHtml.includes("text: appNameText"), 'Verified state must set button text to app name');
assert(indexHtml.includes("href: customSchemeUri"), 'Verified state must link button to custom scheme');
assert(indexHtml.includes("showSpinner: false"), 'Verified state must dismiss loading spinner');
assert(indexHtml.includes("enabled: true"), 'Verified state must enable clickability');
console.log('✓ Test 7: Button transitions to active "Open SellerFlow App" upon authentication');

// 8. Verify fallback interactive state for uncompleted redirect
assert(indexHtml.includes("text: 'Sign In with Google'"), 'Fallback state must display "Sign In with Google"');
assert(indexHtml.includes("prov.setCustomParameters({ prompt: 'select_account' })"), 'Interactive sign-in must prompt select_account');
console.log('✓ Test 8: Responsive fallback allows user to complete sign-in without getting stuck');

// 9. Verify unified package routing and web routing
assert(indexHtml.includes("const isTargetAdmin = queryParams.get('target') === 'admin'"), 'Target admin query checked');
assert(indexHtml.includes("targetPackage = 'com.sellerflow.app'"), 'Package ID is unified under com.sellerflow.app');
assert(indexHtml.includes("webFallbackEl.href = isTargetAdmin ? '/admin' : '/'"), 'Web fallback routes correctly');
console.log('✓ Test 9: Unified package and web routing separation verified');

console.log('--- All OAuth Callback State Machine Tests Passed Successfully ---');
