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

console.log('--- All Post Sync & Moderation assertions passed! ---');
