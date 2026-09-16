import { saveKioskAttendance, DEFAULT_COMPANY_ID } from "../application/hr/saveKioskAttendance";
import { defaultKioskAttendanceStorageAdapter } from "../lib/adapters/kioskAttendanceAdapter";
import { AttendanceMovementLog, AttendanceRecord, Employee } from "../types";
import {
  saveEmployees,
  saveAttendanceRecords,
  loadAttendanceRecords,
} from "../utils/storage";
import {
  saveAttendanceMovementLogs,
  loadAttendanceMovementLogs,
} from "../utils/attendanceStorage";

console.log("\n================================================================");
console.log("  DESHAL ERP — SAVE KIOSK ATTENDANCE SERVICE UNIT TEST SUITE");
console.log("================================================================\n");

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, message: string) {
  totalCount++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

// 1. Mock LocalStorage in Node environment if absent
if (typeof globalThis.localStorage === "undefined") {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = String(val); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  };
}

const sampleEmployee: Employee = {
  id: "emp-201",
  employeeCode: "EMP-201",
  fullName: "سارة بنت عبدالله الرئيسي",
  jobTitle: "محلل بيانات",
  department: "الموارد البشرية",
  email: "sara@deshalbm.com",
  phone: "96892223344",
  role: "STAFF" as any,
  branchId: "branch-muscat",
  status: "ACTIVE",
  hireDate: "2024-02-01",
  basicSalary: 600,
  allowances: 150,
  currency: "OMR",
  permissions: [],
  createdAt: "2024-02-01T00:00:00Z",
  updatedAt: "2024-02-01T00:00:00Z",
};

const sampleMovementLogCheckIn: AttendanceMovementLog = {
  id: "mov-log-201",
  employeeId: "emp-201",
  employeeCode: "EMP-201",
  employeeName: "سارة بنت عبدالله الرئيسي",
  department: "الموارد البشرية",
  jobTitle: "محلل بيانات",
  branchId: "branch-muscat",
  branchName: "فرع مسقط",
  movementTypeCode: "CHECK_IN",
  movementTypeNameAr: "تسجيل حضور",
  movementTypeNameEn: "Clock In",
  movementCategory: "CHECK_IN",
  timestamp: "2026-09-10T08:15:00Z",
  date: "2026-09-10",
  time: "08:15",
  deviceId: "dev-muscat-01",
  deviceName: "كشك مسقط الرئيسي",
  syncStatus: "SYNCED",
  createdAt: "2026-09-10T08:15:00Z",
};

// Seed initial storage
saveEmployees([sampleEmployee]);
saveAttendanceMovementLogs([]);
saveAttendanceRecords([]);

// TEST 1: Save Kiosk Attendance CHECK_IN
console.log("--- TEST 1: Save Kiosk Attendance CHECK_IN ---");
const result1 = saveKioskAttendance(sampleMovementLogCheckIn, { storageAdapter: defaultKioskAttendanceStorageAdapter });

assert(result1.updatedMovementLogs.length === 1, "Movement log appended successfully");
assert(result1.updatedMovementLogs[0].id === "mov-log-201", "Movement log ID matches");
assert(result1.updatedAttendance.length === 1, "New daily attendance record created");
assert(result1.updatedAttendance[0].employeeId === "emp-201", "Attendance record employeeId matches");
assert(result1.updatedAttendance[0].checkIn === "08:15", "Attendance record checkIn time recorded as 08:15");

// Check persistence
const persistedLogs = loadAttendanceMovementLogs();
const persistedAtt = loadAttendanceRecords();
assert(persistedLogs.length === 1, "Movement log saved to localStorage");
assert(persistedAtt.length === 1, "Attendance record saved to localStorage");

// TEST 2: Save Kiosk Attendance CHECK_OUT for existing record
console.log("\n--- TEST 2: Save Kiosk Attendance CHECK_OUT ---");
const sampleMovementLogCheckOut: AttendanceMovementLog = {
  ...sampleMovementLogCheckIn,
  id: "mov-log-202",
  movementTypeCode: "CHECK_OUT",
  movementTypeNameAr: "تسجيل انصراف",
  movementTypeNameEn: "Clock Out",
  movementCategory: "CHECK_OUT",
  timestamp: "2026-09-10T17:00:00Z",
  time: "17:00",
};

const result2 = saveKioskAttendance(sampleMovementLogCheckOut, { companyId: "test-comp-123", storageAdapter: defaultKioskAttendanceStorageAdapter });

assert(result2.updatedMovementLogs.length === 2, "Second movement log prepended successfully");
assert(result2.updatedAttendance.length === 1, "Attendance list length remains 1 (updated existing record)");
assert(result2.updatedAttendance[0].checkOut === "17:00", "Attendance record checkOut time updated to 17:00");
assert(result2.updatedAttendance[0].checkIn === "08:15", "Attendance record checkIn time preserved as 08:15");

// TEST 3: Default Company ID constant
console.log("\n--- TEST 3: Default Company ID Constant ---");
assert(DEFAULT_COMPANY_ID === "00000000-0000-0000-0000-000000000001", "DEFAULT_COMPANY_ID is expected standard GUID");

// SUMMARY
console.log(`\n========================================================`);
console.log(`  SUITE COMPLETE: ${passedCount}/${totalCount} TESTS PASSED`);
console.log(`========================================================\n`);

if (passedCount !== totalCount) {
  process.exit(1);
}
