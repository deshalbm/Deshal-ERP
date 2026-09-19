import React, { useState } from "react";
import { Building2, GitBranch, Globe, DollarSign, Save, CheckCircle2, ShieldCheck } from "lucide-react";
import { CompanySettings, Branch } from "../../../types";
import { useLanguage } from "../../../utils/LanguageContext";
import { useTenant } from "../../../contexts/TenantContext";

interface GeneralSettingsSectionProps {
  settings?: CompanySettings;
  branches?: Branch[];
  onSaveSettings?: (settings: CompanySettings) => void;
}

export const GeneralSettingsSection: React.FC<GeneralSettingsSectionProps> = ({
  settings,
  branches = [],
  onSaveSettings
}) => {
  const { isRTL } = useLanguage();
  const { state: tenantState } = useTenant();
  const activeCompany = tenantState.activeCompany;

  const [formData, setFormData] = useState({
    companyNameAr: activeCompany?.nameAr || settings?.companyNameAr || "مؤسسة ديشال ERP",
    companyNameEn: activeCompany?.nameEn || settings?.companyNameEn || "Deshal ERP Enterprise",
    taxNumber: settings?.taxNumber || "OM1200984531",
    crNumber: settings?.crNumber || "CR-1092847",
    currency: settings?.currency || "OMR",
    phone: settings?.phone || "+968 22730630",
    email: settings?.email || "info@deshalbm.com",
    address: settings?.address || "فلج القبائل، صحار، سلطنة عُمان"
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveSettings && settings) {
      onSaveSettings({
        ...settings,
        companyNameAr: formData.companyNameAr,
        companyNameEn: formData.companyNameEn,
        taxNumber: formData.taxNumber,
        crNumber: formData.crNumber,
        currency: formData.currency,
        phone: formData.phone,
        email: formData.email,
        address: formData.address
      });
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">إعدادات الشركة والهوية المؤسسية</h2>
          <p className="text-xs text-slate-500">إدارة معلومات السجل التجاري، الرقم الضريبي، الفروع والعملة الافتراضية</p>
        </div>
        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" /> تم حفظ التغييرات بنجاح
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Company Profile Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" /> الملف التعريفي والسجل التجاري
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">اسم الشركة (بالعربية)</label>
              <input
                type="text"
                value={formData.companyNameAr}
                onChange={e => setFormData({ ...formData, companyNameAr: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">اسم الشركة (بالإنجليزية)</label>
              <input
                type="text"
                value={formData.companyNameEn}
                onChange={e => setFormData({ ...formData, companyNameEn: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">رقم السجل التجاري (CR)</label>
              <input
                type="text"
                value={formData.crNumber}
                onChange={e => setFormData({ ...formData, crNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">الرقم الضريبي (VAT Identification)</label>
              <input
                type="text"
                value={formData.taxNumber}
                onChange={e => setFormData({ ...formData, taxNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Contact & Address Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-600" /> التواصل والعنوان
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">الهاتف الرسمي</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">العملة الافتراضية</label>
              <select
                value={formData.currency}
                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-indigo-500 bg-white"
              >
                <option value="OMR">ريال عماني (OMR)</option>
                <option value="AED">درهم إماراتي (AED)</option>
                <option value="SAR">ريال سعودي (SAR)</option>
                <option value="USD">دولار أمريكي (USD)</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">العنوان الجغرافي والرئيسي</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Branches Overview Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-indigo-600" /> الفروع التشغيلية المسجلة ({branches.length || 2})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800">فرع صحار الرئيسي</h4>
                <p className="text-[11px] text-slate-500">فلج القبائل - بالقرب من الميناء والمنطقة الحرة</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">نشط</span>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800">فرع مسقط الإداري</h4>
                <p className="text-[11px] text-slate-500">العذيبة الشمالية - شارع 18 نوفمبر</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">نشط</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <Save className="w-4 h-4" /> حفظ التعديلات
          </button>
        </div>

      </form>

    </div>
  );
};
