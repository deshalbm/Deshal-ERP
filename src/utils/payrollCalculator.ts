/**
 * Payroll Calculator Engine — Deshal ERP
 * Standard Omani PASI (Social Protection Fund - 7% of Basic Salary) calculation and salary breakdown.
 */

export interface PayrollCalculationInput {
  basicSalary: number;
  housingAllowance?: number;
  transportAllowance?: number;
  otherAllowances?: number;
  bonus?: number;
  deductions?: number;
}

export interface PayrollCalculationResult {
  basicSalary: number;
  totalAllowances: number;
  grossSalary: number;
  socialSecurityDeduction: number; // 7% of Basic Salary (PASI)
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
}

/**
 * Calculates PASI 7% Social Protection deduction based on Basic Salary.
 */
export function calculatePASIDeduction(basicSalary: number): number {
  const safeBasic = Math.max(0, Number(basicSalary) || 0);
  return Math.round(safeBasic * 0.07 * 1000) / 1000;
}

/**
 * Calculates full payroll slip breakdown preserving double-entry salary invariants.
 */
export function calculatePayrollSlip(input: PayrollCalculationInput): PayrollCalculationResult {
  const basic = Math.max(0, Number(input.basicSalary) || 0);
  const housing = Math.max(0, Number(input.housingAllowance) || 0);
  const transport = Math.max(0, Number(input.transportAllowance) || 0);
  const other = Math.max(0, Number(input.otherAllowances) || 0);
  const bonus = Math.max(0, Number(input.bonus) || 0);
  const otherDeductions = Math.max(0, Number(input.deductions) || 0);

  const totalAllowances = Math.round((housing + transport + other + bonus) * 1000) / 1000;
  const grossSalary = Math.round((basic + totalAllowances) * 1000) / 1000;
  const socialSecurityDeduction = calculatePASIDeduction(basic);
  const totalDeductions = Math.round((socialSecurityDeduction + otherDeductions) * 1000) / 1000;
  const netSalary = Math.round(Math.max(0, grossSalary - totalDeductions) * 1000) / 1000;

  return {
    basicSalary: basic,
    totalAllowances,
    grossSalary,
    socialSecurityDeduction,
    otherDeductions,
    totalDeductions,
    netSalary,
  };
}
