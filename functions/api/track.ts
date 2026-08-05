/**
 * Cloudflare Pages Function — POST /api/track
 * Receives visitor data and stores in KV.
 * Handles duration updates via _durationUpdate flag.
 */

interface Env {
  ANALYTICS_KV: KVNamespace;
  OWNER_IPS?: string;
}

interface VisitRecord {
  ip: string;
  city: string;
  country: string;
  isp: string;
  os: string;
  browser: string;
  device: string;
  brand: string;
  model: string;
  screen: string;
  page: string;
  ref: string;
  ts: number;
  lang?: string;
  tz?: string;
  duration?: number;
  _durationUpdate?: boolean;
  _ts?: number;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const body = await context.request.json() as VisitRecord;

    if (!context.env.ANALYTICS_KV) {
      return new Response(JSON.stringify({ ok: true, skipped: 'no kv' }), { headers });
    }

    const raw = await context.env.ANALYTICS_KV.get('visits');
    const visits: VisitRecord[] = raw ? JSON.parse(raw) : [];

    /* ── Duration update from sendBeacon on page leave ── */
    if (body._durationUpdate && body._ts && body.duration) {
      const idx = visits.findLastIndex(v => v.ts === body._ts && v.page === body.page);
      if (idx >= 0) {
        visits[idx].duration = body.duration;
        await context.env.ANALYTICS_KV.put('visits', JSON.stringify(visits));
      }
      return new Response(JSON.stringify({ ok: true }), { headers });
    }

    /* ── Skip owner IPs ── */
    const ownerIPs = (context.env.OWNER_IPS ?? '').split(',').map(s => s.trim()).filter(Boolean);
    if (ownerIPs.includes(body.ip)) {
      return new Response(JSON.stringify({ ok: true, skipped: 'owner' }), { headers });
    }

    /* ── Skip bot IPs / non-real visits ── */
    if (!body.ip || body.ip === 'geo-failed' && !body.screen) {
      return new Response(JSON.stringify({ ok: true, skipped: 'bot' }), { headers });
    }

    /* ── Append new visit ── */
    const { _durationUpdate, _ts, ...cleanVisit } = body;
    visits.push(cleanVisit);
    if (visits.length > 5000) visits.splice(0, visits.length - 5000);

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
