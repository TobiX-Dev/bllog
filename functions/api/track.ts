/**
 * Cloudflare Pages Function — POST /api/track
 * Receives visitor data and stores in KV.
 *
 * Setup in Cloudflare dashboard:
 *   Workers & Pages → your project → Settings → Functions → KV namespace bindings
 *   Variable name: ANALYTICS_KV  →  bind to a KV namespace called "blog_analytics"
 */

interface Env {
  ANALYTICS_KV: KVNamespace;
  OWNER_IPS?: string; // comma-separated IPs to exclude (set in env vars)
}

interface VisitRecord {
  ip: string;
  city: string;
  country: string;
  isp: string;
  os: string;
  browser: string;
  device: string;
  screen: string;
  page: string;
  ref: string;
  ts: number;
  duration?: number;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const body = await context.request.json() as VisitRecord;

    // Skip if KV not bound (local dev)
    if (!context.env.ANALYTICS_KV) {
      return new Response(JSON.stringify({ ok: true, skipped: 'no kv' }), { headers });
    }

    // Skip owner IPs
    const ownerIPs = (context.env.OWNER_IPS ?? '').split(',').map(s => s.trim()).filter(Boolean);
    if (ownerIPs.includes(body.ip)) {
      return new Response(JSON.stringify({ ok: true, skipped: 'owner' }), { headers });
    }

    // Load existing visits from KV
    const raw = await context.env.ANALYTICS_KV.get('visits');
    const visits: VisitRecord[] = raw ? JSON.parse(raw) : [];

    // Append new visit (keep last 2000)
    visits.push(body);
    if (visits.length > 2000) visits.splice(0, visits.length - 2000);

    await context.env.ANALYTICS_KV.put('visits', JSON.stringify(visits));

    return new Response(JSON.stringify({ ok: true }), { headers });
  } catch {
    return new Response(JSON.stringify({ ok: false }), { status: 500, headers });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
