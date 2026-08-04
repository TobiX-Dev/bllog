import express from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// --- lowdb setup ---
const dbPath = join(__dirname, '..', 'db.json');
const adapter = new JSONFile(dbPath);
const defaultData = { employees: [] };
const db = new Low(adapter, defaultData);

// --- Seed data ---
const SEED_EMPLOYEES = [
  {
    id: uuidv4(),
    name: 'Sophia Reynolds',
    email: 'sophia.reynolds@acme.com',
    department: 'Engineering',
    role: 'Senior Engineer',
    salary: 135000,
    joinDate: '2021-03-15',
    status: 'active',
  },
  {
    id: uuidv4(),
    name: 'Marcus Chen',
    email: 'marcus.chen@acme.com',
    department: 'Engineering',
    role: 'Frontend Developer',
    salary: 110000,
    joinDate: '2022-07-01',
    status: 'active',
  },
  {
    id: uuidv4(),
    name: 'Priya Nair',
    email: 'priya.nair@acme.com',
    department: 'HR',
    role: 'HR Manager',
    salary: 95000,
    joinDate: '2020-01-20',
    status: 'active',
  },
  {
    id: uuidv4(),
    name: 'James Okafor',
    email: 'james.okafor@acme.com',
    department: 'Sales',
    role: 'Sales Executive',
    salary: 85000,
    joinDate: '2023-02-14',
    status: 'active',
  },
  {
    id: uuidv4(),
    name: 'Elena Vasquez',
    email: 'elena.vasquez@acme.com',
    department: 'Marketing',
    role: 'Marketing Lead',
    salary: 98000,
    joinDate: '2021-09-05',
    status: 'active',
  },
  {
    id: uuidv4(),
    name: 'Daniel Kim',
    email: 'daniel.kim@acme.com',
    department: 'Engineering',
    role: 'Backend Developer',
    salary: 115000,
    joinDate: '2022-04-11',
    status: 'inactive',
  },
  {
    id: uuidv4(),
    name: 'Amara Osei',
    email: 'amara.osei@acme.com',
    department: 'Finance',
    role: 'Financial Analyst',
    salary: 102000,
    joinDate: '2020-11-30',
    status: 'active',
  },
  {
    id: uuidv4(),
    name: 'Liam Patterson',
    email: 'liam.patterson@acme.com',
    department: 'Sales',
    role: 'Account Manager',
    salary: 78000,
    joinDate: '2023-06-19',
    status: 'active',
  },
  {
    id: uuidv4(),
    name: 'Yuki Tanaka',
    email: 'yuki.tanaka@acme.com',
    department: 'Marketing',
    role: 'Content Strategist',
    salary: 88000,
    joinDate: '2022-01-10',
    status: 'inactive',
  },
  {
    id: uuidv4(),
    name: 'Carlos Mendez',
    email: 'carlos.mendez@acme.com',
    department: 'HR',
    role: 'Recruiter',
    salary: 72000,
    joinDate: '2023-08-22',
    status: 'active',
  },
];

// --- Init DB and start server ---
async function init() {
  await db.read();

  // Seed only if empty
  if (!db.data.employees || db.data.employees.length === 0) {
    db.data.employees = SEED_EMPLOYEES;
    await db.write();
    console.log('✅ Database seeded with 10 employees.');
  }

  // ---- ROUTES ----

  // GET /api/departments
  app.get('/api/departments', async (req, res) => {
    await db.read();
    const departments = [...new Set(db.data.employees.map((e) => e.department))].sort();
    res.json(departments);
  });

  // GET /api/employees
  app.get('/api/employees', async (req, res) => {
    await db.read();
    let employees = db.data.employees;

    const { department, search } = req.query;

    if (department && department !== 'All') {
      employees = employees.filter((e) => e.department === department);
    }

    if (search) {
      const q = search.toLowerCase();
      employees = employees.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.role.toLowerCase().includes(q)
      );
    }

    res.json(employees);
  });

  // GET /api/employees/:id
  app.get('/api/employees/:id', async (req, res) => {
    await db.read();
    const employee = db.data.employees.find((e) => e.id === req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  });

  // POST /api/employees
  app.post('/api/employees', async (req, res) => {
    await db.read();
    const { name, email, department, role, salary, joinDate, status } = req.body;

    if (!name || !email || !department || !role || !salary || !joinDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newEmployee = {
      id: uuidv4(),
      name,
      email,
      department,
      role,
      salary: Number(salary),
      joinDate,
      status: status || 'active',
    };

    db.data.employees.push(newEmployee);
    await db.write();
    res.status(201).json(newEmployee);
  });

  // PUT /api/employees/:id
  app.put('/api/employees/:id', async (req, res) => {
    await db.read();
    const idx = db.data.employees.findIndex((e) => e.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Employee not found' });

    const existing = db.data.employees[idx];
    const updated = {
      ...existing,
      ...req.body,
      id: existing.id, // id is immutable
      salary: Number(req.body.salary ?? existing.salary),
    };

    db.data.employees[idx] = updated;
    await db.write();
    res.json(updated);
  });

  // DELETE /api/employees/:id
  app.delete('/api/employees/:id', async (req, res) => {
    await db.read();
    const idx = db.data.employees.findIndex((e) => e.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Employee not found' });

    db.data.employees.splice(idx, 1);
    await db.write();
    res.json({ message: 'Employee deleted' });
  });

  app.listen(PORT, () => {
    console.log(`🚀 EMS API running on http://localhost:${PORT}`);
  });
}

init().catch(console.error);
