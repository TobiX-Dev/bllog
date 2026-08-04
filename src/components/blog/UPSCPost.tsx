import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import imgRSAKeys from '../../assets/blog/upsc/rsa-keys.png';
import imgFirebase from '../../assets/blog/upsc/firebase.png';
import imgToolkit from '../../assets/blog/upsc/toolkit.png';
import imgSentEmail from '../../assets/blog/upsc/sent-email.png';
import imgCertInReply from '../../assets/blog/upsc/certin-reply.png';

/* ─── TOC sections ─────────────────────────────────────────────────────── */
const TOC_SECTIONS = [
  { id: 'toc-tldr',       label: 'TL;DR & Summary' },
  { id: 'toc-vuln-index', label: 'Vulnerability Index' },
  { id: 'toc-how',        label: 'How I Found It' },
  { id: 'toc-critical',   label: 'Critical Findings' },
  { id: 'toc-toolkit',    label: 'PoC Toolkit' },
  { id: 'toc-high',       label: 'High Severity' },
  { id: 'toc-evidence',   label: 'Evidence — JS Bundle' },
  { id: 'toc-medium',     label: 'Medium Severity' },
  { id: 'toc-disclosure', label: 'Official Response' },
  { id: 'toc-chain',      label: 'Attack Chain' },
  { id: 'toc-timeline',   label: 'Timeline' },
  { id: 'toc-takeaways',  label: 'Key Takeaways' },
  { id: 'toc-certin',     label: 'CERT-In ACK' },
];

/* ─── TerminalFrame ─────────────────────────────────────────────────────── */
const TerminalFrame: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ border: '1px solid #30363d', borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
    <div style={{ background: '#1e1e2e', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57', display: 'inline-block', flexShrink: 0 }} />
      <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e', display: 'inline-block', flexShrink: 0 }} />
      <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840', display: 'inline-block', flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
    </div>
    {children}
  </div>
);

/* ─── CodeBlock ────────────────────────────────────────────────────────── */
const CodeBlock: React.FC<{ code: string; lang?: string }> = ({ code, lang = 'text' }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ marginTop: 12, marginBottom: 12 }}>
      <div style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', background: '#161b22', borderBottom: '1px solid #30363d' }}>
          <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>{lang}</span>
          <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#22c55e' : '#94a3b8', fontSize: 12, fontFamily: 'inherit', transition: 'color 0.2s' }}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <pre style={{ margin: 0, padding: 16, overflowX: 'auto', fontSize: 13, lineHeight: 1.6, color: '#e6edf3', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

/* ─── SevBadge ─────────────────────────────────────────────────────────── */
const SevBadge: React.FC<{ level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'FIXED' }> = ({ level }) => {
  const map: Record<string, { bg: string; color: string }> = {
    CRITICAL: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
    HIGH:     { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
    MEDIUM:   { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
    LOW:      { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' },
    FIXED:    { bg: 'rgba(34,197,94,0.15)', color: '#22c55e' },
  };
  const s = map[level] || map.LOW;
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}33`, borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
      {level}
    </span>
  );
};

/* ─── FindingCard ──────────────────────────────────────────────────────── */
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
          <span style={{ background: '#0d1117', border: `1px solid ${accentColor}66`, borderRadius: 4, padding: '2px 8px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: accentColor, fontWeight: 700 }}>{f.id}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#475569' }}>CVSS {f.cvss}</span>
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

/* ─── Section anchor wrapper ───────────────────────────────────────────── */
const Section: React.FC<{ id: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ id, children, style }) => (
  <section id={id} style={{ scrollMarginTop: 80, ...style }}>{children}</section>
);

/* ─── Data ─────────────────────────────────────────────────────────────── */
const criticalFindings: Finding[] = [
  {
    id: 'V-01', cvss: '9.8', severity: 'CRITICAL',
    title: 'Complete API Gateway Authentication Bypass via Hardcoded HMAC Credentials',
    description: 'Every backend request requires a custom Secretkey header generated from a static HMAC salt + UUID hardcoded in the public JS bundle. Any attacker who reads the bundle can generate valid Secretkey headers indefinitely — bypassing the primary WAF control of the entire API.',
    code: `// Extracted from main.js (minified, deobfuscated)
Secretkey = SHA-512( REDACTED_SALT + Timestamp + REDACTED_UUID )
// Timestamp = current UTC → DDMMYYYYHHmmss

// Python PoC (own account only):
import hashlib, datetime
ts = datetime.datetime.utcnow().strftime("%d%m%Y%H%M%S")
key = hashlib.sha512((SALT + ts + UUID).encode()).hexdigest()
# => Identical to browser-generated Secretkey, verified byte-for-byte`,
    codeLang: 'python',
    impact: 'Full API gateway bypass. Any endpoint — authenticated or not — accessible via script with no browser, session, or credentials.',
  },
  {
    id: 'V-02', cvss: '9.8', severity: 'CRITICAL',
    title: 'RSA-2048 Private Key Exposed in Client-Side JavaScript Bundle',
    description: 'The login flow has the server return an RSA-encrypted salt blob which the client decrypts using a private key. That private key — a full 2048-bit PEM — is hardcoded in the public JS bundle. Using it, any attacker can decrypt live server responses in real time.',
    code: `-----BEGIN RSA PRIVATE KEY-----
MIIEqQIBAAKCAQEAgl86yTvv...  [truncated for security]
-----END RSA PRIVATE KEY-----

# Verified: decrypted live salt from production API:
Encrypted:  Xykw3dj9oJzdER6I14MZaR[REDACTED]...
Decrypted:  eUuGbS0cRtITzqXr  ✅

# Full password hash chain now reconstructable:
hashedPassword = Base64( SHA-512( SHA-512(password) + decrypted_salt ) )`,
    codeLang: 'text',
    impact: 'Complete authentication bypass. Entire login ceremony scriptable end-to-end.',
  },
  {
    id: 'V-03', cvss: '9.1', severity: 'CRITICAL',
    title: 'IDOR — Mass Aadhaar & PII Data Exposure via Sequential Applicant IDs',
    description: "Backend data endpoints use sequential numeric Applicant IDs with no server-side ownership check. A logged-in user can access any other candidate's full profile, Aadhaar UID, photographs, admit cards, disability records, and caste documents by incrementing the ID.",
    code: `# All confirmed via own account:
GET /ngrp_api/FullProfile/GetFUllProfile/{id}
GET /ngrp_api/PersonalProfile/Get/{id}
GET /ngrp_api/Identity/Get/{id}
GET /ngrp_api/vault/V2/Register/{id}         # ← Aadhaar UID
GET /ngrp_api/SocialCategoryProfile/Get/{id} # ← Caste data
GET /ngrp_api/Disability/udid/{id}
GET /ngrp_api/download_photo/{id}
GET /ngrp_api/admin_api/Get_eAdmitCard/{id}`,
    codeLang: 'http',
    impact: 'Mass PII exfiltration. Aadhaar data exposure violates Section 29, Aadhaar Act 2016.',
  },
  {
    id: 'V-04', cvss: '9.1', severity: 'CRITICAL',
    title: 'Aadhaar Demo Auth & OTP APIs Accessible Without Ownership Verification',
    description: 'Aadhaar demographic authentication and OTP-based vault endpoints accept arbitrary Applicant IDs from any authenticated session. Combined with V-01/V-03, an attacker can initiate Aadhaar flows on behalf of any candidate.',
    code: `POST /ngrp_api/vault/V2/SendOtp
{ "applicantId": <victim_id>, "aadhaarNo": "xxxx xxxx xxxx" }

POST /ngrp_api/vault/V2/DemoAuth
{ "applicantId": <victim_id>, "name": "...", "dob": "..." }`,
    codeLang: 'http',
    impact: 'Unauthorized Aadhaar authentication flows. Potential account takeover and identity verification fraud at scale.',
  },
  {
    id: 'V-05', cvss: '8.8', severity: 'CRITICAL',
    title: 'DigiLocker OAuth Redirect — Document Retrieval Without Candidate Consent',
    description: "Hardcoded DigiLocker Client ID + Secret (see V-06) combined with IDOR allow an attacker to initiate a DigiLocker OAuth 2.0 flow as the UPSC portal and retrieve stored government documents linked to any candidate's DigiLocker account.",
    code: `GET https://digilocker.gov.in/public/oauth2/1/authorize
  ?response_type=code
  &client_id=<extracted_from_bundle>
  &redirect_uri=https://upsconline.nic.in/ngrp_api/digilocker/callback
  &state=<victim_applicant_id>`,
    codeLang: 'http',
    impact: 'Unauthorized retrieval of stored DigiLocker documents (Aadhaar, PAN, degree certificates) of any registered candidate.',
  },
];

const highFindings: Finding[] = [
  {
    id: 'V-06', cvss: '7.5', severity: 'HIGH',
    title: 'Hardcoded DigiLocker & UDID OAuth Client Secrets in JS Bundle',
    description: 'Full OAuth 2.0 Client IDs and Client Secrets for DigiLocker and UDID hardcoded in the public JavaScript bundle.',
    code: `CLIENT_ID:     "0ca22ccc84c7c9f9811e47f8********"
CLIENT_SECRET: "c05e91cb548ec3434c4048d8********"
UDID_CLIENT_ID:     "a7f3b2e1d9c4f8a2b1e3d7c9********"
UDID_CLIENT_SECRET: "c8e2a4f6b3d1e7c9a2f4b8d6********"`,
    codeLang: 'javascript',
    impact: 'Impersonation of UPSC portal to DigiLocker/UDID APIs. Unauthorized document retrieval.',
  },
  {
    id: 'V-07', cvss: '7.2', severity: 'HIGH',
    title: 'Firebase Cloud Messaging Full Project Config Exposed',
    description: 'Complete Firebase configuration including API key, Project ID, Messaging Sender ID, and full VAPID public key exposed in the bundle.',
    code: `Firebase apiKey:       "AIzaSyDRuNakzmVTaeom8LML********"
authDomain:            "nra-prod-2024.firebaseapp.com"
projectId:             "nra-prod-2024"
messagingSenderId:     "6841********"
appId:                 "1:6841...:web:f8a2b3c4d5e6f7a8b9c0d1"`,
    codeLang: 'javascript',
    impact: 'Push notification spoofing to candidates. Firebase project enumeration.',
  },
  {
    id: 'V-08', cvss: '7.5', severity: 'HIGH',
    title: 'Unauthenticated User Enumeration — Mobile & Email Oracle at Scale',
    description: 'Two registration check endpoints return distinct responses for registered vs. unregistered mobile numbers and email addresses, with no authentication, no rate limiting, and no CAPTCHA.',
    code: `POST /ngrp_api/onboarding/V1/Search/MobileNo
{ "mobileNo": "9XXXXXXXXX" }
# Registered:   { "status": true, "message": "Mobile No. is already registered..." }
# Unregistered: { "status": false }

POST /ngrp_api/onboarding/V1/Search/EmailId
{ "emailId": "target@example.com" }`,
    codeLang: 'http',
    impact: 'Build a confirmed database of UPSC/NRA applicants for targeted phishing campaigns.',
  },
  {
    id: 'V-09', cvss: '7.2', severity: 'HIGH',
    title: 'No Rate Limiting on Login, OTP, or Data Endpoints',
    description: 'Authentication endpoints and all data endpoints accept unlimited requests with no lockout or throttling.',
    impact: 'Fully automated credential stuffing, OTP brute-force, and bulk candidate data scraping.',
  },
  {
    id: 'V-10', cvss: '6.5', severity: 'HIGH',
    title: 'Sensitive API Endpoints Accessible Over HTTP (No HTTPS Enforcement)',
    description: 'Several internal API endpoints serve content over plain HTTP, bypassing the HTTPS redirect enforced on the main portal. Traffic including Aadhaar data and auth tokens is interceptable.',
    impact: 'Man-in-the-middle interception of auth tokens, session cookies, and Aadhaar data.',
  },
  {
    id: 'V-11', cvss: '6.8', severity: 'HIGH',
    title: 'Missing Security Headers — CSP, X-Frame-Options, HSTS',
    description: 'The portal returns no CSP, X-Frame-Options, X-Content-Type-Options, or Referrer-Policy headers.',
    code: `Content-Security-Policy:   [MISSING]
X-Frame-Options:           [MISSING]   ← enables clickjacking
X-Content-Type-Options:    [MISSING]
Referrer-Policy:           [MISSING]`,
    codeLang: 'http',
    impact: 'Clickjacking of login and Aadhaar consent UI. MIME-type sniffing. Referrer leakage.',
  },
  {
    id: 'V-12', cvss: '6.1', severity: 'HIGH',
    title: 'JWT Tokens Without Expiry — Persistent Session Tokens',
    description: 'Issued JWT access tokens have extremely long expiry windows (72h+ observed) with no server-side revocation mechanism.',
    impact: 'Compromised sessions remain active long after the user logs out. Token theft grants persistent access.',
  },
];

const mediumFindings: Finding[] = [
  {
    id: 'V-13', cvss: '5.3', severity: 'MEDIUM',
    title: 'Verbose Error Messages Leak Stack Traces & Framework Versions',
    description: 'Backend error responses include full exception stack traces, framework version strings (Spring Boot 2.7.x), and internal package paths when unexpected inputs are provided.',
    impact: 'Accelerated vulnerability discovery. Framework version disclosure enables targeted CVE exploitation.',
  },
  {
    id: 'V-14', cvss: '5.0', severity: 'MEDIUM',
    title: 'Insecure File Upload — No MIME Validation',
    description: 'The photo and document upload endpoints validate file type only by extension, not by MIME type or file header magic bytes.',
    impact: 'Potential for malicious file storage. Stored XSS via SVG upload.',
  },
  {
    id: 'V-15', cvss: '4.3', severity: 'MEDIUM',
    title: 'Candidate PII in JWT Payload Without Encryption',
    description: "Issued JWT access tokens include the candidate's full email address, full name, and mobile number in the payload (base64-encoded, not encrypted).",
    impact: 'PII leakage via token interception. Candidate info exposed in server logs and proxy logs.',
  },
];

const vulnTableData = [
  { id: 'V-01', title: 'API Gateway Authentication Bypass',       severity: 'CRITICAL', cvss: '9.8' },
  { id: 'V-02', title: 'RSA-2048 Private Key in JS Bundle',       severity: 'CRITICAL', cvss: '9.8' },
  { id: 'V-03', title: 'IDOR — Mass Aadhaar & PII Exposure',      severity: 'CRITICAL', cvss: '9.1' },
  { id: 'V-04', title: 'Aadhaar Demo Auth Without Ownership',      severity: 'CRITICAL', cvss: '9.1' },
  { id: 'V-05', title: 'DigiLocker OAuth Redirect Abuse',          severity: 'CRITICAL', cvss: '8.8' },
  { id: 'V-06', title: 'Hardcoded DigiLocker & UDID OAuth Secrets',severity: 'HIGH',     cvss: '7.5' },
  { id: 'V-07', title: 'Firebase Full Project Config Exposed',     severity: 'HIGH',     cvss: '7.2' },
  { id: 'V-08', title: 'Unauthenticated User Enumeration',        severity: 'HIGH',     cvss: '7.5' },
  { id: 'V-09', title: 'No Rate Limiting on Auth/Data Endpoints', severity: 'HIGH',     cvss: '7.2' },
  { id: 'V-10', title: 'Sensitive Endpoints Over HTTP',           severity: 'HIGH',     cvss: '6.5' },
  { id: 'V-11', title: 'Missing Security Headers',                severity: 'HIGH',     cvss: '6.8' },
  { id: 'V-12', title: 'JWT Tokens Without Expiry',               severity: 'HIGH',     cvss: '6.1' },
  { id: 'V-13', title: 'Verbose Error — Stack Traces Exposed',    severity: 'MEDIUM',   cvss: '5.3' },
  { id: 'V-14', title: 'Insecure File Upload — No MIME Validation',severity: 'MEDIUM',  cvss: '5.0' },
  { id: 'V-15', title: 'PII in JWT Payload Without Encryption',   severity: 'MEDIUM',   cvss: '4.3' },
];
const sevColor: Record<string, string> = { CRITICAL: '#ef4444', HIGH: '#f59e0b', MEDIUM: '#3b82f6' };

/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════ */
const UPSCPost: React.FC = () => {
  const [activeSection, setActiveSection] = useState('toc-tldr');
  const progressRef = useRef<HTMLDivElement>(null);

  /* scroll progress bar */
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop / (el.scrollHeight - el.clientHeight);
      if (progressRef.current) progressRef.current.style.width = `${scrolled * 100}%`;

      /* active TOC highlight */
      for (let i = TOC_SECTIONS.length - 1; i >= 0; i--) {
        const sec = document.getElementById(TOC_SECTIONS[i].id);
        if (sec && sec.getBoundingClientRect().top <= 120) {
          setActiveSection(TOC_SECTIONS[i].id);
          break;
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const tagColors: Record<string, { bg: string; color: string }> = {
    'Critical Severity':      { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' },
    'Responsible Disclosure': { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
    'CERT-In Acknowledged':   { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    'Fixed & Patched':        { bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
  };

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Scroll progress bar ───────────────────────────────────────── */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: '#1e1e2e', zIndex: 9999 }}>
        <div ref={progressRef} style={{ height: '100%', background: 'linear-gradient(90deg, #ef4444, #f59e0b, #22c55e)', width: '0%', transition: 'width 0.1s linear', borderRadius: '0 2px 2px 0' }} />
      </div>

      <div style={{ display: 'flex', maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>

        {/* ── TOC Sidebar ──────────────────────────────────────────────── */}
        <aside style={{
          width: 220,
          flexShrink: 0,
          position: 'sticky',
          top: 80,
          height: 'fit-content',
          paddingTop: 48,
          paddingRight: 20,
          display: 'none',
        }}
          className="toc-sidebar"
        >
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#475569', textTransform: 'uppercase', marginBottom: 16, fontFamily: "'JetBrains Mono', monospace" }}>
            TABLE OF CONTENTS
          </div>
          <nav>
            {TOC_SECTIONS.map(sec => {
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => scrollTo(sec.id)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '6px 0 6px 14px',
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#e2e8f0' : '#475569',
                    borderLeft: `2px solid ${isActive ? '#ef4444' : '#1e1e2e'}`,
                    transition: 'all 0.2s ease',
                    lineHeight: 1.4,
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget.style.color = '#94a3b8'); }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget.style.color = '#475569'); }}
                >
                  {sec.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── Main content ─────────────────────────────────────────────── */}
        <div style={{ flex: 1, maxWidth: 860, paddingTop: 0, paddingBottom: 80, minWidth: 0 }}>

          {/* HERO */}
          <div style={{ paddingTop: 48, paddingBottom: 32 }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#94a3b8', textDecoration: 'none', fontSize: 14, marginBottom: 28, transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#e2e8f0')}
              onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>
              ← Blog
            </Link>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {['Critical Severity', 'Responsible Disclosure', 'CERT-In Acknowledged', 'Fixed & Patched'].map(tag => {
                const c = tagColors[tag];
                return <span key={tag} style={{ background: c.bg, color: c.color, border: `1px solid ${c.color}44`, borderRadius: 99, padding: '4px 12px', fontSize: 12, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{tag}</span>;
              })}
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.3, color: '#e2e8f0', margin: '0 0 20px' }}>
              UPSC NRA Candidate Portal — Multiple Critical &amp; High-Severity Vulnerabilities
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 13, color: '#475569', marginBottom: 28, alignItems: 'center' }}>
              <span style={{ color: '#94a3b8', fontWeight: 600 }}>Tobi</span>
              <span>·</span><span>June 14, 2026</span>
              <span>·</span><span>12 min read</span>
              <span>·</span>
              <span style={{ color: '#22c55e', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>🛡 CERT-In: CERTIn-20460826</span>
            </div>
            <div style={{ borderTop: '1px solid #1e1e2e' }} />
          </div>

          {/* TL;DR */}
          <Section id="toc-tldr" style={{ marginBottom: 40 }}>
            <div style={{ borderLeft: '3px solid #ef4444', background: 'rgba(239,68,68,0.05)', borderRadius: 8, padding: '16px 20px', marginBottom: 32 }}>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.8, color: '#94a3b8' }}>
                <span style={{ fontWeight: 700, color: '#ef4444' }}>TL;DR: </span>
                The UPSC NRA portal's public JavaScript bundle contained an RSA-2048 private key, HMAC secrets for API gateway authentication, DigiLocker and UDID OAuth client secrets, and Firebase configuration — all in plaintext. Combined with an IDOR vulnerability affecting every data endpoint, this would have allowed full extraction of Aadhaar numbers, photographs, admit cards, and PII for every registered candidate. All findings were responsibly disclosed to CERT-In (ref: CERTIn-20460826) before publication. All endpoints have since been patched.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 0 }}>
              {[{ label: 'Critical', value: '5', color: '#ef4444' }, { label: 'High', value: '7', color: '#f59e0b' }, { label: 'Medium', value: '3', color: '#3b82f6' }, { label: 'All Patched', value: '✓', color: '#22c55e' }]
                .map(s => (
                  <div key={s.label} style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 8, padding: '18px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 30, fontWeight: 800, color: s.color, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: '#475569', marginTop: 6, fontWeight: 600 }}>{s.label}</div>
                  </div>
                ))}
            </div>
          </Section>

          {/* VULN TABLE */}
          <Section id="toc-vuln-index" style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', marginBottom: 16 }}>Full Vulnerability Index</h2>
            <div style={{ border: '1px solid #1e1e2e', borderRadius: 8, overflow: 'hidden', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 560 }}>
                <thead>
                  <tr style={{ background: '#1e1e2e' }}>
                    {['ID', 'Finding', 'Severity', 'CVSS', 'Status'].map((h, i) => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: i >= 3 ? 'center' : 'left', color: '#475569', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vulnTableData.map((r, i) => (
                    <tr key={r.id} style={{ background: i % 2 === 0 ? '#111118' : '#0d0d14', borderTop: '1px solid #1e1e2e' }}>
                      <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: sevColor[r.severity], fontWeight: 700, whiteSpace: 'nowrap' }}>{r.id}</td>
                      <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{r.title}</td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: sevColor[r.severity], display: 'inline-block' }} />
                          <span style={{ color: sevColor[r.severity], fontSize: 11, fontWeight: 700 }}>{r.severity}</span>
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", color: '#94a3b8' }}>{r.cvss}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid #22c55e44', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>Fixed</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* HOW I FOUND IT */}
          <Section id="toc-how" style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>How I Found It</h2>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: '#94a3b8', marginBottom: 16 }}>
              The entry point was the UPSC NRA portal's Angular production bundle — a 14.6MB minified JS file served to every browser visitor. Angular apps ship their entire source in this file. With a JS formatter and a bit of patience, the full application logic including API routes, cryptographic functions, and hardcoded secrets becomes readable.
            </p>
            <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 8, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12, fontFamily: "'JetBrains Mono', monospace" }}>Tools of the Trade</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Browser DevTools', 'curl', 'Python (Requests + PyCryptodome)', 'JS Pretty-Printer', 'grep / findstr'].map(t => (
                  <span key={t} style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 4, padding: '4px 10px', fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: '#e6edf3' }}>{t}</span>
                ))}
              </div>
            </div>
          </Section>

          {/* CRITICAL */}
          <Section id="toc-critical" style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px #ef4444' }} />
              Critical Findings — V-01 to V-05
            </h2>
            {criticalFindings.map(f => <FindingCard key={f.id} f={f} />)}
          </Section>

          {/* TOOLKIT */}
          <Section id="toc-toolkit" style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>🛠 Proof of Concept Toolkit</h2>
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 20, lineHeight: 1.7 }}>
              Custom Python toolkit built to verify and demonstrate the attack chains. All tests run after responsible disclosure — against the researcher's own account only.
            </p>
            <TerminalFrame title="idor_attack.py — Thonny Python IDE">
              <img src={imgToolkit} alt="Python PoC toolkit showing 15+ confirmed vulnerabilities" style={{ width: '100%', display: 'block' }} />
            </TerminalFrame>
            <p style={{ fontSize: 12, color: '#475569', marginTop: 8, lineHeight: 1.6 }}>
              Figure 1: Python exploitation toolkit — showing 15+ confirmed vulnerabilities with RSA key decryption, DigiLocker OAuth abuse, Aadhaar Demo Auth, and IDOR attack chains verified against own account.
            </p>
          </Section>

          {/* HIGH */}
          <Section id="toc-high" style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 8px #f59e0b' }} />
              High Severity Findings — V-06 to V-12
            </h2>
            {highFindings.map(f => <FindingCard key={f.id} f={f} />)}
          </Section>

          {/* EVIDENCE */}
          <Section id="toc-evidence" style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>Evidence — Secrets Exposed in Production JS Bundle</h2>
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 24, lineHeight: 1.7 }}>
              Both of the following were found in the publicly accessible minified JavaScript bundle — downloaded by every browser that visits the portal.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
              {/* RSA */}
              <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderLeft: '3px solid #ef4444', borderRadius: 8, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>🔑 RSA-2048 Private Key in main.js</span>
                  <SevBadge level="CRITICAL" />
                </div>
                <TerminalFrame title="main.js — Chrome DevTools Sources">
                  <img src={imgRSAKeys} alt="RSA private key visible in production JS bundle" style={{ width: '100%', display: 'block' }} />
                </TerminalFrame>
                <p style={{ fontSize: 12, color: '#475569', margin: '8px 0 12px', lineHeight: 1.6 }}>The RSA private key used to decrypt ALL server responses — including Aadhaar data — was visible in plaintext in the public JavaScript bundle.</p>
                <CodeBlock code={`-----BEGIN RSA PRIVATE KEY-----\nMIIEqQIBAAKCAQEAgl86yTvv...  [truncated for security]\n-----END RSA PRIVATE KEY-----`} lang="pem" />
              </div>
              {/* Firebase */}
              <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderLeft: '3px solid #f59e0b', borderRadius: 8, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>🔥 Firebase Config + Client Secrets</span>
                  <SevBadge level="HIGH" />
                </div>
                <TerminalFrame title="main.js — VS Code (deobfuscated diff)">
                  <img src={imgFirebase} alt="Firebase config and OAuth secrets in JS bundle" style={{ width: '100%', display: 'block' }} />
                </TerminalFrame>
                <p style={{ fontSize: 12, color: '#475569', margin: '8px 0 12px', lineHeight: 1.6 }}>Full Firebase configuration, DigiLocker OAuth secrets, UDID client credentials, and all API endpoints exposed in the minified JS bundle.</p>
                <CodeBlock code={`CLIENT_ID:     0ca22ccc84c7c9f9811e47f8********\nCLIENT_SECRET: c05e91cb548ec3434c4048d8********\nFirebase apiKey: AIzaSyDRuNakzmVTaeom8LML********\nmessagingSenderId: 6841********`} lang="env" />
              </div>
            </div>
          </Section>

          {/* MEDIUM */}
          <Section id="toc-medium" style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 8px #3b82f6' }} />
              Medium Severity Findings — V-13 to V-15
            </h2>
            {mediumFindings.map(f => <FindingCard key={f.id} f={f} />)}
          </Section>

          {/* DISCLOSURE / CERT-In emails */}
          <Section id="toc-disclosure" style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>📧 Responsible Disclosure — Official Responses</h2>
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 24, lineHeight: 1.7 }}>
              Reported to CERT-In (cert-in.org.in) and UPSC (upscsoap@nic.in) before any public disclosure. Both acknowledged within hours.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 8, padding: 20 }}>
                <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 700, marginBottom: 10, fontFamily: "'JetBrains Mono', monospace" }}>📤 Sent — June 3, 2026 at 11:36 AM</div>
                <TerminalFrame title="Gmail — Disclosure Report Sent">
                  <img src={imgSentEmail} alt="Disclosure report sent to CERT-In and UPSC" style={{ width: '100%', display: 'block' }} />
                </TerminalFrame>
                <p style={{ fontSize: 12, color: '#475569', margin: '8px 0 0', lineHeight: 1.6 }}>Responsible disclosure report sent to upscsoap@nic.in and incident@cert-in.org.in with full technical details, CVSS scores, and PoC documentation.</p>
              </div>
              <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 8, padding: 20 }}>
                <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 700, marginBottom: 10, fontFamily: "'JetBrains Mono', monospace" }}>📨 Response — June 3, 2026 at 9:07 PM</div>
                <TerminalFrame title="Gmail — CERT-In Acknowledgement">
                  <img src={imgCertInReply} alt="CERT-In acknowledgement reply with reference number" style={{ width: '100%', display: 'block' }} />
                </TerminalFrame>
                <p style={{ fontSize: 12, color: '#475569', margin: '8px 0 0', lineHeight: 1.6 }}>CERT-In acknowledged within 9 hours. Ref: CERTIn-20460826 — "registered and forwarded to concerned authority for appropriate action".</p>
              </div>
            </div>
          </Section>

          {/* ATTACK CHAIN */}
          <Section id="toc-chain" style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', marginBottom: 20 }}>The Complete Attack Chain</h2>
            <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 8, padding: 28, overflowX: 'auto' }}>
              <div style={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'center', gap: 6, justifyContent: 'flex-start', minWidth: 600 }}>
                {[
                  { id: 'V-09', label: 'V-09\nNo Rate Limit', color: '#f59e0b' },
                  { id: 'a1', label: '→', isArrow: true },
                  { id: 'V-08', label: 'V-08\nUser Enum', color: '#f59e0b' },
                  { id: 'a2', label: '→', isArrow: true },
                  { id: 'V-06', label: 'V-06\nOAuth Secrets', color: '#f59e0b' },
                  { id: 'a3', label: '→', isArrow: true },
                  { id: 'V-01', label: 'V-01\nAPI Bypass', color: '#ef4444' },
                  { id: 'a4', label: '→', isArrow: true },
                  { id: 'V-02', label: 'V-02\nRSA Key', color: '#ef4444' },
                  { id: 'a5', label: '→', isArrow: true },
                  { id: 'V-03', label: 'V-03\nIDOR', color: '#ef4444' },
                  { id: 'a6', label: '→', isArrow: true },
                  { id: 'result', label: '🔴 MASS\nAadhaar PII\nEXFIL', color: '#ef4444', isResult: true },
                ].map(step => {
                  if (step.isArrow) return <span key={step.id} style={{ color: '#475569', fontSize: 16, flexShrink: 0 }}>{step.label}</span>;
                  return (
                    <div key={step.id} style={{
                      background: step.isResult ? 'rgba(239,68,68,0.12)' : '#0d1117',
                      border: `1px solid ${step.color}44`,
                      borderRadius: 6, padding: '10px 12px', textAlign: 'center',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: step.isResult ? 11 : 10, fontWeight: 700, color: step.color,
                      whiteSpace: 'pre', lineHeight: 1.4, flexShrink: 0,
                    }}>{step.label}</div>
                  );
                })}
              </div>
            </div>
          </Section>

          {/* TIMELINE */}
          <Section id="toc-timeline" style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', marginBottom: 24 }}>Disclosure Timeline</h2>
            <div style={{ position: 'relative', paddingLeft: 32 }}>
              <div style={{ position: 'absolute', left: 7, top: 8, bottom: 8, width: 2, background: '#1e1e2e', borderRadius: 2 }} />
              {[
                { dot: '#22c55e', label: 'May 2026', text: 'Vulnerabilities discovered during personal research on the UPSC NRA portal.' },
                { dot: '#3b82f6', label: 'June 3, 2026 — 11:36 AM', text: 'Full technical report sent to CERT-In (incident@cert-in.org.in) and UPSC (upscsoap@nic.in) with CVSS scores and PoC documentation.' },
                { dot: '#f59e0b', label: 'June 3, 2026 — 9:07 PM', text: 'CERT-In acknowledged the report within 9 hours. Reference: CERTIn-20460826. Forwarded to concerned authority.' },
                { dot: '#ef4444', label: 'June 2026', text: 'All vulnerable API endpoints patched. Endpoints now return 404/503. Secrets rotated.' },
                { dot: '#22c55e', label: 'June 14, 2026', text: 'Public disclosure — this post published after confirming all patches are live.' },
              ].map((e, i) => (
                <div key={i} style={{ position: 'relative', marginBottom: 28 }}>
                  <div style={{ position: 'absolute', left: -29, top: 4, width: 14, height: 14, borderRadius: '50%', background: e.dot, border: '2px solid #0a0a0f', boxShadow: `0 0 0 2px ${e.dot}44` }} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>{e.label}</div>
                  <p style={{ fontSize: 14, color: '#475569', margin: 0, lineHeight: 1.7 }}>{e.text}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* TAKEAWAYS */}
          <Section id="toc-takeaways" style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', marginBottom: 20 }}>Key Takeaways for Developers</h2>
            <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 8, padding: 24 }}>
              {[
                { icon: '🔑', title: 'Secrets belong on the server', text: "Private keys, HMAC salts, OAuth secrets — none of these should ever be in client-side code. Minification is not encryption." },
                { icon: '🔒', title: 'Authorization ≠ Authentication', text: "Verifying that a JWT is valid is not enough. The server must verify that the JWT's subject matches the requested resource, on every request." },
                { icon: '📊', title: 'CVSS alone doesn\'t capture chained risk', text: 'None of these findings alone is as dangerous as the chain. V-01 + V-02 + V-03 together enabled mass data exfiltration.' },
                { icon: '📋', title: 'Government platforms need higher scrutiny', text: 'Platforms handling Aadhaar data are subject to the Aadhaar Act 2016. The stakes of a breach are legal, social, and deeply personal for millions.' },
                { icon: '🤝', title: 'Responsible disclosure works', text: 'From report to patch took less than two weeks. CERT-In acknowledged within 9 hours.' },
                { icon: '🧪', title: 'Always test on your own account', text: 'Every finding in this report was verified only against the researcher\'s own registered account.' },
              ].map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 16, paddingBottom: 16, marginBottom: 16, borderBottom: i < 5 ? '1px solid #1e1e2e' : 'none' }}>
                  <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1.5 }}>{t.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 4, fontSize: 14 }}>{i + 1}. {t.title}</div>
                    <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.7 }}>{t.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* CERT-IN BOX */}
          <Section id="toc-certin" style={{ marginBottom: 56 }}>
            <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.25)', borderLeft: '3px solid #22c55e', borderRadius: 8, padding: 24, display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 28, flexShrink: 0 }}>🛡</span>
              <div>
                <div style={{ fontWeight: 700, color: '#22c55e', marginBottom: 8, fontSize: 16 }}>CERT-In Acknowledgement</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", color: '#22c55e', fontSize: 13, marginBottom: 8 }}>Ref: CERTIn-20460826</div>
                <p style={{ margin: 0, fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>
                  This vulnerability report was registered by the Indian Computer Emergency Response Team (CERT-In) and forwarded to the concerned authority for appropriate action. All identified vulnerabilities have since been patched and the affected API endpoints have been taken down.
                </p>
              </div>
            </div>
          </Section>

          {/* AUTHOR */}
          <div style={{ borderTop: '1px solid #1e1e2e', paddingTop: 32 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #ef4444, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#fff', flexShrink: 0, fontFamily: "'JetBrains Mono', monospace" }}>T</div>
              <div>
                <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 2 }}>Tobi</div>
                <a href="https://iamtobi.in" style={{ fontSize: 13, color: '#3b82f6', textDecoration: 'none' }}>iamtobi.in</a>
                <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.7, margin: '8px 0 0', fontStyle: 'italic' }}>
                  Disclaimer: All vulnerabilities in this report were discovered through analysis of publicly accessible JavaScript files and verified only against the researcher's own registered account. No other candidate's data was accessed, downloaded, or stored at any point.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Sidebar responsive CSS ────────────────────────────────────────── */}
      <style>{`
        @media (min-width: 900px) {
          .toc-sidebar { display: block !important; }
        }
      `}</style>
    </div>
  );
};

export default UPSCPost;
