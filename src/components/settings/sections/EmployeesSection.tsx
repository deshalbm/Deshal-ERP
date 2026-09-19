import React, { useState } from "react";
import { UserCheck, Search, Building2, GitBranch, Briefcase, Link2, CheckCircle2, AlertCircle } from "lucide-react";
import { Employee } from "../../../types";
import { useLanguage } from "../../../utils/LanguageContext";

interface EmployeesSectionProps {
  employees?: Employee[];
}

export const EmployeesSection: React.FC<EmployeesSectionProps> = ({ employees = [] }) => {
  const { isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = employees.filter(emp =>
    (emp.fullName || "").includes(searchQuery) ||
    (emp.employeeCode || "").includes(searchQuery) ||
    (emp.jobTitle || "").includes(searchQuery) ||
    (emp.department || "").includes(searchQuery)
  );

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">سجل الموظفين والكوادر الوظيفية (Personnel Directory)</h2>
          <p className="text-xs text-slate-500">إدارة السجلات الوظيفية، الأقسام، المسميات، وحالة الربط بحساب النظام</p>
        </div>
        <div className="text-xs font-semibold px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
          إجمالي الموظفين: {filtered.length} موظف
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="البحث باسم الموظف، الرقم الوظيفي، المسمى الوظيفي، أو القسم..."
          className="w-full pr-9 pl-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-indigo-500 bg-white"
        />
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="p-3">الكود</th>
                <th className="p-3">الموظف</th>
                <th className="p-3">المسمى الوظيفي</th>
                <th className="p-3">القسم</th>
                <th className="p-3">الفرع</th>
                <th className="p-3 text-center">حساب النظام</th>
                <th className="p-3 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(emp => {
                const isConnected = Boolean(emp.email && emp.email.includes("@"));
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-indigo-700">{emp.employeeCode}</td>
                    <td className="p-3 font-semibold text-slate-900">{emp.fullName}</td>
                    <td className="p-3 text-slate-600">{emp.jobTitle}</td>
                    <td className="p-3 text-slate-600">{emp.department}</td>
                    <td className="p-3 text-slate-600">{emp.branchName || "فرع صحار"}</td>
                    <td className="p-3 text-center">
                      {isConnected ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> مرتبط بحساب
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                          <Link2 className="w-3.5 h-3.5" /> غير مرتبط
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${emp.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                        {emp.status === "ACTIVE" ? "نشط" : "مجمد"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
