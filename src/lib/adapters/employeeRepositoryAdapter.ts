import { EmployeeRepositoryPort } from '../../application/ports/employeeRepositoryPort';
import { Employee } from '../../types';
import { loadEmployees, loadActiveEmployeeId } from '../../utils/storage';

export const defaultEmployeeRepositoryAdapter: EmployeeRepositoryPort = {
  loadEmployees(): Employee[] {
    return loadEmployees();
  },
  loadActiveEmployeeId(): string | null {
    return loadActiveEmployeeId();
  },
  loadCurrentUserName(): string | null {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('rv_user_name') : null;
  }
};
