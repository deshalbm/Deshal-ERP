/**
 * HR Labor Law & Employee Contract Lifecycle Engine — Deshal ERP
 * Pure Domain Layer: Omani Labor Law EOSB calculation, annual leave balance accrual,
 * attendance check-in/late/overtime evaluation, probation status, and payroll summary aggregation.
 */

import { AttendanceStatus, Employee } from '../../types/hr';
import { calculatePayrollSlip, PayrollCalculationInput, PayrollCalculationResult } from './payrollCalculator';

export interface EOSBResult {
  serviceYears: number;
  serviceMonths: number;
  serviceDays: number;
  dailyBasicSalary: number;
  firstPeriodAmount: number; // First 3 years (15 days/yr)
  secondPeriodAmount: number; // Subsequent years (30 days/yr)
  totalEOSBAmount: number;
}

export interface LeaveBalanceResult {
  monthsWorked: number;
  accruedDays: number;
  takenDays: number;
  remainingDays: number;
}

export interface AttendanceEvaluationResult {
  status: AttendanceStatus;
  lateMinutes: number;
  workingHours: number;
  overtimeHours: number;
}

export interface ContractStatusResult {
  isProbationary: boolean;
  probationDaysRemaining: number;
  tenureMonths: number;
}

export interface PayrollBatchSummaryResult {
  totalEmployeesCount: number;
  totalBasicSalary: number;
  totalAllowances: number;
  totalGrossSalary: number;
  totalPASIDeduction: number;
  totalOtherDeductions: number;
  totalDeductions: number;
  totalNetSalary: number;
}

/**
 * Calculates End of Service Benefit (EOSB) under Omani Labor Law (Royal Decree 53/2023).
 * Formula: Daily Basic = Basic / 30.
 * First 3 years: 15 days basic salary per year.
 * Subsequent years: 30 days (1 month) basic salary per year.
 */
export function calculateEOSB(
  basicSalary: number,
  hireDate: string,
  terminationDate?: string,
  nowMs: number = Date.now()
): EOSBResult {
  const basic = Math.max(0, Number(basicSalary) || 0);
  const start = new Date(hireDate);
  const end = terminationDate ? new Date(terminationDate) : new Date(nowMs);

  let years = end.getFullYear() - start.getFullYear();
  const monthDiff = end.getMonth() - start.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < start.getDate())) {
    years--;
  }

  const anniversary = new Date(start);
  anniversary.setFullYear(start.getFullYear() + years);
  const remainingDaysMs = Math.max(0, end.getTime() - anniversary.getTime());
  const remainingDays = Math.floor(remainingDaysMs / (1000 * 60 * 60 * 24));

  const totalYears = years + remainingDays / 365;
  const serviceYears = years;
  const serviceMonths = Math.floor(remainingDays / 30);
  const serviceDays = remainingDays % 30;

  const dailyBasicSalary = Math.round((basic / 30) * 1000) / 1000;

  // First period: up to 3 years @ 15 days basic per year
  const firstPeriodYears = Math.min(3, totalYears);
  const firstPeriodAmount = Math.round(firstPeriodYears * 15 * dailyBasicSalary * 1000) / 1000;

  // Second period: remaining years over 3 years @ 30 days basic per year
  const secondPeriodYears = Math.max(0, totalYears - 3);
  const secondPeriodAmount = Math.round(secondPeriodYears * 30 * dailyBasicSalary * 1000) / 1000;

  const totalEOSBAmount = Math.round((firstPeriodAmount + secondPeriodAmount) * 1000) / 1000;

  return {
    serviceYears,
    serviceMonths,
    serviceDays,
    dailyBasicSalary,
    firstPeriodAmount,
    secondPeriodAmount,
    totalEOSBAmount,
  };
}

/**
 * Calculates annual leave accrual (30 days/year, 2.5 days/month) and remaining balance.
 */
export function calculateLeaveBalance(
  hireDate: string,
  leaveTakenDays: number = 0,
  todayStr?: string,
  nowMs: number = Date.now()
): LeaveBalanceResult {
  const start = new Date(hireDate);
  const today = todayStr ? new Date(todayStr) : new Date(nowMs);

  const diffTime = Math.max(0, today.getTime() - start.getTime());
  const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const monthsWorked = Math.floor(totalDays / 30);

  const accruedDays = Math.round(monthsWorked * 2.5 * 10) / 10; // 2.5 days per month
  const taken = Math.max(0, Number(leaveTakenDays) || 0);
  const remainingDays = Math.round(Math.max(0, accruedDays - taken) * 10) / 10;

  return {
    monthsWorked,
    accruedDays,
    takenDays: taken,
    remainingDays,
  };
}

/**
 * Evaluates attendance check-in/out, late minutes, working hours, and overtime.
 */
export function evaluateAttendanceEntry(
  checkIn?: string, // e.g. "08:15"
  checkOut?: string, // e.g. "17:00"
  shiftStartTime: string = "08:00",
  graceMinutes: number = 15,
  standardShiftHours: number = 8
): AttendanceEvaluationResult {
  if (!checkIn) {
    return {
      status: 'ABSENT',
      lateMinutes: 0,
      workingHours: 0,
      overtimeHours: 0,
    };
  }

  const [inH, inM] = checkIn.split(':').map(Number);
  const [shiftH, shiftM] = shiftStartTime.split(':').map(Number);

  const checkInMins = inH * 60 + inM;
  const shiftMins = shiftH * 60 + shiftM;

  let lateMinutes = 0;
  if (checkInMins > shiftMins + graceMinutes) {
    lateMinutes = checkInMins - shiftMins;
  }

  const status: AttendanceStatus = lateMinutes > 0 ? 'LATE' : 'PRESENT';

  let workingHours = 0;
  let overtimeHours = 0;

  if (checkOut) {
    const [outH, outM] = checkOut.split(':').map(Number);
    const checkOutMins = outH * 60 + outM;
    const durationMins = Math.max(0, checkOutMins - checkInMins);
    workingHours = Math.round((durationMins / 60) * 100) / 100;
    if (workingHours > standardShiftHours) {
      overtimeHours = Math.round((workingHours - standardShiftHours) * 100) / 100;
    }
  }

  return {
    status,
    lateMinutes,
    workingHours,
    overtimeHours,
  };
}

/**
 * Evaluates employee contract status and 90-day probation period.
 */
export function evaluateEmployeeContractStatus(
  hireDate: string,
  todayStr?: string,
  nowMs: number = Date.now()
): ContractStatusResult {
  const start = new Date(hireDate);
  const today = todayStr ? new Date(todayStr) : new Date(nowMs);

  const diffTime = Math.max(0, today.getTime() - start.getTime());
  const tenureDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const tenureMonths = Math.floor(tenureDays / 30);

  const isProbationary = tenureDays < 90;
  const probationDaysRemaining = isProbationary ? 90 - tenureDays : 0;

  return {
    isProbationary,
    probationDaysRemaining,
    tenureMonths,
  };
}

/**
 * Computes aggregated payroll summary across a collection of employee salary inputs.
 */
export function calculatePayrollBatchSummary(
  inputs: PayrollCalculationInput[]
): PayrollBatchSummaryResult {
  let totalBasicSalary = 0;
  let totalAllowances = 0;
  let totalGrossSalary = 0;
  let totalPASIDeduction = 0;
  let totalOtherDeductions = 0;
  let totalDeductions = 0;
  let totalNetSalary = 0;

  inputs.forEach((inp) => {
    const res = calculatePayrollSlip(inp);
    totalBasicSalary += res.basicSalary;
    totalAllowances += res.totalAllowances;
    totalGrossSalary += res.grossSalary;
    totalPASIDeduction += res.socialSecurityDeduction;
    totalOtherDeductions += res.otherDeductions;
    totalDeductions += res.totalDeductions;
    totalNetSalary += res.netSalary;
  });

  return {
    totalEmployeesCount: inputs.length,
    totalBasicSalary: Math.round(totalBasicSalary * 1000) / 1000,
    totalAllowances: Math.round(totalAllowances * 1000) / 1000,
    totalGrossSalary: Math.round(totalGrossSalary * 1000) / 1000,
    totalPASIDeduction: Math.round(totalPASIDeduction * 1000) / 1000,
    totalOtherDeductions: Math.round(totalOtherDeductions * 1000) / 1000,
    totalDeductions: Math.round(totalDeductions * 1000) / 1000,
    totalNetSalary: Math.round(totalNetSalary * 1000) / 1000,
  };
}
