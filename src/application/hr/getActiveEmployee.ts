import { Employee } from "../../types";
import { EmployeeRepositoryPort } from "../ports/employeeRepositoryPort";

export interface GetActiveEmployeeOptions {
  employees?: Employee[];
  activeId?: string | null;
  savedUserName?: string | null;
  repository?: EmployeeRepositoryPort;
  loadEmployeesHandler?: () => Employee[];
  loadActiveEmployeeIdHandler?: () => string | null;
  loadSavedUserNameHandler?: () => string | null;
}

/**
 * Application Resolver: Resolves the currently active employee from provided state or repository.
 * Pure Application Layer — Zero direct browser/storage dependencies.
 */
export function getActiveEmployee(userName?: string, options?: GetActiveEmployeeOptions): Employee {
  const repo = options?.repository;
  const loadEmpsFn = options?.loadEmployeesHandler || (repo ? () => repo.loadEmployees() : () => []);
  const loadActiveIdFn = options?.loadActiveEmployeeIdHandler || (repo ? () => repo.loadActiveEmployeeId() : () => null);
  const loadSavedUserFn =
    options?.loadSavedUserNameHandler || (repo && repo.loadCurrentUserName ? () => repo.loadCurrentUserName!() : () => null);

  const emps = options?.employees || loadEmpsFn();
  const activeId = options?.activeId !== undefined ? options.activeId : loadActiveIdFn();
  const savedUserName = options?.savedUserName !== undefined ? options.savedUserName : loadSavedUserFn();
  const resolvedUserName = userName || savedUserName || "المستخدم";

  return (
    emps.find((e) => e.id === activeId) ||
    emps[0] ||
    ({
      id: "emp-curr",
      fullName: resolvedUserName,
      nameAr: resolvedUserName,
      nameEn: "User",
      role: "مدير النظام",
    } as unknown as Employee)
  );
}
