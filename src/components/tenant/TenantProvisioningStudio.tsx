/**
 * Enterprise Tenant Provisioning & Activation Studio — Deshal ERP
 * 
 * Clean Architecture Presentation Component:
 * Allows Platform Administrators to provision new tenants, activate existing companies,
 * view health check readiness results, retry failed jobs, and explicitly activate tenants (READY -> ACTIVE).
 */

import React, { useState, useEffect } from 'react';
import {
  Building2,
  ShieldCheck,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  PlayCircle,
  Archive,
  PowerOff,
  Activity,
  Layers
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { SupabaseTenantProvisioningAdapter } from '../../lib/adapters/tenantProvisioningAdapter';
import {
  provisionNewTenantUseCase,
  activateExistingCompanyAsTenantUseCase,
  activateProvisionedTenantUseCase,
  suspendTenantUseCase,
  archiveTenantUseCase,
  retryFailedProvisioningUseCase
} from '../../application/services/tenantProvisioningEngine';
import { TenantHealthCheckResult } from '../../application/ports/tenantPorts';

const adapter = new SupabaseTenantProvisioningAdapter();

export interface TenantProvisioningStudioProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TenantProvisioningStudio: React.FC<TenantProvisioningStudioProps> = ({
  isOpen,
  onClose
}) => {
  const auth = useAuth();
  const tenant = useTenant();
  const userId = auth.state.supabaseAuthUser?.id || auth.state.authSession?.user?.id || '';

  const [activeTab, setActiveTab] = useState<'NEW' | 'EXISTING' | 'HEALTH' | 'JOBS'>('NEW');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // New Tenant Form State
  const [newName, setNewName] = useState<string>('');
  const [newCrNumber, setNewCrNumber] = useState<string>('');
  const [newTaxId, setNewTaxId] = useState<string>('');
  const [newCurrency, setNewCurrency] = useState<string>('OMR');
  const [newBranchName, setNewBranchName] = useState<string>('الفرع الرئيسي');
  const [newAdminEmail, setNewAdminEmail] = useState<string>('');
  const [newAdminName, setNewAdminName] = useState<string>('');
  const [newPlan, setNewPlan] = useState<string>('ENTERPRISE');

  // Existing Company Activation Form State
  const [existingCompanyId, setExistingCompanyId] = useState<string>('');
  const [existingPlan, setExistingPlan] = useState<string>('ENTERPRISE');

  // Health Check State
  const [healthCheckResult, setHealthCheckResult] = useState<TenantHealthCheckResult | null>(null);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
  }>({ open: false, title: '', description: '', action: async () => {} });

  if (!isOpen) return null;

  const handleCreateNewTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const idempotencyKey = `idem_new_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const res = await provisionNewTenantUseCase(
      {
        idempotencyKey,
        name: newName,
        crNumber: newCrNumber,
        taxId: newTaxId,
        currency: newCurrency,
        mainBranchName: newBranchName,
        adminEmail: newAdminEmail,
        adminName: newAdminName,
        adminPin: '1234',
        subscriptionPlan: newPlan
      },
      userId,
      adapter
    );

    setLoading(false);
    if (res.success && res.tenant) {
      setMessage({
        type: 'success',
        text: `تم تهيئة المؤسسة المتعددة المستأجرين بنجاح! كود المستأجر: ${res.tenant.tenantCode} (الحالة: ${res.tenant.status})`
      });
      tenant.actions.refreshTenantContext();
    } else {
      setMessage({ type: 'error', text: res.error || 'فشلت عملية تهيئة المستأجر الجديد.' });
    }
  };

  const handleActivateExistingCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const idempotencyKey = `idem_ext_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const res = await activateExistingCompanyAsTenantUseCase(
      {
        idempotencyKey,
        companyId: existingCompanyId,
        subscriptionPlan: existingPlan,
        adminUserId: userId
      },
      userId,
      adapter
    );

    setLoading(false);
    if (res.success && res.tenant) {
      setMessage({
        type: 'success',
        text: `تم تسجيل وتجهيز الشركة الحالية كمستأجر (الحالة: ${res.tenant.status}). يرجى تأكيد التفعيل النهائي (ACTIVE).`
      });
      tenant.actions.refreshTenantContext();
    } else {
      setMessage({ type: 'error', text: res.error || 'فشلت عملية ربط وتجهيز الشركة الحالية.' });
    }
  };

  const handleExplicitActivation = async () => {
    if (!tenant.state.tenantId || !tenant.state.activeCompanyId) return;

    setConfirmModal({
      open: true,
      title: 'تأكيد التفعيل التشغيلي للمستأجر (ACTIVE)',
      description: 'سيتم تحويل حالة المستأجر من READY إلى ACTIVE وتمكين الوصول التشغيلي الكامل لجميع المستخدمين المخولين.',
      action: async () => {
        setLoading(true);
        const res = await activateProvisionedTenantUseCase(
          tenant.state.tenantId!,
          tenant.state.activeCompanyId!,
          userId,
          adapter
        );
        setLoading(false);
        if (res.success) {
          setMessage({ type: 'success', text: 'تم تفعيل المستأجر بنجاح! الحالة الآن ACTIVE.' });
          tenant.actions.refreshTenantContext();
        } else {
          setMessage({ type: 'error', text: res.error || 'فشل تفعيل المستأجر.' });
        }
      }
    });
  };

  const handleSuspend = async () => {
    if (!tenant.state.tenantId || !tenant.state.activeCompanyId) return;

    setConfirmModal({
      open: true,
      title: 'تأكيد تعليق حساب المستأجر (SUSPEND)',
      description: 'تحذير: تعليق المستأجر يمنع جميع المستخدمين من الدخول وتوليد الفواتير والعمليات التشغيلية فوراً.',
      action: async () => {
        setLoading(true);
        const res = await suspendTenantUseCase(
          tenant.state.tenantId!,
          tenant.state.activeCompanyId!,
          userId,
          adapter
        );
        setLoading(false);
        if (res.success) {
          setMessage({ type: 'info', text: 'تم تعليق حساب المستأجر بنجاح.' });
          tenant.actions.refreshTenantContext();
        } else {
          setMessage({ type: 'error', text: res.error || 'فشل تعليق المستأجر.' });
        }
      }
    });
  };

  const handleArchive = async () => {
    if (!tenant.state.tenantId || !tenant.state.activeCompanyId) return;

    setConfirmModal({
      open: true,
      title: 'أرشفة المستأجر (ARCHIVE)',
      description: 'تحذير عالي الأهمية: أرشفة المستأجر تضع الحساب في حالة المؤرشف الدائم مع الحفاظ التام على البيانات التاريخية.',
      action: async () => {
        setLoading(true);
        const res = await archiveTenantUseCase(
          tenant.state.tenantId!,
          tenant.state.activeCompanyId!,
          userId,
          adapter
        );
        setLoading(false);
        if (res.success) {
          setMessage({ type: 'info', text: 'تمت أرشفة حساب المستأجر بنجاح.' });
          tenant.actions.refreshTenantContext();
        } else {
          setMessage({ type: 'error', text: res.error || 'فشلت أرشفة المستأجر.' });
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-snug">محرك تهيئة وتفعيل المستأجرين (Multi-Tenant Engine)</h2>
              <p className="text-xs text-slate-400">إدارة دورة حياة الشركات والمستأجرين وتدقيق السلامة الهيكلية</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-semibold transition"
          >
            إغلاق ✕
          </button>
        </div>

        {/* Current Tenant Banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <span className="text-slate-500">المستأجر الحالي: <strong className="text-slate-800 font-mono">{tenant.state.tenantId || 'غير محدد'}</strong></span>
            <span className="text-slate-500">الشركة: <strong className="text-slate-800 font-mono">{tenant.state.activeCompanyId || 'غير محدد'}</strong></span>
            <span className="text-slate-500 flex items-center gap-1">
              الحالة: 
              <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                tenant.state.tenantStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                tenant.state.tenantStatus === 'READY' ? 'bg-amber-100 text-amber-800' :
                tenant.state.tenantStatus === 'SUSPENDED' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {tenant.state.tenantStatus || 'PENDING'}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {tenant.state.tenantStatus === 'READY' && (
              <button
                onClick={handleExplicitActivation}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg font-bold flex items-center gap-1 shadow-sm transition"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                تفعيل تشغيلي (READY → ACTIVE)
              </button>
            )}

            {tenant.state.tenantStatus === 'ACTIVE' && (
              <button
                onClick={handleSuspend}
                disabled={loading}
                className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-lg font-bold flex items-center gap-1 shadow-sm transition"
              >
                <PowerOff className="w-3.5 h-3.5" />
                تعليق (SUSPEND)
              </button>
            )}

            {tenant.state.tenantStatus !== 'ARCHIVED' && (
              <button
                onClick={handleArchive}
                disabled={loading}
                className="bg-slate-700 hover:bg-slate-800 text-white px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition"
              >
                <Archive className="w-3.5 h-3.5" />
                أرشفة
              </button>
            )}
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`mx-6 mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
            message.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' :
            'bg-sky-50 text-sky-800 border-sky-200'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 pt-4 gap-2 bg-white">
          <button
            onClick={() => setActiveTab('NEW')}
            className={`pb-3 px-4 font-bold text-xs border-b-2 flex items-center gap-2 transition ${
              activeTab === 'NEW' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus className="w-4 h-4" />
            تهيئة مستأجر جديد
          </button>
          <button
            onClick={() => setActiveTab('EXISTING')}
            className={`pb-3 px-4 font-bold text-xs border-b-2 flex items-center gap-2 transition ${
              activeTab === 'EXISTING' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            تفعيل شركة حالية كمستأجر
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'NEW' && (
            <form onSubmit={handleCreateNewTenant} className="space-y-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                بيانات المؤسسة والمستأجر الجديد
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">اسم الشركة / المؤسسة *</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="مثال: شركة الخليج للخدمات اللوجستية"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">رقم السجل التجاري (CR Number) *</label>
                  <input
                    type="text"
                    required
                    value={newCrNumber}
                    onChange={e => setNewCrNumber(e.target.value)}
                    placeholder="مثال: CR-992140"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الرقم الضريبي (Tax ID)</label>
                  <input
                    type="text"
                    value={newTaxId}
                    onChange={e => setNewTaxId(e.target.value)}
                    placeholder="مثال: OM11002345"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">العملة الرئيسية</label>
                  <select
                    value={newCurrency}
                    onChange={e => setNewCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="OMR">ريال عماني (OMR)</option>
                    <option value="AED">درهم إماراتي (AED)</option>
                    <option value="SAR">ريال سعودي (SAR)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">اسم الفرع الرئيسي *</label>
                  <input
                    type="text"
                    required
                    value={newBranchName}
                    onChange={e => setNewBranchName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">خطة الاشتراك (Subscription Plan)</label>
                  <select
                    value={newPlan}
                    onChange={e => setNewPlan(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="FREE">مجاني (FREE)</option>
                    <option value="STARTER">الأساسية (STARTER)</option>
                    <option value="PRO">المتقدمة (PRO)</option>
                    <option value="ENTERPRISE">المؤسسات (ENTERPRISE)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">البريد الإلكتروني لمدير النظام *</label>
                  <input
                    type="email"
                    required
                    value={newAdminEmail}
                    onChange={e => setNewAdminEmail(e.target.value)}
                    placeholder="admin@company.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">اسم مدير النظام *</label>
                  <input
                    type="text"
                    required
                    value={newAdminName}
                    onChange={e => setNewAdminName(e.target.value)}
                    placeholder="الاسم الكامل للمدير"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  بدء معاملة التهيئة الذرية (Atomic Provisioning)
                </button>
              </div>
            </form>
          )}

          {activeTab === 'EXISTING' && (
            <form onSubmit={handleActivateExistingCompany} className="space-y-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                ربط وتفعيل شركة تشغيلية حالية في سجل المستأجرين
              </h3>

              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs">
                <strong>ملاحظة هامة:</strong> هذه العملية تنشئ سجلاً للمستأجر يربط بالـ Company ID الموجود حالياً مع الحفاظ الكامل على جميع البيانات والسندات والحسابات الحالية دون أي تعديل على المعرفات الفيزيائية.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">معرف الشركة الحالي (Company ID) *</label>
                  <input
                    type="text"
                    required
                    value={existingCompanyId}
                    onChange={e => setExistingCompanyId(e.target.value)}
                    placeholder="مثال: 00000000-0000-0000-0000-000000000001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">خطة الاشتراك للمستأجر</label>
                  <select
                    value={existingPlan}
                    onChange={e => setExistingPlan(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="ENTERPRISE">المؤسسات (ENTERPRISE)</option>
                    <option value="PRO">المتقدمة (PRO)</option>
                    <option value="STARTER">الأساسية (STARTER)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  ربط الشركة وتجهيزها (PENDING → READY)
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 mb-2">{confirmModal.title}</h3>
            <p className="text-xs text-slate-600 mb-6">{confirmModal.description}</p>
            <div className="flex justify-end gap-3 text-xs font-bold">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
              >
                إلغاء
              </button>
              <button
                onClick={async () => {
                  setConfirmModal(prev => ({ ...prev, open: false }));
                  await confirmModal.action();
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-md"
              >
                تأكيد التنفيذ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
