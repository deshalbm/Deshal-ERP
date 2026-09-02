import React, { useState } from 'react';
import {
  Settings,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Save,
  Shield,
  Layers,
  Calendar,
  DollarSign
} from 'lucide-react';
import {
  AccountingSettings,
  FiscalPeriod,
  Account
} from '../../types';
import { useLanguage } from '../../utils/LanguageContext';
import {
  saveAccountingSettings,
  closeFiscalPeriod,
  reopenFiscalPeriod,
  loadAccountingRevisionLogs,
  saveAccountingRevisionLogs
} from '../../utils/accountingStorage';

interface AccountingSettingsTabProps {
  settings: AccountingSettings;
  fiscalPeriods: FiscalPeriod[];
  accounts: Account[];
  currentUserName: string;
  onRefreshData: () => void;
  onNotification: (msg: string) => void;
  onSaveFiscalPeriods?: (periods: FiscalPeriod[]) => void;
}

export const AccountingSettingsTab: React.FC<AccountingSettingsTabProps> = ({
  settings,
  fiscalPeriods,
  accounts,
  currentUserName,
  onRefreshData,
  onNotification,
  onSaveFiscalPeriods
}) => {
  const { isRTL } = useLanguage();
  const [formData, setFormData] = useState<AccountingSettings>(settings);
  const [selectedPeriodForUnlock, setSelectedPeriodForUnlock] = useState<FiscalPeriod | null>(null);
  const [unlockReason, setUnlockReason] = useState<string>('');

  const postingAccounts = accounts.filter((a) => a.isPosting);

  const handleFieldChange = (field: keyof AccountingSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDefaultAccountChange = (key: keyof AccountingSettings['defaultAccounts'], accountId: string) => {
    setFormData((prev) => ({
      ...prev,
      defaultAccounts: {
        ...prev.defaultAccounts,
        [key]: accountId
      }
    }));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AccountingSettings = {
      ...formData,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUserName
    };
    saveAccountingSettings(updated);
    onNotification('تم حفظ وتحديث إعدادات النظام المحاسبي وربط الحسابات الافتراضية بنجاح.');
    onRefreshData();
  };

  // Close period
  const handleLockPeriod = (periodId: string) => {
    const { updatedPeriods, period } = closeFiscalPeriod(periodId, fiscalPeriods, currentUserName);
    if (onSaveFiscalPeriods) {
      onSaveFiscalPeriods(updatedPeriods);
    }
    onNotification(`تم إقفال الفترة المالية (${period.nameAr}) بنجاح ومنع الترحيل إليها.`);
    onRefreshData();
  };

  // Reopen period
  const handleConfirmUnlockPeriod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPeriodForUnlock || !unlockReason.trim()) return;

    const { updatedPeriods, period } = reopenFiscalPeriod(
      selectedPeriodForUnlock.id,
      unlockReason.trim(),
      fiscalPeriods,
      currentUserName
    );

    if (onSaveFiscalPeriods) {
      onSaveFiscalPeriods(updatedPeriods);
    }

    setSelectedPeriodForUnlock(null);
    setUnlockReason('');
    onNotification(`تم إعادة فتح الفترة المالية (${period.nameAr}) وتوثيق السبب في سجل التدقيق.`);
    onRefreshData();
  };

  return (
    <div id="accounting-settings-tab" className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center gap-3 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900">
            إعدادات النواة المحاسبية وإدارة الفترات المالية (Accounting Settings & Fiscal Periods)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            تخصيص الحسابات الافتراضية، وقواعد القيد المزدوج، وإقفال ومراجعة الفترات المحاسبية
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Core Rules & System Toggles */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-black text-sm border-b border-slate-100 pb-3">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>سياسات القيد المالي والرقابة (Control & Enforcement Policies)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={formData.strictDoubleEntry}
                onChange={(e) => handleFieldChange('strictDoubleEntry', e.target.checked)}
                className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">إلزامية القيد المزدوج الصارم (Strict Double-Entry)</span>
                <span className="text-slate-500 mt-0.5 block">
                  منع حفظ أو ترحيل أي قيد إذا كان مجموع المدين لا يساوي مجموع الدائن تماماً.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={formData.allowPostingToClosedPeriods}
                onChange={(e) => handleFieldChange('allowPostingToClosedPeriods', e.target.checked)}
                className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">السماح بالترحيل للفترات المقفلة (استثنائي)</span>
                <span className="text-slate-500 mt-0.5 block">
                  تفعيل صلاحية الترحيل للفترات المقفلة (يجب أن تكون معطلة افتراضياً للحماية).
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={formData.autoPostOperationalJournals}
                onChange={(e) => handleFieldChange('autoPostOperationalJournals', e.target.checked)}
                className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">الترحيل الآلي للعمليات التشغيلية (Auto-Posting)</span>
                <span className="text-slate-500 mt-0.5 block">
                  توليد وترحيل قيود السندات والفواتير والرواتب فور اعتمادها مباشرة.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={formData.requireCostCenterForExpenses}
                onChange={(e) => handleFieldChange('requireCostCenterForExpenses', e.target.checked)}
                className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">إلزامية تحديد مركز التكلفة للمصروفات</span>
                <span className="text-slate-500 mt-0.5 block">
                  إلزام المحاسب باختيار مركز تكلفة عند إدخال أي حساب من حسابات المصروفات التشغيلية.
                </span>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">العملة الأساسية (Base Currency):</label>
              <input
                type="text"
                value={formData.baseCurrency}
                onChange={(e) => handleFieldChange('baseCurrency', e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">السنة المالية الحالية (Fiscal Year):</label>
              <input
                type="number"
                value={formData.fiscalYear}
                onChange={(e) => handleFieldChange('fiscalYear', parseInt(e.target.value) || 2026)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">بادئة ترقيم قيود اليومية (Prefix):</label>
              <input
                type="text"
                value={formData.journalNumberPrefix}
                onChange={(e) => handleFieldChange('journalNumberPrefix', e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Default Accounts Mapping */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-black text-sm border-b border-slate-100 pb-3">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>ربط وتوجيه الحسابات الافتراضية للنظام (Default Accounts Mapping)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* Cash Account */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">حساب النقدية والخزينة الرئيسي:</label>
              <select
                value={formData.defaultAccounts.cashAccountId}
                onChange={(e) => handleDefaultAccountChange('cashAccountId', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
              >
                {postingAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} - {a.nameAr}
                  </option>
                ))}
              </select>
            </div>

            {/* Bank Account */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">حساب البنك الافتراضي:</label>
              <select
                value={formData.defaultAccounts.bankAccountId}
                onChange={(e) => handleDefaultAccountChange('bankAccountId', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
              >
                {postingAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} - {a.nameAr}
                  </option>
                ))}
              </select>
            </div>

            {/* Accounts Receivable */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">حساب العملاء والمدينون (AR):</label>
              <select
                value={formData.defaultAccounts.arAccountId}
                onChange={(e) => handleDefaultAccountChange('arAccountId', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
              >
                {postingAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} - {a.nameAr}
                  </option>
                ))}
              </select>
            </div>

            {/* Accounts Payable */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">حساب الموردون والدائنون (AP):</label>
              <select
                value={formData.defaultAccounts.apAccountId}
                onChange={(e) => handleDefaultAccountChange('apAccountId', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
              >
                {postingAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} - {a.nameAr}
                  </option>
                ))}
              </select>
            </div>

            {/* Sales Revenue */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">حساب إيرادات المبيعات والخدمات:</label>
              <select
                value={formData.defaultAccounts.salesAccountId}
                onChange={(e) => handleDefaultAccountChange('salesAccountId', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
              >
                {postingAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} - {a.nameAr}
                  </option>
                ))}
              </select>
            </div>

            {/* COGS */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">حساب تكلفة البضاعة والمبيعات (COGS):</label>
              <select
                value={formData.defaultAccounts.cogsAccountId}
                onChange={(e) => handleDefaultAccountChange('cogsAccountId', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
              >
                {postingAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} - {a.nameAr}
                  </option>
                ))}
              </select>
            </div>

            {/* Output VAT */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">حساب ضريبة القيمة المضافة المحصلة (5%):</label>
              <select
                value={formData.defaultAccounts.taxPayableAccountId}
                onChange={(e) => handleDefaultAccountChange('taxPayableAccountId', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
              >
                {postingAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} - {a.nameAr}
                  </option>
                ))}
              </select>
            </div>

            {/* Input VAT */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">حساب ضريبة المشتريات القابلة للاسترداد (5%):</label>
              <select
                value={formData.defaultAccounts.taxReceivableAccountId}
                onChange={(e) => handleDefaultAccountChange('taxReceivableAccountId', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
              >
                {postingAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} - {a.nameAr}
                  </option>
                ))}
              </select>
            </div>

            {/* Retained Earnings */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">حساب الأرباح المبقاة والمدورة (Retained Earnings):</label>
              <select
                value={formData.defaultAccounts.retainedEarningsAccountId}
                onChange={(e) => handleDefaultAccountChange('retainedEarningsAccountId', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
              >
                {postingAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} - {a.nameAr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              id="save-accounting-settings-btn"
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black shadow-md hover:shadow-indigo-600/25 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>حفظ إعدادات وتوجيه الحسابات</span>
            </button>
          </div>
        </div>
      </form>

      {/* Fiscal Periods Management Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>إدارة وإقفال الفترات المالية المحاسبية (Fiscal Periods Lock/Unlock)</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            السنة المالية 2026 (12 فترة شهرية)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="bg-slate-100/75 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-3 px-4">رقم الفترة</th>
                <th className="py-3 px-4">اسم الفترة</th>
                <th className="py-3 px-4 font-mono">تاريخ البداية</th>
                <th className="py-3 px-4 font-mono">تاريخ النهاية</th>
                <th className="py-3 px-4 text-center">حالة الفترة</th>
                <th className="py-3 px-4 text-center">الإجراء والرقابة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {fiscalPeriods.map((p) => {
                const isClosed = p.status === 'CLOSED' || p.status === 'LOCKED';
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-500">
                      P-{String(p.periodNumber).padStart(2, '0')}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{p.nameAr}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{p.startDate}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{p.endDate}</td>
                    <td className="py-3 px-4 text-center">
                      {isClosed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          <Lock className="w-3 h-3" />
                          <span>مقفل (LOCKED)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>مفتوح للترحيل (OPEN)</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isClosed ? (
                        <button
                          onClick={() => {
                            setSelectedPeriodForUnlock(p);
                            setUnlockReason('');
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-[11px] font-bold border border-amber-200 transition-colors"
                        >
                          <Unlock className="w-3 h-3" />
                          <span>إعادة فتح الفترة</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleLockPeriod(p.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-xl text-[11px] font-bold border border-purple-200 transition-colors"
                        >
                          <Lock className="w-3 h-3" />
                          <span>إقفال الفترة</span>
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

      {/* Reopen Period Modal */}
      {selectedPeriodForUnlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>إعادة فتح الفترة المالية ({selectedPeriodForUnlock.nameAr})</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              إعادة فتح فترة مقفلة هو إجراء رقابي حساس. يرجى توثيق مبرر إعادة الفتح ليتم تسجيله في سجل التدقيق المالي مع اسم المستخدم والوقت.
            </p>

            <form onSubmit={handleConfirmUnlockPeriod} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">مبرر وسبب إعادة الفتح <span className="text-rose-600">*</span>:</label>
                <textarea
                  rows={3}
                  value={unlockReason}
                  onChange={(e) => setUnlockReason(e.target.value)}
                  placeholder="مثال: تسجيل قيود تسوية مخصص نهاية الخدمة بناءً على مراجعة المدقق الخارجي..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 resize-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedPeriodForUnlock(null)}
                  className="px-4 py-2 text-slate-600 font-bold rounded-xl hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md"
                >
                  تأكيد الفتح وتوثيق السجل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
