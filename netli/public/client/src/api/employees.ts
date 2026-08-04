import axios from 'axios';
import { Employee, EmployeeFormData } from '../types/employee';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

export const fetchEmployees = async (params?: {
  department?: string;
  search?: string;
}): Promise<Employee[]> => {
  const { data } = await API.get<Employee[]>('/employees', { params });
  return data;
};

export const fetchEmployee = async (id: string): Promise<Employee> => {
  const { data } = await API.get<Employee>(`/employees/${id}`);
  return data;
};

export const createEmployee = async (emp: EmployeeFormData): Promise<Employee> => {
  const { data } = await API.post<Employee>('/employees', emp);
  return data;
};

export const updateEmployee = async (id: string, emp: Partial<EmployeeFormData>): Promise<Employee> => {
  const { data } = await API.put<Employee>(`/employees/${id}`, emp);
  return data;
};

export const deleteEmployee = async (id: string): Promise<void> => {
  await API.delete(`/employees/${id}`);
};

export const fetchDepartments = async (): Promise<string[]> => {
  const { data } = await API.get<string[]>('/departments');
  return data;
};
