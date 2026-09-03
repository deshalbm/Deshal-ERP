import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  FileSpreadsheet,
  Layers,
  Scale,
  TrendingUp,
  Landmark,
  History,
  Plus,
  Filter,
  Search,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  Unlock,
  RefreshCw,
  Building2,
  Calendar,
  Eye,
  FileCheck,
  ChevronDown,
  ChevronRight,
  ArrowRightLeft,
  Sparkles,
  Copy,
  RotateCcw,
  Settings,
  ShieldCheck,
  Check
} from 'lucide-react';
import {
  Account,
  JournalEntry,
  JournalEntryType,
  JournalEntryStatus,
  AccountingRevisionLog,
  FiscalPeriod,
  FinancialReportPeriodFilter,
  Branch,
  CompanySettings,
  ReceiptVoucher,
  PurchaseInvoice,
  PayrollSlip,
  BankAccount,
  CostCenter,
  AccountingSettings
} from '../../types';
import { useLanguage } from '../../utils/LanguageContext';
import {
  calculateAccountLedger,
  generateTrialBalance,
  generateIncomeStatement,
  generateBalanceSheet,
  diagnoseBalanceDiscrepancies,
  autoRebalanceOpeningBalances,
  postAllValidDraftEntries,
  autoBalanceSpecificEntry,
  createBalancingAdjustingEntry,
  syncOperationalTransactionsToLedger,
  logAccountingRevision,
  loadAccountingRevisionLogs,
  postJournalEntry,
  reverseJournalEntry,
  duplicateJournalEntry,
  deactivateAccount,
  loadAccountingSettings,
  loadBankAccounts,
  loadCostCenters,
  loadFiscalPeriods
} from '../../utils/accountingStorage';
import { JournalEntryModal } from './JournalEntryModal';
import { JournalEntryDetailsModal } from './JournalEntryDetailsModal';
import { AccountStatementModal } from './AccountStatementModal';
import { AccountFormModal } from './AccountFormModal';
import { ReverseEntryModal } from './ReverseEntryModal';
import { BankReconciliationTab } from './BankReconciliationTab';
import { CostCentersTab } from './CostCentersTab';
import { AccountingSettingsTab } from './AccountingSettingsTab';

export interface GeneralLedgerAccountsViewProps {
  accounts: Account[];
  journalEntries: JournalEntry[];
  revisionLogs: AccountingRevisionLog[];
  fiscalPeriods: FiscalPeriod[];
  branches: Branch[];
  companySettings: CompanySettings;
  vouchers: ReceiptVoucher[];
  purchases: PurchaseInvoice[];
  payrollSlips: PayrollSlip[];
  onSaveAccounts: (accounts: Account[]) => void;
  onSaveJournalEntries: (entries: JournalEntry[]) => void;
  onSaveRevisionLogs?: (logs: AccountingRevisionLog[]) => void;
  onSaveFiscalPeriods?: (periods: FiscalPeriod[]) => void;
  currentUserName?: string;
  activeBranchId?: string;
}

export const GeneralLedgerAccountsView: React.FC<GeneralLedgerAccountsViewProps> = ({
  accounts,
  journalEntries,
  revisionLogs,
  fiscalPeriods: initialFiscalPeriods,
  branches,
  companySettings,
  vouchers,
  purchases,
  payrollSlips,
  onSaveAccounts,
  onSaveJournalEntries,
  onSaveRevisionLogs,
  onSaveFiscalPeriods,
  currentUserName = 'المحاسب المسؤول',
  activeBranchId = 'all'
}) => {
  const { t, isRTL } = useLanguage();

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState<
    | 'journal'
    | 'adjusting'
    | 'accounts'
    | 'reconciliation'
    | 'trial-balance'
    | 'income-statement'
    | 'balance-sheet'
    | 'cost-centers'
    | 'settings'
    | 'revision-log'
  >('journal');

  // Filters State
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>('2026-12-31');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Loaded sub-entities
  const [accountingSettings, setAccountingSettings] = useState<AccountingSettings>(() => loadAccountingSettings());
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => loadBankAccounts());
  const [costCenters, setCostCenters] = useState<CostCenter[]>(() => loadCostCenters());
  const [fiscalPeriodsState, setFiscalPeriodsState] = useState<FiscalPeriod[]>(() =>
    initialFiscalPeriods && initialFiscalPeriods.length > 0 ? initialFiscalPeriods : loadFiscalPeriods()
  );

  // Modals
  const [isEntryModalOpen, setIsEntryModalOpen] = useState<boolean>(false);
  const [entryModalType, setEntryModalType] = useState<JournalEntryType>('STANDARD');
  const [selectedEntryForEdit, setSelectedEntryForEdit] = useState<JournalEntry | null>(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const [selectedEntryForDetails, setSelectedEntryForDetails] = useState<JournalEntry | null>(null);

  const [isReverseModalOpen, setIsReverseModalOpen] = useState<boolean>(false);
  const [selectedEntryForReverse, setSelectedEntryForReverse] = useState<JournalEntry | null>(null);

  const [isStatementModalOpen, setIsStatementModalOpen] = useState<boolean>(false);
  const [selectedAccountForStatement, setSelectedAccountForStatement] = useState<Account | null>(null);

  const [isAccountFormModalOpen, setIsAccountFormModalOpen] = useState<boolean>(false);
  const [selectedAccountForEdit, setSelectedAccountForEdit] = useState<Account | null>(null);

  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshAllSubData = () => {
    setAccountingSettings(loadAccountingSettings());
    setBankAccounts(loadBankAccounts());
    setCostCenters(loadCostCenters());
    setFiscalPeriodsState(loadFiscalPeriods());
  };

  // Period Filter Object
  const periodFilter: FinancialReportPeriodFilter = useMemo(
    () => ({
      startDate,
      endDate,
      branchId: selectedBranchId,
      includeDrafts: false
    }),
    [startDate, endDate, selectedBranchId]
  );

  // Computed Financial Statements & Calculations
  const calculatedAccounts = useMemo(
    () => calculateAccountLedger(accounts, journalEntries, periodFilter),
    [accounts, journalEntries, periodFilter]
  );

  const trialBalance = useMemo(
    () => generateTrialBalance(accounts, journalEntries, periodFilter),
    [accounts, journalEntries, periodFilter]
  );

  const incomeStatement = useMemo(
    () => generateIncomeStatement(accounts, journalEntries, periodFilter),
    [accounts, journalEntries, periodFilter]
  );

  const balanceSheet = useMemo(
    () => generateBalanceSheet(accounts, journalEntries, periodFilter),
    [accounts, journalEntries, periodFilter]
  );

  const balanceDiagnostic = useMemo(
    () =>
      diagnoseBalanceDiscrepancies(
        accounts,
        journalEntries,
        vouchers,
        purchases,
        payrollSlips,
        periodFilter
      ),
    [accounts, journalEntries, vouchers, purchases, payrollSlips, periodFilter]
  );

  // Quick Action: Auto Rebalance Opening Balances
  const handleAutoRebalanceOpening = () => {
    const { updatedAccounts, revisionLog } = autoRebalanceOpeningBalances(accounts, currentUserName);
    onSaveAccounts(updatedAccounts);
    if (onSaveRevisionLogs) {
      onSaveRevisionLogs([revisionLog, ...revisionLogs]);
    }
    setNotificationMessage('تمت موازنة الأرصدة الافتتاحية بنجاح وضبط حساب الأرباح المبقاة والمدورة!');
    setTimeout(() => setNotificationMessage(null), 5000);
  };

  // Quick Action: Post All Valid Draft Entries
  const handlePostAllDrafts = () => {
    const { updatedEntries, postedCount } = postAllValidDraftEntries(journalEntries, currentUserName);
    if (postedCount > 0) {
      onSaveJournalEntries(updatedEntries);
      if (onSaveRevisionLogs) {
        onSaveRevisionLogs(loadAccountingRevisionLogs());
      }
      setNotificationMessage(`تم ترحيل ${postedCount} قيد مسودة متوازن بنجاح للأستاذ العام!`);
    } else {
      setNotificationMessage('لا توجد قيود مسودة متوازنة جاهزة للترحيل.');
    }
    setTimeout(() => setNotificationMessage(null), 5000);
  };

  // Quick Action: Auto Balance Specific Entry
  const handleAutoBalanceEntry = (entryId: string) => {
    const { updatedEntries, balancedEntry } = autoBalanceSpecificEntry(
      entryId,
      journalEntries,
      accounts,
      currentUserName
    );
    onSaveJournalEntries(updatedEntries);
    if (onSaveRevisionLogs) {
      onSaveRevisionLogs(loadAccountingRevisionLogs());
    }
    setNotificationMessage(
      `تم موازنة القيد ${balancedEntry.entryNumber} وإضافة بند التسوية المحاسبي بنجاح!`
    );
    setTimeout(() => setNotificationMessage(null), 5000);
  };

  // Quick Action: Generate Balancing Adjusting Entry
  const handleCreateBalancingAdjustingEntry = (variance: number) => {
    const newEntry = createBalancingAdjustingEntry(variance, accounts, currentUserName);
    onSaveJournalEntries([newEntry, ...journalEntries]);
    if (onSaveRevisionLogs) {
      onSaveRevisionLogs(loadAccountingRevisionLogs());
    }
    setNotificationMessage(`تم توليد قيد التسوية ${newEntry.entryNumber} لموازنة المركز المالي بنجاح!`);
    setTimeout(() => setNotificationMessage(null), 5000);
  };

  // Journal Entries Filter
  const filteredJournalEntries = useMemo(() => {
    return journalEntries.filter((entry) => {
      if (activeTab === 'adjusting' && entry.type !== 'ADJUSTING' && entry.type !== 'CLOSING') {
        return false;
      }
      if (activeTab === 'journal' && (entry.type === 'ADJUSTING' || entry.type === 'CLOSING')) {
        // Can still show, or show all
      }
      if (statusFilter !== 'ALL' && entry.status !== statusFilter) {
        return false;
      }
      if (selectedBranchId !== 'all' && entry.branchId && entry.branchId !== selectedBranchId) {
        return false;
      }
      if (startDate && entry.date < startDate) return false;
      if (endDate && entry.date > endDate) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNumber = entry.entryNumber.toLowerCase().includes(q);
        const matchDesc = entry.descriptionAr.toLowerCase().includes(q);
        const matchRef = entry.referenceNumber?.toLowerCase().includes(q);
        const matchLine = entry.lines.some(
          (l) => l.accountNameAr.toLowerCase().includes(q) || l.accountCode.includes(q)
        );
        return matchNumber || matchDesc || matchRef || matchLine;
      }
      return true;
    });
  }, [journalEntries, activeTab, statusFilter, selectedBranchId, startDate, endDate, searchQuery]);

  // Handle Save Journal Entry
  const handleSaveEntry = (newEntry: JournalEntry) => {
    const exists = journalEntries.some((e) => e.id === newEntry.id);
    let updated: JournalEntry[];
    if (exists) {
      updated = journalEntries.map((e) => (e.id === newEntry.id ? newEntry : e));
      logAccountingRevision(
        'user-1',
        currentUserName,
        'EDIT',
        'JOURNAL_ENTRY',
        newEntry.id,
        newEntry.entryNumber,
        `تعديل بيانات القيد المحاسبي ${newEntry.entryNumber}`,
        `Updated journal entry ${newEntry.entryNumber}`
      );
    } else {
      updated = [newEntry, ...journalEntries];
      logAccountingRevision(
        'user-1',
        currentUserName,
        newEntry.status === 'POSTED' ? 'POST' : 'CREATE',
        'JOURNAL_ENTRY',
        newEntry.id,
        newEntry.entryNumber,
        `إنشاء ${newEntry.status === 'POSTED' ? 'وترحيل' : ''} القيد ${newEntry.entryNumber}: ${newEntry.descriptionAr}`,
        `Created journal entry ${newEntry.entryNumber}`
      );
    }

    onSaveJournalEntries(updated);
    setNotificationMessage(`تم حفظ القيد المحاسبي ${newEntry.entryNumber} بنجاح!`);
    setTimeout(() => setNotificationMessage(null), 4000);
  };

  // Handle Save Account
  const handleSaveAccount = (newAcc: Account) => {
    const exists = accounts.some((a) => a.id === newAcc.id);
    let updated: Account[];
    if (exists) {
      updated = accounts.map((a) => (a.id === newAcc.id ? newAcc : a));
    } else {
      updated = [...accounts, newAcc].sort((a, b) => a.code.localeCompare(b.code));
    }
    onSaveAccounts(updated);
    logAccountingRevision(
      'user-1',
      currentUserName,
      exists ? 'EDIT' : 'CREATE',
      'ACCOUNT',
      newAcc.id,
      newAcc.code,
      `${exists ? 'تعديل' : 'إضافة'} الحساب ${newAcc.code} - ${newAcc.nameAr}`,
      `Account ${newAcc.code} saved`
    );
    setNotificationMessage(`تم حفظ الحساب ${newAcc.code} - ${newAcc.nameAr} بنجاح!`);
    setTimeout(() => setNotificationMessage(null), 4000);
  };

  // Handle Post Entry to Ledger with Strict Validation
  const handlePostEntry = (entry: JournalEntry) => {
    try {
      const result = postJournalEntry(
        entry.id,
        journalEntries,
        accounts,
        fiscalPeriodsState,
        accountingSettings,
        currentUserName
      );
      if (!result.success) {
        setErrorMessage(result.message || 'تعذر ترحيل القيد. يرجى التحقق من توازن القيد وحالة الفترة المالية.');
        setTimeout(() => setErrorMessage(null), 6000);
        return;
      }
      onSaveJournalEntries(result.updatedEntries);
      if (onSaveRevisionLogs) {
        onSaveRevisionLogs(loadAccountingRevisionLogs());
      }
      setIsDetailsModalOpen(false);
      setNotificationMessage(`تم ترحيل القيد ${entry.entryNumber} للأستاذ العام بنجاح واعتماد توازنه!`);
      setTimeout(() => setNotificationMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'تعذر ترحيل القيد. يرجى التحقق من توازن القيد وحالة الفترة المالية.');
      setTimeout(() => setErrorMessage(null), 6000);
    }
  };

  // Open Reverse Modal
  const handleOpenReverseModal = (entry: JournalEntry) => {
    setSelectedEntryForReverse(entry);
    setIsReverseModalOpen(true);
  };

  // Handle Confirm Reverse Entry with Reason & Audit Log
  const handleConfirmReverse = (entryId: string, reason: string) => {
    try {
      const result = reverseJournalEntry(
        entryId,
        reason,
        journalEntries,
        accounts,
        fiscalPeriodsState,
        accountingSettings,
        currentUserName
      );
      if (!result.success) {
        setErrorMessage(result.message || 'تعذر عكس القيد.');
        setTimeout(() => setErrorMessage(null), 6000);
        return;
      }
      onSaveJournalEntries(result.updatedEntries);
      if (onSaveRevisionLogs) {
        onSaveRevisionLogs(loadAccountingRevisionLogs());
      }
      setIsDetailsModalOpen(false);
      setNotificationMessage(
        result.message || `تم إنشاء وترحيل القيد العكسي وتوثيق السبب في سجل التدقيق بنجاح!`
      );
      setTimeout(() => setNotificationMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'تعذر عكس القيد.');
      setTimeout(() => setErrorMessage(null), 6000);
    }
  };

  // Handle Duplicate Entry as Draft
  const handleDuplicateEntry = (entry: JournalEntry) => {
    try {
      const { updatedEntries, newDraftEntry } = duplicateJournalEntry(
        entry.id,
        journalEntries,
        currentUserName
      );
      onSaveJournalEntries(updatedEntries);
      if (onSaveRevisionLogs) {
        onSaveRevisionLogs(loadAccountingRevisionLogs());
      }
      setNotificationMessage(`تم إنشاء نسخة مسودة جديدة برقم ${newDraftEntry.entryNumber} بنجاح.`);
      setTimeout(() => setNotificationMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'تعذر تكرار القيد.');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  // Handle Toggle Account Active / Deactivate
  const handleToggleAccountActive = (account: Account) => {
    try {
      const result = deactivateAccount(
        account.id,
        accounts,
        journalEntries,
        currentUserName
      );
      if (!result.success) {
        setErrorMessage(result.message || 'تعذر تغيير حالة الحساب.');
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }
      onSaveAccounts(result.updatedAccounts);
      if (onSaveRevisionLogs) {
        onSaveRevisionLogs(loadAccountingRevisionLogs());
      }
      setNotificationMessage(
        result.message || `تم تعديل حالة الحساب ${account.code} - ${account.nameAr} بنجاح.`
      );
      setTimeout(() => setNotificationMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'تعذر تغيير حالة الحساب.');
      setTimeout(() => setErrorMessage(null), 6000);
    }
  };

  // Sync Operational Transactions (Vouchers, POS, Purchases, Payroll)
  const handleSyncOperationalData = () => {
    const result = syncOperationalTransactionsToLedger(
      vouchers,
      purchases,
      payrollSlips,
      journalEntries,
      currentUserName
    );
    if (result.newEntriesCount > 0) {
      onSaveJournalEntries(result.updatedEntries);
      logAccountingRevision(
        'user-1',
        currentUserName,
        'POST',
        'JOURNAL_ENTRY',
        'batch-sync',
        `SYNC-${Date.now()}`,
        `مزامنة وترحيل ${result.newEntriesCount} قيد محاسبي جديد من السندات وفواتير المشتريات ومسيرات الرواتب`,
        `Synchronized ${result.newEntriesCount} automated journal entries`
      );
      setNotificationMessage(
        `تمت المزامنة بنجاح! تم توليد وترحيل ${result.newEntriesCount} قيد محاسبي مزدوج ومتوازن للأستاذ العام.`
      );
    } else {
      setNotificationMessage('جميع السندات والفواتير والرواتب مرحلة مسبقاً ولا توجد حركات جديدة غير مرحلة.');
    }
    setTimeout(() => setNotificationMessage(null), 5000);
  };

  return (
    <div
      id="general-ledger-accounts-suite"
      className="space-y-6 pb-20 print:p-0 print:space-y-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-indigo-900/40 relative overflow-hidden print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black tracking-tight">
                  General Ledger & Accounts
                </h1>
                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  القيد المزدوج المؤسسي
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1">
                Consolidated double-entry financial statements, general journal, adjusting entries, trial balance, income statement, balance sheet & revision audit log
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 print:hidden">
            <button
              id="sync-ops-to-gl-btn"
              onClick={handleSyncOperationalData}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-400/30 rounded-2xl text-xs font-bold transition-all shadow-xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>مزامنة العمليات للأستاذ العام</span>
            </button>

            <button
              id="new-adjusting-entry-btn"
              onClick={() => {
                setSelectedEntryForEdit(null);
                setEntryModalType('ADJUSTING');
                setIsEntryModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 rounded-2xl text-xs font-bold transition-all shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>+ قيد تسوية فترية</span>
            </button>

            <button
              id="new-journal-entry-btn"
              onClick={() => {
                setSelectedEntryForEdit(null);
                setEntryModalType('STANDARD');
                setIsEntryModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md hover:shadow-indigo-500/25"
            >
              <Plus className="w-4 h-4" />
              <span>+ قيد يومية جديد</span>
            </button>
          </div>
        </div>

        {/* Global Filter Bar */}
        <div className="mt-6 pt-4 border-t border-indigo-800/60 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-400">الفرع:</span>
              <select
                id="accounting-branch-filter"
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900">جميع الفروع الموحدة (Consolidated)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-slate-900">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-400">الفترة:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-white font-mono focus:outline-none"
              />
              <span className="text-slate-400">إلى</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-white font-mono focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>دليل الحسابات نشط: <strong>{accounts.length}</strong> حساب</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
              <span>إجمالي القيود: <strong>{journalEntries.length}</strong> قيد</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {notificationMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-sm font-bold animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{notificationMessage}</span>
          </div>
          <button
            onClick={() => setNotificationMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-between text-sm font-bold animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-950 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        {/* Total Assets */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              إجمالي الأصول (Assets)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Landmark className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {balanceSheet.assets.totalAssets.toFixed(3)}
            </span>
            <span className="text-xs font-bold text-slate-400 mr-1.5">
              {companySettings.currency || 'OMR'}
            </span>
          </div>
          <span className="text-[11px] text-emerald-600 font-medium block mt-1">
            الأصول المتداولة: {balanceSheet.assets.currentAssets.total.toFixed(3)}
          </span>
        </div>

        {/* Total Liabilities & Equity */}
        <div
          onClick={() => {
            if (!balanceSheet.isBalanced) setActiveTab('balance-sheet');
          }}
          className={`bg-white p-5 rounded-3xl border shadow-xs hover:shadow-md transition-all ${
            !balanceSheet.isBalanced ? 'border-amber-300 cursor-pointer bg-amber-50/20' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              الالتزامات وحقوق الملكية
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {balanceSheet.totalLiabilitiesAndEquity.toFixed(3)}
            </span>
            <span className="text-xs font-bold text-slate-400 mr-1.5">
              {companySettings.currency || 'OMR'}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            {balanceSheet.isBalanced ? (
              <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>متوازنة مع الأصول (Balanced)</span>
              </span>
            ) : (
              <span className="text-[11px] text-amber-600 font-bold flex items-center gap-1 hover:underline">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>فارق تسوية: {balanceSheet.variance.toFixed(3)} (انقر للتشخيص)</span>
              </span>
            )}
          </div>
        </div>

        {/* Operating Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              إيرادات الفترة التشغيلية
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-purple-900 font-mono">
              {incomeStatement.operatingRevenue.total.toFixed(3)}
            </span>
            <span className="text-xs font-bold text-slate-400 mr-1.5">
              {companySettings.currency || 'OMR'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            إجمالي الربح (Gross): {incomeStatement.grossProfit.toFixed(3)}
          </span>
        </div>

        {/* Net Profit (P&L) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              صافي الربح المحاسبي (Net P&L)
            </span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                incomeStatement.netProfit >= 0
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-rose-50 text-rose-600'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span
              className={`text-2xl font-black font-mono ${
                incomeStatement.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {incomeStatement.netProfit.toFixed(3)}
            </span>
            <span className="text-xs font-bold text-slate-400 mr-1.5">
              {companySettings.currency || 'OMR'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            هامش الربح الصافي:{' '}
            {incomeStatement.operatingRevenue.total > 0
              ? `${(
                  (incomeStatement.netProfit / incomeStatement.operatingRevenue.total) *
                  100
                ).toFixed(1)}%`
              : '0%'}
          </span>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="bg-slate-200/70 p-1.5 rounded-2xl flex flex-wrap items-center gap-1 text-xs font-bold print:hidden shadow-inner">
        <button
          id="tab-general-journal-btn"
          onClick={() => setActiveTab('journal')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'journal'
              ? 'bg-white text-indigo-950 shadow-md scale-[1.02]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>دفتر اليومية (Journal)</span>
        </button>

        <button
          id="tab-adjusting-entries-btn"
          onClick={() => setActiveTab('adjusting')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'adjusting'
              ? 'bg-white text-indigo-950 shadow-md scale-[1.02]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>التسويات (Adjusting)</span>
        </button>

        <button
          id="tab-general-ledger-btn"
          onClick={() => setActiveTab('accounts')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'accounts'
              ? 'bg-white text-indigo-950 shadow-md scale-[1.02]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>دليل الحسابات (Ledger)</span>
        </button>

        <button
          id="tab-reconciliation-btn"
          onClick={() => setActiveTab('reconciliation')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'reconciliation'
              ? 'bg-white text-indigo-950 shadow-md scale-[1.02]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Landmark className="w-3.5 h-3.5 text-teal-600" />
          <span>التسوية البنكية (Recon)</span>
        </button>

        <button
          id="tab-trial-balance-btn"
          onClick={() => setActiveTab('trial-balance')}
          className={`flex-1 min-w-[125px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'trial-balance'
              ? 'bg-white text-indigo-950 shadow-md scale-[1.02]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>ميزان المراجعة</span>
          {!trialBalance.isBalanced && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="غير متوازن" />
          )}
        </button>

        <button
          id="tab-income-statement-btn"
          onClick={() => setActiveTab('income-statement')}
          className={`flex-1 min-w-[125px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'income-statement'
              ? 'bg-white text-indigo-950 shadow-md scale-[1.02]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          <span>قائمة الدخل (P&L)</span>
        </button>

        <button
          id="tab-balance-sheet-btn"
          onClick={() => setActiveTab('balance-sheet')}
          className={`flex-1 min-w-[125px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'balance-sheet'
              ? 'bg-white text-indigo-950 shadow-md scale-[1.02]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Landmark className="w-3.5 h-3.5 text-blue-600" />
          <span>المركز المالي</span>
          {!balanceSheet.isBalanced && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-black animate-pulse">
              فارق
            </span>
          )}
        </button>

        <button
          id="tab-cost-centers-btn"
          onClick={() => setActiveTab('cost-centers')}
          className={`flex-1 min-w-[125px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'cost-centers'
              ? 'bg-white text-indigo-950 shadow-md scale-[1.02]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-indigo-600" />
          <span>مراكز التكلفة</span>
        </button>

        <button
          id="tab-accounting-settings-btn"
          onClick={() => setActiveTab('settings')}
          className={`flex-1 min-w-[125px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'settings'
              ? 'bg-white text-indigo-950 shadow-md scale-[1.02]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Settings className="w-3.5 h-3.5 text-slate-700" />
          <span>الإعدادات والفترات</span>
        </button>

        <button
          id="tab-revision-log-btn"
          onClick={() => setActiveTab('revision-log')}
          className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'revision-log'
              ? 'bg-white text-indigo-950 shadow-md scale-[1.02]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <History className="w-3.5 h-3.5 text-slate-500" />
          <span>سجل التدقيق</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. GENERAL JOURNAL & ADJUSTING ENTRIES TAB */}
      {/* ========================================================================= */}
      {(activeTab === 'journal' || activeTab === 'adjusting') && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Table Header Controls */}
          <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="journal-search-input"
                  type="text"
                  placeholder="البحث برقم القيد، البيان، الحساب، أو المرجع..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white pr-10 pl-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>

              <select
                id="journal-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold text-slate-700"
              >
                <option value="ALL">جميع الحالات (All Status)</option>
                <option value="POSTED">مرحل للأستاذ (POSTED)</option>
                <option value="DRAFT">مسودات (DRAFT)</option>
                <option value="LOCKED">مغلق فترية (LOCKED)</option>
                <option value="CANCELLED">ملغى (CANCELLED)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">
                إجمالي القيود المعروضة: <strong>{filteredJournalEntries.length}</strong>
              </span>
              <button
                id="print-journal-table-btn"
                onClick={() => window.print()}
                className="p-2 border border-slate-300 bg-white hover:bg-slate-100 rounded-xl text-slate-700 transition-colors"
                title="طباعة دفتر اليومية"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Journal Entries List Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-28 font-mono">رقم القيد</th>
                  <th className="py-3 px-3 w-24">التاريخ</th>
                  <th className="py-3 px-3 w-28">نوع القيد</th>
                  <th className="py-3 px-4">البيان والشرح العام وأطراف القيد</th>
                  <th className="py-3 px-3 w-32 text-center text-emerald-800 bg-emerald-50/50 font-bold">
                    إجمالي المدين
                  </th>
                  <th className="py-3 px-3 w-32 text-center text-blue-800 bg-blue-50/50 font-bold">
                    إجمالي الدائن
                  </th>
                  <th className="py-3 px-3 w-28 text-center">الحالة</th>
                  <th className="py-3 px-3 w-28 text-center print:hidden">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJournalEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => {
                      setSelectedEntryForDetails(entry);
                      setIsDetailsModalOpen(true);
                    }}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                      {entry.entryNumber}
                      {entry.referenceNumber && (
                        <span className="block text-[10px] text-slate-400 font-mono font-normal">
                          {entry.referenceNumber}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-700">{entry.date}</td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                          entry.type === 'ADJUSTING'
                            ? 'bg-amber-100 text-amber-800'
                            : entry.type === 'OPENING'
                            ? 'bg-purple-100 text-purple-800'
                            : entry.type === 'REVERSAL'
                            ? 'bg-rose-100 text-rose-800'
                            : entry.type === 'AUTOMATED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {entry.type === 'ADJUSTING'
                          ? 'تسوية'
                          : entry.type === 'OPENING'
                          ? 'افتتاحي'
                          : entry.type === 'REVERSAL'
                          ? 'عكسي'
                          : entry.type === 'AUTOMATED'
                          ? 'آلي'
                          : 'يومية'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 line-clamp-1">{entry.descriptionAr}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {entry.lines.map((l, lIdx) => (
                          <span
                            key={l.id || lIdx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-700 font-medium"
                          >
                            <span className="font-mono font-bold text-indigo-700">{l.accountCode}</span>
                            <span>{l.accountNameAr}</span>
                            <span className="text-slate-400 font-mono">
                              ({l.debit > 0 ? `+${Number(l.debit).toFixed(2)}` : `-${Number(l.credit).toFixed(2)}`})
                            </span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-emerald-700 bg-emerald-50/20">
                      {Number(entry.totalDebit).toFixed(3)}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-blue-700 bg-blue-50/20">
                      {Number(entry.totalCredit).toFixed(3)}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          entry.status === 'POSTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : entry.status === 'LOCKED'
                            ? 'bg-purple-100 text-purple-800'
                            : entry.status === 'DRAFT'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {entry.status === 'POSTED' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>مرحل</span>
                          </>
                        ) : entry.status === 'LOCKED' ? (
                          <>
                            <Lock className="w-3 h-3" />
                            <span>مغلق</span>
                          </>
                        ) : (
                          <span>مسودة</span>
                        )}
                      </span>
                    </td>
                    <td
                      className="py-3.5 px-3 text-center print:hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedEntryForDetails(entry);
                            setIsDetailsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="عرض السند وتفاصيله"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicateEntry(entry)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          title="تكرار القيد كمسودة جديدة"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {entry.status === 'DRAFT' && (
                          <button
                            onClick={() => handlePostEntry(entry)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors font-bold"
                            title="ترحيل القيد للأستاذ العام"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {entry.status === 'POSTED' && (
                          <button
                            onClick={() => handleOpenReverseModal(entry)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="عكس القيد محاسبياً (Reversal)"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredJournalEntries.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p className="font-bold">لا توجد قيود يومية مطابقة للبحث أو الفترة المحددة</p>
                      <p className="text-xs mt-1">
                        يمكنك إضافة قيد يدوي جديد أو مزامنة العمليات التشغيلية التلقائية
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. GENERAL LEDGER & CHART OF ACCOUNTS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'accounts' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                شجرة دليل الحسابات ودفتر الأستاذ (Chart of Accounts & General Ledger)
              </h3>
              <p className="text-xs text-slate-500">
                انقر على أي حساب لاستعراض كشف حركاته ورصيده التراكمي في الأستاذ العام
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="add-new-account-btn"
                onClick={() => {
                  setSelectedAccountForEdit(null);
                  setIsAccountFormModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ إضافة حساب جديد</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-28 font-mono">رمز الحساب</th>
                  <th className="py-3 px-4 min-w-[200px]">اسم الحساب بالعربية</th>
                  <th className="py-3 px-4">English Name</th>
                  <th className="py-3 px-3 w-28 text-center">النوع الرئيسي</th>
                  <th className="py-3 px-3 w-32 text-center text-emerald-800 bg-emerald-50/50">
                    حركات المدين (Debit)
                  </th>
                  <th className="py-3 px-3 w-32 text-center text-blue-800 bg-blue-50/50">
                    حركات الدائن (Credit)
                  </th>
                  <th className="py-3 px-4 w-36 text-center text-slate-900 font-bold">
                    الرصيد الصافي ({companySettings.currency || 'OMR'})
                  </th>
                  <th className="py-3 px-3 w-24 text-center print:hidden">كشف الحساب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {calculatedAccounts.map((acc) => {
                  const isHeader = !acc.isPosting;
                  return (
                    <tr
                      key={acc.id}
                      onClick={() => {
                        if (acc.isPosting) {
                          setSelectedAccountForStatement(acc);
                          setIsStatementModalOpen(true);
                        }
                      }}
                      className={`transition-colors ${
                        isHeader
                          ? 'bg-slate-100/80 font-bold text-slate-900 cursor-default'
                          : 'hover:bg-indigo-50/40 text-slate-800 cursor-pointer'
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-indigo-900">
                        {acc.code}
                      </td>
                      <td className="py-3 px-4">
                        <span className={isHeader ? 'text-sm font-black' : 'font-semibold'}>
                          {acc.nameAr}
                        </span>
                        {acc.description && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {acc.description}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-500">{acc.nameEn}</td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            acc.type === 'ASSET'
                              ? 'bg-emerald-100 text-emerald-800'
                              : acc.type === 'LIABILITY'
                              ? 'bg-rose-100 text-rose-800'
                              : acc.type === 'EQUITY'
                              ? 'bg-blue-100 text-blue-800'
                              : acc.type === 'REVENUE'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {acc.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700 bg-emerald-50/20">
                        {acc.isPosting ? Number(acc.totalDebit || 0).toFixed(3) : '-'}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-blue-700 bg-blue-50/20">
                        {acc.isPosting ? Number(acc.totalCredit || 0).toFixed(3) : '-'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 bg-slate-50/50">
                        {acc.isPosting ? Number(acc.currentBalance || 0).toFixed(3) : '-'}
                      </td>
                      <td className="py-3 px-3 text-center print:hidden">
                        {acc.isPosting && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAccountForStatement(acc);
                              setIsStatementModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>كشف</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TRIAL BALANCE TAB (ميزان المراجعة بالمجاميع والأرصدة) */}
      {/* ========================================================================= */}
      {activeTab === 'trial-balance' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-slate-900">
                  ميزان المراجعة بالأرصدة والمجاميع (Trial Balance)
                </h3>
                {trialBalance.isBalanced ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>ميزان متوازن محاسبياً (Verified Balanced)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>غير متوازن</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                التحقق الشامل من تساوي إجمالي الأرصدة المدينة والدائنة لجميع الحسابات
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors print:hidden"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة ميزان المراجعة</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900 text-white font-bold">
                <tr>
                  <th rowSpan={2} className="py-2.5 px-3 w-24 font-mono text-center border-l border-slate-800">
                    رمز الحساب
                  </th>
                  <th rowSpan={2} className="py-2.5 px-4 min-w-[200px] border-l border-slate-800">
                    اسم الحساب المحاسبي
                  </th>
                  <th colSpan={2} className="py-2 px-3 text-center border-b border-l border-slate-700 bg-slate-800/80">
                    أرصدة أول المدة الافتتاحية
                  </th>
                  <th colSpan={2} className="py-2 px-3 text-center border-b border-l border-slate-700 bg-indigo-950/80">
                    حركات الفترة (Movements)
                  </th>
                  <th colSpan={2} className="py-2 px-3 text-center bg-slate-800/80">
                    أرصدة نهاية الفترة (Closing)
                  </th>
                </tr>
                <tr className="bg-slate-800 text-[11px] text-slate-300">
                  <th className="py-1.5 px-3 text-center text-emerald-300 border-l border-slate-700 w-28">مدين Dr</th>
                  <th className="py-1.5 px-3 text-center text-blue-300 border-l border-slate-700 w-28">دائن Cr</th>
                  <th className="py-1.5 px-3 text-center text-emerald-300 border-l border-slate-700 w-28">مدين Dr</th>
                  <th className="py-1.5 px-3 text-center text-blue-300 border-l border-slate-700 w-28">دائن Cr</th>
                  <th className="py-1.5 px-3 text-center text-emerald-300 border-l border-slate-700 w-28">مدين Dr</th>
                  <th className="py-1.5 px-3 text-center text-blue-300 w-28">دائن Cr</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trialBalance.rows.map((row, idx) => (
                  <tr key={row.accountId} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-900 text-center">
                      {row.accountCode}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">
                      {row.accountNameAr}
                      <span className="text-slate-400 font-normal mr-2">({row.type})</span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-700">
                      {row.openingDebit > 0 ? row.openingDebit.toFixed(3) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-700">
                      {row.openingCredit > 0 ? row.openingCredit.toFixed(3) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700 bg-emerald-50/30">
                      {row.periodDebit > 0 ? row.periodDebit.toFixed(3) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-700 bg-blue-50/30">
                      {row.periodCredit > 0 ? row.periodCredit.toFixed(3) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-900 bg-slate-100/50">
                      {row.closingDebit > 0 ? row.closingDebit.toFixed(3) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-900 bg-slate-100/50">
                      {row.closingCredit > 0 ? row.closingCredit.toFixed(3) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-900 text-white font-bold text-xs border-t-2 border-slate-900">
                <tr>
                  <td colSpan={2} className="py-3 px-4 text-right">
                    <span>الإجمالي الكلي المتطابق (Total Balances):</span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-emerald-300">
                    {trialBalance.totalOpeningDebit.toFixed(3)}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-blue-300">
                    {trialBalance.totalOpeningCredit.toFixed(3)}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-emerald-300 text-sm">
                    {trialBalance.totalPeriodDebit.toFixed(3)}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-blue-300 text-sm">
                    {trialBalance.totalPeriodCredit.toFixed(3)}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-emerald-300 text-sm">
                    {trialBalance.totalClosingDebit.toFixed(3)}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-blue-300 text-sm">
                    {trialBalance.totalClosingCredit.toFixed(3)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. INCOME STATEMENT (P&L - قائمة الدخل والأرباح والخسائر) */}
      {/* ========================================================================= */}
      {activeTab === 'income-statement' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 space-y-6 max-w-4xl mx-auto">
          {/* Statement Title Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {companySettings.companyNameAr || 'مجموعة دشال للاستثمار ش.م.م'}
              </h2>
              <h3 className="text-xs text-slate-500">
                {companySettings.companyNameEn || 'Deshal Investment Group LLC'}
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                قائمة الدخل والأرباح والخسائر الشاملة (IFRS Compliant Income Statement)
              </p>
            </div>

            <div className="text-left space-y-1">
              <span className="inline-block px-3 py-1 rounded-lg bg-emerald-900 text-white font-bold text-sm">
                قائمة الدخل (P&L)
              </span>
              <div className="text-xs text-slate-500 font-mono">FOR THE PERIOD ENDED 2026</div>
              <div className="text-xs text-slate-600 font-medium">
                الفترة: {startDate} إلى {endDate}
              </div>
            </div>
          </div>

          {/* Statement Breakdown Sections */}
          <div className="space-y-4 text-xs">
            {/* 1. Operating Revenue */}
            <div className="space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-900 bg-slate-100 p-2.5 rounded-xl">
                <span>1. الإيرادات التشغيلية (Operating Revenues)</span>
                <span className="font-mono text-sm text-emerald-800">
                  {incomeStatement.operatingRevenue.total.toFixed(3)} {companySettings.currency || 'OMR'}
                </span>
              </div>
              <div className="pr-4 space-y-1 divide-y divide-slate-100">
                {incomeStatement.operatingRevenue.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 text-slate-700">
                    <span>
                      <strong className="font-mono text-indigo-700 ml-2">{item.code}</strong>
                      {item.nameAr}
                    </span>
                    <span className="font-mono font-medium">{item.amount.toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. COGS */}
            <div className="space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-900 bg-slate-100 p-2.5 rounded-xl">
                <span>2. تكلفة المبيعات والخدمات (Cost of Goods & Services Sold)</span>
                <span className="font-mono text-sm text-rose-800">
                  ({incomeStatement.cogs.total.toFixed(3)}) {companySettings.currency || 'OMR'}
                </span>
              </div>
              <div className="pr-4 space-y-1 divide-y divide-slate-100">
                {incomeStatement.cogs.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 text-slate-700">
                    <span>
                      <strong className="font-mono text-indigo-700 ml-2">{item.code}</strong>
                      {item.nameAr}
                    </span>
                    <span className="font-mono font-medium">{item.amount.toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Gross Profit Highlight */}
            <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl font-bold text-emerald-950">
              <span className="text-sm">إجمالي الربح التشغيلي (Gross Profit):</span>
              <span className="font-mono text-base font-black">
                {incomeStatement.grossProfit.toFixed(3)} {companySettings.currency || 'OMR'}
              </span>
            </div>

            {/* 3. Operating Expenses */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between font-bold text-slate-900 bg-slate-100 p-2.5 rounded-xl">
                <span>3. المصروفات التشغيلية والعمومية (Operating Expenses)</span>
                <span className="font-mono text-sm text-rose-800">
                  ({incomeStatement.operatingExpenses.total.toFixed(3)}) {companySettings.currency || 'OMR'}
                </span>
              </div>
              <div className="pr-4 space-y-1 divide-y divide-slate-100">
                {incomeStatement.operatingExpenses.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 text-slate-700">
                    <span>
                      <strong className="font-mono text-indigo-700 ml-2">{item.code}</strong>
                      {item.nameAr}
                    </span>
                    <span className="font-mono font-medium">{item.amount.toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Net Operating Income (EBIT) */}
            <div className="flex items-center justify-between p-3.5 bg-slate-100 rounded-2xl font-bold text-slate-900">
              <span className="text-sm">الربح التشغيلي قبل الإيرادات والمصروفات الأخرى (EBIT):</span>
              <span className="font-mono text-base">
                {incomeStatement.operatingIncome.toFixed(3)} {companySettings.currency || 'OMR'}
              </span>
            </div>

            {/* Final Net Profit */}
            <div
              className={`flex items-center justify-between p-5 rounded-3xl border-2 font-bold shadow-md ${
                incomeStatement.netProfit >= 0
                  ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-400 text-emerald-950'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}
            >
              <div>
                <span className="text-base font-black block">صافي الربح / (الخسارة) النهائي للفترة:</span>
                <span className="text-xs opacity-75">NET INCOME FOR THE PERIOD</span>
              </div>
              <div className="text-left">
                <span className="font-mono text-2xl font-black">
                  {incomeStatement.netProfit.toFixed(3)} {companySettings.currency || 'OMR'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. BALANCE SHEET (المركز المالي والميزانية العمومية) */}
      {/* ========================================================================= */}
      {activeTab === 'balance-sheet' && (
        <div className="space-y-6 max-w-5xl mx-auto">
          {/* Financial Discrepancy Diagnostics & Auditor Assistant Panel */}
          <div
            className={`rounded-3xl border p-6 transition-all duration-300 shadow-sm ${
              balanceDiagnostic.isBalanced
                ? 'bg-emerald-950/5 border-emerald-300/80'
                : 'bg-amber-950/5 border-amber-300'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    balanceDiagnostic.isBalanced
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {balanceDiagnostic.isBalanced ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <AlertTriangle className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      تشخيص وتدقيق اتزان المركز المالي
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                        balanceDiagnostic.isBalanced
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {balanceDiagnostic.isBalanced ? 'متوازن 100%' : `فارق: ${balanceDiagnostic.variance.toFixed(3)} ر.ع`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    فحص آلي شامل لسلامة معادلة الميزانية: الأصول = الالتزامات + حقوق الملكية + أرباح الفترة
                  </p>
                </div>
              </div>

              {/* Status Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs flex items-center gap-2 shadow-xs">
                  <span className="text-slate-500">الأصول:</span>
                  <span className="font-mono font-bold text-emerald-800">
                    {balanceDiagnostic.totalAssets.toFixed(3)} ر.ع
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs flex items-center gap-2 shadow-xs">
                  <span className="text-slate-500">الخصوم + الملكية:</span>
                  <span className="font-mono font-bold text-blue-800">
                    {balanceDiagnostic.totalLiabilitiesAndEquity.toFixed(3)} ر.ع
                  </span>
                </div>
              </div>
            </div>

            {/* Diagnostic Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 text-xs">
              {/* 1. Opening Balance Diagnosis */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>1. الأرصدة الافتتاحية (Opening Balances)</span>
                  </span>
                  {balanceDiagnostic.openingStatus.isBalanced ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> متوازنة
                    </span>
                  ) : (
                    <span className="text-amber-700 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> فارق {balanceDiagnostic.openingStatus.variance.toFixed(3)} ر.ع
                    </span>
                  )}
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  {balanceDiagnostic.openingStatus.explanation}
                </p>
                {!balanceDiagnostic.openingStatus.isBalanced && (
                  <button
                    type="button"
                    onClick={handleAutoRebalanceOpening}
                    className="w-full mt-1.5 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    ضبط وموازنة الأرصدة الافتتاحية مع الأرباح المبقاة
                  </button>
                )}
              </div>

              {/* 2. Unbalanced Journal Entries Diagnosis */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>2. القيود غير المتوازنة (Unbalanced Entries)</span>
                  </span>
                  {balanceDiagnostic.unbalancedEntries.length === 0 ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> جميع القيود متوازنة
                    </span>
                  ) : (
                    <span className="text-rose-700 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> {balanceDiagnostic.unbalancedEntries.length} قيد غير متوازن
                    </span>
                  )}
                </div>
                {balanceDiagnostic.unbalancedEntries.length === 0 ? (
                  <p className="text-slate-600 text-xs">
                    كافة القيود المسجلة في دفتر اليومية محققة لتساوي طرفي القيد (المدين = الدائن).
                  </p>
                ) : (
                  <div className="space-y-2">
                    {balanceDiagnostic.unbalancedEntries.map((unb) => (
                      <div
                        key={unb.entry.id}
                        className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200 text-rose-950 flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            <span>{unb.entry.entryNumber}</span>
                            <span className="text-slate-500 text-[11px]">({unb.entry.date})</span>
                          </div>
                          <div className="text-[11px] text-rose-800">{unb.reason}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAutoBalanceEntry(unb.entry.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shrink-0"
                        >
                          موازنة القيد
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Unposted Draft Entries Diagnosis */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">
                    3. القيود المسودة غير المرحلة (Draft Entries)
                  </span>
                  {balanceDiagnostic.unpostedDraftEntries.length === 0 ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> لا توجد مسودات
                    </span>
                  ) : (
                    <span className="text-amber-700 font-bold flex items-center gap-1">
                      {balanceDiagnostic.unpostedDraftEntries.length} قيد مسودة
                    </span>
                  )}
                </div>
                <p className="text-slate-600 text-xs">
                  {balanceDiagnostic.unpostedDraftEntries.length > 0
                    ? `يوجد ${balanceDiagnostic.unpostedDraftEntries.length} قيد مسودة لم يتم ترحيلها للأستاذ العام بعد.`
                    : 'جميع قيود اليومية معتمدة ومرحلة بالكامل إلى دفتر الأستاذ العام.'}
                </p>
                {balanceDiagnostic.unpostedDraftEntries.length > 0 && (
                  <button
                    type="button"
                    onClick={handlePostAllDrafts}
                    className="w-full mt-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    ترحيل جميع المسودات المتوازنة ({balanceDiagnostic.unpostedDraftEntries.length})
                  </button>
                )}
              </div>

              {/* 4. Operational Transactions Sync */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">
                    4. العمليات التشغيلية (سندات، مشتريات، رواتب)
                  </span>
                  {balanceDiagnostic.unpostedOperationalTransactions.totalUnsyncedAmount === 0 ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> مرحلة بالكامل
                    </span>
                  ) : (
                    <span className="text-indigo-700 font-bold">
                      {balanceDiagnostic.unpostedOperationalTransactions.vouchersCount +
                        balanceDiagnostic.unpostedOperationalTransactions.purchasesCount +
                        balanceDiagnostic.unpostedOperationalTransactions.payrollsCount}{' '}
                      عمليات معلقة
                    </span>
                  )}
                </div>
                <p className="text-slate-600 text-xs">
                  {balanceDiagnostic.unpostedOperationalTransactions.totalUnsyncedAmount > 0
                    ? `توجد عمليات بقيمة ${balanceDiagnostic.unpostedOperationalTransactions.totalUnsyncedAmount.toFixed(3)} ر.ع لم تنشأ لها قيود مزدوجة بعد.`
                    : 'كافة السندات وفواتير المشتريات ومسيرات الرواتب متزامنة ومنشأ لها قيود.'}
                </p>
                {balanceDiagnostic.unpostedOperationalTransactions.totalUnsyncedAmount > 0 && (
                  <button
                    type="button"
                    onClick={handleSyncOperationalData}
                    className="w-full mt-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    مزامنة وترحيل كافة العمليات الآن
                  </button>
                )}
              </div>
            </div>

            {/* If still unbalanced, offer balancing adjusting entry */}
            {!balanceDiagnostic.isBalanced && balanceDiagnostic.variance > 0.01 && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-sm">إجراء تسوية سريعة للمركز المالي</div>
                  <div className="text-xs text-slate-300">
                    إنشاء قيد تسوية بمبلغ الفارق ({balanceDiagnostic.variance.toFixed(3)} ر.ع) لمعادلة المركز المالي فوراً
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCreateBalancingAdjustingEntry(balanceDiagnostic.variance)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shrink-0 transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  إنشاء قيد تسوية بمبلغ الفارق
                </button>
              </div>
            )}
          </div>

          {/* Balance Sheet Statement Document */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 space-y-6">
            {/* Statement Title Header */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {companySettings.companyNameAr || 'مجموعة دشال للاستثمار ش.م.م'}
                </h2>
                <h3 className="text-xs text-slate-500">
                  {companySettings.companyNameEn || 'Deshal Investment Group LLC'}
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  قائمة المركز المالي والميزانية العمومية (Statement of Financial Position)
                </p>
              </div>

              <div className="text-left space-y-1">
                <span className="inline-block px-3 py-1 rounded-lg bg-blue-900 text-white font-bold text-sm">
                  الميزانية العمومية
                </span>
                <div className="text-xs text-slate-500 font-mono">AS AT DECEMBER 31, 2026</div>
                <div className="text-xs font-medium">
                  {balanceSheet.isBalanced ? (
                    <span className="text-emerald-700 font-bold">✓ معادلة الميزانية متوازنة</span>
                  ) : (
                    <span className="text-amber-700 font-bold">
                      ⚠ غير متوازنة (فارق: {balanceSheet.variance.toFixed(3)} {companySettings.currency || 'OMR'})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
              {/* Left Side: ASSETS */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 pb-2 border-b-2 border-emerald-600 flex items-center justify-between">
                  <span>الأصول (ASSETS)</span>
                  <span className="font-mono text-emerald-800">
                    {balanceSheet.assets.totalAssets.toFixed(3)}
                  </span>
                </h3>

                {/* Current Assets */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-800 bg-slate-100 p-2 rounded-xl">
                    <span>الأصول المتداولة (Current Assets)</span>
                    <span className="font-mono">{balanceSheet.assets.currentAssets.total.toFixed(3)}</span>
                  </div>
                  <div className="pr-3 space-y-1 divide-y divide-slate-100">
                    {balanceSheet.assets.currentAssets.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1 text-slate-700">
                        <span>{item.nameAr}</span>
                        <span className="font-mono font-medium">{item.amount.toFixed(3)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Non-Current Assets */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between font-bold text-slate-800 bg-slate-100 p-2 rounded-xl">
                    <span>الأصول الثابتة وغير المتداولة (Non-Current Assets)</span>
                    <span className="font-mono">{balanceSheet.assets.nonCurrentAssets.total.toFixed(3)}</span>
                  </div>
                  <div className="pr-3 space-y-1 divide-y divide-slate-100">
                    {balanceSheet.assets.nonCurrentAssets.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1 text-slate-700">
                        <span>{item.nameAr}</span>
                        <span className="font-mono font-medium">{item.amount.toFixed(3)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Assets Summary Box */}
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between font-bold text-emerald-950 mt-4">
                  <span className="text-sm">إجمالي الأصول (Total Assets):</span>
                  <span className="font-mono text-base font-black">
                    {balanceSheet.assets.totalAssets.toFixed(3)} {companySettings.currency || 'OMR'}
                  </span>
                </div>
              </div>

              {/* Right Side: LIABILITIES & EQUITY */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 pb-2 border-b-2 border-blue-600 flex items-center justify-between">
                  <span>الالتزامات وحقوق الملكية (LIABILITIES & EQUITY)</span>
                  <span className="font-mono text-blue-800">
                    {balanceSheet.totalLiabilitiesAndEquity.toFixed(3)}
                  </span>
                </h3>

                {/* Current Liabilities */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-800 bg-slate-100 p-2 rounded-xl">
                    <span>الالتزامات المتداولة (Current Liabilities)</span>
                    <span className="font-mono">{balanceSheet.liabilities.currentLiabilities.total.toFixed(3)}</span>
                  </div>
                  <div className="pr-3 space-y-1 divide-y divide-slate-100">
                    {balanceSheet.liabilities.currentLiabilities.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1 text-slate-700">
                        <span>{item.nameAr}</span>
                        <span className="font-mono font-medium">{item.amount.toFixed(3)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Long Term Liabilities */}
                {balanceSheet.liabilities.longTermLiabilities.total > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between font-bold text-slate-800 bg-slate-100 p-2 rounded-xl">
                      <span>الالتزامات غير المتداولة (Long Term Liabilities)</span>
                      <span className="font-mono">{balanceSheet.liabilities.longTermLiabilities.total.toFixed(3)}</span>
                    </div>
                    <div className="pr-3 space-y-1 divide-y divide-slate-100">
                      {balanceSheet.liabilities.longTermLiabilities.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between py-1 text-slate-700">
                          <span>{item.nameAr}</span>
                          <span className="font-mono font-medium">{item.amount.toFixed(3)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Equity */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between font-bold text-slate-800 bg-slate-100 p-2 rounded-xl">
                    <span>حقوق الملكية ورأس المال (Equity)</span>
                    <span className="font-mono">{balanceSheet.equity.totalEquity.toFixed(3)}</span>
                  </div>
                  <div className="pr-3 space-y-1 divide-y divide-slate-100">
                    {balanceSheet.equity.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1 text-slate-700">
                        <span>{item.nameAr}</span>
                        <span className="font-mono font-medium">{item.amount.toFixed(3)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between py-1 text-emerald-800 font-bold bg-emerald-50/50 px-2 rounded-md">
                      <span>صافي ربح الفترة الحالية (Current Period Net Profit)</span>
                      <span className="font-mono">{balanceSheet.equity.currentPeriodProfit.toFixed(3)}</span>
                    </div>
                  </div>
                </div>

                {/* Total Liabilities & Equity Box */}
                <div className="p-3.5 bg-blue-50 border border-blue-300 rounded-2xl flex items-center justify-between font-bold text-blue-950 mt-4">
                  <span className="text-sm">إجمالي الالتزامات وحقوق الملكية:</span>
                  <span className="font-mono text-base font-black">
                    {balanceSheet.totalLiabilitiesAndEquity.toFixed(3)} {companySettings.currency || 'OMR'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. BANK RECONCILIATION TAB (التسوية البنكية والمطابقة الآلية) */}
      {/* ========================================================================= */}
      {activeTab === 'reconciliation' && (
        <BankReconciliationTab
          accounts={accounts}
          journalEntries={journalEntries}
          companySettings={companySettings}
          onSaveJournalEntries={onSaveJournalEntries}
          currentUserName={currentUserName}
        />
      )}

      {/* ========================================================================= */}
      {/* 5. COST CENTERS TAB (مراكز التكلفة والمشاريع) */}
      {/* ========================================================================= */}
      {activeTab === 'cost-centers' && (
        <CostCentersTab
          accounts={accounts}
          journalEntries={journalEntries}
          companySettings={companySettings}
        />
      )}

      {/* ========================================================================= */}
      {/* 6. ACCOUNTING SETTINGS & FISCAL PERIODS TAB (إعدادات النظام وإقفال الفترات) */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <AccountingSettingsTab
          accounts={accounts}
          fiscalPeriods={fiscalPeriodsState}
          onSaveFiscalPeriods={(newPeriods) => {
            setFiscalPeriodsState(newPeriods);
            if (onSaveFiscalPeriods) onSaveFiscalPeriods(newPeriods);
          }}
          currentUserName={currentUserName}
        />
      )}

      {/* ========================================================================= */}
      {/* 7. REVISION LOG TAB (سجل التدقيق والمراجعة المحاسبية) */}
      {/* ========================================================================= */}
      {activeTab === 'revision-log' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                سجل المراجعة والتدقيق المحاسبي (Accounting Revision & Audit Trail)
              </h3>
              <p className="text-xs text-slate-500">
                سجل تاريخي غير قابل للتعديل يوثق جميع عمليات إنشاء، اعتماد، ترحيل، أو عكس القيود المحاسبية
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {revisionLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors text-xs flex items-start gap-4">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    log.action === 'POST'
                      ? 'bg-emerald-100 text-emerald-700'
                      : log.action === 'REVERSE'
                      ? 'bg-rose-100 text-rose-700'
                      : log.action === 'EDIT'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  <History className="w-4 h-4" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{log.detailsAr}</span>
                    <span className="font-mono text-slate-400 text-[11px]">{log.timestamp}</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-500 mt-1">
                    <span>المستخدم: <strong className="text-slate-700">{log.userName}</strong></span>
                    <span>النوع: <strong className="font-mono text-indigo-700">{log.entityType}</strong></span>
                    <span>المرجع: <strong className="font-mono text-slate-700">{log.entityReference}</strong></span>
                  </div>
                </div>
              </div>
            ))}

            {revisionLogs.length === 0 && (
              <div className="py-12 text-center text-slate-400">
                <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="font-bold">سجل المراجعة فارغ حالياً</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <JournalEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        onSave={handleSaveEntry}
        accounts={accounts}
        branches={branches}
        settings={companySettings}
        entryToEdit={selectedEntryForEdit}
        defaultType={entryModalType}
        currentUserName={currentUserName}
      />

      <JournalEntryDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        entry={selectedEntryForDetails}
        settings={companySettings}
        onPost={handlePostEntry}
        onReverse={(entry) => {
          setIsDetailsModalOpen(false);
          handleOpenReverseModal(entry);
        }}
      />

      <ReverseEntryModal
        isOpen={isReverseModalOpen}
        onClose={() => setIsReverseModalOpen(false)}
        entry={selectedEntryForReverse}
        onConfirmReverse={handleConfirmReverse}
        currentUserName={currentUserName}
      />

      <AccountStatementModal
        isOpen={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
        account={selectedAccountForStatement}
        entries={journalEntries}
        settings={companySettings}
      />

      <AccountFormModal
        isOpen={isAccountFormModalOpen}
        onClose={() => setIsAccountFormModalOpen(false)}
        onSave={handleSaveAccount}
        existingAccounts={accounts}
        accountToEdit={selectedAccountForEdit}
      />
    </div>
  );
};
