/**
 * SellerFlow Supabase Edge Function: send-recovery-email
 * Authoritative Server-Side Email Delivery Pipeline for SellerFlow Recovery Codes
 *
 * Architecture & Security:
 * - Server-side only: never exposes email provider keys or credentials to the browser or APK.
 * - Authenticates caller via Supabase Auth token, Firebase Auth token, Supabase service_role key, or internal key.
 * - Strict parameter validation: recipient format, 6-digit numeric code constraint, allowed action type.
 * - Cryptographically safe: never logs or returns the 6-digit verification code.
 * - Dispatches email via Resend HTTPS API (https://api.resend.com/emails) using Deno.env.get('RESEND_API_KEY').
 * - Fails closed with safe machine-readable error codes (EMAIL_PROVIDER_CONFIGURATION_MISSING, EMAIL_PROVIDER_AUTH_FAILED, EMAIL_DELIVERY_FAILED).
 */

import { createRemoteJWKSet, jwtVerify } from 'jose';

// Configuration from Supabase Edge Runtime environment / secrets
const SUPABASE_PROJECT_ID = (typeof Deno !== 'undefined' ? Deno.env.get('SUPABASE_PROJECT_ID') : (typeof process !== 'undefined' ? process.env.SUPABASE_PROJECT_ID : '')) || 'vvpwntehstjbccarqqzp';
const SUPABASE_URL = (typeof Deno !== 'undefined' ? Deno.env.get('SUPABASE_URL') : (typeof process !== 'undefined' ? process.env.SUPABASE_URL : '')) || `https://${SUPABASE_PROJECT_ID}.supabase.co`;
const SUPABASE_ANON_KEY = (typeof Deno !== 'undefined' ? Deno.env.get('SUPABASE_ANON_KEY') : (typeof process !== 'undefined' ? process.env.SUPABASE_ANON_KEY : '')) || '';
const SUPABASE_SERVICE_ROLE_KEY = (typeof Deno !== 'undefined' ? (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_KEY')) : (typeof process !== 'undefined' ? (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY) : '')) || '';

const FIREBASE_PROJECT_ID = (typeof Deno !== 'undefined' ? Deno.env.get('FIREBASE_PROJECT_ID') : (typeof process !== 'undefined' ? process.env.FIREBASE_PROJECT_ID : '')) || 'sellerflow-efaab';
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

export function maskEmail(email: string): string {
  if (!email || typeof email !== 'string' || !email.includes('@')) return '***@***.***';
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) return '***@***.***';
  const [localPart, domain] = parts;
  if (!localPart || !domain) return '***@***.***';
  return localPart.charAt(0) + '***@' + domain;
}

let googleJWKS: any = null;
function getGoogleJWKS() {
  if (!googleJWKS) {
    googleJWKS = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));
  }
  return googleJWKS;
}

/**
 * Authoritatively verifies caller identity against Supabase Auth, Firebase Auth, or Service credentials.
 */
export async function verifyCallerToken(token: string, internalHeader?: string | null): Promise<{ uid: string; email?: string; provider: string }> {
  const env = typeof Deno !== 'undefined' ? Deno.env : (typeof process !== 'undefined' ? { get: (k: string) => process.env[k] || '' } : { get: () => '' });
  const internalSecret = env.get('INTERNAL_RECOVERY_KEY') || env.get('SUPABASE_SERVICE_ROLE_KEY') || env.get('SUPABASE_KEY') || '';

  // Internal secret check for trusted backend-to-backend calls
  if (internalSecret && (token === internalSecret || internalHeader === internalSecret)) {
    return { uid: 'system_service', provider: 'internal_secret' };
  }

  // Supabase service role key matches
  if (SUPABASE_SERVICE_ROLE_KEY && (token === SUPABASE_SERVICE_ROLE_KEY || internalHeader === SUPABASE_SERVICE_ROLE_KEY)) {
    return { uid: 'supabase_service_role', provider: 'service_role' };
  }

  if (!token || typeof token !== 'string') {
    throw new Error('Missing or empty authentication token');
  }

  // 1. Try Supabase Auth user check
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

  // 2. Try Firebase Auth ID token verification
  try {
    const jwks = getGoogleJWKS();
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID
    });
    const uid = payload.sub || (payload.user_id as string);
    if (uid) {
      return {
        uid,
        email: payload.email as string | undefined,
        provider: 'firebase'
      };
    }
  } catch (_) {}

  throw new Error('Invalid or expired authentication credentials');
}

/**
 * Builds the authoritative branded HTML & Plaintext email templates.
 */
export function buildRecoveryEmailTemplate({
  cleanUsername,
  cleanTo,
  code,
  type = 'reset',
  fromName = 'SellerFlow Security'
}: {
  cleanUsername: string;
  cleanTo: string;
  code: string;
  type: string;
  fromName?: string;
}) {
  const isVerify = type === 'verify' || type === 'account_verify';
  const subject = isVerify ? 'SellerFlow Recovery Email Verification Code' : 'SellerFlow Password Recovery Code';
  const headerSubtitle = isVerify ? 'Recovery Email Verification' : 'Password Recovery';

  const textBody = isVerify
    ? `Hello ${cleanUsername},\n\nYou requested to add this email address as your SellerFlow recovery email.\n\nYour verification code is:\n\n${code}\n\nThis code expires in 10 minutes and can only be used once.\n\nIf you did not request this, you can safely ignore this email.\n\nSellerFlow\nBUY • SELL • GROW`
    : `Hello ${cleanUsername},\n\nWe received a request to reset your SellerFlow account password.\n\nYour verification code is:\n\n${code}\n\nThis code expires in 10 minutes and can only be used once.\n\nIf you did not request this, you can safely ignore this email.\n\nSellerFlow\nBUY • SELL • GROW`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111111;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f9fafb;padding:40px 10px;">
    <tr><td align="center">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:520px;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.05);">
        <tr><td style="background:linear-gradient(135deg,#f5b942 0%,#d49a2a 100%);padding:28px 24px;text-align:center;">
          <h1 style="margin:0;font-size:24px;font-weight:900;color:#000000;text-transform:uppercase;letter-spacing:-0.02em;">SellerFlow</h1>
          <p style="margin:6px 0 0 0;font-size:12px;font-weight:700;color:rgba(0,0,0,0.8);text-transform:uppercase;letter-spacing:0.05em;">${headerSubtitle}</p>
        </td></tr>
        <tr><td style="padding:32px 28px;">
          <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#111827;">Hello <strong>${cleanUsername}</strong>,</p>
          <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#374151;">${isVerify ? 'You requested to add this email address as your SellerFlow recovery email.' : 'We received a request to reset your SellerFlow account password.'}</p>
          <p style="margin:0 0 10px 0;font-size:13px;font-weight:600;color:#4b5563;">Your verification code is:</p>
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0 24px 0;">
            <tr><td align="center">
              <div style="background-color:#fef3c7;border:2px solid #f5b942;border-radius:12px;padding:16px 32px;display:inline-block;">
                <span style="font-family:monospace;font-size:34px;font-weight:800;letter-spacing:8px;color:#000000;">${code}</span>
              </div>
            </td></tr>
          </table>
          <p style="margin:0 0 16px 0;font-size:13px;color:#4b5563;line-height:1.5;">This code expires in 10 minutes and can only be used once.</p>
          <p style="margin:0 0 24px 0;font-size:13px;color:#6b7280;line-height:1.5;">If you did not request this, you can safely ignore this email.</p>
          <hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0 20px 0;">
          <p style="margin:0;font-size:13px;font-weight:800;color:#111827;letter-spacing:0.02em;">SellerFlow</p>
          <p style="margin:2px 0 0 0;font-size:11px;font-weight:700;color:#d49a2a;letter-spacing:0.08em;text-transform:uppercase;">BUY • SELL • GROW</p>
        </td></tr>
        <tr><td style="padding:16px 28px;background-color:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="margin:0;font-size:11px;color:#9ca3af;">&copy; 2026 SellerFlow Ghana · All Rights Reserved</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html, textBody };
}

/**
 * Main Request Handler for Supabase Edge Function: send-recovery-email
 */
export async function handleSendRecoveryEmail(req: Request): Promise<Response> {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // 1. Authenticate caller
    const authHeader = req.headers.get('authorization') || '';
    const internalHeader = req.headers.get('x-internal-key') || req.headers.get('apikey');
    let token = '';
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice('Bearer '.length).trim();
    } else if (internalHeader) {
      token = internalHeader.trim();
    }

    if (!token && !internalHeader) {
      return new Response(JSON.stringify({
        success: false,
        code: 'AUTH_REQUIRED',
        error: 'Unauthorized: Missing or malformed authentication credentials.'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      await verifyCallerToken(token, internalHeader);
    } catch (authErr: any) {
      return new Response(JSON.stringify({
        success: false,
        code: 'AUTH_REQUIRED',
        error: 'Unauthorized: Invalid or expired authentication credentials.',
        details: authErr.message || String(authErr)
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Parse & validate request payload
    let body: any = {};
    try {
      body = await req.json();
    } catch (_) {
      return new Response(JSON.stringify({
        success: false,
        code: 'BAD_REQUEST',
        error: 'Bad Request: Malformed JSON payload'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { to, username, code, type = 'reset' } = body || {};

    // Validate recipient
    if (!to || typeof to !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim())) {
      return new Response(JSON.stringify({
        success: false,
        code: 'INVALID_EMAIL',
        error: 'Please enter a valid recovery email address.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate 6-digit numeric verification code
    if (!code || typeof code !== 'string' || !/^\d{6}$/.test(code.trim())) {
      return new Response(JSON.stringify({
        success: false,
        code: 'INVALID_CODE',
        error: 'Verification code must be an exact 6-digit numeric sequence.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate operation type
    const validTypes = ['verify', 'reset', 'account_verify'];
    if (!validTypes.includes(type)) {
      return new Response(JSON.stringify({
        success: false,
        code: 'INVALID_OPERATION',
        error: 'Invalid recovery operation type.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const cleanTo = to.trim().toLowerCase();
    const cleanUsername = username ? String(username).trim() : 'user';
    const cleanCode = code.trim();

    // 3. Inspect email provider configuration (Resend API)
    const env = typeof Deno !== 'undefined' ? Deno.env : (typeof process !== 'undefined' ? { get: (k: string) => process.env[k] || '' } : { get: () => '' });
    const resendApiKey = env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      console.warn('[send-recovery-email] RESEND_API_KEY is not configured in Supabase Edge Function secrets.');
      return new Response(JSON.stringify({
        success: false,
        code: 'EMAIL_PROVIDER_CONFIGURATION_MISSING',
        error: 'Recovery email service is temporarily unavailable. Please try again later.',
        configured: false,
        details: 'Email provider credentials (RESEND_API_KEY) are not configured in the Supabase environment.',
        maskedEmail: maskEmail(cleanTo)
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const fromAddress = env.get('RECOVERY_EMAIL_FROM') || 'SellerFlow Security <onboarding@resend.dev>';
    const fromName = env.get('RECOVERY_EMAIL_FROM_NAME') || 'SellerFlow Security';

    const { subject, html, textBody } = buildRecoveryEmailTemplate({
      cleanUsername,
      cleanTo,
      code: cleanCode,
      type,
      fromName
    });

    console.log(`[send-recovery-email] Dispatching ${type.toUpperCase()} email via Resend to ${maskEmail(cleanTo)}`);

    // 4. Dispatch HTTPS request to Resend API
    let resendRes: Response;
    try {
      resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [cleanTo],
          subject,
          html,
          text: textBody
        })
      });
    } catch (netErr: any) {
      console.error('[send-recovery-email] Network error communicating with email provider:', netErr.message || netErr);
      return new Response(JSON.stringify({
        success: false,
        code: 'EMAIL_PROVIDER_CONNECTION_FAILED',
        error: 'Recovery email service is temporarily unavailable. Please try again later.',
        configured: true,
        details: 'Failed to establish connection to email provider API.',
        maskedEmail: maskEmail(cleanTo)
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let resendData: any = null;
    try {
      resendData = await resendRes.json();
    } catch (_) {
      resendData = {};
    }

    if (!resendRes.ok) {
      const status = resendRes.status;
      console.error(`[send-recovery-email] Provider rejected delivery (HTTP ${status}):`, resendData?.message || resendData?.name || 'Unknown error');

      if (status === 401) {
        return new Response(JSON.stringify({
          success: false,
          code: 'EMAIL_PROVIDER_AUTH_FAILED',
          error: 'Recovery email service is temporarily unavailable. Please try again later.',
          configured: true,
          details: 'Authentication with email delivery provider failed. Verify RESEND_API_KEY in Supabase secrets.',
          maskedEmail: maskEmail(cleanTo)
        }), {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (status === 403) {
        return new Response(JSON.stringify({
          success: false,
          code: 'EMAIL_PROVIDER_RECIPIENT_RESTRICTED',
          error: 'Recovery email service is temporarily restricted for this recipient.',
          configured: true,
          details: resendData?.message || 'Email delivery provider restricted sending to this recipient. To send to any recipient, verify your custom sending domain at resend.com/domains.',
          maskedEmail: maskEmail(cleanTo)
        }), {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: false,
        code: 'EMAIL_DELIVERY_FAILED',
        error: 'Recovery email service is temporarily unavailable. Please try again later.',
        configured: true,
        details: resendData?.message || 'Email delivery provider rejected message transmission.',
        maskedEmail: maskEmail(cleanTo)
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[send-recovery-email] Successfully accepted by Resend for ${maskEmail(cleanTo)} (ID: ${resendData?.id || 'ok'})`);

    return new Response(JSON.stringify({
      success: true,
      code: 'RECOVERY_CODE_SENT',
      message: `Recovery code sent to ${maskEmail(cleanTo)}. Check your inbox and spam folder.`,
      maskedEmail: maskEmail(cleanTo),
      providerMessageId: resendData?.id || null
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('[send-recovery-email] Unexpected handler error:', err.message || err);
    return new Response(JSON.stringify({
      success: false,
      code: 'EMAIL_SERVICE_UNAVAILABLE',
      error: 'Recovery email service is temporarily unavailable. Please try again later.',
      details: 'Internal error processing email delivery request.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Deno Edge Runtime entrypoint
if (typeof Deno !== 'undefined' && typeof Deno.serve === 'function') {
  Deno.serve(handleSendRecoveryEmail);
}

export default handleSendRecoveryEmail;
