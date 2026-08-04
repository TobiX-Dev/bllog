import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Employee } from '../types/employee';

interface Props {
  employee: Employee | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteModal({ employee, onConfirm, onCancel }: Props) {
  return (
    <AnimatePresence>
      {employee && (
        <>
          <motion.div
            className="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />
          <motion.div
            className="modal"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertTriangle size={22} color="#ef4444" />
              </div>
              <button className="btn-icon" onClick={onCancel}><X size={16} /></button>
            </div>

            <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 10 }}>
              Delete Employee
            </h3>
            <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
              Are you sure you want to delete{' '}
              <span style={{ color: '#f1f1f6', fontWeight: 600 }}>{employee.name}</span>? This action
              cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-ghost" onClick={onCancel} style={{ flex: 1, justifyContent: 'center' }}>
                Cancel
              </button>
              <button
                onClick={onConfirm}
                style={{
                  flex: 1,
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.35)',
                  borderRadius: 10,
                  color: '#ef4444',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  padding: '10px 20px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.25)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.15)'; }}
              >
                Delete
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
