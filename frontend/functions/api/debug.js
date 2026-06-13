/**
 * Debug endpoint — GET /api/debug
 *
 * Returns which environment variables are available to Functions.
 * Names only — NEVER exposes values. Safe to leave in production
 * because it only reveals key names, not secrets.
 *
 * Remove this file before launch if you prefer zero introspection.
 */
export async function onRequest(context) {
  const { env } = context;

  const allKeys = Object.keys(env).filter(k => !k.startsWith('__'));

  return new Response(
    JSON.stringify({
      availableKeys: allKeys,
      count: allKeys.length,
      checks: {
        resend_api: { present: !!env.resend_api, type: typeof env.resend_api },
        RESEND_API: { present: !!env.RESEND_API, type: typeof env.RESEND_API },
      },
      hint:
        allKeys.length === 0
          ? 'No env vars found! Check Cloudflare Pages → Settings → Variables & Secrets. ' +
            'Ensure variables are set for BOTH "Build" AND "Functions" (or "All environments"). ' +
            'Also ensure wrangler.toml has keep_vars = true if you have a [vars] section.'
          : 'Env vars are flowing. If resend_api is missing from the list above, ' +
            'add it in Cloudflare Pages → Settings → Variables & Secrets.',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    }
  );
}
