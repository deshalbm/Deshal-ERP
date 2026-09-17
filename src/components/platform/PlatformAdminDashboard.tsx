/**
 * Enterprise Platform Admin Dashboard — Deshal ERP
 * 
 * Clean Architecture Presentation Component:
 * Primary control dashboard for Platform Administrators to manage SaaS tenants,
 * launch tenant provisioning wizard, inspect tenant health check readiness, enforce lifecycle transitions,
 * and audit provisioning jobs.
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Power,
  PowerOff,
  Archive,
  Activity,
  Layers,
  FileText,
  CreditCard,
  Lock,
  Search,
  Filter,
  Users
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { SupabaseTenantProvisioningAdapter } from '../../lib/adapters/tenantProvisioningAdapter';
import {
  suspendTenantUseCase,
  archiveTenantUseCase
} from '../../application/services/tenantProvisioningEngine';
import { Tenant, TenantStatus, TenantProvisioningJob } from '../../domain/tenant/tenantEntities';
import { TenantHealthCheckModal } from './TenantHealthCheckModal';
import { TenantProvisioningWizard } from './TenantProvisioningWizard';
import { PlatformAuditLogView } from './PlatformAuditLogView';

const adapter = new SupabaseTenantProvisioningAdapter();

export const PlatformAdminDashboard: React.FC = () => {
  const auth = useAuth();
  const tenantContext = useTenant();
  const userId = auth.state.supabaseAuthUser?.id || auth.state.authSession?.user?.id || '';

  const isPlatformAdmin = tenantContext.state.isPlatformAdmin;

  const [activeTab, setActiveTab] = useState<'TENANTS' | 'LOGS'>('TENANTS');
  const [loading, setLoading] = useState<boolean>(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [jobs, setJobs] = useState<TenantProvisioningJob[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals state
  const [wizardOpen, setWizardOpen] = useState<boolean>(false);
  const [healthModal, setHealthModal] = useState<{
    open: boolean;
    tenantId: string | null;
    companyId: string | null;
    tenantName?: string;
  }>({ open: false, tenantId: null, companyId: null });

  const loadPlatformData = async () => {
    setLoading(true);
    try {
      const [tList, jList] = await Promise.all([
        adapter.getAllTenants(),
        adapter.getAllProvisioningJobs()
      ]);
      setTenants(tList);
      setJobs(jList);
    } catch (err: any) {
      console.warn('[PlatformAdminDashboard] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isPlatformAdmin) {
      loadPlatformData();
    }
  }, [isPlatformAdmin]);

  // Security Authorization Guard
  if (!isPlatformAdmin) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shrink-0">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-900">
                منطقة محمية: لوحة إدارة المنصة السحابية (Platform Administrator)
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-amber-800">
                عذراً، هذه الصفحة مخصصة حصرياً لمدراء منصة Deshal ERP ولا يمكنك الوصول إليها بالحساب الحالي.
              </p>

              <div className="mt-4 rounded-lg border border-amber-300 bg-white/60 p-3 text-[11px] text-amber-900 space-y-1">
                <p className="font-bold">• قاعدة الأمان التشغيلي:</p>
                <p>
                  منح صلاحية إدارة المنصة (Platform Admin) يسمح بتهيئة وتفعيل المستأجرين وإدارتهم منصياً، ولكن لا يمنح تلقائياً صلاحية الوصول والتصفح لبيانات التشغيل للشركات الأخرى بدون عضوية صريحة في (User Company Memberships).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredTenants = tenants.filter(t => {
    const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      t.name.toLowerCase().includes(searchLower) ||
      t.tenantCode.toLowerCase().includes(searchLower) ||
      t.id.toLowerCase().includes(searchLower) ||
      t.companyId.toLowerCase().includes(searchLower);

    return matchesStatus && matchesSearch;
  });

  const activeCount = tenants.filter(t => t.status === 'ACTIVE').length;
  const readyCount = tenants.filter(t => t.status === 'READY').length;
  const failedJobsCount = jobs.filter(j => j.status === 'FAILED').length;

  const handleSuspendTenant = async (tenantId: string, companyId: string) => {
    setMsg(null);
    try {
      const res = await suspendTenantUseCase(tenantId, companyId, userId, adapter);
      if (res.success) {
        setMsg({ type: 'success', text: `تم تعليق المستأجر بنجاح (الحالة: SUSPENDED)` });
        await loadPlatformData();
      } else {
        setMsg({ type: 'error', text: res.error || 'فشلت عملية تعليق المستأجر.' });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.message || 'حدث خطأ أثناء التعليق.' });
    }
  };

  const handleArchiveTenant = async (tenantId: string, companyId: string) => {
    setMsg(null);
    try {
      const res = await archiveTenantUseCase(tenantId, companyId, userId, adapter);
      if (res.success) {
        setMsg({ type: 'success', text: `تمت أرشفة المستأجر بنجاح (الحالة: ARCHIVED)` });
        await loadPlatformData();
      } else {
        setMsg({ type: 'error', text: res.error || 'فشلت عملية أرشفة المستأجر.' });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.message || 'حدث خطأ أثناء الأرشفة.' });
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-800">إدارة المنصة والمستأجرين (Platform Administration)</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            لوحة قيادة إدارة المؤسسات، تهيئة السحاب، تفعيل الاشتراكات، ومراقبة صحة ودورة حياة المستأجرين.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setWizardOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            <span>تهيئة مستأجر جديد (Provision Tenant)</span>
          </button>
          <button
            onClick={loadPlatformData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">إجمالي المستأجرين</span>
            <Building2 className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-800">{tenants.length}</div>
          <span className="text-[10px] text-slate-400">مؤسسة سحابية مسجلة</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">المستأجرين النشطين (ACTIVE)</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{activeCount}</div>
          <span className="text-[10px] text-emerald-700 font-medium">سريان تشغيلي كامل</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">جاهز للتفعيل (READY)</span>
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{readyCount}</div>
          <span className="text-[10px] text-amber-700 font-medium">ينتظر التفعيل الصريح</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">المهام الفاشلة (FAILED)</span>
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-red-600">{failedJobsCount}</div>
          <span className="text-[10px] text-red-700 font-medium">تتطلب إعادة المحاولة</span>
        </div>
      </div>

      {/* Message Alert */}
      {msg && (
        <div
          className={`flex items-center gap-2 rounded-lg border p-3 text-xs ${
            msg.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('TENANTS')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
            activeTab === 'TENANTS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>قائمة المستأجرين والمؤسسات ({tenants.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('LOGS')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
            activeTab === 'LOGS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>سجل عمليات التهيئة ({jobs.length})</span>
        </button>
      </div>

      {/* TAB 1: TENANTS LIST */}
      {activeTab === 'TENANTS' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative">
              <Search className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="بحث باسم المؤسسة أو كود المستأجر..."
                className="w-64 rounded-lg border border-slate-200 py-1.5 pe-3 ps-8 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">تصفية الحالة:</span>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="ALL">جميع الحالات</option>
                <option value="ACTIVE">نشط (ACTIVE)</option>
                <option value="READY">جاهز للتفعيل (READY)</option>
                <option value="SUSPENDED">معلّق (SUSPENDED)</option>
                <option value="ARCHIVED">مؤرشف (ARCHIVED)</option>
                <option value="FAILED">فاشل (FAILED)</option>
              </select>
            </div>
          </div>

          {/* Tenants Grid/Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">كود المستأجر</th>
                  <th className="px-4 py-3">اسم المؤسسة</th>
                  <th className="px-4 py-3">معرّف الشركة (Company ID)</th>
                  <th className="px-4 py-3">حالة دورة الحياة</th>
                  <th className="px-4 py-3">الاشتراك</th>
                  <th className="px-4 py-3">تاريخ الإنشاء</th>
                  <th className="px-4 py-3 text-center">التحكم والفحص</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      <RefreshCw className="mx-auto h-6 w-6 animate-spin text-indigo-600 mb-2" />
                      <span>جاري تحميل قائمة المستأجرين...</span>
                    </td>
                  </tr>
                ) : filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      لا توجد مؤسسات أو مستأجرين مطابقة للبحث.
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">{t.tenantCode}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{t.name}</td>
                      <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">{t.companyId}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          t.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : t.status === 'READY'
                            ? 'bg-amber-100 text-amber-800'
                            : t.status === 'SUSPENDED'
                            ? 'bg-rose-100 text-rose-800'
                            : t.status === 'ARCHIVED'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-indigo-700">{t.subscriptionPlan}</td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">
                        {new Date(t.createdAt).toLocaleDateString('ar-OM')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Health Check Button */}
                          <button
                            onClick={() =>
                              setHealthModal({
                                open: true,
                                tenantId: t.id,
                                companyId: t.companyId,
                                tenantName: t.name
                              })
                            }
                            className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100"
                            title="فحص الصحة والجاهزية والتفعيل"
                          >
                            <Activity className="h-3 w-3" />
                            <span>فحص الجاهزية</span>
                          </button>

                          {/* Suspend Action */}
                          {t.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleSuspendTenant(t.id, t.companyId)}
                              className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
                              title="تعليق المستأجر"
                            >
                              <PowerOff className="h-3 w-3" />
                              <span>تعليق</span>
                            </button>
                          )}

                          {/* Archive Action */}
                          {(t.status === 'ACTIVE' || t.status === 'SUSPENDED') && (
                            <button
                              onClick={() => handleArchiveTenant(t.id, t.companyId)}
                              className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-200"
                              title="أرشفة المستأجر"
                            >
                              <Archive className="h-3 w-3" />
                              <span>أرشفة</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOGS */}
      {activeTab === 'LOGS' && (
        <PlatformAuditLogView jobs={jobs} loading={loading} onRefresh={loadPlatformData} />
      )}

      {/* Modals */}
      <TenantProvisioningWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSuccess={() => {
          loadPlatformData();
        }}
      />

      <TenantHealthCheckModal
        isOpen={healthModal.open}
        onClose={() => setHealthModal({ open: false, tenantId: null, companyId: null })}
        tenantId={healthModal.tenantId}
        companyId={healthModal.companyId}
        tenantName={healthModal.tenantName}
        onActivationSuccess={() => {
          loadPlatformData();
        }}
      />
    </div>
  );
};
