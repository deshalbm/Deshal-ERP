import React, { useState } from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  Building2,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter
} from 'lucide-react';
import { Account, JournalEntry, CompanySettings } from '../../types';
import { useLanguage } from '../../utils/LanguageContext';

interface AccountStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
  entries: JournalEntry[];
  settings: CompanySettings;
}

export const AccountStatementModal: React.FC<AccountStatementModalProps> = ({
  isOpen,
  onClose,
  account,
  entries,
  settings
}) => {
  const { isRTL } = useLanguage();
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>('2026-12-31');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen || !account) return null;

  // Filter posted entries matching this account
  const matchingTransactions = entries
    .filter((e) => (e.status === 'POSTED' || e.status === 'LOCKED') && (!startDate || e.date >= startDate) && (!endDate || e.date <= endDate))
    .flatMap((entry) => {
      const relevantLines = entry.lines.filter(
        (l) => l.accountId === account.id || l.accountCode === account.code
      );
      return relevantLines.map((line) => ({
        entryId: entry.id,
        entryNumber: entry.entryNumber,
        date: entry.date,
        type: entry.type,
        reference: entry.referenceNumber || entry.referenceType || 'قيد يدوي',
        description: line.descriptionAr || entry.descriptionAr,
        debit: Number(line.debit || 0),
        credit: Number(line.credit || 0)
      }));
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  // Compute running balance
  let runningBalance = Number(account.openingBalance || 0);
  const rowsWithBalance = matchingTransactions.map((tx) => {
    if (account.type === 'ASSET' || account.type === 'EXPENSE') {
      runningBalance += tx.debit - tx.credit;
    } else {
      runningBalance += tx.credit - tx.debit;
    }
    return {
      ...tx,
      balanceAfter: runningBalance
    };
  });

  const filteredRows = rowsWithBalance.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.entryNumber.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.reference.toLowerCase().includes(q)
    );
  });

  const totalPeriodDebit = matchingTransactions.reduce((acc, curr) => acc + curr.debit, 0);
  const totalPeriodCredit = matchingTransactions.reduce((acc, curr) => acc + curr.credit, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
      <div
        id="account-statement-card"
        className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-6 print:border-none print:shadow-none print:rounded-none print:m-0"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header (hidden in print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">كشف حساب الأستاذ العام (General Ledger Statement)</h3>
              <span className="text-xs text-slate-400 font-mono">
                {account.code} - {account.nameAr}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="print-statement-btn"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة كشف الحساب</span>
            </button>
            <button
              id="close-statement-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Account Statement */}
        <div className="p-8 space-y-6 text-slate-900">
          {/* Company Branding & Statement Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {settings.companyNameAr || 'مجموعة دشال للاستثمار ش.م.م'}
              </h1>
              <h2 className="text-xs text-slate-500">
                {settings.companyNameEn || 'Deshal Investment Group LLC'}
              </h2>
              <div className="text-xs text-slate-600 mt-1">
                س.ت: {settings.crNumber || '1398421'} | الرقم الضريبي: {settings.taxNumber || 'OM-1094827'}
              </div>
            </div>

            <div className="text-left space-y-1">
              <div className="inline-block px-3 py-1 rounded-lg bg-indigo-900 text-white font-bold text-sm">
                كشف حساب الأستاذ العام
              </div>
              <div className="text-xs text-slate-500 font-mono">GENERAL LEDGER STATEMENT</div>
              <div className="text-xs text-slate-600 font-medium pt-1">
                الفترة: {startDate} إلى {endDate}
              </div>
            </div>
          </div>

          {/* Account Details Box */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block">رمز الحساب (Account Code):</span>
              <span className="font-mono font-bold text-base text-indigo-900">{account.code}</span>
            </div>
            <div>
              <span className="text-slate-500 block">اسم الحساب (Account Name):</span>
              <span className="font-bold text-slate-900 text-sm">{account.nameAr}</span>
            </div>
            <div>
              <span className="text-slate-500 block">النوع والتصنيف (Type / Nature):</span>
              <span className="font-bold text-slate-800">
                {account.type} ({account.category})
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">رصيد أول المدة الافتتاحي:</span>
              <span className="font-mono font-bold text-sm text-slate-900">
                {Number(account.openingBalance || 0).toFixed(3)} {settings.currency || 'OMR'}
              </span>
            </div>
          </div>

          {/* Filter / Search Bar (hidden in print) */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 p-3 rounded-2xl print:hidden text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="البحث في العمليات، البيان، أو رقم القيد..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white px-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-600 font-bold">من:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs"
              />
              <span className="text-slate-600 font-bold">إلى:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Ledger Table */}
          <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="py-2.5 px-3 font-bold w-24">التاريخ</th>
                  <th className="py-2.5 px-3 font-bold w-28">رقم القيد</th>
                  <th className="py-2.5 px-3 font-bold w-28">المرجع</th>
                  <th className="py-2.5 px-3 font-bold">البيان والشرح التفصيلي</th>
                  <th className="py-2.5 px-3 font-bold w-28 text-center text-emerald-300">
                    مدين Debit
                  </th>
                  <th className="py-2.5 px-3 font-bold w-28 text-center text-blue-300">
                    دائن Credit
                  </th>
                  <th className="py-2.5 px-3 font-bold w-32 text-center text-amber-300">
                    الرصيد التراكمي
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {/* Opening Balance Row */}
                <tr className="bg-indigo-50/40 font-bold text-indigo-950">
                  <td className="py-2 px-3 font-mono">{startDate}</td>
                  <td className="py-2 px-3 font-mono">-</td>
                  <td className="py-2 px-3 font-mono">OPENING</td>
                  <td className="py-2 px-3">رصيد أول المدة المرحل</td>
                  <td className="py-2 px-3 text-center">-</td>
                  <td className="py-2 px-3 text-center">-</td>
                  <td className="py-2 px-3 text-center font-mono font-bold text-indigo-900">
                    {Number(account.openingBalance || 0).toFixed(3)}
                  </td>
                </tr>

                {filteredRows.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="py-2 px-3 font-mono text-slate-700">{row.date}</td>
                    <td className="py-2 px-3 font-mono font-bold text-indigo-700">{row.entryNumber}</td>
                    <td className="py-2 px-3 font-mono text-slate-600">{row.reference}</td>
                    <td className="py-2 px-3 font-medium text-slate-900">{row.description}</td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-emerald-700 bg-emerald-50/30">
                      {row.debit > 0 ? row.debit.toFixed(3) : '-'}
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-blue-700 bg-blue-50/30">
                      {row.credit > 0 ? row.credit.toFixed(3) : '-'}
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-slate-900 bg-slate-100/50">
                      {row.balanceAfter.toFixed(3)}
                    </td>
                  </tr>
                ))}

                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      لا توجد حركات مرحلة لهذا الحساب خلال الفترة المحددة
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-slate-900 text-white font-bold text-xs">
                <tr>
                  <td colSpan={4} className="py-3 px-4 text-right">
                    <span>إجمالي حركات الفترة ورصيد الإقفال النهائي:</span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-emerald-300">
                    {totalPeriodDebit.toFixed(3)}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-blue-300">
                    {totalPeriodCredit.toFixed(3)}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-amber-300 text-sm">
                    {runningBalance.toFixed(3)} {settings.currency || 'OMR'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
