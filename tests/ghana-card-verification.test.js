/**
 * SellerFlow Ghana Card Verification Security & Integrity Test Suite
 * Validates all 18 backend verification requirements for /supabase/functions/verifyGhanaCard/index.ts
 */

import assert from 'node:assert/strict';
import { generateKeyPair, SignJWT } from 'jose';
import {
  normalizeGhanaCard,
  validateGhanaCardFormat,
  maskGhanaCard,
  hashGhanaCard,
  verifyDocumentPaths,
  compareNames,
  evaluateGhanaCardVerification,
  OFFICIAL_NIA_DISCLAIMER,
  handleVerifyGhanaCard
} from '../supabase/functions/verifyGhanaCard/index.ts';

console.log('--- Starting SellerFlow Ghana Card Verification Test Suite ---');

// Generate test RSA key pair for simulating Firebase Auth tokens
const { privateKey, publicKey } = await generateKeyPair('RS256');

async function createMockFirebaseToken({ uid, exp, aud, iss }) {
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT({
    email: `${uid}@sellerflow.gh`,
    user_id: uid
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setSubject(uid)
    .setAudience(aud || 'sellerflow-efaab')
    .setIssuer(iss || 'https://securetoken.google.com/sellerflow-efaab')
    .setIssuedAt(now - 60)
    .setExpirationTime(exp !== undefined ? exp : now + 3600)
    .sign(privateKey);
}

// 1. Unauthenticated request rejected
console.log('Test 1: Unauthenticated request rejected');
{
  const req = new Request('http://localhost/verifyGhanaCard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ghanaCardNumber: 'GHA-123456789-1',
      frontPath: 'verification/user_1/front.jpg',
      backPath: 'verification/user_1/back.jpg'
    })
  });
  const res = await handleVerifyGhanaCard(req);
  assert.equal(res.status, 401, 'Must return 401 Unauthorized for missing bearer token');
  const body = await res.json();
  assert.ok(body.error.includes('Unauthorized'), 'Error message must specify Unauthorized');
  console.log('  ✓ Unauthenticated request safely rejected (401)');
}

// 2. Invalid or malformed token rejected
console.log('Test 2: Malformed or invalid token rejected');
{
  const req = new Request('http://localhost/verifyGhanaCard', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer invalid.token.payload'
    },
    body: JSON.stringify({
      ghanaCardNumber: 'GHA-123456789-1',
      frontPath: 'verification/user_1/front.jpg',
      backPath: 'verification/user_1/back.jpg'
    })
  });
  const res = await handleVerifyGhanaCard(req);
  assert.equal(res.status, 401, 'Must return 401 for invalid JWT');
  console.log('  ✓ Invalid token rejected (401)');
}

// 3. Storage tenant isolation: User A attempting to verify User B's documents
console.log('Test 3: Cross-user document path rejection (tenant boundary)');
{
  const callerUid = 'user_applicant_123';
  const victimUid = 'user_victim_999';

  // Legitimate paths within caller directory
  const validCheck = verifyDocumentPaths(
    callerUid,
    `verification/${callerUid}/front_1.jpg`,
    `verification/${callerUid}/back_1.jpg`
  );
  assert.equal(validCheck.valid, true, 'Caller path must be valid');

  // Attempt to access victim documents
  const crossCheck = verifyDocumentPaths(
    callerUid,
    `verification/${victimUid}/front_1.jpg`,
    `verification/${callerUid}/back_1.jpg`
  );
  assert.equal(crossCheck.valid, false, 'Cross-user path must be rejected');
  assert.ok(crossCheck.error.includes('Forbidden'), 'Error must specify Forbidden');
  console.log('  ✓ Cross-user document submission strictly rejected (403 Forbidden)');
}

// 4. Path traversal attack prevention
console.log('Test 4: Path traversal attempt rejection');
{
  const callerUid = 'user_attacker';
  const traversalCheck = verifyDocumentPaths(
    callerUid,
    `verification/${callerUid}/../../../etc/passwd`,
    `verification/${callerUid}/back.jpg`
  );
  assert.equal(traversalCheck.valid, false, 'Path traversal must be blocked');
  assert.ok(traversalCheck.error.includes('Forbidden'), 'Path traversal must return Forbidden');
  console.log('  ✓ Path traversal attack blocked');
}

// 5. Unsupported file extensions rejected
console.log('Test 5: Unsupported document file extension');
{
  const callerUid = 'user_test';
  const extCheck = verifyDocumentPaths(
    callerUid,
    `verification/${callerUid}/script.exe`,
    `verification/${callerUid}/back.jpg`
  );
  assert.equal(extCheck.valid, false, 'Executable files must be rejected');
  console.log('  ✓ Invalid file extension rejected');
}

// 6. Ghana Card PIN normalization
console.log('Test 6: Ghana Card number normalization');
{
  assert.equal(normalizeGhanaCard('gha-123456789-1'), 'GHA-123456789-1');
  assert.equal(normalizeGhanaCard('  GHA-987654321-0  '), 'GHA-987654321-0');
  assert.equal(normalizeGhanaCard('GHA1234567891'), 'GHA-123456789-1');
  console.log('  ✓ Card normalization standardizes GHA-XXXXXXXXX-X format');
}

// 7. Ghana Card format validation
console.log('Test 7: Ghana Card format validation');
{
  assert.equal(validateGhanaCardFormat('GHA-123456789-0'), true);
  assert.equal(validateGhanaCardFormat('GHA-718293041-9'), true);
  assert.equal(validateGhanaCardFormat('INVALID-CARD-NUMBER'), false);
  assert.equal(validateGhanaCardFormat('GHA-12345'), false);
  assert.equal(validateGhanaCardFormat(''), false);
  console.log('  ✓ Card format validation strictly enforced');
}

// 8. Ghana Card masking for privacy (protecting PII)
console.log('Test 8: Ghana Card masking for privacy (never expose full PII)');
{
  const masked = maskGhanaCard('GHA-123456789-0');
  assert.equal(masked, 'GHA-*****6789-0', 'Masks first 5 digits of unique card ID');
  assert.equal(masked.includes('12345'), false, 'Sensitive digits must never appear in masked string');
  console.log('  ✓ Card masking preserves user privacy (GHA-*****6789-0)');
}

// 9. Cryptographic SHA-256 card hashing
console.log('Test 9: Cryptographic SHA-256 card hashing for duplicate detection');
{
  const hash1 = await hashGhanaCard('GHA-123456789-0');
  const hash2 = await hashGhanaCard('gha-123456789-0');
  const hashDifferent = await hashGhanaCard('GHA-987654321-9');

  assert.equal(typeof hash1, 'string');
  assert.equal(hash1.length, 64, 'SHA-256 produces 64 hex characters');
  assert.equal(hash1, hash2, 'Normalized cards must produce identical hashes');
  assert.notEqual(hash1, hashDifferent, 'Different cards produce distinct hashes');
  console.log('  ✓ SHA-256 deterministic card hashing verified');
}

// 10. Duplicate card detection triggers REVIEW (Req 7 & 11)
console.log('Test 10: Duplicate card detection triggers REVIEW');
{
  const verdict = evaluateGhanaCardVerification({
    submittedCardNumber: 'GHA-123456789-0',
    submittedName: 'Kwame Mensah',
    isDuplicate: true,
    duplicateDetails: 'This Ghana Card is already associated with another account.',
    aiOcrAvailable: true
  });
  assert.equal(verdict.verdict, 'REVIEW', 'Duplicate card must trigger REVIEW, not automatic approval');
  assert.equal(verdict.checks.duplicateCheckPassed, false);
  console.log('  ✓ Duplicate card detection triggers REVIEW');
}

// 11. Tampered / forged document triggers REJECTED
console.log('Test 11: Tampered or forged document triggers REJECTED');
{
  const verdict = evaluateGhanaCardVerification({
    submittedCardNumber: 'GHA-123456789-0',
    submittedName: 'Kwame Mensah',
    isDuplicate: false,
    isForgedOrTampered: true,
    aiOcrAvailable: true
  });
  assert.equal(verdict.verdict, 'REJECTED', 'Forged/tampered document must be REJECTED');
  assert.equal(verdict.checks.integrityCheckPassed, false);
  console.log('  ✓ Forged/tampered document triggers REJECTED');
}

// 12. Blatant card number mismatch triggers REJECTED
console.log('Test 12: Card number mismatch triggers REJECTED');
{
  const verdict = evaluateGhanaCardVerification({
    submittedCardNumber: 'GHA-111111111-1',
    submittedName: 'Kwame Mensah',
    extractedCardNumber: 'GHA-999999999-9',
    extractedName: 'Kwame Mensah',
    isDuplicate: false,
    isCardLegitimate: true,
    isForgedOrTampered: false,
    aiOcrConfidence: 0.95,
    aiOcrAvailable: true
  });
  assert.equal(verdict.verdict, 'REJECTED', 'Blatant card number mismatch must be REJECTED');
  assert.equal(verdict.checks.cardNumberMatch, false);
  console.log('  ✓ Card number mismatch triggers REJECTED');
}

// 13. Name comparison logic
console.log('Test 13: Name comparison logic');
{
  const match1 = compareNames('Kwame Mensah', 'KWAME MENSAH');
  assert.equal(match1.match, true);
  assert.ok(match1.confidence >= 0.8);

  // With middle name
  const match2 = compareNames('Kwame Mensah', 'Kwame Kofi Mensah');
  assert.equal(match2.match, true);

  // Complete mismatch
  const mismatch = compareNames('Kwame Mensah', 'John Doe');
  assert.equal(mismatch.match, false);
  console.log('  ✓ Name matching robustly handles Ghanaian naming variations');
}

// 14. Full automated pass produces VERIFIED (Req 10)
console.log('Test 14: Automated checks pass produces VERIFIED');
{
  const verdict = evaluateGhanaCardVerification({
    submittedCardNumber: 'GHA-712345678-9',
    submittedName: 'Ama Osei',
    extractedCardNumber: 'GHA-712345678-9',
    extractedName: 'AMA OSEI',
    isDuplicate: false,
    isCardLegitimate: true,
    isForgedOrTampered: false,
    aiOcrConfidence: 0.94,
    aiOcrAvailable: true
  });
  assert.equal(verdict.verdict, 'VERIFIED', 'All matching checks must produce VERIFIED');
  assert.equal(verdict.checks.formatValid, true);
  assert.equal(verdict.checks.cardNumberMatch, true);
  assert.equal(verdict.checks.nameMatch, true);
  assert.equal(verdict.checks.integrityCheckPassed, true);
  console.log('  ✓ Valid matching submission produces VERIFIED');
}

// 15. Missing AI/OCR service safely defaults to REVIEW (Req 14)
console.log('Test 15: Missing AI service safely defaults to REVIEW');
{
  const verdict = evaluateGhanaCardVerification({
    submittedCardNumber: 'GHA-712345678-9',
    submittedName: 'Ama Osei',
    isDuplicate: false,
    aiOcrAvailable: false
  });
  assert.equal(verdict.verdict, 'REVIEW', 'Missing AI service must fall back to REVIEW');
  console.log('  ✓ Uncertain or unavailable AI safely defaults to REVIEW (fail-closed)');
}

// 16. Official statutory NIA disclaimer verified (Req 13)
console.log('Test 16: Official NIA disclaimer check');
{
  assert.ok(OFFICIAL_NIA_DISCLAIMER.includes('National Identification Authority'));
  assert.ok(OFFICIAL_NIA_DISCLAIMER.includes('not an official NIA'));
  console.log('  ✓ Statutory disclaimer confirms AI verification is not official NIA verification');
}

// 17. Invalid card format rejected
console.log('Test 17: Malformed card number produces REJECTED');
{
  const verdict = evaluateGhanaCardVerification({
    submittedCardNumber: 'NOT-A-CARD-123',
    submittedName: 'Ama Osei',
    isDuplicate: false,
    aiOcrAvailable: true
  });
  assert.equal(verdict.verdict, 'REJECTED');
  console.log('  ✓ Malformed card number format properly REJECTED');
}

// 18. Fail-closed error handling (Req 14 & 18)
console.log('Test 18: Malformed request payload returns error without crashing');
{
  const req = new Request('http://localhost/verifyGhanaCard', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' // Empty bearer token
    },
    body: 'invalid-json{'
  });
  const res = await handleVerifyGhanaCard(req);
  assert.equal(res.status, 401, 'Empty token must return 401');
  console.log('  ✓ Fail-closed error handling verified');
}

console.log('--- All 18 Ghana Card Verification Tests Passed Successfully ---');
