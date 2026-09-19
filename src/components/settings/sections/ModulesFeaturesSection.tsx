import React from "react";
import { Boxes, CheckCircle2, ShieldCheck, ToggleRight } from "lucide-react";
import { useLanguage } from "../../../utils/LanguageContext";
import { useTenant } from "../../../contexts/TenantContext";

export const ModulesFeaturesSection: React.FC = () => {
  const { isRTL } = useLanguage();
  const { state: tenantState } = useTenant();

  const enabledModules = tenantState.enabledModules || {};

  const ALL_MODULES_META = [
    { id: "pos", nameAr: "نقطة البيع والكاشير (POS)", nameEn: "POS & Retail Register" },
    { id: "crm", nameAr: "إدارة علاقات العملاء (CRM)", nameEn: "Customer Management" },
    { id: "inventory", nameAr: "المخزون والمستودعات", nameEn: "Inventory Management" },
    { id: "purchases", nameAr: "المشتريات والموردين", nameEn: "Purchases & Suppliers" },
    { id: "accounting", nameAr: "الحسابات ودفتر الأستاذ", nameEn: "General Ledger & Accounting" },
    { id: "hr", nameAr: "الموارد البشرية والرواتب", nameEn: "HR & Payroll Engine" },
    { id: "spaces", nameAr: "إدارة القاعات والمساحات", nameEn: "Spaces & Halls Management" },
    { id: "services", nameAr: "الخدمات والاستشارات", nameEn: "Consulting Services & Advisory" },
    { id: "requests", nameAr: "منظومة الطلبات والنماذج", nameEn: "Employee & Website Requests" },
    { id: "documents", nameAr: "الأرشيف والمستندات", nameEn: "Document Vault & Archive" }
  ];

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">حزمة الوحدات والميزات المفعلة (Tenant Modules & Features)</h2>
          <p className="text-xs text-slate-500">حالة تمكين وتنشيط وحدات ERP الـ 11 والميزات التفصيلية للمستأجر</p>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <Boxes className="w-4 h-4 text-indigo-600" /> وحدات المنظومة الـ 11 وتراخيص الوصول
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {ALL_MODULES_META.map(mod => {
            const isEnabled = enabledModules[mod.id] !== false; // Enabled by default
            return (
              <div
                key={mod.id}
                className={`p-3.5 rounded-lg border flex items-center justify-between ${
                  isEnabled ? "bg-emerald-50/60 border-emerald-200" : "bg-slate-50 border-slate-200 opacity-60"
                }`}
              >
                <div>
                  <h4 className="font-bold text-slate-900">{mod.nameAr}</h4>
                  <p className="text-[11px] text-slate-500">{mod.nameEn}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${isEnabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>
                  {isEnabled ? "مفعل (ENABLED)" : "معطل (DISABLED)"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
