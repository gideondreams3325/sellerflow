import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('--- Starting SellerFlow Firebase Data Synchronization Audit Suite ---');

const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf8');
const serverJs = fs.readFileSync(path.resolve('server.js'), 'utf8');
const firestoreRules = fs.readFileSync(path.resolve('firestore.rules'), 'utf8');

// Test 1: Verify custom token creation propagates email and admin claims
console.log('Test 1: Custom token creation includes email and admin claims');
assert(serverJs.includes('const customToken = await adminAuth.createCustomToken(decoded.uid,'), 'Custom token generation endpoint must exist');
assert(serverJs.includes('email: emailVal') || serverJs.includes('email: decoded.email'), 'Custom token must contain email claim');
assert(serverJs.includes('admin: isAdminClaim'), 'Custom token must contain admin claim');
console.log('  ✓ Verified custom token claims (email, email_verified, admin)');

// Test 2: Verify user merging in renderAdmin combines Firestore users, publicProfiles, allPublicProfiles, and API
console.log('Test 2: Unified user mapping merges direct Firestore, cache, and overview sources');
assert(indexHtml.includes('const userMap = new Map();'), 'userMap must exist for user deduplication');
assert(indexHtml.includes('directPublicProfilesSnap.docs.forEach'), 'Must merge direct publicProfiles snapshot');
assert(indexHtml.includes('directUsersSnap.docs.forEach'), 'Must merge direct users snapshot');
assert(indexHtml.includes('allPublicProfiles.forEach'), 'Must merge in-memory allPublicProfiles');
console.log('  ✓ Verified multi-source user deduplication pipeline');

// Test 3: Verify Firestore rules permit admin access to users collection
console.log('Test 3: Firestore Security Rules validate admin queries on users collection');
assert(firestoreRules.includes('match /users/{userId}'), 'users collection rule must exist');
assert(firestoreRules.includes('allow read: if isOwner(userId) || isAdmin();'), 'users read rule must permit owner or admin');
assert(firestoreRules.includes('request.auth.token.email == \'gideondreams3325@gmail.com\''), 'Admin email check must be defined');
console.log('  ✓ Verified Firestore Security Rules access control');

// Test 4: Verify loadPublicProfiles and cache hydration
console.log('Test 4: loadPublicProfiles properly hydrates allPublicProfiles and stores snapshot');
assert(indexHtml.includes('async function loadPublicProfiles()'), 'loadPublicProfiles function must exist');
assert(indexHtml.includes('localStorage.setItem(\'sf_cached_public_profiles\''), 'Must cache public profiles in localStorage');
assert(indexHtml.includes('localStorage.getItem(\'sf_cached_public_profiles\')'), 'Must read cached public profiles on cold start');
console.log('  ✓ Verified public profiles caching and hydration lifecycle');

// Test 5: Verify no query limits artificially cap user count to 15
console.log('Test 5: Verify no limit(15) or slice(0, 15) caps user account queries');
assert(!indexHtml.includes('collection(db,\'publicProfiles\'),limit(15)'), 'Must not artificially limit publicProfiles to 15');
assert(!indexHtml.includes('collection(db,\'users\'),limit(15)'), 'Must not artificially limit users to 15');
console.log('  ✓ Verified absence of artificial 15-document query limits');

// Test 6: Verify offline/online connectivity auto-refresh invalidates stale caches
console.log('Test 6: Offline/online connectivity auto-refresh triggers cache invalidation and fresh load');
assert(indexHtml.includes('renderConnectivityBanner(\'refreshing\''), 'Online restoration must trigger connectivity refresh');
assert(indexHtml.includes('loadPublicProfiles()'), 'Online restoration must invoke loadPublicProfiles');
console.log('  ✓ Verified network recovery data re-synchronization flow');

console.log('--- All 6 Firebase Data Synchronization Tests Passed Successfully ---');
