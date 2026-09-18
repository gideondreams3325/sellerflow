/**
 * SellerFlow Trusted Firebase Cloud Functions
 * Authoritative Server-Side AI Moderation Pipeline
 */
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getMessaging } from 'firebase-admin/messaging';
import { onRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

const app = getApps().length ? getApps()[0] : initializeApp();
const db = getFirestore(app);
const auth = getAuth(app);

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

function inspectPostSafety(input) {
  const text = typeof input === 'string' ? input : (input?.text || '');
  const fileName = (input?.fileName || '').toLowerCase();
  const normalizedText = (text + ' ' + fileName).toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g, '').trim();

  if (/(nude|porn|xxx|sex_tape|hookup_girls|escort_accra)/i.test(fileName)) {
    return {
      verdict: 'VIOLATION',
      detectedRule: 'GHANA_LAW_SEXUAL_EXPLOITATION_ADULT',
      reason: 'Prohibited adult content or sexual media detected in uploaded file name.',
      confidence: 0.99
    };
  }
  if (/(fake_ghana_card|fake_passport|fake_dvla|counterfeit_cedi|momo_hack)/i.test(fileName)) {
    return {
      verdict: 'VIOLATION',
      detectedRule: /(fake_ghana_card|fake_passport|fake_dvla)/i.test(fileName) ? 'GHANA_LAW_FORGED_DOCUMENTS' : 'GHANA_LAW_FINANCIAL_FRAUD',
      reason: 'Unlawful fraudulent materials or forged official statutory documents detected in uploaded file.',
      confidence: 0.99
    };
  }
  if (/(tramadol|weed_for_sale|loud_plug|cocaine)/i.test(fileName)) {
    return {
      verdict: 'VIOLATION',
      detectedRule: 'GHANA_LAW_PROHIBITED_NARCOTICS',
      reason: 'Controlled narcotics or prescription opioid substances detected in uploaded file.',
      confidence: 0.99
    };
  }

  for (const rule of GHANA_MODERATION_RULES) {
    if (rule.violationRegex.test(normalizedText)) {
      return {
        verdict: 'VIOLATION',
        detectedRule: rule.id,
        reason: rule.violationReason,
        confidence: rule.confidence || 0.98
      };
    }
  }

  for (const rule of GHANA_MODERATION_RULES) {
    if (rule.reviewRegex && rule.reviewRegex.test(normalizedText)) {
      return {
        verdict: 'REVIEW',
        detectedRule: rule.id,
        reason: rule.reviewReason,
        confidence: rule.reviewConfidence || 0.70
      };
    }
  }

  return {
    verdict: 'SAFE',
    detectedRule: null,
    reason: 'Complies with SellerFlow Ghana safety and legal policies.',
    confidence: 0.99
  };
}

/**
 * Cloud Function: moderatePost
 * Authoritatively verifies caller authentication, inspects content, and writes decision to Firestore via Admin SDK.
 */
export const moderatePost = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or malformed authentication token' });
    }
    const idToken = authHeader.split('Bearer ')[1].trim();

    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (err) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired Firebase ID token', details: err.message });
    }

    const callerUid = decodedToken.uid;
    const { postId, text, fileName, mediaUrl, mediaType } = req.body || {};

    if (!postId) {
      return res.status(400).json({ error: 'Bad Request: Missing postId' });
    }

    const postRef = db.collection('posts').doc(postId);
    const postSnap = await postRef.get();

    if (!postSnap.exists) {
      return res.status(404).json({ error: 'Not Found: Post does not exist' });
    }

    const postData = postSnap.data() || {};
    if (postData.sellerId !== callerUid) {
      return res.status(403).json({ error: 'Forbidden: You can only moderate your own posts' });
    }

    // Idempotency: If already marked VIOLATION, do not overwrite or republish
    if (postData.reviewStatus === 'violation') {
      return res.json({
        success: true,
        verdict: 'VIOLATION',
        alreadyProcessed: true,
        reason: postData.violationReason || 'Content previously flagged as violation.'
      });
    }

    const evalResult = inspectPostSafety({
      text: text || postData.text || '',
      fileName: fileName || '',
      mediaUrl: mediaUrl || postData.mediaUrl || '',
      mediaType: mediaType || postData.mediaType || ''
    });

    const verdict = evalResult.verdict;

    if (verdict === 'VIOLATION') {
      await postRef.update({
        status: 'hidden',
        reviewStatus: 'violation',
        safeContent: false,
        violationDetected: true,
        violationRule: evalResult.detectedRule,
        violationReason: evalResult.reason,
        violationConfidence: evalResult.confidence,
        hiddenAt: FieldValue.serverTimestamp()
      });

      // Deterministic ID for idempotency: one review per post
      await db.collection('adminReviews').doc(`rev_${postId}`).set({
        userId: callerUid,
        postId: postId,
        detectedRule: evalResult.detectedRule,
        reason: evalResult.reason,
        confidence: evalResult.confidence,
        status: 'violation_hidden',
        timestamp: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        postText: text || postData.text || '',
        mediaUrl: mediaUrl || postData.mediaUrl || '',
        mediaType: mediaType || postData.mediaType || ''
      }, { merge: true });

      // Deterministic ID for idempotency: one warning per post
      await db.collection('notifications').doc(`warn_${postId}`).set({
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
      await postRef.update({
        status: 'hidden',
        reviewStatus: 'under_review',
        safeContent: false,
        needsAdminReview: true,
        reviewRule: evalResult.detectedRule,
        reviewReason: evalResult.reason,
        reviewConfidence: evalResult.confidence
      });
    } else {
      // SAFE: ONLY the trusted backend transitions the post to published
      await postRef.update({
        status: 'published',
        reviewStatus: 'safe',
        safeContent: true,
        moderatedAt: FieldValue.serverTimestamp()
      });
    }

    return res.json({
      success: true,
      verdict,
      evalResult
    });

  } catch (error) {
    console.error('Cloud Function moderation error:', error);
    // FAIL CLOSED: Do not publish on error
    return res.status(500).json({
      success: false,
      verdict: 'REVIEW',
      error: error.message
    });
  }
});

/**
 * Automatically dispatch native FCM push notifications to all registered
 * user devices whenever a new notification document is created in Firestore.
 */
export const sendPushOnNotificationCreated = onDocumentCreated('notifications/{notificationId}', async (event) => {
  try {
    const notif = event.data?.data();
    if (!notif || !notif.recipientId) return;

    const recipientId = notif.recipientId;
    const title = notif.title || (notif.senderName ? `${notif.senderName} on SellerFlow` : 'SellerFlow');
    const body = notif.message || '';
    const type = notif.type || (notif.fromAdmin ? 'admin_notice' : 'notification');
    const route = notif.postId ? 'feed' : (notif.conversationId ? 'chats' : (notif.orderId ? 'orders' : 'notifications'));

    const tokensSnap = await db.collection('users').doc(recipientId).collection('pushTokens').get();
    if (tokensSnap.empty) return;

    const tokens = [];
    const docIds = [];
    tokensSnap.forEach(d => {
      const val = d.data()?.token;
      if (val && typeof val === 'string') {
        tokens.push(val);
        docIds.push(d.id);
      }
    });

    if (!tokens.length) return;

    const messaging = getMessaging(app);
    const resp = await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: {
        type: String(type),
        route: String(route),
        notificationId: String(event.params.notificationId),
        orderId: String(notif.orderId || ''),
        postId: String(notif.postId || ''),
        conversationId: String(notif.conversationId || ''),
        title: String(title),
        body: String(body)
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
    });

    console.log(`[Cloud Function FCM] Dispatched to ${recipientId}: ${resp.successCount} sent, ${resp.failureCount} failed.`);

    // Cleanup stale or invalid tokens
    if (resp.failureCount > 0) {
      resp.responses.forEach(async (r, idx) => {
        if (!r.success) {
          const code = r.error?.code;
          if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
            const staleId = docIds[idx];
            if (staleId) {
              await db.collection('users').doc(recipientId).collection('pushTokens').doc(staleId).delete().catch(() => {});
            }
          }
        }
      });
    }
  } catch (err) {
    console.warn('sendPushOnNotificationCreated trigger error:', err);
  }
});
