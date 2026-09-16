import type { EmployeeProfilePort } from '../../application/ports/employeeProfilePort';
import type { Employee } from '../../types';
import { upsertEmployee as supabaseUpsertEmployee } from '../supabase/employeeService';

export const defaultEmployeeProfileAdapter: EmployeeProfilePort = {
  saveEmployee(employee: Employee, companyId: string) {
    return supabaseUpsertEmployee(employee, companyId);
  }
};
