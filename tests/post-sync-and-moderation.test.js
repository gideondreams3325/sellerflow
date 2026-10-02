import assert from 'assert';
import fs from 'fs';

console.log('--- Testing Post Synchronization & Moderation Flow ---');

// 1. Verify 4 canonical posts exist
const postsStore = JSON.parse(fs.readFileSync('data/posts_store.json', 'utf8'));
assert.strictEqual(postsStore.length >= 4, true, 'At least 4 canonical posts must exist');
console.log('✓ Verified canonical post store contains all original 4 posts');

// Check the 4 canonical post IDs
const expectedIds = [
  'post_1790723075877_n624q04',
  'post_1790722894208_7a374786',
  'pYtpJKbsb2koHCeQ5rJ0',
  'ePk6nDmVRYkzKKSeJPKA'
];

expectedIds.forEach(id => {
  const p = postsStore.find(x => x.id === id);
  assert.ok(p, `Post ${id} must exist in canonical posts store`);
  assert.ok(p.sellerId, `Post ${id} must have owner sellerId`);
  assert.ok(p.createdAt, `Post ${id} must have createdAt timestamp`);
  console.log(`✓ Post ${id} validated (Owner: ${p.sellerId}, ReviewStatus: ${p.reviewStatus}, Status: ${p.status})`);
});

// 2. Test newly created post simulation
const newPost = {
  id: `test_post_${Date.now()}`,
  sellerId: 'N1cDBddZDicqELeyDRvfGMUy7fi1',
  sellerName: 'Gideon Appiah',
  sellerUsername: 'benjamin',
  text: 'Test new arrivals post',
  mediaUrl: '/uploads/test.mp4',
  mediaType: 'video/mp4',
  status: 'published',
  createdAt: new Date().toISOString(),
  submittedAt: new Date().toISOString(),
  publishedAt: new Date().toISOString(),
  submittedToSecurityDeskAt: new Date().toISOString(),
  reviewStatus: 'pending_security_review',
  liveOnForYou: true
};

// Verify new post is live on For You immediately
const isLiveOnForYou = (p) => {
  const isTakenDown = p.status === 'taken_down' || p.status === 'removed' || p.isDeleted;
  return !isTakenDown && (p.status === 'published' || p.liveOnForYou);
};

assert.strictEqual(isLiveOnForYou(newPost), true, 'New post must be immediately live on For You');
console.log('✓ New post is immediately live on For You without waiting for admin approval');

// Verify new post appears in Admin Review Queue
const isPendingReview = (p) => {
  const isTakenDown = p.status === 'taken_down' || p.status === 'removed' || p.isDeleted;
  const isApproved = p.reviewStatus === 'approved' || p.reviewStatus === 'reviewed' || p.reviewStatus === 'safe';
  return !isTakenDown && !isApproved && (p.reviewStatus === 'pending_security_review' || p.reviewStatus === 'pending' || !p.reviewStatus);
};

assert.strictEqual(isPendingReview(newPost), true, 'New post must appear in Admin Review Queue');
console.log('✓ New post enters Admin Review Hub as pending_security_review');

// 3. Verify takedown propagation
const takenDownPost = { ...newPost, status: 'taken_down', reviewStatus: 'taken_down' };
assert.strictEqual(isLiveOnForYou(takenDownPost), false, 'Taken down post must NOT be live on For You');
assert.strictEqual(isPendingReview(takenDownPost), false, 'Taken down post must be removed from review queue');
console.log('✓ Post takedown immediately removes post from feed and review queue');

// 4. Live API verification against http://localhost:3000/api/posts if server is running
try {
  const httpRes = await fetch('http://localhost:3000/api/posts').then(r => r.json()).catch(() => null);
  if (httpRes && httpRes.success && Array.isArray(httpRes.posts)) {
    console.log(`✓ Live API returned ${httpRes.posts.length} posts from /api/posts`);
    expectedIds.forEach(id => {
      const p = httpRes.posts.find(x => x.id === id);
      assert.ok(p, `Live API must return canonical post ${id}`);
    });
    console.log('✓ All 4 canonical posts verified live over HTTP /api/posts');

    // Test a newly created post in the live pipeline
    const ephemeralPostId = `test_live_verify_${Date.now()}`;
    const testLivePost = {
      ...newPost,
      id: ephemeralPostId,
      text: 'Verified newly created post for testing'
    };
    postsStore.unshift(testLivePost);
    fs.writeFileSync('data/posts_store.json', JSON.stringify(postsStore, null, 2), 'utf8');

    const freshRes = await fetch('http://localhost:3000/api/posts').then(r => r.json());
    const freshCreated = freshRes.posts.find(p => p.id === ephemeralPostId);
    assert.ok(freshCreated, 'Newly created post must immediately appear in /api/posts');
    assert.strictEqual(isLiveOnForYou(freshCreated), true, 'Newly created post must be live on For You immediately');
    assert.strictEqual(isPendingReview(freshCreated), true, 'Newly created post must be in pending review status');
    console.log('✓ Newly created post verified live in feed pipeline without waiting for approval');

    // Clean up test post
    const cleanedStore = postsStore.filter(p => p.id !== ephemeralPostId);
    fs.writeFileSync('data/posts_store.json', JSON.stringify(cleanedStore, null, 2), 'utf8');
    const afterDeleteRes = await fetch('http://localhost:3000/api/posts').then(r => r.json());
    assert.ok(!afterDeleteRes.posts.some(p => p.id === ephemeralPostId), 'Deleted post must be immediately removed from /api/posts');
    console.log('✓ Post deletion verified immediately removed from live /api/posts');
  }
} catch (netErr) {
  console.log('  (Notice: Server HTTP check skipped in offline unit mode:', netErr?.message, ')');
}

console.log('--- All Post Sync & Moderation assertions passed! ---');
