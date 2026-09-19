import React, { useState } from "react";
import {
  Building2,
  Users,
  MessageSquare,
  Boxes,
  TrendingUp,
  Shield,
  SlidersHorizontal,
  ChevronLeft,
  ArrowRight,
  GitBranch,
  UserCheck,
  ShieldCheck,
  Key,
  Mail,
  Smartphone,
  FileText,
  Bell,
  Lock,
  Search
} from "lucide-react";
import { CompanySettings, DesignTheme, Employee, Branch, AuditLogEntry, KioskDevice } from "../../types";
import { useLanguage } from "../../utils/LanguageContext";
import { useTenant } from "../../contexts/TenantContext";

// Sections
import { GeneralSettingsSection } from "./sections/GeneralSettingsSection";
import { UsersSection } from "./sections/UsersSection";
import { EmployeesSection } from "./sections/EmployeesSection";
import { RolesPermissionsSection } from "./sections/RolesPermissionsSection";
import { AccessMembershipsSection } from "./sections/AccessMembershipsSection";
import { CommunicationSection } from "./sections/CommunicationSection";
import { ModulesFeaturesSection } from "./sections/ModulesFeaturesSection";
import { SystemSecuritySection } from "./sections/SystemSecuritySection";

type SettingsTabId =
  | "home"
  | "general"
  | "users"
  | "employees"
  | "roles"
  | "access"
  | "communication"
  | "modules"
  | "system";

interface SettingsCenterProps {
  settings?: CompanySettings;
  theme?: DesignTheme;
  employees?: Employee[];
  branches?: Branch[];
  auditLogs?: AuditLogEntry[];
  kioskDevices?: KioskDevice[];
  onSaveSettings?: (settings: CompanySettings) => void;
  onSaveTheme?: (theme: DesignTheme) => void;
  onSaveEmployees?: (employees: Employee[]) => void;
  onSaveKioskDevices?: (devices: KioskDevice[]) => void;
  onClearAuditLogs?: () => void;
  onOpenSecuritySettings?: () => void;
  onResetDefaults?: () => void;
}

export const SettingsCenter: React.FC<SettingsCenterProps> = ({
  settings,
  employees = [],
  branches = [],
  auditLogs = [],
  onSaveSettings,
  onClearAuditLogs,
  onOpenSecuritySettings
}) => {
  const { isRTL } = useLanguage();
  const { state: tenantState } = useTenant();
  const [activeTab, setActiveTab] = useState<SettingsTabId>("home");

  const activeCompany = tenantState.activeCompany;
  const activeBranch = tenantState.activeBranch;

  // Category list
  const CATEGORIES = [
    {
      id: "general" as SettingsTabId,
      titleAr: "إعدادات الشركة والفروع",
      titleEn: "General & Company",
      descAr: "بيانات السجل التجاري، الرقم الضريبي، الفروع والعملة الافتراضية",
      icon: Building2,
      color: "bg-indigo-50 text-indigo-600 border-indigo-100"
    },
    {
      id: "users" as SettingsTabId,
      titleAr: "إدارة مستخدمي النظام",
      titleEn: "System Users",
      descAr: "حسابات الهوية المسجلة، البريد، وتصنيفات الوصول والربط",
      icon: Users,
      color: "bg-blue-50 text-blue-600 border-blue-100"
    },
    {
      id: "employees" as SettingsTabId,
      titleAr: "سجل الموظفين والكوادر",
      titleEn: "Personnel Directory",
      descAr: "السجلات الوظيفية، المسميات، الأقسام، وحالة الربط بالحساب",
      icon: UserCheck,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100"
    },
    {
      id: "roles" as SettingsTabId,
      titleAr: "الأدوار والصلاحيات (RBAC)",
      titleEn: "Roles & Permissions",
      descAr: "الأدوار الوظيفية المعتمدة ومصفوفة الـ 91 صلاحية تفصيلية",
      icon: ShieldCheck,
      color: "bg-amber-50 text-amber-600 border-amber-100"
    },
    {
      id: "access" as SettingsTabId,
      titleAr: "سجل العضويات والوصول",
      titleEn: "Access & Memberships",
      descAr: "عضويات الشركات والتحكم بنطاق الفروع المسموح بها",
      icon: Key,
      color: "bg-purple-50 text-purple-600 border-purple-100"
    },
    {
      id: "communication" as SettingsTabId,
      titleAr: "مركز الاتصالات والإشعارات",
      titleEn: "Communication Center",
      descAr: "إعدادات الواتساب، البريد (Resend)، القوالب، وقواعد الإشعارات",
      icon: MessageSquare,
      color: "bg-teal-50 text-teal-600 border-teal-100"
    },
    {
      id: "modules" as SettingsTabId,
      titleAr: "الوحدات والميزات المفعلة",
      titleEn: "Tenant Modules & Features",
      descAr: "حالة تمكين وحدات ERP الـ 11 والميزات التفصيلية للمستأجر",
      icon: Boxes,
      color: "bg-pink-50 text-pink-600 border-pink-100"
    },
    {
      id: "system" as SettingsTabId,
      titleAr: "الأمان وسجل النشاطات",
      titleEn: "System & Security Audit",
      descAr: "سجلات الأحداث، سياسات الجلسات، ومعلومات النظام",
      icon: Shield,
      color: "bg-slate-100 text-slate-700 border-slate-200"
    }
  ];

  return (
    <div className="space-y-6 pb-12 text-slate-800" dir={isRTL ? "rtl" : "ltr"}>
      
      {/* Top Header & Breadcrumbs */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-1">
            <span
              onClick={() => setActiveTab("home")}
              className="hover:text-indigo-600 cursor-pointer transition-colors"
            >
              مركز الإعدادات الشامل (Settings)
            </span>
            {activeTab !== "home" && (
              <>
                <span>/</span>
                <span className="text-indigo-600 font-bold">
                  {CATEGORIES.find(c => c.id === activeTab)?.titleAr}
                </span>
              </>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            مركز التهيئة والإعدادات المؤسسية • Enterprise Settings
          </h1>
        </div>

        {/* Company Scope Indicator */}
        <div className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
          <Building2 className="w-4 h-4 text-indigo-600" />
          <span className="font-semibold text-slate-800">{activeCompany?.nameAr || "مؤسسة ديشال ERP"}</span>
          <span className="text-slate-400">•</span>
          <GitBranch className="w-4 h-4 text-emerald-600" />
          <span className="text-slate-600">{activeBranch?.name || "فرع صحار"}</span>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* LANDING VIEW (SETTINGS HOME) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "home" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${cat.color} group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {cat.titleAr}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {cat.descAr}
                    </p>
                  </div>
                </div>
                <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
                  <span>انتقال لتهيئة القسم</span>
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ────────────────────────────────────────────────────────────────────────── */
        /* SUBPAGE VIEW WITH SIDEBAR NAVIGATION */
        /* ────────────────────────────────────────────────────────────────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Desktop Left Navigation Sidebar */}
          <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200 shadow-xs h-fit">
            <button
              onClick={() => setActiveTab("home")}
              className="w-full text-right px-3 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 mb-2 flex items-center justify-between"
            >
              <span>← العودة للشاشة الرئيسية</span>
            </button>
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = activeTab === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={`w-full text-right px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                  <span className="truncate">{cat.titleAr}</span>
                </button>
              );
            })}
          </div>

          {/* Main Section Content Area (3 COLS) */}
          <div className="lg:col-span-3">
            {activeTab === "general" && (
              <GeneralSettingsSection
                settings={settings}
                branches={branches}
                onSaveSettings={onSaveSettings}
              />
            )}
            {activeTab === "users" && <UsersSection />}
            {activeTab === "employees" && <EmployeesSection employees={employees} />}
            {activeTab === "roles" && <RolesPermissionsSection />}
            {activeTab === "access" && <AccessMembershipsSection />}
            {activeTab === "communication" && <CommunicationSection />}
            {activeTab === "modules" && <ModulesFeaturesSection />}
            {activeTab === "system" && (
              <SystemSecuritySection
                onClearAuditLogs={onClearAuditLogs}
                onOpenSecuritySettings={onOpenSecuritySettings}
              />
            )}
          </div>

        </div>
      )}

    </div>
  );
};
