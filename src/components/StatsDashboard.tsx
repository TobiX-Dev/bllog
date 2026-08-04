import React from 'react';
import { Terminal, Award, Activity, AlertOctagon, CheckCircle2, RefreshCw } from 'lucide-react';
import type { BlogPost } from '../data/blogData';

interface StatsDashboardProps {
  blogs: BlogPost[];
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ blogs }) => {
  // Compute metrics
  const totalBugs = blogs.length;
  const criticalBugs = blogs.filter(b => b.severity.toLowerCase() === 'critical').length;
  const cveCount = blogs.filter(b => b.cve).length;
  

  // Group by category for percentage bars
  const categoryCounts = blogs.reduce((acc, blog) => {
    acc[blog.category] = (acc[blog.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="dashboard-container animate-fade-in">
      <div className="dashboard-intro">
        <h2 className="dashboard-title"><Activity size={20} className="inline-icon text-accent" /> Security Operation Dashboard</h2>
        <p className="dashboard-tagline">Real-time indicators tracking active vulnerability audits, CVE contributions, and target status tables.</p>
      </div>

      {/* Metrics Row */}
      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Vulnerability Logs</span>
            <Terminal size={18} className="metric-icon color-blue" />
          </div>
          <div className="metric-value">{totalBugs}</div>
          <div className="metric-footer">Reported vulnerabilities</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Critical Severity</span>
            <AlertOctagon size={18} className="metric-icon color-red" />
          </div>
          <div className="metric-value text-critical">{criticalBugs}</div>
          <div className="metric-footer">Immediate remediation actions</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">CVE Assignments</span>
            <Award size={18} className="metric-icon color-yellow" />
          </div>
          <div className="metric-value">{cveCount}</div>
          <div className="metric-footer">Security identifiers tracked</div>
        </div>


      </div>

      {/* Targets and Categories Grid */}
      <div className="dashboard-grid">
        {/* Targets Table */}
        <div className="grid-card table-card">
          <h3 className="grid-card-title">Target Remediation Ledger</h3>
          <div className="table-wrapper">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>Host Target</th>
                  <th>Primary Threat Class</th>
                  <th>Severity</th>
                  <th>Remediation</th>
                </tr>
              </thead>
              <tbody>
                {blogs.map((blog, idx) => (
                  <tr key={idx}>
                    <td><code>{blog.target}</code></td>
                    <td>{blog.category}</td>
                    <td>
                      <span className={`table-severity-dot ${blog.severity.toLowerCase()}`}>
                        {blog.severity}
                      </span>
                    </td>
                    <td>
                      {blog.severity === 'Critical' ? (
                        <span className="remediation-tag tag-patched">
                          <CheckCircle2 size={12} className="inline-icon" /> Patched
                        </span>
                      ) : (
                        <span className="remediation-tag tag-reviewing">
                          <RefreshCw size={12} className="inline-icon spin-icon" /> Monitoring
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats breakdown */}
        <div className="grid-card details-card">
          <h3 className="grid-card-title">Audit Vectors Breakdown</h3>
          <div className="categories-chart-wrapper">
            {Object.entries(categoryCounts).map(([catName, count], idx) => {
              const percentage = Math.round((count / totalBugs) * 100);
              return (
                <div key={idx} className="category-bar-group">
                  <div className="category-bar-labels">
                    <span className="category-name">{catName}</span>
                    <span className="category-percentage">{percentage}% ({count})</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="system-health-panel">
            <h4 className="health-title">Active Security Systems</h4>
            <div className="health-grid">
              <div className="health-item">
                <span className="health-label">API Sandbox</span>
                <span className="health-status status-online">Secure</span>
              </div>
              <div className="health-item">
                <span className="health-label">Log Signature Integrity</span>
                <span className="health-status status-online">Valid (SHA-256)</span>
              </div>
              <div className="health-item">
                <span className="health-label">Vulnerability Watcher</span>
                <span className="health-status status-online">Armed</span>
              </div>
              <div className="health-item">
                <span className="health-label">Database Connection</span>
                <span className="health-status status-warning">Static Node / Syncing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
