export interface BlogPost {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  category: 'Web Pentesting' | 'Exploit Dev' | 'Infrastructure' | 'CTF Writeup' | 'Cryptanalysis';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  cve?: string;
  target: string;
  readTime: string;
  summary: string;
  content: string; // Markdown content
}

export const PRESET_BLOGS: BlogPost[] = [
  {
    id: 'upsc-nra-portal-critical-vulnerabilities',
    title: 'Exposing Critical Vulnerabilities in India\'s UPSC NRA Candidate Portal',
    subtitle: 'API Gateway Compromise, Cryptographic Key Leakage, and Mass Aadhaar Data Exposure',
    date: 'June 3, 2026',
    category: 'Web Pentesting',
    severity: 'Critical',
    target: 'upsconline.nic.in',
    readTime: '12 min read',
    summary: 'These vulnerabilities were discovered in late May 2026 and reported to CERT-In before publication. The API endpoints covered have since been taken down, confirming remediation action was taken.',
    content: `## Responsible Disclosure Notice

These vulnerabilities were discovered in late May 2026 and were promptly reported to **CERT-In** before this post was written. The API endpoints and gateway services covered in this report have since been taken down (returning 404/503 at the time of publication), confirming that remediation action was taken.

---

## What is the UPSC NRA Portal?

The **Union Public Service Commission (UPSC)** is India's premier central recruiting agency, responsible for conducting some of the most competitive examinations in the country — the Civil Services Examination, the Engineering Services Examination, the NDA, CDS, and many others. Millions of aspiring government employees depend on UPSC examinations every year.

The **National Recruitment Agency (NRA)** is a newer initiative by the Government of India, designed to conduct a Common Eligibility Test (CET) for recruitment to Group B and Group C posts across multiple central government departments. The NRA portal at \`upsconline.nic.in\` is the unified platform where candidates register, submit applications, upload biometric data, link their Aadhaar, pay fees, and download their admit cards.

Because of the nature of this platform, it handles an extraordinary volume of extraordinarily sensitive data — Aadhaar numbers, photographs, live face captures, signatures, caste certificates, disability records, educational credentials, and payment information. Any security failure here does not just expose a few accounts. It potentially exposes the identity of **every person who has ever registered on it**.

That is the context for everything that follows.

---

## Background

I'm **Tobi**, a student and hobbyist security researcher from India. I've done some bug bounty work before and have an interest in how government platforms handle security. After hearing about the CBSE On-Screen Marking vulnerability disclosures, I decided to take a closer look at a platform I personally use as a candidate — the UPSC NRA portal.

I want to be clear about my approach: I performed this research entirely against **my own account** and against public-facing or unauthenticated endpoints. I did not access, download, or exfiltrate any data belonging to other candidates. Every finding documented here was confirmed conceptually and reported to CERT-In before this blog was written.

---

## The Frontend Bundle

Like most modern Angular web applications, the UPSC NRA portal ships its entire frontend as a single, minified JavaScript bundle. This file is downloaded by the browser on first load and contains every piece of application logic — routing, authentication flows, API calls, business logic, and as it turns out, a collection of **secrets that should never have been there**.

I downloaded the bundle, ran it through a JavaScript pretty-printer, and started reading. What I found over the next few hours was, in a word, alarming.

---

## Finding 1: Complete API Gateway Authentication Bypass

**Severity: CRITICAL**

Every request to the backend API at \`upsconline.nic.in/ngrp_api/\` requires a custom HTTP header called \`Secretkey\`. This is the application's own custom WAF mechanism — any request without a valid \`Secretkey\` is rejected. The developers clearly intended this as the primary control preventing automated or unauthorized access to backend services.

**The problem:** the algorithm to generate this header is computed entirely in client-side JavaScript, and the two ingredients — a static HMAC salt and a static secret UUID — are **hardcoded in plain text** inside the same bundle.

The formula, once extracted, is:
\`\`\`
Secretkey = SHA-512( [REDACTED_SALT] + Timestamp + [REDACTED_UUID] )
Where Timestamp = current UTC time formatted as DDMMYYYYHHmmss
\`\`\`

I verified this by intercepting live browser traffic using Burp Suite and comparing the \`Secretkey\` values my script generated against the values the real browser produced for the same timestamp. They were **identical, byte for byte**.

**What this means:** I could now send any request to any backend endpoint — authenticated or not, admin or not — using a simple Python script, with no browser, no session, and no real credentials. The primary security gate of the entire API was open.

---

## Finding 2: RSA-2048 Private Key Exposure

**Severity: CRITICAL**

The login flow works like this: the client requests a "salt" from the server via a \`/login/passkey\` endpoint. The server responds with an RSA-encrypted blob. The client decrypts it, uses the plaintext salt to hash the password, and then sends the hashed result back.

The intent is sound. The execution is **catastrophically broken**, because the RSA Private Key used to decrypt the server's response is **hardcoded in the JavaScript bundle**.

![RSA Private Key and API secrets found in JS bundle](/upsc_rsa_keys.png)

The key is a full **2048-bit RSA private key** in standard PEM format, sitting in plain text in the client code. Using it, I was able to decrypt live salt values returned by the production API in real time:

\`\`\`
Encrypted salt (from live API response):
Xykw3dj9oJzdER6I14MZaR[REDACTED]...

Decrypted salt (using extracted private key):
eUuGbS0cRtITzqXr  ✅
\`\`\`

The complete password hashing algorithm — now reconstructable by any attacker — is:

\`\`\`
hashedPassword = Base64( SHA-512( SHA-512(plaintext_password) + decrypted_salt ) )
\`\`\`

Combined with Finding 1, the entire authentication ceremony can be scripted end-to-end by anyone who read the JavaScript bundle.

---

## Finding 3: Hardcoded OAuth Client Secrets for DigiLocker and UDID

**Severity: HIGH**

Also embedded in the bundle were **OAuth 2.0 Client IDs and Client Secrets** for two government service integrations:

![Firebase config and OAuth secrets exposed in bundle](/upsc_firebase.png)

- **DigiLocker** (India's national document wallet) — Client ID and Client Secret fully exposed
- **UDID** (Disability identity portal) — Client ID and Client Secret fully exposed

OAuth Client Secrets are **server-side credentials**. They are explicitly described in the OAuth 2.0 specification (RFC 6749) as confidential and must never be exposed to the client. With these, an attacker could impersonate the UPSC NRA portal to DigiLocker and retrieve candidates' stored government documents — Aadhaar cards, PAN cards, marksheets — without the candidates ever knowing.

---

## Finding 4: Firebase Cloud Messaging Credentials Fully Exposed

**Severity: MEDIUM**

The complete Firebase project configuration was found in the bundle, including the full VAPID key and Sender ID. While Firebase client keys are designed to be semi-public, exposure of the full project config enables abuse of the push notification infrastructure.

---

## Finding 5: Insecure Direct Object Reference — Mass Aadhaar and PII Exposure

**Severity: CRITICAL**

This is the most impactful finding, and it only became fully exploitable because of Finding 1.

The backend data endpoints use a **sequential numeric Applicant ID** to identify which candidate's data to return. There is **no server-side check** that the authenticated user's JWT matches the requested Applicant ID. A logged-in candidate can request the data of any other candidate simply by changing the ID in the URL.

This affects **every data endpoint** in the platform:

- Full candidate profile — \`.../FullProfile/GetFUllProfile/{id}\`
- Name, DOB, gender, contact — \`.../PersonalProfile/Get/{id}\`
- Father and mother details — \`.../ParentProfile/Get/{id}\`
- Full residential address — \`.../Address/Get/{id}\`
- Educational qualifications — \`.../Qualification/Get/{id}\`
- Government ID numbers — \`.../Identity/Get/{id}\`
- **Aadhaar (UID) demographic data** — \`.../vault/V2/Register/{id}\`
- Caste and reservation category — \`.../SocialCategoryProfile/Get/{id}\`
- Disability records (UDID) — \`.../Disability/udid/{id}\`
- Candidate photograph — \`.../download_photo/{id}\`
- Examination admit card — \`.../admin_api/Get_eAdmitCard/{id}\`

The exposure of Aadhaar data is particularly severe. **Section 29 of the Aadhaar Act, 2016** prohibits the disclosure of identity information including the Aadhaar number except in accordance with the Act. An IDOR on the Aadhaar vault endpoint would constitute a direct violation of this statute.

---

## Finding 6: Unauthenticated User Enumeration at Scale

**Severity: HIGH**

Two registration endpoints accept a mobile number or email address and return different responses depending on whether the input is registered:

\`\`\`http
POST /ngrp_api/onboarding/V1/Search/MobileNo
Body: {"mobileNo": "XXXXXXXXXX"}

Response (registered):   {"status": true, "message": "Mobile No. is already registered..."}
Response (unregistered): {"status": false, ...}
\`\`\`

These endpoints require **no authentication whatsoever**. Running this against a list of numbers would produce a confirmed database of UPSC/NRA applicants — their names, numbers, and registration status — suitable for targeted phishing or worse.

---

## The Complete Attack Chain

Put it all together, and here is what a single attacker with a copy of the JavaScript bundle could do:

1. Extract the hardcoded HMAC salt and secret UUID from the bundle
2. Write a script that generates valid \`Secretkey\` headers — bypassing the API gateway entirely
3. Call the \`/login/passkey\` endpoint to receive an RSA-encrypted salt
4. Decrypt the salt using the extracted RSA private key
5. Hash a known password and call the login endpoint to obtain a valid JWT token
6. Iterate through sequential Applicant IDs on every data endpoint, extracting full profiles, Aadhaar data, photographs, and admit cards of every registered candidate
7. Enumerate any mobile number to confirm UPSC registration status

**Steps 1 through 6 can be fully automated.** No CAPTCHA sits in the path. No rate limiting prevented sequential ID access. No server-side authorization check verified that the JWT matched the requested resource.

---

## Responsible Disclosure

I reported all of these findings to **CERT-In** at \`incident@cert-in.org.in\` before publishing this blog. My report included a complete technical writeup of each vulnerability, the extracted (non-published) secrets, and proof-of-concept demonstration material for my own account only.

---

## Root Causes

Every single vulnerability in this report traces back to the same two fundamental mistakes:

**1. Client-Side Secret Storage**
Secrets — cryptographic keys, API credentials, HMAC salts — belong on the server. They must never appear in any file that is served to a browser, regardless of whether it is minified or obfuscated. Obfuscation is not encryption. Keeping a secret in client-side code is the same as writing it on a public wall.

**2. Missing Server-Side Authorization**
The server must verify, on every single request, that the authenticated identity is authorized to access the requested resource. It is not enough to check that a valid JWT is present. The server must confirm that the JWT's subject matches the resource being requested. This is Authorization 101.

---

## Closing Thoughts

I want to be clear about one thing: this was not about causing harm. I am a candidate on this platform. My own Aadhaar data, my own photographs and records, were stored in the same system with the same vulnerabilities. My motivation was to make it safer for everyone who uses it.

I hope this writeup serves as a useful case study for developers, security teams, and policymakers working on government digital infrastructure. The stakes are not abstract. When a platform holds the identity documents and life records of millions of people, getting security right is not optional.
`
  }
];
