import { Employee } from '../../types';

export interface EmployeeRepositoryPort {
  loadEmployees(): Employee[];
  loadActiveEmployeeId(): string | null;
  loadCurrentUserName?(): string | null;
}
