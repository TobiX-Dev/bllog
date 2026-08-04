import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Building2, Briefcase, DollarSign, Calendar, ToggleLeft, ToggleRight } from 'lucide-react';
import { Employee, EmployeeFormData } from '../types/employee';

const DEPARTMENTS = ['Engineering', 'Sales', 'HR', 'Marketing', 'Finance'];

interface Props {
  open: boolean;
  employee: Employee | null; // null = add mode
  onClose: () => void;
  onSubmit: (data: EmployeeFormData) => Promise<void>;
}

const EMPTY: EmployeeFormData = {
  name: '',
  email: '',
  department: 'Engineering',
  role: '',
  salary: 0,
  joinDate: new Date().toISOString().split('T')[0],
  status: 'active',
};

function validate(data: EmployeeFormData): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!data.name.trim()) errs.name = 'Name is required';
  if (!data.email.trim()) errs.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = 'Invalid email';
  if (!data.role.trim()) errs.role = 'Role is required';
  if (!data.salary || data.salary <= 0) errs.salary = 'Enter a valid salary';
  if (!data.joinDate) errs.joinDate = 'Join date is required';
  return errs;
}

export default function EmployeeFormPanel({ open, employee, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<EmployeeFormData>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        employee
          ? { name: employee.name, email: employee.email, department: employee.department, role: employee.role, salary: employee.salary, joinDate: employee.joinDate, status: employee.status }
          : EMPTY
      );
      setErrors({});
    }
  }, [open, employee]);

  const set = (field: keyof EmployeeFormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(form);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className={`panel${shake ? ' shake' : ''}`}
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* Panel Header */}
            <div
              style={{
                padding: '24px 28px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                background: '#0d0d1a',
                zIndex: 1,
              }}
            >
              <div>
                <h2 style={{ fontSize: 18, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
                  {employee ? 'Edit Employee' : 'Add Employee'}
                </h2>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                  {employee ? `Editing ${employee.name}` : 'Fill in the details below'}
                </p>
              </div>
              <button className="btn-icon" onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Name */}
              <div>
                <label className="form-label">
                  <User size={11} style={{ display: 'inline', marginRight: 5 }} />
                  Full Name
                </label>
                <input
                  className={`input-field${errors.name ? ' error' : ''}`}
                  placeholder="e.g. Jane Smith"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                />
                {errors.name && <div className="error-text">{errors.name}</div>}
              </div>

              {/* Email */}
              <div>
                <label className="form-label">
                  <Mail size={11} style={{ display: 'inline', marginRight: 5 }} />
                  Email Address
                </label>
                <input
                  className={`input-field${errors.email ? ' error' : ''}`}
                  type="email"
                  placeholder="jane@company.com"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                />
                {errors.email && <div className="error-text">{errors.email}</div>}
              </div>

              {/* Department */}
              <div>
                <label className="form-label">
                  <Building2 size={11} style={{ display: 'inline', marginRight: 5 }} />
                  Department
                </label>
                <select
                  className="input-field"
                  value={form.department}
                  onChange={(e) => set('department', e.target.value)}
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Role */}
              <div>
                <label className="form-label">
                  <Briefcase size={11} style={{ display: 'inline', marginRight: 5 }} />
                  Job Role
                </label>
                <input
                  className={`input-field${errors.role ? ' error' : ''}`}
                  placeholder="e.g. Software Engineer"
                  value={form.role}
                  onChange={(e) => set('role', e.target.value)}
                />
                {errors.role && <div className="error-text">{errors.role}</div>}
              </div>

              {/* Salary */}
              <div>
                <label className="form-label">
                  <DollarSign size={11} style={{ display: 'inline', marginRight: 5 }} />
                  Annual Salary (USD)
                </label>
                <input
                  className={`input-field${errors.salary ? ' error' : ''}`}
                  type="number"
                  min="0"
                  placeholder="e.g. 95000"
                  value={form.salary || ''}
                  onChange={(e) => set('salary', Number(e.target.value))}
                />
                {errors.salary && <div className="error-text">{errors.salary}</div>}
              </div>

              {/* Join Date */}
              <div>
                <label className="form-label">
                  <Calendar size={11} style={{ display: 'inline', marginRight: 5 }} />
                  Join Date
                </label>
                <input
                  className={`input-field${errors.joinDate ? ' error' : ''}`}
                  type="date"
                  value={form.joinDate}
                  onChange={(e) => set('joinDate', e.target.value)}
                  style={{ colorScheme: 'dark' }}
                />
                {errors.joinDate && <div className="error-text">{errors.joinDate}</div>}
              </div>

              {/* Status Toggle */}
              <div>
                <label className="form-label">Status</label>
                <button
                  type="button"
                  onClick={() => set('status', form.status === 'active' ? 'inactive' : 'active')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: form.status === 'active' ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)',
                    border: `1px solid ${form.status === 'active' ? 'rgba(16,185,129,0.3)' : 'rgba(100,116,139,0.25)'}`,
                    borderRadius: 10,
                    padding: '10px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    color: form.status === 'active' ? '#34d399' : '#94a3b8',
                    fontSize: 14,
                    fontWeight: 500,
                    width: '100%',
                    justifyContent: 'flex-start',
                  }}
                >
                  {form.status === 'active' ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  {form.status === 'active' ? 'Active' : 'Inactive'}
                </button>
              </div>

              {/* Divider */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 4 }} />

              {/* Actions */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn-ghost" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gradient"
                  disabled={submitting}
                  style={{ flex: 1, justifyContent: 'center', opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? 'Saving…' : employee ? 'Save Changes' : 'Add Employee'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
