/**
 * Cloudflare Pages Function — Contact Form Handler
 * POST /api/contact
 *
 * Uses Resend (https://resend.com) to deliver form submissions to
 * sakthi@sakthi.wiki. The destination email address is NEVER exposed
 * to the client — it only exists server-side in this function.
 *
 * Required environment variable (set in Cloudflare Pages dashboard
 * and in .dev.vars for local dev):
 *   resend_api — your Resend API key
 *
 * Rate limiting: 5 submissions per minute per IP (basic abuse prevention).
 */

// Simple in-memory rate limiter (resets on cold start — acceptable for a
// low-traffic personal contact form).
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 5;
const rateLimitMap = new Map();

function getClientIP(request) {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    '127.0.0.1'
  );
}

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false };
  }

  entry.count += 1;
  return { allowed: true };
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // --- Rate limiting ---
    const clientIP = getClientIP(request);
    const rateCheck = checkRateLimit(clientIP);

    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({ error: 'Too many submissions. Please try again in a minute.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // --- Parse body ---
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid request body.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { name, email, message } = body;

    // --- Validate ---
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Name is required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: 'A valid email address is required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: 'Message must be at least 10 characters.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // --- Anti-spam honeypot ---
    if (body.website) {
      // Silently succeed so bots don't know they were caught.
      console.log(`[contact] Honeypot triggered — silently rejecting submission from ${clientIP}`);
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // --- Sanitize ---
    const safeName = name.trim().slice(0, 200);
    const safeEmail = email.trim().slice(0, 254);
    const safeMessage = message.trim().slice(0, 5000);

    // --- Read API key from Cloudflare environment ---
    // Cloudflare env vars are case-sensitive. Check common naming conventions.
    const RESEND_API_KEY = env.resend_api || env.RESEND_API;

    // Debug: log which env keys are available (names only, never values)
    const availableEnvKeys = Object.keys(env).filter(k => !k.startsWith('__'));
    console.log(
      `[contact] Available env keys: [${availableEnvKeys.join(', ') || '(none)'}]\n` +
      `[contact]   env.resend_api present: ${!!env.resend_api}\n` +
      `[contact]   env.RESEND_API present: ${!!env.RESEND_API}`
    );

    if (!RESEND_API_KEY) {
      console.error(
        `[contact] resend_api not found.\n` +
        `  Available env keys: [${availableEnvKeys.join(', ') || '(none)'}]\n` +
        `  → Add "resend_api" in Cloudflare Pages → Settings → Variables & Secrets\n` +
        `  → For local: add resend_api=re_... to frontend/.dev.vars\n` +
        `  → Ensure the variable is set for BOTH "Build" AND "Functions" in Cloudflare\n` +
        `  → Redeploy after adding variables.`
      );
      return new Response(
        JSON.stringify({ error: 'Email delivery is not configured. Please try again later.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // --- Send email via Resend ---
    console.log(`[contact] Sending email from ${safeName} <${safeEmail}> via Resend`);

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Sakthi Wiki <noreply@sakthi.wiki>',
        to: 'sakthi@sakthi.wiki',
        reply_to: safeEmail,
        subject: `New contact from ${safeName}`,
        text: [
          `Name: ${safeName}`,
          `Email: ${safeEmail}`,
          '',
          'Message:',
          safeMessage,
        ].join('\n'),
      }),
    });

    if (!resendResponse.ok) {
      const errorBody = await resendResponse.text();
      console.error(`[contact] Resend API error (${resendResponse.status}):`, errorBody);
      throw new Error(`Resend returned ${resendResponse.status}: ${errorBody}`);
    }

    const resendData = await resendResponse.json();
    console.log(`[contact] Email sent successfully — Resend ID: ${resendData.id}`);

    // --- Success ---
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[contact] Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Something went wrong. Please try again later.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
