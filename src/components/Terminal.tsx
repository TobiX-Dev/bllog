import React, { useState, useRef, useEffect } from 'react';
import { X, CornerDownLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { BlogPost as LegacyBlogPost } from '../data/blogData';
import { blogPosts } from '../data/blogPosts';

interface TerminalProps {
  isOpen: boolean;
  onClose: () => void;
  blogs: LegacyBlogPost[];
  setCurrentTab: (tab: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (darkMode: boolean) => void;
}

interface CommandOutput {
  text: string;
  type: 'input' | 'output' | 'error' | 'success' | 'system' | 'accent' | 'warn';
}

// Merge legacy blog data + new blog posts into a unified terminal list
function buildTerminalBlogs(legacy: LegacyBlogPost[]) {
  // New-style posts (from blogPosts.ts) mapped to terminal format
  const newStyle = blogPosts.map(p => ({
    id: p.slug,
    title: p.title,
    date: p.date,
    category: 'Web Pentesting' as const,
    severity: 'Critical' as const,
    target: p.target ?? '—',
    readTime: p.readTime,
    summary: p.subtitle ?? '',
    subtitle: p.subtitle ?? '',
    content: '',
    cve: undefined as string | undefined,
  }));

  // Merge: use new-style as primary, add legacy ones not already covered
  const newSlugs = new Set(blogPosts.map(p => p.slug));
  const filteredLegacy = legacy.filter(b => !newSlugs.has(b.id));
  return [...newStyle, ...filteredLegacy];
}

const BOOT_MSGS: CommandOutput[] = [
  { text: '══════════════════════════════════════════════════', type: 'system' },
  { text: '  ████████╗ ██████╗ ██████╗ ██╗', type: 'accent' },
  { text: '     ██╔══╝██╔═══██╗██╔══██╗██║', type: 'accent' },
  { text: '     ██║   ██║   ██║██████╔╝██║', type: 'accent' },
  { text: '     ██║   ██║   ██║██╔══██╗██║', type: 'accent' },
  { text: '     ██║   ╚██████╔╝██████╔╝██║', type: 'accent' },
  { text: '     ╚═╝    ╚═════╝ ╚═════╝ ╚═╝', type: 'accent' },
  { text: '══════════════════════════════════════════════════', type: 'system' },
  { text: '  tobi.log — Security Research Terminal v2.1', type: 'system' },
  { text: '══════════════════════════════════════════════════', type: 'system' },
  { text: '', type: 'output' },
  { text: '  [SYS] Terminal initialized. Type "help" for commands.', type: 'output' },
  { text: '  [SYS] Press ESC or ` to close.', type: 'output' },
  { text: '', type: 'output' },
];

// Parse user-agent into readable device/OS/browser string
function parseUA(ua: string): { os: string; browser: string; device: string } {
  let os = 'Unknown OS';
  let browser = 'Unknown Browser';
  let device = 'Desktop';

  if (/Android/i.test(ua)) { os = 'Android'; device = 'Mobile'; }
  else if (/iPhone|iPad|iPod/i.test(ua)) { os = 'iOS'; device = /iPad/i.test(ua) ? 'Tablet' : 'Mobile'; }
  else if (/Windows NT 10/i.test(ua)) os = 'Windows 10/11';
  else if (/Windows NT/i.test(ua)) os = 'Windows';
  else if (/Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/OPR\//i.test(ua)) browser = 'Opera';
  else if (/Chrome\//i.test(ua)) browser = 'Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Safari\//i.test(ua)) browser = 'Safari';

  return { os, browser, device };
}

export const Terminal: React.FC<TerminalProps> = ({
  isOpen, onClose, blogs, isDarkMode, setIsDarkMode,
}) => {
  const navigate = useNavigate();
  const allBlogs = buildTerminalBlogs(blogs);
  const [history, setHistory] = useState<CommandOutput[]>(BOOT_MSGS);
  const [inputValue, setInputValue] = useState('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [visitorInfo, setVisitorInfo] = useState<{ ip: string; city: string; country: string; isp: string } | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // Fetch visitor IP/location when terminal first opens
  useEffect(() => {
    if (!isOpen || visitorInfo) return;
    const { os, browser, device } = parseUA(navigator.userAgent);
    fetch('https://ipapi.co/json/', { cache: 'force-cache' })
      .then(r => r.json())
      .then((data: { ip: string; city: string; country_name: string; org: string }) => {
        const info = {
          ip: data.ip ?? '???.???.???.???',
          city: data.city ?? 'Unknown',
          country: data.country_name ?? 'Unknown',
          isp: (data.org ?? 'Unknown ISP').replace(/^AS\d+\s+/, ''),
        };
        setVisitorInfo(info);
        setHistory(prev => [
          ...prev,
          { text: '  ┌─ [ CONNECTION INFO ] ─────────────────────────┐', type: 'system' },
          { text: `  │  IP      : ${info.ip}`, type: 'warn' },
          { text: `  │  Location: ${info.city}, ${info.country}`, type: 'warn' },
          { text: `  │  ISP     : ${info.isp}`, type: 'output' },
          { text: `  │  OS      : ${os}`, type: 'output' },
          { text: `  │  Browser : ${browser} on ${device}`, type: 'output' },
          { text: `  │  Screen  : ${window.screen.width}x${window.screen.height}`, type: 'output' },
          { text: '  └───────────────────────────────────────────────┘', type: 'system' },
          { text: '', type: 'output' },
        ]);
        // Also fire tracking beacon
        fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ip: info.ip, city: info.city, country: info.country, isp: info.isp,
            os, browser, device,
            screen: `${window.screen.width}x${window.screen.height}`,
            page: window.location.pathname,
            ref: document.referrer || 'direct',
            ts: Date.now(),
          }),
        }).catch(() => { /* analytics silently fail */ });
      })
      .catch(() => {
        const { os, browser, device } = parseUA(navigator.userAgent);
        setHistory(prev => [
          ...prev,
          { text: '  ┌─ [ CONNECTION INFO ] ─────────────────────────┐', type: 'system' },
          { text: '  │  IP      : [unable to resolve]', type: 'warn' },
          { text: `  │  OS      : ${os}`, type: 'output' },
          { text: `  │  Browser : ${browser} on ${device}`, type: 'output' },
          { text: `  │  Screen  : ${window.screen.width}x${window.screen.height}`, type: 'output' },
          { text: '  └───────────────────────────────────────────────┘', type: 'system' },
          { text: '', type: 'output' },
        ]);
      });
  }, [isOpen, visitorInfo]);

  const executeCommand = (commandLine: string) => {
    const trimmed = commandLine.trim();
    if (!trimmed) return;

    setCmdHistory(prev => [trimmed, ...prev]);
    setHistoryIndex(-1);

    const newHistory: CommandOutput[] = [
      ...history,
      { text: `tobi@blog:~$ ${trimmed}`, type: 'input' },
    ];
    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {

      /* ── HELP ─────────────────────────────────────────────────────── */
      case 'help':
        newHistory.push(
          { text: '', type: 'output' },
          { text: '  ┌─ Navigation ─────────────────────────────────────────┐', type: 'system' },
          { text: '  │  goto <slug>         Navigate to a blog post URL      │', type: 'output' },
          { text: '  │  home                Go back to home page             │', type: 'output' },
          { text: '  │  open <n>            Open blog post by number (ls -n) │', type: 'output' },
          { text: '  ├─ Content ────────────────────────────────────────────┤', type: 'system' },
          { text: '  │  ls / dir            List all blog posts              │', type: 'output' },
          { text: '  │  ls -v               Verbose listing with severity    │', type: 'output' },
          { text: '  │  ls -n               Numbered listing                 │', type: 'output' },
          { text: '  │  search <term>       Search posts by keyword          │', type: 'output' },
          { text: '  │  info <slug>         Show post metadata               │', type: 'output' },
          { text: '  │  tags                Show all unique tags             │', type: 'output' },
          { text: '  ├─ System ─────────────────────────────────────────────┤', type: 'system' },
          { text: '  │  whoami              About Tobi                       │', type: 'output' },
          { text: '  │  myip                Show your IP & connection info   │', type: 'output' },
          { text: '  │  theme               Toggle dark / light mode         │', type: 'output' },
          { text: '  │  date                Current date & time              │', type: 'output' },
          { text: '  │  uptime              Session uptime                   │', type: 'output' },
          { text: '  │  history             Command history                  │', type: 'output' },
          { text: '  │  clear               Clear terminal                   │', type: 'output' },
          { text: '  │  echo <text>         Print text                       │', type: 'output' },
          { text: '  └─────────────────────────────────────────────────────┘', type: 'system' },
          { text: '', type: 'output' },
        );
        break;

      /* ── CLEAR ──────────────────────────────────────────────────────── */
      case 'clear':
        setHistory([]);
        return;

      /* ── LS / DIR ───────────────────────────────────────────────────── */
      case 'ls':
      case 'dir': {
        const verbose = args.includes('-v');
        const numbered = args.includes('-n');
        newHistory.push(
          { text: '', type: 'output' },
          { text: `  total ${allBlogs.length} writeup(s) in /dev/blog/`, type: 'system' },
        );
        allBlogs.forEach((blog, i) => {
          if (verbose) {
            newHistory.push({ text: `  [${(blog.severity ?? 'CRITICAL').toUpperCase().padEnd(8)}]  ${blog.id}.md`, type: 'output' });
            newHistory.push({ text: `              → ${blog.title}`, type: 'output' });
            newHistory.push({ text: `              Date: ${blog.date} | ${blog.readTime}`, type: 'output' });
          } else if (numbered) {
            newHistory.push({ text: `  ${(i + 1).toString().padStart(2)}. ${blog.id}.md`, type: 'output' });
          } else {
            newHistory.push({ text: `  · ${blog.id}.md`, type: 'output' });
          }
        });
        newHistory.push({ text: '', type: 'output' });
        break;
      }

      /* ── SEARCH ─────────────────────────────────────────────────────── */
      case 'search': {
        if (!args.length) {
          newHistory.push({ text: '  Error: usage — search <keyword>', type: 'error' });
          break;
        }
        const q = args.join(' ').toLowerCase();
        const matches = allBlogs.filter(b =>
          b.title.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q) ||
          (b.category ?? '').toLowerCase().includes(q)
        );
        newHistory.push({ text: '', type: 'output' }, { text: `  Searching for: "${q}"`, type: 'system' });
        if (!matches.length) {
          newHistory.push({ text: '  No results found.', type: 'warn' });
        } else {
          matches.forEach(b => newHistory.push({ text: `  ✓  ${b.id}  →  ${b.title}`, type: 'success' }));
        }
        newHistory.push({ text: '', type: 'output' });
        break;
      }

      /* ── INFO ────────────────────────────────────────────────────────── */
      case 'info': {
        const slug = args[0];
        const blog = allBlogs.find(b => b.id === slug);
        if (!blog) {
          newHistory.push({ text: `  Error: post "${slug}" not found. Run ls to list posts.`, type: 'error' });
          break;
        }
        newHistory.push(
          { text: '', type: 'output' },
          { text: `  ┌─ ${blog.id} ─────────────────────────────────`, type: 'system' },
          { text: `  │  Title:    ${blog.title}`, type: 'output' },
          { text: `  │  Date:     ${blog.date}`, type: 'output' },
          { text: `  │  Category: ${blog.category}`, type: 'output' },
          { text: `  │  Severity: ${blog.severity}`, type: blog.severity?.toLowerCase() === 'critical' ? 'error' : 'warn' },
          { text: `  │  Target:   ${blog.target}`, type: 'output' },
          { text: `  │  Read:     ${blog.readTime}`, type: 'output' },
          { text: `  └──────────────────────────────────────────────`, type: 'system' },
          { text: '', type: 'output' },
        );
        break;
      }

      /* ── TAGS ────────────────────────────────────────────────────────── */
      case 'tags': {
        const cats = [...new Set(allBlogs.map(b => b.category))];
        const sevs = [...new Set(allBlogs.map(b => b.severity))];
        newHistory.push(
          { text: '', type: 'output' },
          { text: '  Categories:', type: 'system' },
          ...cats.map(c => ({ text: `    · ${c}`, type: 'output' as const })),
          { text: '  Severities:', type: 'system' },
          ...sevs.map(s => ({ text: `    · ${s}`, type: 'output' as const })),
          { text: '', type: 'output' },
        );
        break;
      }

      /* ── OPEN ────────────────────────────────────────────────────────── */
      case 'open': {
        const n = parseInt(args[0]);
        if (isNaN(n) || n < 1 || n > allBlogs.length) {
          newHistory.push({ text: `  Error: usage — open <number>. Run "ls -n" to see numbers.`, type: 'error' });
          break;
        }
        const blog = allBlogs[n - 1];
        newHistory.push({ text: `  → Opening: ${blog.id}`, type: 'success' });
        setHistory([...newHistory]);
        setTimeout(() => navigate(`/blog/${blog.id}`), 400);
        return;
      }

      /* ── GOTO ────────────────────────────────────────────────────────── */
      case 'goto': {
        const slug = args[0];
        if (!slug) {
          newHistory.push({ text: '  Error: usage — goto <slug>', type: 'error' });
          break;
        }
        if (slug === 'home' || slug === '/') {
          newHistory.push({ text: '  → Navigating to home...', type: 'success' });
          setHistory([...newHistory]);
          setTimeout(() => navigate('/'), 300);
          return;
        }
        const blog = allBlogs.find(b => b.id === slug);
        if (!blog) {
          newHistory.push({ text: `  Error: no post with slug "${slug}". Try "ls" to list posts.`, type: 'error' });
          break;
        }
        newHistory.push({ text: `  → Navigating to /blog/${slug}...`, type: 'success' });
        setHistory([...newHistory]);
        setTimeout(() => navigate(`/blog/${slug}`), 300);
        return;
      }

      /* ── HOME ────────────────────────────────────────────────────────── */
      case 'home':
        newHistory.push({ text: '  → Going home...', type: 'success' });
        setHistory([...newHistory]);
        setTimeout(() => { navigate('/'); onClose(); }, 300);
        return;

      /* ── MYIP ────────────────────────────────────────────────────────── */
      case 'myip':
        if (visitorInfo) {
          const { os, browser, device } = parseUA(navigator.userAgent);
          newHistory.push(
            { text: '', type: 'output' },
            { text: '  ┌─ [ YOUR CONNECTION ] ──────────────────────────┐', type: 'system' },
            { text: `  │  IP       : ${visitorInfo.ip}`, type: 'warn' },
            { text: `  │  Location : ${visitorInfo.city}, ${visitorInfo.country}`, type: 'warn' },
            { text: `  │  ISP      : ${visitorInfo.isp}`, type: 'output' },
            { text: `  │  OS       : ${os}`, type: 'output' },
            { text: `  │  Browser  : ${browser} on ${device}`, type: 'output' },
            { text: `  │  Screen   : ${window.screen.width}x${window.screen.height}`, type: 'output' },
            { text: `  │  Language : ${navigator.language}`, type: 'output' },
            { text: `  │  Timezone : ${Intl.DateTimeFormat().resolvedOptions().timeZone}`, type: 'output' },
            { text: '  └───────────────────────────────────────────────┘', type: 'system' },
            { text: '', type: 'output' },
          );
        } else {
          newHistory.push({ text: '  [SYS] Fetching IP info…', type: 'warn' });
        }
        break;

      /* ── THEME ───────────────────────────────────────────────────────── */
      case 'theme': {
        const next = !isDarkMode;
        setIsDarkMode(next);
        newHistory.push({ text: `  Theme → ${next ? '🌙 Dark Mode' : '☀️  Light Mode'}`, type: 'success' });
        break;
      }

      /* ── WHOAMI ──────────────────────────────────────────────────────── */
      case 'whoami':
        newHistory.push(
          { text: '', type: 'output' },
          { text: '  tobi', type: 'accent' },
          { text: '  ────────────────────────────────────────', type: 'system' },
          { text: '  Student & hobbyist security researcher', type: 'output' },
          { text: '  Location:  India', type: 'output' },
          { text: '  Focus:     Web security, API vulnerabilities', type: 'output' },
          { text: '  Email:     tobixd8484@gmail.com', type: 'output' },
          { text: '  Twitter:   @TobiXD8484', type: 'output' },
          { text: '  Site:      iamtobi.in', type: 'output' },
          { text: '', type: 'output' },
        );
        break;

      /* ── DATE ────────────────────────────────────────────────────────── */
      case 'date': {
        const now = new Date();
        newHistory.push({ text: `  ${now.toDateString()}  ${now.toLocaleTimeString()}`, type: 'output' });
        break;
      }

      /* ── UPTIME ──────────────────────────────────────────────────────── */
      case 'uptime': {
        const ms = performance.now();
        const secs = Math.floor(ms / 1000);
        const mins = Math.floor(secs / 60);
        newHistory.push({ text: `  Session uptime: ${mins}m ${secs % 60}s`, type: 'output' });
        break;
      }

      /* ── HISTORY ─────────────────────────────────────────────────────── */
      case 'history':
        if (!cmdHistory.length) {
          newHistory.push({ text: '  No command history yet.', type: 'warn' });
        } else {
          newHistory.push({ text: '', type: 'output' });
          cmdHistory.slice(0, 20).forEach((c, i) =>
            newHistory.push({ text: `  ${(cmdHistory.length - i).toString().padStart(3)}  ${c}`, type: 'output' })
          );
          newHistory.push({ text: '', type: 'output' });
        }
        break;

      /* ── ECHO ────────────────────────────────────────────────────────── */
      case 'echo':
        newHistory.push({ text: `  ${args.join(' ')}`, type: 'output' });
        break;

      /* ── DEFAULT ─────────────────────────────────────────────────────── */
      default:
        newHistory.push({
          text: `  bash: command not found: "${cmd}" — type "help" for available commands`,
          type: 'error',
        });
    }

    setHistory(newHistory);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(inputValue);
      setInputValue('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const nextIndex = historyIndex + 1;
      if (nextIndex < cmdHistory.length) {
        setHistoryIndex(nextIndex);
        setInputValue(cmdHistory[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = historyIndex - 1;
      if (nextIndex >= 0) {
        setHistoryIndex(nextIndex);
        setInputValue(cmdHistory[nextIndex]);
      } else {
        setHistoryIndex(-1);
        setInputValue('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const allCmds = ['help', 'clear', 'ls', 'dir', 'search', 'info', 'tags', 'open', 'goto', 'home', 'theme', 'whoami', 'myip', 'date', 'uptime', 'history', 'echo', ...allBlogs.map(b => b.id)];
      const match = allCmds.find(c => c.startsWith(inputValue));
      if (match) setInputValue(match);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="terminal-drawer">
      <div className="terminal-header">
        <div className="terminal-dots">
          <span className="dot dot-red" onClick={onClose} title="Close" style={{ cursor: 'pointer' }} />
          <span className="dot dot-yellow" />
          <span className="dot dot-green" />
        </div>
        <div className="terminal-title">bash — tobi@blog:~ (Tab to autocomplete · ↑↓ history)</div>
        <button onClick={onClose} className="terminal-close-btn" title="Close Terminal">
          <X size={16} />
        </button>
      </div>

      <div className="terminal-body" onClick={() => inputRef.current?.focus()}>
        {history.map((line, idx) => (
          <div key={idx} className={`terminal-line line-${line.type}`}>
            {line.text}
          </div>
        ))}
        <div ref={terminalEndRef} />
      </div>

      <div className="terminal-input-bar">
        <span className="terminal-prompt">tobi@blog:~$</span>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="terminal-input"
          placeholder="Type a command… (try: help, whoami, ls -v, myip)"
          autoFocus
        />
        <CornerDownLeft size={14} className="input-enter-icon" />
      </div>
    </div>
  );
};
