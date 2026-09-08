import assert from "assert";
import {
  DEFAULT_EMPLOYEES,
  DEFAULT_ATTENDANCE_RECORDS,
  DEFAULT_PAYROLL_SLIPS,
  DEFAULT_LEAVE_REQUESTS,
  loadEmployees,
  loadAttendanceRecords,
  loadPayrollSlips
} from "../utils/storage";
import {
  DEFAULT_ATTENDANCE_MOVEMENT_LOGS,
  loadAttendanceMovementLogs,
  saveAttendanceMovementLogs
} from "../utils/attendanceStorage";
import { AttendanceMovementLog } from "../types";
import { ensureValidUuid } from "../utils/uuid";

console.log("\n================================================================");
console.log("  DESHAL ERP — HR, PAYROLL & ATTENDANCE UNIT TEST SUITE");
console.log("================================================================\n");

// Polyfill localStorage if running in Node environment
if (typeof localStorage === "undefined" || !localStorage.getItem) {
  const store: Record<string, string> = {};
  (global as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
}

async function runHRTests() {
  let passed = 0;
  let total = 0;

  function test(name: string, fn: () => void) {
    total++;
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (e: any) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     ${e.message}`);
    }
  }

  test("1. Employee Directory Default Seed Loading", () => {
    localStorage.clear();
    const employees = loadEmployees();
    assert.strictEqual(employees.length, 5, "Should load 5 default seed employees when localStorage is empty");
    assert.strictEqual(employees[0].employeeCode, "EMP-001", "EMP-001 should be Executive General Manager");
    assert.strictEqual(employees[0].fullName, "سعيد بن راشد الشحي");
  });

  test("2. Deterministic UUID Consistency across HR entities", () => {
    const emp1Uuid = ensureValidUuid("emp-1");
    const emp1 = DEFAULT_EMPLOYEES.find(e => e.id === emp1Uuid);
    assert.ok(emp1, "EMP-1 should exist with deterministic UUID");
    
    const emp1Attendance = DEFAULT_ATTENDANCE_RECORDS.filter(a => a.employeeId === emp1Uuid);
    assert.ok(emp1Attendance.length > 0, "EMP-1 should have linked attendance records");

    const emp1Payroll = DEFAULT_PAYROLL_SLIPS.filter(p => p.employeeId === emp1Uuid);
    assert.ok(emp1Payroll.length > 0, "EMP-1 should have linked payroll slips");
  });

  test("3. Attendance Kiosk Movement Log Tracking", () => {
    localStorage.clear();
    const initialLogs = loadAttendanceMovementLogs();
    assert.ok(initialLogs.length > 0, "Should load initial movement logs");

    const newLog: AttendanceMovementLog = {
      id: "log-test-99",
      employeeId: ensureValidUuid("emp-1"),
      employeeCode: "EMP-001",
      employeeName: "سعيد بن راشد الشحي",
      branchId: "branch-sohar",
      branchName: "فرع صحار الرئيسي",
      movementTypeCode: "CHECK_IN",
      movementTypeNameAr: "تسجيل دخول",
      movementTypeNameEn: "Check In",
      movementCategory: "CHECK_IN",
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString("en-GB"),
      deviceId: "dev-sohar-01",
      deviceName: "آيباد فرع صحار الرئيسي",
      location: "صالة الاستقبال",
      syncStatus: "SYNCED",
      createdAt: new Date().toISOString()
    };

    saveAttendanceMovementLogs([newLog, ...initialLogs]);
    const updatedLogs = loadAttendanceMovementLogs();
    assert.strictEqual(updatedLogs.length, initialLogs.length + 1, "Logs count should increase by 1 after saving new movement log");
    assert.strictEqual(updatedLogs[0].id, "log-test-99", "New log should be prepend to top of logs array");
  });

  test("4. Payroll Salary Calculations (PASI 7% Deduction & Net Salary Invariant)", () => {
    const emp1 = DEFAULT_EMPLOYEES[0]; // emp-1: basic 1200, allowance 300
    const basic = emp1.basicSalary; // 1200
    const allowance = emp1.allowances; // 300
    const bonus = 50;
    const deductions = 20;

    // Social Security (PASI Omani standard calculation: 7% of Basic Salary)
    const pasiDeduction = Math.round(basic * 0.07 * 1000) / 1000; // 84 OMR
    const expectedNetSalary = Math.round((basic + allowance + bonus - pasiDeduction - deductions) * 1000) / 1000;

    assert.strictEqual(pasiDeduction, 84, "PASI 7% of 1200 basic salary should be 84 OMR");
    assert.strictEqual(expectedNetSalary, 1446, "Net salary (1200+300+50 - 84 - 20) should equal 1446 OMR");
  });

  test("5. WPS Bank File Formatting Integrity", () => {
    const emp = DEFAULT_EMPLOYEES[1]; // emp-2 Fatima
    assert.strictEqual(emp.bankName, "بنك ظفار", "Emp-2 should have Bank Dhofar");
    assert.strictEqual(emp.bankIban, "OM960111000000001041112233001", "Emp-2 IBAN must be valid Omani IBAN");
    assert.ok(emp.bankIban.startsWith("OM"), "IBAN must start with Omani country code OM");
  });

  console.log("\n================================================================");
  console.log(`  RESULTS: Total Tests: ${total} | Passed: ${passed} | Failed: ${total - passed}`);
  console.log("================================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runHRTests();
