import {
  RecurringSchedule,
  RecurrenceFrequency,
  ReceiptVoucher,
  VoucherType,
  PaymentMethod
} from "../types";
import { numberToWords } from "./numberToWords";

/**
 * Calculates the next due date based on a given start/current date and recurrence frequency.
 */
export function calculateNextDueDate(currentDateStr: string, frequency: RecurrenceFrequency, customMonths?: number): string {
  const parts = currentDateStr.split("-").map(Number);
  const year = parts[0] || new Date().getFullYear();
  const month = (parts[1] || 1) - 1; // 0-indexed
  const day = parts[2] || 1;

  const date = new Date(year, month, day);

  switch (frequency) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "BIWEEKLY":
      date.setDate(date.getDate() + 14);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + (customMonths || 1));
      break;
    case "QUARTERLY":
      date.setMonth(date.getMonth() + 3);
      break;
    case "SEMI_ANNUALLY":
      date.setMonth(date.getMonth() + 6);
      break;
    case "ANNUALLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      date.setMonth(date.getMonth() + 1);
  }

  return formatDateToYMD(date);
}

/**
 * Generates an array of the next N future execution dates for preview.
 */
export function getUpcomingPreviewDates(
  startDateStr: string,
  frequency: RecurrenceFrequency,
  count: number = 5,
  endDateStr?: string
): string[] {
  const dates: string[] = [];
  let current = startDateStr;

  for (let i = 0; i < count; i++) {
    if (i === 0) {
      dates.push(current);
    } else {
      current = calculateNextDueDate(current, frequency);
      if (endDateStr && current > endDateStr) {
        break;
      }
      dates.push(current);
    }
  }

  return dates;
}

/**
 * Formats a Date object to YYYY-MM-DD
 */
export function formatDateToYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Gets today's date formatted as YYYY-MM-DD in local time
 */
export function getTodayYMD(): string {
  return formatDateToYMD(new Date());
}

/**
 * Returns difference in days between target date and today:
 * - < 0: Overdue
 * - === 0: Due today
 * - > 0: Due in N days
 */
export function getDaysUntilDue(dueDateStr: string, fromDateStr: string = getTodayYMD()): number {
  const due = new Date(dueDateStr);
  const from = new Date(fromDateStr);
  
  // Set both to midnight UTC for pure calendar day comparison
  const utcDue = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
  const utcFrom = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((utcDue - utcFrom) / msPerDay);
}

/**
 * Returns localized label for recurrence frequency
 */
export function getFrequencyLabel(freq: RecurrenceFrequency, lang: "ar" | "en" = "ar"): string {
  const labelsAr: Record<RecurrenceFrequency, string> = {
    DAILY: "يومياً",
    WEEKLY: "أسبوعياً",
    BIWEEKLY: "كل أسبوعين",
    MONTHLY: "شهرياً",
    QUARTERLY: "كل 3 أشهر (ربع سنوي)",
    SEMI_ANNUALLY: "كل 6 أشهر (نصف سنوي)",
    ANNUALLY: "سنوياً"
  };

  const labelsEn: Record<RecurrenceFrequency, string> = {
    DAILY: "Daily",
    WEEKLY: "Weekly",
    BIWEEKLY: "Bi-Weekly",
    MONTHLY: "Monthly",
    QUARTERLY: "Quarterly (Every 3 Mos)",
    SEMI_ANNUALLY: "Semi-Annually (Every 6 Mos)",
    ANNUALLY: "Annually / Yearly"
  };

  return lang === "ar" ? labelsAr[freq] || freq : labelsEn[freq] || freq;
}

/**
 * Generates an official ReceiptVoucher from a RecurringSchedule
 */
export function buildVoucherFromSchedule(
  schedule: RecurringSchedule,
  existingVouchers: ReceiptVoucher[],
  executionDate: string = getTodayYMD()
): { voucher: ReceiptVoucher; updatedSchedule: RecurringSchedule } {
  // Generate appropriate voucher sequence
  const currentYear = new Date(executionDate).getFullYear();
  const typePrefix =
    schedule.type === "RECEIPT"
      ? "RV"
      : schedule.type === "PAYMENT"
      ? "PV"
      : schedule.type === "PETTY_CASH"
      ? "PC"
      : schedule.type === "TAX_INVOICE"
      ? "INV"
      : "QT";

  // Find max seq for this type & year
  let maxSeq = 800;
  existingVouchers.forEach((v) => {
    const match = v.voucherNumber.match(new RegExp(`${typePrefix}-${currentYear}-(\\d+)`));
    if (match && match[1]) {
      const n = parseInt(match[1], 10);
      if (!isNaN(n) && n > maxSeq) {
        maxSeq = n;
      }
    }
  });

  const nextSeq = maxSeq + 1;
  const voucherNumber = `${typePrefix}-${currentYear}-${nextSeq.toString().padStart(4, "0")}`;
  const voucherId = `voucher-rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const installmentLabel = schedule.totalOccurrences && schedule.totalOccurrences > 0
    ? `(القسط رقم ${schedule.completedOccurrences + 1} من ${schedule.totalOccurrences})`
    : `(دورية: ${getFrequencyLabel(schedule.frequency, "ar")})`;

  const fullDescription = `${schedule.title} ${installmentLabel} - ${schedule.description || "معاملة مجدولة دورية"}`;

  const newVoucher: ReceiptVoucher = {
    id: voucherId,
    type: schedule.type,
    voucherNumber,
    referenceNo: `REC-${schedule.scheduleCode}-${schedule.completedOccurrences + 1}`,
    date: executionDate,
    dueDate: schedule.nextDueDate,
    branchId: schedule.branchId,
    branchName: schedule.branchName,
    receivedFrom: schedule.type === "RECEIPT" ? schedule.partyName : "ديشال لإدارة الأعمال والحلول التقنية",
    paidTo: schedule.type === "RECEIPT" ? undefined : schedule.partyName,
    payerPhone: schedule.partyPhone,
    payerEmail: schedule.partyEmail,
    payerTaxId: schedule.partyTaxId,
    amount: schedule.amount,
    currency: schedule.currency,
    amountInWords: numberToWords(schedule.amount, schedule.currency),
    isCustomWords: false,
    paymentMethod: schedule.paymentMethod,
    bankName: schedule.bankName,
    category: schedule.category,
    status: "PAID",
    preparedBy: "النظام الآلي للعمليات المجدولة",
    approvedBy: "الإدارة المالية",
    receivedBy: schedule.partyName,
    subtotal: schedule.amount,
    taxRate: 0,
    taxAmount: 0,
    discountAmount: 0,
    totalAmount: schedule.amount,
    lineItems: [
      {
        id: `li-rec-${Date.now()}`,
        description: fullDescription,
        quantity: 1,
        unitPrice: schedule.amount,
        amount: schedule.amount
      }
    ],
    notes: `تم تسجيل هذا السند تلقائياً من جدول العمليات الدورية [${schedule.title} - كود: ${schedule.scheduleCode}] بتاريخ استحقاق: ${schedule.nextDueDate}.`,
    terms: schedule.terms || "يسري هذا السند المالي كإشعار رسمي معتمد بالاستلام أو السداد المجدول.",
    customFields: [
      { id: "cf-rec-code", label: "كود الجدولة", value: schedule.scheduleCode },
      { id: "cf-rec-freq", label: "الدورية", value: getFrequencyLabel(schedule.frequency, "ar") }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Update schedule state
  const newCompletedCount = schedule.completedOccurrences + 1;
  const isFinished = schedule.totalOccurrences && schedule.totalOccurrences > 0 && newCompletedCount >= schedule.totalOccurrences;
  const nextDueDateCalculated = calculateNextDueDate(schedule.nextDueDate || executionDate, schedule.frequency, schedule.customIntervalMonths);

  const updatedSchedule: RecurringSchedule = {
    ...schedule,
    completedOccurrences: newCompletedCount,
    lastExecutedDate: executionDate,
    nextDueDate: nextDueDateCalculated,
    status: isFinished ? "COMPLETED" : schedule.status,
    executions: [
      {
        id: `exec-${Date.now()}`,
        voucherId,
        voucherNumber,
        executionDate,
        dueDate: schedule.nextDueDate,
        amount: schedule.amount,
        currency: schedule.currency,
        status: "POSTED",
        notes: fullDescription,
        createdAt: new Date().toISOString()
      },
      ...schedule.executions
    ],
    updatedAt: new Date().toISOString()
  };

  return { voucher: newVoucher, updatedSchedule };
}
