import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserCheck, Building2, TrendingUp, Pencil, Check, X as XIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { Employee } from '../types/employee';
import { fetchEmployees, fetchDepartments, updateEmployee, deleteEmployee } from '../api/employees';
import DepartmentBadge from '../components/DepartmentBadge';
import StatsCard from '../components/StatsCard';
import DeptBarChart from '../components/DeptBarChart';
import DeleteModal from '../components/DeleteModal';
import EmployeeFormPanel from '../components/EmployeeFormPanel';

export default function Admin() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDept, setActiveDept] = useState('All');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

  const load = useCallback(async () => {
    try {
      const [emps, depts] = await Promise.all([
        fetchEmployees({ department: activeDept === 'All' ? undefined : activeDept }),
        fetchDepartments(),
      ]);
      setEmployees(emps);
      setDepartments(depts);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [activeDept]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  // Compute stats from all employees (always fetch all for stats)
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  useEffect(() => {
    fetchEmployees().then(setAllEmployees).catch(() => {});
  }, []);

  const totalActive = allEmployees.filter((e) => e.status === 'active').length;

  const deptStats = departments.map((dept) => ({
    department: dept,
    count: allEmployees.filter((e) => e.department === dept).length,
  }));
  const maxDeptCount = Math.max(...deptStats.map((d) => d.count), 1);

  const avgSalary = allEmployees.length
    ? Math.round(allEmployees.reduce((s, e) => s + e.salary, 0) / allEmployees.length)
    : 0;

  const handleEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setPanelOpen(true);
  };

  const handleSubmit = async (data: Parameters<typeof updateEmployee>[1]) => {
    if (!editingEmployee) return;
    await updateEmployee(editingEmployee.id, data);
    toast.success(`${editingEmployee.name} updated`);
    load();
    fetchEmployees().then(setAllEmployees);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteEmployee(deleteTarget.id);
    toast.success(`${deleteTarget.name} removed`);
    setDeleteTarget(null);
    load();
    fetchEmployees().then(setAllEmployees);
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ padding: '32px 36px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h1 style={{ fontSize: 26, marginBottom: 4 }}>
          <span className="gradient-text">Admin</span> Console
        </h1>
        <p style={{ color: '#64748b', fontSize: 14 }}>Workforce analytics and management</p>
      </div>

      <div style={{ padding: '28px 36px', display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* Stats Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          <StatsCard
            index={0}
            title="Total Employees"
            value={allEmployees.length}
            subtitle="across all departments"
            icon={<Users size={20} color="#fff" />}
            gradient="linear-gradient(135deg,#7c3aed,#06b6d4)"
          />
          <StatsCard
            index={1}
            title="Active Staff"
            value={totalActive}
            subtitle={`${allEmployees.length - totalActive} inactive`}
            icon={<UserCheck size={20} color="#fff" />}
            gradient="linear-gradient(135deg,#10b981,#06b6d4)"
          />
          <StatsCard
            index={2}
            title="Departments"
            value={departments.length}
            subtitle="active divisions"
            icon={<Building2 size={20} color="#fff" />}
            gradient="linear-gradient(135deg,#6366f1,#8b5cf6)"
          />
          <StatsCard
            index={3}
            title="Avg. Salary"
            value={`$${avgSalary.toLocaleString()}`}
            subtitle="annual compensation"
            icon={<TrendingUp size={20} color="#fff" />}
            gradient="linear-gradient(135deg,#f59e0b,#f97316)"
          />
        </div>

        {/* Charts + Table row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, alignItems: 'start' }}>
          {/* Bar Chart */}
          <motion.div
            className="glass-card"
            style={{ padding: 24 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h3 style={{ fontSize: 15, marginBottom: 20, fontFamily: "'Space Grotesk',sans-serif" }}>
              Headcount by Department
            </h3>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i}>
                    <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 8 }} />
                  </div>
                ))}
              </div>
            ) : (
              <DeptBarChart stats={deptStats} maxCount={maxDeptCount} />
            )}
          </motion.div>

          {/* Department Tabs + Table */}
          <motion.div
            className="glass-card"
            style={{ padding: 0, overflow: 'hidden' }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            {/* Tab Pills */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                overflowX: 'auto',
              }}
            >
              {['All', ...departments].map((dept) => {
                const isActive = activeDept === dept;
                const color =
                  dept === 'All'
                    ? '#7c3aed'
                    : dept === 'Engineering' ? '#6366f1'
                    : dept === 'Sales' ? '#f59e0b'
                    : dept === 'HR' ? '#ec4899'
                    : dept === 'Marketing' ? '#10b981'
                    : dept === 'Finance' ? '#f97316'
                    : '#8b5cf6';

                return (
                  <button
                    key={dept}
                    className="dept-tab"
                    onClick={() => setActiveDept(dept)}
                    style={{
                      background: isActive ? `${color}22` : undefined,
                      borderColor: isActive ? `${color}55` : 'transparent',
                      color: isActive ? color : undefined,
                    }}
                  >
                    {dept}
                    <span
                      style={{
                        marginLeft: 6,
                        background: isActive ? `${color}33` : 'rgba(255,255,255,0.08)',
                        borderRadius: 999,
                        padding: '1px 7px',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {dept === 'All'
                        ? allEmployees.length
                        : allEmployees.filter((e) => e.department === dept).length}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto', minHeight: 300 }}>
              {loading ? (
                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8 }} />
                  ))}
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Role</th>
                      <th>Salary</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence mode="popLayout">
                      {employees.map((emp, i) => (
                        <motion.tr
                          key={emp.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.03 }}
                        >
                          {/* Employee */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div
                                className="avatar"
                                style={{
                                  background: `linear-gradient(135deg, #7c3aed, #06b6d4)`,
                                  width: 32,
                                  height: 32,
                                  fontSize: 12,
                                  borderRadius: 8,
                                }}
                              >
                                {emp.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13, color: '#f1f1f6' }}>{emp.name}</div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>{emp.email}</div>
                              </div>
                            </div>
                          </td>
                          <td><DepartmentBadge dept={emp.department} /></td>
                          <td style={{ color: '#94a3b8', fontSize: 13 }}>{emp.role}</td>
                          <td>
                            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 13 }}>
                              ${emp.salary.toLocaleString()}
                            </span>
                          </td>
                          <td>
                            <span className={`status-pill ${emp.status}`}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: emp.status === 'active' ? '#34d399' : '#64748b', display: 'inline-block' }} />
                              {emp.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                              <button className="btn-icon edit" onClick={() => handleEdit(emp)} title="Edit">
                                <Pencil size={13} />
                              </button>
                              <button className="btn-icon danger" onClick={() => setDeleteTarget(emp)} title="Delete">
                                <XIcon size={13} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                    {employees.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                          No employees in this department
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Edit Panel */}
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
