import type { EmployeeProfilePort } from '../ports/employeeProfilePort';
import type { Employee } from '../../types';

export async function saveEmployeeProfile(
  employee: Employee,
  companyId: string,
  adapter?: EmployeeProfilePort
): Promise<{ success: boolean; data?: Employee; error?: string }> {
  if (!adapter) return { success: false, error: 'Employee profile adapter not provided.' };
  return adapter.saveEmployee(employee, companyId);
}
