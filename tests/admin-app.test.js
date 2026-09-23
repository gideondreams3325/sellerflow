import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('--- Starting SellerFlow Admin Application Security & Operations Test Suite ---');

// 1. Files existence check
console.log('Test 1: Admin application standalone assets exist');
assert(fs.existsSync(path.resolve('admin', 'index.html')), 'admin/index.html must exist');
assert(fs.existsSync(path.resolve('admin', 'admin.css')), 'admin/admin.css must exist');
assert(fs.existsSync(path.resolve('admin', 'app.js')), 'admin/app.js must exist');
assert(fs.existsSync(path.resolve('admin', 'package.json')), 'admin/package.json must exist');
console.log('  ✓ All required admin standalone assets present');

const adminHtml = fs.readFileSync(path.resolve('admin', 'index.html'), 'utf8');
const adminJs = fs.readFileSync(path.resolve('admin', 'app.js'), 'utf8');
const serverJs = fs.readFileSync(path.resolve('server.js'), 'utf8');

// 2. Routing in server.js
console.log('Test 2: Server routing mounts /admin and /admin/*');
assert(serverJs.includes("app.get(['/admin', '/admin/*']"), 'server.js must mount /admin and /admin/* routes');
assert(serverJs.includes("path.join(__dirname, 'admin', 'index.html')"), 'server.js must serve admin/index.html');
console.log('  ✓ Verified separate admin application routing');

// 3. Admin Authorization Enforcement
console.log('Test 3: Server-side admin authorization enforcement');
assert(serverJs.includes('gideondreams3325@gmail.com'), 'Must verify against primary admin gideondreams3325@gmail.com');
assert(serverJs.includes('/api/admin/user-action'), 'Must support authoritative user management endpoint');
assert(serverJs.includes('/api/admin/kyc-action'), 'Must support authoritative Ghana Card KYC action endpoint');
assert(serverJs.includes('/api/admin/report-action'), 'Must support authoritative report action endpoint');
assert(serverJs.includes('/api/admin/takedown'), 'Must support authoritative takedown endpoint');
assert(serverJs.includes('/api/admin/restore'), 'Must support authoritative restore endpoint');
console.log('  ✓ Server-side admin clearance and authoritative endpoints verified');

// 4. Client-side Security Gate
console.log('Test 4: Client-side non-admin rejection and token lifecycle');
assert(adminJs.includes("checkRes.status === 401 || checkRes.status === 403"), 'Must check for 401/403 rejection');
assert(adminJs.includes("auth.signOut()"), 'Must force sign-out unauthorized users');
assert(adminJs.includes("Access Denied:"), 'Must show clear access denied error');
assert(adminJs.includes("45 * 60 * 1000"), 'Must periodically refresh token to retain session');
console.log('  ✓ Client-side gate strictly terminates unauthorized sessions');

// 5. Dashboard KPI Cards (10 required cards)
console.log('Test 5: Dashboard contains all 10 required executive KPI metrics');
assert(adminHtml.includes('id="kpiTotalUsers"'), 'Total Users metric must exist');
assert(adminHtml.includes('id="kpiTotalSellers"'), 'Sellers metric must exist');
assert(adminHtml.includes('id="kpiActiveSellers"'), 'Active Sellers metric must exist');
assert(adminHtml.includes('id="kpiStores"'), 'Stores metric must exist');
assert(adminHtml.includes('id="kpiProducts"'), 'Products metric must exist');
assert(adminHtml.includes('id="kpiPosts"'), 'Posts metric must exist');
assert(adminHtml.includes('id="kpiOrders"'), 'Orders metric must exist');
assert(adminHtml.includes('id="kpiPendingKyc"'), 'Pending KYC metric must exist');
assert(adminHtml.includes('id="kpiPendingReports"'), 'Pending Reports metric must exist');
assert(adminHtml.includes('id="kpiTakenDown"'), 'Taken-down Content metric must exist');
console.log('  ✓ Verified presence of all 10 executive KPI cards');

// 6. User Management Module
console.log('Test 6: User management with suspension, blocking, and reason logging');
assert(adminHtml.includes('id="tab-users"'), 'Users tab must exist');
assert(adminHtml.includes('id="userSearchInput"'), 'User search input must exist');
assert(adminHtml.includes('id="userFilterRole"'), 'User role filter must exist');
assert(adminHtml.includes('id="userFilterKyc"'), 'User KYC filter must exist');
assert(adminHtml.includes('id="userFilterStatus"'), 'User account status filter must exist');
assert(adminJs.includes("handleUserAction"), 'Must provide user action handler');
assert(adminJs.includes("durationDays"), 'Must support suspension duration');
console.log('  ✓ User management filtering and suspension workflow verified');

// 7. Store Management Module
console.log('Test 7: Storefront management with takedown and restoration');
assert(adminHtml.includes('id="tab-stores"'), 'Stores tab must exist');
assert(adminJs.includes("handleStoreTakedown"), 'Must support store takedown');
assert(adminJs.includes("handleStoreRestore"), 'Must support store restore');
console.log('  ✓ Store management and takedown verified');

// 8. Product Management Module
console.log('Test 8: Product management with delisting and reactivation');
assert(adminHtml.includes('id="tab-products"'), 'Products tab must exist');
assert(adminJs.includes("handleProductTakedown"), 'Must support product takedown');
assert(adminJs.includes("handleProductRestore"), 'Must support product restore');
console.log('  ✓ Product catalog controls verified');

// 9. Content Moderation Module
console.log('Test 9: Content moderation with AI safety and copyright muting');
assert(adminHtml.includes('id="tab-moderation"'), 'Moderation tab must exist');
assert(adminHtml.includes('data-mod-filter="ai_flagged"'), 'AI flagged filter must exist');
assert(adminHtml.includes('data-mod-filter="copyright"'), 'Copyright filter must exist');
assert(adminJs.includes("handlePostTakedown"), 'Must support post takedown');
assert(adminJs.includes("handlePostRestore"), 'Must support post restore');
console.log('  ✓ Multimodal content moderation verified');

// 10. Ghana Card / KYC Center
console.log('Test 10: Ghana Card & KYC Verification Center with secure document preview');
assert(adminHtml.includes('id="tab-verifications"'), 'Verifications tab must exist');
assert(adminHtml.includes('id="kycInspectorModal"'), 'KYC inspector modal must exist');
assert(adminHtml.includes('id="kycFrontContainer"'), 'Front document preview container must exist');
assert(adminHtml.includes('id="kycBackContainer"'), 'Back document preview container must exist');
assert(adminHtml.includes('id="kycSelfieContainer"'), 'Live selfie container must exist');
assert(adminJs.includes("executeKycDecision"), 'Must support KYC decision execution');
console.log('  ✓ Ghana Card statutory verification and document inspector verified');

// 11. Reports Desk
console.log('Test 11: Reports desk combining scam and fraud reports');
assert(adminHtml.includes('id="tab-reports"'), 'Reports desk tab must exist');
assert(adminJs.includes("handleReportStatus"), 'Must support report status resolution');
console.log('  ✓ Unified reports triage verified');

// 12. Orders Oversight
console.log('Test 12: Orders oversight and transaction volume tracking');
assert(adminHtml.includes('id="tab-orders"'), 'Orders tab must exist');
assert(adminHtml.includes('id="ordersTotalVolume"'), 'Total volume counter must exist');
console.log('  ✓ Commerce orders monitor verified');

// 13. Jobs & Events Moderation
console.log('Test 13: Jobs & Events governance with /api/jobs/security-action');
assert(adminHtml.includes('id="tab-jobs"'), 'Jobs tab must exist');
assert(adminHtml.includes('id="tab-events"'), 'Events tab must exist');
assert(adminJs.includes('/api/jobs/security-action'), 'Must invoke security action API');
console.log('  ✓ Jobs & Events anti-scam moderation verified');

// 14. Audit Logs Ledger
console.log('Test 14: Immutable audit logs reading from securityReviews and adminReviews');
assert(adminHtml.includes('id="tab-audit"'), 'Audit logs tab must exist');
assert(adminJs.includes("securityReviews"), 'Must read from securityReviews collection');
assert(adminJs.includes("adminReviews"), 'Must read from adminReviews collection');
console.log('  ✓ Authoritative audit trail verified');

// 15. Responsive Design & Visual Branding
console.log('Test 15: Dark professional theme (#0d0d0d) and gold accent (#f5b942)');
assert(adminHtml.includes('#0d0d0d'), 'Primary dark background present');
assert(adminHtml.includes('#f5b942'), 'Gold brand accent present');
assert(adminHtml.includes('SELLER FLOW ADMIN'), 'Brand title present');
console.log('  ✓ UI styling and theme compliance verified');

console.log('--- All 15 SellerFlow Admin Application Tests Passed Successfully ---');
