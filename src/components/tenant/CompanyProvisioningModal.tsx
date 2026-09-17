import React, { useState } from "react";
import {
  Building2,
  UserCheck,
  ShieldCheck,
  Layers,
  CheckCircle2,
  X,
  AlertCircle,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Lock,
  Globe,
  Briefcase
} from "lucide-react";
import {
  TenantCompanyProfile,
  TenantModuleFeatures,
  CreateTenantCompanyParams,
  getDefaultTenantModuleFeatures
} from "../../domain/tenant/tenantCompanyDomain";
import { provisionNewTenantCompany } from "../../application/services/tenantCompanyProvisioning";
import { TenantCompanyStorageAdapter } from "../../application/ports/tenantCompanyPorts";
import { defaultTenantCompanyStorageAdapter } from "../../lib/adapters/tenantCompanyStorageAdapter";

interface CompanyProvisioningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompanyProvisioned?: (company: TenantCompanyProfile) => void;
  storageAdapter?: TenantCompanyStorageAdapter;
}

export const CompanyProvisioningModal: React.FC<CompanyProvisioningModalProps> = ({
  isOpen,
  onClose,
  onCompanyProvisioned,
  storageAdapter = defaultTenantCompanyStorageAdapter
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState<string>("");
  const [crNumber, setCrNumber] = useState<string>("");
  const [taxId, setTaxId] = useState<string>("");
  const [currency, setCurrency] = useState<string>("OMR");
  const [mainBranchName, setMainBranchName] = useState<string>("الفرع الرئيسي");
  const [adminName, setAdminName] = useState<string>("");
  const [adminEmail, setAdminEmail] = useState<string>("");
  const [adminPin, setAdminPin] = useState<string>("1234");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE" | "PENDING_PROVISION">("ACTIVE");

  // Module Features State
  const [features, setFeatures] = useState<TenantModuleFeatures>(getDefaultTenantModuleFeatures());

  if (!isOpen) return null;

  const handleFeatureToggle = (key: keyof TenantModuleFeatures) => {
    setFeatures(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleNextStep = () => {
    setErrorMsg(null);
    if (currentStep === 1) {
      if (!name.trim()) {
        setErrorMsg("يرجى إدخال اسم الشركة / Please enter company name.");
        return;
      }
      if (!crNumber.trim()) {
        setErrorMsg("يرجى إدخال رقم السجل التجاري / Please enter CR number.");
        return;
      }
      if (!mainBranchName.trim()) {
        setErrorMsg("يرجى إدخال اسم الفرع الرئيسي / Please enter main branch name.");
        return;
      }
    } else if (currentStep === 2) {
      if (!adminName.trim()) {
        setErrorMsg("يرجى إدخال اسم مدير النظام / Please enter admin name.");
        return;
      }
      if (!adminEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail.trim())) {
        setErrorMsg("يرجى إدخال بريد إلكتروني صحيح / Please enter a valid admin email.");
        return;
      }
      if (!adminPin.trim() || !/^\d{4,6}$/.test(adminPin.trim())) {
        setErrorMsg("رمز PIN يجب أن يتكون من 4 إلى 6 أرقام / Admin PIN must be 4 to 6 numeric digits.");
        return;
      }
    }
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleProvisionCompany = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const params: CreateTenantCompanyParams = {
      name,
      crNumber,
      taxId,
      currency,
      mainBranchName,
      adminName,
      adminEmail,
      adminPin,
      status,
      moduleFeatures: features
    };

    const result = provisionNewTenantCompany(params, storageAdapter);

    if (!result.success || !result.profile) {
      setErrorMsg(result.error || "فشل تأسيس ملف الشركة المستأجرة");
      return;
    }

    setSuccessMsg(`تم تأسيس وتفعيل شركة (${result.profile.name}) بنجاح!`);
    if (onCompanyProvisioned) {
      onCompanyProvisioned(result.profile);
    }

    setTimeout(() => {
      onClose();
      resetForm();
    }, 1500);
  };

  const resetForm = () => {
    setCurrentStep(1);
    setErrorMsg(null);
    setSuccessMsg(null);
    setName("");
    setCrNumber("");
    setTaxId("");
    setCurrency("OMR");
    setMainBranchName("الفرع الرئيسي");
    setAdminName("");
    setAdminEmail("");
    setAdminPin("1234");
    setStatus("ACTIVE");
    setFeatures(getDefaultTenantModuleFeatures());
  };

  const featureLabels: { key: keyof TenantModuleFeatures; titleAr: string; titleEn: string; descAr: string }[] = [
    { key: "crmEnabled", titleAr: "نظام إدارة العملاء (CRM)", titleEn: "Customer Relationship Management", descAr: "إدارة بيانات العملاء، السجلات والاتصالات" },
    { key: "crmLeadsEnabled", titleAr: "العملاء المحتملين (Leads)", titleEn: "Lead Management", descAr: "تتبع الفرص التسويقية وتحويل العملاء المحتملين" },
    { key: "crmPipelineEnabled", titleAr: "المسارات البيعية (Pipelines)", titleEn: "Sales Pipeline Scope", descAr: "إدارة المراحل البيعية والمتابعة" },
    { key: "posEnabled", titleAr: "نقطة البيع (POS Terminal)", titleEn: "Point of Sale", descAr: "نظام الكاشير المباشر وإصدار الفواتير الفورية" },
    { key: "posDiscountOverrideEnabled", titleAr: "صلاحية تجاوز الخصم في الكاشير", titleEn: "POS Discount Override", descAr: "السماح بالخصم المباشر في نقطة البيع" },
    { key: "inventoryEnabled", titleAr: "إدارة المخزون والمنتجات", titleEn: "Inventory Management", descAr: "تتبع جرد المواد، أرقام SKU والباركود" },
    { key: "accountingEnabled", titleAr: "المحاسبة العامة والقيود", titleEn: "General Ledger & Accounting", descAr: "القيود المزدوجة، ميزان المراجعة والأرباح والخسائر" },
    { key: "hrEnabled", titleAr: "الموارد البشرية والرواتب", titleEn: "HR & Payroll Engine", descAr: "إدارة الموظفين، الحضور، الإجازات وحساب PASI/EOSB" },
    { key: "spacesEnabled", titleAr: "حجز القاعات ومساحات العمل", titleEn: "Space & Hall Booking", descAr: "تأجير قاعات التدريب والاجتماعات بالساعة والشهر" },
    { key: "servicesEnabled", titleAr: "إدارة الخدمات والمواعيد", titleEn: "Service Appointments", descAr: "تقديم حزم الخدمات، الحجوزات والمتابعة" },
    { key: "requestsEnabled", titleAr: "طلبات الشراء والمشتريات", titleEn: "Purchases & Procurement", descAr: "دورة اعتماد الطلبات وفواتير الموردين" },
    { key: "documentsEnabled", titleAr: "أرشفة المستندات والوثائق", titleEn: "Document Archival System", descAr: "حفظ وأرشفة ملفات وعقود الشركة" },
    { key: "kioskEnabled", titleAr: "كشك كاشف الحضور (Kiosk)", titleEn: "Attendance Kiosk", descAr: "ربط أجهزة الحضور والانصراف بالرمز PIN" }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-6 text-white flex items-center justify-between border-b border-indigo-800">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-3 bg-indigo-600/30 rounded-xl border border-indigo-400/30 text-indigo-300">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                تأسيس شركة جديدة وتحديد نطاق الموديولات
                <Sparkles className="w-5 h-5 text-amber-400" />
              </h2>
              <p className="text-xs text-indigo-200 mt-1">
                Enterprise Multi-Company Tenant Provisioning & Module Feature Scope Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Wizard Stepper Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between text-xs font-medium text-slate-600">
          <div className={`flex items-center gap-2 ${currentStep === 1 ? "text-indigo-700 font-bold" : currentStep > 1 ? "text-emerald-700" : ""}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${currentStep === 1 ? "bg-indigo-600 text-white" : currentStep > 1 ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"}`}>1</span>
            بيانات الشركة
          </div>
          <div className="h-0.5 w-12 bg-slate-200" />
          <div className={`flex items-center gap-2 ${currentStep === 2 ? "text-indigo-700 font-bold" : currentStep > 2 ? "text-emerald-700" : ""}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${currentStep === 2 ? "bg-indigo-600 text-white" : currentStep > 2 ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"}`}>2</span>
            مدير النظام
          </div>
          <div className="h-0.5 w-12 bg-slate-200" />
          <div className={`flex items-center gap-2 ${currentStep === 3 ? "text-indigo-700 font-bold" : currentStep > 3 ? "text-emerald-700" : ""}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${currentStep === 3 ? "bg-indigo-600 text-white" : currentStep > 3 ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"}`}>3</span>
            الموديولات والصلاحيات
          </div>
          <div className="h-0.5 w-12 bg-slate-200" />
          <div className={`flex items-center gap-2 ${currentStep === 4 ? "text-indigo-700 font-bold" : ""}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${currentStep === 4 ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-600"}`}>4</span>
            التأكيد والتفعيل
          </div>
        </div>

        {/* Error / Success Notifications */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Body / Wizard Steps */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* STEP 1: Company Profile Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                بيانات الهوية التجارية والفرع الرئيسي
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    اسم الشركة التجارية <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="مثال: شركة العالمي لخدمات الأعمال"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    رقم السجل التجاري (CR Number) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={crNumber}
                    onChange={e => setCrNumber(e.target.value)}
                    placeholder="مثال: CR-1049285"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    الرقم الضريبي (VAT / Tax ID)
                  </label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={e => setTaxId(e.target.value)}
                    placeholder="مثال: OM110029384"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    العملة الأساسية للنظام <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="OMR">OMR - ريال عماني</option>
                    <option value="USD">USD - دولار أمريكي</option>
                    <option value="SAR">SAR - ريال سعودي</option>
                    <option value="AED">AED - درهم إماراتي</option>
                    <option value="KWD">KWD - دينار كويتي</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    اسم الفرع الرئيسي الأول <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={mainBranchName}
                    onChange={e => setMainBranchName(e.target.value)}
                    placeholder="مثال: الفرع الرئيسي - بوشر مسقط"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Admin Credentials */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                بيانات مدير النظام الرئيسي للشركة (Tenant Admin)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    اسم مدير النظام <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={e => setAdminName(e.target.value)}
                    placeholder="مثال: أحمد بن سعيد البوسعيدي"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    البريد الإلكتروني للـ Admin <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    placeholder="admin@alalami.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    رمز الأمان الدخول السريع (Admin PIN 4-6 أرقام) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      maxLength={6}
                      value={adminPin}
                      onChange={e => setAdminPin(e.target.value)}
                      placeholder="1234"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pl-8"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    حالة تفعيل حساب الشركة
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="ACTIVE">نشط جاهز (ACTIVE)</option>
                    <option value="PENDING_PROVISION">قيد التأسيس (PENDING)</option>
                    <option value="INACTIVE">معطل مؤقتاً (INACTIVE)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Fine-Grained Module Feature Scope */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  تحديد نطاق الموديولات والميزات المفتوحة للشركة
                </h3>
                <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
                  الموديلات المفعلة: {Object.values(features).filter(Boolean).length} / {Object.keys(features).length}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto p-1">
                {featureLabels.map(item => (
                  <div
                    key={item.key}
                    onClick={() => handleFeatureToggle(item.key)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      features[item.key]
                        ? "bg-indigo-50/70 border-indigo-200 text-indigo-950 shadow-sm"
                        : "bg-slate-50/70 border-slate-200 text-slate-500 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={features[item.key]}
                      onChange={() => {}} // handled by div click
                      className="mt-1 h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-xs text-slate-900 flex items-center justify-between">
                        <span>{item.titleAr}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{item.titleEn}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.descAr}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Review Permission Matrix & Final Provision */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                معاينة مصفوفة الصلاحيات والتأسيس النهائي
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-800 border-b pb-1">ملخص الشركة والفرع</h4>
                  <div className="flex justify-between"><span className="text-slate-500">اسم الشركة:</span> <span className="font-semibold text-slate-900">{name}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">السجل التجاري:</span> <span className="font-mono text-slate-900">{crNumber}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">الرقم الضريبي:</span> <span className="font-mono text-slate-900">{taxId || "غير محدد"}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">العملة:</span> <span className="font-bold text-indigo-700">{currency}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">الفرع الرئيسي:</span> <span className="font-semibold text-slate-900">{mainBranchName}</span></div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-800 border-b pb-1">مدير النظام الصلاحيات</h4>
                  <div className="flex justify-between"><span className="text-slate-500">اسم المدير:</span> <span className="font-semibold text-slate-900">{adminName}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">البريد الإلكتروني:</span> <span className="font-mono text-slate-900">{adminEmail}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">حالة التفعيل:</span> <span className="font-semibold text-emerald-700">{status}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">ملاحظة الصلاحيات:</span> <span className="font-medium text-slate-700">Enterprise Tenant Admin (Full Scoped)</span></div>
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl">
                <h4 className="font-bold text-xs text-indigo-900 mb-2">الموديولات المفتوحة في الحساب:</h4>
                <div className="flex flex-wrap gap-1.5">
                  {featureLabels.filter(item => features[item.key]).map(item => (
                    <span key={item.key} className="bg-white border border-indigo-300 text-indigo-800 px-2 py-0.5 rounded-md text-[11px] font-medium shadow-xs">
                      ✓ {item.titleAr}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-xs"
              >
                <ArrowRight className="w-4 h-4" />
                السابق
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              إلغاء
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
              >
                التالي
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleProvisionCompany}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                تأسيس وتفعيل الشركة الآن
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
