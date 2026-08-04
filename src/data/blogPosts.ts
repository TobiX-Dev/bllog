export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  readTime: string;
  tags: string[];
  component: string;
  isNew?: boolean;
  subtitle?: string;
  target?: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'mpsc-oas-vulnerabilities',
    title: 'MPSC Online Assessment System — Multiple Critical & High-Severity Vulnerabilities',
    date: 'July 17, 2026',
    readTime: '14 min read',
    tags: ['Critical Severity', 'Responsible Disclosure', 'CERT-In Acknowledged', 'Fixed & Patched'],
    component: 'MPSCPost',
    isNew: true,
    subtitle: 'Hardcoded AES-128 Key, CRC Bypass, Unauthenticated Admin API — 7 confirmed vulnerabilities. CERT-In ref: CERTIn-51337226.',
    target: 'mpsconline.gov.in',
  },
  {
    slug: 'upsc-nra-vulnerabilities',
    title: 'UPSC NRA Candidate Portal — Multiple Critical & High-Severity Vulnerabilities',
    date: 'June 17, 2026',
    readTime: '12 min read',
    tags: ['Critical Severity', 'Responsible Disclosure', 'CERT-In Acknowledged', 'Fixed & Patched'],
    component: 'UPSCPost',
    isNew: false,
    subtitle: 'API Gateway Compromise, Cryptographic Key Leakage, and Mass Aadhaar Data Exposure — 15 confirmed vulnerabilities.',
    target: 'upsconline.nic.in',
  },
];
