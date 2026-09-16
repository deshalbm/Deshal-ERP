import { recordKioskAttendance } from "../application/hr/recordKioskAttendance";
import { AttendanceMovementLog, AttendanceRecord, Employee } from "../types";

console.log("\n================================================================");
console.log("  DESHAL ERP — RECORD KIOSK ATTENDANCE USE CASE UNIT TEST SUITE");
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

const sampleEmployee: Employee = {
  id: "emp-101",
  employeeCode: "EMP-101-CODE",
  fullName: "أحمد بن سعيد المعمري",
  jobTitle: "مهندس صيانة",
  department: "التقنية",
  email: "ahmed@deshalbm.com",
  phone: "96891234567",
  role: "STAFF" as any,
  branchId: "branch-sohar",
  status: "ACTIVE",
  hireDate: "2024-01-01",
  basicSalary: 500,
  allowances: 100,
  currency: "OMR",
  permissions: [],
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

const sampleMovementLogCheckIn: AttendanceMovementLog = {
  id: "mov-log-001",
  employeeId: "emp-101",
  employeeCode: "EMP-101-CODE",
  employeeName: "أحمد بن سعيد المعمري",
  department: "التقنية",
  jobTitle: "مهندس صيانة",
  branchId: "branch-sohar",
  branchName: "فرع صحار",
  movementTypeCode: "CHECK_IN",
  movementTypeNameAr: "تسجيل حضور",
  movementTypeNameEn: "Clock In",
  movementCategory: "CHECK_IN",
  timestamp: "2026-09-09T08:00:00Z",
  date: "2026-09-09",
  time: "08:00",
  deviceId: "dev-sohar-01",
  deviceName: "كشك صحار الرئيسي",
  syncStatus: "SYNCED",
  createdAt: "2026-09-09T08:00:00Z",
};

// Test 1: CHECK_IN with no existing attendance record
console.log("[Test 1] CHECK_IN with no existing attendance record");
const res1 = recordKioskAttendance({
  log: sampleMovementLogCheckIn,
  movementLogs: [],
  attendanceList: [],
  employeesList: [sampleEmployee],
});
assert(res1.updatedMovementLogs.length === 1, "Prepends movement log to list");
assert(res1.updatedAttendance.length === 1, "Creates 1 new attendance record");
assert(res1.newAttendanceRecordCreated !== undefined, "newAttendanceRecordCreated is defined");
assert(res1.newAttendanceRecordCreated?.checkIn === "08:00", "Check-in time set to 08:00");
assert(res1.newAttendanceRecordCreated?.status === "PRESENT", "Status is set to PRESENT");
assert(res1.newAttendanceRecordCreated?.workingHours === 8, "Working hours set to 8");

// Test 2: CHECK_OUT with no existing attendance record
console.log("\n[Test 2] CHECK_OUT with no existing attendance record");
const logCheckOut: AttendanceMovementLog = {
  ...sampleMovementLogCheckIn,
  id: "mov-log-002",
  movementCategory: "CHECK_OUT",
  time: "17:00",
};
const res2 = recordKioskAttendance({
  log: logCheckOut,
  movementLogs: [],
  attendanceList: [],
  employeesList: [sampleEmployee],
});
assert(res2.updatedAttendance.length === 1, "Creates 1 new attendance record for check-out");
assert(res2.newAttendanceRecordCreated?.checkIn === "08:00", "Defaults missing check-in to 08:00");
assert(res2.newAttendanceRecordCreated?.checkOut === "17:00", "Sets check-out time to 17:00");

// Test 3: CHECK_IN with existing attendance record
console.log("\n[Test 3] CHECK_IN with existing attendance record");
const existingRec: AttendanceRecord = {
  id: "att-existing-1",
  employeeId: "emp-101",
  employeeCode: "EMP-101-CODE",
  employeeName: "أحمد بن سعيد المعمري",
  date: "2026-09-09",
  checkIn: "08:15",
  status: "ABSENT",
  workingHours: 8,
  overtimeHours: 0,
  lateMinutes: 15,
};
const res3 = recordKioskAttendance({
  log: sampleMovementLogCheckIn,
  movementLogs: [],
  attendanceList: [existingRec],
  employeesList: [sampleEmployee],
});
assert(res3.updatedAttendanceRecord !== undefined, "updatedAttendanceRecord is returned");
assert(res3.updatedAttendanceRecord?.checkIn === "08:00", "Updates check-in time to 08:00");
assert(res3.updatedAttendanceRecord?.status === "PRESENT", "Updates status to PRESENT");

// Test 4: CHECK_OUT with existing attendance record
console.log("\n[Test 4] CHECK_OUT with existing attendance record");
const logCheckOutExisting: AttendanceMovementLog = {
  ...sampleMovementLogCheckIn,
  id: "mov-log-003",
  movementCategory: "CHECK_OUT",
  time: "17:30",
};
const res4 = recordKioskAttendance({
  log: logCheckOutExisting,
  movementLogs: [],
  attendanceList: [existingRec],
  employeesList: [sampleEmployee],
});
assert(res4.updatedAttendanceRecord?.checkIn === "08:15", "Preserves existing check-in time");
assert(res4.updatedAttendanceRecord?.checkOut === "17:30", "Sets check-out time to 17:30");

// Test 5: Employee fallback behavior
console.log("\n[Test 5] Employee fallback behavior when not in employeesList");
const logUnknownEmp: AttendanceMovementLog = {
  ...sampleMovementLogCheckIn,
  employeeId: "emp-unknown",
  employeeCode: "",
  employeeName: "موظف مجهول",
};
const res5 = recordKioskAttendance({
  log: logUnknownEmp,
  movementLogs: [],
  attendanceList: [],
  employeesList: [],
});
assert(res5.newAttendanceRecordCreated?.employeeCode === "EMP-001", "Defaults missing employeeCode to EMP-001");

// Test 7: Streamlined Action Selection (e.g. BREAK_OUT, BREAK_IN, EMERGENCY_OUT)
console.log("\n[Test 7] Streamlined Action Selection (e.g. BREAK_OUT, BREAK_IN)");
const breakLog: AttendanceMovementLog = {
  ...sampleMovementLogCheckIn,
  id: "mov-log-007",
  movementCategory: "BREAK_OUT",
  movementTypeNameAr: "استراحة خروج",
  movementTypeNameEn: "Break Out",
  time: "12:30",
};
const res7 = recordKioskAttendance({
  log: breakLog,
  movementLogs: [],
  attendanceList: [],
  employeesList: [sampleEmployee],
});
assert(res7.updatedMovementLogs.length === 1, "Break movement log recorded successfully");
assert(res7.updatedMovementLogs[0].movementCategory === "BREAK_OUT", "Correctly records BREAK_OUT action");

// Final Summary Output
console.log("\n================================================================");
console.log(`  RESULTS: Total Tests: ${totalCount} | Passed: ${passedCount} | Failed: ${totalCount - passedCount}`);
console.log("================================================================\n");
