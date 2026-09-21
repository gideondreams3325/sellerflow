import assert from 'assert';
import {
  FEED_WEIGHTS,
  EVENT_TYPES,
  COMMERCE_CATEGORIES,
  extractPostCategories,
  createEmptyProfile,
  applyEventToProfile,
  isSafePost,
  filterCandidatePosts,
  calculatePostScore,
  applyDiversityReRanking,
  rankForYouPosts,
  FeedTelemetryBuffer
} from '../recommendation-engine.js';

console.log('--- Starting SellerFlow Personalized Discovery & Recommendation Test Suite ---');

// Test 1: Cold-start ranking returns valid, sorted feed for unauthenticated/new users
{
  console.log('Test 1: Cold-start ranking for unauthenticated users');
  const posts = [
    { id: 'p1', sellerId: 's1', status: 'published', createdAt: Date.now() - 3600000, likes: ['u1', 'u2'], views: 100 },
    { id: 'p2', sellerId: 's2', status: 'published', createdAt: Date.now() - 86400000 * 5, likes: [], views: 5 },
    { id: 'p3', sellerId: 's3', status: 'published', createdAt: Date.now() - 1800000, likes: ['u1', 'u2', 'u3', 'u4', 'u5'], views: 1200 }
  ];
  const ranked = rankForYouPosts(posts, null, null);
  assert(Array.isArray(ranked), 'Must return array');
  assert.strictEqual(ranked.length, 3, 'Must return all 3 valid posts');
  assert.strictEqual(ranked[0].id, 'p3', 'Highest engagement + fresh post must be ranked first');
  console.log('  ✓ Cold-start returns ranked candidates based on engagement, freshness and quality');
}

// Test 2: Category interest personalization boosts matching posts
{
  console.log('Test 2: Category interest personalization');
  const user = { uid: 'user_tech' };
  const profile = createEmptyProfile('user_tech');
  profile.interests['electronics'] = 0.95;
  profile.interests['fashion'] = 0.10;

  const techPost = { id: 'p_tech', sellerId: 's1', status: 'published', category: 'electronics', text: 'Brand new iPhone 15 Pro Max', createdAt: Date.now() - 3600000, likes: ['a'] };
  const fashionPost = { id: 'p_fashion', sellerId: 's2', status: 'published', category: 'fashion', text: 'Beautiful designer dress', createdAt: Date.now() - 3600000, likes: ['a'] };

  const scoreTech = calculatePostScore(techPost, user, profile);
  const scoreFashion = calculatePostScore(fashionPost, user, profile);

  assert(scoreTech.score > scoreFashion.score, 'Tech post must score significantly higher than fashion post for electronics user');
  assert(scoreTech.breakdown.interestMatchScore > 0.8, 'Interest match breakdown must reflect high affinity');
  console.log('  ✓ Personalization boosts posts matching user category interests');
}

// Test 3: Seller affinity boosts posts from followed or engaged creators
{
  console.log('Test 3: Seller affinity and creator following boost');
  const user = { uid: 'u1' };
  const profile = createEmptyProfile('u1');
  profile.sellerAffinity['seller_fave'] = 0.85;

  const faveSellerPost = { id: 'p_fav', sellerId: 'seller_fave', status: 'published', createdAt: Date.now() - 7200000 };
  const strangerPost = { id: 'p_other', sellerId: 'seller_stranger', status: 'published', createdAt: Date.now() - 7200000 };

  const scoreFav = calculatePostScore(faveSellerPost, user, profile, { following: ['seller_fave'] });
  const scoreOther = calculatePostScore(strangerPost, user, profile, { following: [] });

  assert(scoreFav.score > scoreOther.score, 'Post from followed/fave seller must rank higher');
  assert(scoreFav.breakdown.sellerAffinityScore > scoreOther.breakdown.sellerAffinityScore, 'Seller affinity score must be higher');
  console.log('  ✓ Seller affinity and follow status boost creator ranking');
}

// Test 4: High completion rate and watch-time positively boosts post score
{
  console.log('Test 4: Video completion and watch-time scoring');
  const user = { uid: 'u1' };
  const profile = createEmptyProfile('u1');

  const highCompPost = { id: 'v1', sellerId: 's1', status: 'published', isVideo: true, views: 1000, completions: 850, createdAt: Date.now() };
  const lowCompPost = { id: 'v2', sellerId: 's2', status: 'published', isVideo: true, views: 1000, completions: 50, createdAt: Date.now() };

  const scoreHigh = calculatePostScore(highCompPost, user, profile);
  const scoreLow = calculatePostScore(lowCompPost, user, profile);

  assert(scoreHigh.breakdown.watchTimeScore > scoreLow.breakdown.watchTimeScore, 'High completion rate video must have higher watch time score');
  assert(scoreHigh.score > scoreLow.score, 'High completion video must have higher total score');
  console.log('  ✓ Video completion and watch-time quality positively boosts score');
}

// Test 5: Fast swipe away (< 1.5s) records SWIPE_AWAY and applies category skip penalty
{
  console.log('Test 5: SWIPE_AWAY signal and negative category penalty');
  const profile = createEmptyProfile('u1');
  profile.interests['footwear'] = 0.5;

  const post = { id: 'p_shoe', sellerId: 's1', category: 'footwear', text: 'Sneakers in Accra' };
  const swipeEvent = {
    userId: 'u1',
    postId: 'p_shoe',
    eventType: EVENT_TYPES.SWIPE_AWAY,
    duration: 0.8,
    watchRatio: 0.05
  };

  applyEventToProfile(profile, swipeEvent, post);
  assert.strictEqual(profile.categoryPenalties['footwear'], 1, 'Category penalty must increment on skip');
  assert(profile.interests['footwear'] < 0.5, 'Category interest must be reduced after quick skip');
  assert.strictEqual(profile.stats.totalSkips, 1, 'Total skips counter incremented');
  console.log('  ✓ Quick swipe away applies category skip penalty and decreases interest');
}

// Test 6: Explicit NOT_INTERESTED excludes post completely and penalizes category/seller
{
  console.log('Test 6: Explicit NOT_INTERESTED handling');
  const profile = createEmptyProfile('u1');
  profile.interests['beauty'] = 0.6;

  const post = { id: 'p_wig', sellerId: 's_wig', category: 'beauty', text: 'Human hair wig lace frontal' };
  const event = {
    userId: 'u1',
    postId: 'p_wig',
    eventType: EVENT_TYPES.NOT_INTERESTED
  };

  applyEventToProfile(profile, event, post);
  assert(profile.hiddenPostIds.includes('p_wig'), 'Post must be in hiddenPostIds');
  assert(profile.interests['beauty'] < 0.3, 'Beauty interest must be heavily degraded');
  assert((profile.categoryPenalties['beauty'] || 0) >= 3, 'Category penalty must increase by at least 3');

  const filtered = filterCandidatePosts([post], { uid: 'u1' }, profile);
  assert.strictEqual(filtered.length, 0, 'Post must be excluded from candidate pool');
  console.log('  ✓ Explicit NOT_INTERESTED excludes post and updates profile penalties');
}

// Test 7: Explicit REPORT excludes post completely with safety penalty
{
  console.log('Test 7: Explicit REPORT handling');
  const profile = createEmptyProfile('u1');
  const post = { id: 'p_scam', sellerId: 's_bad', category: 'electronics', text: 'Suspicious phone' };
  applyEventToProfile(profile, { userId: 'u1', postId: 'p_scam', eventType: EVENT_TYPES.REPORT }, post);

  assert(profile.hiddenPostIds.includes('p_scam'), 'Reported post must be added to hiddenPostIds');
  const filtered = filterCandidatePosts([post], { uid: 'u1' }, profile);
  assert.strictEqual(filtered.length, 0, 'Reported post must not appear in candidate pool');
  console.log('  ✓ Explicit REPORT excludes post and applies safety penalties');
}

// Test 8: Freshness decay applies time-based attenuation to older posts
{
  console.log('Test 8: Freshness decay over time');
  const now = Date.now();
  const freshPost = { id: 'fresh', sellerId: 's1', status: 'published', createdAt: now - (2 * 3600000) }; // 2 hours old
  const oldPost = { id: 'old', sellerId: 's2', status: 'published', createdAt: now - (14 * 24 * 3600000) }; // 14 days old

  const scoreFresh = calculatePostScore(freshPost, null, null, { now });
  const scoreOld = calculatePostScore(oldPost, null, null, { now });

  assert(scoreFresh.breakdown.freshnessScore > scoreOld.breakdown.freshnessScore, 'Fresh post must have higher freshness score');
  assert(scoreFresh.score > scoreOld.score, 'Fresh post must outrank identical older post');
  console.log('  ✓ Freshness decay attenuates older content appropriately');
}

// Test 9: Creator quality & verified seller badges boost ranking
{
  console.log('Test 9: Creator quality and verification badge boost');
  const verifiedPost = { id: 'p_ver', sellerId: 's_ver', status: 'published', createdAt: Date.now() };
  const unverifiedPost = { id: 'p_unver', sellerId: 's_unver', status: 'published', createdAt: Date.now() };

  const context = {
    sellerProfiles: {
      s_ver: { verified: true, hasBusinessCert: true },
      s_unver: { verified: false }
    }
  };

  const scoreVer = calculatePostScore(verifiedPost, null, null, context);
  const scoreUnver = calculatePostScore(unverifiedPost, null, null, context);

  assert(scoreVer.breakdown.creatorQualityScore > scoreUnver.breakdown.creatorQualityScore, 'Verified creator must have higher quality score');
  assert(scoreVer.score > scoreUnver.score, 'Verified creator post must outrank unverified post');
  console.log('  ✓ Creator trust and registered business verification boost ranking');
}

// Test 10: In-session seen post repetition penalty avoids immediate duplicates
{
  console.log('Test 10: In-session repetition penalty');
  const post = { id: 'seen_1', sellerId: 's1', status: 'published', createdAt: Date.now() };
  const unseenPost = { id: 'unseen_1', sellerId: 's2', status: 'published', createdAt: Date.now() };

  const contextWithSeen = {
    seenPostIds: new Set(['seen_1'])
  };

  const scoreSeen = calculatePostScore(post, null, null, contextWithSeen);
  const scoreUnseen = calculatePostScore(unseenPost, null, null, contextWithSeen);

  assert.strictEqual(scoreSeen.breakdown.repetitionPenalty, 1.0, 'Seen post must incur full repetition penalty');
  assert.strictEqual(scoreUnseen.breakdown.repetitionPenalty, 0, 'Unseen post must incur zero repetition penalty');
  assert(scoreUnseen.score > scoreSeen.score, 'Unseen post must score higher than already seen post');
  console.log('  ✓ In-session repetition penalty prevents immediate re-showing of seen posts');
}

// Test 11: Diversity re-ranking prevents adjacent consecutive posts from same seller
{
  console.log('Test 11: Diversity re-ranking (seller spacing)');
  const scoredPosts = [
    { post: { id: 'p1', sellerId: 'seller_A', category: 'electronics' }, score: 95 },
    { post: { id: 'p2', sellerId: 'seller_A', category: 'electronics' }, score: 90 },
    { post: { id: 'p3', sellerId: 'seller_B', category: 'fashion' }, score: 85 },
    { post: { id: 'p4', sellerId: 'seller_C', category: 'footwear' }, score: 80 }
  ];

  const reranked = applyDiversityReRanking(scoredPosts);
  assert.strictEqual(reranked.length, 4, 'All posts must be preserved');
  assert.strictEqual(reranked[0].sellerId, 'seller_A', 'Top post remains first');
  assert.notStrictEqual(reranked[1].sellerId, 'seller_A', 'Second post must not be from seller_A');
  assert.strictEqual(reranked[1].sellerId, 'seller_B', 'Second post must be from seller_B for diversity');
  console.log('  ✓ Diversity re-ranking separates consecutive posts from the same creator');
}

// Test 12: Product/Shopping engagement (ADD_TO_CART, PRODUCT_OPEN) boosts related commerce posts
{
  console.log('Test 12: Commerce & shopping intent signals');
  const user = { uid: 'shopper_1' };
  const profile = createEmptyProfile('shopper_1');

  // User adds phone case to cart
  const cartEvent = {
    userId: 'shopper_1',
    eventType: EVENT_TYPES.ADD_TO_CART,
    sellerId: 's_tech'
  };
  const phonePost = { id: 'prod_1', sellerId: 's_tech', category: 'electronics', text: 'MagSafe case for iPhone', productId: 'item_1' };
  applyEventToProfile(profile, cartEvent, phonePost);

  assert(profile.interests['electronics'] >= 0.30, 'Electronics interest must increase on add to cart');
  assert(profile.sellerAffinity['s_tech'] >= 0.30, 'Seller affinity must increase on add to cart');

  const score = calculatePostScore(phonePost, user, profile);
  assert.strictEqual(score.breakdown.commerceScore, 1.0, 'Commerce score must be maximized when matching shopping intent');
  console.log('  ✓ Shopping events (ADD_TO_CART, PRODUCT_OPEN) boost commerce post relevance');
}

// Test 13: Search terms boost corresponding category interests
{
  console.log('Test 13: Search query interest expansion');
  const profile = createEmptyProfile('searcher_1');
  const searchEvent = {
    userId: 'searcher_1',
    eventType: EVENT_TYPES.SEARCH,
    searchTerm: 'affordable nike sneakers and kicks in kumasi'
  };

  applyEventToProfile(profile, searchEvent);
  assert(profile.interests['footwear'] >= 0.25, 'Footwear interest must be boosted by sneaker search');
  assert(profile.recentSearches.includes('affordable nike sneakers and kicks in kumasi'), 'Query saved in recent searches');
  console.log('  ✓ Search terms expand relevant category interest weights');
}

// Test 14: Batching/debouncing prevents excessive Firestore event writes
{
  console.log('Test 14: Telemetry batching and debouncing');
  let flushCalls = 0;
  let flushedEventCount = 0;

  const flushFn = async (batch) => {
    flushCalls++;
    flushedEventCount += batch.length;
  };

  const buffer = new FeedTelemetryBuffer(flushFn, { flushIntervalMs: 100, maxBatchSize: 5 });

  // Push 4 events (under maxBatchSize)
  buffer.push({ userId: 'u1', eventType: EVENT_TYPES.VIEW_START });
  buffer.push({ userId: 'u1', eventType: EVENT_TYPES.LIKE });
  buffer.push({ userId: 'u1', eventType: EVENT_TYPES.VIEW_DURATION, duration: 4.5 });
  buffer.push({ userId: 'u1', eventType: EVENT_TYPES.SAVE });

  assert.strictEqual(flushCalls, 0, 'Must not flush immediately when under batch limit');

  // Push 5th event -> triggers batch flush
  buffer.push({ userId: 'u1', eventType: EVENT_TYPES.COMMENT });
  assert.strictEqual(flushCalls, 1, 'Batch flush must trigger at maxBatchSize');
  assert.strictEqual(flushedEventCount, 5, 'All 5 events must be flushed in a single batch');
  console.log('  ✓ Telemetry buffer debounces and batches writes to avoid overload');
}

// Test 15: Multi-tenant privacy: user A cannot access or overwrite user B's feed profile
{
  console.log('Test 15: Multi-tenant user privacy boundary');
  const profileA = createEmptyProfile('user_AAA');
  const profileB = createEmptyProfile('user_BBB');

  applyEventToProfile(profileA, { userId: 'user_AAA', eventType: EVENT_TYPES.LIKE }, { category: 'electronics' });

  assert(profileA.interests['electronics'] > 0, 'Profile A must record interest');
  assert.strictEqual(profileB.interests['electronics'], undefined, 'Profile B must remain completely unaffected');
  assert.strictEqual(profileA.userId, 'user_AAA');
  assert.strictEqual(profileB.userId, 'user_BBB');
  console.log('  ✓ Multi-tenant scoping guarantees user profile separation');
}

// Test 16: Inactive/hidden/violation and user-deleted posts are strictly excluded from candidates
{
  console.log('Test 16: Exclusion of hidden, unapproved, violation, and user-deleted posts');
  const posts = [
    { id: 'p_ok', sellerId: 's1', status: 'published', safeContent: false },
    { id: 'p_hidden', sellerId: 's1', status: 'hidden' },
    { id: 'p_viol', sellerId: 's1', status: 'published', reviewStatus: 'violation' },
    { id: 'p_draft', sellerId: 's1', status: 'draft' },
    { id: 'p_unsafe', sellerId: 's1', status: 'published', text: 'Free momo money flip scam' },
    { id: 'p_user_deleted', sellerId: 's1', status: 'published', isDeleted: true },
    { id: 'p_user_removed', sellerId: 's1', status: 'removed' },
    { id: 'p_user_takedown', sellerId: 's1', status: 'published', removedAt: Date.now() }
  ];

  const eligible = filterCandidatePosts(posts, { uid: 'u1' }, createEmptyProfile('u1'));
  assert.strictEqual(eligible.length, 1, 'Only p_ok must pass candidate filter');
  assert.strictEqual(eligible[0].id, 'p_ok');
  console.log('  ✓ Filter strictly blocks hidden, unapproved, violation, and user-deleted posts');
}

// Test 17: Post privacy rules (followers-only vs private vs public) are strictly respected
{
  console.log('Test 17: Post privacy visibility boundaries');
  const posts = [
    { id: 'p_pub', sellerId: 's_creator', status: 'published', privacy: 'public' },
    { id: 'p_priv', sellerId: 's_creator', status: 'published', privacy: 'private' },
    { id: 'p_foll', sellerId: 's_creator', status: 'published', privacy: 'followers' }
  ];

  // Case A: Anonymous stranger (not following, not owner)
  const anonymousFeed = filterCandidatePosts(posts, null, null, { following: [] });
  assert.strictEqual(anonymousFeed.length, 1, 'Anonymous user must only see public post');
  assert.strictEqual(anonymousFeed[0].id, 'p_pub');

  // Case B: Follower user (following creator)
  const followerFeed = filterCandidatePosts(posts, { uid: 'u_follower' }, null, { following: ['s_creator'] });
  assert.strictEqual(followerFeed.length, 2, 'Follower must see public and followers-only posts');
  assert(followerFeed.some(p => p.id === 'p_foll'));
  assert(!followerFeed.some(p => p.id === 'p_priv'));

  // Case C: The creator themselves
  const creatorFeed = filterCandidatePosts(posts, { uid: 's_creator' }, null, { following: [] });
  assert.strictEqual(creatorFeed.length, 3, 'Creator must see all their own posts (including private)');
  console.log('  ✓ Post privacy enforcement matches public, followers-only, and private scopes');
}

// Test 18: Graceful offline/error fallback: algorithm defaults safely without crashing
{
  console.log('Test 18: Graceful error resilience and fail-safe operation');
  // Pass malformed or unexpected data
  const brokenPosts = [
    null,
    undefined,
    {},
    { id: 'p_valid', sellerId: 's1', status: 'published', createdAt: 'not a date' }
  ];

  let result = null;
  assert.doesNotThrow(() => {
    result = rankForYouPosts(brokenPosts, null, null);
  }, 'Must never throw on malformed candidate items');

  assert(Array.isArray(result), 'Must return empty or valid list');
  assert.strictEqual(result.length, 1, 'Must successfully extract valid post');
  assert.strictEqual(result[0].id, 'p_valid');
  console.log('  ✓ Recommendation pipeline fails open gracefully without crashing');
}

console.log('--- All 18 Recommendation Engine Verification Tests Passed Successfully ---');
