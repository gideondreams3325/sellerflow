const fs = require('fs');
const path = require('path');

const markerStart = '/* Username normalization helper */';
const markerEnd = '/* Send Modern Professional Verification Code via Email */';

let code = fs.readFileSync('server.js', 'utf8');
const idxStart = code.indexOf(markerStart);
const idxEnd = code.indexOf(markerEnd);

if (idxStart === -1 || idxEnd === -1) {
  console.error('Markers not found!');
  process.exit(1);
}

const replacement = `/* Username normalization helper */
function usernameClean(v) {
  return String(v || '').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24);
}

/* In-memory fallback caches for verification codes and rate limits */
const emailVerificationsCache = new Map();
const phoneVerificationsCache = new Map();
const passwordResetCodesCache = new Map();
const passwordResetRateLimits = new Map(); // usernameClean -> lastSentTimestamp

/* Persistent local accounts registry (fallback when Firestore is uncredentialed in container) */
const ACCOUNTS_STORE_PATH = path.join(__dirname, 'data', 'registered_accounts.json');
const localAccountsMap = new Map();

function loadAccountsStore() {
  try {
    if (fs.existsSync(ACCOUNTS_STORE_PATH)) {
      const raw = fs.readFileSync(ACCOUNTS_STORE_PATH, 'utf8');
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        for (const item of arr) {
          if (item && item.usernameLower) {
            localAccountsMap.set(item.usernameLower, item);
          }
        }
      }
    }
  } catch (e) {
    console.warn('Error loading registered_accounts.json:', e.message);
  }
}

function persistAccountsStore() {
  try {
    const arr = Array.from(localAccountsMap.values());
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(ACCOUNTS_STORE_PATH, JSON.stringify(arr, null, 2), 'utf8');
  } catch (e) {
    console.warn('Error persisting registered_accounts.json:', e.message);
  }
}

function saveAccountRecord(account) {
  if (!account) return;
  const username = account.username || account.usernameLower;
  if (!username) return;
  const uClean = usernameClean(username);
  if (!uClean) return;
  const existing = localAccountsMap.get(uClean) || {};
  const updated = {
    ...existing,
    ...account,
    username: account.username || existing.username || uClean,
    usernameLower: uClean,
    updatedAt: new Date().toISOString()
  };
  localAccountsMap.set(uClean, updated);
  persistAccountsStore();
  return updated;
}

loadAccountsStore();

/* Password Hashing using PBKDF2 with SHA-512 */
function hashPassword(password, salt) {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, s, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: s };
}

function verifyPassword(password, storedHash, storedSalt) {
  if (!password || !storedHash || !storedSalt) return false;
  const testHash = crypto.pbkdf2Sync(password, storedSalt, 10000, 64, 'sha512').toString('hex');
  return testHash === storedHash;
}

/**
 * Mask recovery email (e.g. gideondreams3325@gmail.com -> g***@gmail.com)
 * Protects user privacy during recovery workflows.
 */
function maskEmail(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) return null;
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) return null;
  const [localPart, domain] = parts;
  if (!localPart || !domain) return null;
  const firstChar = localPart.charAt(0);
  return firstChar + '***@' + domain;
}

let cachedMailTransporter = null;

/**
 * Authoritative Mail Transporter
 * Returns a live transporter if real SMTP credentials are provided, or null.
 * Never creates ephemeral test inboxes that mislead users.
 */
async function getMailTransporter() {
  if (cachedMailTransporter) {
    return cachedMailTransporter;
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: parseInt(process.env.SMTP_PORT || '587') === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000
      });
      cachedMailTransporter = transporter;
      return transporter;
    } catch (e) {
      console.warn('Custom SMTP initialization notice:', e.message);
      return null;
    }
  }

  return null;
}

/**
 * Sends recovery or verification message.
 * Accurately reports whether message was sent.
 */
async function sendRecoveryEmail({ to, username, code, type = 'reset', name = '' }) {
  if (!to || typeof to !== 'string' || !to.includes('@')) {
    console.warn('[sendRecoveryEmail] Invalid recipient email:', to);
    return { sent: false, error: 'Invalid recipient email.', to, username, code };
  }

  const cleanTo = to.trim().toLowerCase();
  const displayName = name || (username ? ('@' + username) : 'SellerFlow Merchant');
  const isVerify = type === 'verify' || type === 'account_verify';
  const fromAddress = process.env.SMTP_FROM || (process.env.SMTP_USER ? ('"SellerFlow Security" <' + process.env.SMTP_USER + '>') : '"SellerFlow Security" <noreply@sellerflow-efaab.firebaseapp.com>');
  const subject = isVerify ? "Verify your SellerFlow Recovery Email" : "Reset your SellerFlow Password";
  const headerSubtitle = isVerify ? "Recovery Email Verification" : "Password Recovery";
  const headingTitle = isVerify ? "Verify your recovery email" : "Reset your password";
  const messageBody = isVerify
    ? "Thank you for securing your SellerFlow account. To verify your recovery email and protect your account, please enter the following single-use 6-digit verification code in the app:"
    : "We received a request to reset your SellerFlow account password. Enter this single-use 6-digit recovery code in the app to set a new password:";

  const html = '<!DOCTYPE html><html><head>' +
  '<meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
  '<title>' + subject + '</title>' +
'</head><body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;color:#111111;">' +
  '<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f9fafb;padding:40px 10px;">' +
    '<tr><td align="center">' +
      '<table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:500px;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.05);">' +
        '<tr><td style="background:linear-gradient(135deg,#f5b942 0%,#d49a2a 100%);padding:28px 20px;text-align:center;">' +
          '<h1 style="margin:0;font-size:24px;font-weight:900;color:#000000;text-transform:uppercase;letter-spacing:-0.02em;">SellerFlow</h1>' +
          '<p style="margin:4px 0 0 0;font-size:12px;font-weight:700;color:rgba(0,0,0,0.75);text-transform:uppercase;letter-spacing:0.05em;">' + headerSubtitle + '</p>' +
        '</td></tr>' +
        '<tr><td style="padding:32px 28px;">' +
          '<h2 style="margin:0 0 16px 0;font-size:18px;font-weight:700;color:#111827;">' + headingTitle + '</h2>' +
          '<p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#4b5563;">Hello <strong>' + displayName + '</strong>,</p>' +
          '<p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#4b5563;">' + messageBody + '</p>' +
          '<table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;">' +
            '<tr><td align="center">' +
              '<div style="background-color:#fef3c7;border:2px solid #f5b942;border-radius:12px;padding:16px 28px;display:inline-block;">' +
                '<span style="font-family:\'Courier New\',Courier,monospace;font-size:32px;font-weight:800;letter-spacing:8px;color:#000000;">' + code + '</span>' +
              '</div>' +
            '</td></tr>' +
          '</table>' +
          '<p style="margin:0 0 12px 0;font-size:12px;color:#6b7280;text-align:center;">This code expires in 10 minutes. Never share this code with anyone.</p>' +
          '<hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0;">' +
          '<p style="margin:0;font-size:11px;line-height:1.5;color:#9ca3af;text-align:center;">If you did not request this, your account is safe and you can safely ignore this email.</p>' +
        '</td></tr>' +
        '<tr><td style="padding:16px 28px;background-color:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">' +
          '<p style="margin:0;font-size:11px;color:#6b7280;">&copy; 2026 SellerFlow Ghana · All Rights Reserved</p>' +
        '</td></tr>' +
      '</table>' +
    '</td></tr>' +
  '</table>' +
'</body></html>';

  console.log('\n==============================================');
  console.log('[EMAIL DISPATCH: ' + type.toUpperCase() + ']');
  console.log('To: ' + cleanTo);
  console.log('Username: @' + (username || 'N/A'));
  console.log('Code: ' + code);
  console.log('Time: ' + new Date().toISOString());
  console.log('==============================================\n');

  const transporter = await getMailTransporter();
  if (!transporter) {
    console.warn('[sendRecoveryEmail] SMTP not configured. Real email could not be sent to: ' + cleanTo);
    return {
      sent: false,
      configured: false,
      to: cleanTo,
      username,
      code,
      error: 'Email delivery is not configured on the server. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in your environment.'
    };
  }

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: cleanTo,
      subject,
      html,
      text: 'SellerFlow ' + headerSubtitle + '\n\nHello ' + displayName + ',\n\nYour 6-digit code is: ' + code + '\n\nThis single-use code expires in 10 minutes. Never share it with anyone.'
    });
    console.log('[sendRecoveryEmail] Successfully delivered email to ' + cleanTo + ' (Message ID: ' + info.messageId + ')');
    return { sent: true, to: cleanTo, username, code, messageId: info.messageId };
  } catch (sendErr) {
    console.error('[sendRecoveryEmail] SMTP delivery failed for ' + cleanTo + ':', sendErr.message);
    return {
      sent: false,
      configured: true,
      to: cleanTo,
      username,
      code,
      error: 'Failed to deliver email through SMTP server: ' + sendErr.message
    };
  }
}

/**
 * Helper to resolve an account by identifier (username or existing email).
 * Automatically migrates existing account email -> recoveryEmail preserving emailVerified state.
 */
async function resolveAccountForAuth(identifier) {
  if (!identifier) return null;
  const raw = String(identifier).trim();
  const uClean = usernameClean(raw);
  const rawLower = raw.toLowerCase();

  // 1. Primary admin account mapping
  if (uClean === 'sellerflow' || uClean === 'gideon' || uClean === 'gideondreams' || rawLower === 'gideondreams3325@gmail.com') {
    return {
      uid: 'admin_gideon',
      authEmail: 'gideondreams3325@gmail.com',
      recoveryEmail: 'gideondreams3325@gmail.com',
      recoveryEmailVerified: true,
      username: 'sellerflow',
      isAdmin: true,
      isExisting: true
    };
  }

  const extractMigratedEmail = (d) => {
    let recEmail = d.recoveryEmail || null;
    let recVerified = Boolean(d.recoveryEmailVerified);
    const existingEmail = d.email || d.authEmail || null;
    if (!recEmail && existingEmail && typeof existingEmail === 'string' && existingEmail.includes('@') && !existingEmail.endsWith('@users.sellerflow.internal')) {
      recEmail = existingEmail.toLowerCase().trim();
      recVerified = Boolean(d.emailVerified === true);
    } else if (recEmail && d.emailVerified === true && !d.recoveryEmailVerified) {
      recVerified = true;
    }
    return { recEmail, recVerified };
  };

  // 2. Check local accounts registry
  if (uClean && localAccountsMap.has(uClean)) {
    const d = localAccountsMap.get(uClean);
    const { recEmail, recVerified } = extractMigratedEmail(d);
    return {
      uid: d.uid,
      authEmail: d.authEmail || (uClean + '@users.sellerflow.internal'),
      recoveryEmail: recEmail,
      recoveryEmailVerified: recVerified,
      username: d.username || uClean,
      passwordHash: d.passwordHash,
      passwordSalt: d.passwordSalt,
      isExisting: true,
      isAdmin: Boolean(d.isAdmin || isUserAdminEmail(recEmail) || isUserAdminEmail(d.authEmail))
    };
  }

  // 3. Lookup in registeredUsernames registry
  if (uClean) {
    try {
      const docSnap = await adminDb.collection('registeredUsernames').doc(uClean).get();
      if (docSnap.exists) {
        const d = docSnap.data() || {};
        const { recEmail, recVerified } = extractMigratedEmail(d);
        const acc = {
          uid: d.uid,
          authEmail: d.authEmail || (uClean + '@users.sellerflow.internal'),
          recoveryEmail: recEmail,
          recoveryEmailVerified: recVerified,
          username: d.username || uClean,
          isExisting: true
        };
        saveAccountRecord(acc);
        return acc;
      }
    } catch (_) {}
  }

  // 4. Lookup in publicProfiles
  if (uClean) {
    try {
      const pubSnap = await adminDb.collection('publicProfiles')
        .where('usernameLower', '==', uClean)
        .limit(1)
        .get();
      if (!pubSnap.empty) {
        const doc = pubSnap.docs[0];
        const d = doc.data() || {};
        const { recEmail, recVerified } = extractMigratedEmail(d);
        const acc = {
          uid: doc.id,
          authEmail: d.authEmail || d.email || (uClean + '@users.sellerflow.internal'),
          recoveryEmail: recEmail,
          recoveryEmailVerified: recVerified,
          username: d.username || uClean,
          isExisting: true
        };
        saveAccountRecord(acc);
        return acc;
      }
    } catch (_) {}
  }

  // 5. Lookup in users collection
  if (uClean) {
    try {
      const uSnap = await adminDb.collection('users')
        .where('usernameLower', '==', uClean)
        .limit(1)
        .get();
      if (!uSnap.empty) {
        const doc = uSnap.docs[0];
        const d = doc.data() || {};
        const { recEmail, recVerified } = extractMigratedEmail(d);
        const acc = {
          uid: doc.id,
          authEmail: d.authEmail || d.email || (uClean + '@users.sellerflow.internal'),
          recoveryEmail: recEmail,
          recoveryEmailVerified: recVerified,
          username: d.username || uClean,
          isExisting: true
        };
        saveAccountRecord(acc);
        return acc;
      }
    } catch (_) {}
  }

  // 6. Lookup by email
  if (rawLower.includes('@')) {
    for (const d of localAccountsMap.values()) {
      if ((d.recoveryEmail && d.recoveryEmail.toLowerCase() === rawLower) || (d.authEmail && d.authEmail.toLowerCase() === rawLower)) {
        const { recEmail, recVerified } = extractMigratedEmail(d);
        return {
          uid: d.uid,
          authEmail: d.authEmail || rawLower,
          recoveryEmail: recEmail,
          recoveryEmailVerified: recVerified,
          username: d.username || d.usernameLower,
          passwordHash: d.passwordHash,
          passwordSalt: d.passwordSalt,
          isExisting: true,
          isAdmin: Boolean(d.isAdmin || isUserAdminEmail(recEmail) || isUserAdminEmail(d.authEmail))
        };
      }
    }
  }

  return {
    uid: null,
    authEmail: rawLower.includes('@') ? rawLower : (uClean + '@users.sellerflow.internal'),
    recoveryEmail: rawLower.includes('@') ? rawLower : null,
    recoveryEmailVerified: false,
    username: uClean,
    isExisting: false
  };
}

/**
 * Helper to lookup account identifier before authentication
 */
app.post(['/api/auth/lookup-identifier', '/api/auth/lookup'], async (req, res) => {
  try {
    const { identifier, username, email } = req.body || {};
    const input = String(identifier || username || email || '').trim();
    if (!input) {
      return res.status(400).json({ success: false, error: 'Identifier is required.' });
    }
    const account = await resolveAccountForAuth(input);
    if (!account) {
      return res.json({ success: true, exists: false });
    }
    return res.json({
      success: true,
      exists: true,
      username: account.username,
      hasRecoveryEmail: Boolean(account.recoveryEmail),
      recoveryEmailVerified: Boolean(account.recoveryEmailVerified),
      maskedRecoveryEmail: maskEmail(account.recoveryEmail)
    });
  } catch (err) {
    console.error('Lookup identifier error:', err);
    return res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' });
  }
});

/**
 * Authoritative SellerFlow Username + Password Login Endpoint
 */
app.post(['/api/auth/login-username', '/api/auth/login'], async (req, res) => {
  try {
    const { username, identifier, password } = req.body || {};
    const inputIdentifier = String(username || identifier || '').trim();
    const inputPassword = String(password || '');

    if (!inputIdentifier || !inputPassword) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        error: 'Username and password are required.'
      });
    }

    const account = await resolveAccountForAuth(inputIdentifier);
    if (!account || !account.authEmail) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        error: 'Username or password is incorrect.'
      });
    }

    let authResult = null;
    let successfulEmail = null;

    // 1. Verify against local PBKDF2 hash if present
    if (account.passwordHash && account.passwordSalt) {
      if (verifyPassword(inputPassword, account.passwordHash, account.passwordSalt)) {
        authResult = {
          success: true,
          localId: account.uid,
          email: account.authEmail || (usernameClean(inputIdentifier) + '@users.sellerflow.internal')
        };
        successfulEmail = account.authEmail || (usernameClean(inputIdentifier) + '@users.sellerflow.internal');
      }
    }

    // 2. Verify with Firebase Identity Toolkit
    if (!authResult || !authResult.success) {
      const verifyWithFirebase = async (emailToTry) => {
        const apiKey = process.env.FIREBASE_API_KEY || 'AIzaSyCyEdrUXAfgThfpStPY-Yvz8BG3LrhYuWk';
        if (!emailToTry || !apiKey) return null;
        try {
          const resp = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailToTry, password: inputPassword, returnSecureToken: true })
          });
          const data = await resp.json();
          if (resp.ok && data.localId) {
            return { success: true, localId: data.localId, idToken: data.idToken, refreshToken: data.refreshToken, email: data.email };
          }
          return { success: false, error: data.error?.message || 'INVALID_CREDENTIALS' };
        } catch (e) {
          return { success: false, error: e.message };
        }
      };

      const emailsToTry = [
        account.authEmail,
        account.recoveryEmail,
        (usernameClean(inputIdentifier) + '@users.sellerflow.internal')
      ].filter((em, idx, arr) => em && typeof em === 'string' && em.includes('@') && arr.indexOf(em) === idx);

      for (const em of emailsToTry) {
        const resAttempt = await verifyWithFirebase(em);
        if (resAttempt && resAttempt.success) {
          authResult = resAttempt;
          successfulEmail = em;
          break;
        }
      }
    }

    if (!authResult || !authResult.success) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        error: 'Username or password is incorrect.'
      });
    }

    // Store verified password hash for offline/authoritative durability
    if (!account.passwordHash) {
      const { hash, salt } = hashPassword(inputPassword);
      account.passwordHash = hash;
      account.passwordSalt = salt;
    }

    const targetUid = authResult.localId || account.uid;
    const isUserAdmin = isUserAdminEmail(successfulEmail) || isUserAdminEmail(account.recoveryEmail) || account.isAdmin;
    const uClean = usernameClean(account.username || inputIdentifier);

    saveAccountRecord({
      ...account,
      uid: targetUid,
      username: account.username || uClean,
      authEmail: successfulEmail,
      recoveryEmail: account.recoveryEmail || (successfulEmail && !successfulEmail.endsWith('@users.sellerflow.internal') ? successfulEmail : null),
      recoveryEmailVerified: Boolean(account.recoveryEmailVerified),
      isAdmin: Boolean(isUserAdmin)
    });

    const customToken = await safeCreateCustomToken(targetUid, {
      admin: Boolean(isUserAdmin),
      username: account.username || uClean
    });

    return res.json({
      success: true,
      customToken,
      idToken: authResult.idToken,
      refreshToken: authResult.refreshToken,
      authEmail: successfulEmail,
      email: successfulEmail,
      uid: targetUid,
      username: account.username || uClean,
      recoveryEmail: account.recoveryEmail || null,
      recoveryEmailVerified: Boolean(account.recoveryEmailVerified),
      isAdmin: Boolean(isUserAdmin)
    });
  } catch (err) {
    console.error('Username login endpoint error:', err);
    return res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      error: 'Something went wrong. Please try again.'
    });
  }
});

/**
 * SellerFlow User Registration Endpoint
 * Required fields: Username & Password ONLY. Recovery Email is strictly optional.
 */
app.post(['/api/auth/register', '/api/auth/register-username'], async (req, res) => {
  try {
    const { username, recoveryEmail, password } = req.body || {};
    const uClean = usernameClean(username);
    if (!uClean || uClean.length < 3) {
      return res.status(400).json({ success: false, error: 'Username must be at least 3 characters and contain only letters, numbers, or underscores.' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
    }

    let recEmailLower = null;
    if (recoveryEmail && typeof recoveryEmail === 'string' && recoveryEmail.trim().length > 0) {
      const emailTrim = recoveryEmail.trim().toLowerCase();
      if (!emailTrim.includes('@') || !emailTrim.includes('.')) {
        return res.status(400).json({ success: false, error: 'If provided, a valid recovery email format is required.' });
      }
      recEmailLower = emailTrim;
    }

    if (uClean === 'sellerflow' && !isUserAdminEmail(recEmailLower)) {
      return res.status(400).json({ success: false, error: 'The username "sellerflow" is reserved.' });
    }

    let usernameTaken = localAccountsMap.has(uClean);
    if (!usernameTaken) {
      try {
        const regDoc = await adminDb.collection('registeredUsernames').doc(uClean).get();
        if (regDoc.exists) usernameTaken = true;
      } catch (_) {}
    }
    if (!usernameTaken) {
      try {
        const pubSnap = await adminDb.collection('publicProfiles').where('usernameLower', '==', uClean).limit(1).get();
        if (!pubSnap.empty) usernameTaken = true;
      } catch (_) {}
    }
    if (usernameTaken) {
      return res.status(400).json({ success: false, error: 'The username @' + uClean + ' is already taken. Please choose another.' });
    }

    if (recEmailLower) {
      for (const acc of localAccountsMap.values()) {
        if (acc.recoveryEmail === recEmailLower && acc.recoveryEmailVerified) {
          return res.status(400).json({ success: false, error: 'That recovery email is already attached to a verified account.' });
        }
      }
    }

    const internalAuthEmail = uClean + '@users.sellerflow.internal';

    // Create Firebase Auth user
    let userRecord = null;
    const apiKey = process.env.FIREBASE_API_KEY || 'AIzaSyCyEdrUXAfgThfpStPY-Yvz8BG3LrhYuWk';
    try {
      const restResp = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + apiKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: internalAuthEmail, password: password, returnSecureToken: true })
      });
      const restData = await restResp.json();
      if (restResp.ok && restData.localId) {
        userRecord = { uid: restData.localId, idToken: restData.idToken, refreshToken: restData.refreshToken, email: restData.email };
      }
    } catch (_) {}

    if (!userRecord) {
      try {
        userRecord = await adminAuth.createUser({
          email: internalAuthEmail,
          password: password,
          displayName: username.trim(),
          emailVerified: false
        });
      } catch (authErr) {
        if (authErr.code === 'auth/email-already-exists') {
          try {
            userRecord = await adminAuth.getUserByEmail(internalAuthEmail);
            await adminAuth.updateUser(userRecord.uid, { password: password, displayName: username.trim() });
          } catch (_) {
            return res.status(400).json({ success: false, error: 'Username is already in use in the authentication directory.' });
          }
        } else {
          const fallbackUid = 'sf_' + crypto.createHash('sha256').update(internalAuthEmail).digest('hex').slice(0, 24);
          userRecord = { uid: fallbackUid };
        }
      }
    }

    const uid = userRecord.uid;
    const isAdmin = isUserAdminEmail(recEmailLower) || isUserAdminEmail(internalAuthEmail);
    const { hash: pHash, salt: pSalt } = hashPassword(password);

    saveAccountRecord({
      uid,
      id: uid,
      username: username.trim(),
      usernameLower: uClean,
      name: username.trim(),
      recoveryEmail: recEmailLower,
      recoveryEmailVerified: false,
      authEmail: internalAuthEmail,
      emailVerified: false,
      role: isAdmin ? 'admin' : 'seller',
      verified: isAdmin,
      passwordHash: pHash,
      passwordSalt: pSalt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    try {
      await adminDb.collection('users').doc(uid).set({
        uid,
        id: uid,
        username: username.trim(),
        usernameLower: uClean,
        name: username.trim(),
        recoveryEmail: recEmailLower,
        recoveryEmailVerified: false,
        email: recEmailLower,
        authEmail: internalAuthEmail,
        emailVerified: false,
        role: isAdmin ? 'admin' : 'seller',
        verified: isAdmin,
        subscription: 'FREE',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });

      await adminDb.collection('publicProfiles').doc(uid).set({
        uid,
        id: uid,
        username: username.trim(),
        usernameLower: uClean,
        name: username.trim(),
        role: isAdmin ? 'admin' : 'seller',
        verified: isAdmin,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });

      await adminDb.collection('registeredUsernames').doc(uClean).set({
        uid,
        username: username.trim(),
        authEmail: internalAuthEmail,
        recoveryEmail: recEmailLower,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (_) {}

    const customToken = await safeCreateCustomToken(uid, {
      username: uClean,
      email: recEmailLower || internalAuthEmail,
      admin: isAdmin
    });

    return res.json({
      success: true,
      uid,
      username: uClean,
      authEmail: internalAuthEmail,
      recoveryEmail: recEmailLower,
      recoveryEmailVerified: false,
      customToken,
      idToken: userRecord.idToken,
      refreshToken: userRecord.refreshToken,
      message: 'Account created successfully.'
    });
  } catch (err) {
    console.error('Registration API error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Add / Update Recovery Email Endpoint
 * Dispatches a 6-digit verification code to the recovery email.
 */
app.post(['/api/auth/add-recovery-email', '/api/auth/send-recovery-code'], async (req, res) => {
  try {
    const { email, recoveryEmail, username, uid: reqUid } = req.body || {};
    const inputEmail = String(recoveryEmail || email || '').trim().toLowerCase();
    if (!inputEmail || !inputEmail.includes('@') || !inputEmail.includes('.')) {
      return res.status(400).json({ success: false, error: 'Please enter a valid recovery email address.' });
    }

    let targetUid = reqUid || null;
    let targetUsername = username ? usernameClean(username) : null;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      try {
        const dec = await verifyFirebaseToken(req.headers.authorization.slice(7).trim());
        if (dec?.uid) targetUid = dec.uid;
      } catch (_) {}
    }

    let account = null;
    if (targetUsername) account = await resolveAccountForAuth(targetUsername);
    if (!account && targetUid) {
      account = Array.from(localAccountsMap.values()).find(a => a.uid === targetUid);
      if (!account) {
        try {
          const snap = await adminDb.collection('users').doc(targetUid).get();
          if (snap.exists) account = snap.data();
        } catch (_) {}
      }
    }

    if (!account && !targetUid) {
      return res.status(401).json({ success: false, error: 'You must be signed in to add a recovery email.' });
    }

    const uid = account?.uid || targetUid;
    const uClean = usernameClean(account?.username || targetUsername || 'user');

    // Rule: cannot add an email already verified on a different account
    for (const other of localAccountsMap.values()) {
      if (other.usernameLower !== uClean && other.recoveryEmail === inputEmail && other.recoveryEmailVerified) {
        return res.status(400).json({ success: false, error: 'This recovery email is already verified on another SellerFlow account.' });
      }
    }

    // Rate limiting: 45s cooldown
    const rateLimitKey = 'rec_' + uClean;
    const now = Date.now();
    const lastSent = passwordResetRateLimits.get(rateLimitKey) || 0;
    if (now - lastSent < 45000) {
      const waitSecs = Math.ceil((45000 - (now - lastSent)) / 1000);
      return res.status(429).json({
        success: false,
        error: 'Please wait ' + waitSecs + 's before requesting another verification code.',
        cooldownSeconds: waitSecs
      });
    }

    // Save as unverified pending
    saveAccountRecord({
      uid,
      username: uClean,
      recoveryEmail: inputEmail,
      recoveryEmailVerified: false
    });

    try {
      await adminDb.collection('users').doc(uid).set({
        recoveryEmail: inputEmail,
        recoveryEmailVerified: false,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (_) {}

    const code = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = now + 10 * 60 * 1000; // 10 minutes

    const verificationPayload = {
      code,
      email: inputEmail,
      username: uClean,
      uid,
      expiresAt,
      attempts: 0
    };

    emailVerificationsCache.set(uClean, verificationPayload);
    emailVerificationsCache.set(uid, verificationPayload);
    emailVerificationsCache.set(inputEmail, verificationPayload);
    passwordResetRateLimits.set(rateLimitKey, now);

    try {
      await adminDb.collection('emailVerifications').doc(uid).set({
        code,
        email: inputEmail,
        username: uClean,
        expiresAt,
        attempts: 0,
        createdAt: FieldValue.serverTimestamp()
      });
    } catch (_) {}

    const mailResult = await sendRecoveryEmail({
      to: inputEmail,
      username: uClean,
      code,
      type: 'verify'
    });

    const masked = maskEmail(inputEmail);

    if (!mailResult.sent) {
      if (mailResult.configured === false) {
        return res.status(503).json({
          success: false,
          configured: false,
          maskedEmail: masked,
          error: 'Email delivery is not configured on the server. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in your environment.',
          devCode: (process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEV_CODES === 'true') ? code : undefined
        });
      }
      return res.status(503).json({
        success: false,
        configured: true,
        maskedEmail: masked,
        error: "We couldn't send the verification email right now. Please try again later.",
        devCode: (process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEV_CODES === 'true') ? code : undefined
      });
    }

    return res.json({
      success: true,
      maskedEmail: masked,
      message: 'Verification code sent to ' + masked + '. Check your inbox and spam folder.',
      devCode: (process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEV_CODES === 'true') ? code : undefined
    });
  } catch (err) {
    console.error('Add recovery email error:', err);
    return res.status(500).json({ success: false, error: 'Unable to send verification code. Please try again.' });
  }
});

/**
 * Verify Recovery Email Code Endpoint
 * Marks recovery email verified ONLY after valid single-use code is verified.
 */
app.post(['/api/auth/verify-recovery-email', '/api/auth/verify-recovery-code'], async (req, res) => {
  try {
    const { code, email, username, uid: reqUid } = req.body || {};
    const inputCode = String(code || '').trim();
    if (!inputCode) {
      return res.status(400).json({ success: false, error: 'Verification code is required.' });
    }

    let targetUid = reqUid || null;
    let targetUsername = username ? usernameClean(username) : null;
    let targetEmail = email ? String(email).trim().toLowerCase() : null;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      try {
        const dec = await verifyFirebaseToken(req.headers.authorization.slice(7).trim());
        if (dec?.uid) targetUid = dec.uid;
      } catch (_) {}
    }

    let verificationData = null;
    if (targetUsername) verificationData = emailVerificationsCache.get(targetUsername);
    if (!verificationData && targetUid) verificationData = emailVerificationsCache.get(targetUid);
    if (!verificationData && targetEmail) verificationData = emailVerificationsCache.get(targetEmail);

    if (!verificationData && targetUid) {
      try {
        const snap = await adminDb.collection('emailVerifications').doc(targetUid).get();
        if (snap.exists) verificationData = snap.data();
      } catch (_) {}
    }

    if (!verificationData) {
      return res.status(400).json({ success: false, error: 'No verification code was pending or code has expired. Please request a new code.' });
    }

    const expTime = verificationData.expiresAt?.toDate ? verificationData.expiresAt.toDate().getTime() : verificationData.expiresAt;
    if (Date.now() > expTime) {
      if (targetUsername) emailVerificationsCache.delete(targetUsername);
      if (targetUid) emailVerificationsCache.delete(targetUid);
      if (verificationData.email) emailVerificationsCache.delete(verificationData.email);
      return res.status(410).json({ success: false, error: 'Verification code has expired. Please request a new code.' });
    }

    if (verificationData.attempts >= 5) {
      if (targetUsername) emailVerificationsCache.delete(targetUsername);
      if (targetUid) emailVerificationsCache.delete(targetUid);
      if (verificationData.email) emailVerificationsCache.delete(verificationData.email);
      return res.status(400).json({ success: false, error: 'Too many incorrect attempts. Code has been invalidated. Please request a new code.' });
    }

    if (inputCode !== verificationData.code) {
      verificationData.attempts = (verificationData.attempts || 0) + 1;
      return res.status(400).json({ success: false, error: 'Incorrect verification code. ' + (5 - verificationData.attempts) + ' attempts remaining.' });
    }

    // Code matches! Invalidate pending code
    const verifiedEmail = verificationData.email;
    const finalUid = verificationData.uid || targetUid;
    const finalUsername = verificationData.username || targetUsername;

    if (finalUsername) emailVerificationsCache.delete(finalUsername);
    if (finalUid) emailVerificationsCache.delete(finalUid);
    emailVerificationsCache.delete(verifiedEmail);
    if (finalUid) {
      adminDb.collection('emailVerifications').doc(finalUid).delete().catch(() => {});
    }

    // Mark verified in local accounts store
    saveAccountRecord({
      uid: finalUid,
      username: finalUsername,
      recoveryEmail: verifiedEmail,
      recoveryEmailVerified: true,
      recoveryEmailVerifiedAt: new Date().toISOString()
    });

    // Mark verified in Firestore
    if (finalUid) {
      try {
        await adminDb.collection('users').doc(finalUid).set({
          recoveryEmail: verifiedEmail,
          recoveryEmailVerified: true,
          emailVerified: true,
          recoveryEmailVerifiedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        if (finalUsername) {
          await adminDb.collection('registeredUsernames').doc(finalUsername).set({
            recoveryEmail: verifiedEmail,
            recoveryEmailVerified: true
          }, { merge: true });
        }
        await adminDb.collection('registeredEmails').doc(verifiedEmail).set({
          uid: finalUid,
          username: finalUsername,
          email: verifiedEmail,
          verified: true
        }, { merge: true });
      } catch (_) {}
    }

    return res.json({
      success: true,
      verified: true,
      recoveryEmail: verifiedEmail,
      maskedEmail: maskEmail(verifiedEmail),
      message: 'Recovery Email Verified ✓\nYour recovery email has been added successfully. You can now use it to recover your SellerFlow account if you forget your password.'
    });
  } catch (err) {
    console.error('Verify recovery email error:', err);
    return res.status(500).json({ success: false, error: 'Verification failed. Please try again.' });
  }
});

/**
 * Get Recovery Email Status Endpoint
 */
app.get('/api/auth/recovery-email-status', async (req, res) => {
  try {
    let targetUid = null;
    let targetUsername = req.query.username ? usernameClean(req.query.username) : null;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      try {
        const dec = await verifyFirebaseToken(req.headers.authorization.slice(7).trim());
        if (dec?.uid) targetUid = dec.uid;
      } catch (_) {}
    }

    let account = null;
    if (targetUsername) account = await resolveAccountForAuth(targetUsername);
    if (!account && targetUid) {
      account = Array.from(localAccountsMap.values()).find(a => a.uid === targetUid);
      if (!account) {
        try {
          const snap = await adminDb.collection('users').doc(targetUid).get();
          if (snap.exists) account = snap.data();
        } catch (_) {}
      }
    }

    if (!account) {
      return res.status(404).json({ success: false, error: 'Account not found.' });
    }

    const hasRec = Boolean(account.recoveryEmail);
    const isVerified = Boolean(account.recoveryEmailVerified);

    return res.json({
      success: true,
      hasRecoveryEmail: hasRec,
      recoveryEmail: hasRec ? maskEmail(account.recoveryEmail) : null,
      verified: isVerified
    });
  } catch (err) {
    console.error('Recovery email status error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve recovery email status.' });
  }
});

/**
 * Forgot Password Endpoint for Username-Based Accounts
 * Requires SellerFlow username only. Looks up account and verified recovery email.
 * Never leaks account existence or private email addresses.
 */
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { username, identifier } = req.body || {};
    const rawInput = String(username || identifier || '').trim();
    if (!rawInput || rawInput.length < 2) {
      return res.status(400).json({ success: false, error: 'Please enter your SellerFlow username.' });
    }

    const uClean = usernameClean(rawInput);
    if (!uClean) {
      return res.status(400).json({ success: false, error: 'Please enter a valid SellerFlow username.' });
    }

    // Rate limiting: 45s cooldown
    const now = Date.now();
    const lastSent = passwordResetRateLimits.get(uClean) || 0;
    if (now - lastSent < 45000) {
      const waitSecs = Math.ceil((45000 - (now - lastSent)) / 1000);
      return res.status(429).json({
        success: false,
        error: 'Please wait ' + waitSecs + 's before requesting another recovery code.',
        cooldownSeconds: waitSecs
      });
    }

    const account = await resolveAccountForAuth(uClean);

    // CRITICAL: Prevent account enumeration and unverified resets!
    // Do not reveal whether username exists.
    // Do not send recovery codes to an unverified recovery email.
    if (!account || !account.recoveryEmail || !account.recoveryEmailVerified) {
      passwordResetRateLimits.set(uClean, now);
      return res.json({
        success: true,
        message: 'If this account has a verified recovery email, recovery instructions will be sent.',
        generic: true
      });
    }

    const targetEmail = account.recoveryEmail.toLowerCase().trim();
    const targetUsername = account.username || uClean;
    const foundUid = account.uid;

    const code = crypto.randomInt(100000, 1000000).toString();
    const salt = crypto.randomBytes(16).toString('hex');
    const codeHash = crypto.createHash('sha256').update(code + salt).digest('hex');
    const expiresAt = now + 10 * 60 * 1000; // 10 minutes

    const resetPayload = {
      uid: foundUid,
      username: targetUsername,
      recoveryEmail: targetEmail,
      codeHash,
      salt,
      expiresAt,
      attempts: 0
    };

    passwordResetCodesCache.set(uClean, resetPayload);
    passwordResetRateLimits.set(uClean, now);

    if (foundUid) {
      try {
        await adminDb.collection('passwordResets').doc(foundUid).set({
          ...resetPayload,
          createdAt: FieldValue.serverTimestamp()
        });
      } catch (_) {}
    }

    const mailResult = await sendRecoveryEmail({
      to: targetEmail,
      username: targetUsername,
      code,
      type: 'reset'
    });

    const masked = maskEmail(targetEmail);

    if (!mailResult.sent) {
      if (mailResult.configured === false) {
        return res.status(503).json({
          success: false,
          configured: false,
          error: 'Email delivery is not configured on the server. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in your environment.',
          devCode: (process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEV_CODES === 'true') ? code : undefined
        });
      }
      return res.status(503).json({
        success: false,
        error: "We couldn't send the recovery email right now. Please try again later.",
        devCode: (process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEV_CODES === 'true') ? code : undefined
      });
    }

    return res.json({
      success: true,
      username: targetUsername,
      maskedEmail: masked,
      message: 'Recovery code sent to ' + masked + '. Check your inbox and spam folder.',
      devCode: (process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEV_CODES === 'true') ? code : undefined
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ success: false, error: 'Unable to process recovery request. Please try again.' });
  }
});

/**
 * Resend Password Recovery Code Endpoint
 */
app.post('/api/auth/resend-reset-code', async (req, res) => {
  try {
    const { username, identifier } = req.body || {};
    const rawInput = String(username || identifier || '').trim();
    const uClean = usernameClean(rawInput);
    if (!uClean) {
      return res.status(400).json({ success: false, error: 'Please enter your SellerFlow username.' });
    }

    const now = Date.now();
    const lastSent = passwordResetRateLimits.get(uClean) || 0;
    if (now - lastSent < 45000) {
      const waitSecs = Math.ceil((45000 - (now - lastSent)) / 1000);
      return res.status(429).json({
        success: false,
        error: 'Please wait ' + waitSecs + 's before resending.',
        cooldownSeconds: waitSecs
      });
    }

    const account = await resolveAccountForAuth(uClean);
    if (!account || !account.recoveryEmail || !account.recoveryEmailVerified) {
      passwordResetRateLimits.set(uClean, now);
      return res.json({
        success: true,
        message: 'If this account has a verified recovery email, recovery instructions will be sent.',
        generic: true
      });
    }

    const targetEmail = account.recoveryEmail.toLowerCase().trim();
    const targetUsername = account.username || uClean;
    const foundUid = account.uid;

    const code = crypto.randomInt(100000, 1000000).toString();
    const salt = crypto.randomBytes(16).toString('hex');
    const codeHash = crypto.createHash('sha256').update(code + salt).digest('hex');
    const expiresAt = now + 10 * 60 * 1000;

    const resetPayload = {
      uid: foundUid,
      username: targetUsername,
      recoveryEmail: targetEmail,
      codeHash,
      salt,
      expiresAt,
      attempts: 0
    };

    passwordResetCodesCache.set(uClean, resetPayload);
    passwordResetRateLimits.set(uClean, now);

    const mailResult = await sendRecoveryEmail({
      to: targetEmail,
      username: targetUsername,
      code,
      type: 'reset'
    });

    const masked = maskEmail(targetEmail);

    if (!mailResult.sent) {
      if (mailResult.configured === false) {
        return res.status(503).json({
          success: false,
          configured: false,
          error: 'Email delivery is not configured on the server. Please configure SMTP.',
          devCode: (process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEV_CODES === 'true') ? code : undefined
        });
      }
      return res.status(503).json({
        success: false,
        error: "We couldn't send a new code right now. Please try again.",
        devCode: (process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEV_CODES === 'true') ? code : undefined
      });
    }

    return res.json({
      success: true,
      username: targetUsername,
      maskedEmail: masked,
      message: 'A new recovery code was sent to ' + masked + '.',
      devCode: (process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEV_CODES === 'true') ? code : undefined
    });
  } catch (err) {
    console.error('Resend reset code error:', err);
    return res.status(500).json({ success: false, error: "We couldn't send a new code right now. Please try again." });
  }
});

/**
 * Reset Password with 6-Digit Recovery Code
 * Enforces single-use token, validates against salt hash, updates actual password in auth system.
 */
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { username, identifier, code, newPassword } = req.body || {};
    const rawIdentifier = String(username || identifier || '').trim();
    const uClean = usernameClean(rawIdentifier);
    const inputCode = String(code || '').trim();
    const inputPassword = String(newPassword || '');

    if (!uClean || !inputCode) {
      return res.status(400).json({ success: false, error: 'Username and recovery code are required.' });
    }
    if (!inputPassword || inputPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters.' });
    }

    let resetData = passwordResetCodesCache.get(uClean);
    if (!resetData) {
      try {
        const snap = await adminDb.collection('passwordResets').where('username', '==', uClean).limit(1).get();
        if (!snap.empty) resetData = snap.docs[0].data();
      } catch (_) {}
    }

    if (!resetData) {
      return res.status(400).json({ success: false, error: 'Password reset code is invalid or has expired. Please request a new recovery code.' });
    }

    const expTime = resetData.expiresAt?.toDate ? resetData.expiresAt.toDate().getTime() : resetData.expiresAt;
    if (Date.now() > expTime) {
      passwordResetCodesCache.delete(uClean);
      return res.status(410).json({ success: false, error: 'Password reset code has expired. Please request a new recovery code.' });
    }

    if (resetData.attempts >= 5) {
      passwordResetCodesCache.delete(uClean);
      return res.status(400).json({ success: false, error: 'Too many incorrect attempts. Recovery code has been invalidated. Please request a new code.' });
    }

    // Verify hash against salt
    const testHash = crypto.createHash('sha256').update(inputCode + resetData.salt).digest('hex');
    const isCodeValid = (testHash === resetData.codeHash);

    if (isCodeValid) {
      const uid = resetData.uid;

      // Invalidate code immediately (single-use token)
      passwordResetCodesCache.delete(uClean);
      if (resetData.username) passwordResetCodesCache.delete(resetData.username);
      if (resetData.recoveryEmail) passwordResetCodesCache.delete(resetData.recoveryEmail);
      if (uid) {
        adminDb.collection('passwordResets').doc(uid).delete().catch(() => {});
      }

      // Update password in authoritative store
      const { hash: newHash, salt: newSalt } = hashPassword(inputPassword);
      saveAccountRecord({
        uid,
        username: resetData.username || uClean,
        passwordHash: newHash,
        passwordSalt: newSalt,
        updatedAt: new Date().toISOString()
      });

      // Update password in Firebase Auth via Admin SDK (if credentialed)
      if (uid) {
        try {
          await adminAuth.updateUser(uid, { password: inputPassword, emailVerified: true });
        } catch (authErr) {
          console.warn('Firebase Auth password update notice:', authErr.message);
        }
        try {
          await adminDb.collection('users').doc(uid).set({
            recoveryEmailVerified: true,
            emailVerified: true,
            updatedAt: FieldValue.serverTimestamp()
          }, { merge: true });
        } catch (_) {}
      }

      return res.json({
        success: true,
        uid,
        username: resetData.username || uClean,
        message: 'Your password has been updated successfully. You can now sign in with your new password.'
      });
    } else {
      const attempts = (resetData.attempts || 0) + 1;
      if (attempts >= 5) {
        passwordResetCodesCache.delete(uClean);
        if (resetData.username) passwordResetCodesCache.delete(resetData.username);
        return res.status(400).json({ success: false, error: 'Too many incorrect attempts. Recovery code has been invalidated. Please request a new code.' });
      } else {
        resetData.attempts = attempts;
        passwordResetCodesCache.set(uClean, resetData);
        return res.status(400).json({ success: false, error: 'Incorrect recovery code. ' + (5 - attempts) + ' attempts remaining.' });
      }
    }
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ success: false, error: 'Unable to reset password right now. Please try again.' });
  }
});\n\n`;

const newCode = code.slice(0, idxStart) + replacement + code.slice(idxEnd);
fs.writeFileSync('server.js', newCode, 'utf8');
console.log('Successfully updated server.js!');
