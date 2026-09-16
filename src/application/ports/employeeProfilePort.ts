import type { Employee } from '../../types';

export interface EmployeeProfilePort {
  saveEmployee(employee: Employee, companyId: string): Promise<{ success: boolean; data?: Employee; error?: string }>;
}
