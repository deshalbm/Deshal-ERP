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
  MASTER_KIOSK_PIN_HASH,
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
  MASTER_KIOSK_PIN_HASH,
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
 * Initialize default seeded PINs for initial demo employees if not present
 * Seed PINs:
 * - EMP-001 (مدير النظام - Admin): "1234"
 * - EMP-002 (فاطمة البلوشي - Accountant): "2233"
 * - EMP-003 (أحمد المعمري - Storekeeper): "3344"
 * - EMP-004 (محمد الكندي - Sales): "4455"
 * - EMP-005 (مريم المقبالي - Reception): "5566"
 */
export async function initializeDefaultPins(employees: Employee[]): Promise<Record<string, EmployeePinRecord>> {
  const existing = loadEmployeePins();
  let updated = false;

  const defaultPinMap: Record<string, string> = {
    "emp-1": "1234",
    "emp-2": "2233",
    "emp-3": "3344",
    "emp-4": "4455",
    "emp-5": "5566"
  };

  for (const emp of employees) {
    if (!existing[emp.id]) {
      const plainPin = defaultPinMap[emp.id] || "1234";
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

/**
 * Validates Admin PIN for the hidden 7-clicks Kiosk Administration and Exit flow.
 * Checks Master PINs (9900, 1234), device secret PIN, and any employee with Admin privileges.
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

  // Check master PINs first
  const isMaster = await verifyMasterExitPin(pin);
  if (isMaster) {
    resetKioskFailedAttempts();
    return {
      success: true,
      adminName: "مدير النظام العام (Master Admin)"
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

  // Check if PIN matches any administrator employee
  const pinRecords = loadEmployeePins();
  for (const emp of employees) {
    const isEmpAdmin =
      emp.role === "ADMIN" ||
      emp.department === "الإدارة العامة" ||
      emp.department === "الإدارة العليا" ||
      emp.jobTitle.includes("مدير") ||
      emp.permissions?.includes("ADMIN_PANEL" as any) ||
      emp.permissions?.includes("FULL_ACCESS" as any);

    if (isEmpAdmin) {
      const rec = pinRecords[emp.id];
      if (rec) {
        const hash = await hashPin(pin, rec.salt);
        if (hash === rec.pinHash) {
          resetKioskFailedAttempts();
          return {
            success: true,
            adminName: emp.fullName
          };
        }
      } else if (emp.employeeCode === "EMP-001" && (pin === "1234" || pin === "9900")) {
        resetKioskFailedAttempts();
        return {
          success: true,
          adminName: emp.fullName
        };
      }
    }
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
    errorMessage: `❌ رمز المسؤول غير صحيح. يتبقى لديك ${remaining} محاولات قبل الحظر المؤقت.`
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
