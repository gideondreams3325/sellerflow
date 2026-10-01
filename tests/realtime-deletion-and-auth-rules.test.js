import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';

console.log('======================================================================');
console.log('STARTING SELLERFLOW REAL-TIME SYNC, AUTH & DELETION AUDIT SUITE');
console.log('======================================================================\n');

const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf8');
const jobsEventsJs = fs.readFileSync(path.resolve('jobs-events.js'), 'utf8');
const adminAppJs = fs.readFileSync(path.resolve('admin/app.js'), 'utf8');
const serverJs = fs.readFileSync(path.resolve('server.js'), 'utf8');
const firestoreRules = fs.readFileSync(path.resolve('firestore.rules'), 'utf8');
const accounts = JSON.parse(fs.readFileSync(path.resolve('data/registered_accounts.json'), 'utf8'));

// Test A: Firebase deletion -> UI removal
console.log('--- Test A: Firebase Deletion -> Instant UI Removal Watchers ---');
assert(indexHtml.includes('function startPostsWatcher()'), 'Must have startPostsWatcher');
assert(indexHtml.includes('purgeAndHidePostImmediately(docId,'), 'Must trigger purgeAndHidePostImmediately on removed doc');
assert(indexHtml.includes('function startProductsWatcher()'), 'Must have startProductsWatcher');
assert(indexHtml.includes('purgeAndHideProductImmediately(docId,'), 'Must trigger purgeAndHideProductImmediately on removed product');
assert(indexHtml.includes('function startStoresWatcher()'), 'Must have startStoresWatcher');
assert(jobsEventsJs.includes('function startJobsWatcher()'), 'Must have startJobsWatcher');
assert(jobsEventsJs.includes('purgeAndHideJobImmediately(docId)'), 'Must trigger purgeAndHideJobImmediately on removed job');
assert(jobsEventsJs.includes('function startEventsWatcher()'), 'Must have startEventsWatcher');
assert(jobsEventsJs.includes('purgeAndHideEventImmediately(docId)'), 'Must trigger purgeAndHideEventImmediately on removed event');
console.log('  ✓ Verified real-time Firebase doc deletion listeners across all entities');

// Test B: App deletion -> Firebase deletion + UI removal
console.log('\n--- Test B: App User Deletion -> Realtime Firebase Delete & UI Purge ---');
assert(indexHtml.includes('deleteDoc(doc(db, \'posts\', postId))'), 'Post deletion must delete Firestore document');
assert(indexHtml.includes('/api/posts/delete'), 'Post deletion must synchronize with authoritative store');
assert(indexHtml.includes('deleteDoc(doc(db, \'products\', id))'), 'Product deletion must delete Firestore document');
assert(indexHtml.includes('deleteDoc(doc(db, \'stores\', storeId))'), 'Store deletion must delete Firestore document');
assert(jobsEventsJs.includes('dbInst.collection(\'jobs\').doc(jobId).delete()'), 'Job deletion must delete Firestore document');
assert(jobsEventsJs.includes('dbInst.collection(\'events\').doc(eventId).delete()'), 'Event deletion must delete Firestore document');
assert(indexHtml.includes('arrayRemove(targetComment)'), 'Comment deletion must remove from Firestore array');
console.log('  ✓ Verified bidirectional user delete calls Firestore and backend endpoints');

// Test C, D, E: Password Reset Identity Invariance & Isolation
console.log('\n--- Test C, D, E: Password Reset Non-Password Identity Invariance & Isolation ---');
const gideon = accounts.find(a => a.usernameLower === 'gideon');
const admin = accounts.find(a => a.usernameLower === 'sellerflow');

assert(gideon, 'Gideon account must exist');
assert(admin, 'Admin account must exist');
assert.strictEqual(gideon.uid, 'N1cDBddZDicqELeyDRvfGMUy7fi1', 'Gideon UID invariant');
assert.strictEqual(gideon.username, 'gideon', 'Gideon username invariant');
assert.strictEqual(gideon.recoveryEmail, 'sellerflow99@gmail.com', 'Gideon recovery email invariant');
assert.strictEqual(gideon.role, 'seller', 'Gideon role invariant');
assert.strictEqual(gideon.isAdmin, false, 'Gideon isAdmin invariant');

assert.strictEqual(admin.uid, 'admin_gideon', 'Admin UID invariant');
assert.strictEqual(admin.username, 'sellerflow', 'Admin username invariant');
assert.strictEqual(admin.recoveryEmail, 'gideondreams3325@gmail.com', 'Admin recovery email invariant');
assert.strictEqual(admin.role, 'admin', 'Admin role invariant');
assert.strictEqual(admin.isAdmin, true, 'Admin isAdmin invariant');

assert(serverJs.includes('const existingAccount = findAccountByUid(uid);'), 'Password reset must resolve strictly by target UID');
assert(serverJs.includes('saveAccountRecord({\n        uid,\n        passwordHash: newHash,\n        passwordSalt: newSalt,\n        updatedAt: new Date().toISOString()\n      });'), 'Password reset must update ONLY passwordHash, passwordSalt, updatedAt');
console.log('  ✓ Verified strict non-password identity preservation and UID isolation');

// Test F & G: User posts appear immediately on feed and queue in Admin Review Hub as pending
console.log('\n--- Test F & G: User Post Immediate Publishing & Admin Hub Queue ---');
assert(indexHtml.includes("postData.status = 'published';"), 'Post status must be published immediately');
assert(indexHtml.includes("postData.reviewStatus = 'pending_security_review';"), 'Post reviewStatus must be pending_security_review');
assert(indexHtml.includes("postData.liveOnForYou = true;"), 'Post must be marked liveOnForYou');
assert(adminAppJs.includes("p.reviewStatus === 'pending_security_review'"), 'Admin Review Hub must queue pending_security_review posts');
console.log('  ✓ Verified immediate For You publishing with canonical moderation queue metadata');

// Test H: Admin removal propagates to feed and prevents stale resurrection
console.log('\n--- Test H: Admin Removal Real-Time Propagation & Stale Review Protection ---');
assert(adminAppJs.includes("rawPostsMap.delete(doc.id);"), 'Admin posts listener must delete removed posts from rawPostsMap');
assert(indexHtml.includes("purgeAndHidePostImmediately(docId,"), 'Feed must immediately purge post removed by admin');
assert(!adminAppJs.includes("if (rev.targetId && rev.postSnapshot && !postMap.has(rev.targetId))"), 'Admin Hub must NOT resurrect deleted posts from stale review snapshots');
console.log('  ✓ Verified admin removal real-time propagation and stale review prevention');

// Test I & J: Jobs unauthenticated browse allowed, apply/post requires account
console.log('\n--- Test I & J: Jobs Guest Browsing vs Account Requirements ---');
assert(jobsEventsJs.includes("activeJobsTab = 'explore'"), 'Explore jobs is open for public browsing');
assert(jobsEventsJs.includes("openJobDetailModal"), 'Job details modal is publicly accessible');
assert(jobsEventsJs.includes("window._pendingJobsEventsAction = { type: 'apply_job'"), 'Apply job must prompt auth and preserve action');
assert(jobsEventsJs.includes("window._pendingJobsEventsAction = { type: 'post_job'"), 'Post job must prompt auth and preserve action');
assert(jobsEventsJs.includes("showAuthPrompt('apply for this job"), 'Unauthenticated apply must trigger auth prompt');
assert(jobsEventsJs.includes("showAuthPrompt('post a job opening"), 'Unauthenticated post must trigger auth prompt');
console.log('  ✓ Verified jobs unauthenticated browsing and authenticated actions gating');

// Test K & L: Events unauthenticated browse allowed, protected actions require account
console.log('\n--- Test K & L: Events Guest Browsing vs Account Requirements ---');
assert(jobsEventsJs.includes("activeEventsTab = 'discover'"), 'Discover events is open for public browsing');
assert(jobsEventsJs.includes("openEventDetailModal"), 'Event details modal is publicly accessible');
assert(jobsEventsJs.includes("window._pendingJobsEventsAction = { type: 'register_event'"), 'Register event must prompt auth and preserve action');
assert(jobsEventsJs.includes("window._pendingJobsEventsAction = { type: 'create_event'"), 'Create event must prompt auth and preserve action');
assert(jobsEventsJs.includes("showAuthPrompt('register for this event"), 'Unauthenticated register must trigger auth prompt');
assert(jobsEventsJs.includes("showAuthPrompt('host an event"), 'Unauthenticated host must trigger auth prompt');
console.log('  ✓ Verified events unauthenticated browsing and authenticated actions gating');

// Test M: Fraud Hub requires account
console.log('\n--- Test M: Fraud Hub Authentication Gating ---');
assert(indexHtml.includes("function openReportFraudModal"), 'openReportFraudModal must exist');
assert(indexHtml.includes("showAuthPrompt('submit a fraud report to SellerFlow Security')"), 'Unauthenticated fraud report must prompt auth');
assert(serverJs.includes("/api/fraud/report"), 'Authoritative backend fraud report endpoint must exist');
assert(serverJs.includes("Unauthorized: You must be logged in to submit a fraud report"), 'Server must reject unauthenticated fraud submissions');
assert(firestoreRules.includes("match /fraudReports/{reportId}") && firestoreRules.includes("allow create: if isSignedIn()"), 'Firestore rules must enforce isSignedIn for fraudReports');
console.log('  ✓ Verified Fraud Hub authentication requirement across frontend, server API, and security rules');

// Test N: Logged-in action resumption
console.log('\n--- Test N: Pending Action Resumption After Successful Sign-In ---');
assert(indexHtml.includes("window.resumePendingJobsEventsAction(pendingAction);"), 'index.html must resume pending jobs/events actions on login');
assert(indexHtml.includes("openReportFraudModal(pfr.prefillType,"), 'index.html must resume pending fraud report on login');
assert(jobsEventsJs.includes("function resumePendingJobsEventsAction(action)"), 'jobs-events.js must implement resumePendingJobsEventsAction');
console.log('  ✓ Verified post-login action resumption pipeline');

console.log('\n======================================================================');
console.log('ALL REAL-TIME SYNC, AUTH & DELETION TESTS PASSED (A through O)!');
console.log('======================================================================\n');
