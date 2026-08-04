import React, { useState } from 'react';

interface Visit {
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

interface IpGroup {
  ip: string;
  city: string;
  country: string;
  isp: string;
  count: number;
  visits: Visit[];
  lastSeen: number;
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

function groupByIP(visits: Visit[]): IpGroup[] {
  const map = new Map<string, IpGroup>();
  for (const v of visits) {
    if (!map.has(v.ip)) {
      map.set(v.ip, { ip: v.ip, city: v.city, country: v.country, isp: v.isp, count: 0, visits: [], lastSeen: 0 });
    }
    const g = map.get(v.ip)!;
    g.count++;
    g.visits.push(v);
    if (v.ts > g.lastSeen) {
      g.lastSeen = v.ts;
      g.city = v.city;
      g.country = v.country;
      g.isp = v.isp;
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
      if (res.status === 401) {
        setAuthError(true);
        setAuthed(false);
        setLoading(false);
        return;
      }
      const data: Visit[] = await res.json();
      setVisits(data.reverse()); // newest first
      setAuthed(true);
      setAuthError(false);
    } catch {
      setAuthError(true);
    }
    setLoading(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(password);
  };

  const filtered = filterPage
    ? visits.filter(v => v.page.includes(filterPage))
    : visits;

  const groups = groupByIP(filtered);

  const uniqueCountries = [...new Set(visits.map(v => v.country))].filter(Boolean).length;
  const uniquePages = [...new Set(visits.map(v => v.page))];

  /* ── Login screen ── */
  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: mono }}>
        <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, padding: 40, width: 360, boxShadow: '0 0 60px rgba(239,68,68,0.05)' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🛡</div>
            <div style={{ fontFamily: sans, fontSize: 18, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>tobi.log / stats</div>
            <div style={{ fontSize: 12, color: '#475569' }}>Restricted access — enter password</div>
          </div>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter stats password…"
              autoFocus
              style={{
                width: '100%', background: '#0d1117', border: `1px solid ${authError ? '#ef4444' : '#30363d'}`,
                borderRadius: 6, padding: '10px 14px', color: '#e2e8f0', fontFamily: mono,
                fontSize: 14, outline: 'none', marginBottom: 12, boxSizing: 'border-box',
              }}
            />
            {authError && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>Wrong password. Try again.</div>}
            <button type="submit" style={{
              width: '100%', background: 'linear-gradient(135deg,#ef4444,#f97316)', border: 'none',
              borderRadius: 6, padding: '10px 0', color: '#fff', fontFamily: mono, fontSize: 14,
              fontWeight: 700, cursor: 'pointer',
            }}>
              {loading ? 'Loading…' : 'Authenticate →'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ── Dashboard ── */
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e2e8f0', fontFamily: mono, padding: '32px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: sans, fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>🛡 tobi.log / stats</div>
            <div style={{ fontSize: 12, color: '#475569' }}>Visitor analytics — unique IPs deduplicated</div>
          </div>
          <button onClick={() => setAuthed(false)} style={{ background: '#111118', border: '1px solid #30363d', borderRadius: 6, padding: '8px 16px', color: '#94a3b8', fontFamily: mono, fontSize: 12, cursor: 'pointer' }}>
            Logout
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Total Visits', value: visits.length, color: '#3b82f6' },
            { label: 'Unique IPs', value: groups.length, color: '#ef4444' },
            { label: 'Countries', value: uniqueCountries, color: '#f59e0b' },
            { label: 'Pages Hit', value: uniquePages.length, color: '#22c55e' },
          ].map(s => (
            <div key={s.label} style={{ background: '#111118', border: `1px solid ${s.color}22`, borderTop: `2px solid ${s.color}`, borderRadius: 8, padding: '16px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div style={{ marginBottom: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#475569', alignSelf: 'center' }}>Filter by page:</span>
          {['', '/', '/blog/mpsc', '/blog/upsc'].map(p => (
            <button key={p} onClick={() => setFilterPage(p)}
              style={{ background: filterPage === p ? 'rgba(239,68,68,0.12)' : '#111118', border: `1px solid ${filterPage === p ? '#ef4444' : '#1e1e2e'}`, borderRadius: 99, padding: '4px 12px', color: filterPage === p ? '#ef4444' : '#64748b', fontSize: 12, cursor: 'pointer', fontFamily: mono }}>
              {p || 'all'}
            </button>
          ))}
        </div>

        {/* IP groups table */}
        <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e1e2e', display: 'grid', gridTemplateColumns: '1fr 120px 120px 80px 80px', gap: 8, fontSize: 11, color: '#475569', fontWeight: 600, letterSpacing: '0.06em' }}>
            <span>IP / LOCATION</span>
            <span>ISP</span>
            <span>LAST SEEN</span>
            <span style={{ textAlign: 'center' }}>VISITS</span>
            <span></span>
          </div>

          {groups.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: '#475569', fontSize: 13 }}>No visits recorded yet.</div>
          )}

          {groups.map(g => (
            <React.Fragment key={g.ip}>
              <div
                onClick={() => setExpandedIP(expandedIP === g.ip ? null : g.ip)}
                style={{ padding: '14px 16px', borderBottom: '1px solid #1a1a22', display: 'grid', gridTemplateColumns: '1fr 120px 120px 80px 80px', gap: 8, alignItems: 'center', cursor: 'pointer', transition: 'background 0.15s', background: expandedIP === g.ip ? 'rgba(239,68,68,0.04)' : 'transparent' }}
              >
                <div>
                  <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}>{g.ip}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{g.city}, {g.country}</div>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.isp}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{timeAgo(g.lastSeen)}</div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 99, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>
                    {g.count}
                  </span>
                </div>
                <div style={{ fontSize: 14, color: '#475569', textAlign: 'center' }}>{expandedIP === g.ip ? '▲' : '▼'}</div>
              </div>

              {/* Expanded visit rows */}
              {expandedIP === g.ip && (
                <div style={{ background: '#0d0d15', borderBottom: '1px solid #1e1e2e', padding: '0 16px 12px' }}>
                  <div style={{ paddingTop: 12, marginBottom: 8, fontSize: 11, color: '#475569', letterSpacing: '0.06em' }}>
                    ALL VISITS FROM {g.ip} ({g.count} total)
                  </div>
                  {g.visits.map((v, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 100px 120px', gap: 8, padding: '8px 0', borderBottom: i < g.visits.length - 1 ? '1px solid #1a1a22' : 'none', alignItems: 'center' }}>
                      <div style={{ fontSize: 11, color: '#475569' }}>{new Date(v.ts).toLocaleString()}</div>
                      <div>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>{v.page}</span>
                        {v.ref && v.ref !== 'direct' && <span style={{ fontSize: 11, color: '#475569', marginLeft: 8 }}>← {v.ref}</span>}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{v.device} · {v.browser}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{v.os} · {v.screen}</div>
                    </div>
                  ))}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        <div style={{ marginTop: 24, fontSize: 11, color: '#334155', textAlign: 'center' }}>
          tobi.log analytics · data stored in Cloudflare KV · owner IPs excluded
        </div>
      </div>
    </div>
  );
};

export default Analytics;
