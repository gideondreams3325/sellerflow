import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

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

/* Server-Side AI Moderation Engine */
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
 * DEVELOPMENT & LOCAL CONTAINER FALLBACK MODERATION ENDPOINT
 * 
 * ROLE CLASSIFICATION: DEVELOPMENT-ONLY FALLBACK
 * - The SOLE production moderation authority is the Firebase Cloud Function "moderatePost" (functions/index.js).
 * - This Express endpoint is NOT the production authority. It is preserved strictly as a
 *   development-only fallback for local container testing when the external Cloud Function is unavailable.
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

    // 2. Perform authoritative inspection
    const evalResult = inspectPostSafetyServer({ text, fileName, mediaUrl, mediaType });
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
        // VIOLATION: hide post, safeContent = false
        await postRef.set({
          status: 'hidden',
          reviewStatus: 'violation',
          safeContent: false,
          violationDetected: true,
          violationRule: evalResult.detectedRule,
          violationReason: evalResult.reason,
          violationConfidence: evalResult.confidence,
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
          message: `Your post was hidden from public view because it violated SellerFlow Ghana safety policies: ${evalResult.reason} (Detected Rule: ${evalResult.detectedRule}).`,
          type: 'warning',
          fromAdmin: true,
          read: false,
          postId: postId,
          detectedRule: evalResult.detectedRule,
          createdAt: FieldValue.serverTimestamp()
        }, { merge: true });

      } else if (verdict === 'REVIEW') {
        // REVIEW: remain hidden/under_review
        await postRef.set({
          status: 'hidden',
          reviewStatus: 'under_review',
          safeContent: false,
          needsAdminReview: true,
          reviewRule: evalResult.detectedRule,
          reviewReason: evalResult.reason,
          reviewConfidence: evalResult.confidence
        }, { merge: true });

      } else {
        // SAFE: Server alone transitions post to published
        await postRef.set({
          status: 'published',
          reviewStatus: 'safe',
          safeContent: true,
          moderatedAt: FieldValue.serverTimestamp()
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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/config', (req, res) => {
  res.json({
    firebaseApiKey: process.env.FIREBASE_API_KEY || '',
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseKey: process.env.SUPABASE_KEY || '',
    moderationFunctionUrl: process.env.MODERATION_FUNCTION_URL || (process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL.replace(/\/+$/, '')}/functions/v1/moderatePost` : 'https://vvpwntehstjbccarqqzp.supabase.co/functions/v1/moderatePost')
  });
});

const distPath = path.join(__dirname, 'dist');

app.get('/sw.js', (req, res) => {
  const swPath = fs.existsSync(path.join(distPath, 'sw.js'))
    ? path.join(distPath, 'sw.js')
    : path.join(__dirname, 'sw.js');
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Service-Worker-Allowed', '/');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(swPath);
});

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}
app.use(express.static(__dirname, { dotfiles: 'ignore', index: false }));

app.get('*', (req, res) => {
  const indexPath = fs.existsSync(path.join(distPath, 'index.html'))
    ? path.join(distPath, 'index.html')
    : path.join(__dirname, 'index.html');
  res.sendFile(indexPath);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SellerFlow server is running on http://0.0.0.0:${PORT}`);
});

