import { motion } from 'framer-motion';
import { getDeptSolid } from './DepartmentBadge';

interface DeptStat {
  department: string;
  count: number;
}

interface Props {
  stats: DeptStat[];
  maxCount: number;
}

export default function DeptBarChart({ stats, maxCount }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {stats.map(({ department, count }, i) => {
        const color = getDeptSolid(department);
        const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
        return (
          <div key={department}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>{department}</span>
              <span style={{ fontSize: 13, color: '#f1f1f6', fontWeight: 600 }}>{count}</span>
            </div>
            <div className="bar-track">
              <motion.div
                className="bar-fill"
                style={{ background: `linear-gradient(90deg, ${color}cc, ${color})` }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: [0.4, 0, 0.2, 1] }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
