/**
 * Cloudflare Pages Function — GET /api/visits
 * Returns all stored visits. Password protected via ?key= query param.
 *
 * Set env var STATS_PASSWORD in Cloudflare dashboard to your chosen password.
 */

interface Env {
  ANALYTICS_KV: KVNamespace;
  STATS_PASSWORD?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  const url = new URL(context.request.url);
  const key = url.searchParams.get('key') ?? '';
  const password = context.env.STATS_PASSWORD ?? 'tobi-stats-2026';

  if (key !== password) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
  }

  if (!context.env.ANALYTICS_KV) {
    return new Response(JSON.stringify([]), { headers });
  }

  const raw = await context.env.ANALYTICS_KV.get('visits');
  const visits = raw ? JSON.parse(raw) : [];

  return new Response(JSON.stringify(visits), { headers });
};
