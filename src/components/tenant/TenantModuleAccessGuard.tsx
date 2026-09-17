/**
 * Enterprise Tenant Module & Lifecycle Guard — Deshal ERP
 * 
 * Clean Architecture Presentation Component:
 * Enforces Tenant Lifecycle Status (ACTIVE required for operational ERP modules)
 * and Module & Feature Entitlement Scopes across all 11 ERP modules.
 */

import React from 'react';
import { ShieldAlert, Lock, AlertTriangle, RefreshCw } from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';

export interface TenantModuleAccessGuardProps {
  moduleCode: string;
  moduleTitleAr: string;
  moduleTitleEn: string;
  featureCode?: string;
  featureTitleAr?: string;
  children: React.ReactNode;
}

export const TenantModuleAccessGuard: React.FC<TenantModuleAccessGuardProps> = ({
  moduleCode,
  moduleTitleAr,
  moduleTitleEn,
  featureCode,
  featureTitleAr,
  children
}) => {
  const tenant = useTenant();
  const { tenantStatus, loading, isPlatformAdmin } = tenant.state;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-xs font-semibold">جاري تحقق صلاحيات واستحقاق المستأجر المنصّي...</p>
      </div>
    );
  }

  // 1. Tenant Lifecycle Status Guard (Must be ACTIVE for operational ERP access)
  if (tenantStatus && tenantStatus !== 'ACTIVE') {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6 text-amber-900 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold">
                وصول تشغيلي متوقف: حالة المستأجر الحالية هي ({tenantStatus})
              </h3>
              <p className="text-xs leading-relaxed text-amber-800">
                لا يمكن إجراء عمليات تشغيلية في موديول <span className="font-bold">{moduleTitleAr} ({moduleTitleEn})</span> لأن حالة المؤسسة السحابية الحالية ليست نشطة بالكامل (ACTIVE).
              </p>
              <div className="rounded-xl border border-amber-300 bg-white/70 p-3 text-[11px] text-amber-900 font-mono">
                <span className="font-bold text-amber-950">• السياسة التشغيلية:</span> حالة {tenantStatus} تمنع الوصول للبيانات التشغيلية للحفاظ على سلامة الحساب والحركات السابقة.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Module Entitlement Guard
  const hasModule = tenant.actions.hasModuleAccess(moduleCode);
  if (!hasModule) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-6 text-rose-900 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-700 shrink-0">
              <Lock className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold">
                موديول غير مفعّل: {moduleTitleAr} ({moduleTitleEn})
              </h3>
              <p className="text-xs leading-relaxed text-rose-800">
                موديول <span className="font-bold">{moduleTitleAr}</span> غير مشمول في استحقاق اشتراك المؤسسة الحالية (Tenant Module Entitlements).
              </p>
              <div className="rounded-xl border border-rose-300 bg-white/70 p-3 text-[11px] text-rose-900 font-mono">
                <span className="font-bold text-rose-950">• كود الموديول المستهدف:</span> {moduleCode} | يرجى التواصل مع مسؤول المنصة لترقية الاشتراك وتفعيل الموديول.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Feature Entitlement Guard (if featureCode is specified)
  if (featureCode) {
    const hasFeature = tenant.actions.hasFeatureAccess(moduleCode, featureCode);
    if (!hasFeature) {
      return (
        <div className="mx-auto max-w-4xl p-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6 text-amber-900 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shrink-0">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold">
                  ميزة غير مفعّلة: {featureTitleAr || featureCode}
                </h3>
                <p className="text-xs leading-relaxed text-amber-800">
                  الميزة التفصيلية المطلوبة (<span className="font-bold">{featureTitleAr || featureCode}</span>) متوقفة حالياً لهذا المستأجر.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // 4. All checks passed -> Render operational children
  return <>{children}</>;
};
