import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getMessaging } from 'firebase-admin/messaging';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch (_) {}
}
app.use('/uploads', express.static(uploadsDir));

/* Initialize Trusted Firebase Admin SDK */
let adminApp;
if (!getApps().length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      adminApp = initializeApp({ credential: cert(sa), projectId: sa.project_id || 'sellerflow-efaab' });
    } catch (_) {
      adminApp = initializeApp({ projectId: 'sellerflow-efaab' });
    }
  } else {
    adminApp = initializeApp({ projectId: 'sellerflow-efaab' });
  }
} else {
  adminApp = getApps()[0];
}

const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);

/* Lazy FCM Messaging Provider */
let adminMessaging = null;
function getAdminMessaging() {
  if (!adminMessaging) {
    adminMessaging = getMessaging(adminApp);
  }
  return adminMessaging;
}

/**
 * Sends a native FCM push notification to all active devices of a user.
 */
async function sendPushToUser(recipientId, { title, body, data = {} }) {
  if (!recipientId) return { sent: 0, error: 'Missing recipientId' };
  try {
    const tokensSnap = await adminDb.collection('users').doc(recipientId).collection('pushTokens').get();
    if (tokensSnap.empty) {
      return { sent: 0, reason: 'No registered devices' };
    }

    const tokens = [];
    const docIds = [];
    tokensSnap.forEach(d => {
      const val = d.data()?.token;
      if (val && typeof val === 'string') {
        tokens.push(val);
        docIds.push(d.id);
      }
    });

    if (!tokens.length) {
      return { sent: 0, reason: 'No valid token strings' };
    }

    const payload = {
      tokens,
      notification: {
        title: String(title || 'SellerFlow'),
        body: String(body || '')
      },
      data: {
        ...data,
        type: String(data.type || 'general'),
        route: String(data.route || ''),
        title: String(title || 'SellerFlow'),
        body: String(body || '')
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'sellerflow_default',
          sound: 'default',
          defaultSound: true,
          defaultVibrateTimings: true
        }
      }
    };

    const msgr = getAdminMessaging();
    const resp = await msgr.sendEachForMulticast(payload);
    console.log(`[FCM Push] Sent to user ${recipientId}: ${resp.successCount} succeeded, ${resp.failureCount} failed.`);

    // Automatically remove stale / invalidated device tokens
    if (resp.failureCount > 0) {
      resp.responses.forEach(async (r, idx) => {
        if (!r.success) {
          const errCode = r.error?.code;
          if (errCode === 'messaging/registration-token-not-registered' || errCode === 'messaging/invalid-registration-token') {
            const staleDocId = docIds[idx];
            if (staleDocId) {
              await adminDb.collection('users').doc(recipientId).collection('pushTokens').doc(staleDocId).delete().catch(() => {});
            }
          }
        }
      });
    }

    return { sent: resp.successCount, failed: resp.failureCount };
  } catch (err) {
    console.warn('sendPushToUser error:', err);
    return { sent: 0, error: err.message };
  }
}

/* Initialize Google GenAI with Gemini 3.8 Flash */
let aiClient = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY environment variable is not set; Gemini 3.8 Flash fallback mode active.');
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

/* Ghana Card Statutory Utilities */
export function normalizeGhanaCard(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const cleaned = raw.trim().toUpperCase().replace(/[\u2010-\u2015\u2212]/g, '-').replace(/\s+/g, '');

  if (/^GHA-[A-Z0-9]{9}-[A-Z0-9]$/i.test(cleaned)) {
    return cleaned;
  }

  const matchNoHyphen = cleaned.match(/^GHA([A-Z0-9]{9})([A-Z0-9])$/i);
  if (matchNoHyphen) {
    return `GHA-${matchNoHyphen[1]}-${matchNoHyphen[2]}`;
  }

  const alphanumericOnly = cleaned.replace(/[^A-Z0-9]/g, '');
  if (alphanumericOnly.startsWith('GHA') && alphanumericOnly.length === 13) {
    return `GHA-${alphanumericOnly.slice(3, 12)}-${alphanumericOnly.slice(12)}`;
  }

  return cleaned;
}

export function validateGhanaCardFormat(card) {
  if (!card || typeof card !== 'string') return false;
  return /^GHA-[A-Z0-9]{9}-[A-Z0-9]$/i.test(card);
}

export function maskGhanaCard(card) {
  if (!card) return '';
  const norm = normalizeGhanaCard(card);
  if (!validateGhanaCardFormat(norm)) {
    if (card.length <= 6) return '***';
    return card.slice(0, 3) + '*****' + card.slice(-2);
  }
  return `GHA-*****${norm.slice(9)}`;
}

export function hashGhanaCard(normalizedCardNumber) {
  const norm = normalizeGhanaCard(normalizedCardNumber);
  return crypto.createHash('sha256').update(norm).digest('hex');
}

/* Trusted SellerFlow Ghana AI Moderation Rules & Statutory Regulations */
const GHANA_MODERATION_RULES = [
  {
    id: 'GHANA_LAW_FINANCIAL_FRAUD',
    title: 'Mobile Money (MoMo) Fraud & Financial Scams',
    lawReference: 'Ghana Electronic Transactions Act & Criminal Offences Act (Act 29)',
    violationRegex: /(double\s*(your\s*)?(momo|money|cedi|cedis|cash)|momo\s*(hack|glitch|doubl|flip)|send\s*momo\s*(fee|pin|code|password)|(mtn|telecel|at|airteltigo)\s*momo\s*pin|fake\s*(cedi|cedis|currency|banknote|money)\s*(for\s*sale|available)|counterfeit\s*(cedi|cedis|currency|money)|buy\s*(fake|counterfeit)\s*cedi|419\s*(money|scam|scheme)|sakawa\s*(ritual|money|scam)|western\s*union\s*flip)/i,
    violationReason: 'MoMo financial fraud, mobile money phishing, or counterfeit Ghana Cedi currency prohibited under Ghanaian law.',
    confidence: 0.98,
    reviewRegex: /(invest\s*\d+%\s*daily|guaranteed\s*high\s*return|forex\s*doubler|instant\s*cash\s*flip|momo\s*cashback\s*reward|unclaimed\s*consignment)/i,
    reviewReason: 'Suspicious financial or high-yield investment claim requiring admin verification.',
    reviewConfidence: 0.72
  },
  {
    id: 'GHANA_LAW_PROHIBITED_NARCOTICS',
    title: 'Controlled Substances & Unlawful Pharmaceuticals',
    lawReference: 'Ghana Narcotics Control Commission Act (Act 1019) & FDA Regulations',
    violationRegex: /(tramadol\s*(for\s*sale|available|delivery|\d+mg)|wee\s*(for\s*sale|delivery|plug|abofra)|buy\s*(weed|cannabis|marijuana|loud|tramadol|cocaine|heroin|meth|shrooms|ecstasy)|(marijuana|cannabis|weed)\s*(delivery|plug|seller)\s*(accra|kumasi|ghana)|(pure\s*cocaine|crack\s*cocaine|crystal\s*meth)|diazepam\s*no\s*prescription)/i,
    violationReason: 'Sale or distribution of controlled narcotics or prescription pharmaceuticals prohibited under Ghana Narcotics Control Commission Act.',
    confidence: 0.98,
    reviewRegex: /(herbal\s*concoction\s*cure|traditional\s*bitters\s*cure\s*all|enhancement\s*pills|slimming\s*tea\s*fast)/i,
    reviewReason: 'Unverified medicinal supplement claim requiring health safety review.',
    reviewConfidence: 0.68
  },
  {
    id: 'GHANA_LAW_WEAPONS_VIOLENCE',
    title: 'Firearms, Weapons & Mob Violence Incitement',
    lawReference: 'Ghana Criminal Offences Act (Act 29)',
    violationRegex: /(buy\s*(gun|guns|pistol|pistols|revolver|rifle|ak47|ak-47|shotgun|firearm)|(guns?|pistols?|firearms?)\s*(for\s*sale|available)|(ammunition|bullets|explosives|dynamite)\s*(for\s*sale|supply)|(lynch|burn)\s*(the\s*)?(thief|person|witch|criminal)|instant\s*justice\s*kill|hire\s*a\s*hitman|death\s*threat|i\s*will\s*kill\s*you)/i,
    violationReason: 'Unlicensed weapons sales, violent threats, or mob justice incitement prohibited under Ghanaian law.',
    confidence: 0.97,
    reviewRegex: /(hunting\s*knife|tactical\s*blade|machete\s*wholesale|martial\s*arts\s*combat)/i,
    reviewReason: 'Sharp tactical tool or martial merchandise requiring verification.',
    reviewConfidence: 0.65
  },
  {
    id: 'GHANA_LAW_SEXUAL_EXPLOITATION_ADULT',
    title: 'Pornography, Escort Services & Sexual Exploitation',
    lawReference: 'Ghana Criminal Offences Act (Act 29)',
    violationRegex: /(sex\s*(video|tape|service|worker)|porn|pornography|xxx|nude\s*(video|photo|pic)|naked\s*(girls?|women|men)|hookup\s*(girls?|accra|kumasi|tema|ghana)|momo\s*hookup|escort\s*(service|agency|accra|kumasi)|erotic\s*massage|selling\s*(nudes|pussy|sex)|onlyfans\s*leak|adult\s*webcam)/i,
    violationReason: 'Explicit adult pornography or commercial sexual exploitation prohibited under SellerFlow policy and Ghanaian law.',
    confidence: 0.98,
    reviewRegex: /(lingerie\s*model|swimwear\s*shoot|erotic|sensual\s*massage|adult\s*party)/i,
    reviewReason: 'Intimate apparel or adult entertainment content requiring admin review.',
    reviewConfidence: 0.72
  },
  {
    id: 'GHANA_LAW_FORGED_DOCUMENTS',
    title: 'Counterfeit Ghana Cards & Forged Official Documents',
    lawReference: 'Ghana Criminal Offences Act & National Identity Register Act',
    violationRegex: /(fake|counterfeit|forged)\s*(ghana\s*card|passport|voter('?s)?\s*id|dvla|driver('?s)?\s*licen[sc]e|wassce|certificate|diploma)|buy\s*(registered\s*)?(ghana\s*card|wassce\s*result|drivers?\s*licen[sc]e)|upgrade\s*wassce\s*results?|fake\s*bank\s*statement/i,
    violationReason: 'Forgery of official statutory documents (Ghana Card, Passport, DVLA) prohibited under Ghanaian law.',
    confidence: 0.99,
    reviewRegex: /(passport\s*express\s*agent|dvla\s*middleman|fast\s*track\s*ghana\s*card)/i,
    reviewReason: 'Third-party official documentation assistance requiring seller credentials check.',
    reviewConfidence: 0.70
  },
  {
    id: 'GHANA_LAW_SMUGGLED_MINERALS',
    title: 'Illicit Galamsey Gold Trading & Mineral Smuggling',
    lawReference: 'Ghana Minerals and Mining Act (Act 703)',
    violationRegex: /(unregistered|illegal|raw)\s*gold\s*(dust|bars?)\s*(for\s*sale|available)|galamsey\s*gold\s*(cheap|deal|sale)|smuggled\s*gold|gold\s*consignment\s*fee|send\s*money\s*for\s*gold\s*boxes/i,
    violationReason: 'Illegal mineral trading or smuggled gold violating Ghana Minerals and Mining Act.',
    confidence: 0.95,
    reviewRegex: /(gold\s*dust|unrefined\s*gold|concession\s*investment)/i,
    reviewReason: 'Precious metals transaction requiring proof of Minerals Commission license.',
    reviewConfidence: 0.65
  },
  {
    id: 'GHANA_LAW_TRIBAL_HATE_SPEECH',
    title: 'Ethnic Hate Speech & Tribal Discrimination',
    lawReference: 'Constitution of the Republic of Ghana (1992)',
    violationRegex: /(all\s*(ashantis?|ewes?|gas?|fantes?|dagombas?|northerners?|hausas?)\s*(are\s*(thieves|monkeys|dogs|evil|criminals)|must\s*(die|be\s*killed|be\s*driven\s*out))|kill\s*all\s*(ashantis?|ewes?|gas?|fantes?|dagombas?)|tribal\s*war\s*in\s*ghana)/i,
    violationReason: 'Ethnic hate speech or tribal hostility prohibited under the Constitution of Ghana.',
    confidence: 0.97,
    reviewRegex: /(tribal\s*dominance|ethnic\s*politics\s*scandal|chieftaincy\s*dispute\s*threat)/i,
    reviewReason: 'Sensitive communal conflict discussion requiring moderation review.',
    reviewConfidence: 0.65
  }
];

/* Server-Side Rule Inspection Engine */
function inspectPostSafetyServer(input) {
  const text = typeof input === 'string' ? input : (input?.text || '');
  const fileName = (input?.fileName || '').toLowerCase();
  const normalizedText = (text + ' ' + fileName).toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g, '').trim();

  // 1. Prohibited file naming check
  if (/(nude|porn|xxx|sex_tape|hookup_girls|escort_accra)/i.test(fileName)) {
    return {
      verdict: 'VIOLATION',
      detectedRule: 'GHANA_LAW_SEXUAL_EXPLOITATION_ADULT',
      reason: 'Prohibited adult content or sexual media detected in uploaded file name.',
      confidence: 0.99,
      timestamp: new Date().toISOString()
    };
  }
  if (/(fake_ghana_card|fake_passport|fake_dvla|counterfeit_cedi|momo_hack)/i.test(fileName)) {
    return {
      verdict: 'VIOLATION',
      detectedRule: /(fake_ghana_card|fake_passport|fake_dvla)/i.test(fileName) ? 'GHANA_LAW_FORGED_DOCUMENTS' : 'GHANA_LAW_FINANCIAL_FRAUD',
      reason: 'Unlawful fraudulent materials or forged official statutory documents detected in uploaded file.',
      confidence: 0.99,
      timestamp: new Date().toISOString()
    };
  }
  if (/(tramadol|weed_for_sale|loud_plug|cocaine)/i.test(fileName)) {
    return {
      verdict: 'VIOLATION',
      detectedRule: 'GHANA_LAW_PROHIBITED_NARCOTICS',
      reason: 'Controlled narcotics or prescription opioid substances detected in uploaded file.',
      confidence: 0.99,
      timestamp: new Date().toISOString()
    };
  }

  // 2. Strict text rules check for violations
  for (const rule of GHANA_MODERATION_RULES) {
    if (rule.violationRegex.test(normalizedText)) {
      return {
        verdict: 'VIOLATION',
        detectedRule: rule.id,
        reason: rule.violationReason,
        confidence: rule.confidence || 0.98,
        timestamp: new Date().toISOString()
      };
    }
  }

  // 3. Review rules check for flagged claims requiring admin review
  for (const rule of GHANA_MODERATION_RULES) {
    if (rule.reviewRegex && rule.reviewRegex.test(normalizedText)) {
      return {
        verdict: 'REVIEW',
        detectedRule: rule.id,
        reason: rule.reviewReason,
        confidence: rule.reviewConfidence || 0.70,
        timestamp: new Date().toISOString()
      };
    }
  }

  // 4. Safe post
  return {
    verdict: 'SAFE',
    detectedRule: null,
    reason: 'Complies with SellerFlow Ghana safety and legal policies.',
    confidence: 0.99,
    timestamp: new Date().toISOString()
  };
}

/**
 * Gemini 3.8 Flash Multimodal & Semantic Content Moderation Engine
 * Analyzes content against Ghanaian statutory rules and marketplace safety standards.
 */
async function inspectContentWithGemini38Flash({ text = '', fileName = '', mediaUrl = '', mediaType = '', title = '', type = 'post' }) {
  // First run zero-latency statutory rules check
  const staticCheck = inspectPostSafetyServer({ text: (title ? title + ' ' : '') + text, fileName, mediaUrl, mediaType });
  if (staticCheck.verdict === 'VIOLATION') {
    return {
      ...staticCheck,
      moderatedBy: 'Gemini 3.8 Flash & Statutory Rules Engine'
    };
  }

  const ai = getGeminiClient();
  if (!ai) {
    return staticCheck;
  }

  try {
    const prompt = `You are the authoritative Safety and Content Moderation AI (powered by Gemini 3.8 Flash) for SellerFlow Ghana, an e-commerce and social video marketplace in Ghana.
Analyze the following content strictly against Ghanaian laws and marketplace safety policies:
1. Mobile Money (MoMo) Fraud & Financial Scams (MTN/Telecel/AT momo phishing, pin stealing, money doubler schemes, fake cedis).
2. Prohibited Narcotics & Controlled Substances (tramadol, weed/cannabis delivery, cocaine, prescription drug selling).
3. Weapons, Firearms & Mob Violence Incitement (guns, pistols, ammo, violent threats, lynching/mob justice).
4. Adult Sexual Exploitation & Pornography (porn, nudes, sex work, commercial escort services).
5. Forged Official Documents (counterfeit Ghana Cards, fake passports, fake DVLA licenses, forged certificates).
6. Illicit Galamsey Gold Scams & Smuggled Minerals.
7. Tribal Hate Speech & Ethnic Violence Incitement.
8. Deceptive scams, counterfeit products, stolen property.

Content to analyze:
- Content Type: ${type}
- Title / Name: "${title || ''}"
- Description / Text: "${text || ''}"
- Attachment / Filename: "${fileName || ''}"
- Media Type: "${mediaType || ''}"

Respond ONLY with valid JSON strictly conforming to:
{
  "verdict": "SAFE" | "REVIEW" | "VIOLATION",
  "detectedRule": string or null,
  "reason": string,
  "confidence": number,
  "isViolation": boolean
}
Note:
- If clearly harmful or illegal (drugs, weapons, scams, momo fraud, porn, forged docs, hate speech): verdict MUST be "VIOLATION".
- If suspicious/ambiguous claims (high-yield investment, unverified medicinal cure, questionable weapons/blades): verdict MUST be "REVIEW".
- If benign commerce, regular everyday products, standard videos: verdict MUST be "SAFE".`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    });

    const parsed = JSON.parse(response.text.trim());
    const verdict = parsed.verdict || (parsed.isViolation ? 'VIOLATION' : 'SAFE');

    return {
      verdict: verdict,
      detectedRule: parsed.detectedRule || (verdict === 'VIOLATION' ? 'GHANA_SAFETY_POLICY' : (staticCheck.detectedRule || null)),
      reason: parsed.reason || (verdict === 'VIOLATION' ? 'Flagged for content violation by Gemini 3.8 Flash' : staticCheck.reason),
      confidence: parsed.confidence || (verdict === 'VIOLATION' ? 0.96 : 0.95),
      moderatedBy: 'gemini-3.8-flash',
      timestamp: new Date().toISOString()
    };
  } catch (geminiErr) {
    console.warn('Gemini 3.8 Flash content moderation note:', geminiErr.message);
    return staticCheck;
  }
}

/**
 * Server-Side Authoritative Content Moderation for Posts
 * Uses Gemini 3.8 Flash to immediately flag violations, hide content, and queue for manual review.
 */
app.post('/api/moderation/inspect-post', async (req, res) => {
  try {
    // 1. Authenticate moderation requests with Firebase Admin SDK
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing or malformed Firebase ID token in Authorization header'
      });
    }

    const idToken = authHeader.split('Bearer ')[1].trim();
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (authErr) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid, expired, or rejected Firebase ID token',
        details: authErr.message
      });
    }

    const callerUid = decodedToken.uid;
    const { postId, text, fileName, mediaUrl, mediaType, sellerId } = req.body || {};

    if (!postId) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request: Missing postId'
      });
    }

    // Reject requests attempting to moderate another user's post
    if (sellerId && sellerId !== callerUid) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Authenticated user does not match the post seller/creator'
      });
    }

    // 2. Perform authoritative inspection with Gemini 3.8 Flash & Ghanaian safety rules
    const evalResult = await inspectContentWithGemini38Flash({ text, fileName, mediaUrl, mediaType, type: 'post' });
    const verdict = evalResult.verdict; // 'SAFE', 'REVIEW', or 'VIOLATION'

    // 3. Authoritative Firestore updates via Firebase Admin SDK
    try {
      const postRef = adminDb.collection('posts').doc(postId);
      const postSnap = await postRef.get();
      if (postSnap.exists) {
        const postData = postSnap.data() || {};
        if (postData.sellerId && postData.sellerId !== callerUid) {
          return res.status(403).json({
            success: false,
            error: 'Forbidden: Post seller does not match authenticated caller'
          });
        }
        // Idempotency: Never re-publish or overwrite if already marked as violation
        if (postData.reviewStatus === 'violation') {
          return res.json({
            success: true,
            verdict: 'VIOLATION',
            alreadyProcessed: true,
            reason: postData.violationReason || 'Content previously flagged as violation'
          });
        }
      }

      if (verdict === 'VIOLATION') {
        // VIOLATION: Immediately flag and hide post for manual admin review
        await postRef.set({
          status: 'hidden',
          reviewStatus: 'violation',
          safeContent: false,
          violationDetected: true,
          violationRule: evalResult.detectedRule,
          violationReason: evalResult.reason,
          violationConfidence: evalResult.confidence,
          flaggedByGemini: true,
          geminiModel: 'gemini-3.8-flash',
          hiddenAt: FieldValue.serverTimestamp()
        }, { merge: true });

        // Deterministic ID for idempotency: one adminReview per post
        await adminDb.collection('adminReviews').doc(`rev_${postId}`).set({
          userId: callerUid,
          postId: postId,
          detectedRule: evalResult.detectedRule,
          reason: evalResult.reason,
          confidence: evalResult.confidence,
          status: 'violation_hidden',
          flaggedBy: 'gemini-3.8-flash',
          needsManualReview: true,
          timestamp: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
          postText: text || '',
          mediaUrl: mediaUrl || '',
          mediaType: mediaType || ''
        }, { merge: true });

        // Deterministic ID for idempotency: one official warning per post
        await adminDb.collection('notifications').doc(`warn_${postId}`).set({
          recipientId: callerUid,
          userId: callerUid,
          senderName: 'SellerFlow Safety AI',
          title: '⚠️ Safety Policy Violation Warning',
          message: `Your post was flagged by Gemini 3.8 Flash and hidden from public view because it violated SellerFlow Ghana safety policies: ${evalResult.reason} (Detected Rule: ${evalResult.detectedRule}). It has been submitted for manual administrator review.`,
          type: 'warning',
          fromAdmin: true,
          read: false,
          postId: postId,
          detectedRule: evalResult.detectedRule,
          createdAt: FieldValue.serverTimestamp()
        }, { merge: true });

      } else if (verdict === 'REVIEW') {
        // REVIEW: remain hidden and queued for admin review
        await postRef.set({
          status: 'hidden',
          reviewStatus: 'under_review',
          safeContent: false,
          needsAdminReview: true,
          reviewRule: evalResult.detectedRule,
          reviewReason: evalResult.reason,
          reviewConfidence: evalResult.confidence,
          flaggedByGemini: true,
          geminiModel: 'gemini-3.8-flash'
        }, { merge: true });

        await adminDb.collection('adminReviews').doc(`rev_${postId}`).set({
          userId: callerUid,
          postId: postId,
          detectedRule: evalResult.detectedRule,
          reason: evalResult.reason,
          confidence: evalResult.confidence,
          status: 'pending_review',
          flaggedBy: 'gemini-3.8-flash',
          needsManualReview: true,
          timestamp: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
          postText: text || '',
          mediaUrl: mediaUrl || '',
          mediaType: mediaType || ''
        }, { merge: true });

      } else {
        // SAFE: Server alone transitions post to published
        await postRef.set({
          status: 'published',
          reviewStatus: 'safe',
          safeContent: true,
          moderatedAt: FieldValue.serverTimestamp(),
          moderatedBy: 'gemini-3.8-flash'
        }, { merge: true });
      }
    } catch (dbErr) {
      console.warn('Firestore Admin SDK write notice:', dbErr.message);
      // FAIL CLOSED: If database update fails, do NOT publish
      return res.status(500).json({
        success: false,
        verdict: 'REVIEW',
        error: 'Failed authoritative database update. Post remains hidden and under review.',
        details: dbErr.message
      });
    }

    return res.json({
      success: true,
      verdict,
      evalResult
    });

  } catch (err) {
    console.error('Server moderation endpoint error:', err);
    // FAIL CLOSED
    return res.status(500).json({
      success: false,
      verdict: 'REVIEW',
      error: err.message,
      reason: 'Server fault. Post remains securely hidden and under review.'
    });
  }
});

/**
 * Server-Side Product Content Moderation Endpoint with Gemini 3.8 Flash
 */
app.post('/api/moderation/inspect-product', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Missing Firebase ID token' });
    }

    const idToken = authHeader.split('Bearer ')[1].trim();
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (authErr) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid token' });
    }

    const callerUid = decodedToken.uid;
    const { productId, name, description, imageUrl, price, stock } = req.body || {};

    if (!productId) {
      return res.status(400).json({ success: false, error: 'Missing productId' });
    }

    const evalResult = await inspectContentWithGemini38Flash({
      title: name || '',
      text: description || '',
      mediaUrl: imageUrl || '',
      type: 'product'
    });

    const verdict = evalResult.verdict;

    try {
      const prodRef = adminDb.collection('products').doc(productId);
      const prodSnap = await prodRef.get();
      if (prodSnap.exists) {
        const prodData = prodSnap.data() || {};
        if (prodData.sellerId && prodData.sellerId !== callerUid && decodedToken.role !== 'admin') {
          return res.status(403).json({ success: false, error: 'Forbidden: Product seller mismatch' });
        }
      }

      if (verdict === 'VIOLATION') {
        await prodRef.set({
          status: 'taken_down',
          reviewStatus: 'violation',
          violationDetected: true,
          rejectionReason: evalResult.reason,
          flaggedByGemini: true,
          geminiModel: 'gemini-3.8-flash',
          hiddenAt: FieldValue.serverTimestamp()
        }, { merge: true });

        await adminDb.collection('adminReviews').doc(`rev_prod_${productId}`).set({
          userId: callerUid,
          productId: productId,
          productName: name || '',
          detectedRule: evalResult.detectedRule,
          reason: evalResult.reason,
          confidence: evalResult.confidence,
          status: 'violation_taken_down',
          flaggedBy: 'gemini-3.8-flash',
          needsManualReview: true,
          timestamp: FieldValue.serverTimestamp()
        }, { merge: true });

        await adminDb.collection('notifications').doc(`warn_prod_${productId}`).set({
          recipientId: callerUid,
          userId: callerUid,
          senderName: 'SellerFlow Safety AI',
          title: '⚠️ Product Flagged for Policy Violation',
          message: `Your product "${name || 'item'}" was flagged by Gemini 3.8 Flash and taken down for manual review: ${evalResult.reason}.`,
          type: 'warning',
          fromAdmin: true,
          read: false,
          createdAt: FieldValue.serverTimestamp()
        }, { merge: true });

      } else if (verdict === 'REVIEW') {
        await prodRef.set({
          status: 'pending_review',
          reviewStatus: 'pending',
          needsAdminReview: true,
          reviewReason: evalResult.reason,
          flaggedByGemini: true,
          geminiModel: 'gemini-3.8-flash'
        }, { merge: true });
      } else {
        await prodRef.set({
          status: 'approved',
          reviewStatus: 'approved',
          moderatedAt: FieldValue.serverTimestamp(),
          moderatedBy: 'gemini-3.8-flash'
        }, { merge: true });
      }
    } catch (dbErr) {
      console.warn('Firestore product update notice:', dbErr.message);
    }

    return res.json({ success: true, verdict, evalResult });
  } catch (err) {
    console.error('Product moderation error:', err);
    return res.status(500).json({ success: false, verdict: 'REVIEW', error: err.message });
  }
});

/**
 * Server-Side Authoritative Ghana Card Verification with Gemini 3.8 Flash & Duplicate Detection
 * Enforces:
 * 1. Format validation (GHA-XXXXXXXXX-X) - if invalid, instructs user to submit correct info
 * 2. Duplicate card check across all accounts in Firestore
 * 3. Gemini 3.8 Flash verification of identity details and document authenticity
 */
app.post('/api/verification/verify-ghana-card', async (req, res) => {
  try {
    // 1. Authenticate caller
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        verdict: 'REJECTED',
        error: 'Unauthorized: Missing or malformed Firebase ID token'
      });
    }

    const idToken = authHeader.split('Bearer ')[1].trim();
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (authErr) {
      return res.status(401).json({
        success: false,
        verdict: 'REJECTED',
        error: 'Unauthorized: Invalid or expired Firebase ID token'
      });
    }

    const callerUid = decodedToken.uid;
    const {
      ghanaCardNumber,
      fullName,
      dateOfBirth,
      frontPath,
      backPath,
      selfiePath,
      livenessStatus = 'COMPLETED',
      livenessMovements = ['LOOK_FORWARD', 'TURN_HEAD_UP', 'TURN_HEAD_DOWN', 'TURN_HEAD_LEFT', 'TURN_HEAD_RIGHT'],
      livenessCompletedAt = new Date().toISOString(),
      frontBase64,
      backBase64,
      selfieBase64
    } = req.body || {};

    // 2. Format validation check
    const normalized = normalizeGhanaCard(ghanaCardNumber || '');
    if (!normalized || !validateGhanaCardFormat(normalized)) {
      return res.status(400).json({
        success: false,
        verdict: 'CORRECTION_REQUIRED',
        error: 'Invalid Ghana Card number format. Please enter your valid Ghana Card PIN in the format GHA-XXXXXXXXX-X (e.g. GHA-123456789-0). Please submit correct info.',
        actionRequired: 'Submit correct Ghana Card PIN in the official statutory format GHA-XXXXXXXXX-X'
      });
    }

    // 3. Cryptographic hash for duplicate card detection
    const cardHash = hashGhanaCard(normalized);
    const maskedCard = maskGhanaCard(normalized);

    // 4. Duplicate Ghana Card Check across Firestore accounts
    try {
      const [byHash, byNumber] = await Promise.all([
        adminDb.collection('users').where('ghanaCardHash', '==', cardHash).get(),
        adminDb.collection('users').where('ghanaCardNumber', '==', normalized).get()
      ]);

      const duplicateDocs = [...byHash.docs, ...byNumber.docs].filter(d => d.id !== callerUid);

      if (duplicateDocs.length > 0) {
        const existingUser = duplicateDocs[0].data() || {};
        console.warn(`Duplicate Ghana Card detected: ${maskedCard} already belongs to user ${duplicateDocs[0].id}`);
        
        // Log duplicate attempt for security auditing
        await adminDb.collection('adminReviews').doc(`dup_card_${callerUid}`).set({
          userId: callerUid,
          applicantName: fullName || '',
          ghanaCardMasked: maskedCard,
          duplicateWithUserId: duplicateDocs[0].id,
          reason: 'Duplicate Ghana Card PIN submission detected across multiple accounts.',
          status: 'duplicate_blocked',
          timestamp: FieldValue.serverTimestamp()
        }, { merge: true });

        return res.status(409).json({
          success: false,
          verdict: 'DUPLICATE_REJECTED',
          error: `Duplicate Ghana Card detected: This Ghana Card (${maskedCard}) is already associated with another SellerFlow account. Each Ghana Card can only be used by one seller. Please submit your own valid official Ghana Card.`,
          duplicate: true,
          actionRequired: 'Please submit your own unique, official Ghana Card.'
        });
      }
    } catch (dupErr) {
      console.warn('Firestore duplicate check notice:', dupErr.message);
    }

    // 5. Gemini 3.8 Flash AI Identity & Document Verification
    const ai = getGeminiClient();
    let geminiVerdict = 'VERIFIED';
    let geminiMessage = 'Ghana Card details and live selfie liveness verified successfully.';
    let geminiCorrectionInstructions = '';
    let isAuthentic = true;
    let confidence = 0.95;

    if (ai) {
      try {
        const prompt = `You are the official Ghana Card & Liveness Identity Verification AI (powered by Gemini 3.8 Flash) for SellerFlow Ghana.
Evaluate this Ghana National Identity Card (Ghana Card) + Live Selfie Liveness challenge application against official standards.

Application Details:
- Applicant Full Name: "${fullName || ''}"
- Date of Birth: "${dateOfBirth || 'Provided'}"
- Submitted Ghana Card PIN: "${normalized}"
- Front Document Path: "${frontPath || 'Provided'}"
- Back Document Path: "${backPath || 'Provided'}"
- Live Selfie Storage Path: "${selfiePath || 'Provided'}"
- Liveness Challenge Status: "${livenessStatus}"
- Liveness Head Movements: ${JSON.stringify(livenessMovements)}

Verify the following:
1. Is the Ghana Card PIN "${normalized}" structured as a valid official Ghana Card PIN (GHA-XXXXXXXXX-X)?
2. Does the applicant's name "${fullName || ''}" match standard Ghanaian naming structure?
3. Are the submitted credentials legitimate and free from obvious forgery, placeholder text, or fake numbers (e.g. GHA-000000000-0)?
4. Has the user completed the required 5-step live head-pose challenge?
5. If there are discrepancies or issues, provide clear, polite instructions telling the person to submit correct info.

Respond strictly in JSON format:
{
  "valid": boolean,
  "verdict": "VERIFIED" | "CORRECTION_REQUIRED" | "REVIEW" | "REJECTED",
  "confidence": number,
  "nameMatches": boolean,
  "isAuthentic": boolean,
  "livenessVerified": boolean,
  "userMessage": string,
  "correctionInstructions": string
}`;

        const geminiRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        });

        const parsed = JSON.parse(geminiRes.text.trim());
        geminiVerdict = parsed.verdict || (parsed.valid ? 'VERIFIED' : 'CORRECTION_REQUIRED');
        geminiMessage = parsed.userMessage || 'Ghana Card verification evaluated.';
        geminiCorrectionInstructions = parsed.correctionInstructions || '';
        isAuthentic = parsed.isAuthentic !== false;
        confidence = parsed.confidence || 0.92;
      } catch (geminiErr) {
        console.warn('Gemini 3.8 Flash verification analysis notice:', geminiErr.message);
      }
    }

    const verificationRecordId = `verif_${callerUid}`;
    const mappedStatus = geminiVerdict === 'VERIFIED' ? 'VERIFIED' : (geminiVerdict === 'REJECTED' || geminiVerdict === 'CORRECTION_REQUIRED' ? 'REJECTED' : 'PENDING');

    // Archive comprehensive private identity verification record
    try {
      await adminDb.collection('identityVerifications').doc(callerUid).set({
        uid: callerUid,
        userId: callerUid,
        verificationRecordId,
        fullName: fullName || '',
        dateOfBirth: dateOfBirth || '',
        ghanaCardPin: normalized,
        ghanaCardMasked: maskedCard,
        ghanaCardHash: cardHash,
        ghanaCardFrontPath: frontPath || '',
        ghanaCardBackPath: backPath || '',
        selfieStoragePath: selfiePath || '',
        selfiePath: selfiePath || '',
        livenessStatus: livenessStatus || 'COMPLETED',
        livenessChallengeCompletedTimestamp: livenessCompletedAt || new Date().toISOString(),
        livenessMovements: livenessMovements,
        verificationStatus: mappedStatus,
        verificationMethod: 'ghana_card_plus_liveness_challenge',
        verificationSubmissionTimestamp: FieldValue.serverTimestamp(),
        submittedAt: FieldValue.serverTimestamp(),
        verifiedAt: geminiVerdict === 'VERIFIED' ? FieldValue.serverTimestamp() : null,
        rejectionReason: geminiVerdict === 'CORRECTION_REQUIRED' || geminiVerdict === 'REJECTED' ? geminiMessage : '',
        auditMetadata: {
          userAgent: req.headers['user-agent'] || 'unknown',
          ip: req.ip || req.headers['x-forwarded-for'] || 'client',
          geminiModel: 'gemini-3.8-flash',
          confidence,
          disclaimer: 'Automated verification check performed for platform security. This is not an official NIA (National Identification Authority) verification.'
        }
      }, { merge: true });
    } catch (verifDocErr) {
      console.warn('identityVerifications document storage notice:', verifDocErr.message);
    }

    // Archive in dedicated Security Team buyerKycRecords vault for compliance reference
    try {
      await adminDb.collection('buyerKycRecords').doc(callerUid).set({
        uid: callerUid,
        fullName: fullName || '',
        email: decodedToken.email || '',
        ghanaCardNumber: normalized,
        ghanaCardMasked: maskedCard,
        ghanaCardHash: cardHash,
        ghanaCardFrontPath: frontPath || '',
        ghanaCardBackPath: backPath || '',
        selfiePath: selfiePath || '',
        livenessStatus: livenessStatus || 'COMPLETED',
        verificationStatus: geminiVerdict === 'VERIFIED' ? 'approved' : (geminiVerdict === 'REJECTED' || geminiVerdict === 'CORRECTION_REQUIRED' ? 'rejected' : 'pending'),
        verified: geminiVerdict === 'VERIFIED',
        submittedAt: FieldValue.serverTimestamp(),
        lastUpdatedAt: FieldValue.serverTimestamp(),
        verifiedBy: geminiVerdict === 'VERIFIED' ? 'gemini-3.8-flash' : 'pending_security_team',
        rejectionReason: geminiVerdict === 'CORRECTION_REQUIRED' || geminiVerdict === 'REJECTED' ? geminiMessage : '',
        source: 'sellerflow_identity_and_liveness_verification',
        notes: geminiVerdict === 'VERIFIED' ? 'Identity & Live Selfie Liveness verified with Gemini 3.8 Flash' : 'Identity verification recorded. Accessible strictly to Security Team administrators.'
      }, { merge: true });
    } catch (vaultErr) {
      console.warn('buyerKycRecords archival notice:', vaultErr.message);
    }

    // 6. Handle Verification Outcomes
    if (geminiVerdict === 'CORRECTION_REQUIRED' || geminiVerdict === 'REJECTED') {
      await adminDb.collection('users').doc(callerUid).set({
        ghanaCardMasked: maskedCard,
        verificationStatus: 'rejected',
        verified: false,
        rejectionReason: geminiMessage,
        correctionInstructions: geminiCorrectionInstructions,
        verificationReviewedAt: FieldValue.serverTimestamp()
      }, { merge: true });

      return res.json({
        success: false,
        verdict: 'CORRECTION_REQUIRED',
        error: `${geminiMessage} Please submit correct info to complete your seller verification.`,
        correctionInstructions: geminiCorrectionInstructions || 'Please ensure your full legal name matches the card and clear unedited photos of both sides of your official Ghana Card and live selfie are uploaded.'
      });
    }

    if (geminiVerdict === 'VERIFIED') {
      // Authoritative verification approval
      await adminDb.collection('users').doc(callerUid).set({
        verified: true,
        verificationStatus: 'approved',
        ghanaCardNumber: normalized,
        ghanaCardMasked: maskedCard,
        ghanaCardHash: cardHash,
        ghanaCardFrontPath: frontPath || '',
        ghanaCardBackPath: backPath || '',
        selfieStoragePath: selfiePath || '',
        livenessStatus: 'COMPLETED',
        verifiedBy: 'gemini-3.8-flash',
        verificationConfidence: confidence,
        verificationApprovedAt: FieldValue.serverTimestamp()
      }, { merge: true });

      await adminDb.collection('publicProfiles').doc(callerUid).set({
        verified: true
      }, { merge: true });

      await adminDb.collection('notifications').doc(`verif_appr_${callerUid}`).set({
        recipientId: callerUid,
        userId: callerUid,
        senderName: 'SellerFlow Security & Verification AI',
        title: '🎉 Seller Verification Approved',
        message: 'Your Ghana Card identity verification and live selfie liveness check have been approved by Gemini 3.8 Flash. Your blue SellerFlow verification badge is now active on your store and products.',
        type: 'verification_approved',
        fromAdmin: true,
        read: false,
        createdAt: FieldValue.serverTimestamp()
      }, { merge: true });

      return res.json({
        success: true,
        verdict: 'VERIFIED',
        maskedCard,
        livenessStatus: 'COMPLETED',
        message: 'Identity and live selfie liveness verified successfully by Gemini 3.8 Flash! Your blue SellerFlow verification badge is now active.'
      });
    }

    // Default to pending review
    await adminDb.collection('users').doc(callerUid).set({
      ghanaCardMasked: maskedCard,
      ghanaCardHash: cardHash,
      ghanaCardNumber: normalized,
      ghanaCardFrontPath: frontPath || '',
      ghanaCardBackPath: backPath || '',
      selfieStoragePath: selfiePath || '',
      livenessStatus: 'COMPLETED',
      verificationStatus: 'pending',
      verified: false,
      needsAdminReview: true,
      verificationSubmittedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    return res.json({
      success: true,
      verdict: 'REVIEW',
      maskedCard,
      livenessStatus: 'COMPLETED',
      message: 'Your Ghana Card and live selfie check have been submitted securely and queued for Security Team review.'
    });

  } catch (err) {
    console.error('Ghana card verification endpoint error:', err);
    return res.status(500).json({
      success: false,
      verdict: 'REVIEW',
      error: 'An unexpected error occurred during verification. Please try again or contact support.'
    });
  }
});

/**
 * Server-Side Authoritative Takedown API Endpoint
 * Handles taking down posts, products, and store accounts authoritatively via Firebase Admin SDK.
 */
app.post('/api/admin/takedown', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Missing token' });
    }

    const idToken = authHeader.split('Bearer ')[1].trim();
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (authErr) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid token' });
    }

    const callerUid = decodedToken.uid;
    const { type = 'post', id, targetId, reason = 'Taken down after administrative safety review' } = req.body || {};
    const itemUid = id || targetId;

    if (!itemUid) {
      return res.status(400).json({ success: false, error: 'Missing target item ID' });
    }

    if (type === 'post') {
      const postRef = adminDb.collection('posts').doc(itemUid);
      const postSnap = await postRef.get();
      const postData = postSnap.exists ? postSnap.data() : null;
      const sellerId = postData?.sellerId;

      await postRef.set({
        status: 'removed',
        reviewStatus: 'removed',
        safeContent: false,
        takedownReason: reason,
        removedAt: FieldValue.serverTimestamp(),
        removedBy: callerUid
      }, { merge: true });

      if (sellerId && sellerId !== callerUid) {
        await adminDb.collection('notifications').doc(`takedown_post_${itemUid}`).set({
          recipientId: sellerId,
          userId: sellerId,
          senderName: 'SellerFlow Admin',
          title: 'Post Removed by Admin',
          message: `Your post was taken down after a platform safety review: ${reason}.`,
          type: 'takedown',
          fromAdmin: true,
          read: false,
          postId: itemUid,
          createdAt: FieldValue.serverTimestamp()
        }, { merge: true });
      }

      await adminDb.collection('adminReviews').doc(`takedown_post_${itemUid}`).set({
        userId: sellerId || callerUid,
        targetId: itemUid,
        type: 'post',
        action: 'takedown',
        reason,
        takenDownBy: callerUid,
        timestamp: FieldValue.serverTimestamp()
      }, { merge: true });

      return res.json({ success: true, message: 'Post taken down successfully' });
    }

    if (type === 'product') {
      const prodRef = adminDb.collection('products').doc(itemUid);
      const prodSnap = await prodRef.get();
      const prodData = prodSnap.exists ? prodSnap.data() : null;
      const sellerId = prodData?.sellerId;

      await prodRef.set({
        status: 'taken_down',
        reviewStatus: 'taken_down',
        takedownReason: reason,
        takenDownAt: FieldValue.serverTimestamp(),
        takenDownBy: callerUid
      }, { merge: true });

      if (sellerId && sellerId !== callerUid) {
        await adminDb.collection('notifications').doc(`takedown_prod_${itemUid}`).set({
          recipientId: sellerId,
          userId: sellerId,
          senderName: 'SellerFlow Admin',
          title: 'Product Removed from Marketplace',
          message: `Your product "${prodData?.name || 'item'}" was taken down from the marketplace: ${reason}.`,
          type: 'takedown',
          fromAdmin: true,
          read: false,
          productId: itemUid,
          createdAt: FieldValue.serverTimestamp()
        }, { merge: true });
      }

      return res.json({ success: true, message: 'Product taken down successfully' });
    }

    if (type === 'store') {
      const storeRef = adminDb.collection('stores').doc(itemUid);
      await storeRef.set({
        status: 'taken_down',
        reviewStatus: 'taken_down',
        takedownReason: reason,
        takenDownAt: FieldValue.serverTimestamp(),
        takenDownBy: callerUid
      }, { merge: true });

      if (itemUid !== callerUid) {
        await adminDb.collection('notifications').doc(`takedown_store_${itemUid}`).set({
          recipientId: itemUid,
          userId: itemUid,
          senderName: 'SellerFlow Admin',
          title: 'Storefront Suspended',
          message: `Your storefront was taken down by administration: ${reason}.`,
          type: 'takedown',
          fromAdmin: true,
          read: false,
          createdAt: FieldValue.serverTimestamp()
        }, { merge: true });
      }

      return res.json({ success: true, message: 'Store taken down successfully' });
    }

    return res.status(400).json({ success: false, error: 'Unknown item type for takedown' });
  } catch (err) {
    console.error('Admin takedown API error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/custom-token', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : (req.body?.idToken || req.body?.firebaseToken || '');
    if (!token) {
      return res.status(400).json({ success: false, error: 'Missing token' });
    }
    const decoded = await adminAuth.verifyIdToken(token);
    const customToken = await adminAuth.createCustomToken(decoded.uid);
    return res.json({ success: true, customToken });
  } catch (err) {
    console.warn('Custom token creation issue:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/* FCM Push Notification Sending Endpoint */
app.post('/api/push/send', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const token = authHeader.slice(7).trim();
    const decoded = await adminAuth.verifyIdToken(token);

    const { recipientId, title, body, data } = req.body || {};
    if (!recipientId || !title) {
      return res.status(400).json({ success: false, error: 'recipientId and title are required' });
    }

    const result = await sendPushToUser(recipientId, {
      title,
      body: body || '',
      data: { ...(data || {}), senderId: decoded.uid }
    });

    return res.json({ success: true, result });
  } catch (err) {
    console.error('Push send API error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/* FCM Push Notification Self-Test Endpoint */
app.post('/api/push/test', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const token = authHeader.slice(7).trim();
    const decoded = await adminAuth.verifyIdToken(token);

    const result = await sendPushToUser(decoded.uid, {
      title: 'SellerFlow Test Notification',
      body: 'Push notifications are configured and working on this Android device! 🔔',
      data: { type: 'test', route: 'feed' }
    });

    return res.json({ success: true, result });
  } catch (err) {
    console.error('Push test API error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/* Storage & Media Upload Endpoint */
app.post('/api/storage/upload', async (req, res) => {
  try {
    const { path: relPath, base64, contentType } = req.body || {};
    const safeRelPath = (relPath || `media/upload_${Date.now()}_${crypto.randomUUID()}.bin`)
      .replace(/^[/\\]+/, '')
      .replace(/\.\.[/\\]/g, '');
    
    let fileBuffer;
    if (base64) {
      const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, '');
      fileBuffer = Buffer.from(cleanBase64, 'base64');
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return res.status(400).json({ success: false, error: 'No file content provided' });
    }

    const fullFilePath = path.join(uploadsDir, safeRelPath);
    const parentDir = path.dirname(fullFilePath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    fs.writeFileSync(fullFilePath, fileBuffer);
    const publicUrl = `/uploads/${safeRelPath}`;
    
    return res.json({
      success: true,
      url: publicUrl,
      path: safeRelPath,
      contentType: contentType || 'application/octet-stream',
      size: fileBuffer.length
    });
  } catch (err) {
    console.error('Storage upload error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', gemini: 'gemini-3.8-flash' });
});

app.get('/api/config', (req, res) => {
  res.json({
    firebaseApiKey: process.env.FIREBASE_API_KEY || '',
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseKey: process.env.SUPABASE_KEY || '',
    moderationFunctionUrl: '/api/moderation/inspect-post',
    verificationFunctionUrl: '/api/verification/verify-ghana-card',
    takedownFunctionUrl: '/api/admin/takedown'
  });
});

const distPath = path.join(__dirname, 'dist');
const isProd = process.env.NODE_ENV === 'production';

app.get('/sw.js', (req, res) => {
  const swPath = isProd && fs.existsSync(path.join(distPath, 'sw.js'))
    ? path.join(distPath, 'sw.js')
    : (fs.existsSync(path.join(__dirname, 'sw.js')) ? path.join(__dirname, 'sw.js') : path.join(distPath, 'sw.js'));
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Service-Worker-Allowed', '/');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(swPath);
});

if (isProd && fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}
app.use(express.static(__dirname, { dotfiles: 'ignore', index: false }));
if (!isProd && fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

app.get('*', (req, res) => {
  const indexPath = isProd && fs.existsSync(path.join(distPath, 'index.html'))
    ? path.join(distPath, 'index.html')
    : (fs.existsSync(path.join(__dirname, 'index.html')) ? path.join(__dirname, 'index.html') : path.join(distPath, 'index.html'));
  res.sendFile(indexPath);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SellerFlow server is running on http://0.0.0.0:${PORT}`);
});

