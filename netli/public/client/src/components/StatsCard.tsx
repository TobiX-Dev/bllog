import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  gradient?: string;
  index?: number;
}

export default function StatsCard({ title, value, subtitle, icon, gradient, index = 0 }: Props) {
  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: gradient ?? 'linear-gradient(135deg,#7c3aed,#06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
          }}
        >
          {icon}
        </div>
      </div>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{subtitle}</div>}
    </motion.div>
  );
}
