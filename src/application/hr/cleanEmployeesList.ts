/**
 * Application Helper: Cleans raw employee records fetched from initial hydration,
 * filtering out test mock fixture IDs ('emp-1'..'emp-5').
 */
export function filterCleanEmployees<T extends { id?: string; employeeCode?: string }>(emps: T[]): T[] {
  if (!Array.isArray(emps)) return [];
  const testIds = new Set(['emp-1', 'emp-2', 'emp-3', 'emp-4', 'emp-5']);
  const testCodes = new Set(['EMP-001', 'EMP-002', 'EMP-003', 'EMP-004', 'EMP-005']);

  return emps.filter((e) => e && (!e.id || !testIds.has(e.id)) && (!e.employeeCode || !testCodes.has(e.employeeCode)));
}
