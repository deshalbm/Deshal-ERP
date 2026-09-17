/**
 * DESHAL ERP - KIOSK SECURITY & PIN CRYPTOGRAPHY ENGINE
 * 
 * Provides SHA-256 salted PIN hashing, verification, failed attempt rate-limiting,
 * and security lockout controls without exposing plain-text PINs.
 * Storage layer & delegation to domain layer rules.
 */

import { Employee, EmployeePinRecord, KioskDevice } from "../types";
import {
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MS,
  sha256Hex,
  simpleSha256Fallback,
  generateSalt,
  hashPin,
  verifyMasterExitPin,
  setDeviceSecretPin,
  verifyDeviceSecretPin,
  checkLockoutStatus,
  calculateNextLockout
} from "../domain/kiosk/kioskSecurity";

export {
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MS,
  sha256Hex,
  simpleSha256Fallback,
  generateSalt,
  hashPin,
  verifyMasterExitPin,
  setDeviceSecretPin,
  verifyDeviceSecretPin,
  checkLockoutStatus,
  calculateNextLockout
};

const PIN_STORAGE_KEY = "deshal_kiosk_employee_pins_v1";
const FAILED_ATTEMPTS_STORAGE_KEY = "deshal_kiosk_failed_attempts_v1";

/**
 * Load all employee PIN records
 */
export function loadEmployeePins(): Record<string, EmployeePinRecord> {
  try {
    const raw = localStorage.getItem(PIN_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load employee PINs:", e);
  }
  return {};
}

/**
 * Save employee PIN records to localStorage
 */
export function saveEmployeePins(pins: Record<string, EmployeePinRecord>): void {
  try {
    localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(pins));
  } catch (e) {
    console.error("Failed to save employee PINs:", e);
  }
}

/**
 * Initialize registered PINs for employees with explicit pinCode assigned
 */
export async function initializeDefaultPins(employees: Employee[]): Promise<Record<string, EmployeePinRecord>> {
  const existing = loadEmployeePins();
  let updated = false;

  for (const emp of employees) {
    const empPinCode = (emp as any).pinCode;
    if (!existing[emp.id] && empPinCode) {
      const plainPin = String(empPinCode).trim();
      const salt = generateSalt(16);
      const pinHash = await hashPin(plainPin, salt);
      existing[emp.id] = {
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        employeeName: emp.fullName,
        pinHash,
        salt,
        isLocked: false,
        failedAttempts: 0,
        updatedAt: new Date().toISOString(),
        updatedBy: "SYSTEM_INITIALIZER"
      };
      updated = true;
    }
  }

  if (updated) {
    saveEmployeePins(existing);
  }
  return existing;
}

/**
 * Set or reset an employee's PIN
 */
export async function setEmployeePin(
  employeeId: string,
  employeeCode: string,
  employeeName: string,
  plainPin: string,
  updatedBy: string
): Promise<EmployeePinRecord> {
  const pins = loadEmployeePins();
  const salt = generateSalt(16);
  const pinHash = await hashPin(plainPin, salt);

  const record: EmployeePinRecord = {
    employeeId,
    employeeCode,
    employeeName,
    pinHash,
    salt,
    isLocked: false,
    failedAttempts: 0,
    updatedAt: new Date().toISOString(),
    updatedBy
  };

  pins[employeeId] = record;
  saveEmployeePins(pins);
  return record;
}

/**
 * Unlock an employee's PIN record and reset failed attempts
 */
export function unlockEmployeePin(employeeId: string): boolean {
  const pins = loadEmployeePins();
  if (pins[employeeId]) {
    pins[employeeId].isLocked = false;
    pins[employeeId].failedAttempts = 0;
    pins[employeeId].lockoutUntil = undefined;
    pins[employeeId].updatedAt = new Date().toISOString();
    saveEmployeePins(pins);
    return true;
  }
  return false;
}

/**
 * Verify an entered Employee Code (الرقم الوظيفي) and match with an active employee
 * Supports full code (e.g. "EMP-001"), numeric prefix/suffix (e.g. "001" or "1"), or Civil ID / Phone.
 */
export function verifyKioskEmployeeCode(
  enteredCode: string,
  employees: Employee[]
): {
  success: boolean;
  employee?: Employee;
  errorMessage?: string;
} {
  const cleanInput = enteredCode.trim().toUpperCase();
  if (!cleanInput) {
    return {
      success: false,
      errorMessage: "يرجى إدخال الرقم الوظيفي للموظف."
    };
  }

  const activeEmployees = employees.filter((e) => e.status === "ACTIVE");

  // 1. Direct exact match on employeeCode (case-insensitive)
  let matched = activeEmployees.find(
    (e) => e.employeeCode && e.employeeCode.trim().toUpperCase() === cleanInput
  );

  // 2. Match numeric digits (e.g. input "1" or "001" matches "EMP-001")
  if (!matched) {
    const inputDigits = cleanInput.replace(/\D/g, "");
    if (inputDigits.length > 0) {
      const inputNum = parseInt(inputDigits, 10);
      matched = activeEmployees.find((e) => {
        if (!e.employeeCode) return false;
        const empDigits = e.employeeCode.replace(/\D/g, "");
        if (empDigits) {
          const empNum = parseInt(empDigits, 10);
          return empNum === inputNum;
        }
        return false;
      });
    }
  }

  // 3. Fallback match on Civil ID or Phone Number
  if (!matched) {
    matched = activeEmployees.find(
      (e) =>
        (e.civilId && e.civilId.trim() === cleanInput) ||
        (e.phone && e.phone.replace(/\D/g, "").endsWith(cleanInput.replace(/\D/g, "")))
    );
  }

  if (matched) {
    resetKioskFailedAttempts();
    return {
      success: true,
      employee: matched
    };
  }

  return {
    success: false,
    errorMessage: `الرقم الوظيفي (${cleanInput}) غير مسجل أو الموظف غير نشط.`
  };
}

/**
 * Verify an entered Employee Code or PIN and match with an active employee
 */
export async function verifyKioskPin(
  enteredInput: string,
  employees: Employee[]
): Promise<{
  success: boolean;
  employee?: Employee;
  isLocked?: boolean;
  remainingSeconds?: number;
  errorMessage?: string;
}> {
  // Check lockout state for device/kiosk session
  const lockoutState = checkKioskLockout();
  if (lockoutState.isLocked) {
    return {
      success: false,
      isLocked: true,
      remainingSeconds: lockoutState.remainingSeconds,
      errorMessage: `تم قفل لوحة المفاتيح مؤقتاً بسبب تكرار المحاولات الخاطئة. يرجى الانتظار ${lockoutState.remainingSeconds} ثانية.`
    };
  }

  // 1. Try matching by Employee Code first
  const codeResult = verifyKioskEmployeeCode(enteredInput, employees);
  if (codeResult.success && codeResult.employee) {
    return codeResult;
  }

  // 2. Try PIN hash matching for backward compatibility
  const pins = loadEmployeePins();
  const activeEmployees = employees.filter((e) => e.status === "ACTIVE");

  for (const emp of activeEmployees) {
    const pinRecord = pins[emp.id];
    if (pinRecord && !pinRecord.isLocked) {
      const computedHash = await hashPin(enteredInput, pinRecord.salt);
      if (computedHash === pinRecord.pinHash) {
        resetKioskFailedAttempts();
        return {
          success: true,
          employee: emp
        };
      }
    }
  }

  // No match found -> Record failed attempt
  const attempts = recordKioskFailedAttempt();
  if (attempts >= MAX_FAILED_ATTEMPTS) {
    return {
      success: false,
      isLocked: true,
      remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
      errorMessage: `تم تجاوز الحد الأقصى للمحاولات الخاطئة (${MAX_FAILED_ATTEMPTS}). تم قفل الكشك لمدة 60 ثانية لحماية الأمان.`
    };
  }

  const remaining = MAX_FAILED_ATTEMPTS - attempts;
  return {
    success: false,
    errorMessage: `الرقم الوظيفي أو الرمز غير صحيح. يتبقى لديك ${remaining} محاولات قبل القفل المؤقت.`
  };
}

export interface PrivilegedPinVerificationResult {
  success: boolean;
  employee?: Employee;
  adminName?: string;
  errorMessage?: string;
}

/**
 * Dynamically verifies an entered PIN against active employees for privileged actions
 * (Exiting Kiosk mode, POS discount overrides, high-value voucher approvals, admin overrides).
 * Authorization is granted if:
 * 1. Entered PIN matches an active employee's registered PIN (loadEmployeePins() or emp.pinCode).
 * 2. Employee holds Admin/Manager role or explicit permissions (employee_pin_mgmt, attendance_settings, ADMIN_PANEL, FULL_ACCESS).
 */
export async function verifyPrivilegedEmployeePin(
  pin: string,
  employees: Employee[],
  requiredPermissions?: string[]
): Promise<PrivilegedPinVerificationResult> {
  const cleanPin = pin.trim();
  if (!cleanPin) {
    return {
      success: false,
      errorMessage: "يرجى إدخال رمز PIN للمتابعة."
    };
  }

  const activeEmployees = employees.filter((e) => e.status !== "INACTIVE");
  const pinRecords = loadEmployeePins();

  for (const emp of activeEmployees) {
    let pinMatched = false;

    // Check stored pin record in localStorage
    const rec = pinRecords[emp.id];
    if (rec && !rec.isLocked) {
      const hash = await hashPin(cleanPin, rec.salt);
      if (hash === rec.pinHash) {
        pinMatched = true;
      }
    }

    // Check direct employee pin code property if available
    const empDirectPin = (emp as any).pinCode;
    if (!pinMatched && empDirectPin && String(empDirectPin).trim() === cleanPin) {
      pinMatched = true;
    }

    if (pinMatched) {
      const isManagerOrAdmin =
        emp.role === "ADMIN" ||
        emp.role === "MANAGER" ||
        emp.department === "الإدارة العامة" ||
        emp.department === "الإدارة العليا" ||
        (emp.jobTitle && (emp.jobTitle.includes("مدير") || emp.jobTitle.toLowerCase().includes("manager")));

      const hasRequiredPermission =
        emp.permissions?.includes("employee_pin_mgmt" as any) ||
        emp.permissions?.includes("attendance_settings" as any) ||
        emp.permissions?.includes("ADMIN_PANEL" as any) ||
        emp.permissions?.includes("FULL_ACCESS" as any) ||
        (requiredPermissions && requiredPermissions.some((perm) => emp.permissions?.includes(perm as any)));

      if (isManagerOrAdmin || hasRequiredPermission) {
        return {
          success: true,
          employee: emp,
          adminName: emp.fullName
        };
      } else {
        return {
          success: false,
          errorMessage: `الموظف (${emp.fullName}) لا يملك صلاحية الإدارة أو التجاوز المطلوب.`
        };
      }
    }
  }

  return {
    success: false,
    errorMessage: "رمز PIN غير صحيح أو غير مسجل لموظف مخول."
  };
}

/**
 * Validates Admin PIN for the hidden 7-clicks Kiosk Administration and Exit flow.
 * Checks device secret PIN (if set) and dynamic employee PIN verification against active Admin/Manager profiles.
 */
export async function verifyAdminExitPin(
  pin: string,
  employees: Employee[],
  currentDevice?: KioskDevice
): Promise<{
  success: boolean;
  adminName?: string;
  errorMessage?: string;
  isLocked?: boolean;
  remainingSeconds?: number;
}> {
  // Check lockout
  const lockout = checkKioskLockout();
  if (lockout.isLocked) {
    return {
      success: false,
      isLocked: true,
      remainingSeconds: lockout.remainingSeconds,
      errorMessage: `⚠️ تم حظر محاولات الدخول مؤقتاً بسبب تكرار إدخال رمز خاطئ. يرجى الانتظار ${lockout.remainingSeconds} ثانية.`
    };
  }

  // Check current device specific secret PIN if present
  if (currentDevice) {
    const isDevicePinValid = await verifyDeviceSecretPin(currentDevice, pin);
    if (isDevicePinValid) {
      resetKioskFailedAttempts();
      return {
        success: true,
        adminName: `رمز الجهاز الخاص (${currentDevice.name})`
      };
    }
  }

  // Perform dynamic employee PIN verification
  const empResult = await verifyPrivilegedEmployeePin(pin, employees);
  if (empResult.success) {
    resetKioskFailedAttempts();
    return {
      success: true,
      adminName: empResult.adminName
    };
  }

  // If wrong, record failed attempt
  const attempts = recordKioskFailedAttempt();
  if (attempts >= MAX_FAILED_ATTEMPTS) {
    return {
      success: false,
      isLocked: true,
      remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
      errorMessage: `❌ رمز المسؤول غير صحيح. تم تجاوز الحد الأقصى للمحاولات (${MAX_FAILED_ATTEMPTS}). تم إيقاف المحاولات لمدة 60 ثانية.`
    };
  }

  const remaining = MAX_FAILED_ATTEMPTS - attempts;
  return {
    success: false,
    errorMessage: empResult.errorMessage
      ? `❌ ${empResult.errorMessage} (يتبقى لديك ${remaining} محاولات).`
      : `❌ رمز المسؤول غير صحيح. يتبقى لديك ${remaining} محاولات قبل الحظر المؤقت.`
  };
}

// ----------------------------------------------------
// FAILED ATTEMPT & RATE LIMITING HELPERS (STORAGE)
// ----------------------------------------------------

interface KioskLockoutData {
  failedAttempts: number;
  lockoutUntil: number; // timestamp ms
}

function getLockoutData(): KioskLockoutData {
  try {
    const raw = localStorage.getItem(FAILED_ATTEMPTS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // ignore
  }
  return { failedAttempts: 0, lockoutUntil: 0 };
}

function saveLockoutData(data: KioskLockoutData): void {
  try {
    localStorage.setItem(FAILED_ATTEMPTS_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // ignore
  }
}

export function checkKioskLockout(): { isLocked: boolean; remainingSeconds: number } {
  const data = getLockoutData();
  return checkLockoutStatus(data.lockoutUntil);
}

export function recordKioskFailedAttempt(): number {
  const data = getLockoutData();
  const next = calculateNextLockout(data.failedAttempts);
  data.failedAttempts = next.newFailedAttempts;
  if (next.lockoutUntil > 0) {
    data.lockoutUntil = next.lockoutUntil;
  }
  saveLockoutData(data);
  return data.failedAttempts;
}

export function resetKioskFailedAttempts(): void {
  saveLockoutData({ failedAttempts: 0, lockoutUntil: 0 });
}
