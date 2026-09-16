import {
  Account,
  AccountingRevisionLog,
  AccountingSettings,
  FiscalPeriod,
  JournalEntry,
  JournalEntryStatus
} from '../../types';

export interface PostJournalEntryParams {
  entryId: string;
  entries: JournalEntry[];
  accounts?: Account[];
  periods?: FiscalPeriod[];
  settings?: AccountingSettings;
  postedBy?: string;
  timestamp?: string;
}

export interface PostJournalEntryResult {
  success: boolean;
  message?: string;
  updatedEntries: JournalEntry[];
  postedEntry?: JournalEntry;
  revisionLog?: AccountingRevisionLog;
}

export function isPeriodClosed(
  date: string,
  periods: FiscalPeriod[] = [],
  settings?: AccountingSettings
): boolean {
  if (settings?.allowPostingToClosedPeriods) return false;
  const targetPeriod = periods.find((p) => date >= p.startDate && date <= p.endDate);
  if (!targetPeriod) return false;
  return targetPeriod.status === 'CLOSED' || targetPeriod.status === 'LOCKED';
}

export function canPostJournalEntry(
  entry: JournalEntry,
  periods: FiscalPeriod[] = [],
  settings?: AccountingSettings
): { allowed: boolean; reason?: string } {
  const sumDebit = entry.lines.reduce((s, l) => s + Number(l.debit || 0), 0);
  const sumCredit = entry.lines.reduce((s, l) => s + Number(l.credit || 0), 0);
  const diff = Math.abs(sumDebit - sumCredit);

  if (diff > 0.005) {
    return {
      allowed: false,
      reason: `القيد غير متوازن: إجمالي المدين (${sumDebit.toFixed(3)}) لا يساوي إجمالي الدائن (${sumCredit.toFixed(3)}) بفارق ${diff.toFixed(3)} ر.ع.`
    };
  }

  if (entry.lines.length < 2) {
    return {
      allowed: false,
      reason: 'يجب أن يحتوي القيد على سطرين على الأقل (طرف مدين وطرف دائن).'
    };
  }

  if (isPeriodClosed(entry.date, periods, settings)) {
    return {
      allowed: false,
      reason: `الفترة المالية المقابلة للتاريخ (${entry.date}) مقفلة أو مغلقة، ولا يمكن الترحيل إليها.`
    };
  }

  return { allowed: true };
}

/**
 * Pure Application Use Case for posting a General Ledger journal entry.
 * 
 * Preserves 100% of existing posting invariants (debit/credit equality check,
 * line count requirement, fiscal period lock status, revision logging).
 * Zero React/storage/Supabase dependencies.
 */
export function postJournalEntry(
  params: PostJournalEntryParams
): PostJournalEntryResult {
  const {
    entryId,
    entries,
    periods = [],
    settings,
    postedBy = 'المحاسب المسؤول',
    timestamp = new Date().toISOString()
  } = params;

  const target = entries.find((e) => e.id === entryId);
  if (!target) {
    return { success: false, updatedEntries: entries, message: 'القيد غير موجود.' };
  }

  if (target.status === 'POSTED' || target.status === 'LOCKED') {
    return { success: false, updatedEntries: entries, message: 'القيد مرحل بالفعل ولا يمكن إعادة ترحيله.' };
  }

  const check = canPostJournalEntry(target, periods, settings);
  if (!check.allowed) {
    return { success: false, updatedEntries: entries, message: check.reason };
  }

  let postedEntry: JournalEntry | undefined;

  const updatedEntries = entries.map((e) => {
    if (e.id === entryId) {
      postedEntry = {
        ...e,
        status: 'POSTED' as JournalEntryStatus,
        isBalanced: true,
        postedBy,
        postedAt: timestamp,
        updatedAt: timestamp
      };
      return postedEntry;
    }
    return e;
  });

  const revisionLog: AccountingRevisionLog = {
    id: `rev-post-${target.id}-${Date.now()}`,
    timestamp,
    userId: postedBy,
    userName: postedBy,
    action: 'POST',
    entityType: 'JOURNAL_ENTRY',
    entityId: entryId,
    entityReference: target.entryNumber,
    detailsAr: `ترحيل القيد ${target.entryNumber} إلى الأستاذ العام بمبلغ ${target.totalDebit.toFixed(3)} ر.ع`,
    detailsEn: `Posted journal entry ${target.entryNumber} to General Ledger`,
    previousState: { status: target.status },
    newState: { status: 'POSTED' as JournalEntryStatus }
  };

  return {
    success: true,
    updatedEntries,
    postedEntry,
    revisionLog
  };
}
