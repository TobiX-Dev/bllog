import React from 'react';
import { Mail, ShieldAlert, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer-container">
      <div className="footer-inner">
        <div className="footer-branding">
          <div className="footer-logo">
            <Cpu size={14} className="inline-icon text-accent" />
            <span>Tobi<span className="logo-accent">.log</span></span>
          </div>
          <p className="footer-text">
            Independent security research, CTF analysis, and vulnerability disclosures. All audits conducted with authorization.
          </p>
        </div>

        <div className="footer-links-group">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="footer-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-icon"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg> github
          </a>
          <a href="https://x.com/TobiXD8484" target="_blank" rel="noopener noreferrer" className="footer-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-icon"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg> twitter
          </a>
          <a href="mailto:tobixd8484@gmail.com" className="footer-link">
            <Mail size={16} /> email
          </a>
        </div>
      </div>
      
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Tobi. All rights reserved.</span>
        <span className="footer-security-seal">
          <ShieldAlert size={12} className="inline-icon" /> GPG Signature Verified
        </span>
      </div>
    </footer>
  );
};
