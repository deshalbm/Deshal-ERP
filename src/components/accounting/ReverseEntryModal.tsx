import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  AlertTriangle,
  FileCheck,
  CheckCircle2
} from 'lucide-react';
import { JournalEntry, CompanySettings } from '../../types';
import { useLanguage } from '../../utils/LanguageContext';

interface ReverseEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: JournalEntry | null;
  onConfirmReverse: (entryId: string, reason: string) => void;
  currency?: string;
}

export const ReverseEntryModal: React.FC<ReverseEntryModalProps> = ({
  isOpen,
  onClose,
  entry,
  onConfirmReverse,
  currency = 'OMR'
}) => {
  const { isRTL } = useLanguage();
  const [reason, setReason] = useState<string>('');
  const [selectedQuickReason, setSelectedQuickReason] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !entry) return null;

  const quickReasons = [
    'خطأ في توجيه الحساب المدين أو الدائن',
    'تكرار تسجيل القيد عن طريق الخطأ',
    'إلغاء المعاملة التشغيلية من قبل الإدارة',
    'تعديل المبالغ أو نسب الضريبة',
    'تسوية عكسية دورية لنهاية الفترة'
  ];

  const handleSelectQuickReason = (qReason: string) => {
    setSelectedQuickReason(qReason);
    setReason(qReason);
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMessage('يرجى كتابة سبب العكس المحاسبي لحفظه في سجل التدقيق المالي.');
      return;
    }
    onConfirmReverse(entry.id, reason.trim());
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="reverse-entry-modal"
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-rose-100 overflow-hidden flex flex-col my-6 animate-in zoom-in-95 duration-150"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-rose-900 to-slate-900 text-white border-b border-rose-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black">عكس القيد المحاسبي (Journal Reversal)</h3>
              <span className="text-xs text-rose-200 font-mono">{entry.entryNumber}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <p className="font-bold">قاعدة الثبات المحاسبي (Immutability):</p>
              <p className="mt-1 text-amber-800">
                القيود المرحلة لا يمكن تعديلها أو حذفها مباشرة. سيقوم النظام بإنشاء قيد عكسي كامل يعكس كافة الأطراف المدينة والدائنة وربطه بالقيد الأصلي وتوثيقه في سجل التدقيق.
              </p>
            </div>
          </div>

          {/* Original Entry Summary */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between text-slate-500 font-semibold">
              <span>تاريخ القيد: <strong className="text-slate-800 font-mono">{entry.date}</strong></span>
              <span>المبلغ الإجمالي: <strong className="text-slate-800 font-mono">{entry.totalDebit.toFixed(3)} {currency}</strong></span>
            </div>
            <div className="text-slate-700">
              <span className="text-slate-500">البيان: </span>
              {entry.descriptionAr}
            </div>
          </div>

          {/* Quick Reasons */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              اختر سبب العكس الشائع أو اكتب سببك:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {quickReasons.map((qReason, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleSelectQuickReason(qReason)}
                  className={`text-[11px] px-2.5 py-1.5 rounded-xl border transition-all text-right ${
                    selectedQuickReason === qReason
                      ? 'bg-rose-50 border-rose-400 text-rose-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {qReason}
                </button>
              ))}
            </div>
          </div>

          {/* Reason Textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              سبب العكس المحاسبي بالتفصيل <span className="text-rose-600">*</span>
            </label>
            <textarea
              id="reversal-reason-input"
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="مثال: تم إلغاء الفاتورة من قبل الإدارة بناءً على طلب العميل واستبدالها بسند جديد..."
              className="w-full text-xs p-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
            />
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
              {errorMessage}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              إلغاء
            </button>
            <button
              id="confirm-reverse-entry-btn"
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-rose-600/25 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>تأكيد العكس وترحيل القيد العكسي</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
