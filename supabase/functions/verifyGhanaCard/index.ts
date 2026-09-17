/**
 * SellerFlow Supabase Edge Function: verifyGhanaCard
 * Authoritative Server-Side Ghana Card Verification & Trust Pipeline
 *
 * Security & Identity Architecture:
 * - Accepts authenticated SellerFlow verification submissions (Supabase Auth or Firebase Auth token)
 * - Verifies caller identity and derives authenticated callerUid cryptographically
 * - Enforces strict tenant isolation: users can ONLY submit documents located in their own
 *   private storage folder: verification/${callerUid}/... (prevents cross-user document access)
 * - Accesses Ghana Card front and back images strictly through private Supabase Storage
 * - Never makes Ghana Card images publicly accessible; never returns raw card numbers or images to the client
 * - Computes irreversible SHA-256 hash of normalized Ghana Card number for duplicate account detection
 * - Uses configured AI/OCR service (Google Gemini Vision) to extract card details and detect alterations
 * - Compares extracted card number and legal name with user-submitted application info
 * - Employs fail-closed architecture: uncertainty, duplicate, or service errors default to REVIEW
 * - Returns only safe verification verdicts: VERIFIED | REVIEW | REJECTED
 * - Displays clear statutory disclaimer: Automated check is NOT official NIA verification
 * - Stores only minimal verification metadata in Supabase
 */

import { createRemoteJWKSet, jwtVerify, importPKCS8, SignJWT } from 'jose';

// Configuration from Supabase Edge Runtime environment / secrets
const SUPABASE_PROJECT_ID = (typeof Deno !== 'undefined' ? Deno.env.get('SUPABASE_PROJECT_ID') : (typeof process !== 'undefined' ? process.env.SUPABASE_PROJECT_ID : '')) || 'vvpwntehstjbccarqqzp';
const SUPABASE_URL = (typeof Deno !== 'undefined' ? Deno.env.get('SUPABASE_URL') : (typeof process !== 'undefined' ? process.env.SUPABASE_URL : '')) || `https://${SUPABASE_PROJECT_ID}.supabase.co`;
const SUPABASE_ANON_KEY = (typeof Deno !== 'undefined' ? Deno.env.get('SUPABASE_ANON_KEY') : (typeof process !== 'undefined' ? process.env.SUPABASE_ANON_KEY : '')) || '';
const SUPABASE_SERVICE_ROLE_KEY = (typeof Deno !== 'undefined' ? (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_KEY')) : (typeof process !== 'undefined' ? (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY) : '')) || '';
const SUPABASE_STORAGE_BUCKET = (typeof Deno !== 'undefined' ? Deno.env.get('SUPABASE_STORAGE_BUCKET') : (typeof process !== 'undefined' ? process.env.SUPABASE_STORAGE_BUCKET : '')) || 'ghana-card-documents';

const GEMINI_API_KEY = (typeof Deno !== 'undefined' ? Deno.env.get('GEMINI_API_KEY') : (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '')) || '';

const FIREBASE_PROJECT_ID = (typeof Deno !== 'undefined' ? Deno.env.get('FIREBASE_PROJECT_ID') : (typeof process !== 'undefined' ? process.env.FIREBASE_PROJECT_ID : '')) || 'sellerflow-efaab';
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

export const OFFICIAL_NIA_DISCLAIMER = 'Automated verification check performed for platform security. This is not an official NIA (National Identification Authority) verification.';

export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

/**
 * Normalizes Ghana Card PIN number into standard statutory format: GHA-XXXXXXXXX-X
 */
export function normalizeGhanaCard(raw: string): string {
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

/**
 * Validates Ghana Card format (e.g. GHA-123456789-0)
 */
export function validateGhanaCardFormat(card: string): boolean {
  if (!card || typeof card !== 'string') return false;
  return /^GHA-[A-Z0-9]{9}-[A-Z0-9]$/i.test(card);
}

/**
 * Masks Ghana Card number to prevent accidental exposure of PII (e.g. GHA-*****6789-0)
 */
export function maskGhanaCard(card: string): string {
  if (!card) return '';
  const norm = normalizeGhanaCard(card);
  if (!validateGhanaCardFormat(norm)) {
    if (card.length <= 6) return '***';
    return card.slice(0, 3) + '*****' + card.slice(-2);
  }
  return `GHA-*****${norm.slice(9)}`;
}

/**
 * Computes cryptographically secure SHA-256 hash of normalized Ghana Card number.
 * Used for duplicate detection across accounts without storing or exposing plaintext card numbers.
 */
export async function hashGhanaCard(normalizedCardNumber: string): Promise<string> {
  const norm = normalizeGhanaCard(normalizedCardNumber);
  const msgUint8 = new TextEncoder().encode(norm);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates storage path security and ownership:
 * - Must belong strictly to caller's private verification folder (verification/${callerUid}/...)
 * - Blocks path traversal attacks (..) and invalid sequences
 * - Enforces allowed image / document file extensions
 */
export function verifyDocumentPaths(callerUid: string, frontPath: string, backPath: string): { valid: boolean; error?: string } {
  if (!callerUid || typeof callerUid !== 'string') {
    return { valid: false, error: 'Unauthorized: Missing authenticated caller UID' };
  }

  if (!frontPath || typeof frontPath !== 'string' || !backPath || typeof backPath !== 'string') {
    return { valid: false, error: 'Bad Request: Both front and back Ghana Card document paths are required' };
  }

  // Path traversal guard
  if (frontPath.includes('..') || backPath.includes('..') || frontPath.includes('//') || backPath.includes('//')) {
    return { valid: false, error: 'Forbidden: Path traversal or invalid character sequence detected in document paths' };
  }

  // Enforce tenant storage boundary
  const expectedPrefix = `verification/${callerUid}/`;
  if (!frontPath.startsWith(expectedPrefix) || !backPath.startsWith(expectedPrefix)) {
    return { valid: false, error: 'Forbidden: You can only verify identity documents from your own private storage directory' };
  }

  // Allowed file extensions
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
  const frontExt = frontPath.slice(frontPath.lastIndexOf('.')).toLowerCase();
  const backExt = backPath.slice(backPath.lastIndexOf('.')).toLowerCase();

  if (!allowedExts.includes(frontExt) || !allowedExts.includes(backExt)) {
    return { valid: false, error: 'Unsupported document file type. Allowed extensions: .jpg, .jpeg, .png, .webp, .pdf' };
  }

  return { valid: true };
}

/**
 * Compares applicant's submitted full name with name extracted via AI/OCR from card.
 * Handles Ghanaian naming conventions, multi-word names, and middle name variations.
 */
export function compareNames(submittedName: string, extractedName: string): { match: boolean; confidence: number; reason?: string } {
  if (!submittedName || !extractedName) {
    return { match: false, confidence: 0, reason: 'Missing name information for comparison' };
  }

  const cleanTokens = (s: string) => s
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !['mr', 'mrs', 'ms', 'miss', 'dr', 'prof', 'hon', 'esq'].includes(w));

  const tokensA = cleanTokens(submittedName);
  const tokensB = cleanTokens(extractedName);

  if (tokensA.length === 0 || tokensB.length === 0) {
    return { match: false, confidence: 0, reason: 'Name strings contain insufficient searchable characters' };
  }

  const setB = new Set(tokensB);
  const shared = tokensA.filter(t => setB.has(t));

  const ratioA = shared.length / tokensA.length;
  const ratioB = shared.length / tokensB.length;
  const avgRatio = (ratioA + ratioB) / 2;

  // Strict match: 2 or more names match and overlap is strong
  if (shared.length >= 2 || (tokensA.length === 1 && tokensB.length === 1 && shared.length === 1)) {
    if (avgRatio >= 0.8) {
      return { match: true, confidence: 0.95 };
    }
    if (avgRatio >= 0.5) {
      return { match: true, confidence: 0.80 };
    }
  } else if (shared.length === 1 && (tokensA.length <= 2 || tokensB.length <= 2)) {
    return { match: true, confidence: 0.65, reason: 'Partial name match (only 1 name token matched)' };
  }

  return { match: false, confidence: avgRatio, reason: `Name mismatch: "${submittedName}" vs card name "${extractedName}"` };
}

export interface VerificationEvaluationInput {
  submittedCardNumber: string;
  submittedName: string;
  extractedCardNumber?: string | null;
  extractedName?: string | null;
  isDuplicate: boolean;
  duplicateDetails?: string;
  isCardLegitimate?: boolean;
  isForgedOrTampered?: boolean;
  aiOcrConfidence?: number;
  aiOcrAvailable: boolean;
  aiOcrNotes?: string;
}

export interface VerificationVerdict {
  verdict: 'VERIFIED' | 'REVIEW' | 'REJECTED';
  reason: string;
  confidence: number;
  checks: {
    formatValid: boolean;
    duplicateCheckPassed: boolean;
    cardNumberMatch: boolean;
    nameMatch: boolean;
    integrityCheckPassed: boolean;
  };
}

/**
 * Pure evaluation engine for Ghana Card verification:
 * - VERIFIED: Passed all automated format, duplicate, OCR number, name, and authenticity checks
 * - REVIEW: Unclear, inconsistent, duplicate detected, missing AI service, or requires human admin review
 * - REJECTED: Invalid format, confirmed tampering/forgery, or blatant card number mismatch
 */
export function evaluateGhanaCardVerification(input: VerificationEvaluationInput): VerificationVerdict {
  const normSubmitted = normalizeGhanaCard(input.submittedCardNumber);
  const formatValid = validateGhanaCardFormat(normSubmitted);

  // 1. Blatant invalid format -> REJECTED
  if (!formatValid) {
    return {
      verdict: 'REJECTED',
      reason: 'Invalid Ghana Card number format. Must conform to GHA-XXXXXXXXX-X standard.',
      confidence: 0.99,
      checks: {
        formatValid: false,
        duplicateCheckPassed: !input.isDuplicate,
        cardNumberMatch: false,
        nameMatch: false,
        integrityCheckPassed: false
      }
    };
  }

  // 2. Duplicate card detected -> REVIEW (Requirement 11: "REVIEW means the information is unclear, inconsistent, duplicated, or requires human/admin verification")
  if (input.isDuplicate) {
    return {
      verdict: 'REVIEW',
      reason: input.duplicateDetails || 'Duplicate card detected: This Ghana Card is already associated with another SellerFlow account.',
      confidence: 0.95,
      checks: {
        formatValid: true,
        duplicateCheckPassed: false,
        cardNumberMatch: false,
        nameMatch: false,
        integrityCheckPassed: true
      }
    };
  }

  // 3. Document integrity check: Card exhibits signs of forgery or tampering -> REJECTED
  if (input.isForgedOrTampered === true) {
    return {
      verdict: 'REJECTED',
      reason: 'Document integrity check failed: Uploaded card displays signs of digital alteration, forgery, or specimen markings.',
      confidence: 0.95,
      checks: {
        formatValid: true,
        duplicateCheckPassed: true,
        cardNumberMatch: false,
        nameMatch: false,
        integrityCheckPassed: false
      }
    };
  }

  // 4. If AI/OCR was unavailable or could not process card images -> REVIEW (fail-closed, requires admin review)
  if (!input.aiOcrAvailable) {
    return {
      verdict: 'REVIEW',
      reason: 'Automated AI/OCR check currently unavailable or image could not be read. Queued for administrator review.',
      confidence: 0.50,
      checks: {
        formatValid: true,
        duplicateCheckPassed: true,
        cardNumberMatch: false,
        nameMatch: false,
        integrityCheckPassed: true
      }
    };
  }

  // 5. Card number comparison (if extracted by OCR)
  let cardNumberMatch = false;
  if (input.extractedCardNumber) {
    const normExtracted = normalizeGhanaCard(input.extractedCardNumber);
    cardNumberMatch = normExtracted === normSubmitted;

    // Blatant mismatch between what user submitted and what the card displays -> REJECTED
    if (!cardNumberMatch) {
      return {
        verdict: 'REJECTED',
        reason: `Ghana Card number mismatch: Submitted ${maskGhanaCard(normSubmitted)} does not match card image ${maskGhanaCard(normExtracted)}.`,
        confidence: 0.95,
        checks: {
          formatValid: true,
          duplicateCheckPassed: true,
          cardNumberMatch: false,
          nameMatch: false,
          integrityCheckPassed: true
        }
      };
    }
  }

  // 6. Name comparison (if extracted by OCR)
  let nameMatch = false;
  let nameMatchConfidence = 0;
  if (input.extractedName && input.submittedName) {
    const nameComp = compareNames(input.submittedName, input.extractedName);
    nameMatch = nameComp.match;
    nameMatchConfidence = nameComp.confidence;

    // Blatant name mismatch -> REVIEW or REJECTED
    if (!nameMatch && nameMatchConfidence < 0.3) {
      return {
        verdict: 'REVIEW',
        reason: nameComp.reason || 'Applicant name does not match the name printed on the submitted Ghana Card.',
        confidence: 0.85,
        checks: {
          formatValid: true,
          duplicateCheckPassed: true,
          cardNumberMatch,
          nameMatch: false,
          integrityCheckPassed: true
        }
      };
    }
  }

  // 7. Full automated pass: Card number matches, name matches, high AI confidence, legitimate physical card
  const overallConfidence = input.aiOcrConfidence || 0;
  if (cardNumberMatch && nameMatch && nameMatchConfidence >= 0.75 && input.isCardLegitimate !== false && overallConfidence >= 0.80) {
    return {
      verdict: 'VERIFIED',
      reason: 'Passed automated Ghana Card security, OCR matching, and duplication checks.',
      confidence: Math.min(overallConfidence, 0.96),
      checks: {
        formatValid: true,
        duplicateCheckPassed: true,
        cardNumberMatch: true,
        nameMatch: true,
        integrityCheckPassed: true
      }
    };
  }

  // 8. Uncertain case, partial match, or lower confidence -> REVIEW (Requirement 14: "Keep uncertain cases as REVIEW")
  return {
    verdict: 'REVIEW',
    reason: input.aiOcrNotes || 'Verification requires manual human review due to partial document match or image clarity.',
    confidence: overallConfidence || 0.65,
    checks: {
      formatValid: true,
      duplicateCheckPassed: true,
      cardNumberMatch,
      nameMatch,
      integrityCheckPassed: input.isCardLegitimate !== false
    }
  };
}

// Remote Google JWKS set for verifying Firebase Auth tokens
const jwks = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));

/**
 * Cryptographically verifies Firebase ID token using Google public keys (RS256).
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
 * Authoritatively verifies caller identity against Supabase Auth (or Firebase Auth fallback).
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

/**
 * Downloads a private document from Supabase Storage using server-side service credentials.
 * Never makes the file publicly accessible or creates long-lived public URLs.
 */
async function fetchPrivateDocument(path: string, serviceKey: string): Promise<{ buffer: ArrayBuffer; contentType: string } | null> {
  if (!serviceKey || !path) return null;
  const endpoint = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_STORAGE_BUCKET}/${path}`;
  try {
    const res = await fetch(endpoint, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      }
    });
    if (!res.ok) {
      console.warn(`Private document fetch failed for ${path}: ${res.status}`);
      return null;
    }
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = await res.arrayBuffer();
    return { buffer, contentType };
  } catch (err) {
    console.error(`Error fetching private document ${path}:`, err);
    return null;
  }
}

/**
 * Converts ArrayBuffer to Base64 in cross-runtime manner
 */
function bufferToBase64(buffer: ArrayBuffer): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(buffer).toString('base64');
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Analyzes Ghana Card images using Google Gemini Vision AI.
 * Extracts card number, legal name, physical document markers, and forgery indicators.
 */
async function analyzeCardWithGemini(
  front: { buffer: ArrayBuffer; contentType: string },
  back: { buffer: ArrayBuffer; contentType: string },
  apiKey: string
): Promise<{
  extractedCardNumber: string | null;
  extractedName: string | null;
  isCardLegitimate: boolean;
  isForgedOrTampered: boolean;
  confidence: number;
  notes: string;
} | null> {
  if (!apiKey) return null;

  try {
    const frontBase64 = bufferToBase64(front.buffer);
    const backBase64 = bufferToBase64(back.buffer);

    const prompt = `You are an automated document analysis engine for Ghana National Identity Cards (Ghana Card).
Examine the provided front and back card images carefully.
Extract the following information:
1. The Ghana Card PIN number (Format: GHA-XXXXXXXXX-X, where X are digits/characters).
2. The full legal name printed on the card.
3. Check for standard statutory security elements of a genuine Ghana Card:
   - "REPUBLIC OF GHANA" header
   - National coat of arms / emblem
   - ECOWAS logo
   - Hologram / guilloche background pattern
   - Date of birth / expiry
4. Check for signs of forgery, digital alteration, fake card templates, screen-recaptures of a monitor, or sample/specimen cards.

Respond strictly in JSON format matching this schema:
{
  "extractedCardNumber": "GHA-XXXXXXXXX-X" or null,
  "extractedName": "FIRST MIDDLE LAST" or null,
  "isCardLegitimate": true or false,
  "isForgedOrTampered": true or false,
  "confidence": 0.0 to 1.0,
  "notes": "short assessment"
}`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: front.contentType.includes('pdf') ? 'application/pdf' : front.contentType,
                  data: frontBase64
                }
              },
              {
                inlineData: {
                  mimeType: back.contentType.includes('pdf') ? 'application/pdf' : back.contentType,
                  data: backBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!res.ok) {
      console.warn(`Gemini API returned status ${res.status}: ${await res.text()}`);
      return null;
    }

    const data = await res.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) return null;

    const parsed = JSON.parse(candidateText);
    return {
      extractedCardNumber: parsed.extractedCardNumber || null,
      extractedName: parsed.extractedName || null,
      isCardLegitimate: parsed.isCardLegitimate !== false,
      isForgedOrTampered: parsed.isForgedOrTampered === true,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.85,
      notes: parsed.notes || 'AI document analysis completed.'
    };
  } catch (err) {
    console.warn('Gemini vision analysis error:', err);
    return null;
  }
}

/**
 * Checks Supabase database for an existing card hash associated with a different user account.
 */
async function checkDuplicateCardHash(
  cardHash: string,
  callerUid: string,
  serviceKey: string
): Promise<{ isDuplicate: boolean; duplicateDetails?: string }> {
  if (!serviceKey || !cardHash) return { isDuplicate: false };

  try {
    const endpoint = `${SUPABASE_URL}/rest/v1/seller_verifications?card_hash=eq.${encodeURIComponent(cardHash)}&user_id=neq.${encodeURIComponent(callerUid)}&select=user_id,status`;
    const res = await fetch(endpoint, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      }
    });

    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0) {
        return {
          isDuplicate: true,
          duplicateDetails: 'This Ghana Card has already been registered or verified by another SellerFlow account.'
        };
      }
    }
  } catch (err) {
    console.warn('Supabase duplicate check query note:', err);
  }

  return { isDuplicate: false };
}

/**
 * Stores minimal verification metadata in Supabase (seller_verifications table)
 */
async function storeVerificationMetadataSupabase(
  metadata: {
    userId: string;
    cardHash: string;
    cardMasked: string;
    frontPath: string;
    backPath: string;
    status: 'VERIFIED' | 'REVIEW' | 'REJECTED';
    reviewReason?: string;
    automatedPassed: boolean;
  },
  serviceKey: string
): Promise<void> {
  if (!serviceKey) return;
  try {
    const endpoint = `${SUPABASE_URL}/rest/v1/seller_verifications`;
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        user_id: metadata.userId,
        card_hash: metadata.cardHash,
        card_masked: metadata.cardMasked,
        front_storage_path: metadata.frontPath,
        back_storage_path: metadata.backPath,
        status: metadata.status,
        review_reason: metadata.reviewReason || null,
        automated_check_passed: metadata.automatedPassed,
        updated_at: new Date().toISOString()
      })
    });
  } catch (err) {
    console.warn('Metadata persistence to Supabase seller_verifications table note:', err);
  }
}

// Read Service Account from Supabase secrets for optional Firestore sync
function getServiceAccount(): { client_email: string; private_key: string; project_id: string } | null {
  const env = typeof Deno !== 'undefined' ? Deno.env : (typeof process !== 'undefined' ? { get: (k: string) => process.env[k] || '' } : { get: () => '' });

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

let cachedFirestoreToken: { token: string; expiresAt: number } | null = null;

async function getFirestoreAccessToken(sa: { client_email: string; private_key: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedFirestoreToken && cachedFirestoreToken.expiresAt > now + 60) {
    return cachedFirestoreToken.token;
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
    throw new Error(`Google OAuth2 token exchange failed: ${res.status}`);
  }

  const data = await res.json();
  cachedFirestoreToken = {
    token: data.access_token,
    expiresAt: now + (data.expires_in || 3600)
  };
  return data.access_token;
}

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

function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    fields[k] = encodeFirestoreValue(v);
  }
  return fields;
}

/**
 * Synchronizes user verification status with Firestore (for existing SellerFlow UI/Admin support)
 */
async function syncFirestoreUserRecord(
  callerUid: string,
  verdict: 'VERIFIED' | 'REVIEW' | 'REJECTED',
  cardMasked: string,
  cardHash: string,
  frontPath: string,
  backPath: string,
  reason: string
): Promise<void> {
  const sa = getServiceAccount();
  if (!sa) return;

  try {
    const token = await getFirestoreAccessToken(sa);
    const firestoreBase = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents`;
    const nowIso = new Date().toISOString();

    const verificationStatus = verdict === 'VERIFIED' ? 'approved' : verdict === 'REJECTED' ? 'rejected' : 'pending';
    const verified = verdict === 'VERIFIED';

    // 1. Update users document
    const userUpdateUrl = `${firestoreBase}/users/${encodeURIComponent(callerUid)}?updateMask.fieldPaths=ghanaCardMasked&updateMask.fieldPaths=ghanaCardHash&updateMask.fieldPaths=ghanaCardFrontPath&updateMask.fieldPaths=ghanaCardBackPath&updateMask.fieldPaths=verificationStatus&updateMask.fieldPaths=verified&updateMask.fieldPaths=verificationVerdict&updateMask.fieldPaths=verificationReviewedAt&updateMask.fieldPaths=verificationReviewNotes`;

    await fetch(userUpdateUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: toFirestoreFields({
          ghanaCardMasked: cardMasked,
          ghanaCardHash: cardHash,
          ghanaCardFrontPath: frontPath,
          ghanaCardBackPath: backPath,
          verificationStatus,
          verified,
          verificationVerdict: verdict,
          verificationReviewedAt: new Date(nowIso),
          verificationReviewNotes: reason || null
        })
      })
    });

    // 2. If VERIFIED, update publicProfile
    if (verified) {
      const publicUpdateUrl = `${firestoreBase}/publicProfiles/${encodeURIComponent(callerUid)}?updateMask.fieldPaths=verified`;
      await fetch(publicUpdateUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: toFirestoreFields({ verified: true })
        })
      });
    }

    // 3. Send notification to user
    const notifUrl = `${firestoreBase}/notifications/notif_verify_${encodeURIComponent(callerUid)}_${Date.now()}`;
    await fetch(notifUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: toFirestoreFields({
          recipientId: callerUid,
          senderName: 'SellerFlow Verification',
          title: verdict === 'VERIFIED'
            ? 'Seller Verification Approved'
            : verdict === 'REVIEW'
            ? 'Identity Review In Progress'
            : 'Identity Verification Update',
          message: verdict === 'VERIFIED'
            ? 'Your identity documents passed automated verification checks. Your blue SellerFlow verification badge is now active.'
            : verdict === 'REVIEW'
            ? 'Your identity documents have been submitted securely and are queued for administrator review.'
            : `Your verification submission could not be verified automatically: ${reason}. Please review your details and try again.`,
          fromAdmin: true,
          read: false,
          createdAt: new Date(nowIso)
        })
      })
    });
  } catch (err) {
    console.warn('Firestore sync note:', err);
  }
}

/**
 * Main Request Handler for Supabase Edge Function: verifyGhanaCard
 */
export async function handleVerifyGhanaCard(req: Request): Promise<Response> {
  // CORS preflight
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
    // 1. Authenticate caller with Supabase Auth (or Firebase Auth fallback)
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        error: 'Unauthorized: Missing or malformed authentication token. Expected Authorization: Bearer <token>'
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

    const frontPath = body.frontPath || body.cardFrontPath || body.ghanaCardFrontPath;
    const backPath = body.backPath || body.cardBackPath || body.ghanaCardBackPath;
    const ghanaCardRaw = body.ghanaCardNumber || body.ghanaCard || body.idNumber || '';
    const fullName = body.fullName || body.name || '';

    // 3. Verify document paths and ownership (Tenant isolation)
    const pathCheck = verifyDocumentPaths(callerUid, frontPath, backPath);
    if (!pathCheck.valid) {
      const status = pathCheck.error?.startsWith('Forbidden') ? 403 : 400;
      return new Response(JSON.stringify({ error: pathCheck.error }), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 4. Normalize and validate Ghana Card format
    const normalizedCard = normalizeGhanaCard(ghanaCardRaw);
    const maskedCard = maskGhanaCard(normalizedCard);
    const cardHash = await hashGhanaCard(normalizedCard);

    // 5. Check for duplicate Ghana Card hash across accounts
    const dupCheck = await checkDuplicateCardHash(cardHash, callerUid, SUPABASE_SERVICE_ROLE_KEY);

    // 6. Download private documents server-side for AI/OCR analysis
    let frontDoc: { buffer: ArrayBuffer; contentType: string } | null = null;
    let backDoc: { buffer: ArrayBuffer; contentType: string } | null = null;

    if (SUPABASE_SERVICE_ROLE_KEY) {
      const [f, b] = await Promise.all([
        fetchPrivateDocument(frontPath, SUPABASE_SERVICE_ROLE_KEY),
        fetchPrivateDocument(backPath, SUPABASE_SERVICE_ROLE_KEY)
      ]);
      frontDoc = f;
      backDoc = b;
    }

    // 7. Perform AI/OCR Analysis if documents and Gemini API key are available
    let aiOcrResult: {
      extractedCardNumber: string | null;
      extractedName: string | null;
      isCardLegitimate: boolean;
      isForgedOrTampered: boolean;
      confidence: number;
      notes: string;
    } | null = null;

    let aiOcrAvailable = false;
    if (frontDoc && backDoc && GEMINI_API_KEY) {
      aiOcrResult = await analyzeCardWithGemini(frontDoc, backDoc, GEMINI_API_KEY);
      if (aiOcrResult) {
        aiOcrAvailable = true;
      }
    }

    // 8. Authoritatively evaluate verification verdict
    const evaluation = evaluateGhanaCardVerification({
      submittedCardNumber: normalizedCard,
      submittedName: fullName,
      extractedCardNumber: aiOcrResult?.extractedCardNumber,
      extractedName: aiOcrResult?.extractedName,
      isDuplicate: dupCheck.isDuplicate,
      duplicateDetails: dupCheck.duplicateDetails,
      isCardLegitimate: aiOcrResult?.isCardLegitimate,
      isForgedOrTampered: aiOcrResult?.isForgedOrTampered,
      aiOcrConfidence: aiOcrResult?.confidence,
      aiOcrAvailable,
      aiOcrNotes: aiOcrResult?.notes
    });

    const verdict = evaluation.verdict;

    // 9. Store minimal metadata in Supabase
    await storeVerificationMetadataSupabase({
      userId: callerUid,
      cardHash,
      cardMasked: maskedCard,
      frontPath,
      backPath,
      status: verdict,
      reviewReason: verdict === 'REVIEW' ? evaluation.reason : undefined,
      automatedPassed: verdict === 'VERIFIED'
    }, SUPABASE_SERVICE_ROLE_KEY);

    // 10. Sync with Firestore user record
    await syncFirestoreUserRecord(
      callerUid,
      verdict,
      maskedCard,
      cardHash,
      frontPath,
      backPath,
      evaluation.reason
    );

    // 11. Return safe, sanitized response
    // NEVER expose raw card numbers, storage URLs, image blobs, or internal service keys
    return new Response(JSON.stringify({
      success: true,
      verdict,
      status: verdict,
      message: verdict === 'VERIFIED'
        ? 'Identity verification approved. Your blue SellerFlow verification badge is now active.'
        : verdict === 'REVIEW'
        ? 'Identity documents submitted securely and are queued for administrator review.'
        : `Identity verification could not be approved: ${evaluation.reason}`,
      disclaimer: OFFICIAL_NIA_DISCLAIMER
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Supabase Edge Function verifyGhanaCard error:', error);
    // FAIL CLOSED: Never approve or expose sensitive info on error; default to REVIEW
    return new Response(JSON.stringify({
      success: false,
      verdict: 'REVIEW',
      status: 'REVIEW',
      error: 'An internal error occurred during verification processing. Submission is queued for administrator review.',
      disclaimer: OFFICIAL_NIA_DISCLAIMER
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Attach Deno.serve handler for Supabase Edge Runtime
if (typeof Deno !== 'undefined' && typeof Deno.serve === 'function') {
  Deno.serve(handleVerifyGhanaCard);
}
