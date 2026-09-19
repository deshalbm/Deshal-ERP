import React, { useState } from "react";
import { Shield, ShieldCheck, Check, Lock, Users, ChevronLeft } from "lucide-react";
import { useLanguage } from "../../../utils/LanguageContext";
import { EmployeeRole } from "../../../types";
import { ROLE_DEFAULT_PERMISSIONS, PERMISSION_CATEGORIES_META, PERMISSION_CONFIG } from "../../../domain/hr/employeePermissions";

const ROLES_LIST: { id: EmployeeRole; nameAr: string; nameEn: string; descAr: string }[] = [
  { id: "ADMIN", nameAr: "مدير النظام (Admin)", nameEn: "System Administrator", descAr: "صلاحيات كاملة على كافة المعاملات والمستندات والإعدادات" },
  { id: "MANAGER", nameAr: "مدير عام / تشغيلي", nameEn: "Operations Manager", descAr: "إدارة العمليات والاعتمادات والتقارير التنفيذية" },
  { id: "ACCOUNTANT", nameAr: "المحاسب المالي", nameEn: "Chief Accountant", descAr: "إدارة القيود، السندات، الحسابات، وإغلاق الفترات المالية" },
  { id: "SALES", nameAr: "مسؤول المبيعات ونقاط البيع", nameEn: "Sales Specialist", descAr: "إصدار الفواتير، فتح ورديات POS، وإدارة العملاء" },
  { id: "STOREKEEPER", nameAr: "أمين المخزن والتحويلات", nameEn: "Storekeeper", descAr: "إدارة حركة المخزون، التحويلات، والجرد الدوري" },
  { id: "RECEPTIONIST", nameAr: "مسؤول الاستقبال والحجوزات", nameEn: "Front Desk Receptionist", descAr: "استقبال زوار الموقع، حجز القاعات، ومتابعة الطلبات" },
  { id: "AUDITOR", nameAr: "مدقق مالي وإداري", nameEn: "Auditor", descAr: "صلاحيات الاطلاع المباشر على التقارير وسجلات النشاط" }
];

export const RolesPermissionsSection: React.FC = () => {
  const { isRTL } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<EmployeeRole>("ADMIN");

  const activePermissions = ROLE_DEFAULT_PERMISSIONS[selectedRole] || [];

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">الأدوار والصلاحيات (Roles & Permissions Matrix)</h2>
          <p className="text-xs text-slate-500">استعراض الهيكل المعياري لـ 91 صلاحية تفصيلية ومصفوفة الأدوار الـ 7 الرئيسية في النظام</p>
        </div>
      </div>

      {/* Grid: 7 Roles sidebar + Permissions list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Roles List (1 COL) */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-600" /> الأدوار المعيارية
          </h3>
          {ROLES_LIST.map(r => (
            <div
              key={r.id}
              onClick={() => setSelectedRole(r.id)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                selectedRole === r.id
                  ? "bg-indigo-50/80 border-indigo-300 shadow-xs"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <h4 className={`text-xs font-bold ${selectedRole === r.id ? "text-indigo-900" : "text-slate-800"}`}>
                  {r.nameAr}
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  {ROLE_DEFAULT_PERMISSIONS[r.id]?.length || 0} صلاحية
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{r.descAr}</p>
            </div>
          ))}
        </div>

        {/* Permissions Categories Matrix (2 COLS) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" /> مصفوفة الصلاحيات الممنوحة لدور: {ROLES_LIST.find(r => r.id === selectedRole)?.nameAr}
              </h3>
            </div>

            <div className="space-y-5">
              {PERMISSION_CATEGORIES_META.map(cat => {
                const catPerms = PERMISSION_CONFIG.filter(p => p.category === cat.key);
                return (
                  <div key={cat.key} className="space-y-2">
                    <h4 className="text-xs font-bold text-indigo-900 pb-1 border-b border-indigo-100 flex items-center justify-between">
                      <span>{cat.titleAr} ({cat.titleEn})</span>
                      <span className="text-[10px] font-normal text-slate-500">{catPerms.length} صلاحية تفصيلية</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {catPerms.map(perm => {
                        const isGranted = activePermissions.includes(perm.id);
                        return (
                          <div
                            key={perm.id}
                            className={`p-2.5 rounded-lg border flex items-center justify-between ${
                              isGranted
                                ? "bg-emerald-50/50 border-emerald-200 text-emerald-900 font-medium"
                                : "bg-slate-50/50 border-slate-200 text-slate-400 opacity-60"
                            }`}
                          >
                            <span>{perm.label}</span>
                          {isGranted ? (
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
