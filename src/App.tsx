import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Terminal } from './components/Terminal';
import { Footer } from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import MobileBanner from './components/MobileBanner';
import UPSCPost from './components/blog/UPSCPost';
import MPSCPost from './components/blog/MPSCPost';
import Analytics from './components/Analytics';
import { blogPosts } from './data/blogPosts';
import type { BlogPost as LegacyBlogPost } from './data/blogData';
import { PRESET_BLOGS } from './data/blogData';
import { Terminal as TerminalIcon, ShieldAlert, Calendar, Clock } from 'lucide-react';

/* ── Tag colors ─────────────────────────────────────────────────────────── */
const tagColors: Record<string, { bg: string; color: string }> = {
  'Critical Severity':      { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' },
  'Responsible Disclosure': { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
  'CERT-In Acknowledged':   { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  'Fixed & Patched':        { bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
};

/* ── NEW badge — blinks red in the top-right corner of the card ─────────── */
function NewBadge() {
  return (
    <span style={{
      position: 'absolute',
      top: 12,
      right: 12,
      background: 'rgba(239,68,68,0.15)',
      color: '#ef4444',
      border: '1px solid rgba(239,68,68,0.5)',
      borderRadius: 99,
      padding: '3px 10px',
      fontSize: 11,
      fontWeight: 800,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      letterSpacing: '0.08em',
      animation: 'newBadgeBlink 1.2s ease-in-out infinite',
      zIndex: 2,
    }}>
      ● NEW
    </span>
  );
}

/* ── Generic blog post card ─────────────────────────────────────────────── */
function NewBlogCard({ post }: { post: typeof blogPosts[0] }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <article className="blog-card" style={{ cursor: 'pointer', position: 'relative' }}>
        {post.isNew && <NewBadge />}

        <div className="blog-card-header">
          <span className="severity-badge severity-critical" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ShieldAlert size={12} className="inline-icon" /> CRITICAL
          </span>
          <span className="blog-card-category">Web Pentesting</span>
        </div>

        <h3 className="blog-card-title">{post.title}</h3>
        <p className="blog-card-subtitle">
          {post.subtitle ?? 'Security vulnerability writeup and responsible disclosure report.'}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '12px 0' }}>
          {post.tags.map(tag => {
            const c = tagColors[tag] || { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8' };
            return (
              <span key={tag} style={{
                background: c.bg,
                color: c.color,
                border: `1px solid ${c.color}44`,
                borderRadius: 99,
                padding: '2px 8px',
                fontSize: 11,
                fontWeight: 600,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              }}>
                {tag}
              </span>
            );
          })}
        </div>

        <div className="blog-card-meta">
          <div className="meta-left">
            <span className="meta-item">
              <Calendar size={13} /> {post.date}
            </span>
            <span className="meta-item">
              <Clock size={13} /> {post.readTime}
            </span>
          </div>
        </div>

        <div className="blog-card-footer">
          <span className="target-text">Target: <code>{post.target ?? '—'}</code></span>
          <span className="read-more-link">Read writeup →</span>
        </div>
      </article>
    </Link>
  );
}

/* ── Home page ─────────────────────────────────────────────────────────── */
function HomePage({
  isDarkMode,
  setIsDarkMode,
  isTerminalOpen,
  setIsTerminalOpen,
}: {
  isDarkMode: boolean;
  setIsDarkMode: (v: boolean) => void;
  isTerminalOpen: boolean;
  setIsTerminalOpen: (v: boolean) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = blogPosts.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="app-container">
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        toggleTerminal={() => setIsTerminalOpen(!isTerminalOpen)}
      />

      <main className="main-content">
        <div className="animate-fade-in">
          {/* Profile Header */}
          <div className="feed-header">
            <div className="profile-pic-container">
              <img
                src="/tobi_avatar.png"
                alt="Tobi - Security Researcher"
                className="profile-pic"
              />
            </div>
            <h1 className="feed-title">TOBI</h1>
            <p className="feed-tagline-accent">software engineer &amp; cybersecurity researcher</p>

            <div className="profile-bio-box">
              <p>
                Hi, I'm Tobi — a student and hobbyist security researcher from India. I have an
                interest in how applications handle security, and I document my findings here. I've
                done some bug bounty work and CTF challenges, and I'm always learning.
              </p>
              <p className="bio-secondary">
                This blog contains my vulnerability writeups and security research notes. Everything
                documented here has been responsibly disclosed. Press the <code>`</code> key to open
                the interactive terminal.
              </p>
            </div>

            <div className="profile-nav-links">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="profile-nav-link"
              >
                github
              </a>
              <a
                href="https://x.com/TobiXD8484"
                target="_blank"
                rel="noopener noreferrer"
                className="profile-nav-link"
              >
                twitter
              </a>
              <a href="mailto:tobixd8484@gmail.com" className="profile-nav-link">
                email
              </a>
            </div>
          </div>

          {/* Blog Feed */}
          {filteredPosts.length > 0 ? (
            <div className="blog-grid">
              {filteredPosts.map((post) => (
                <NewBlogCard key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <div className="empty-results-box">
              <TerminalIcon size={40} className="empty-icon" />
              <h3>No writeups match that search</h3>
              <p>Try a different keyword or tag.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <MobileBanner />

      <Terminal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        blogs={PRESET_BLOGS as LegacyBlogPost[]}
        setCurrentTab={() => {}}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />
    </div>
  );
}

/* ── Blog post page ─────────────────────────────────────────────────────── */
function BlogPostPage({
  isDarkMode,
  setIsDarkMode,
  isTerminalOpen,
  setIsTerminalOpen,
}: {
  isDarkMode: boolean;
  setIsDarkMode: (v: boolean) => void;
  isTerminalOpen: boolean;
  setIsTerminalOpen: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div className="app-container">
        <div className="main-content" style={{ textAlign: 'center', paddingTop: '6rem' }}>
          <h2 style={{ color: '#e2e8f0' }}>404 — Post not found</h2>
          <button className="back-btn" onClick={() => navigate('/')}>← Back to Blog</button>
        </div>
      </div>
    );
  }

  const terminalOverlay = (
    <Terminal
      isOpen={isTerminalOpen}
      onClose={() => setIsTerminalOpen(false)}
      blogs={PRESET_BLOGS as LegacyBlogPost[]}
      setCurrentTab={() => {}}
      isDarkMode={isDarkMode}
      setIsDarkMode={setIsDarkMode}
    />
  );

  if (post.component === 'UPSCPost') {
    return <><UPSCPost /><MobileBanner />{terminalOverlay}</>;
  }

  if (post.component === 'MPSCPost') {
    return <><MPSCPost /><MobileBanner />{terminalOverlay}</>;
  }

  return <div style={{ color: '#e2e8f0', padding: 40 }}>Post component not found.</div>;
}

/* ── Root app ──────────────────────────────────────────────────────────── */
function App() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('tobi_theme');
    if (saved !== null) return saved === 'dark';
    return true;
  });

  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(false);

  // Sync theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('tobi_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('tobi_theme', 'light');
    }
  }, [isDarkMode]);

  // Backtick / Escape for terminal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`') {
        e.preventDefault();
        setIsTerminalOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isTerminalOpen) {
        setIsTerminalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTerminalOpen]);

  const sharedProps = { isDarkMode, setIsDarkMode, isTerminalOpen, setIsTerminalOpen };

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage {...sharedProps} />} />
        <Route path="/blog/:slug" element={<BlogPostPage {...sharedProps} />} />
        <Route path="/tobi/stats" element={<Analytics />} />
        <Route path="*" element={<HomePage {...sharedProps} />} />
      </Routes>
    </>
  );
}

export default App;
