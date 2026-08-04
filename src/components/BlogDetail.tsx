import React, { useState } from 'react';
import { ArrowLeft, ShieldAlert, Calendar, Clock, Award, Terminal, Check, Copy } from 'lucide-react';
import type { BlogPost } from '../data/blogData';

interface BlogDetailProps {
  blog: BlogPost;
  onBack: () => void;
}

export const BlogDetail: React.FC<BlogDetailProps> = ({ blog, onBack }) => {
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});

  const handleCopyCode = (code: string, blockId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedStates(prev => ({ ...prev, [blockId]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [blockId]: false }));
    }, 2000);
  };

  const getSeverityClass = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'critical': return 'severity-critical';
      case 'high': return 'severity-high';
      case 'medium': return 'severity-medium';
      case 'low': return 'severity-low';
      default: return 'severity-info';
    }
  };

  // Markdown parser with image support
  const renderMarkdown = (content: string) => {
    const lines = content.split('\n');
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeLines: string[] = [];
    const elements: React.ReactNode[] = [];
    let keyIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code blocks
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          const codeString = codeLines.join('\n');
          const blockId = `code-block-${keyIndex++}`;
          const currentLang = codeLanguage || 'code';
          
          elements.push(
            <div key={blockId} className="markdown-code-block-wrapper">
              <div className="code-block-header">
                <span className="code-lang">{currentLang}</span>
                <button
                  className="copy-code-btn"
                  onClick={() => handleCopyCode(codeString, blockId)}
                  title="Copy to clipboard"
                >
                  {copiedStates[blockId] ? (
                    <>
                      <Check size={14} className="inline-icon text-success" />
                      <span className="copied-text text-success">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} className="inline-icon" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="markdown-pre">
                <code className="markdown-code">{codeString}</code>
              </pre>
            </div>
          );
          
          inCodeBlock = false;
          codeLines = [];
        } else {
          inCodeBlock = true;
          codeLanguage = line.trim().slice(3) || 'text';
        }
        continue;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        continue;
      }

      // Empty lines
      if (!line.trim()) {
        elements.push(<div key={`br-${keyIndex++}`} className="markdown-spacing"></div>);
        continue;
      }

      // Horizontal rule
      if (line.trim() === '---') {
        elements.push(<hr key={`hr-${keyIndex++}`} className="markdown-hr" />);
        continue;
      }

      // Image lines: ![alt text](/path)
      const imgMatch = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (imgMatch) {
        const [, altText, imgSrc] = imgMatch;
        elements.push(
          <figure key={`img-${keyIndex++}`} className="markdown-figure">
            <img src={imgSrc} alt={altText} className="markdown-img" />
            {altText && <figcaption className="markdown-figcaption">{altText}</figcaption>}
          </figure>
        );
        continue;
      }

      // Headers
      if (line.startsWith('# ')) {
        elements.push(<h1 key={`h1-${keyIndex++}`} className="markdown-h1">{parseInlineElements(line.slice(2))}</h1>);
        continue;
      }
      if (line.startsWith('## ')) {
        elements.push(<h2 key={`h2-${keyIndex++}`} className="markdown-h2">{parseInlineElements(line.slice(3))}</h2>);
        continue;
      }
      if (line.startsWith('### ')) {
        elements.push(<h3 key={`h3-${keyIndex++}`} className="markdown-h3">{parseInlineElements(line.slice(4))}</h3>);
        continue;
      }

      // Unordered Lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        elements.push(
          <li key={`li-${keyIndex++}`} className="markdown-li">
            {parseInlineElements(line.trim().slice(2))}
          </li>
        );
        continue;
      }

      // Ordered Lists
      if (/^\d+\.\s/.test(line.trim())) {
        const contentText = line.trim().replace(/^\d+\.\s/, '');
        elements.push(
          <li key={`ol-${keyIndex++}`} className="markdown-li-ordered">
            {parseInlineElements(contentText)}
          </li>
        );
        continue;
      }

      // Default paragraph
      elements.push(<p key={`p-${keyIndex++}`} className="markdown-p">{parseInlineElements(line)}</p>);
    }

    return elements;
  };

  const parseInlineElements = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let currentText = text;
    let idx = 0;

    while (currentText.length > 0) {
      const boldIdx = currentText.indexOf('**');
      const codeIdx = currentText.indexOf('`');
      const linkIdx = currentText.indexOf('[');

      const firstMarker = [
        { type: 'bold', index: boldIdx },
        { type: 'code', index: codeIdx },
        { type: 'link', index: linkIdx }
      ]
        .filter(m => m.index !== -1)
        .sort((a, b) => a.index - b.index)[0];

      if (!firstMarker) {
        parts.push(<span key={`text-${idx++}`}>{currentText}</span>);
        break;
      }

      if (firstMarker.index > 0) {
        parts.push(<span key={`text-${idx++}`}>{currentText.slice(0, firstMarker.index)}</span>);
      }

      currentText = currentText.slice(firstMarker.index);

      if (firstMarker.type === 'bold') {
        const nextBold = currentText.indexOf('**', 2);
        if (nextBold !== -1) {
          const boldText = currentText.slice(2, nextBold);
          parts.push(<strong key={`bold-${idx++}`} className="markdown-strong">{boldText}</strong>);
          currentText = currentText.slice(nextBold + 2);
        } else {
          parts.push(<span key={`text-${idx++}`}>**</span>);
          currentText = currentText.slice(2);
        }
      } else if (firstMarker.type === 'code') {
        const nextCode = currentText.indexOf('`', 1);
        if (nextCode !== -1) {
          const codeText = currentText.slice(1, nextCode);
          parts.push(<code key={`code-${idx++}`} className="markdown-inline-code">{codeText}</code>);
          currentText = currentText.slice(nextCode + 1);
        } else {
          parts.push(<span key={`text-${idx++}`}>`</span>);
          currentText = currentText.slice(1);
        }
      } else if (firstMarker.type === 'link') {
        const closeBrac = currentText.indexOf(']');
        const openParen = currentText.indexOf('(', closeBrac);
        const closeParen = currentText.indexOf(')', openParen);

        if (closeBrac !== -1 && openParen === closeBrac + 1 && closeParen !== -1) {
          const linkText = currentText.slice(1, closeBrac);
          const linkUrl = currentText.slice(openParen + 1, closeParen);
          parts.push(
            <a key={`link-${idx++}`} href={linkUrl} target="_blank" rel="noopener noreferrer" className="markdown-link">
              {linkText}
            </a>
          );
          currentText = currentText.slice(closeParen + 1);
        } else {
          parts.push(<span key={`text-${idx++}`}>[</span>);
          currentText = currentText.slice(1);
        }
      }
    }

    return parts;
  };

  return (
    <div className="blog-detail-container">
      <button onClick={onBack} className="back-btn">
        <ArrowLeft size={16} /> Back to Blog
      </button>

      <header className="blog-detail-header">
        <div className="detail-meta-top">
          <span className={`severity-badge ${getSeverityClass(blog.severity)}`}>
            <ShieldAlert size={14} className="inline-icon" /> {blog.severity}
          </span>
          <span className="detail-category">{blog.category}</span>
        </div>

        <h1 className="detail-title">{blog.title}</h1>
        <p className="detail-subtitle">{blog.subtitle}</p>

        <div className="detail-meta-grid">
          <div className="meta-grid-item">
            <span className="meta-label">Published</span>
            <span className="meta-value flex-align-center"><Calendar size={13} className="inline-icon" /> {blog.date}</span>
          </div>
          <div className="meta-grid-item">
            <span className="meta-label">Read Time</span>
            <span className="meta-value flex-align-center"><Clock size={13} className="inline-icon" /> {blog.readTime}</span>
          </div>
          <div className="meta-grid-item">
            <span className="meta-label">Target</span>
            <span className="meta-value"><code>{blog.target}</code></span>
          </div>
          {blog.cve && (
            <div className="meta-grid-item highlight-cve">
              <span className="meta-label">CVE</span>
              <span className="meta-value flex-align-center">
                <Award size={14} className="inline-icon" /> {blog.cve}
              </span>
            </div>
          )}
        </div>
      </header>

      <section className="blog-content-body">
        {renderMarkdown(blog.content)}
      </section>

      <div className="blog-detail-footer">
        <Terminal size={16} className="inline-icon" />
        <span className="footer-code">// End of Report — Responsible Disclosure Verified</span>
      </div>
    </div>
  );
};
