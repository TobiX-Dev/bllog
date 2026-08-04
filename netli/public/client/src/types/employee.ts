export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  salary: number;
  joinDate: string;
  status: 'active' | 'inactive';
}

export type EmployeeFormData = Omit<Employee, 'id'>;
