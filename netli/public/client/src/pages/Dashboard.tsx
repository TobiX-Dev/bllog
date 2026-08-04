import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Users, SlidersHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import { Employee } from '../types/employee';
import { fetchEmployees, fetchDepartments, createEmployee, updateEmployee, deleteEmployee } from '../api/employees';
import EmployeeCard from '../components/EmployeeCard';
import SkeletonCard from '../components/SkeletonCard';
import EmployeeFormPanel from '../components/EmployeeFormPanel';
import DeleteModal from '../components/DeleteModal';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: 'easeOut' as const } },

  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

export default function Dashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

  const load = useCallback(async () => {
    try {
      const [emps, depts] = await Promise.all([
        fetchEmployees({ department: deptFilter === 'All' ? undefined : deptFilter, search: search || undefined }),
        fetchDepartments(),
      ]);
      setEmployees(emps);
      setDepartments(depts);
    } catch {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [deptFilter, search]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => load(), 250); // debounce search
    return () => clearTimeout(t);
  }, [load]);

  const handleAdd = () => {
    setEditingEmployee(null);
    setPanelOpen(true);
  };

  const handleEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setPanelOpen(true);
  };

  const handleSubmit = async (data: Parameters<typeof createEmployee>[0]) => {
    if (editingEmployee) {
      await updateEmployee(editingEmployee.id, data);
      toast.success(`${data.name} updated successfully`);
    } else {
      await createEmployee(data);
      toast.success(`${data.name} added to the team`);
    }
    load();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteEmployee(deleteTarget.id);
    toast.success(`${deleteTarget.name} removed`);
    setDeleteTarget(null);
    load();
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Page Header */}
      <div
        style={{
          padding: '32px 36px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ fontSize: 26, marginBottom: 4 }}>
            <span className="gradient-text">Employee</span> Directory
          </h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            {loading ? '...' : `${employees.length} employee${employees.length !== 1 ? 's' : ''} found`}
          </p>
        </div>
        <button className="btn-gradient" onClick={handleAdd}>
          <Plus size={16} />
          Add Employee
        </button>
      </div>

      {/* Filters */}
      <div
        style={{
          padding: '20px 36px',
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        {/* Search */}
        <div className="search-wrapper" style={{ flex: '1 1 240px', maxWidth: 360 }}>
          <Search size={15} />
          <input
            className="input-field"
            placeholder="Search name, email, role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Department filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SlidersHorizontal size={15} color="#64748b" />
          <select
            className="input-field"
            style={{ width: 160 }}
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="All">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding: '28px 36px' }}>
        {loading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
            }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : employees.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 20px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                background: 'rgba(124,58,237,0.12)',
                border: '1px solid rgba(124,58,237,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <Users size={32} color="#7c3aed" />
            </div>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>No employees found</h3>
            <p style={{ color: '#64748b', fontSize: 14, maxWidth: 300 }}>
              {search || deptFilter !== 'All'
                ? 'Try adjusting your search or filter.'
                : 'Get started by adding your first employee.'}
            </p>
            {!search && deptFilter === 'All' && (
              <button className="btn-gradient" onClick={handleAdd} style={{ marginTop: 24 }}>
                <Plus size={16} /> Add First Employee
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
            }}
          >
            <AnimatePresence mode="popLayout">
              {employees.map((emp) => (
                <motion.div key={emp.id} variants={cardVariants} layout exit="exit">
                  <EmployeeCard employee={emp} onEdit={handleEdit} onDelete={setDeleteTarget} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Add / Edit Panel */}
      <EmployeeFormPanel
        open={panelOpen}
        employee={editingEmployee}
        onClose={() => setPanelOpen(false)}
        onSubmit={handleSubmit}
      />

      {/* Delete Modal */}
      <DeleteModal
        employee={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
