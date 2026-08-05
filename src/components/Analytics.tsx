import React, { useState } from 'react';

interface Visit {
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
}

interface IpGroup {
  ip: string;
  city: string;
  country: string;
  isp: string;
  brand: string;
  model: string;
  device: string;
  os: string;
  browser: string;
  count: number;
  visits: Visit[];
  lastSeen: number;
  totalTime: number;
}

const mono = "'JetBrains Mono','Fira Code',monospace";
const sans = "'Space Grotesk','Inter',sans-serif";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtDuration(secs?: number): string {
  if (!secs || secs < 1) return '—';
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

function deviceEmoji(device: string, brand: string): string {
  if (device === 'Tablet') return '📱';
  if (brand === 'Apple' && device === 'Desktop') return '💻';
  if (device === 'Mobile') return '📱';
  return '🖥️';
}

function groupByIP(visits: Visit[]): IpGroup[] {
  const map = new Map<string, IpGroup>();
  for (const v of visits) {
    if (!map.has(v.ip)) {
      map.set(v.ip, {
        ip: v.ip, city: v.city, country: v.country, isp: v.isp,
        brand: v.brand ?? '?', model: v.model ?? '?',
        device: v.device ?? '?', os: v.os ?? '?', browser: v.browser ?? '?',
        count: 0, visits: [], lastSeen: 0, totalTime: 0,
      });
    }
    const g = map.get(v.ip)!;
    g.count++;
    g.visits.push(v);
    g.totalTime += v.duration ?? 0;
    if (v.ts > g.lastSeen) {
      g.lastSeen = v.ts;
      g.city = v.city; g.country = v.country; g.isp = v.isp;
      g.brand = v.brand ?? g.brand; g.model = v.model ?? g.model;
      g.device = v.device ?? g.device; g.os = v.os ?? g.os;
    }
  }
  return [...map.values()].sort((a, b) => b.lastSeen - a.lastSeen);
}

const Analytics: React.FC = () => {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedIP, setExpandedIP] = useState<string | null>(null);
  const [filterPage, setFilterPage] = useState('');

  const fetchData = async (pw: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/visits?key=${encodeURIComponent(pw)}`);
      if (res.status === 401) { setAuthError(true); setAuthed(false); setLoading(false); return; }
      const data: Visit[] = await res.json();
      setVisits([...data].reverse());
      setAuthed(true); setAuthError(false);
    } catch { setAuthError(true); }
    setLoading(false);
  };

  const handleLogin = (e: React.FormEvent) => { e.preventDefault(); fetchData(password); };

  const realVisits = visits.filter(v => v.ip !== 'duration-update' && v.ip !== 'geo-failed');
  const filtered = filterPage ? realVisits.filter(v => v.page.includes(filterPage)) : realVisits;
  const groups = groupByIP(filtered);

  const uniqueCountries = [...new Set(realVisits.map(v => v.country))].filter(Boolean).length;
  const uniquePages = [...new Set(realVisits.map(v => v.page))];
  const mobileCount = realVisits.filter(v => v.device === 'Mobile' || v.device === 'Tablet').length;
  const avgTime = realVisits.filter(v => v.duration).reduce((a, v) => a + (v.duration ?? 0), 0) / (realVisits.filter(v => v.duration).length || 1);

  /* ── Login ── */
  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: mono }}>
        <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, padding: 40, width: 360, boxShadow: '0 0 60px rgba(239,68,68,0.05)' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🛡️</div>
            <div style={{ fontFamily: sans, fontSize: 18, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>tobi.log / stats</div>
            <div style={{ fontSize: 12, color: '#475569' }}>Restricted access</div>
          </div>
          <form onSubmit={handleLogin}>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Enter stats password…" autoFocus
              style={{ width: '100%', background: '#0d1117', border: `1px solid ${authError ? '#ef4444' : '#30363d'}`, borderRadius: 6, padding: '10px 14px', color: '#e2e8f0', fontFamily: mono, fontSize: 14, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />
            {authError && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>Wrong password. Try again.</div>}
            <button type="submit" style={{ width: '100%', background: 'linear-gradient(135deg,#ef4444,#f97316)', border: 'none', borderRadius: 6, padding: '10px 0', color: '#fff', fontFamily: mono, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              {loading ? 'Authenticating…' : 'Authenticate →'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ── Dashboard ── */
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e2e8f0', fontFamily: mono, padding: '28px 20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: sans, fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>🛡️ tobi.log / stats</div>
            <div style={{ fontSize: 12, color: '#475569' }}>Visitor analytics · {realVisits.length} total visits · all times IST</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => fetchData(password)} style={{ background: '#111118', border: '1px solid #30363d', borderRadius: 6, padding: '7px 14px', color: '#94a3b8', fontFamily: mono, fontSize: 12, cursor: 'pointer' }}>↻ Refresh</button>
            <button onClick={() => setAuthed(false)} style={{ background: '#111118', border: '1px solid #30363d', borderRadius: 6, padding: '7px 14px', color: '#94a3b8', fontFamily: mono, fontSize: 12, cursor: 'pointer' }}>Logout</button>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Total Visits', value: realVisits.length, color: '#3b82f6', icon: '👁' },
            { label: 'Unique IPs', value: groups.length, color: '#ef4444', icon: '🌐' },
            { label: 'Countries', value: uniqueCountries, color: '#f59e0b', icon: '🗺' },
            { label: 'Pages Hit', value: uniquePages.length, color: '#22c55e', icon: '📄' },
            { label: 'Mobile Visits', value: mobileCount, color: '#a855f7', icon: '📱' },
            { label: 'Avg Time', value: fmtDuration(Math.round(avgTime)), color: '#06b6d4', icon: '⏱' },
          ].map(s => (
            <div key={s.label} style={{ background: '#111118', border: `1px solid ${s.color}22`, borderTop: `2px solid ${s.color}`, borderRadius: 8, padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#475569' }}>Filter by page:</span>
          {[
            { label: 'all', val: '' },
            { label: '/', val: '/' },
            { label: 'MPSC blog', val: 'mpsc' },
            { label: 'UPSC blog', val: 'upsc' },
            { label: '/tobi/stats', val: '/tobi/stats' },
          ].map(p => (
            <button key={p.val} onClick={() => setFilterPage(p.val === filterPage ? '' : p.val)}
              style={{ background: filterPage === p.val ? 'rgba(239,68,68,0.12)' : '#111118', border: `1px solid ${filterPage === p.val ? '#ef4444' : '#1e1e2e'}`, borderRadius: 99, padding: '4px 12px', color: filterPage === p.val ? '#ef4444' : '#64748b', fontSize: 12, cursor: 'pointer', fontFamily: mono }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* IP Groups Table */}
        <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #1e1e2e', display: 'grid', gridTemplateColumns: '1fr 160px 120px 110px 60px 70px', gap: 8, fontSize: 10, color: '#475569', fontWeight: 700, letterSpacing: '0.08em' }}>
            <span>IP / LOCATION</span>
            <span>DEVICE</span>
            <span>ISP</span>
            <span>LAST SEEN</span>
            <span style={{ textAlign: 'center' }}>VISITS</span>
            <span style={{ textAlign: 'center' }}>TIME</span>
          </div>

          {groups.length === 0 && (
            <div style={{ padding: 48, textAlign: 'center', color: '#475569', fontSize: 13 }}>
              No visits recorded yet.<br />
              <span style={{ fontSize: 12, color: '#334155' }}>Tracking fires on every page load — visit your site from another device to see data here.</span>
            </div>
          )}

          {groups.map(g => (
            <React.Fragment key={g.ip}>
              {/* IP Row */}
              <div onClick={() => setExpandedIP(expandedIP === g.ip ? null : g.ip)}
                style={{ padding: '13px 16px', borderBottom: '1px solid #1a1a22', display: 'grid', gridTemplateColumns: '1fr 160px 120px 110px 60px 70px', gap: 8, alignItems: 'center', cursor: 'pointer', background: expandedIP === g.ip ? 'rgba(239,68,68,0.04)' : 'transparent' }}>
                <div>
                  <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}>{g.ip}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{g.city}, {g.country}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#e2e8f0' }}>{deviceEmoji(g.device, g.brand)} {g.brand} {g.model !== g.brand ? g.model : ''}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{g.os} · {g.browser}</div>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.isp}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{timeAgo(g.lastSeen)}</div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 99, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>{g.count}</span>
                </div>
                <div style={{ textAlign: 'center', fontSize: 11, color: '#64748b' }}>{fmtDuration(g.totalTime)}</div>
              </div>

              {/* Expanded visits */}
              {expandedIP === g.ip && (
                <div style={{ background: '#0d0d15', borderBottom: '1px solid #1e1e2e', padding: '0 16px 12px' }}>
                  <div style={{ paddingTop: 10, marginBottom: 6, fontSize: 10, color: '#475569', letterSpacing: '0.08em', fontWeight: 700 }}>
                    ALL {g.count} VISITS FROM {g.ip}
                  </div>
                  {g.visits.map((v, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 120px 80px', gap: 8, padding: '7px 0', borderBottom: i < g.visits.length - 1 ? '1px solid #1a1a22' : 'none', alignItems: 'center' }}>
                      <div style={{ fontSize: 10, color: '#475569' }}>{new Date(v.ts).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                      <div>
                        <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{v.page}</span>
                        {v.ref && v.ref !== 'direct' && <span style={{ fontSize: 10, color: '#475569', marginLeft: 8 }}>← {v.ref.slice(0, 30)}</span>}
                      </div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>{deviceEmoji(v.device, v.brand)} {v.brand} · {v.browser}</div>
                      <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>{fmtDuration(v.duration)}</div>
                    </div>
                  ))}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        <div style={{ marginTop: 20, fontSize: 10, color: '#1e293b', textAlign: 'center' }}>
          tobi.log analytics · data in Cloudflare KV · owner IPs auto-excluded
        </div>
      </div>
    </div>
  );
};

export default Analytics;
