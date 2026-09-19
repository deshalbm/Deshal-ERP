import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Globe,
  Clock,
  Building2,
  GitBranch,
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Users,
  Calendar,
  Receipt,
  FileSpreadsheet,
  UserPlus,
  CalendarPlus,
  FilePlus,
  UserCheck,
  TrendingUp,
  Boxes,
  ShieldCheck,
  RefreshCw,
  Eye,
  ChevronLeft
} from "lucide-react";
import { useLanguage } from "../../utils/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { useTenant } from "../../contexts/TenantContext";
import { useHR } from "../../contexts/HRContext";
import { useVouchers } from "../../contexts/VouchersContext";
import { useCRM } from "../../contexts/CRMContext";
import { useSpaces } from "../../contexts/SpacesContext";
import { loadEmployeeRequests } from "../../utils/requestsStorage";
import { loadAuditLogs } from "../../utils/auditLogger";
import {
  buildPersonalizedWorkspaceState,
  PersonalizedWorkspaceState
} from "../../lib/application/services/workspacePersonalizationService";

// ----------------------------------------------------
// 1. WIDGET WRAPPER CONTAINER (RESILIENCY GATE)
// ----------------------------------------------------
interface WidgetWrapperProps {
  widgetName: string;
  children: React.ReactNode;
}

const WorkspaceWidgetBoundary: React.FC<WidgetWrapperProps> = ({ widgetName, children }) => {
  return <div className="widget-resilient-container">{children}</div>;
};

// ----------------------------------------------------
// 2. MAIN PERSONALIZED WORKSPACE COMPONENT
// ----------------------------------------------------
interface PersonalizedWorkspaceProps {
  userName?: string;
  onNavigateTab: (tab: string) => void;
  onSelectAction?: (actionType: string) => void;
}

export const PersonalizedWorkspace: React.FC<PersonalizedWorkspaceProps> = ({
  userName = "المستخدم",
  onNavigateTab
}) => {
  const { isRTL } = useLanguage();
  const { state: authState } = useAuth();
  const { state: tenantState } = useTenant();
  const { state: vouchersState } = useVouchers();
  const { state: hrState } = useHR();
  const { state: spacesState } = useSpaces();

  const session = authState.authSession;
  const activeCompany = tenantState.activeCompany;
  const activeBranch = tenantState.activeBranch;
  const enabledModulesMap = tenantState.enabledModules || {};
  const enabledModuleKeys = Object.keys(enabledModulesMap).filter(k => enabledModulesMap[k]);

  const vouchersList = vouchersState.vouchers || [];
  const spaceBookingsList = spacesState.spaceBookings || [];

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [workspaceState, setWorkspaceState] = useState<PersonalizedWorkspaceState | null>(null);

  // Live clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute workspace personalization state
  useEffect(() => {
    const requests = loadEmployeeRequests();
    const state = buildPersonalizedWorkspaceState(
      {
        userId: tenantState.authenticatedUser?.id || session?.user?.id,
        userName: tenantState.authenticatedUser?.fullName || session?.user?.fullName || userName,
        isPlatformAdmin: tenantState.isPlatformAdmin,
        platformRole: tenantState.isPlatformAdmin ? 'PLATFORM_ADMIN' : null,
        primaryRole: tenantState.employeeRole || null,
        activeCompanyId: activeCompany?.id,
        activeCompanyNameAr: activeCompany?.nameAr,
        activeBranchId: activeBranch?.id,
        activeBranchNameAr: activeBranch?.name,
        permissions: tenantState.permissions || [],
        enabledModules: enabledModuleKeys
      },
      requests,
      vouchersList,
      []
    );
    setWorkspaceState(state);
  }, [session, activeCompany, activeBranch, tenantState, enabledModuleKeys, vouchersList, userName]);

  const greeting = currentTime.getHours() < 12 ? "صباح الخير" : "مساء الخير";
  const displayName = tenantState.authenticatedUser?.fullName || session?.user?.fullName || userName;

  return (
    <div className="space-y-6 pb-12 text-slate-800" dir={isRTL ? "rtl" : "ltr"}>
      
      {/* CONTEXT HEADER */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-2xl p-6 shadow-md border border-indigo-900/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              مساحة العمل التشغيلية المخصصة • Workspace
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              {greeting}، {displayName} 👋
            </h1>
            <p className="text-indigo-200/80 text-sm mt-1">
              نظرة عامة على المهام، الطلبات، والمؤشرات التشغيلية لليوم.
            </p>
          </div>

          {/* Context Scope Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/15 text-indigo-100 font-medium">
              <Building2 className="w-3.5 h-3.5 text-indigo-300" />
              <span>{activeCompany?.nameAr || "مؤسسة ديشال ERP"}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/15 text-indigo-100 font-medium">
              <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
              <span>{activeBranch?.name || "فرع صحار الرئيسي"}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 backdrop-blur-md border border-indigo-400/30 text-indigo-200 font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span>{currentTime.toLocaleTimeString("ar-OM", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS ROW */}
      {workspaceState?.quickActions && workspaceState.quickActions.length > 0 && (
        <WorkspaceWidgetBoundary widgetName="الإجراءات السريعة">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> الإجراءات السريعة المتاحة (Quick Actions)
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {workspaceState.quickActions.map(act => (
                <button
                  key={act.id}
                  onClick={() => onNavigateTab(act.targetTab)}
                  className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-indigo-50/60 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 transition-all text-xs font-semibold group text-right"
                >
                  <div className="w-7 h-7 rounded-md bg-white border border-slate-200 group-hover:border-indigo-300 flex items-center justify-center text-indigo-600 shadow-2xs">
                    {act.id === "new_customer" && <UserPlus className="w-4 h-4" />}
                    {act.id === "new_booking" && <CalendarPlus className="w-4 h-4" />}
                    {act.id === "new_service_request" && <FilePlus className="w-4 h-4" />}
                    {act.id === "new_voucher" && <Receipt className="w-4 h-4" />}
                    {act.id === "new_invoice" && <FileSpreadsheet className="w-4 h-4" />}
                    {act.id === "new_employee" && <UserCheck className="w-4 h-4" />}
                  </div>
                  <span className="truncate">{act.labelAr}</span>
                </button>
              ))}
            </div>
          </div>
        </WorkspaceWidgetBoundary>
      )}

      {/* MAIN TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT / MAIN COLUMN (2 COLS) */}
        <div className="lg:col-span-2 space-y-6">

          {/* WEBSITE REQUESTS WIDGET (PHASE 53A INTEGRATION) */}
          <WorkspaceWidgetBoundary widgetName="طلبات الموقع الإلكتروني">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">طلبات الموقع الإلكتروني (Website Requests)</h3>
                    <p className="text-xs text-slate-500">منظومة الاستقبال الفوري للنماذج والاستشارات من الموقع</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigateTab("requests")}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  عرض جميع الطلبات <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Website Counters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-lg bg-indigo-50/60 border border-indigo-100">
                  <span className="text-xs text-indigo-700 font-semibold block">جديد اليوم</span>
                  <span className="text-2xl font-bold text-indigo-950 mt-1 block">
                    {workspaceState?.websiteRequests.newCount || 0}
                  </span>
                </div>
                <div className="p-3.5 rounded-lg bg-amber-50/60 border border-amber-100">
                  <span className="text-xs text-amber-700 font-semibold block">قيد المتابعة</span>
                  <span className="text-2xl font-bold text-amber-950 mt-1 block">
                    {workspaceState?.websiteRequests.pendingCount || 0}
                  </span>
                </div>
                <div className="p-3.5 rounded-lg bg-blue-50/60 border border-blue-100">
                  <span className="text-xs text-blue-700 font-semibold block">قيد التنفيذ</span>
                  <span className="text-2xl font-bold text-blue-950 mt-1 block">
                    {workspaceState?.websiteRequests.inProgressCount || 0}
                  </span>
                </div>
                <div className="p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
                  <span className="text-xs text-emerald-700 font-semibold block">إجمالي النشطة</span>
                  <span className="text-2xl font-bold text-emerald-950 mt-1 block">
                    {workspaceState?.websiteRequests.totalActive || 0}
                  </span>
                </div>
              </div>
            </div>
          </WorkspaceWidgetBoundary>

          {/* MY WORK / PRIORITY ACTIONS */}
          <WorkspaceWidgetBoundary widgetName="مهامي وأعمالي اليومية">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> مهامي وأعمالي اليومية (My Priority Work)
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {workspaceState?.priorityItems.length || 0} عنصر
                </span>
              </div>

              {workspaceState?.priorityItems && workspaceState.priorityItems.length > 0 ? (
                <div className="space-y-2.5">
                  {workspaceState.priorityItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => onNavigateTab(item.targetTab)}
                      className="p-3 rounded-lg border border-slate-200/80 hover:border-indigo-300 hover:bg-slate-50/80 transition-all flex items-center justify-between cursor-pointer group"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${item.priority === "HIGH" ? "bg-red-500" : "bg-amber-500"}`} />
                          <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                            {item.titleAr}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 me-4">{item.subtitleAr}</p>
                      </div>
                      <span className="text-xs text-indigo-600 font-semibold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        متابعة <ChevronLeft className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="text-xs font-semibold text-slate-700">لا توجد مهام أو اعتمادات معلقة حالياً</p>
                  <p className="text-xs text-slate-500 mt-0.5">جميع الأعمال والطلبات محدثة بالكامل لليوم.</p>
                </div>
              )}
            </div>
          </WorkspaceWidgetBoundary>

          {/* OPERATIONAL KPIS */}
          <WorkspaceWidgetBoundary widgetName="المؤشرات التشغيلية السريعة">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" /> المؤشرات التشغيلية (Operational Indicators)
                </h3>
                <button
                  onClick={() => onNavigateTab("accounting")}
                  className="text-xs text-indigo-600 font-semibold hover:underline"
                >
                  التقرير المالي الكامل ←
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-xs text-slate-500 block font-medium">تحصيلات اليوم الفعلية</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold text-slate-900">
                      {workspaceState?.kpis.todayCollectionsOmr.toFixed(3) || "0.000"}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">ر.ع.</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-xs text-slate-500 block font-medium">إجمالي عقود المساحات النشطة</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold text-slate-900">
                      {workspaceState?.kpis.activeContractsCount || spaceBookingsList.length || 0}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">عقد نشط</span>
                  </div>
                </div>
              </div>
            </div>
          </WorkspaceWidgetBoundary>

        </div>

        {/* RIGHT SIDEBAR COLUMN (1 COL) */}
        <div className="space-y-6">

          {/* RECENT SYSTEM ACTIVITY FEED */}
          <WorkspaceWidgetBoundary widgetName="نشاطات النظام الأخيرة">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" /> سجل النشاطات الأخيرة (Activity)
              </h3>
              <div className="space-y-3">
                {loadAuditLogs().slice(0, 5).map(log => (
                  <div key={log.id} className="text-xs border-b border-slate-100 pb-2.5 last:border-0">
                    <div className="flex items-center justify-between text-slate-500 text-[10px] mb-0.5">
                      <span className="font-semibold text-indigo-600">{log.module}</span>
                      <span>{new Date(log.timestamp || Date.now()).toLocaleTimeString("ar-OM", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <p className="text-slate-800 font-medium leading-snug">{log.descriptionAr || log.descriptionEn || log.details}</p>
                  </div>
                ))}
              </div>
            </div>
          </WorkspaceWidgetBoundary>

          {/* SYSTEM ADVISORY CARD */}
          <div className="bg-gradient-to-br from-indigo-50 to-slate-50 rounded-xl border border-indigo-100 p-5 shadow-2xs text-xs text-slate-700">
            <div className="flex items-center gap-2 text-indigo-900 font-bold mb-1">
              <ShieldCheck className="w-4 h-4 text-indigo-600" /> حماية وأمان البيانات
            </div>
            <p className="text-slate-600 leading-relaxed">
              جميع الصلاحيات والوصول للمعلومات محكومة بنظام RLS والعزل التام بين الفروع والشركات.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
