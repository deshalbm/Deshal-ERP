import React, { useState } from 'react';
import {
  Sparkles,
  Building2,
  GitBranch,
  Users,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  X,
  Check,
  Sliders,
  Upload,
  Briefcase,
  DollarSign,
  AlertCircle,
  ChevronRight,
  Shield,
  Layers,
  FileText,
  Key
} from 'lucide-react';
import { useLanguage } from '../../utils/LanguageContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import { CompanySettings, Branch, Employee, EmployeeRole } from '../../types';
import * as companySvc from '../../lib/supabase/companyService';
import * as employeeSvc from '../../lib/supabase/employeeService';
import { saveCompanySettings, saveBranches, saveEmployees, DEFAULT_COMPANY_SETTINGS } from '../../utils/storage';
import { defaultMediaStorageAdapter } from '../../lib/adapters/mediaStorageAdapter';
import { uploadMediaAsset } from '../../application/services/uploadMediaAsset';

export interface FirstLoginSetupWizardProps {
  isOpen: boolean;
  userRole?: 'PLATFORM_ADMIN' | 'COMPANY_ADMIN' | 'MANAGER' | string;
  userEmail?: string;
  userName?: string;
  companyId?: string;
  existingSettings?: CompanySettings;
  onClose: () => void;
  onCompleteSetup: (setupData: {
    companyNameAr: string;
    companyNameEn?: string;
    crNumber?: string;
    taxNumber?: string;
    branchNameAr: string;
    branchCity?: string;
    adminName: string;
    adminEmail: string;
  }) => void;
}

export const FirstLoginSetupWizard: React.FC<FirstLoginSetupWizardProps> = ({
  isOpen,
  userRole = 'COMPANY_ADMIN',
  userEmail = 'admin@deshalbm.com',
  userName = 'مسؤول النظام',
  companyId = '00000000-0000-0000-0000-000000000001',
  existingSettings,
  onClose,
  onCompleteSetup
}) => {
  const { isRTL, language } = useLanguage();
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const isPlatformAdmin = userRole === 'PLATFORM_ADMIN' || userRole === 'SYSTEM_ADMIN';

  // Wizard Steps Configuration
  const platformAdminSteps = [
    { id: 'system_branding', titleAr: '1. هويّة النظام العامة', titleEn: '1. Global System Identity', icon: Sparkles },
    { id: 'primary_company', titleAr: '2. المنشأة والشركة الرئيسية', titleEn: '2. Primary Enterprise', icon: Building2 },
    { id: 'headquarter_branch', titleAr: '3. الفرع والمقر الرئيسي', titleEn: '3. Headquarter Branch', icon: GitBranch },
    { id: 'admin_personnel', titleAr: '4. فريق الإدارة والمسؤولين', titleEn: '4. Executive Personnel', icon: Users },
    { id: 'operational_policies', titleAr: '5. الضوابط المالية والضريبية', titleEn: '5. Financial & Tax Controls', icon: CreditCard },
    { id: 'confirm_launch', titleAr: '6. التأكيد والإطلاق التشغيلي', titleEn: '6. Review & Launch', icon: CheckCircle2 }
  ];

  const companyAdminSteps = [
    { id: 'company_identity', titleAr: '1. التجارية والهوية الرسمية', titleEn: '1. Commercial Identity', icon: Building2 },
    { id: 'main_branch', titleAr: '2. الفرع الرئيسي والمستودع', titleEn: '2. Main Branch & Warehouse', icon: GitBranch },
    { id: 'key_staff', titleAr: '3. الموظفين الجدد والأدوار', titleEn: '3. Key Personnel & Roles', icon: Users },
    { id: 'financial_settings', titleAr: '4. الضبط المالي والعملات', titleEn: '4. Currency & Treasury', icon: CreditCard },
    { id: 'confirm_launch', titleAr: '5. الإكمال وبدء الاستخدام', titleEn: '5. Finish & Launch', icon: CheckCircle2 }
  ];

  const steps = isPlatformAdmin ? platformAdminSteps : companyAdminSteps;
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Company Information
    companyNameAr: existingSettings?.name || 'شركة ديشال لإدارة الأعمال ش.م.م',
    companyNameEn: existingSettings?.nameEn || 'Deshal Business Management LLC',
    crNumber: existingSettings?.crNumber || '1489201',
    taxNumber: existingSettings?.vatNumber || 'OM99281726',
    phone: existingSettings?.phone || '+968 77438203',
    email: existingSettings?.email || userEmail,
    address: existingSettings?.address || 'صحار - سلطنة عمان',
    currency: existingSettings?.currency || 'OMR',
    taxRate: existingSettings?.taxRate ?? 5,
    logoUrl: existingSettings?.logoUrl || '',

    // Branch Information
    branchCode: 'BR-MAIN-01',
    branchNameAr: 'فرع صحار الرئيسي (المركز العام)',
    branchNameEn: 'Sohar Headquarter Branch',
    branchCity: 'صحار',
    branchAddress: 'مبنى مدن - بجوار مجمع المحاكم - صحار',
    warehouseName: 'المستودع الرئيسي - صحار',

    // Primary Admin Personnel
    adminName: userName,
    adminEmail: userEmail,
    adminPhone: '+968 99112233',
    adminCivilId: '10928374',
    adminRole: (isPlatformAdmin ? 'ADMIN' : 'MANAGER') as EmployeeRole,

    // Initial Additional Employee (Optional)
    addSecondEmployee: false,
    secondEmpName: 'سالم المعمري',
    secondEmpEmail: 'salim@deshalbm.com',
    secondEmpRole: 'ACCOUNTANT' as EmployeeRole,

    // Financial Setup Defaults
    cashBoxName: 'الخزينة النقدية الرئيسية',
    bankName: 'بنك مسقط - الحساب الرئيسي',
    bankIban: 'OM1200000000000012345678',
    fiscalYearStart: '2026-01-01'
  });

  const [skippedSteps, setSkippedSteps] = useState<Record<string, boolean>>({});
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  if (!isOpen) return null;

  const currentStep = steps[currentStepIdx];
  const isLastStep = currentStepIdx === steps.length - 1;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          try {
            const path = `logos/company_${Date.now()}.png`;
            const res = await uploadMediaAsset('company_assets', path, base64, defaultMediaStorageAdapter);
            setFormData((prev) => ({ ...prev, logoUrl: res.publicUrl || base64 }));
          } catch {
            setFormData((prev) => ({ ...prev, logoUrl: base64 }));
          }
        }
        setIsUploadingLogo(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setIsUploadingLogo(false);
    }
  };

  const handleSkipStep = () => {
    setSkippedSteps((prev) => ({ ...prev, [currentStep.id]: true }));
    if (!isLastStep) {
      setCurrentStepIdx(currentStepIdx + 1);
    }
  };

  const handleNextStep = () => {
    if (!isLastStep) {
      setCurrentStepIdx(currentStepIdx + 1);
    } else {
      handleFinalizeSetup();
    }
  };

  const handleFinalizeSetup = async () => {
    setIsSaving(true);
    try {
      // 1. Save Company Details in Supabase & LocalStorage
      const updatedSettings: CompanySettings = {
        ...DEFAULT_COMPANY_SETTINGS,
        companyName: formData.companyNameAr,
        tagline: formData.companyNameEn,
        crNumber: formData.crNumber,
        taxId: formData.taxNumber,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        cityStateZip: formData.branchCity,
        country: 'Sultanate of Oman',
        defaultCurrency: formData.currency,
        logoUrl: formData.logoUrl
      };
      saveCompanySettings(updatedSettings);

      if (isSupabaseConfigured) {
        await (supabase.from('companies') as any).upsert({
          id: companyId,
          name_ar: formData.companyNameAr,
          name_en: formData.companyNameEn,
          cr_number: formData.crNumber,
          tax_number: formData.taxNumber,
          is_active: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      }

      // 2. Save Primary Headquarter Branch
      const mainBranch: Branch = {
        id: '00000000-0000-0000-0000-000000000101',
        code: formData.branchCode,
        name: formData.branchNameAr,
        nameEn: formData.branchNameEn,
        isMain: true,
        city: formData.branchCity,
        country: 'سلطنة عمان',
        address: formData.branchAddress,
        phone: formData.phone,
        email: formData.email,
        taxId: formData.taxNumber,
        crNumber: formData.crNumber,
        managerName: formData.adminName,
        status: 'ACTIVE',
        defaultWarehouse: formData.warehouseName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveBranches([mainBranch]);
      await companySvc.upsertBranch(mainBranch, companyId);

      // 3. Save Initial Personnel / Employee
      const adminEmployee: Employee = {
        id: '61738273-e738-4f53-8718-85811a174281',
        employeeCode: 'EMP-101',
        fullName: formData.adminName,
        email: formData.adminEmail,
        phone: formData.adminPhone,
        civilId: formData.adminCivilId,
        role: formData.adminRole,
        jobTitle: isPlatformAdmin ? 'مدير المنصة والنظام' : 'المدير العام والتنفيذي',
        department: 'الإدارة العليا',
        branchId: mainBranch.id,
        branchName: mainBranch.name,
        status: 'ACTIVE',
        hireDate: new Date().toISOString().split('T')[0],
        contractType: 'FULL_TIME',
        basicSalary: 2500,
        allowances: 250,
        currency: formData.currency,
        bankName: formData.bankName,
        bankIban: formData.bankIban,
        permissions: ['create_vouchers', 'edit_vouchers', 'delete_vouchers', 'manage_inventory', 'manage_employees', 'edit_settings'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const initialEmployeesList: Employee[] = [adminEmployee];

      if (formData.addSecondEmployee && formData.secondEmpName) {
        initialEmployeesList.push({
          id: `emp-sec-${Date.now()}`,
          employeeCode: 'EMP-102',
          fullName: formData.secondEmpName,
          email: formData.secondEmpEmail,
          phone: '+968 98000000',
          role: formData.secondEmpRole,
          jobTitle: formData.secondEmpRole === 'ACCOUNTANT' ? 'محاسب مالي' : 'مسؤول مبيعات',
          department: formData.secondEmpRole === 'ACCOUNTANT' ? 'المالية والمحاسبة' : 'المبيعات',
          branchId: mainBranch.id,
          branchName: mainBranch.name,
          status: 'ACTIVE',
          hireDate: new Date().toISOString().split('T')[0],
          contractType: 'FULL_TIME',
          basicSalary: 1200,
          allowances: 100,
          currency: formData.currency,
          permissions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      saveEmployees(initialEmployeesList);

      for (const emp of initialEmployeesList) {
        await employeeSvc.upsertEmployee(emp, companyId);
      }

      // 4. Mark setup as completed in Supabase DB & LocalStorage
      await companySvc.markSetupCompleted(companyId, adminEmployee.id);

      try {
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          localStorage.setItem(`rv_deshal_setup_completed_${companyId}`, 'true');
          localStorage.setItem('rv_deshal_setup_completed_global', 'true');
        }
      } catch (err) {
        console.warn('Failed to save setup completion flag:', err);
      }

      // 5. Trigger Callback
      onCompleteSetup({
        companyNameAr: formData.companyNameAr,
        companyNameEn: formData.companyNameEn,
        crNumber: formData.crNumber,
        taxNumber: formData.taxNumber,
        branchNameAr: formData.branchNameAr,
        branchCity: formData.branchCity,
        adminName: formData.adminName,
        adminEmail: formData.adminEmail
      });

      onClose();
    } catch (err: any) {
      console.error('Finalize setup failed:', err);
      alert(isRTL ? `تعذر حفظ التهيئة: ${err?.message || err}` : `Setup save failed: ${err?.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      id="first-login-wizard-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <div
        id="first-login-wizard-container"
        className="bg-white w-full max-w-3xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="p-6 bg-linear-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white relative shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-indigo-200 border border-white/10">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>
                {isPlatformAdmin
                  ? isRTL ? 'معالج تهيئة المنصة والنظام (App Manager Wizard)' : 'Platform Setup Wizard'
                  : isRTL ? 'معالج التأسيس الأولي للمنشأة (Company Admin Wizard)' : 'Enterprise Setup Wizard'}
              </span>
            </div>
            <span className="text-xs text-indigo-200 font-mono">
              {isRTL ? `الخطوة ${currentStepIdx + 1} من ${steps.length}` : `Step ${currentStepIdx + 1} of ${steps.length}`}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black mb-1">
            {isRTL ? 'مرحباً بك في الإعداد الأولي للنظام' : 'Welcome to Initial ERP Setup'}
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200">
            {isRTL
              ? 'قم بضبط الهوية التجارية والفروع وفريق العمل لتهيئة النظام واستخدامه فوراً.'
              : 'Configure your company profile, primary branch, and team to start operational work.'}
          </p>

          {/* Steps Progress Pills */}
          <div className="mt-5 grid grid-cols-5 sm:grid-cols-6 gap-1.5">
            {steps.map((st, idx) => {
              const isCurrent = idx === currentStepIdx;
              const isDone = idx < currentStepIdx || !!skippedSteps[st.id];

              return (
                <button
                  key={st.id}
                  onClick={() => setCurrentStepIdx(idx)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer truncate ${
                    isCurrent
                      ? 'bg-amber-400 text-slate-900 shadow-md font-black'
                      : isDone
                      ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/30'
                      : 'bg-white/10 text-indigo-200 hover:bg-white/20'
                  }`}
                >
                  {isDone ? <Check className="w-3 h-3 text-emerald-300 shrink-0" /> : idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP: Platform System Branding (Platform Admin) */}
          {currentStep.id === 'system_branding' && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-indigo-700 shrink-0" />
                <p className="text-xs text-indigo-900 font-semibold leading-relaxed">
                  {isRTL
                    ? 'بصفتك مدير المنصة (App Manager)، تتيح لك هذه الخطوة ضبط الهوية العامة للنظام والعملة واللغات المدعومة.'
                    : 'As Platform Admin, configure global system branding, default currency, and operational defaults.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">عنوان النظام والمنصة</label>
                  <input
                    type="text"
                    value={formData.companyNameAr}
                    onChange={(e) => setFormData({ ...formData, companyNameAr: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">System Title (EN)</label>
                  <input
                    type="text"
                    value={formData.companyNameEn}
                    onChange={(e) => setFormData({ ...formData, companyNameEn: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">العملة الافتراضية للنظام</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="OMR">ريال عماني (OMR)</option>
                    <option value="SAR">ريال سعودي (SAR)</option>

                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نسبة ضريبة القيمة المضافة (%)</label>
                  <input
                    type="number"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP: Commercial Identity / Primary Enterprise */}
          {(currentStep.id === 'company_identity' || currentStep.id === 'primary_company') && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-300 flex items-center justify-center overflow-hidden shrink-0 relative">
                  {formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <Building2 className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-slate-900">شعار المنشأة والترويسة الرسمية</h4>
                  <p className="text-xs text-slate-500 mb-2">يظهر الشعار على الفواتير والسندات والتقارير المالية.</p>
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingLogo ? 'جاري الرفع...' : 'رفع صورة الشعار'}</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم المنشأة باللغة العربية *</label>
                  <input
                    type="text"
                    required
                    value={formData.companyNameAr}
                    onChange={(e) => setFormData({ ...formData, companyNameAr: e.target.value })}
                    placeholder="مثال: شركة ديشال لإدارة الأعمال ش.م.م"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company Name (English)</label>
                  <input
                    type="text"
                    value={formData.companyNameEn}
                    onChange={(e) => setFormData({ ...formData, companyNameEn: e.target.value })}
                    placeholder="e.g. Deshal Business Management LLC"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم السجل التجاري (CR Number)</label>
                  <input
                    type="text"
                    value={formData.crNumber}
                    onChange={(e) => setFormData({ ...formData, crNumber: e.target.value })}
                    placeholder="مثال: 1489201"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الرقم الضريبي (VAT / Tax ID)</label>
                  <input
                    type="text"
                    value={formData.taxNumber}
                    onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                    placeholder="مثال: OM99281726"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">هاتف التواصل الرسمي</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني الرسمي</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP: Main Branch & Warehouse */}
          {(currentStep.id === 'main_branch' || currentStep.id === 'headquarter_branch') && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-100 flex items-center gap-3">
                <GitBranch className="w-6 h-6 text-emerald-700 shrink-0" />
                <p className="text-xs text-emerald-900 font-semibold leading-relaxed">
                  سيتم إنشاء الفرع والمستودع الرئيسي وتعيينه كمركز عمليات افتراضي لإدارة الفواتير والمخزون.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رمز الفرع التشغيلي (Branch Code)</label>
                  <input
                    type="text"
                    value={formData.branchCode}
                    onChange={(e) => setFormData({ ...formData, branchCode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم الفرع الرئيسي بالعربية *</label>
                  <input
                    type="text"
                    value={formData.branchNameAr}
                    onChange={(e) => setFormData({ ...formData, branchNameAr: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">المدينة والمنطقة</label>
                  <input
                    type="text"
                    value={formData.branchCity}
                    onChange={(e) => setFormData({ ...formData, branchCity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم المستودع المركزي المقترن</label>
                  <input
                    type="text"
                    value={formData.warehouseName}
                    onChange={(e) => setFormData({ ...formData, warehouseName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">العنوان التفصيلي للفرع</label>
                  <input
                    type="text"
                    value={formData.branchAddress}
                    onChange={(e) => setFormData({ ...formData, branchAddress: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP: Key Staff & Personnel */}
          {(currentStep.id === 'key_staff' || currentStep.id === 'admin_personnel') && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100">
                <h4 className="font-bold text-sm text-indigo-900 mb-1">حساب المسؤول الرئيسي (Primary Admin Account)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mt-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الاسم الكامل *</label>
                    <input
                      type="text"
                      value={formData.adminName}
                      onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني *</label>
                    <input
                      type="email"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الرقم المدني / الهوية</label>
                    <input
                      type="text"
                      value={formData.adminCivilId}
                      onChange={(e) => setFormData({ ...formData, adminCivilId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الدور الوظيفي</label>
                    <select
                      value={formData.adminRole}
                      onChange={(e) => setFormData({ ...formData, adminRole: e.target.value as EmployeeRole })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                    >
                      <option value="ADMIN">مدير عام / مسؤول النظام (System Admin)</option>
                      <option value="MANAGER">مدير تنفيذي (Branch Manager)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Optional Second Employee Registration */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.addSecondEmployee}
                    onChange={(e) => setFormData({ ...formData, addSecondEmployee: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded-sm"
                  />
                  <span>إضافة موظف ثاني إضافي الآن (محاسب / مبيعات)</span>
                </label>

                {formData.addSecondEmployee && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">اسم الموظف الثاني</label>
                      <input
                        type="text"
                        value={formData.secondEmpName}
                        onChange={(e) => setFormData({ ...formData, secondEmpName: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
                      <input
                        type="email"
                        value={formData.secondEmpEmail}
                        onChange={(e) => setFormData({ ...formData, secondEmpEmail: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">الدور الوظيفي</label>
                      <select
                        value={formData.secondEmpRole}
                        onChange={(e) => setFormData({ ...formData, secondEmpRole: e.target.value as EmployeeRole })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                      >
                        <option value="ACCOUNTANT">محاسب مالي (Accountant)</option>
                        <option value="SALES">مسؤول مبيعات (Sales)</option>
                        <option value="STOREKEEPER">أمين مخازن (Storekeeper)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP: Financial Settings */}
          {(currentStep.id === 'financial_settings' || currentStep.id === 'operational_policies') && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم الخزينة النقدية الرئيسية</label>
                  <input
                    type="text"
                    value={formData.cashBoxName}
                    onChange={(e) => setFormData({ ...formData, cashBoxName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم بنك التعامل الرئيسي</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">رقم الآيبان البنكي (IBAN)</label>
                  <input
                    type="text"
                    value={formData.bankIban}
                    onChange={(e) => setFormData({ ...formData, bankIban: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP: Final Confirmation & Review */}
          {currentStep.id === 'confirm_launch' && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-linear-to-br from-emerald-500/10 via-emerald-50 to-indigo-50 border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>جاهزية التفعيل والإطلاق التشغيلي للنظام</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  راجع التلخيص التالي قبل حفظ واعتماد البيانات الرسمية في قاعدة البيانات:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-emerald-200/60">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[11px]">المنشأة والشركة:</span>
                    <strong className="text-slate-900 font-bold">{formData.companyNameAr}</strong>
                    <span className="text-slate-500 block text-[11px] font-mono mt-0.5">CR: {formData.crNumber || 'غير محدد'}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[11px]">الفرع الرئيسي:</span>
                    <strong className="text-slate-900 font-bold">{formData.branchNameAr}</strong>
                    <span className="text-slate-500 block text-[11px] mt-0.5">{formData.branchCity}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[11px]">المسؤول الرئيسي:</span>
                    <strong className="text-slate-900 font-bold">{formData.adminName}</strong>
                    <span className="text-slate-500 block text-[11px] font-mono mt-0.5">{formData.adminEmail}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[11px]">العملة الأساسية والضريبة:</span>
                    <strong className="text-slate-900 font-bold">{formData.currency} ({formData.taxRate}%)</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div>
            {!isLastStep && (
              <button
                type="button"
                onClick={handleSkipStep}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                تخطي هذه الخطوة واستكمالها لاحقاً
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStepIdx > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStepIdx(currentStepIdx - 1)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
              >
                السابق
              </button>
            )}

            <button
              type="button"
              onClick={handleNextStep}
              disabled={isSaving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              <span>{isSaving ? 'جاري الحفظ واعتماد البيانات...' : isLastStep ? 'اعتماد التأسيس وبدء الاستخدام' : 'التالي'}</span>
              <ArrowIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
