/**
 * Payroll Calculator Engine Proxy — Deshal ERP
 * Re-exports pure domain calculation rules from src/domain/hr/payrollCalculator.ts
 * ensuring 100% backward compatibility for legacy callers.
 */

export {
  calculatePASIDeduction,
  calculatePayrollSlip
} from "../domain/hr/payrollCalculator";

export type {
  PayrollCalculationInput,
  PayrollCalculationResult
} from "../domain/hr/payrollCalculator";
