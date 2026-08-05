import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/* ─── Full device parser ─────────────────────────────────── */
function parseDevice(ua: string) {
  let os = 'Unknown OS';
  let browser = 'Unknown';
  let device = 'Desktop';
  let brand = 'Unknown';
  let model = 'Unknown';

  /* Brand / Model */
  if (/Redmi/i.test(ua)) {
    brand = 'Xiaomi'; device = 'Mobile';
    const m = ua.match(/Redmi[\s_][\w]+/i);
    model = m?.[0]?.replace(/_/g, ' ') ?? 'Redmi';
  } else if (/OnePlus/i.test(ua)) {
    brand = 'OnePlus'; device = 'Mobile';
    const m = ua.match(/OnePlus[\s]?[\w]+/i);
    model = m?.[0] ?? 'OnePlus';
  } else if (/Nothing|A063|A065/i.test(ua)) {
    brand = 'Nothing'; model = 'Nothing Phone'; device = 'Mobile';
  } else if (/POCO/i.test(ua)) {
    brand = 'POCO'; device = 'Mobile';
    const m = ua.match(/POCO[\s][\w]+/i);
    model = m?.[0] ?? 'POCO';
  } else if (/Samsung/i.test(ua)) {
    brand = 'Samsung'; device = /Mobile/i.test(ua) ? 'Mobile' : 'Tablet';
    const m = ua.match(/SM-[A-Z0-9]+/);
    model = m?.[0] ?? 'Samsung';
  } else if (/iPhone/i.test(ua)) {
    brand = 'Apple'; model = 'iPhone'; device = 'Mobile';
  } else if (/iPad/i.test(ua)) {
    brand = 'Apple'; model = 'iPad'; device = 'Tablet';
  } else if (/Realme/i.test(ua)) {
    brand = 'Realme'; device = 'Mobile';
    const m = ua.match(/Realme[\s][\w]+/i);
    model = m?.[0] ?? 'Realme';
  } else if (/CPH\d+|OPPO/i.test(ua)) {
    brand = 'OPPO'; device = 'Mobile';
    const m = ua.match(/CPH\d+/);
    model = m?.[0] ?? 'OPPO';
  } else if (/vivo/i.test(ua)) {
    brand = 'Vivo'; device = 'Mobile';
    const m = ua.match(/vivo[\s]?[\w]+/i);
    model = m?.[0] ?? 'Vivo';
  } else if (/motorola|moto\s/i.test(ua)) {
    brand = 'Motorola'; device = 'Mobile';
    const m = ua.match(/moto\s[\w]+/i);
    model = m?.[0]?.trim() ?? 'Motorola';
  } else if (/Android/i.test(ua)) {
    brand = 'Android'; device = 'Mobile';
    /* Try to extract build model from UA: "...Android 13; Pixel 7..." */
    const m = ua.match(/;\s([^;)]+)\sBuild\//);
    model = m?.[1]?.trim() ?? 'Android Device';
  }

  /* OS */
  if (/iPhone|iPad|iPod/i.test(ua)) {
    const v = ua.match(/OS ([\d_]+)/);
    os = `iOS ${v?.[1]?.replace(/_/g, '.') ?? ''}`.trim();
  } else if (/Android/i.test(ua)) {
    const v = ua.match(/Android ([\d.]+)/);
    os = `Android ${v?.[1] ?? ''}`.trim();
  } else if (/Windows NT 10/i.test(ua)) {
    os = 'Windows 10/11'; brand = 'PC'; device = 'Desktop';
  } else if (/Windows NT/i.test(ua)) {
    os = 'Windows'; brand = 'PC'; device = 'Desktop';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = 'macOS'; brand = 'Apple'; device = 'Desktop';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux'; device = 'Desktop';
  }

  /* Browser */
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/OPR\//i.test(ua)) browser = 'Opera';
  else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Browser';
  else if (/Chrome\//i.test(ua)) browser = 'Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Safari\//i.test(ua)) browser = 'Safari';

  return { os, browser, device, brand, model };
}

/* ─── Main tracking hook ─────────────────────────────────── */
export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    const startTime = Date.now();
    const ua = navigator.userAgent;
    const deviceInfo = parseDevice(ua);

    const sendVisit = (extraData?: Record<string, unknown>) => {
      fetch('https://ipapi.co/json/', { cache: 'force-cache' })
        .then(r => r.json())
        .then((geo: { ip: string; city: string; country_name: string; org: string }) => {
          const payload = {
            ip: geo.ip ?? 'unknown',
            city: geo.city ?? 'Unknown',
            country: geo.country_name ?? 'Unknown',
            isp: (geo.org ?? 'Unknown').replace(/^AS\d+\s+/, ''),
            ...deviceInfo,
            screen: `${window.screen.width}x${window.screen.height}`,
            page: location.pathname,
            ref: document.referrer || 'direct',
            ts: startTime,
            lang: navigator.language,
            tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
            ...extraData,
          };

          fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }).catch(() => {});
        })
        .catch(() => {
          /* Track without geo if ipapi fails */
          const payload = {
            ip: 'geo-failed',
            city: 'Unknown', country: 'Unknown', isp: 'Unknown',
            ...deviceInfo,
            screen: `${window.screen.width}x${window.screen.height}`,
            page: location.pathname,
            ref: document.referrer || 'direct',
            ts: startTime,
            lang: navigator.language,
            tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
            ...extraData,
          };
          fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }).catch(() => {});
        });
    };

    /* Fire on page load */
    sendVisit();

    /* Send duration when user leaves */
    const onLeave = () => {
      const duration = Math.round((Date.now() - startTime) / 1000);
      const minPayload = JSON.stringify({
        ip: 'duration-update',
        _durationUpdate: true,
        _ts: startTime,
        duration,
        page: location.pathname,
        ts: startTime,
      });
      try { navigator.sendBeacon('/api/track', minPayload); } catch {}
    };

    window.addEventListener('pagehide', onLeave);
    window.addEventListener('beforeunload', onLeave);

    return () => {
      window.removeEventListener('pagehide', onLeave);
      window.removeEventListener('beforeunload', onLeave);
    };
  }, [location.pathname]);
}
