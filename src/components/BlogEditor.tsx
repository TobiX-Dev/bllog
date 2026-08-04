import React, { useState, useRef } from 'react';
import { PenTool, Eye, FileDown, PlusCircle, RotateCcw, AlertTriangle, ShieldCheck, Award } from 'lucide-react';
import type { BlogPost } from '../data/blogData';

interface BlogEditorProps {
  onPublish: (newPost: BlogPost) => void;
}

export const BlogEditor: React.FC<BlogEditorProps> = ({ onPublish }) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState<'Web Pentesting' | 'Exploit Dev' | 'Infrastructure' | 'CTF Writeup' | 'Cryptanalysis'>('Web Pentesting');
  const [severity, setSeverity] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('High');
  const [target, setTarget] = useState('');
  const [cve, setCve] = useState('');
  const [content, setContent] = useState(`## Overview\nProvide a summary of the vulnerability discovered.\n\n## Technical Details\nDetail your research steps here. Use code syntax tags below:\n\`\`\`javascript\nconsole.log("Vulnerability PoC");\n\`\`\`\n\n## Impact\nDetail the risks associated with this exploit.`);
  
  const [activePane, setActivePane] = useState<'editor' | 'preview'>('editor');
  const [validationError, setValidationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInsertTag = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;
    const selectedText = currentVal.substring(start, end);
    const newVal = currentVal.substring(0, start) + before + selectedText + after + currentVal.substring(end);
    
    setContent(newVal);
    
    // Focus back & select
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 50);
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to discard your changes?")) {
      setTitle('');
      setSubtitle('');
      setTarget('');
      setCve('');
      setContent('');
      setValidationError('');
      setSuccessMessage('');
    }
  };

  const handleDownloadMarkdown = () => {
    const mdString = `---
title: ${title || 'Untitled Writeup'}
subtitle: ${subtitle}
date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
author: Tobi
category: ${category}
severity: ${severity}
target: ${target || 'N/A'}
cve: ${cve || 'None'}
---

${content}
`;
    const blob = new Blob([mdString], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'writeup'}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    setSuccessMessage('');

    if (!title.trim() || !target.trim() || !content.trim()) {
      setValidationError('Error: Title, Target Host, and Log Body are required parameters.');
      return;
    }

    const calculatedId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newPost: BlogPost = {
      id: calculatedId,
      title,
      subtitle: subtitle || 'Cybersecurity Vulnerability Log Writeup',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      category,
      severity,
      target,
      readTime: `${Math.max(1, Math.round(content.split(/\s+/).length / 200))} min read`,
      summary: content.slice(0, 150).replace(/[#*`\-]/g, '') + '...',
      content,
      cve: cve.trim() || undefined
    };

    onPublish(newPost);
    setSuccessMessage('Vulnerability log compiled successfully and added to local storage database.');
    
    setTitle('');
    setSubtitle('');
    setTarget('');
    setCve('');
    setContent('');
  };

  // Simple Markdown compiler mockup for Editor Preview pane
  const renderSimplePreview = (text: string) => {
    const lines = text.split('\n');
    let insideCode = false;
    let keyIdx = 0;

    return lines.map(line => {
      if (line.trim().startsWith('```')) {
        insideCode = !insideCode;
        return <div key={`p-code-${keyIdx++}`} className="preview-divider-line"></div>;
      }
      if (insideCode) {
        return (
          <pre key={`pre-code-${keyIdx++}`} className="preview-code-block">
            <code>{line}</code>
          </pre>
        );
      }
      if (line.trim().startsWith('# ')) {
        return <h2 key={`preview-h1-${keyIdx++}`} className="preview-h1">{line.slice(2)}</h2>;
      }
      if (line.trim().startsWith('## ')) {
        return <h3 key={`preview-h2-${keyIdx++}`} className="preview-h2">{line.slice(3)}</h3>;
      }
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return <li key={`preview-li-${keyIdx++}`} className="preview-li">{line.slice(2)}</li>;
      }
      return line.trim() ? <p key={`preview-p-${keyIdx++}`} className="preview-p">{line}</p> : <br key={`preview-br-${keyIdx++}`} />;
    });
  };

  return (
    <div className="blog-editor-container">
      <div className="editor-intro">
        <h2 className="editor-title"><PenTool size={20} className="inline-icon" /> Compile New Writeup</h2>
        <p className="editor-tagline">Draft, format, and compile detailed vulnerability reports. Changes persist in local browser storage.</p>
      </div>

      {validationError && (
        <div className="editor-alert error-alert">
          <AlertTriangle size={16} /> {validationError}
        </div>
      )}

      {successMessage && (
        <div className="editor-alert success-alert">
          <ShieldCheck size={16} /> {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="editor-form">
        <div className="form-row-grid">
          <div className="form-group flex-2">
            <label>Report Title <span className="text-red">*</span></label>
            <input
              type="text"
              placeholder="e.g. Broken Authentication leads to Account Takeover on target.com"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label>Target Domain/Library <span className="text-red">*</span></label>
            <input
              type="text"
              placeholder="e.g. dev-api.target.com"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="form-input"
              required
            />
          </div>
        </div>

        <div className="form-row-grid">
          <div className="form-group">
            <label>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="form-select"
            >
              <option value="Web Pentesting">Web Pentesting</option>
              <option value="Exploit Dev">Exploit Dev</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="CTF Writeup">CTF Writeup</option>
              <option value="Cryptanalysis">Cryptanalysis</option>
            </select>
          </div>

          <div className="form-group">
            <label>Severity Level</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
              className="form-select"
            >
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="form-group">
            <label>CVE ID (Optional)</label>
            <input
              type="text"
              placeholder="e.g. CVE-2026-8812"
              value={cve}
              onChange={(e) => setCve(e.target.value)}
              className="form-input"
            />
          </div>

        </div>

        <div className="form-group">
          <label>Subtitle / Vulnerability Summary</label>
          <input
            type="text"
            placeholder="A brief 1-sentence synopsis of what this writeup is about..."
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="form-input"
          />
        </div>

        {/* Content Tabs */}
        <div className="editor-pane-toggles">
          <button
            type="button"
            className={`pane-btn ${activePane === 'editor' ? 'active' : ''}`}
            onClick={() => setActivePane('editor')}
          >
            <PenTool size={14} className="inline-icon" /> Editor (Markdown)
          </button>
          <button
            type="button"
            className={`pane-btn ${activePane === 'preview' ? 'active' : ''}`}
            onClick={() => setActivePane('preview')}
          >
            <Eye size={14} className="inline-icon" /> Live Render Preview
          </button>
        </div>

        {activePane === 'editor' ? (
          <div className="editor-pane">
            <div className="formatting-helpers">
              <button type="button" onClick={() => handleInsertTag('**', '**')} title="Bold text">B</button>
              <button type="button" onClick={() => handleInsertTag('## ')} title="Heading 2">H2</button>
              <button type="button" onClick={() => handleInsertTag('### ')} title="Heading 3">H3</button>
              <button type="button" onClick={() => handleInsertTag('`', '`')} title="Inline Code">Code</button>
              <button type="button" onClick={() => handleInsertTag('```javascript\n', '\n```')} title="Code Block">Code Block</button>
              <button type="button" onClick={() => handleInsertTag('- ')} title="Bullet List">List</button>
              <button type="button" onClick={() => handleInsertTag('[Link Title](', ')')} title="Insert Hyperlink">Link</button>
            </div>
            
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your security writeup details here in markdown style..."
              rows={12}
              className="editor-textarea"
              required
            />
          </div>
        ) : (
          <div className="preview-pane">
            <div className="preview-header-details">
              <h3 className="preview-blog-title">{title || 'Untitled Security Report'}</h3>
              <p className="preview-blog-subtitle">{subtitle || 'Report preview body summary...'}</p>
              <div className="preview-meta-chips">
                <span className="preview-chip">{category}</span>
                <span className="preview-chip">{severity}</span>
                {target && <span className="preview-chip">Target: {target}</span>}
                {cve && <span className="preview-chip"><Award size={12} className="inline-icon" /> {cve}</span>}
              </div>
            </div>
            <div className="preview-body-container">
              {renderSimplePreview(content)}
            </div>
          </div>
        )}

        <div className="editor-action-buttons">
          <button type="submit" className="btn-primary">
            <PlusCircle size={16} /> Compile Report
          </button>
          
          <button type="button" onClick={handleDownloadMarkdown} className="btn-secondary" disabled={!title.trim()}>
            <FileDown size={16} /> Save as Markdown File
          </button>

          <button type="button" onClick={handleClear} className="btn-danger">
            <RotateCcw size={16} /> Discard Form
          </button>
        </div>
      </form>
    </div>
  );
};
