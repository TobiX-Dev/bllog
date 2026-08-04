import React from 'react';
import { ShieldAlert, Calendar, Clock, Award } from 'lucide-react';
import type { BlogPost } from '../data/blogData';

interface BlogCardProps {
  blog: BlogPost;
  onClick: () => void;
}

export const BlogCard: React.FC<BlogCardProps> = ({ blog, onClick }) => {
  const getSeverityClass = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'critical': return 'severity-critical';
      case 'high': return 'severity-high';
      case 'medium': return 'severity-medium';
      case 'low': return 'severity-low';
      default: return 'severity-info';
    }
  };

  return (
    <article className="blog-card" onClick={onClick}>
      <div className="blog-card-header">
        <span className={`severity-badge ${getSeverityClass(blog.severity)}`}>
          <ShieldAlert size={12} className="inline-icon" /> {blog.severity}
        </span>
        <span className="blog-card-category">{blog.category}</span>
      </div>

      <h3 className="blog-card-title">{blog.title}</h3>
      <p className="blog-card-subtitle">{blog.subtitle}</p>

      <div className="blog-card-meta">
        <div className="meta-left">
          <span className="meta-item">
            <Calendar size={13} /> {blog.date}
          </span>
          <span className="meta-item">
            <Clock size={13} /> {blog.readTime}
          </span>
        </div>
        
        <div className="meta-right">
          {blog.cve && (
            <span className="meta-badge cve-badge">
              <Award size={12} /> {blog.cve}
            </span>
          )}
        </div>
      </div>
      
      <div className="blog-card-footer">
        <span className="target-text">Target: <code>{blog.target}</code></span>
        <span className="read-more-link">Read writeup →</span>
      </div>
    </article>
  );
};
