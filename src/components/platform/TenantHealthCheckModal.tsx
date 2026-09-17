/**
 * Enterprise Tenant Health Check Modal — Deshal ERP
 * 
 * Clean Architecture Presentation Component:
 * Evaluates and displays the 10-point health check readiness result for a provisioned tenant/company.
 * Enables Platform Administrators to inspect binding integrity, active memberships, subscription entitlements,
 * module flag initialization, and execute explicit activation (READY -> ACTIVE).
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Power,
  Layers,
  Building2,
  Activity,
  X
} from 'lucide-react';
import { SupabaseTenantProvisioningAdapter } from '../../lib/adapters/tenantProvisioningAdapter';
import { evaluateTenantHealth, TenantHealthCheckData } from '../../application/services/tenantHealthCheckService';
import { activateProvisionedTenantUseCase } from '../../application/services/tenantProvisioningEngine';
import { TenantHealthCheckResult } from '../../application/ports/tenantPorts';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';

const adapter = new SupabaseTenantProvisioningAdapter();

export interface TenantHealthCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string | null;
  companyId: string | null;
  tenantName?: string;
  onActivationSuccess?: () => void;
}

const CHECK_LABELS: Record<string, string> = {
  tenant_exists: '1. وجود سجّل المستأجر المنصّي (Tenant Registry)',
  company_exists: '2. وجود الشركة التشغيلية الفعليّة (ERP Company)',
  tenant_company_binding: '3. تطابق الربط المعرّفي (Tenant-Company Binding)',
  main_branch_exists: '4. وجود فرع رئيسي معتمد للشركة',
  required_membership_exists: '5. وجود عضويات مستخدمين نشطة (User Memberships)',
  subscription_exists: '6. وجود اشتراك سارٍ واستحقاق منصّي',
  modules_enabled: '7. تهيئة وحدات البرامج المستحقة (Tenant Modules)',
  features_enabled: '8. تهيئة ميزات المنظومة التفصيلية (Tenant Features)',
  rbac_roles_valid: '9. وجود دور مدير النظام الأصلي (System Admin Role)',
  lifecycle_state_valid: '10. صلاحية حالة دورة الحياة التشغيلية (READY / ACTIVE)'
};

export const TenantHealthCheckModal: React.FC<TenantHealthCheckModalProps> = ({
  isOpen,
  onClose,
  tenantId,
  companyId,
  tenantName,
  onActivationSuccess
}) => {
  const auth = useAuth();
  const tenantContext = useTenant();
  const userId = auth.state.supabaseAuthUser?.id || auth.state.authSession?.user?.id || '';

  const [loading, setLoading] = useState<boolean>(false);
  const [activating, setActivating] = useState<boolean>(false);
  const [healthResult, setHealthResult] = useState<TenantHealthCheckResult | null>(null);
  const [rawHealthData, setRawHealthData] = useState<TenantHealthCheckData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchHealthCheck = async () => {
    if (!tenantId || !companyId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await adapter.getTenantHealthData(tenantId, companyId);
      setRawHealthData(data);
      const res = evaluateTenantHealth(tenantId, companyId, data);
      setHealthResult(res);
    } catch (err: any) {
      setErrorMsg(err?.message || 'فشلت عملية فحص صحة وجاهزية المستأجر.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && tenantId && companyId) {
      fetchHealthCheck();
    }
  }, [isOpen, tenantId, companyId]);

  if (!isOpen) return null;

  const handleExplicitActivate = async () => {
    if (!tenantId || !companyId) return;
    setActivating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await activateProvisionedTenantUseCase(tenantId, companyId, userId, adapter);
      if (res.success) {
        setSuccessMsg('تمت عملية تفعيل المستأجر بنجاح! الحالة الحالية: ACTIVE');
        await fetchHealthCheck();
        tenantContext.actions.refreshTenantContext();
        if (onActivationSuccess) onActivationSuccess();
      } else {
        setErrorMsg(res.error || 'فشلت عملية التفعيل النهائي.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'فشلت عملية التفعيل.');
    } finally {
      setActivating(false);
    }
  };

  const isReadyForActivation = healthResult?.ready && rawHealthData?.tenant?.status === 'READY';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                تقرير صحة وجاهزية المستأجر (Health & Readiness)
              </h3>
              <p className="text-xs text-slate-500">
                المستأجر: <span className="font-semibold text-slate-700">{tenantName || tenantId}</span> | معرّف الشركة: <span className="font-mono text-slate-600">{companyId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Message Alerts */}
        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Health Check Body */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="mt-3 text-sm text-slate-500">جاري فحص جميع النواحي والمعايير الـ 10 للمستأجر...</p>
          </div>
        ) : healthResult ? (
          <div className="space-y-4">
            {/* Status Overview Card */}
            <div className={`flex items-center justify-between rounded-xl border p-4 ${
              healthResult.ready
                ? 'border-emerald-200 bg-emerald-50/50 text-emerald-800'
                : 'border-amber-200 bg-amber-50/50 text-amber-800'
            }`}>
              <div className="flex items-center gap-3">
                {healthResult.ready ? (
                  <ShieldCheck className="h-6 w-6 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                )}
                <div>
                  <h4 className="font-bold text-sm">
                    {healthResult.ready
                      ? 'جميع معايير الجاهزية والربط متحققة بنجاح 100%'
                      : 'توجد بعض الفحوصات غير المكتملة التي تتطلب مراجعة'}
                  </h4>
                  <p className="text-xs opacity-90 mt-0.5">
                    حالة المستأجر الحالية: <span className="font-bold">{rawHealthData?.tenant?.status || 'UNKNOWN'}</span> | تاريخ التقييم: {new Date(healthResult.timestamp).toLocaleString('ar-OM')}
                  </p>
                </div>
              </div>

              {isReadyForActivation && (
                <button
                  onClick={handleExplicitActivate}
                  disabled={activating}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
                >
                  {activating ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Power className="h-4 w-4" />
                  )}
                  <span>تفعيل المستأجر الآن (READY → ACTIVE)</span>
                </button>
              )}
            </div>

            {/* Detailed Checks Grid */}
            <div className="max-h-[340px] overflow-y-auto space-y-2 pe-1">
              {healthResult.checks.map((check, idx) => (
                <div
                  key={check.name || idx}
                  className="flex items-start justify-between rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    {check.passed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-semibold text-slate-800">
                        {CHECK_LABELS[check.name] || check.name}
                      </span>
                      {check.error && (
                        <p className="mt-1 text-red-600 text-[11px] bg-red-50 p-1.5 rounded border border-red-100 font-mono">
                          {check.error}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    check.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {check.passed ? 'سليم / PASSED' : 'فشل / FAILED'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 text-sm">
            لا تتوفر نتائج فحص حالية للمستأجر المحدد.
          </div>
        )}

        {/* Modal Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
          <button
            onClick={fetchHealthCheck}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>إعادة الفحص الآن</span>
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-900"
          >
            إغلاق التقرير
          </button>
        </div>
      </div>
    </div>
  );
};
