/**
 * SellerFlow Supabase Edge Function: moderatePost
 * Authoritative Server-Side Moderation Pipeline for SellerFlow Posts
 *
 * Security & Identity Architecture:
 * - Identity Provider: Firebase Authentication (project: sellerflow-efaab)
 * - Cryptographically verifies incoming Firebase ID tokens against Google public JWKS (RS256)
 * - Obtains authenticated UID strictly from verified token (does not trust client-supplied UID)
 * - Verifies post authorship (caller can only moderate their own post)
 * - Applies deterministic, idempotent moderation state transitions
 * - Authoritative server-side Firestore write via Google Cloud Service Account REST API
 * - Fails closed: if token verification, Firestore write, or moderation fails, post remains hidden/under_review
 */

import { createRemoteJWKSet, jwtVerify, importPKCS8, SignJWT } from 'jose';

const SUPABASE_PROJECT_ID = (typeof Deno !== 'undefined' ? Deno.env.get('SUPABASE_PROJECT_ID') : '') || 'vvpwntehstjbccarqqzp';
const SUPABASE_URL = (typeof Deno !== 'undefined' ? Deno.env.get('SUPABASE_URL') : '') || `https://${SUPABASE_PROJECT_ID}.supabase.co`;
const SUPABASE_ANON_KEY = (typeof Deno !== 'undefined' ? Deno.env.get('SUPABASE_ANON_KEY') : '') || '';
const SUPABASE_SERVICE_ROLE_KEY = (typeof Deno !== 'undefined' ? (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_KEY')) : '') || '';

const FIREBASE_PROJECT_ID = (typeof Deno !== 'undefined' ? Deno.env.get('FIREBASE_PROJECT_ID') : '') || 'sellerflow-efaab';
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

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

export function inspectPostSafety(input: { text?: string; fileName?: string; mediaUrl?: string; mediaType?: string }) {
  const text = input?.text || '';
  const fileName = (input?.fileName || '').toLowerCase();
  const normalizedText = (text + ' ' + fileName).toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g, '').trim();

  if (/(nude|porn|xxx|sex_tape|hookup_girls|escort_accra)/i.test(fileName)) {
    return {
      verdict: 'VIOLATION' as const,
      detectedRule: 'GHANA_LAW_SEXUAL_EXPLOITATION_ADULT',
      reason: 'Prohibited adult content or sexual media detected in uploaded file name.',
      confidence: 0.99
    };
  }
  if (/(fake_ghana_card|fake_passport|fake_dvla|counterfeit_cedi|momo_hack)/i.test(fileName)) {
    return {
      verdict: 'VIOLATION' as const,
      detectedRule: /(fake_ghana_card|fake_passport|fake_dvla)/i.test(fileName) ? 'GHANA_LAW_FORGED_DOCUMENTS' : 'GHANA_LAW_FINANCIAL_FRAUD',
      reason: 'Unlawful fraudulent materials or forged official statutory documents detected in uploaded file.',
      confidence: 0.99
    };
  }
  if (/(tramadol|weed_for_sale|loud_plug|cocaine)/i.test(fileName)) {
    return {
      verdict: 'VIOLATION' as const,
      detectedRule: 'GHANA_LAW_PROHIBITED_NARCOTICS',
      reason: 'Controlled narcotics or prescription opioid substances detected in uploaded file.',
      confidence: 0.99
    };
  }

  for (const rule of GHANA_MODERATION_RULES) {
    if (rule.violationRegex.test(normalizedText)) {
      return {
        verdict: 'VIOLATION' as const,
        detectedRule: rule.id,
        reason: rule.violationReason,
        confidence: rule.confidence || 0.98
      };
    }
  }

  for (const rule of GHANA_MODERATION_RULES) {
    if (rule.reviewRegex && rule.reviewRegex.test(normalizedText)) {
      return {
        verdict: 'REVIEW' as const,
        detectedRule: rule.id,
        reason: rule.reviewReason,
        confidence: rule.reviewConfidence || 0.70
      };
    }
  }

  return {
    verdict: 'SAFE' as const,
    detectedRule: null,
    reason: 'Complies with SellerFlow Ghana safety and legal policies.',
    confidence: 0.99
  };
}

// Remote Google JWKS set for verifying Firebase Auth tokens
const jwks = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));

/**
 * Cryptographically verifies Firebase ID token using Google public keys (RS256).
 * Rejects expired tokens, wrong issuer, wrong audience, or malformed payloads.
 */
export async function verifyFirebaseIdToken(idToken: string, projectId: string = FIREBASE_PROJECT_ID) {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Missing or empty ID token');
  }

  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
    algorithms: ['RS256']
  });

  const uid = payload.sub;
  if (!uid || typeof uid !== 'string') {
    throw new Error('Token payload is missing subject (uid)');
  }

  return {
    uid,
    email: payload.email as string | undefined,
    payload
  };
}

/**
 * Authoritatively verifies caller identity against Supabase Auth (or Firebase fallback).
 * Guarantees that the caller UID is derived purely from verified cryptographic credentials.
 */
export async function verifyCallerToken(token: string): Promise<{ uid: string; email?: string; provider: 'supabase' | 'firebase' }> {
  if (!token || typeof token !== 'string') {
    throw new Error('Missing or empty authentication token');
  }

  // 1. Try Supabase Auth session verification
  try {
    const sbUserRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY || token
      }
    });
    if (sbUserRes.ok) {
      const user = await sbUserRes.json();
      if (user && (user.id || user.sub)) {
        return {
          uid: user.id || user.sub,
          email: user.email,
          provider: 'supabase'
        };
      }
    }
  } catch (_) {}

  // 2. Fallback to Firebase Auth ID token verification
  try {
    const verified = await verifyFirebaseIdToken(token, FIREBASE_PROJECT_ID);
    return {
      uid: verified.uid,
      email: verified.email,
      provider: 'firebase'
    };
  } catch (fbErr: any) {
    throw new Error(`Invalid or expired authentication token (tested Supabase Auth and Firebase Auth): ${fbErr.message || fbErr}`);
  }
}

// Helper: Decode Firestore document fields to standard JavaScript types
function decodeFirestoreValue(val: any): any {
  if (!val || typeof val !== 'object') return null;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('timestampValue' in val) return val.timestampValue;
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) return (val.arrayValue.values || []).map(decodeFirestoreValue);
  if ('mapValue' in val) {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
      res[k] = decodeFirestoreValue(v);
    }
    return res;
  }
  return null;
}

export function fromFirestoreDoc(doc: any): Record<string, any> {
  const result: Record<string, any> = {};
  if (!doc || !doc.fields) return result;
  for (const [k, v] of Object.entries(doc.fields)) {
    result[k] = decodeFirestoreValue(v);
  }
  return result;
}

// Helper: Encode standard JavaScript types to Firestore REST representation
function encodeFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (val instanceof Date) return { timestampValue: val.toISOString() };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(encodeFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = encodeFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

export function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    fields[k] = encodeFirestoreValue(v);
  }
  return fields;
}

// Read Service Account from Supabase secrets
function getServiceAccount(): { client_email: string; private_key: string; project_id: string } | null {
  const env = typeof Deno !== 'undefined' ? Deno.env : { get: () => '' };

  const saJson = env.get('FIREBASE_SERVICE_ACCOUNT');
  if (saJson) {
    try {
      const parsed = JSON.parse(saJson);
      if (parsed.client_email && parsed.private_key) {
        return {
          client_email: parsed.client_email,
          private_key: parsed.private_key,
          project_id: parsed.project_id || env.get('FIREBASE_PROJECT_ID') || FIREBASE_PROJECT_ID
        };
      }
    } catch (_) {}
  }

  const clientEmail = env.get('FIREBASE_CLIENT_EMAIL');
  const privateKey = env.get('FIREBASE_PRIVATE_KEY');
  const projectId = env.get('FIREBASE_PROJECT_ID') || FIREBASE_PROJECT_ID;

  if (clientEmail && privateKey) {
    return {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, '\n'),
      project_id: projectId
    };
  }

  return null;
}

// Cached Google OAuth2 access token for Firestore REST
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getFirestoreAccessToken(sa: { client_email: string; private_key: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt > now + 60) {
    return cachedToken.token;
  }

  const pem = sa.private_key.includes('\n') ? sa.private_key : sa.private_key.replace(/\\n/g, '\n');
  const privateKey = await importPKCS8(pem, 'RS256');

  const assertion = await new SignJWT({
    scope: 'https://www.googleapis.com/auth/datastore'
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(sa.client_email)
    .setSubject(sa.client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey);

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google OAuth2 token exchange failed: ${res.status} ${errText}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: now + (data.expires_in || 3600)
  };
  return data.access_token;
}

/**
 * Main Request Handler for Supabase Edge Function: moderatePost
 */
export async function handleModeratePost(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // 1. Authenticate caller with Supabase Auth or Firebase Auth token
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        error: 'Unauthorized: Missing or malformed authentication token. Expected Authorization: Bearer <Auth_Token>'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      return new Response(JSON.stringify({
        error: 'Unauthorized: Empty token provided'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let callerUid: string;
    try {
      const verified = await verifyCallerToken(token);
      callerUid = verified.uid;
    } catch (tokenErr: any) {
      return new Response(JSON.stringify({
        error: 'Unauthorized: Invalid or expired authentication token',
        details: tokenErr.message || String(tokenErr)
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Parse request payload
    let body: any = {};
    try {
      body = await req.json();
    } catch (_) {
      return new Response(JSON.stringify({ error: 'Bad Request: Invalid JSON payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { postId, text, fileName, mediaUrl, mediaType } = body || {};
    if (!postId || typeof postId !== 'string') {
      return new Response(JSON.stringify({ error: 'Bad Request: Missing or invalid postId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Acquire Google OAuth2 credentials for Firestore REST operations
    const sa = getServiceAccount();
    if (!sa) {
      console.error('Server configuration error: Firebase service account credentials not configured in Supabase secrets');
      // FAIL CLOSED: Return 500 without altering post, remains hidden/under_review
      return new Response(JSON.stringify({
        success: false,
        verdict: 'REVIEW',
        error: 'Server configuration error: Firebase service account credentials not configured in Supabase secrets. Post remains safely in hidden/under_review state.'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const projectId = sa.project_id || FIREBASE_PROJECT_ID;
    const accessToken = await getFirestoreAccessToken(sa);
    const firestoreBase = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

    // 4. Fetch post document from Firestore to verify existence and ownership
    const postGetRes = await fetch(`${firestoreBase}/posts/${encodeURIComponent(postId)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (postGetRes.status === 404) {
      return new Response(JSON.stringify({ error: 'Not Found: Post does not exist' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!postGetRes.ok) {
      const errText = await postGetRes.text();
      throw new Error(`Firestore read error: ${postGetRes.status} ${errText}`);
    }

    const postDoc = await postGetRes.json();
    const postData = fromFirestoreDoc(postDoc);

    // Verify ownership: A user cannot moderate another user's post
    if (postData.sellerId !== callerUid) {
      return new Response(JSON.stringify({ error: 'Forbidden: You can only moderate your own posts' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Idempotency check: If already marked VIOLATION, do not overwrite or republish
    if (postData.reviewStatus === 'violation') {
      return new Response(JSON.stringify({
        success: true,
        verdict: 'VIOLATION',
        alreadyProcessed: true,
        reason: postData.violationReason || 'Content previously flagged as violation.'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 5. Evaluate post safety using Ghanaian policy rules
    const evalResult = inspectPostSafety({
      text: text || postData.text || '',
      fileName: fileName || '',
      mediaUrl: mediaUrl || postData.mediaUrl || '',
      mediaType: mediaType || postData.mediaType || ''
    });

    const verdict = evalResult.verdict;
    const nowIso = new Date().toISOString();

    if (verdict === 'VIOLATION') {
      // Transition post to hidden / violation
      const updatePostUrl = `${firestoreBase}/posts/${encodeURIComponent(postId)}?updateMask.fieldPaths=status&updateMask.fieldPaths=reviewStatus&updateMask.fieldPaths=safeContent&updateMask.fieldPaths=violationDetected&updateMask.fieldPaths=violationRule&updateMask.fieldPaths=violationReason&updateMask.fieldPaths=violationConfidence&updateMask.fieldPaths=hiddenAt`;
      const updatePostRes = await fetch(updatePostUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: toFirestoreFields({
            status: 'hidden',
            reviewStatus: 'violation',
            safeContent: false,
            violationDetected: true,
            violationRule: evalResult.detectedRule,
            violationReason: evalResult.reason,
            violationConfidence: evalResult.confidence,
            hiddenAt: new Date(nowIso)
          })
        })
      });

      if (!updatePostRes.ok) {
        throw new Error(`Failed to update post violation status: ${await updatePostRes.text()}`);
      }

      // Idempotent deterministic Admin Review record: rev_${postId}
      const adminReviewUrl = `${firestoreBase}/adminReviews/rev_${encodeURIComponent(postId)}`;
      await fetch(adminReviewUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: toFirestoreFields({
            userId: callerUid,
            postId: postId,
            detectedRule: evalResult.detectedRule,
            reason: evalResult.reason,
            confidence: evalResult.confidence,
            status: 'violation_hidden',
            timestamp: new Date(nowIso),
            createdAt: new Date(nowIso),
            postText: text || postData.text || '',
            mediaUrl: mediaUrl || postData.mediaUrl || '',
            mediaType: mediaType || postData.mediaType || ''
          })
        })
      });

      // Idempotent deterministic Policy Warning notification: warn_${postId}
      const warningUrl = `${firestoreBase}/notifications/warn_${encodeURIComponent(postId)}`;
      await fetch(warningUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: toFirestoreFields({
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
            createdAt: new Date(nowIso)
          })
        })
      });

    } else if (verdict === 'REVIEW') {
      // Keep hidden in under_review status
      const updatePostUrl = `${firestoreBase}/posts/${encodeURIComponent(postId)}?updateMask.fieldPaths=status&updateMask.fieldPaths=reviewStatus&updateMask.fieldPaths=safeContent&updateMask.fieldPaths=needsAdminReview&updateMask.fieldPaths=reviewRule&updateMask.fieldPaths=reviewReason&updateMask.fieldPaths=reviewConfidence`;
      const updatePostRes = await fetch(updatePostUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: toFirestoreFields({
            status: 'hidden',
            reviewStatus: 'under_review',
            safeContent: false,
            needsAdminReview: true,
            reviewRule: evalResult.detectedRule || '',
            reviewReason: evalResult.reason,
            reviewConfidence: evalResult.confidence
          })
        })
      });

      if (!updatePostRes.ok) {
        throw new Error(`Failed to update post review status: ${await updatePostRes.text()}`);
      }

    } else {
      // SAFE: ONLY the trusted Supabase Edge Function transitions the post to published
      const updatePostUrl = `${firestoreBase}/posts/${encodeURIComponent(postId)}?updateMask.fieldPaths=status&updateMask.fieldPaths=reviewStatus&updateMask.fieldPaths=safeContent&updateMask.fieldPaths=moderatedAt`;
      const updatePostRes = await fetch(updatePostUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: toFirestoreFields({
            status: 'published',
            reviewStatus: 'safe',
            safeContent: true,
            moderatedAt: new Date(nowIso)
          })
        })
      });

      if (!updatePostRes.ok) {
        throw new Error(`Failed to publish safe post: ${await updatePostRes.text()}`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      verdict,
      evalResult
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Supabase Edge Function moderatePost error:', error);
    // FAIL CLOSED: Never publish on error; return REVIEW
    return new Response(JSON.stringify({
      success: false,
      verdict: 'REVIEW',
      error: error.message || String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Attach Deno.serve handler for Supabase Edge Runtime
if (typeof Deno !== 'undefined' && typeof Deno.serve === 'function') {
  Deno.serve(handleModeratePost);
}
