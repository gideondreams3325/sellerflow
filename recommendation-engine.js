/**
 * SellerFlow Personalized "For You" Discovery & Recommendation Engine
 * 
 * Implements a weighted, multi-factor ranking system that balances:
 * - Personalization (category & keyword interest matching)
 * - Seller Affinity (creator following and past interactions)
 * - Watch-Time & Completion Signals
 * - Baseline Social Engagement (likes, comments, saves, shares, views)
 * - Freshness Decay (recency half-life)
 * - Commerce & Product Relevance
 * - Creator Trust & Verification Quality
 * - Serendipity / Exploration (preventing filter bubbles)
 * - Negative Feedback (fast swipe penalties, explicit not-interested, reports)
 * - Strict Diversity Re-Ranking (spacing constraints for sellers & categories)
 * - Cold Start Handling (unauthenticated or new user discovery)
 */

export const FEED_WEIGHTS = {
  interestMatch: 35,       // user category/keyword alignment
  sellerAffinity: 25,      // followed or frequently interacted seller
  watchTime: 18,           // historical watch time & completion signals
  completion: 14,          // video completion rate
  engagement: 20,          // post baseline engagement (likes, comments, saves, shares)
  freshness: 22,           // recency decay
  productRelevance: 16,    // commerce / shoppable relevance
  creatorQuality: 10,      // verified seller, registered business badge
  exploration: 12,         // novelty / discovery bonus for unseen categories
  skipPenalty: -25,        // category skip penalty
  notInterestedPenalty: -100, // explicit not interested
  repetitionPenalty: -45   // seen in current session
};

export const EVENT_TYPES = {
  VIEW_START: 'VIEW_START',
  VIEW_DURATION: 'VIEW_DURATION',
  VIDEO_COMPLETED: 'VIDEO_COMPLETED',
  VIDEO_REWATCH: 'VIDEO_REWATCH',
  SWIPE_AWAY: 'SWIPE_AWAY',
  LIKE: 'LIKE',
  UNLIKE: 'UNLIKE',
  COMMENT: 'COMMENT',
  SAVE: 'SAVE',
  UNSAVE: 'UNSAVE',
  SHARE: 'SHARE',
  FOLLOW: 'FOLLOW',
  UNFOLLOW: 'UNFOLLOW',
  PRODUCT_OPEN: 'PRODUCT_OPEN',
  STORE_OPEN: 'STORE_OPEN',
  PROFILE_OPEN: 'PROFILE_OPEN',
  SEARCH: 'SEARCH',
  ADD_TO_CART: 'ADD_TO_CART',
  PURCHASE: 'PURCHASE',
  NOT_INTERESTED: 'NOT_INTERESTED',
  REPORT: 'REPORT'
};

export const COMMERCE_CATEGORIES = [
  'electronics',
  'fashion',
  'footwear',
  'beauty',
  'jewelry',
  'food',
  'home',
  'automotive',
  'services'
];

// Keyword taxonomy mapping for Ghanaian commerce & lifestyle terms
const CATEGORY_KEYWORDS = {
  electronics: ['phone', 'iphone', 'samsung', 'pixel', 'android', 'laptop', 'macbook', 'charger', 'airpods', 'headphones', 'screen', 'gadget', 'tv', 'watch', 'smartwatch', 'tablet', 'ipad', 'electronics', 'tech', 'powerbank'],
  fashion: ['clothes', 'dress', 'shirt', 'trouser', 'suit', 'kente', 'fabric', 'lace', 'african wear', 'boutique', 'jeans', 'top', 'gown', 'outfit', 'wear', 'tailor', 'fashion', 'hoodie', 'jacket', 'tshirt'],
  footwear: ['shoes', 'sneakers', 'heels', 'sandals', 'slippers', 'boots', 'crocs', 'nike', 'jordan', 'adidas', 'loafers', 'kicks', 'footwear', 'slides'],
  beauty: ['beauty', 'makeup', 'wig', 'hair', 'cosmetics', 'lipstick', 'skincare', 'perfume', 'fragrance', 'lotion', 'cream', 'braids', 'frontal', 'lashes', 'nails', 'gloss'],
  jewelry: ['jewelry', 'watch', 'ring', 'chain', 'necklace', 'gold', 'silver', 'diamond', 'bracelet', 'earrings', 'bangle', 'beads', 'rolex'],
  food: ['food', 'jollof', 'waakye', 'snack', 'cake', 'bakes', 'meat', 'fish', 'drinks', 'juice', 'groceries', 'spices', 'restaurant', 'catering', 'recipe', 'pastries', 'bread'],
  home: ['home', 'furniture', 'bedding', 'decor', 'kitchen', 'blender', 'microwave', 'fridge', 'curtains', 'carpet', 'appliance', 'sheets', 'interior'],
  automotive: ['car', 'motor', 'bike', 'tyres', 'automobile', 'auto', 'parts', 'toyota', 'hyundai', 'ride', 'vehicle'],
  services: ['delivery', 'logistics', 'design', 'graphics', 'photography', 'video', 'repair', 'lesson', 'event', 'service', 'developer']
};

/**
 * Normalizes text for keyword matching.
 */
export function normalizeText(str) {
  if (!str || typeof str !== 'string') return '';
  return str.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Extracts categories and relevance scores from post content and metadata.
 */
export function extractPostCategories(post = {}) {
  const categories = new Set();
  const weights = {};

  // Explicit post category or productCategory
  if (post.category && typeof post.category === 'string') {
    const norm = post.category.toLowerCase().trim();
    if (COMMERCE_CATEGORIES.includes(norm)) {
      categories.add(norm);
      weights[norm] = 1.0;
    }
  }
  if (post.productCategory && typeof post.productCategory === 'string') {
    const norm = post.productCategory.toLowerCase().trim();
    if (COMMERCE_CATEGORIES.includes(norm)) {
      categories.add(norm);
      weights[norm] = Math.max(weights[norm] || 0, 0.95);
    }
  }

  // Tags
  if (Array.isArray(post.tags)) {
    for (const tag of post.tags) {
      if (!tag) continue;
      const cleanTag = normalizeText(tag);
      for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
        if (cleanTag === cat || kws.includes(cleanTag)) {
          categories.add(cat);
          weights[cat] = Math.max(weights[cat] || 0, 0.85);
        }
      }
    }
  }

  // Text / caption analysis
  const combinedText = normalizeText(`${post.text || ''} ${post.title || ''} ${post.soundName || ''} ${post.productName || ''}`);
  if (combinedText) {
    const tokens = combinedText.split(' ');
    for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
      let matchCount = 0;
      for (const kw of kws) {
        if (combinedText.includes(kw)) {
          matchCount++;
        }
      }
      if (matchCount > 0) {
        categories.add(cat);
        const matchStrength = Math.min(0.9, 0.4 + matchCount * 0.15);
        weights[cat] = Math.max(weights[cat] || 0, matchStrength);
      }
    }
  }

  // Default fallback if no category detected
  if (categories.size === 0) {
    categories.add('general');
    weights['general'] = 0.5;
  }

  return {
    categories: Array.from(categories),
    weights
  };
}

/**
 * Creates a fresh empty user interest profile.
 */
export function createEmptyProfile(userId = null) {
  return {
    userId: userId || null,
    interests: {},           // { [category]: score (0..1) }
    sellerAffinity: {},      // { [sellerId]: score (0..1) }
    categoryPenalties: {},   // { [category]: skipCount }
    hiddenPostIds: [],       // array of postIds marked NOT_INTERESTED or REPORT
    recentSearches: [],      // array of search terms
    stats: {
      totalViews: 0,
      totalCompletions: 0,
      totalLikes: 0,
      totalSaves: 0,
      totalPurchases: 0,
      totalSkips: 0
    },
    updatedAt: Date.now()
  };
}

/**
 * Updates a user profile with an incoming interaction event.
 * Modifies and returns the updated profile.
 */
export function applyEventToProfile(profile, event, post = null) {
  if (!profile) profile = createEmptyProfile(event?.userId);
  if (!event || !event.eventType) return profile;

  profile.updatedAt = Date.now();
  if (!profile.stats) profile.stats = {};
  if (!profile.interests) profile.interests = {};
  if (!profile.sellerAffinity) profile.sellerAffinity = {};
  if (!profile.categoryPenalties) profile.categoryPenalties = {};
  if (!profile.hiddenPostIds) profile.hiddenPostIds = [];

  const extracted = post ? extractPostCategories(post) : { categories: event.categories || [], weights: {} };
  const categories = extracted.categories.filter(c => c !== 'general');
  const sellerId = post?.sellerId || event.sellerId;

  // Helper to adjust interest
  const boostCategory = (cat, amount) => {
    if (!cat) return;
    const current = profile.interests[cat] || 0;
    profile.interests[cat] = Math.min(1.0, Math.max(0.0, current + amount));
    // Engaging with a category decreases past skip penalty
    if (amount > 0 && profile.categoryPenalties[cat]) {
      profile.categoryPenalties[cat] = Math.max(0, profile.categoryPenalties[cat] - 1);
    }
  };

  // Helper to adjust seller affinity
  const boostSeller = (sId, amount) => {
    if (!sId) return;
    const current = profile.sellerAffinity[sId] || 0;
    profile.sellerAffinity[sId] = Math.min(1.0, Math.max(0.0, current + amount));
  };

  switch (event.eventType) {
    case EVENT_TYPES.VIEW_START:
      profile.stats.totalViews = (profile.stats.totalViews || 0) + 1;
      break;

    case EVENT_TYPES.VIEW_DURATION: {
      const duration = Number(event.duration || event.watchedSeconds || 0);
      const ratio = Number(event.watchRatio || 0);
      if (ratio >= 0.75 || duration >= 8) {
        categories.forEach(c => boostCategory(c, 0.08));
        boostSeller(sellerId, 0.06);
      } else if (ratio >= 0.35 || duration >= 3) {
        categories.forEach(c => boostCategory(c, 0.03));
        boostSeller(sellerId, 0.02);
      }
      break;
    }

    case EVENT_TYPES.VIDEO_COMPLETED:
      profile.stats.totalCompletions = (profile.stats.totalCompletions || 0) + 1;
      categories.forEach(c => boostCategory(c, 0.12));
      boostSeller(sellerId, 0.10);
      break;

    case EVENT_TYPES.VIDEO_REWATCH:
      categories.forEach(c => boostCategory(c, 0.18));
      boostSeller(sellerId, 0.15);
      break;

    case EVENT_TYPES.SWIPE_AWAY:
      profile.stats.totalSkips = (profile.stats.totalSkips || 0) + 1;
      categories.forEach(c => {
        profile.categoryPenalties[c] = (profile.categoryPenalties[c] || 0) + 1;
        boostCategory(c, -0.06);
      });
      break;

    case EVENT_TYPES.LIKE:
      profile.stats.totalLikes = (profile.stats.totalLikes || 0) + 1;
      categories.forEach(c => boostCategory(c, 0.15));
      boostSeller(sellerId, 0.20);
      break;

    case EVENT_TYPES.UNLIKE:
      categories.forEach(c => boostCategory(c, -0.10));
      boostSeller(sellerId, -0.15);
      break;

    case EVENT_TYPES.SAVE:
      profile.stats.totalSaves = (profile.stats.totalSaves || 0) + 1;
      categories.forEach(c => boostCategory(c, 0.22));
      boostSeller(sellerId, 0.25);
      break;

    case EVENT_TYPES.UNSAVE:
      categories.forEach(c => boostCategory(c, -0.15));
      boostSeller(sellerId, -0.18);
      break;

    case EVENT_TYPES.COMMENT:
      categories.forEach(c => boostCategory(c, 0.18));
      boostSeller(sellerId, 0.20);
      break;

    case EVENT_TYPES.SHARE:
      categories.forEach(c => boostCategory(c, 0.20));
      boostSeller(sellerId, 0.22);
      break;

    case EVENT_TYPES.FOLLOW:
      boostSeller(sellerId, 0.50);
      categories.forEach(c => boostCategory(c, 0.10));
      break;

    case EVENT_TYPES.UNFOLLOW:
      boostSeller(sellerId, -0.35);
      break;

    case EVENT_TYPES.PRODUCT_OPEN:
      categories.forEach(c => boostCategory(c, 0.20));
      boostSeller(sellerId, 0.20);
      break;

    case EVENT_TYPES.STORE_OPEN:
      boostSeller(sellerId, 0.28);
      break;

    case EVENT_TYPES.PROFILE_OPEN:
      boostSeller(sellerId, 0.15);
      break;

    case EVENT_TYPES.ADD_TO_CART:
      categories.forEach(c => boostCategory(c, 0.30));
      boostSeller(sellerId, 0.30);
      break;

    case EVENT_TYPES.PURCHASE:
      profile.stats.totalPurchases = (profile.stats.totalPurchases || 0) + 1;
      categories.forEach(c => boostCategory(c, 0.50));
      boostSeller(sellerId, 0.50);
      break;

    case EVENT_TYPES.SEARCH: {
      const query = normalizeText(event.searchTerm || event.query || '');
      if (query) {
        if (!profile.recentSearches) profile.recentSearches = [];
        profile.recentSearches = [query, ...profile.recentSearches.filter(s => s !== query)].slice(0, 10);
        for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
          if (query.includes(cat) || kws.some(k => query.includes(k))) {
            boostCategory(cat, 0.25);
          }
        }
      }
      break;
    }

    case EVENT_TYPES.NOT_INTERESTED:
      if (event.postId && !profile.hiddenPostIds.includes(event.postId)) {
        profile.hiddenPostIds.push(event.postId);
      }
      categories.forEach(c => {
        profile.categoryPenalties[c] = (profile.categoryPenalties[c] || 0) + 3;
        boostCategory(c, -0.35);
      });
      boostSeller(sellerId, -0.30);
      break;

    case EVENT_TYPES.REPORT:
      if (event.postId && !profile.hiddenPostIds.includes(event.postId)) {
        profile.hiddenPostIds.push(event.postId);
      }
      categories.forEach(c => {
        profile.categoryPenalties[c] = (profile.categoryPenalties[c] || 0) + 5;
        boostCategory(c, -0.50);
      });
      boostSeller(sellerId, -0.60);
      break;
  }

  return profile;
}

/**
 * Checks whether content is safe based on community moderation rules.
 */
export function isSafePost(p) {
  if (!p) return false;
  if (p.violationDetected || p.status === 'hidden' || p.reviewStatus === 'violation') return false;
  const t = (p.text || '').toLowerCase();
  const bannedPatterns = [
    /\b(counterfeit|fake momo|money flip|hack momo|cloned card)\b/i,
    /\b(sex|porn|nude|naked|xxx|onlyfans|explicit|adult content|erotic)\b/i,
    /\b(cocaine|weed sale|illegal weapons|firearms for sale)\b/i
  ];
  for (const regex of bannedPatterns) {
    if (regex.test(t)) return false;
  }
  return true;
}

/**
 * Filters the raw collection of posts down to eligible candidates.
 */
export function filterCandidatePosts(posts = [], user = null, profile = null, options = {}) {
  const hiddenIds = new Set(profile?.hiddenPostIds || []);
  const followingList = new Set(options.following || []);

  return posts.filter(p => {
    if (!p || !p.id || !p.sellerId) return false;

    // Must be published or approved
    if (p.status !== 'published' && p.status !== 'approved') return false;
    if (p.status === 'hidden' || p.reviewStatus === 'violation') return false;

    // Safety check
    if (!isSafePost(p)) return false;

    // Post privacy check
    const privacy = p.privacy || 'public';
    if (privacy === 'private') {
      if (!user || user.uid !== p.sellerId) return false;
    } else if (privacy === 'followers') {
      const isOwner = user && user.uid === p.sellerId;
      const isFollower = user && followingList.has(p.sellerId);
      if (!isOwner && !isFollower) return false;
    }

    // Must not be explicitly hidden or reported by the user
    if (hiddenIds.has(p.id)) return false;

    return true;
  });
}

/**
 * Computes timestamp in milliseconds.
 */
export function getPostTimestamp(p) {
  if (!p) return Date.now();
  if (p.createdAt?.toMillis) return p.createdAt.toMillis();
  if (p.createdAt?.seconds) return p.createdAt.seconds * 1000;
  if (typeof p.createdAt === 'number') return p.createdAt;
  if (typeof p.createdAt === 'string') {
    const parsed = Date.parse(p.createdAt);
    if (!isNaN(parsed)) return parsed;
  }
  return Date.now();
}

/**
 * Calculates the multi-factor personalized discovery score for a single candidate post.
 */
export function calculatePostScore(post, user, profile, context = {}) {
  const now = context.now || Date.now();
  const creator = context.sellerProfiles?.[post.sellerId] || {};
  const seenPostIds = context.seenPostIds || new Set();
  const followingSet = new Set(context.following || []);

  // 1. Social Engagement Baseline (0..1)
  const likes = Array.isArray(post.likes) ? post.likes.length : Number(post.likeCount || 0);
  const comments = Array.isArray(post.comments) ? post.comments.length : Number(post.commentCount || 0);
  const saves = Array.isArray(post.saves) ? post.saves.length : Number(post.saveCount || 0);
  const reposts = Array.isArray(post.reposts) ? post.reposts.length : 0;
  const views = Number(post.views || 0);
  const rawEngagement = likes * 3.0 + comments * 5.0 + saves * 4.5 + reposts * 4.0 + Math.min(views, 8000) * 0.05;
  const engagementScore = Math.min(1.0, Math.log10(rawEngagement + 1) / 3.2);

  // 2. Freshness Decay (0..1) - 72 hour half-life
  const createdAtMs = getPostTimestamp(post);
  const ageHours = Math.max(0, (now - createdAtMs) / (1000 * 60 * 60));
  const freshnessScore = Math.exp(-ageHours / 72);

  // 3. User Category & Keyword Interest Match (0..1)
  const { categories, weights } = extractPostCategories(post);
  let interestMatchScore = 0;
  let categoryPenaltyScore = 0;

  if (profile && profile.interests) {
    let maxMatch = 0;
    for (const cat of categories) {
      const userInterest = profile.interests[cat] || 0;
      const weight = weights[cat] || 0.7;
      maxMatch = Math.max(maxMatch, userInterest * weight);

      // Check for skip penalty
      const penaltyCount = profile.categoryPenalties?.[cat] || 0;
      if (penaltyCount > 0) {
        categoryPenaltyScore = Math.max(categoryPenaltyScore, Math.min(1.0, penaltyCount * 0.25));
      }
    }
    interestMatchScore = maxMatch;
  }

  // 4. Seller Affinity & Creator Relationship (0..1)
  let sellerAffinityScore = 0;
  if (profile && profile.sellerAffinity && post.sellerId) {
    sellerAffinityScore = profile.sellerAffinity[post.sellerId] || 0;
  }
  if (followingSet.has(post.sellerId)) {
    sellerAffinityScore = Math.min(1.0, sellerAffinityScore + 0.5);
  }

  // 5. Watch Time & Completion Quality (0..1)
  let watchTimeScore = 0.5;
  if (post.mediaType?.startsWith('video') || post.isVideo) {
    const historicalCompletions = Number(post.completions || 0);
    const historicalViews = Math.max(1, Number(post.views || 1));
    const completionRate = Math.min(1.0, historicalCompletions / historicalViews);
    watchTimeScore = 0.4 + completionRate * 0.6;
  }

  // 6. Commerce & Product Relevance (0..1)
  let commerceScore = 0;
  if (post.productId || post.productPrice || post.productCategory || post.contentType === 'product') {
    commerceScore = 0.6;
    // Boost if user has shopping intent in this category
    for (const cat of categories) {
      if ((profile?.interests?.[cat] || 0) >= 0.25) {
        commerceScore = 1.0;
        break;
      }
    }
  }

  // 7. Creator Quality & Trust Badge (0..1)
  let creatorQualityScore = 0.3;
  if (creator.verified || post.isSellerVerified) creatorQualityScore += 0.4;
  if (creator.hasBusinessCert || creator.businessCertUrl) creatorQualityScore += 0.3;
  creatorQualityScore = Math.min(1.0, creatorQualityScore);

  // 8. Serendipity / Exploration Bonus
  // Provides a boost for high-quality content in categories the user hasn't seen much
  let explorationScore = 0.5;
  if (interestMatchScore < 0.2 && engagementScore > 0.4) {
    explorationScore = 0.85;
  }

  // 9. Negative Penalties
  let repetitionPenalty = 0;
  if (seenPostIds.has(post.id)) {
    repetitionPenalty = 1.0;
  }

  // Calculate Weighted Composite Score
  const hasHistory = profile && (
    Object.keys(profile.interests || {}).length > 0 ||
    Object.keys(profile.sellerAffinity || {}).length > 0 ||
    (profile.stats?.totalViews || 0) > 0
  );
  const isColdStart = !user || !profile || !hasHistory;

  let totalScore = 0;

  if (isColdStart) {
    // Cold Start formula: focus on engagement, freshness, creator quality, and diversity
    totalScore =
      engagementScore * 35 +
      freshnessScore * 30 +
      creatorQualityScore * 18 +
      watchTimeScore * 12 +
      commerceScore * 10 -
      repetitionPenalty * Math.abs(FEED_WEIGHTS.repetitionPenalty);
  } else {
    // Personalized formula
    totalScore =
      interestMatchScore * FEED_WEIGHTS.interestMatch +
      sellerAffinityScore * FEED_WEIGHTS.sellerAffinity +
      engagementScore * FEED_WEIGHTS.engagement +
      freshnessScore * FEED_WEIGHTS.freshness +
      watchTimeScore * FEED_WEIGHTS.watchTime +
      commerceScore * FEED_WEIGHTS.productRelevance +
      creatorQualityScore * FEED_WEIGHTS.creatorQuality +
      explorationScore * FEED_WEIGHTS.exploration -
      categoryPenaltyScore * Math.abs(FEED_WEIGHTS.skipPenalty) -
      repetitionPenalty * Math.abs(FEED_WEIGHTS.repetitionPenalty);
  }

  return {
    post,
    score: totalScore,
    breakdown: {
      engagementScore,
      freshnessScore,
      interestMatchScore,
      sellerAffinityScore,
      watchTimeScore,
      commerceScore,
      creatorQualityScore,
      categoryPenaltyScore,
      repetitionPenalty,
      isColdStart
    }
  };
}

/**
 * Applies diversity re-ranking to candidate list:
 * - Prevents adjacent posts from the same creator (spacing >= 1)
 * - Prevents excessive consecutive posts of the exact same category (<= 2 in a row)
 */
export function applyDiversityReRanking(scoredList, options = {}) {
  if (!Array.isArray(scoredList) || scoredList.length <= 2) {
    return scoredList.map(item => item.post || item);
  }

  const result = [];
  const remaining = [...scoredList];

  while (remaining.length > 0) {
    const lastPost = result[result.length - 1];
    const prevPost = result[result.length - 2];

    let chosenIdx = -1;

    // Search for the highest scoring post that doesn't violate diversity rules
    for (let i = 0; i < Math.min(remaining.length, 6); i++) {
      const candidate = remaining[i].post || remaining[i];

      // Check seller collision: no 2 consecutive posts from the same seller
      if (lastPost && lastPost.sellerId === candidate.sellerId) {
        continue;
      }

      // Check category collision: no 3 consecutive posts of the exact same category
      if (lastPost && prevPost) {
        const catA = extractPostCategories(lastPost).categories[0];
        const catB = extractPostCategories(prevPost).categories[0];
        const catC = extractPostCategories(candidate).categories[0];
        if (catA && catA === catB && catA === catC) {
          continue;
        }
      }

      chosenIdx = i;
      break;
    }

    // If all candidates in window collide, take the top candidate to preserve stream
    if (chosenIdx === -1) {
      chosenIdx = 0;
    }

    const [selected] = remaining.splice(chosenIdx, 1);
    result.push(selected.post || selected);
  }

  return result;
}

/**
 * Main discovery pipeline: filters, scores, and re-ranks eligible candidate posts.
 */
export function rankForYouPosts(posts, user, profile, context = {}) {
  const eligible = filterCandidatePosts(posts, user, profile, context);
  if (!eligible.length) return [];

  const scored = eligible.map(post => calculatePostScore(post, user, profile, context));
  scored.sort((a, b) => b.score - a.score);

  return applyDiversityReRanking(scored, context);
}

/**
 * In-memory buffer for batched telemetry writes.
 * Prevents hammering Firestore with a write on every interaction or scroll tick.
 */
export class FeedTelemetryBuffer {
  constructor(flushFn, options = {}) {
    this.flushFn = flushFn;
    this.buffer = [];
    this.flushIntervalMs = options.flushIntervalMs || 6000;
    this.maxBatchSize = options.maxBatchSize || 25;
    this.timer = null;
  }

  push(event) {
    if (!event || !event.userId) return;
    this.buffer.push({
      ...event,
      timestamp: event.timestamp || Date.now()
    });

    if (this.buffer.length >= this.maxBatchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushIntervalMs);
    }
  }

  async flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (!this.buffer.length) return;

    const toFlush = this.buffer.splice(0, this.maxBatchSize);
    try {
      if (typeof this.flushFn === 'function') {
        await this.flushFn(toFlush);
      }
    } catch (err) {
      // Re-queue events on transient network failure
      console.warn('[FeedTelemetryBuffer] Telemetry flush failed, re-buffering:', err?.message);
      this.buffer = [...toFlush, ...this.buffer].slice(0, 100);
    }
  }
}
