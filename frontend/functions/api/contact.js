/**
 * Cloudflare Pages Function — Contact Form Handler
 * POST /api/contact
 *
 * Forwards form submissions to sakthi@sakthi.wiki.
 * The email address is NEVER exposed to the client.
 *
 * In production, replace the fetch URL with your actual email service
 * (Resend, SendGrid, Mailchannels, etc.).
 *
 * For Mailchannels (free on Cloudflare Workers):
 *   See: https://blog.cloudflare.com/sending-email-from-workers-with-mailchannels/
 */

export async function onRequestPost(context) {
  const { request } = context;

  try {
    const body = await request.json();
    const { name, email, message } = body;

    // Validate
    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: 'All fields are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email address.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Anti-spam: reject if honeypot filled
    if (body.website) {
      // Silently succeed to not tip off bots
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // === SEND EMAIL ===
    //
    // Option A: Use Mailchannels (free on Cloudflare Workers)
    // Uncomment and configure with your domain:
    //
    // const sendRequest = new Request('https://api.mailchannels.net/tx/v1/send', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     personalizations: [{ to: [{ email: 'sakthi@sakthi.wiki' }] }],
    //     from: { email: 'noreply@sakthi.wiki', name: 'Sakthi Wiki Contact' },
    //     subject: `New contact from ${name}`,
    //     content: [{
    //       type: 'text/plain',
    //       value: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    //     }],
    //   }),
    // });
    // const sendResponse = await fetch(sendRequest);
    //
    // if (!sendResponse.ok) {
    //   throw new Error('Failed to send email');
    // }

    // Option B: Use Resend (https://resend.com)
    // const sendResponse = await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${context.env.RESEND_API_KEY}`,
    //   },
    //   body: JSON.stringify({
    //     from: 'Sakthi Wiki <noreply@sakthi.wiki>',
    //     to: 'sakthi@sakthi.wiki',
    //     subject: `New contact from ${name}`,
    //     text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    //     reply_to: email,
    //   }),
    // });

    // Option C: Use Cloudflare Email Routing + Workers
    // See: https://developers.cloudflare.com/email-routing/

    // Option D: Log to console (for testing — replace with real sending)
    console.log('Contact form submission:');
    console.log(`  From: ${name} <${email}>`);
    console.log(`  Message: ${message}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Contact form error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error. Please try again later.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
