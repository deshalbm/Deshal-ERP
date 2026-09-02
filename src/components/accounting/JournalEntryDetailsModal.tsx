import React from 'react';
import {
  X,
  Printer,
  FileCheck,
  Building2,
  Calendar,
  Lock,
  ArrowRightLeft,
  Share2,
  CheckCircle2
} from 'lucide-react';
import { JournalEntry, CompanySettings } from '../../types';
import { useLanguage } from '../../utils/LanguageContext';

interface JournalEntryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: JournalEntry | null;
  settings: CompanySettings;
  onPost?: (entry: JournalEntry) => void;
  onReverse?: (entry: JournalEntry) => void;
}

export const JournalEntryDetailsModal: React.FC<JournalEntryDetailsModalProps> = ({
  isOpen,
  onClose,
  entry,
  settings,
  onPost,
  onReverse
}) => {
  const { isRTL } = useLanguage();

  if (!isOpen || !entry) return null;

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = () => {
    switch (entry.status) {
      case 'POSTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>مرحل للأستاذ العام (POSTED)</span>
          </span>
        );
      case 'LOCKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            <Lock className="w-3.5 h-3.5" />
            <span>مغلق في فترة مالية مقفلة (LOCKED)</span>
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <span>مسودة قيد قيد المراجعة (DRAFT)</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <span>قيد ملغى (CANCELLED)</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {entry.status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
      <div
        id="journal-voucher-print-area"
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-6 print:border-none print:shadow-none print:rounded-none print:m-0"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Actions Bar (hidden in print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden border-b border-slate-800">
          <div className="flex items-center gap-3">
            <FileCheck className="w-6 h-6 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold">سند القيد اليومي المزدوج (Journal Voucher)</h3>
              <span className="text-xs text-slate-400 font-mono">{entry.entryNumber}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="print-journal-voucher-btn"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة السند</span>
            </button>
            {entry.status === 'DRAFT' && onPost && (
              <button
                id="post-from-modal-btn"
                onClick={() => onPost(entry)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ترحيل للأستاذ العام</span>
              </button>
            )}
            {entry.status === 'POSTED' && onReverse && (
              <button
                id="reverse-from-modal-btn"
                onClick={() => onReverse(entry)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>إنشاء قيد عكسي</span>
              </button>
            )}
            <button
              id="close-details-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Official Printable Voucher Content */}
        <div className="p-8 space-y-6 text-slate-900">
          {/* Header & Logo */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
            <div className="flex items-center gap-4">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.companyNameAr}
                  className="w-16 h-16 object-contain rounded-xl border border-slate-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-2xl">
                  {settings.companyNameAr?.charAt(0) || 'D'}
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {settings.companyNameAr || 'مجموعة دشال للاستثمار ش.م.م'}
                </h1>
                <h2 className="text-xs text-slate-500 font-medium">
                  {settings.companyNameEn || 'Deshal Investment Group LLC'}
                </h2>
                <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
                  <span>س.ت: {settings.crNumber || '1398421'}</span>
                  <span>الرقم الضريبي: {settings.taxNumber || 'OM-1094827'}</span>
                </div>
              </div>
            </div>

            <div className="text-left space-y-1">
              <div className="inline-block px-3 py-1 rounded-lg bg-slate-900 text-white font-bold text-sm">
                سند قيد محاسبي مزدوج
              </div>
              <div className="text-xs text-slate-500 font-mono">JOURNAL VOUCHER</div>
              <div className="pt-2">{getStatusBadge()}</div>
            </div>
          </div>

          {/* Meta Information Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block font-medium">رقم القيد (Entry No.)</span>
              <span className="font-mono font-bold text-sm text-slate-900">{entry.entryNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">تاريخ القيد (Date)</span>
              <span className="font-bold text-slate-900">{entry.date}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">نوع القيد (Type)</span>
              <span className="font-bold text-indigo-700">
                {entry.type === 'ADJUSTING'
                  ? 'قيد تسوية فترية'
                  : entry.type === 'OPENING'
                  ? 'قيد افتتاحي'
                  : entry.type === 'AUTOMATED'
                  ? 'قيد آلي من النظام'
                  : entry.type === 'REVERSAL'
                  ? 'قيد عكسي تصحيحي'
                  : 'قيد يومية عامة'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">المرجع (Reference)</span>
              <span className="font-mono font-bold text-slate-700">
                {entry.referenceNumber || entry.referenceType || 'قيد يدوي'}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
            <span className="text-xs font-bold text-indigo-900 block mb-0.5">
              البيان العام / الغرض من القيد (General Description):
            </span>
            <p className="text-sm font-semibold text-slate-900 leading-relaxed">
              {entry.descriptionAr}
            </p>
            {entry.descriptionEn && (
              <p className="text-xs text-slate-500 mt-1 font-sans">{entry.descriptionEn}</p>
            )}
          </div>

          {/* Double-Entry Lines Table */}
          <div className="border border-slate-300 rounded-2xl overflow-hidden">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="py-3 px-3 font-bold text-center w-12">#</th>
                  <th className="py-3 px-3 font-bold w-28">رمز الحساب</th>
                  <th className="py-3 px-3 font-bold">اسم الحساب المحاسبي</th>
                  <th className="py-3 px-3 font-bold">شرح السطر التفصيلي</th>
                  <th className="py-3 px-3 font-bold w-32 text-center text-emerald-300">
                    مدين Debit ({settings.currency || 'OMR'})
                  </th>
                  <th className="py-3 px-3 font-bold w-32 text-center text-blue-300">
                    دائن Credit ({settings.currency || 'OMR'})
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {entry.lines.map((line, idx) => (
                  <tr key={line.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono font-bold">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                      {line.accountCode}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {line.accountNameAr}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {line.descriptionAr || entry.descriptionAr}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700 bg-emerald-50/40">
                      {line.debit > 0 ? Number(line.debit).toFixed(3) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-700 bg-blue-50/40">
                      {line.credit > 0 ? Number(line.credit).toFixed(3) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-900 text-white font-bold text-xs">
                <tr>
                  <td colSpan={4} className="py-3 px-4 text-right">
                    <span>الإجمالي الكلي المتوازن (Total Balanced Sum):</span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-emerald-300 text-sm">
                    {Number(entry.totalDebit).toFixed(3)}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-blue-300 text-sm">
                    {Number(entry.totalCredit).toFixed(3)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Verification & Signatures */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-200 text-xs">
            <div className="space-y-6">
              <span className="font-bold text-slate-700 block">إعداد المحاسب (Prepared By):</span>
              <div className="border-b border-slate-400 pb-1">
                <span className="font-medium text-slate-900">{entry.createdBy || 'المحاسب المسؤول'}</span>
              </div>
              <span className="text-[10px] text-slate-400">التوقيع والتاريخ</span>
            </div>

            <div className="space-y-6">
              <span className="font-bold text-slate-700 block">مراجعة وتدقيق (Audited By):</span>
              <div className="border-b border-slate-400 pb-1">
                <span className="font-medium text-slate-900">{entry.reviewedBy || 'رئيس الحسابات'}</span>
              </div>
              <span className="text-[10px] text-slate-400">التوقيع والتاريخ</span>
            </div>

            <div className="space-y-6">
              <span className="font-bold text-slate-700 block">اعتماد المدير المالي (Approved By):</span>
              <div className="border-b border-slate-400 pb-1">
                <span className="font-medium text-slate-900">{entry.postedBy || 'المدير المالي التنفيذي'}</span>
              </div>
              <span className="text-[10px] text-slate-400">الختم المالي الرسمي</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
