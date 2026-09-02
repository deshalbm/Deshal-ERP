import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  FileText,
  Building2,
  Calendar,
  Save,
  DollarSign
} from 'lucide-react';
import {
  Account,
  JournalEntry,
  JournalEntryLine,
  JournalEntryType,
  Branch,
  CompanySettings
} from '../../types';
import { useLanguage } from '../../utils/LanguageContext';

interface JournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: JournalEntry) => void;
  accounts: Account[];
  branches: Branch[];
  settings: CompanySettings;
  entryToEdit?: JournalEntry | null;
  defaultType?: JournalEntryType;
  currentUserName: string;
}

export const JournalEntryModal: React.FC<JournalEntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  accounts,
  branches,
  settings,
  entryToEdit,
  defaultType = 'STANDARD',
  currentUserName
}) => {
  const { t, isRTL } = useLanguage();

  const postingAccounts = accounts.filter((a) => a.isPosting);

  const [entryDate, setEntryDate] = useState<string>(
    entryToEdit?.date || new Date().toISOString().split('T')[0]
  );
  const [entryType, setEntryType] = useState<JournalEntryType>(
    entryToEdit?.type || defaultType
  );
  const [entryNumber, setEntryNumber] = useState<string>(
    entryToEdit?.entryNumber ||
      `${entryType === 'ADJUSTING' ? 'ADJ' : 'JE'}-${new Date().getFullYear()}-${Math.floor(
        1000 + Math.random() * 9000
      )}`
  );
  const [descriptionAr, setDescriptionAr] = useState<string>(
    entryToEdit?.descriptionAr || ''
  );
  const [descriptionEn, setDescriptionEn] = useState<string>(
    entryToEdit?.descriptionEn || ''
  );
  const [referenceNumber, setReferenceNumber] = useState<string>(
    entryToEdit?.referenceNumber || ''
  );
  const [branchId, setBranchId] = useState<string>(
    entryToEdit?.branchId || (branches[0]?.id || '')
  );
  const [notes, setNotes] = useState<string>(entryToEdit?.notes || '');

  // Dynamic Journal Lines
  const [lines, setLines] = useState<JournalEntryLine[]>(() => {
    if (entryToEdit?.lines && entryToEdit.lines.length >= 2) {
      return entryToEdit.lines;
    }
    const defaultAcc1 = postingAccounts[0] || { id: '', code: '', nameAr: '' };
    const defaultAcc2 = postingAccounts[1] || { id: '', code: '', nameAr: '' };

    return [
      {
        id: `line-${Date.now()}-1`,
        accountId: defaultAcc1.id,
        accountCode: defaultAcc1.code,
        accountNameAr: defaultAcc1.nameAr,
        debit: 0,
        credit: 0,
        descriptionAr: ''
      },
      {
        id: `line-${Date.now()}-2`,
        accountId: defaultAcc2.id,
        accountCode: defaultAcc2.code,
        accountNameAr: defaultAcc2.nameAr,
        debit: 0,
        credit: 0,
        descriptionAr: ''
      }
    ];
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculators
  const totalDebit = lines.reduce((acc, curr) => acc + (Number(curr.debit) || 0), 0);
  const totalCredit = lines.reduce((acc, curr) => acc + (Number(curr.credit) || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.001 && totalDebit > 0;

  const handleAddLine = () => {
    const defaultAcc = postingAccounts[0] || { id: '', code: '', nameAr: '' };
    setLines((prev) => [
      ...prev,
      {
        id: `line-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        accountId: defaultAcc.id,
        accountCode: defaultAcc.code,
        accountNameAr: defaultAcc.nameAr,
        debit: 0,
        credit: 0,
        descriptionAr: descriptionAr || ''
      }
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 2) {
      setErrorMessage('يجب أن يحتوي القيد المحاسبي على طرفين على الأقل (مدين ودائن)');
      return;
    }
    setLines((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleLineChange = (
    index: number,
    field: keyof JournalEntryLine,
    value: any
  ) => {
    setErrorMessage(null);
    setLines((prev) => {
      const updated = [...prev];
      const target = { ...updated[index] };

      if (field === 'accountId') {
        const found = postingAccounts.find((a) => a.id === value);
        if (found) {
          target.accountId = found.id;
          target.accountCode = found.code;
          target.accountNameAr = found.nameAr;
          target.accountNameEn = found.nameEn;
        }
      } else if (field === 'debit') {
        const num = Math.max(0, parseFloat(value) || 0);
        target.debit = num;
        if (num > 0) target.credit = 0; // Prevent entering both debit and credit on same line
      } else if (field === 'credit') {
        const num = Math.max(0, parseFloat(value) || 0);
        target.credit = num;
        if (num > 0) target.debit = 0; // Prevent entering both debit and credit on same line
      } else {
        (target as any)[field] = value;
      }

      updated[index] = target;
      return updated;
    });
  };

  const handleSubmit = (actionType: 'SAVE_DRAFT' | 'POST_NOW') => {
    setErrorMessage(null);

    if (!descriptionAr.trim()) {
      setErrorMessage('يرجى كتابة البيان العام / شرح القيد');
      return;
    }

    if (totalDebit <= 0 || totalCredit <= 0) {
      setErrorMessage('يرجى إدخال مبالغ صالحة في أطراف القيد');
      return;
    }

    if (!isBalanced) {
      setErrorMessage(
        `القيد غير متوازن! إجمالي المدين (${totalDebit.toFixed(
          3
        )}) لا يساوي إجمالي الدائن (${totalCredit.toFixed(
          3
        )}). الفارق: ${difference.toFixed(3)} ${settings.currency || 'OMR'}`
      );
      return;
    }

    // Ensure all accounts are selected
    const invalidLine = lines.find((l) => !l.accountId || (l.debit === 0 && l.credit === 0));
    if (invalidLine) {
      setErrorMessage('تأكد من اختيار الحساب وإدخال مبلغ لكل سطر في القيد');
      return;
    }

    const branchObj = branches.find((b) => b.id === branchId);

    const newEntry: JournalEntry = {
      id: entryToEdit?.id || `je-${Date.now()}`,
      entryNumber,
      date: entryDate,
      type: entryType,
      status: actionType === 'POST_NOW' ? 'POSTED' : 'DRAFT',
      referenceType: 'MANUAL',
      referenceNumber: referenceNumber || undefined,
      descriptionAr: descriptionAr.trim(),
      descriptionEn: descriptionEn.trim() || undefined,
      lines: lines.map((l) => ({
        ...l,
        descriptionAr: l.descriptionAr || descriptionAr.trim()
      })),
      totalDebit,
      totalCredit,
      isBalanced: true,
      branchId: branchId || undefined,
      branchName: branchObj?.name,
      createdBy: entryToEdit?.createdBy || currentUserName,
      postedBy: actionType === 'POST_NOW' ? currentUserName : undefined,
      postedAt: actionType === 'POST_NOW' ? new Date().toISOString() : undefined,
      notes: notes.trim() || undefined,
      createdAt: entryToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(newEntry);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:hidden">
      <div
        id="journal-entry-modal-card"
        className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8 animate-in zoom-in-95 duration-200"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">
                {entryToEdit
                  ? 'تعديل القيد المحاسبي المزدوج'
                  : entryType === 'ADJUSTING'
                  ? 'إنشاء قيد تسوية وإقفال مالي (Adjusting Entry)'
                  : 'إنشاء قيد يومية عامة مزدوج (General Journal Entry)'}
              </h3>
              <p className="text-xs text-slate-400">
                تسجيل الحركات المالية بمبدأ القيد المزدوج مع التحقق اللحظي من التوازن
              </p>
            </div>
          </div>
          <button
            id="close-journal-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-sm animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">تنبيه محاسبي:</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Top Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رقم القيد (Entry No.)
              </label>
              <input
                id="je-entry-number-input"
                type="text"
                value={entryNumber}
                onChange={(e) => setEntryNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                تاريخ القيد (Date)
              </label>
              <input
                id="je-entry-date-input"
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                نوع القيد (Entry Type)
              </label>
              <select
                id="je-entry-type-select"
                value={entryType}
                onChange={(e) => setEntryType(e.target.value as JournalEntryType)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="STANDARD">قيد يومية عادي (Standard JE)</option>
                <option value="ADJUSTING">قيد تسوية فترية (Adjusting Entry)</option>
                <option value="CLOSING">قيد إقفال سنوي (Closing Entry)</option>
                <option value="OPENING">قيد افتتاحي (Opening Entry)</option>
                <option value="REVERSAL">قيد عكسي وتصحيحي (Reversal Entry)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الفرع / المركز (Branch)
              </label>
              <select
                id="je-entry-branch-select"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description & Reference */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                البيان العام / شرح القيد (Arabic Description) *
              </label>
              <input
                id="je-description-ar-input"
                type="text"
                placeholder="مثال: إثبات إيجار شهر مارس وسداد الرسوم البنكية..."
                value={descriptionAr}
                onChange={(e) => setDescriptionAr(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رقم المستند المرجعي (Reference Doc)
              </label>
              <input
                id="je-ref-number-input"
                type="text"
                placeholder="مثال: INV-10492 / VOUCH-082"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Dynamic Journal Lines Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
            <div className="bg-slate-100/90 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                أطراف القيد المحاسبي (Journal Lines)
              </span>
              <button
                id="add-journal-line-btn"
                type="button"
                onClick={handleAddLine}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة طرف قيد</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 font-bold w-12 text-center">#</th>
                    <th className="py-2.5 px-3 font-bold min-w-[220px]">
                      الحساب المحاسبي (Chart of Account)
                    </th>
                    <th className="py-2.5 px-3 font-bold min-w-[180px]">
                      الشرح / البيان التفصيلي
                    </th>
                    <th className="py-2.5 px-3 font-bold w-36 text-center text-emerald-800 bg-emerald-50/50">
                      مدين Debit ({settings.currency || 'OMR'})
                    </th>
                    <th className="py-2.5 px-3 font-bold w-36 text-center text-blue-800 bg-blue-50/50">
                      دائن Credit ({settings.currency || 'OMR'})
                    </th>
                    <th className="py-2.5 px-2 font-bold w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lines.map((line, idx) => (
                    <tr key={line.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-3 text-center text-slate-400 font-mono font-bold">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3">
                        <select
                          id={`line-account-select-${idx}`}
                          value={line.accountId}
                          onChange={(e) => handleLineChange(idx, 'accountId', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          {postingAccounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.code} - {acc.nameAr} ({acc.type})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          placeholder={descriptionAr || 'بيان السطر...'}
                          value={line.descriptionAr}
                          onChange={(e) => handleLineChange(idx, 'descriptionAr', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="py-2 px-3 bg-emerald-50/20">
                        <input
                          id={`line-debit-input-${idx}`}
                          type="number"
                          step="0.001"
                          min="0"
                          value={line.debit || ''}
                          onChange={(e) => handleLineChange(idx, 'debit', e.target.value)}
                          placeholder="0.000"
                          className="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-center bg-white border border-emerald-300 rounded-lg text-emerald-800 focus:ring-2 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="py-2 px-3 bg-blue-50/20">
                        <input
                          id={`line-credit-input-${idx}`}
                          type="number"
                          step="0.001"
                          min="0"
                          value={line.credit || ''}
                          onChange={(e) => handleLineChange(idx, 'credit', e.target.value)}
                          placeholder="0.000"
                          className="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-center bg-white border border-blue-300 rounded-lg text-blue-800 focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="حذف السطر"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Table Totals & Balance Verification Footer */}
                <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-800">
                  <tr>
                    <td colSpan={3} className="py-3 px-4 text-right">
                      <span className="text-sm">المجموع الإجمالي (Totals):</span>
                    </td>
                    <td className="py-3 px-3 text-center bg-emerald-100/60 text-emerald-950 font-mono text-sm">
                      {totalDebit.toFixed(3)} {settings.currency || 'OMR'}
                    </td>
                    <td className="py-3 px-3 text-center bg-blue-100/60 text-blue-950 font-mono text-sm">
                      {totalCredit.toFixed(3)} {settings.currency || 'OMR'}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Balance Indicator Status Bar */}
          <div
            className={`p-4 rounded-2xl flex items-center justify-between border transition-all ${
              isBalanced
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-3">
              {isBalanced ? (
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
              )}
              <div>
                <h4 className="text-sm font-bold">
                  {isBalanced
                    ? 'القيد متوازن محاسبياً (Balanced Journal Entry)'
                    : 'القيد غير متوازن (Unbalanced Entry)'}
                </h4>
                <p className="text-xs opacity-90">
                  {isBalanced
                    ? `مجموع المدين (${totalDebit.toFixed(
                        3
                      )}) = مجموع الدائن (${totalCredit.toFixed(
                        3
                      )}) وفق المعادلة المحاسبية المزدوجة`
                    : `يوجد فارق قدره ${difference.toFixed(
                        3
                      )} ${settings.currency || 'OMR'} يجب معالجته ليسمح بالترحيل`}
                </p>
              </div>
            </div>

            <div className="text-left font-mono text-sm">
              <span className="block text-xs text-slate-500 font-sans">فارق التوازن:</span>
              <span className={`font-bold ${isBalanced ? 'text-emerald-700' : 'text-amber-700'}`}>
                {difference.toFixed(3)} {settings.currency || 'OMR'}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ملاحظات وتوثيقات إضافية (Internal Audit Notes)
            </label>
            <textarea
              id="je-internal-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي تفاصيل أو اعتمادات ترغب في توثيقها مع القيد..."
              className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-100 border-t border-slate-200">
          <button
            id="cancel-journal-btn"
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm transition-colors"
          >
            إلغاء التراجع
          </button>

          <div className="flex items-center gap-3">
            <button
              id="save-draft-journal-btn"
              type="button"
              onClick={() => handleSubmit('SAVE_DRAFT')}
              disabled={!isBalanced}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              حفظ كمسودة (Save Draft)
            </button>
            <button
              id="post-journal-now-btn"
              type="button"
              onClick={() => handleSubmit('POST_NOW')}
              disabled={!isBalanced}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>اعتماد وترحيل القيد للأستاذ العام (Post to GL)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
