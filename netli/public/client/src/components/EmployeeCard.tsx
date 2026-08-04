import { motion } from 'framer-motion';
import { Pencil, Trash2 } from 'lucide-react';
import { Employee } from '../types/employee';
import DepartmentBadge from './DepartmentBadge';

function getAvatarGradient(name: string) {
  const gradients = [
    'linear-gradient(135deg, #7c3aed, #06b6d4)',
    'linear-gradient(135deg, #ec4899, #f97316)',
    'linear-gradient(135deg, #10b981, #06b6d4)',
    'linear-gradient(135deg, #f59e0b, #ef4444)',
    'linear-gradient(135deg, #6366f1, #8b5cf6)',
    'linear-gradient(135deg, #14b8a6, #3b82f6)',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return gradients[hash % gradients.length];
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

interface Props {
  employee: Employee;
  onEdit: (emp: Employee) => void;
  onDelete: (emp: Employee) => void;
}

export default function EmployeeCard({ employee, onEdit, onDelete }: Props) {
  const { name, role, department, status, salary, email } = employee;

  return (
    <motion.div
      className="glass-card"
      style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}
      layout
      whileHover={{ y: -2 }}
      transition={{ layout: { duration: 0.2 } }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div
          className="avatar"
          style={{ background: getAvatarGradient(name) }}
        >
          {getInitials(name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15, color: '#f1f1f6', marginBottom: 2 }}>
            {name}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {email}
          </div>
        </div>
        <span className={`status-pill ${status}`}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: status === 'active' ? '#34d399' : '#64748b', display: 'inline-block' }} />
          {status}
        </span>
      </div>

      {/* Role */}
      <div style={{ fontSize: 13, color: '#94a3b8' }}>
        {role}
      </div>

      {/* Badges row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <DepartmentBadge dept={department} />
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Salary</div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ${salary.toLocaleString()}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-icon edit" onClick={() => onEdit(employee)} title="Edit">
            <Pencil size={15} />
          </button>
          <button className="btn-icon danger" onClick={() => onDelete(employee)} title="Delete">
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
