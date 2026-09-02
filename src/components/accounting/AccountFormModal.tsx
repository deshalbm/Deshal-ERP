import React, { useState } from 'react';
import { X, Check, AlertCircle, BookmarkPlus } from 'lucide-react';
import { Account, AccountType, AccountCategory } from '../../types';
import { useLanguage } from '../../utils/LanguageContext';

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (account: Account) => void;
  existingAccounts: Account[];
  accountToEdit?: Account | null;
}

export const AccountFormModal: React.FC<AccountFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingAccounts,
  accountToEdit
}) => {
  const { isRTL } = useLanguage();

  const [code, setCode] = useState<string>(accountToEdit?.code || '');
  const [nameAr, setNameAr] = useState<string>(accountToEdit?.nameAr || '');
  const [nameEn, setNameEn] = useState<string>(accountToEdit?.nameEn || '');
  const [type, setType] = useState<AccountType>(accountToEdit?.type || 'ASSET');
  const [category, setCategory] = useState<AccountCategory>(
    accountToEdit?.category || 'CURRENT_ASSET'
  );
  const [parentId, setParentId] = useState<string>(accountToEdit?.parentId || '');
  const [isPosting, setIsPosting] = useState<boolean>(accountToEdit?.isPosting ?? true);
  const [openingBalance, setOpeningBalance] = useState<number>(
    accountToEdit?.openingBalance || 0
  );
  const [description, setDescription] = useState<string>(accountToEdit?.description || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const parentCandidates = existingAccounts.filter((a) => !a.isPosting && a.id !== accountToEdit?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!code.trim()) {
      setErrorMessage('يرجى إدخال رمز الحساب الرقمي (مثل 1160)');
      return;
    }
    if (!nameAr.trim()) {
      setErrorMessage('يرجى إدخال اسم الحساب باللغة العربية');
      return;
    }

    // Check code uniqueness
    const codeConflict = existingAccounts.find(
      (a) => a.code.trim() === code.trim() && a.id !== accountToEdit?.id
    );
    if (codeConflict) {
      setErrorMessage(`رمز الحساب "${code}" مستخدم مسبقاً لحساب "${codeConflict.nameAr}"`);
      return;
    }

    const newAccount: Account = {
      id: accountToEdit?.id || `acc-${Date.now()}`,
      code: code.trim(),
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim() || nameAr.trim(),
      type,
      category,
      parentId: parentId || undefined,
      isPosting,
      openingBalance: Number(openingBalance) || 0,
      currentBalance: Number(openingBalance) || 0,
      currency: 'OMR',
      description: description.trim() || undefined,
      isSystem: accountToEdit?.isSystem ?? false,
      isActive: true,
      createdAt: accountToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(newAccount);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:hidden">
      <div
        id="account-form-modal-card"
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8 animate-in zoom-in-95 duration-200"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <BookmarkPlus className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold">
              {accountToEdit ? 'تعديل بيانات الحساب المحاسبي' : 'إضافة حساب جديد لدليل الحسابات'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                رمز الحساب (Account Code) *
              </label>
              <input
                id="acc-code-input"
                type="text"
                placeholder="مثال: 1160"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                النوع الرئيسي (Type) *
              </label>
              <select
                id="acc-type-select"
                value={type}
                onChange={(e) => setType(e.target.value as AccountType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ASSET">أصول (Assets)</option>
                <option value="LIABILITY">التزامات وخصوم (Liabilities)</option>
                <option value="EQUITY">حقوق ملكية ورأس مال (Equity)</option>
                <option value="REVENUE">إيرادات ومبيعات (Revenue)</option>
                <option value="EXPENSE">مصروفات وتكاليف (Expenses)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                اسم الحساب بالعربية (Arabic Name) *
              </label>
              <input
                id="acc-name-ar-input"
                type="text"
                placeholder="مثال: عهدة فرع صحار"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                الاسم بالإنجليزية (English Name)
              </label>
              <input
                id="acc-name-en-input"
                type="text"
                placeholder="e.g. Sohar Petty Cash"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-sans text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                التصنيف التفصيلي (Category) *
              </label>
              <select
                id="acc-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as AccountCategory)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="CURRENT_ASSET">أصول متداولة</option>
                <option value="CASH_BANK">نقدية وبنوك وعهد</option>
                <option value="ACCOUNTS_RECEIVABLE">ذمم مدينة وعملاء</option>
                <option value="INVENTORY">مخزون وبضائع</option>
                <option value="FIXED_ASSET">أصول ثابتة وتجهيزات</option>
                <option value="CURRENT_LIABILITY">التزامات متداولة وأمانات</option>
                <option value="ACCOUNTS_PAYABLE">ذمم دائنة وموردين</option>
                <option value="TAX_PAYABLE">ضرائب مستحقة (VAT)</option>
                <option value="ACCRUED_PAYROLL">رواتب مستحقة</option>
                <option value="CAPITAL">رأس مال</option>
                <option value="RETAINED_EARNINGS">أرباح مبقاة</option>
                <option value="SALES_REVENUE">إيرادات مبيعات وتأجير</option>
                <option value="SERVICE_REVENUE">إيرادات خدمات وباقات</option>
                <option value="COST_OF_GOODS_SOLD">تكلفة بضاعة مباعة (COGS)</option>
                <option value="OPERATING_EXPENSE">مصروفات تشغيلية وعمومية</option>
                <option value="SALARIES_EXPENSE">مصروفات رواتب وبدلات</option>
                <option value="RENT_EXPENSE">مصروف إيجارات</option>
                <option value="UTILITIES_EXPENSE">كهرباء ومياه وإنترنت</option>
                <option value="DEPRECIATION_EXPENSE">مصروف إهلاك أصول</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                الحساب الرئيسي الأب (Parent Account)
              </label>
              <select
                id="acc-parent-select"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">بدون حساب أب (حساب رئيسي)</option>
                {parentCandidates.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.nameAr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                الرصيد الافتتاحي (Opening Balance)
              </label>
              <input
                id="acc-opening-bal-input"
                type="number"
                step="0.001"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPosting}
                  onChange={(e) => setIsPosting(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500"
                />
                <span className="font-bold text-slate-800">
                  حساب يقبل الترحيل المباشر (Posting Leaf Account)
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              الوصف والغرض من الحساب
            </label>
            <input
              type="text"
              placeholder="وصف مختصر لطبيعة العمليات على هذا الحساب..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 font-bold text-slate-700 transition-colors"
            >
              إلغاء
            </button>
            <button
              id="save-account-btn"
              type="submit"
              className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors shadow-xs"
            >
              حفظ الحساب
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
