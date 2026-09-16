/**
 * DESHAL ERP — RECURRENCE UTILS ENGINE (RE-EXPORTS)
 *
 * Re-exports domain recurrence calculation, preview generation, and date math functions
 * from src/domain/finance/recurrenceUtils.ts for 100% backward compatibility.
 */

export {
  calculateNextDueDate,
  getUpcomingPreviewDates,
  formatDateToYMD,
  getTodayYMD,
  getDaysUntilDue,
  getFrequencyLabel,
  buildVoucherFromSchedule
} from "../domain/finance/recurrenceUtils";
