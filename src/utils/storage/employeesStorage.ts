import {
  Employee,
  EmployeeRole,
  EmployeePermission,
  AttendanceRecord,
  PayrollSlip,
  LeaveRequest
} from "../../types";
import { ensureValidUuid } from "../uuid";

const EMPLOYEES_STORAGE_KEY = "rv_studio_employees_list";
const ACTIVE_EMPLOYEE_STORAGE_KEY = "rv_studio_active_employee_id";
const ATTENDANCE_STORAGE_KEY = "deshal_hr_attendance_records";
const PAYROLL_SLIPS_STORAGE_KEY = "deshal_hr_payroll_slips";
const LEAVE_REQUESTS_STORAGE_KEY = "deshal_hr_leave_requests";

export {
  ROLE_DEFAULT_PERMISSIONS,
  PERMISSION_CONFIG
} from "../../domain/hr/employeePermissions";

export const DEFAULT_EMPLOYEES: Employee[] = [];

export function loadEmployees(): Employee[] {
  try {
    const raw = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter(
          (e: any) =>
            e &&
            !['emp-1', 'emp-2', 'emp-3', 'emp-4', 'emp-5'].includes(e.id) &&
            !['EMP-001', 'EMP-002', 'EMP-003', 'EMP-004', 'EMP-005'].includes(e.employeeCode)
        );
        if (filtered.length !== parsed.length) {
          saveEmployees(filtered);
        }
        return filtered;
      }
    }
  } catch (e) {
    console.warn("Failed to load employees from localStorage:", e);
  }
  return [];
}

export function saveEmployees(employees: Employee[]): void {
  try {
    localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(employees));
  } catch (e) {
    console.error("Failed to save employees:", e);
  }
}

export function loadActiveEmployeeId(): string {
  try {
    const saved = localStorage.getItem(ACTIVE_EMPLOYEE_STORAGE_KEY);
    if (saved) return saved;
  } catch (e) {
    console.warn("Failed to load active employee ID:", e);
  }
  return ensureValidUuid("emp-1");
}

export function saveActiveEmployeeId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_EMPLOYEE_STORAGE_KEY, id);
  } catch (e) {
    console.error("Failed to save active employee ID:", e);
  }
}

export const DEFAULT_ATTENDANCE_RECORDS: AttendanceRecord[] = [];
export const DEFAULT_PAYROLL_SLIPS: PayrollSlip[] = [];
export const DEFAULT_LEAVE_REQUESTS: LeaveRequest[] = [];

export function loadAttendanceRecords(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn("Failed to load attendance records:", e);
  }
  return [];
}

export function saveAttendanceRecords(records: AttendanceRecord[]): void {
  try {
    localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error("Failed to save attendance records:", e);
  }
}

export function loadPayrollSlips(): PayrollSlip[] {
  try {
    const raw = localStorage.getItem(PAYROLL_SLIPS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn("Failed to load payroll slips:", e);
  }
  return [];
}

export function savePayrollSlips(slips: PayrollSlip[]): void {
  try {
    localStorage.setItem(PAYROLL_SLIPS_STORAGE_KEY, JSON.stringify(slips));
  } catch (e) {
    console.error("Failed to save payroll slips:", e);
  }
}

export function loadLeaveRequests(): LeaveRequest[] {
  try {
    const raw = localStorage.getItem(LEAVE_REQUESTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn("Failed to load leave requests:", e);
  }
  return [];
}

export function saveLeaveRequests(requests: LeaveRequest[]): void {
  try {
    localStorage.setItem(LEAVE_REQUESTS_STORAGE_KEY, JSON.stringify(requests));
  } catch (e) {
    console.error("Failed to save leave requests:", e);
  }
}
