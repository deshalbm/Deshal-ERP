import {
  calculatePASIDeduction,
  calculatePayrollSlip,
  PayrollCalculationInput
} from "../domain/hr/payrollCalculator";

console.log("\n================================================================");
console.log("  DESHAL ERP — HR PAYROLL CALCULATOR DOMAIN UNIT TEST SUITE");
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

// TEST 1: Omani PASI 7% Social Protection Fund Deduction Math
console.log("--- TEST 1: PASI 7% SOCIAL PROTECTION DEDUCTION MATH ---");
assert(calculatePASIDeduction(500) === 35, "Calculates 7% PASI deduction on 500 OMR basic salary (35 OMR)");
assert(calculatePASIDeduction(1000) === 70, "Calculates 7% PASI deduction on 1000 OMR basic salary (70 OMR)");
assert(calculatePASIDeduction(0) === 0, "Returns 0 OMR deduction for 0 basic salary");
assert(calculatePASIDeduction(-200) === 0, "Safely clamps negative basic salary to 0 OMR deduction");

// TEST 2: Full Payroll Slip Breakdown & Invariants
console.log("\n--- TEST 2: FULL PAYROLL SLIP BREAKDOWN & INVARIANTS ---");
const input1: PayrollCalculationInput = {
  basicSalary: 600,
  housingAllowance: 150,
  transportAllowance: 50,
  otherAllowances: 20,
  bonus: 30,
  deductions: 10
};
const res1 = calculatePayrollSlip(input1);
assert(res1.basicSalary === 600, "Basic salary matches input (600 OMR)");
assert(res1.totalAllowances === 250, "Total allowances sum correctly (150 + 50 + 20 + 30 = 250 OMR)");
assert(res1.grossSalary === 850, "Gross salary equals basic + total allowances (600 + 250 = 850 OMR)");
assert(res1.socialSecurityDeduction === 42, "PASI 7% deduction on 600 OMR basic is 42 OMR");
assert(res1.otherDeductions === 10, "Other deductions match input (10 OMR)");
assert(res1.totalDeductions === 52, "Total deductions equal PASI + other deductions (42 + 10 = 52 OMR)");
assert(res1.netSalary === 798, "Net salary equals gross - total deductions (850 - 52 = 798 OMR)");

// TEST 3: Minimal Input (Basic Salary Only)
console.log("\n--- TEST 3: MINIMAL INPUT (BASIC SALARY ONLY) ---");
const input2: PayrollCalculationInput = { basicSalary: 400 };
const res2 = calculatePayrollSlip(input2);
assert(res2.totalAllowances === 0, "Default total allowances is 0 when omitted");
assert(res2.grossSalary === 400, "Gross salary equals basic salary when allowances omitted");
assert(res2.socialSecurityDeduction === 28, "PASI 7% deduction on 400 OMR basic is 28 OMR");
assert(res2.totalDeductions === 28, "Total deductions equal PASI deduction when other deductions omitted");
assert(res2.netSalary === 372, "Net salary equals 400 - 28 = 372 OMR");

// TEST 4: Edge Cases & Negative Input Clamping
console.log("\n--- TEST 4: EDGE CASES & DEFENSIVE CLAMPING ---");
const input3: PayrollCalculationInput = {
  basicSalary: -300,
  housingAllowance: -50,
  transportAllowance: -20,
  deductions: -15
};
const res3 = calculatePayrollSlip(input3);
assert(res3.basicSalary === 0, "Negative basic salary is clamped to 0");
assert(res3.totalAllowances === 0, "Negative allowances are clamped to 0");
assert(res3.grossSalary === 0, "Gross salary is 0 for negative inputs");
assert(res3.totalDeductions === 0, "Total deductions are 0 for negative inputs");
assert(res3.netSalary === 0, "Net salary is 0 for negative inputs");

// SUMMARY
console.log(`\n========================================================`);
console.log(`  SUITE COMPLETE: ${passedCount}/${totalCount} TESTS PASSED`);
console.log(`========================================================\n`);

if (passedCount !== totalCount) {
  process.exit(1);
}
