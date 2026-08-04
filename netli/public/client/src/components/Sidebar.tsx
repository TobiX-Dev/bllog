import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, ShieldCheck, ChevronLeft, ChevronRight, Zap, Users } from 'lucide-react';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin', icon: ShieldCheck, label: 'Admin' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      className="sidebar"
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '20px 14px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Zap size={18} color="#fff" fill="#fff" />
        </div>
        <motion.div
          animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }}
          transition={{ duration: 0.2 }}
          style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
        >
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: '#f1f1f6' }}>EMS</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: -2 }}>Workspace</div>
        </motion.div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 8px', flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', padding: '0 6px 8px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
          {!collapsed && 'NAVIGATION'}
        </div>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            title={collapsed ? label : undefined}
          >
            <Icon size={18} style={{ flexShrink: 0 }} />
            <motion.span
              animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
            >
              {label}
            </motion.span>
          </NavLink>
        ))}

        <div style={{ margin: '8px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }} />
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', padding: '4px 6px 8px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
          {!collapsed && 'COMING SOON'}
        </div>
        <div className="sidebar-link" style={{ opacity: 0.4, cursor: 'default', pointerEvents: 'none' }} title={collapsed ? 'Reports' : undefined}>
          <Users size={18} style={{ flexShrink: 0 }} />
          <motion.span
            animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
          >
            Reports
          </motion.span>
        </div>
      </nav>

      {/* Collapse toggle */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="sidebar-link"
          style={{ width: '100%', background: 'none', border: 'none', justifyContent: collapsed ? 'center' : 'flex-start' }}
        >
          {collapsed ? <ChevronRight size={18} /> : <>
            <ChevronLeft size={18} />
            <span>Collapse</span>
          </>}
        </button>
      </div>
    </motion.aside>
  );
}
