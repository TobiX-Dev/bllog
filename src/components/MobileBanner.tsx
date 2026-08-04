import React, { useState, useEffect } from 'react';

const MobileBanner: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show on mobile/tablet (width ≤ 900px)
    const isMobile = window.innerWidth <= 900;
    const dismissed = sessionStorage.getItem('mobile_banner_dismissed');
    if (isMobile && !dismissed) {
      setShow(true);
    }
  }, []);

  const dismiss = () => {
    sessionStorage.setItem('mobile_banner_dismissed', '1');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 16,
      left: 12,
      right: 12,
      zIndex: 9999,
      background: 'rgba(15,15,20,0.97)',
      border: '1px solid rgba(239,68,68,0.3)',
      borderRadius: 12,
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      backdropFilter: 'blur(12px)',
      boxShadow: '0 4px 32px rgba(0,0,0,0.5)',
      fontFamily: "'Inter','system-ui',sans-serif",
    }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>🖥️</span>
      <span style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.4, flex: 1 }}>
        <strong style={{ color: '#e2e8f0' }}>Best viewed on desktop</strong>
        {' '}— code blocks and writeups render best on a larger screen.
      </span>
      <button
        onClick={dismiss}
        style={{
          flexShrink: 0,
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 6,
          color: '#ef4444',
          fontSize: 13,
          fontWeight: 600,
          padding: '4px 10px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          whiteSpace: 'nowrap',
        }}
      >
        Got it ✕
      </button>
    </div>
  );
};

export default MobileBanner;
