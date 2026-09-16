/**
 * Voucher Calculation Engine Proxy — Deshal ERP
 * Re-exports pure domain calculation rules from src/domain/vouchers/voucherCalculations.ts
 * ensuring 100% backward compatibility for legacy callers.
 */

export {
  calculateLineItemAmount,
  calculateVoucherTotals,
  isJournalBalanced
} from "../domain/vouchers/voucherCalculations";

export type {
  VoucherLineItemInput,
  VoucherTotalsResult
} from "../domain/vouchers/voucherCalculations";
