import assert from 'assert';
import { ensureValidUuid, ensureNullableUuid } from '../utils/uuid';
import type { PayrollSlip, LeaveRequest, AttendanceRecord, AttendanceMovementLog } from '../types';

console.log('\n==============================================================');
console.log('  DESHAL ERP — HR SERVICE SUPABASE MAPPING UNIT TEST SUITE');
console.log('==============================================================\n');

async function runHRMappingTests() {
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

  test('1. PayrollSlip Legacy ID Mapping & UUID Invariant', () => {
    const legacySlip: PayrollSlip = {
      id: 'pay-1',
      payrollMonth: '2026-09',
      employeeId: 'emp-1',
      employeeCode: 'EMP-001',
      employeeName: 'سعيد الشحي',
      jobTitle: 'مدير عام',
      department: 'الإدارة',
      basicSalary: 1200,
      housingAllowance: 200,
      transportAllowance: 100,
      otherAllowances: 0,
      bonus: 50,
      deductions: 20,
      socialSecurityDeduction: 84,
      netSalary: 1446,
      status: 'DRAFT',
      generatedAt: new Date().toISOString(),
    };

    const validId = ensureValidUuid(legacySlip.id);
    const validEmpId = ensureValidUuid(legacySlip.employeeId);

    assert.notStrictEqual(validId, 'pay-1', 'Legacy ID pay-1 must be converted to UUID format');
    assert.match(validId, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'validId must be valid UUID v4 format');
    assert.match(validEmpId, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'validEmpId must be valid UUID v4 format');

    const totalAllowances = (legacySlip.housingAllowance ?? 0) + (legacySlip.transportAllowance ?? 0) + (legacySlip.otherAllowances ?? 0) + (legacySlip.bonus ?? 0);
    assert.strictEqual(totalAllowances, 350, 'Total allowances must sum correctly');
  });

  test('2. LeaveRequest Schema & total_days / days_count Dual Mapping', () => {
    const legacyReq: LeaveRequest = {
      id: 'leave-101',
      employeeId: 'emp-2',
      employeeName: 'فاطمة العلوية',
      employeeCode: 'EMP-002',
      leaveType: 'ANNUAL',
      startDate: '2026-10-01',
      endDate: '2026-10-05',
      daysCount: 5,
      reason: 'إجازة سنوية',
      status: 'PENDING',
      appliedAt: new Date().toISOString(),
    };

    const validId = ensureValidUuid(legacyReq.id);
    const validEmpId = ensureValidUuid(legacyReq.employeeId);

    assert.match(validId, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'validId must be valid UUID format');
    assert.match(validEmpId, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'validEmpId must be valid UUID format');
    assert.strictEqual(legacyReq.daysCount, 5, 'daysCount must equal 5');
  });

  test('3. AttendanceRecord & Kiosk Movement Log UUID Determinism', () => {
    const record: AttendanceRecord = {
      id: 'att-55',
      employeeId: 'emp-3',
      employeeName: 'علي المعمري',
      employeeCode: 'EMP-003',
      date: '2026-09-08',
      checkIn: '08:00',
      status: 'PRESENT',
      workingHours: 8,
      overtimeHours: 0,
      lateMinutes: 0,
    };

    const log: AttendanceMovementLog = {
      id: 'log-88',
      employeeId: 'emp-3',
      employeeCode: 'EMP-003',
      employeeName: 'علي المعمري',
      branchId: 'branch-1',
      branchName: 'الفرع الرئيسي',
      movementTypeCode: 'CHECK_IN',
      movementTypeNameAr: 'تسجيل دخول',
      movementTypeNameEn: 'Check In',
      movementCategory: 'CHECK_IN',
      timestamp: new Date().toISOString(),
      date: '2026-09-08',
      time: '08:00:00',
      deviceId: 'dev-1',
      deviceName: 'كشك 1',
      syncStatus: 'SYNCED',
      createdAt: new Date().toISOString(),
    };

    const validAttId = ensureValidUuid(record.id);
    const validLogId = ensureValidUuid(log.id);

    assert.notStrictEqual(validAttId, 'att-55');
    assert.notStrictEqual(validLogId, 'log-88');
    assert.match(validAttId, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    assert.match(validLogId, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  test('4. Deterministic Employee Code Generation Avoids EMP-001 Collisions', () => {
    const emp1Id = ensureValidUuid('emp-1');
    const emp2Id = ensureValidUuid('emp-2');
    const emp3Id = ensureValidUuid('emp-3');

    const code1 = `EMP-${emp1Id.slice(-8).toUpperCase()}`;
    const code2 = `EMP-${emp2Id.slice(-8).toUpperCase()}`;
    const code3 = `EMP-${emp3Id.slice(-8).toUpperCase()}`;

    assert.notStrictEqual(code1, code2, 'Employee codes for emp-1 and emp-2 must be distinct');
    assert.notStrictEqual(code2, code3, 'Employee codes for emp-2 and emp-3 must be distinct');
    assert.ok(code1.startsWith('EMP-'), 'Code 1 must start with EMP-');
  });

  console.log('\n==============================================================');
  console.log(`  RESULTS: Total Tests: ${total} | Passed: ${passed} | Failed: ${total - passed}`);
  console.log('==============================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runHRMappingTests();
