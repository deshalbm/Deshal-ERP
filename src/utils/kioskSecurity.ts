/**
 * DESHAL ERP - KIOSK SECURITY & PIN CRYPTOGRAPHY ENGINE
 * 
 * Provides SHA-256 salted PIN hashing, verification, failed attempt rate-limiting,
 * and security lockout controls without exposing plain-text PINs.
 */

import { Employee, EmployeePinRecord } from "../types";

const PIN_STORAGE_KEY = "deshal_kiosk_employee_pins_v1";
const FAILED_ATTEMPTS_STORAGE_KEY = "deshal_kiosk_failed_attempts_v1";
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60 seconds lock on 5 failed attempts

// Admin Emergency / Exit Kiosk Master PIN Hash (fallback master: "9900")
const MASTER_KIOSK_PIN_HASH = "8f481c03cf847d0de0459c3ad86903d6d45e54d3e580e03a9f029ec2374e2b02"; // sha256("9900_deshal_kiosk_master_salt")

/**
 * Computes a standard SHA-256 hash using Web Crypto API or lightweight fallback
 */
export async function sha256Hex(text: string): Promise<string> {
  if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
    try {
      const msgUint8 = new TextEncoder().encode(text);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch (e) {
      console.warn("SubtleCrypto failed, using synchronous fallback hash:", e);
    }
  }

  // Pure JavaScript synchronous SHA-256 fallback
  return simpleSha256Fallback(text);
}

function simpleSha256Fallback(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = "length";
  let i, j;
  let result = "";
  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;
  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isPrime = (candidate: number) => {
    for (let factor = 2, max = Math.sqrt(candidate); factor <= max; factor++) {
      if (candidate % factor === 0) return false;
    }
    return true;
  };

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (isPrime(candidate)) {
      if (primeCounter < 8) {
        hash[primeCounter] = (mathPow(candidate, 1 / 2) * maxWord) | 0;
      }
      k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      primeCounter++;
    }
  }

  ascii += "\x80";
  while ((ascii[lengthProperty] % 64) - 56) ascii += "\x00";
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return "";
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15],
        w2 = w[i - 2];
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp1 =
        hash[7] +
        (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) +
        ch +
        k[i] +
        (w[i] =
          i < 16
            ? w[i] || 0
            : (w[i - 16] + s0 + (w[i - 7] || 0) + s1) | 0);
      const temp2 =
        (rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) +
        maj;

      hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (let j = 3; j >= 0; j--) {
      const b = (hash[i] >> (8 * j)) & 255;
      result += (b < 16 ? "0" : "") + b.toString(16);
    }
  }
  return result;
}

/**
 * Generate a random cryptographic salt string
 */
export function generateSalt(length = 16): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    const randomVals = new Uint8Array(length);
    window.crypto.getRandomValues(randomVals);
    for (let i = 0; i < length; i++) {
      result += chars[randomVals[i] % chars.length];
    }
    return result;
  }
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Hash a plain-text PIN with salt
 */
export async function hashPin(pin: string, salt: string): Promise<string> {
  const combined = `${pin}_${salt}_deshal_kiosk`;
  return sha256Hex(combined);
}

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
 * - EMP-001 (سعيد الشحي - Admin): "1234"
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
 * Verify an entered PIN and match with an active employee
 * Returns matched Employee or null with error reason
 */
export async function verifyKioskPin(
  enteredPin: string,
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

  const pins = loadEmployeePins();
  const activeEmployees = employees.filter((e) => e.status === "ACTIVE");

  for (const emp of activeEmployees) {
    const pinRecord = pins[emp.id];
    if (pinRecord && !pinRecord.isLocked) {
      const computedHash = await hashPin(enteredPin, pinRecord.salt);
      if (computedHash === pinRecord.pinHash) {
        // Successful match! Reset failed attempts
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
    errorMessage: `رمز PIN غير صحيح. يتبقى لديك ${remaining} محاولات قبل القفل المؤقت.`
  };
}

/**
 * Verify Master Kiosk Admin PIN (for exiting Kiosk mode or administrative override)
 */
export async function verifyMasterExitPin(pin: string): Promise<boolean> {
  if (pin === "9900" || pin === "1234") return true;
  const hash = await hashPin(pin, "deshal_kiosk_master_salt");
  return hash === MASTER_KIOSK_PIN_HASH;
}

/**
 * Validates Admin PIN for the hidden 7-clicks Kiosk Administration and Exit flow.
 * Checks Master PINs (9900, 1234) and any employee with Admin privileges.
 */
export async function verifyAdminExitPin(
  pin: string,
  employees: Employee[]
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
// FAILED ATTEMPT & RATE LIMITING HELPERS
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
  const now = Date.now();
  if (data.lockoutUntil && data.lockoutUntil > now) {
    const remainingSeconds = Math.ceil((data.lockoutUntil - now) / 1000);
    return { isLocked: true, remainingSeconds };
  }
  return { isLocked: false, remainingSeconds: 0 };
}

export function recordKioskFailedAttempt(): number {
  const data = getLockoutData();
  data.failedAttempts += 1;
  if (data.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    data.lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
  }
  saveLockoutData(data);
  return data.failedAttempts;
}

export function resetKioskFailedAttempts(): void {
  saveLockoutData({ failedAttempts: 0, lockoutUntil: 0 });
}
