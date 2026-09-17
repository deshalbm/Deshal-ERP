/**
 * Enterprise Tenant Provisioning Wizard — Deshal ERP
 * 
 * Clean Architecture Presentation Component:
 * Guided multi-step modal wizard for Platform Administrators to provision new SaaS tenant organizations
 * or activate existing ERP companies as SaaS tenants.
 */

import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  CreditCard,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { SupabaseTenantProvisioningAdapter } from '../../lib/adapters/tenantProvisioningAdapter';
import {
  provisionNewTenantUseCase,
  activateExistingCompanyAsTenantUseCase
} from '../../application/services/tenantProvisioningEngine';
import { Tenant } from '../../domain/tenant/tenantEntities';

const adapter = new SupabaseTenantProvisioningAdapter();

export interface TenantProvisioningWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (tenant: Tenant) => void;
}

type WizardStep = 'MODE' | 'PROFILE' | 'SUBSCRIPTION' | 'RESULT';
type ProvisionMode = 'NEW' | 'EXISTING';

export const TenantProvisioningWizard: React.FC<TenantProvisioningWizardProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const auth = useAuth();
  const tenantContext = useTenant();
  const userId = auth.state.supabaseAuthUser?.id || auth.state.authSession?.user?.id || '';

  const [step, setStep] = useState<WizardStep>('MODE');
  const [mode, setMode] = useState<ProvisionMode>('NEW');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New Tenant Form State
  const [name, setName] = useState<string>('');
  const [crNumber, setCrNumber] = useState<string>('');
  const [taxId, setTaxId] = useState<string>('');
  const [currency, setCurrency] = useState<string>('OMR');
  const [mainBranchName, setMainBranchName] = useState<string>('الفرع الرئيسي');
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [adminName, setAdminName] = useState<string>('');
  const [adminPin, setAdminPin] = useState<string>('1234');
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>('ENTERPRISE');

  // Existing Company State
  const [existingCompanyId, setExistingCompanyId] = useState<string>('');

  // Result State
  const [createdTenant, setCreatedTenant] = useState<Tenant | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setStep('MODE');
    setMode('NEW');
    setLoading(false);
    setErrorMsg(null);
    setName('');
    setCrNumber('');
    setTaxId('');
    setCurrency('OMR');
    setMainBranchName('الفرع الرئيسي');
    setAdminEmail('');
    setAdminName('');
    setAdminPin('1234');
    setSubscriptionPlan('ENTERPRISE');
    setExistingCompanyId('');
    setCreatedTenant(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleNextToSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'NEW') {
      if (!name.trim()) {
        setErrorMsg('اسم الشركة / المؤسسة مطلوب.');
        return;
      }
      if (!crNumber.trim()) {
        setErrorMsg('رقم السجل التجاري CR مطلوب.');
        return;
      }
      if (!adminEmail.trim()) {
        setErrorMsg('البريد الإلكتروني لمدير المؤسسة مطلوب.');
        return;
      }
    } else {
      if (!existingCompanyId.trim()) {
        setErrorMsg('معرّف الشركة الحالية مطلوب.');
        return;
      }
    }

    setStep('SUBSCRIPTION');
  };

  const handleExecuteProvisioning = async () => {
    setLoading(true);
    setErrorMsg(null);

    const idempotencyKey = `idem_wiz_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    try {
      if (mode === 'NEW') {
        const res = await provisionNewTenantUseCase(
          {
            idempotencyKey,
            name,
            crNumber,
            taxId,
            currency,
            mainBranchName,
            adminEmail,
            adminName: adminName || 'مدير النظام',
            adminPin,
            subscriptionPlan
          },
          userId,
          adapter
        );

        if (res.success && res.tenant) {
          setCreatedTenant(res.tenant);
          setStep('RESULT');
          tenantContext.actions.refreshTenantContext();
          if (onSuccess) onSuccess(res.tenant);
        } else {
          setErrorMsg(res.error || 'فشلت عملية تهيئة المستأجر الجديد.');
        }
      } else {
        const res = await activateExistingCompanyAsTenantUseCase(
          {
            idempotencyKey,
            companyId: existingCompanyId,
            subscriptionPlan,
            adminUserId: userId
          },
          userId,
          adapter
        );

        if (res.success && res.tenant) {
          setCreatedTenant(res.tenant);
          setStep('RESULT');
          tenantContext.actions.refreshTenantContext();
          if (onSuccess) onSuccess(res.tenant);
        } else {
          setErrorMsg(res.error || 'فشلت عملية ربط وتجهيز الشركة الحالية.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'حدث خطأ أثناء تنفيذ عملية تهيئة المستأجر.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                معالج تهيئة المستأجر السحابي (Tenant Provisioning Wizard)
              </h3>
              <p className="text-xs text-slate-500">
                خطوة {step === 'MODE' ? '1' : step === 'PROFILE' ? '2' : step === 'SUBSCRIPTION' ? '3' : '4'} من 4
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: MODE SELECTION */}
        {step === 'MODE' && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-600">اختر نمط التهيئة المطلوب لإضافة المستأجر في المنصة:</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div
                onClick={() => setMode('NEW')}
                className={`cursor-pointer rounded-xl border p-5 transition-all ${
                  mode === 'NEW'
                    ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 font-bold">
                    <Plus className="h-4 w-4" />
                  </div>
                  <h4 className="font-bold text-slate-800">مؤسسة جديدة تماماً</h4>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  إنشاء سجل شركة جديد، فرع رئيسي، حساب مسؤول جديد، وتهيئة كامل الاستحقاقات والأدوار تلقائياً.
                </p>
              </div>

              <div
                onClick={() => setMode('EXISTING')}
                className={`cursor-pointer rounded-xl border p-5 transition-all ${
                  mode === 'EXISTING'
                    ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-bold">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <h4 className="font-bold text-slate-800">شركة ERP حالية</h4>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  ترقية وربط شركة تشغيلية موجودة بالفعل في القاعدة إلى مستأجر سحابي متعدد المستأجرين.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setStep('PROFILE')}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700"
              >
                <span>المتابعة لإدخال البيانات</span>
                <ArrowLeft className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PROFILE DETAILS */}
        {step === 'PROFILE' && (
          <form onSubmit={handleNextToSubscription} className="space-y-4 py-2">
            {mode === 'NEW' ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم الشركة / المؤسسة *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="مثال: شركة العالمية للتجارة"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم السجل التجاري (CR) *</label>
                  <input
                    type="text"
                    value={crNumber}
                    onChange={e => setCrNumber(e.target.value)}
                    placeholder="CR-1029384"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الرقم الضريبي (Tax ID)</label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={e => setTaxId(e.target.value)}
                    placeholder="OM-1029384"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">العملة الأساسية</label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="OMR">ريال عماني (OMR)</option>
                    <option value="SAR">ريال سعودي (SAR)</option>
                    <option value="AED">درهم إماراتي (AED)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم الفرع الرئيسي</label>
                  <input
                    type="text"
                    value={mainBranchName}
                    onChange={e => setMainBranchName(e.target.value)}
                    placeholder="الفرع الرئيسي - مسقط"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم مدير النظام</label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={e => setAdminName(e.target.value)}
                    placeholder="أحمد العماني"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني للمسؤول *</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    placeholder="admin@company.com"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">معرّف الشركة الحالية (Company ID) *</label>
                <input
                  type="text"
                  value={existingCompanyId}
                  onChange={e => setExistingCompanyId(e.target.value)}
                  placeholder="cmp_xxxxxx"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                  required
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  سيتم ربط سجل الشركة الموجود في جدول companies بالسجل المنصّي الموحّد وإنشاء سجل الاشتراك والاستحقاقات.
                </p>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setStep('MODE')}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                السابق
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-700"
              >
                <span>تحديد الاشتراك والاستحقاق</span>
                <ArrowLeft className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: SUBSCRIPTION & CONFIRMATION */}
        {step === 'SUBSCRIPTION' && (
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">خطة الاشتراك المستهدفة</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {['FREE', 'STARTER', 'PRO', 'ENTERPRISE'].map(plan => (
                  <div
                    key={plan}
                    onClick={() => setSubscriptionPlan(plan)}
                    className={`cursor-pointer rounded-lg border p-3 text-center transition-all ${
                      subscriptionPlan === plan
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <CreditCard className="mx-auto h-5 w-5 mb-1 opacity-80" />
                    <span className="text-xs">{plan}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
              <h4 className="font-bold text-slate-800">ملخص أمر التهيئة:</h4>
              <ul className="space-y-1 text-slate-600">
                <li>• النمط: <span className="font-semibold text-slate-800">{mode === 'NEW' ? 'مؤسسة جديدة' : 'تحديث شركة حالية'}</span></li>
                <li>• الاسم: <span className="font-semibold text-slate-800">{mode === 'NEW' ? name : existingCompanyId}</span></li>
                {mode === 'NEW' && <li>• السجل التجاري: <span className="font-semibold text-slate-800">{crNumber}</span></li>}
                <li>• الاشتراك: <span className="font-semibold text-indigo-700">{subscriptionPlan}</span></li>
              </ul>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setStep('PROFILE')}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                السابق
              </button>
              <button
                onClick={handleExecuteProvisioning}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                <span>تنفيذ التهيئة الذرّية الآن</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: RESULT */}
        {step === 'RESULT' && createdTenant && (
          <div className="py-4 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">تمت تهيئة المستأجر بنجاح!</h3>
              <p className="text-xs text-slate-500 mt-1">
                كود المستأجر المنصّي: <span className="font-mono font-bold text-slate-800">{createdTenant.tenantCode}</span>
              </p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-xs text-emerald-900 text-right space-y-1">
              <p>• المعرّف الفريد: <span className="font-mono">{createdTenant.id}</span></p>
              <p>• معرّف الشركة (Company ID): <span className="font-mono">{createdTenant.companyId}</span></p>
              <p>• الحالة التشغيلية الأولية: <span className="font-bold">{createdTenant.status}</span> (Pending Explicit Activation to ACTIVE)</p>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                onClick={handleClose}
                className="rounded-lg bg-slate-800 px-6 py-2.5 text-xs font-semibold text-white hover:bg-slate-900"
              >
                إغلاق المعالج والعودة للمنصة
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
