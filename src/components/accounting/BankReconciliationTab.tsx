import React, { useState, useMemo } from 'react';
import {
  Landmark,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  RefreshCw,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  DollarSign,
  Search,
  Check,
  AlertTriangle,
  FileText,
  Calendar,
  Sparkles
} from 'lucide-react';
import {
  BankAccount,
  BankStatementTransaction,
  BankReconciliationSession,
  BankMatchStatus,
  JournalEntry,
  Account,
  AccountingSettings
} from '../../types';
import { useLanguage } from '../../utils/LanguageContext';
import {
  autoMatchBankTransactions,
  createBankDifferenceAdjustingEntry,
  calculateBankReconciliationSummary,
  saveBankAccounts,
  saveBankStatementTransactions,
  saveBankReconciliationSessions,
  loadBankStatementTransactions,
  loadBankReconciliationSessions,
  loadBankAccounts
} from '../../utils/accountingStorage';

interface BankReconciliationTabProps {
  bankAccounts: BankAccount[];
  accounts: Account[];
  journalEntries: JournalEntry[];
  settings: AccountingSettings;
  currentUserName: string;
  onRefreshData: () => void;
  onNotification: (msg: string) => void;
}

export const BankReconciliationTab: React.FC<BankReconciliationTabProps> = ({
  bankAccounts,
  accounts,
  journalEntries,
  settings,
  currentUserName,
  onRefreshData,
  onNotification
}) => {
  const { isRTL } = useLanguage();
  const [selectedBankId, setSelectedBankId] = useState<string>(bankAccounts[0]?.id || 'bank-muscat-01');
  const [statementEndingBalance, setStatementEndingBalance] = useState<number>(19910.5);
  const [statementStartDate, setStatementStartDate] = useState<string>('2026-02-01');
  const [statementEndDate, setStatementEndDate] = useState<string>('2026-02-28');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Transactions & Sessions from storage
  const [transactions, setTransactions] = useState<BankStatementTransaction[]>(() =>
    loadBankStatementTransactions()
  );

  // Modals
  const [isAdjModalOpen, setIsAdjModalOpen] = useState<boolean>(false);
  const [adjType, setAdjType] = useState<'BANK_FEE' | 'DIRECT_DEBIT' | 'DIRECT_CREDIT' | 'INTEREST'>('BANK_FEE');
  const [adjAmount, setAdjAmount] = useState<number>(50);
  const [adjDesc, setAdjDesc] = useState<string>('رسوم الحساب والرسائل النصية الشهرية');
  const [adjDate, setAdjDate] = useState<string>('2026-02-28');

  // New Bank Account Modal
  const [isAddBankModalOpen, setIsAddBankModalOpen] = useState<boolean>(false);
  const [newBankName, setNewBankName] = useState<string>('');
  const [newAccName, setNewAccName] = useState<string>('');
  const [newAccNum, setNewAccNum] = useState<string>('');
  const [newIban, setNewIban] = useState<string>('');
  const [newLinkedAccId, setNewLinkedAccId] = useState<string>(accounts.find((a) => a.code.startsWith('11'))?.id || '');

  const activeBank = useMemo(
    () => bankAccounts.find((b) => b.id === selectedBankId) || bankAccounts[0],
    [bankAccounts, selectedBankId]
  );

  const bankTransactions = useMemo(
    () => transactions.filter((tx) => tx.bankAccountId === selectedBankId),
    [transactions, selectedBankId]
  );

  // Reconciliation summary
  const reconSummary = useMemo(() => {
    return calculateBankReconciliationSummary(
      selectedBankId,
      statementEndingBalance,
      statementStartDate,
      statementEndDate,
      accounts,
      journalEntries,
      transactions
    );
  }, [selectedBankId, statementEndingBalance, statementStartDate, statementEndDate, accounts, journalEntries, transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return bankTransactions.filter((tx) => {
      if (statusFilter !== 'ALL' && tx.matchStatus !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchDesc = tx.description.toLowerCase().includes(q);
        const matchRef = tx.reference?.toLowerCase().includes(q);
        if (!matchDesc && !matchRef) return false;
      }
      return true;
    });
  }, [bankTransactions, statusFilter, searchQuery]);

  // Handler: Auto-Match Transactions
  const handleAutoMatch = () => {
    const { matchedCount, updatedTxs } = autoMatchBankTransactions(
      transactions,
      journalEntries,
      selectedBankId,
      currentUserName
    );
    setTransactions(updatedTxs);
    onNotification(`تمت المطابقة الآلية بنجاح لـ ${matchedCount} حركة بنكية مع قيود اليومية!`);
    onRefreshData();
  };

  // Handler: Toggle Transaction Match
  const handleToggleManualMatch = (txId: string) => {
    const updated = transactions.map((tx) => {
      if (tx.id === txId) {
        const nextStatus: BankMatchStatus = tx.matchStatus === 'MATCHED' ? 'UNMATCHED' : 'MATCHED';
        return {
          ...tx,
          matchStatus: nextStatus,
          matchedAt: nextStatus === 'MATCHED' ? new Date().toISOString() : undefined,
          matchedBy: nextStatus === 'MATCHED' ? currentUserName : undefined
        };
      }
      return tx;
    });
    setTransactions(updated);
    saveBankStatementTransactions(updated);
    onNotification('تم تحديث حالة مطابقة الحركة البنكية يدوياً.');
    onRefreshData();
  };

  // Handler: Generate Difference Adjusting Entry
  const handleCreateAdjustmentEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (adjAmount <= 0) return;

    createBankDifferenceAdjustingEntry(
      adjType,
      adjAmount,
      selectedBankId,
      adjDesc,
      adjDate,
      accounts,
      settings,
      currentUserName
    );

    setIsAdjModalOpen(false);
    onNotification(`تم توليد قيد التسوية البنكية بمبلغ ${adjAmount.toFixed(3)} ر.ع وترحيله بنجاح!`);
    onRefreshData();
  };

  // Handler: Add New Bank Account
  const handleSaveNewBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName.trim() || !newAccNum.trim()) return;

    const newBank: BankAccount = {
      id: `bank-${Date.now()}`,
      bankName: newBankName.trim(),
      accountName: newAccName.trim() || newBankName.trim(),
      accountNumber: newAccNum.trim(),
      iban: newIban.trim() || undefined,
      currency: settings.baseCurrency || 'OMR',
      linkedAccountId: newLinkedAccId || settings.defaultAccounts.bankAccountId,
      openingBalance: 0,
      currentBookBalance: 0,
      currentStatementBalance: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const currentBanks = loadBankAccounts();
    const updatedBanks = [...currentBanks, newBank];
    saveBankAccounts(updatedBanks);

    setIsAddBankModalOpen(false);
    setNewBankName('');
    setNewAccName('');
    setNewAccNum('');
    setNewIban('');
    onNotification(`تم إضافة الحساب البنكي الجديد (${newBank.bankName}) بنجاح.`);
    onRefreshData();
  };

  return (
    <div id="bank-reconciliation-tab" className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top Header & Bank Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">
              التسوية البنكية والمطابقة الآلية (Bank Reconciliation)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              مطابقة كشف الحساب البنكي الفعلي مع رصيد الدفاتر وتوليد قيود التسوية الآلية
            </p>
          </div>
        </div>

        {/* Bank Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-100 px-3.5 py-2 rounded-2xl border border-slate-200">
            <Landmark className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-600">الحساب البنكي:</span>
            <select
              id="bank-account-selector"
              value={selectedBankId}
              onChange={(e) => setSelectedBankId(e.target.value)}
              className="bg-transparent text-xs font-black text-slate-900 focus:outline-none cursor-pointer"
            >
              {bankAccounts.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bankName} ({b.accountNumber.slice(-4)})
                </option>
              ))}
            </select>
          </div>

          <button
            id="add-bank-account-btn"
            onClick={() => setIsAddBankModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-bold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ إضافة حساب بنكي</span>
          </button>

          <button
            id="auto-match-bank-btn"
            onClick={handleAutoMatch}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-black shadow-md hover:shadow-emerald-600/25 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>المطابقة الآلية الذكية (Auto Match)</span>
          </button>
        </div>
      </div>

      {/* Reconciliation Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Book Balance */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            رصيد الدفاتر المحاسبية (GL Book Balance)
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-indigo-950 font-mono">
              {reconSummary.bookBalance.toFixed(3)}
            </span>
            <span className="text-xs font-bold text-slate-400">{settings.baseCurrency || 'OMR'}</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            الحساب المرتبط في الدليل: 1130
          </span>
        </div>

        {/* Statement Ending Balance */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            رصيد كشف الحساب البنكي الفعلي
          </span>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              step="0.001"
              value={statementEndingBalance}
              onChange={(e) => setStatementEndingBalance(parseFloat(e.target.value) || 0)}
              className="text-2xl font-black text-slate-900 font-mono w-full bg-slate-50 px-2 py-0.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-xs font-bold text-slate-400 shrink-0">{settings.baseCurrency || 'OMR'}</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            تاريخ كشف الحساب: {statementEndDate}
          </span>
        </div>

        {/* Adjusted / Reconciled Balance */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            الرصيد المعدل للتسوية (Adjusted Balance)
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {reconSummary.reconciledBalance.toFixed(3)}
            </span>
            <span className="text-xs font-bold text-slate-400">{settings.baseCurrency || 'OMR'}</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-bold mt-1 block">
            + إيداعات بالطريق: {reconSummary.outstandingDepositsTotal.toFixed(3)} | - شيكات قائمة: {reconSummary.outstandingPaymentsTotal.toFixed(3)}
          </span>
        </div>

        {/* Difference & Status */}
        <div
          className={`p-5 rounded-3xl border shadow-xs flex flex-col justify-between ${
            reconSummary.isBalanced
              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
              : 'bg-rose-50/60 border-rose-200 text-rose-950'
          }`}
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider block">
              فارق التسوية (Difference)
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono">
                {reconSummary.difference.toFixed(3)}
              </span>
              <span className="text-xs font-bold">{settings.baseCurrency || 'OMR'}</span>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs font-bold flex items-center gap-1">
              {reconSummary.isBalanced ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>الحساب مطابق ومتوازن بنجاح</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>يوجد فارق تسوية يحتاج قيد</span>
                </>
              )}
            </span>
            {!reconSummary.isBalanced && (
              <button
                onClick={() => {
                  setAdjAmount(reconSummary.difference);
                  setIsAdjModalOpen(true);
                }}
                className="text-xs font-black px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs"
              >
                توليد قيد تسوية
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Statement Transactions Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="بحث في البيان أو الرقم المرجعي..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs pr-9 pl-4 py-2 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
              />
            </div>

            <div className="flex items-center gap-1 text-xs font-bold">
              {['ALL', 'MATCHED', 'UNMATCHED', 'POSSIBLE_MATCH'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl transition-colors ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white font-black'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st === 'ALL' && 'الكل'}
                  {st === 'MATCHED' && 'مطابق (Matched)'}
                  {st === 'UNMATCHED' && 'غير مطابق'}
                  {st === 'POSSIBLE_MATCH' && 'مطابقة مقترحة'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setAdjAmount(50);
                setIsAdjModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ قيد رسوم بنكية أو تسوية مباشرة</span>
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="bg-slate-100/75 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-3 px-4">تاريخ الحركة</th>
                <th className="py-3 px-4">البيان والشرح في كشف البنك</th>
                <th className="py-3 px-4">المرجع البنكي</th>
                <th className="py-3 px-4 text-center">مدين (سحب/مصروف)</th>
                <th className="py-3 px-4 text-center">دائن (إيداع/وارد)</th>
                <th className="py-3 px-4 text-center">حالة المطابقة</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    لا توجد حركات بنكية مسجلة وفق الفلتر المحدد
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-700">{tx.transactionDate}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{tx.description}</div>
                      {tx.notes && <div className="text-[11px] text-amber-700 mt-0.5">{tx.notes}</div>}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{tx.reference || '-'}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-rose-600">
                      {tx.debit > 0 ? tx.debit.toFixed(3) : '-'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-600">
                      {tx.credit > 0 ? tx.credit.toFixed(3) : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {tx.matchStatus === 'MATCHED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <Check className="w-3 h-3" />
                          <span>مطابق</span>
                        </span>
                      ) : tx.matchStatus === 'POSSIBLE_MATCH' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Sparkles className="w-3 h-3" />
                          <span>مطابقة مقترحة</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          <span>غير مطابق</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleManualMatch(tx.id)}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                          tx.matchStatus === 'MATCHED'
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {tx.matchStatus === 'MATCHED' ? 'إلغاء المطابقة' : 'تأكيد المطابقة'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjusting Entry Modal */}
      {isAdjModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-black text-slate-900">توليد قيد تسوية بنكية فوري</h3>
            <form onSubmit={handleCreateAdjustmentEntry} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">نوع الفرق / الحركة:</label>
                <select
                  value={adjType}
                  onChange={(e) => setAdjType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                >
                  <option value="BANK_FEE">رسوم ومصاريف بنكية (Bank Charges)</option>
                  <option value="DIRECT_DEBIT">سحب مباشر / فواتير مرافق (Direct Debit)</option>
                  <option value="DIRECT_CREDIT">إيداع مباشر / إيراد وارد (Direct Credit)</option>
                  <option value="INTEREST">فوائد بنكية / عوائد</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المبلغ (ر.ع):</label>
                <input
                  type="number"
                  step="0.001"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">البيان والشرح:</label>
                <input
                  type="text"
                  value={adjDesc}
                  onChange={(e) => setAdjDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">تاريخ القيد:</label>
                <input
                  type="date"
                  value={adjDate}
                  onChange={(e) => setAdjDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdjModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-bold rounded-xl hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md"
                >
                  توليد وترحيل القيد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Bank Account Modal */}
      {isAddBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-black text-slate-900">+ إضافة حساب بنكي جديد</h3>
            <form onSubmit={handleSaveNewBank} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم البنك:</label>
                <input
                  type="text"
                  placeholder="مثال: بنك صحار الدولي"
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الحساب:</label>
                <input
                  type="text"
                  placeholder="مثال: ديشال للاستثمار - حساب العمليات"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الحساب:</label>
                <input
                  type="text"
                  placeholder="0123456789012"
                  value={newAccNum}
                  onChange={(e) => setNewAccNum(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الآيبان الدولي (IBAN):</label>
                <input
                  type="text"
                  placeholder="OM00..."
                  value={newIban}
                  onChange={(e) => setNewIban(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الحساب المحاسبي المرتبط في الدليل:</label>
                <select
                  value={newLinkedAccId}
                  onChange={(e) => setNewLinkedAccId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                >
                  {accounts
                    .filter((a) => a.code.startsWith('11') && a.isPosting)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} - {a.nameAr}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddBankModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-bold rounded-xl hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md"
                >
                  حفظ الحساب البنكي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
