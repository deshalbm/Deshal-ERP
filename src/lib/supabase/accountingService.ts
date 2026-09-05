/**
 * Accounting Service — Supabase CRUD
 * Uses exact types from src/types/accounting.ts
 */

import { supabase, isSupabaseConfigured } from './client';
import type {
  Account,
  JournalEntry,
  JournalEntryLine,
  FiscalPeriod,
  CostCenter,
  AccountingRevisionLog,
} from '../../types/accounting';
import type { ReceiptVoucher } from '../../types';
import { ensureValidUuid, ensureNullableUuid } from '../../utils/uuid';

// ──────────────────────────────────────────────
// Atomic Sequence & Financial Posting RPCs
// ──────────────────────────────────────────────

export async function fetchNextVoucherNumber(
  companyId: string,
  type: string,
  branchId?: string
): Promise<string> {
  if (!isSupabaseConfigured) {
    const year = new Date().getFullYear();
    const prefix = type === 'RECEIPT' ? 'REC' : type === 'PAYMENT' ? 'PAY' : 'INV';
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${year}-${rand}`;
  }

  try {
    const validCompanyId = ensureValidUuid(companyId);
    const validBranchId = ensureNullableUuid(branchId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('generate_next_voucher_number', {
      p_company_id: validCompanyId,
      p_type: type,
      p_branch_id: validBranchId,
    });

    if (error || !data) {
      console.warn('[AccountingService] RPC generate_next_voucher_number fallback:', error?.message);
      const year = new Date().getFullYear();
      const prefix = type === 'RECEIPT' ? 'REC' : type === 'PAYMENT' ? 'PAY' : 'INV';
      const rand = Math.floor(1000 + Math.random() * 9000);
      return `${prefix}-${year}-${rand}`;
    }

    return String(data);
  } catch (e) {
    console.error('[AccountingService] fetchNextVoucherNumber exception:', e);
    const year = new Date().getFullYear();
    const prefix = type === 'RECEIPT' ? 'REC' : type === 'PAYMENT' ? 'PAY' : 'INV';
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${year}-${rand}`;
  }
}

export async function postVoucherFinancialTransaction(
  companyId: string,
  branchId: string,
  voucherPayload: Partial<ReceiptVoucher>
): Promise<{ success: boolean; voucherId?: string; voucherNumber?: string; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase غير مضبوط.' };
  }

  try {
    const validCompanyId = ensureValidUuid(companyId);
    const validBranchId = ensureNullableUuid(branchId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('post_voucher_financial_transaction', {
      p_company_id: validCompanyId,
      p_branch_id: validBranchId,
      p_voucher_payload: voucherPayload,
    });

    if (error) {
      console.error('[AccountingService] postVoucherFinancialTransaction RPC error:', error.message);
      return { success: false, error: error.message };
    }

    if (data && data.success) {
      return {
        success: true,
        voucherId: data.voucherId,
        voucherNumber: data.voucherNumber,
      };
    }

    return { success: false, error: data?.message || 'فشلت عملية حفظ وتسجيل السند المحاسبي.' };
  } catch (e: any) {
    console.error('[AccountingService] postVoucherFinancialTransaction exception:', e);
    return { success: false, error: e?.message || String(e) };
  }
}

// ──────────────────────────────────────────────
// Chart of Accounts
// ──────────────────────────────────────────────

export async function getAccounts(companyId: string): Promise<Account[]> {
  if (!isSupabaseConfigured) return [];

  const validCompanyId = ensureValidUuid(companyId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('chart_of_accounts') as any)
    .select('*')
    .eq('company_id', validCompanyId)
    .order('code', { ascending: true });

  if (error) {
    console.error('[AccountingService] getAccounts:', error.message);
    return [];
  }

  return (data ?? []).map(mapRowToAccount);
}

export async function upsertAccount(
  account: Account,
  companyId: string
): Promise<{ success: boolean; data?: Account; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  const validCompanyId = ensureValidUuid(companyId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('chart_of_accounts') as any)
    .upsert(
      {
        id: ensureValidUuid(account.id),
        company_id: validCompanyId,
        code: account.code,
        name_ar: account.nameAr,
        name_en: account.nameEn,
        account_type: account.type,
        account_category: account.category,
        parent_id: ensureNullableUuid(account.parentId),
        is_posting: account.isPosting ?? false,
        normal_balance: account.normalBalance ?? null,
        allow_manual_posting: account.allowManualPosting ?? true,
        opening_balance: account.openingBalance ?? 0,
        current_balance: account.currentBalance ?? 0,
        currency: account.currency ?? 'OMR',
        description: account.description ?? '',
        is_system: account.isSystem ?? false,
        is_active: account.isActive ?? true,
        branch_id: ensureNullableUuid(account.branchId),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: mapRowToAccount(data) };
}

// ──────────────────────────────────────────────
// Journal Entries
// ──────────────────────────────────────────────

export async function getJournalEntries(companyId: string): Promise<JournalEntry[]> {
  if (!isSupabaseConfigured) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('journal_entries') as any)
    .select('*, journal_entry_lines(*)')
    .eq('company_id', companyId)
    .order('date', { ascending: false });

  if (error) {
    console.error('[AccountingService] getJournalEntries:', error.message);
    return [];
  }

  return (data ?? []).map(mapRowToJournalEntry);
}

export async function saveJournalEntry(
  entry: JournalEntry,
  companyId: string
): Promise<{ success: boolean; data?: JournalEntry; error?: string }> {
  // 1. Validate double-entry invariant first (pure business rule)
  const totalDebit = entry.lines?.reduce((s, l) => s + (l.debit ?? 0), 0) ?? 0;
  const totalCredit = entry.lines?.reduce((s, l) => s + (l.credit ?? 0), 0) ?? 0;
  if (Math.abs(totalDebit - totalCredit) > 0.001) {
    return {
      success: false,
      error: `خلل في القيد المزدوج: الدائن (${totalCredit.toFixed(3)}) ≠ المدين (${totalDebit.toFixed(3)})`,
    };
  }

  // 2. Safety: never allow direct edit of POSTED, LOCKED, or REVERSED entries
  if (entry.status && ['POSTED', 'LOCKED', 'REVERSED'].includes(entry.status)) {
    return {
      success: false,
      error: 'لا يمكن تعديل القيود المرحلة أو المقفلة مباشرة. استخدم عملية العكس (Reversal).',
    };
  }

  if (entry.id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase.from('journal_entries') as any)
      .select('status')
      .eq('id', entry.id)
      .maybeSingle();

    if (existing && ['POSTED', 'LOCKED', 'REVERSED'].includes(existing.status)) {
      return {
        success: false,
        error: 'لا يمكن تعديل القيود المرحلة أو المقفلة مباشرة. استخدم عملية العكس (Reversal).',
      };
    }
  }

  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  const entryRow = {
    id: entry.id,
    company_id: companyId,
    entry_number: entry.entryNumber,
    date: entry.date,
    type: entry.type,
    status: entry.status,
    reference_type: entry.referenceType ?? null,
    reference_id: entry.referenceId ?? null,
    reference_number: entry.referenceNumber ?? '',
    description_ar: entry.descriptionAr,
    description_en: entry.descriptionEn ?? '',
    branch_id: entry.branchId ?? null,
    branch_name: entry.branchName ?? '',
    currency: entry.currency ?? 'OMR',
    total_debit: entry.totalDebit ?? 0,
    total_credit: entry.totalCredit ?? 0,
    is_balanced: entry.isBalanced ?? (Math.abs(totalDebit - totalCredit) < 0.001),
    created_by: entry.createdBy ?? '',
    reviewed_by: entry.reviewedBy ?? null,
    approved_by: entry.approvedBy ?? null,
    posted_by: entry.postedBy ?? null,
    posted_at: entry.postedAt ?? null,
    reversed_entry_id: entry.reversedEntryId ?? null,
    reversal_entry_id: entry.reversalEntryId ?? null,
    reversal_reason: entry.reversalReason ?? null,
    notes: entry.notes ?? '',
    updated_at: new Date().toISOString(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('journal_entries') as any)
    .upsert(entryRow, { onConflict: 'id' })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  // Upsert lines
  if (entry.lines && entry.lines.length > 0) {
    const lines = entry.lines.map((l: JournalEntryLine) => ({
      id: l.id,
      journal_entry_id: data.id,
      account_id: l.accountId,
      account_code: l.accountCode ?? '',
      account_name_ar: l.accountNameAr ?? '',
      account_name_en: l.accountNameEn ?? '',
      debit: l.debit ?? 0,
      credit: l.credit ?? 0,
      description_ar: l.descriptionAr ?? '',
      description_en: l.descriptionEn ?? '',
      cost_center_id: l.costCenterId ?? null,
      cost_center_name: l.costCenterName ?? '',
      branch_id: l.branchId ?? null,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: linesError } = await (supabase.from('journal_entry_lines') as any)
      .upsert(lines, { onConflict: 'id' });

    if (linesError) return { success: false, error: linesError.message };
  }

  return { success: true, data: mapRowToJournalEntry({ ...data, journal_entry_lines: entry.lines }) };
}

// ──────────────────────────────────────────────
// Fiscal Periods
// ──────────────────────────────────────────────

export async function getFiscalPeriods(companyId: string): Promise<FiscalPeriod[]> {
  if (!isSupabaseConfigured) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('fiscal_periods') as any)
    .select('*')
    .eq('company_id', companyId)
    .order('fiscal_year', { ascending: false });

  if (error) {
    console.error('[AccountingService] getFiscalPeriods:', error.message);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any): FiscalPeriod => ({
    id: row.id,
    year: row.year,
    periodNumber: row.period_number ?? 1,
    nameAr: row.name_ar ?? '',
    nameEn: row.name_en ?? '',
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status ?? 'OPEN',
    closedAt: row.closed_at ?? undefined,
    closedBy: row.closed_by ?? undefined,
  }));
}

// ──────────────────────────────────────────────
// Cost Centers
// ──────────────────────────────────────────────

export async function getCostCenters(companyId: string): Promise<CostCenter[]> {
  if (!isSupabaseConfigured) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('cost_centers') as any)
    .select('*')
    .eq('company_id', companyId)
    .order('code', { ascending: true });

  if (error) {
    console.error('[AccountingService] getCostCenters:', error.message);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any): CostCenter => ({
    id: row.id,
    code: row.code ?? '',
    nameAr: row.name_ar ?? '',
    nameEn: row.name_en ?? '',
    parentId: row.parent_id ?? undefined,
    description: row.description ?? '',
    isActive: row.is_active ?? true,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  }));
}

// ──────────────────────────────────────────────
// Accounting Revision Log
// ──────────────────────────────────────────────

export async function logAccountingRevision(
  log: AccountingRevisionLog,
  companyId: string
): Promise<void> {
  if (!isSupabaseConfigured) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('audit_logs') as any).insert({
    company_id: companyId,
    module: 'ACCOUNTING',
    action: log.action,
    entity_type: log.entityType,
    entity_id: log.entityId,
    description_ar: log.detailsAr,
    description_en: log.detailsEn,
    performed_by: log.userId ?? null,
    performed_by_name: log.userName ?? '',
    performed_at: log.timestamp,
  });
}

// ──────────────────────────────────────────────
// Mappers
// ──────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToAccount(row: any): Account {
  return {
    id: row.id,
    code: row.code ?? '',
    nameAr: row.name_ar ?? '',
    nameEn: row.name_en ?? '',
    type: row.account_type ?? 'ASSET',
    category: row.account_category ?? 'CURRENT_ASSET',
    parentId: row.parent_id ?? undefined,
    isPosting: row.is_posting ?? false,
    normalBalance: row.normal_balance ?? undefined,
    allowManualPosting: row.allow_manual_posting ?? true,
    openingBalance: row.opening_balance ?? 0,
    currentBalance: row.current_balance ?? 0,
    currency: row.currency ?? 'OMR',
    description: row.description ?? '',
    isSystem: row.is_system ?? false,
    isActive: row.is_active ?? true,
    branchId: row.branch_id ?? undefined,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToJournalEntry(row: any): JournalEntry {
  return {
    id: row.id,
    entryNumber: row.entry_number ?? '',
    date: row.date,
    type: row.type ?? 'STANDARD',
    status: row.status ?? 'DRAFT',
    referenceType: row.reference_type ?? undefined,
    referenceId: row.reference_id ?? undefined,
    referenceNumber: row.reference_number ?? '',
    descriptionAr: row.description_ar ?? '',
    descriptionEn: row.description_en ?? '',
    branchId: row.branch_id ?? undefined,
    branchName: row.branch_name ?? '',
    currency: row.currency ?? 'OMR',
    totalDebit: row.total_debit ?? 0,
    totalCredit: row.total_credit ?? 0,
    isBalanced: row.is_balanced ?? false,
    createdBy: row.created_by ?? '',
    reviewedBy: row.reviewed_by ?? undefined,
    approvedBy: row.approved_by ?? undefined,
    postedBy: row.posted_by ?? undefined,
    postedAt: row.posted_at ?? undefined,
    reversedEntryId: row.reversed_entry_id ?? undefined,
    reversalEntryId: row.reversal_entry_id ?? undefined,
    reversalReason: row.reversal_reason ?? undefined,
    notes: row.notes ?? '',
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lines: (row.journal_entry_lines ?? []).map((l: any): JournalEntryLine => ({
      id: l.id,
      accountId: l.account_id,
      accountCode: l.account_code ?? '',
      accountNameAr: l.account_name_ar ?? '',
      accountNameEn: l.account_name_en ?? '',
      debit: l.debit ?? 0,
      credit: l.credit ?? 0,
      descriptionAr: l.description_ar ?? '',
      descriptionEn: l.description_en ?? '',
      costCenterId: l.cost_center_id ?? undefined,
      costCenterName: l.cost_center_name ?? '',
      branchId: l.branch_id ?? undefined,
    })),
  };
}
