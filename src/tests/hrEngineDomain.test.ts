/**
 * Characterization Unit Test Suite — HR Labor Law & Employee Contract Lifecycle Engine
 * Verifies Omani Labor Law EOSB calculations, annual leave accruals,
 * attendance check-in/late/overtime evaluations, 90-day probation periods, and payroll batch summaries.
 */

import {
  calculateEOSB,
  calculateLeaveBalance,
  evaluateAttendanceEntry,
  evaluateEmployeeContractStatus,
  calculatePayrollBatchSummary,
} from '../domain/hr/hrEngine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`  ✅ PASS: ${message}`);
  }
}

function runTests() {
  console.log("\n================================================================");
  console.log("  DESHAL ERP — HR LABOR LAW & CONTRACT LIFECYCLE TEST SUITE");
  console.log("================================================================");

  // --- TEST 1: OMANI LABOR LAW EOSB CALCULATION ---
  console.log("\n--- TEST 1: OMANI LABOR LAW EOSB CALCULATION ---");
  // 600 OMR basic salary => daily basic = 20 OMR.
  // 2 years service: 2 * 15 * 20 = 600 OMR EOSB.
  const eosb2Years = calculateEOSB(600, '2024-01-01', '2026-01-01');
  assert(eosb2Years.dailyBasicSalary === 20, "Daily basic salary for 600 OMR is 20.000 OMR");
  assert(eosb2Years.totalEOSBAmount === 600, "2 years service EOSB equals 600.000 OMR (15 days/yr)");

  // 4 years service: First 3 yrs (3 * 15 * 20 = 900) + 4th yr (1 * 30 * 20 = 600) = 1500 OMR.
  const eosb4Years = calculateEOSB(600, '2022-01-01', '2026-01-01');
  assert(eosb4Years.firstPeriodAmount === 900, "First 3 years period amount is 900.000 OMR");
  assert(eosb4Years.secondPeriodAmount === 600, "4th year period amount is 600.000 OMR (30 days/yr)");
  assert(eosb4Years.totalEOSBAmount === 1500, "Total 4 years EOSB equals 1500.000 OMR");

  // --- TEST 2: ANNUAL LEAVE ACCRUAL & BALANCE ---
  console.log("\n--- TEST 2: ANNUAL LEAVE ACCRUAL & BALANCE ---");
  // 12 months worked => 12 * 2.5 = 30 days accrued. Taken 10 days => 20 days remaining.
  const leaveRes = calculateLeaveBalance('2025-01-01', 10, '2026-01-01');
  assert(leaveRes.accruedDays === 30, "12 months worked accrues 30.0 calendar days leave");
  assert(leaveRes.remainingDays === 20, "30 accrued - 10 taken = 20 remaining leave days");

  // --- TEST 3: ATTENDANCE ENTRY EVALUATION ---
  console.log("\n--- TEST 3: ATTENDANCE ENTRY EVALUATION ---");
  // Check-in 08:10 (grace is 15 mins) => PRESENT
  const presentRes = evaluateAttendanceEntry("08:10", "17:00", "08:00", 15, 8);
  assert(presentRes.status === 'PRESENT', "Check-in within 15 min grace period evaluates to PRESENT");
  assert(presentRes.lateMinutes === 0, "0 late minutes");

  // Check-in 08:30 (grace is 15 mins) => LATE 30 mins
  const lateRes = evaluateAttendanceEntry("08:30", "17:00", "08:00", 15, 8);
  assert(lateRes.status === 'LATE', "Check-in at 08:30 evaluates to LATE");
  assert(lateRes.lateMinutes === 30, "30 late minutes");

  // --- TEST 4: EMPLOYEE CONTRACT PROBATION EVALUATION ---
  console.log("\n--- TEST 4: EMPLOYEE CONTRACT PROBATION EVALUATION ---");
  // Hired 30 days ago => probationary
  const probRes = evaluateEmployeeContractStatus('2025-12-01', '2025-12-31');
  assert(probRes.isProbationary === true, "30 days tenure is probationary (< 90 days)");

  // Hired 120 days ago => past probation
  const activeRes = evaluateEmployeeContractStatus('2025-08-01', '2025-12-01');
  assert(activeRes.isProbationary === false, "120 days tenure is past probation");

  // --- TEST 5: PAYROLL BATCH SUMMARY AGGREGATION ---
  console.log("\n--- TEST 5: PAYROLL BATCH SUMMARY AGGREGATION ---");
  const payrollBatch = [
    { basicSalary: 500, housingAllowance: 100, transportAllowance: 50 }, // Gross 650, PASI 7% of 500 = 35, Net = 615
    { basicSalary: 1000, housingAllowance: 200, transportAllowance: 100 }, // Gross 1300, PASI 7% of 1000 = 70, Net = 1230
  ];

  const summary = calculatePayrollBatchSummary(payrollBatch);
  assert(summary.totalEmployeesCount === 2, "Counts 2 employees in payroll batch");
  assert(summary.totalBasicSalary === 1500, "Total basic salary is 1500.000 OMR");
  assert(summary.totalGrossSalary === 1950, "Total gross salary is 1950.000 OMR");
  assert(summary.totalPASIDeduction === 105, "Total PASI 7% deduction is 105.000 OMR");
  assert(summary.totalNetSalary === 1845, "Total net salary is 1845.000 OMR");

  console.log("\n==============================================================");
  console.log("  RESULTS: ALL TESTS PASSED");
  console.log("==============================================================\n");
}

runTests();
