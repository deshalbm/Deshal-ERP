/**
 * DESHAL ERP — DOUBLE-ENTRY FINANCIAL INVARIANTS & LEDGER AUDIT ENGINE
 * 
 * Pure domain functions for double-entry ledger balance enforcement (Debit = Credit),
 * non-destructive posting reversal generation, trial balance mathematical verification,
 * and ledger integrity diagnostics.
 */

import {
  JournalEntry,
  JournalEntryLine,
  Account,
  TrialBalanceRow,
  UnbalancedEntryDiagnostic,
  AccountingRevisionLog
} from "../../types/accounting";

export interface BalanceValidationResult {
  isBalanced: boolean;
  totalDebit: number;
  totalCredit: number;
  imbalanceAmount: number;
  formattedDifference: string;
}

export interface LedgerIntegrityReport {
  isIntegral: boolean;
  totalPostedEntries: number;
  totalPostedDebit: number;
  totalPostedCredit: number;
  unbalancedEntries: UnbalancedEntryDiagnostic[];
  integrityViolationsCount: number;
}

/**
 * Validates double-entry invariant: Sum of Debits MUST equal Sum of Credits
 * Precision: 3 decimal places (OMR standard)
 */
export function validateJournalBalance(lines: JournalEntryLine[]): BalanceValidationResult {
  if (!Array.isArray(lines) || lines.length === 0) {
    return {
      isBalanced: false,
      totalDebit: 0,
      totalCredit: 0,
      imbalanceAmount: 0,
      formattedDifference: "0.000 OMR"
    };
  }

  let totalDebit = 0;
  let totalCredit = 0;

  lines.forEach((line) => {
    const debit = typeof line.debit === "number" && !isNaN(line.debit) ? line.debit : 0;
    const credit = typeof line.credit === "number" && !isNaN(line.credit) ? line.credit : 0;
    totalDebit += debit;
    totalCredit += credit;
  });

  const roundedDebit = Number(totalDebit.toFixed(3));
  const roundedCredit = Number(totalCredit.toFixed(3));
  const imbalanceAmount = Number(Math.abs(roundedDebit - roundedCredit).toFixed(3));
  const isBalanced = imbalanceAmount < 0.001;

  return {
    isBalanced,
    totalDebit: roundedDebit,
    totalCredit: roundedCredit,
    imbalanceAmount,
    formattedDifference: `${imbalanceAmount.toFixed(3)} OMR`
  };
}

/**
 * Generates a non-destructive mirror-reversal journal entry payload
 * Swaps Debits and Credits of all lines, links reversedEntryId, and sets type to REVERSAL.
 */
export function generatePostingReversalPayload(
  originalEntry: JournalEntry,
  reversalReason: string,
  reversedBy: string,
  nowMs: number = Date.now(),
  randomEntropy?: number
): { success: boolean; reversalEntry?: JournalEntry; errorMessage?: string } {
  const entropy = randomEntropy !== undefined ? randomEntropy : (nowMs % 1000) / 1000;
  if (!originalEntry) {
    return { success: false, errorMessage: "القيد الأصلي غير موجود." };
  }

  if (originalEntry.status !== "POSTED" && originalEntry.status !== "APPROVED") {
    return { success: false, errorMessage: "يمكن فقط إلغاء/عكس القيود المعتمدة أو المضافة لدفتر اليومية." };
  }

  if (originalEntry.reversalEntryId) {
    return { success: false, errorMessage: "تم عكس هذا القيد المحاسبي سابقاً." };
  }

  const now = new Date(nowMs).toISOString();
  const dateStr = now.slice(0, 10);
  const reversalLines: JournalEntryLine[] = originalEntry.lines.map((line) => ({
    ...line,
    id: `line-rev-${nowMs}-${Math.floor(randomEntropy * 1000)}`,
    debit: line.credit, // Swap Debit and Credit
    credit: line.debit,
    descriptionAr: `[عكس قيد] ${line.descriptionAr}`,
    descriptionEn: line.descriptionEn ? `[Reversal] ${line.descriptionEn}` : undefined
  }));

  const validation = validateJournalBalance(reversalLines);
  if (!validation.isBalanced) {
    return { success: false, errorMessage: `فشل عكس القيد: القيد غير متوازن بمقدار ${validation.formattedDifference}` };
  }

  const reversalEntry: JournalEntry = {
    id: `je-rev-${nowMs}`,
    entryNumber: `REV-${originalEntry.entryNumber}`,
    date: dateStr,
    type: "REVERSAL",
    status: "POSTED",
    referenceType: originalEntry.referenceType || "MANUAL",
    referenceId: originalEntry.id,
    referenceNumber: originalEntry.entryNumber,
    descriptionAr: `عكس القيد المحاسبي رقم (${originalEntry.entryNumber}) - السبب: ${reversalReason}`,
    descriptionEn: `Reversal of Journal Entry (${originalEntry.entryNumber}) - Reason: ${reversalReason}`,
    branchId: originalEntry.branchId,
    branchName: originalEntry.branchName,
    currency: originalEntry.currency || "OMR",
    lines: reversalLines,
    totalDebit: validation.totalDebit,
    totalCredit: validation.totalCredit,
    isBalanced: true,
    createdBy: reversedBy,
    postedBy: reversedBy,
    postedAt: now,
    reversedEntryId: originalEntry.id,
    reversalReason,
    createdAt: now,
    updatedAt: now
  };

  return { success: true, reversalEntry };
}

/**
 * Audit an entire list of general ledger journal entries for double-entry integrity
 */
export function verifyLedgerIntegrity(entries: JournalEntry[]): LedgerIntegrityReport {
  const unbalancedEntries: UnbalancedEntryDiagnostic[] = [];
  let totalPostedDebit = 0;
  let totalPostedCredit = 0;
  let totalPostedEntries = 0;

  if (Array.isArray(entries)) {
    entries.forEach((entry) => {
      if (entry.status === "POSTED" || entry.status === "APPROVED") {
        totalPostedEntries++;
        const val = validateJournalBalance(entry.lines);
        totalPostedDebit += val.totalDebit;
        totalPostedCredit += val.totalCredit;

        if (!val.isBalanced) {
          unbalancedEntries.push({
            entry,
            totalDebit: val.totalDebit,
            totalCredit: val.totalCredit,
            difference: val.imbalanceAmount,
            reason: `قيد غير متوازن: مجموع المدين (${val.totalDebit}) لا يساوي مجموع الدائن (${val.totalCredit})`
          });
        }
      }
    });
  }

  const roundedDebit = Number(totalPostedDebit.toFixed(3));
  const roundedCredit = Number(totalPostedCredit.toFixed(3));
  const isIntegral = unbalancedEntries.length === 0 && Math.abs(roundedDebit - roundedCredit) < 0.001;

  return {
    isIntegral,
    totalPostedEntries,
    totalPostedDebit: roundedDebit,
    totalPostedCredit: roundedCredit,
    unbalancedEntries,
    integrityViolationsCount: unbalancedEntries.length
  };
}

/**
 * Calculates Trial Balance rows across all accounts from posted journal entries
 */
export function calculateTrialBalanceFromEntries(
  accounts: Account[],
  postedEntries: JournalEntry[]
): { rows: TrialBalanceRow[]; isTrialBalanceBalanced: boolean; totalDebitSum: number; totalCreditSum: number } {
  const accountMap = new Map<string, TrialBalanceRow>();

  accounts.forEach((acc) => {
    accountMap.set(acc.id, {
      accountId: acc.id,
      accountCode: acc.code,
      accountNameAr: acc.nameAr,
      accountNameEn: acc.nameEn,
      type: acc.type,
      category: acc.category,
      openingDebit: acc.type === "ASSET" || acc.type === "EXPENSE" || acc.type === "COGS" ? acc.openingBalance || 0 : 0,
      openingCredit: acc.type === "LIABILITY" || acc.type === "EQUITY" || acc.type === "REVENUE" ? acc.openingBalance || 0 : 0,
      periodDebit: 0,
      periodCredit: 0,
      closingDebit: 0,
      closingCredit: 0,
      netBalance: 0
    });
  });

  if (Array.isArray(postedEntries)) {
    postedEntries.forEach((entry) => {
      if (entry.status === "POSTED" || entry.status === "APPROVED") {
        entry.lines.forEach((line) => {
          const row = accountMap.get(line.accountId);
          if (row) {
            row.periodDebit += line.debit || 0;
            row.periodCredit += line.credit || 0;
          }
        });
      }
    });
  }

  let totalDebitSum = 0;
  let totalCreditSum = 0;

  const rows: TrialBalanceRow[] = Array.from(accountMap.values()).map((row) => {
    const periodDebit = Number(row.periodDebit.toFixed(3));
    const periodCredit = Number(row.periodCredit.toFixed(3));
    const totalDebit = row.openingDebit + periodDebit;
    const totalCredit = row.openingCredit + periodCredit;
    const net = Number((totalDebit - totalCredit).toFixed(3));

    let closingDebit = 0;
    let closingCredit = 0;

    if (net >= 0) {
      closingDebit = net;
    } else {
      closingCredit = Math.abs(net);
    }

    totalDebitSum += closingDebit;
    totalCreditSum += closingCredit;

    return {
      ...row,
      periodDebit,
      periodCredit,
      closingDebit,
      closingCredit,
      netBalance: net
    };
  });

  const roundedDebitSum = Number(totalDebitSum.toFixed(3));
  const roundedCreditSum = Number(totalCreditSum.toFixed(3));
  const isTrialBalanceBalanced = Math.abs(roundedDebitSum - roundedCreditSum) < 0.001;

  return {
    rows,
    isTrialBalanceBalanced,
    totalDebitSum: roundedDebitSum,
    totalCreditSum: roundedCreditSum
  };
}

/**
 * Creates a structured accounting audit revision log payload.
 */
export function createAccountingRevisionLog(
  action: 'CREATE' | 'EDIT' | 'APPROVE' | 'POST' | 'REVERSE' | 'LOCK' | 'UNLOCK' | 'DELETE_DRAFT' | 'SETTINGS_UPDATE',
  entityType: 'JOURNAL_ENTRY' | 'ACCOUNT' | 'PERIOD' | 'TAX' | 'BANK_ACCOUNT' | 'RECONCILIATION' | 'SETTINGS',
  entityId: string,
  entityReference: string,
  detailsAr: string,
  detailsEn: string,
  userName: string = "النظام",
  nowMs: number = Date.now()
): AccountingRevisionLog {
  const nowStr = new Date(nowMs).toISOString();
  return {
    id: `rev-log-${nowMs}`,
    timestamp: nowStr,
    userId: "USER",
    userName,
    action,
    entityType,
    entityId,
    entityReference,
    detailsAr,
    detailsEn
  };
}

