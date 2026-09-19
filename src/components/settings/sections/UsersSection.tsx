import React, { useState, useEffect } from "react";
import { Users, Search, Shield, Building2, GitBranch, Key, ChevronLeft, CheckCircle2, UserCheck, ShieldCheck, X } from "lucide-react";
import { useLanguage } from "../../../utils/LanguageContext";
import { useTenant } from "../../../contexts/TenantContext";
import { loadUnifiedUsers, filterUnifiedUsers } from "../../../application/services/unifiedUserService";
import { defaultUnifiedUserAdapter } from "../../../lib/adapters/unifiedUserAdapter";
import { UnifiedUser } from "../../../domain/user/unifiedUserDomain";

export const UsersSection: React.FC = () => {
  const { isRTL } = useLanguage();
  const { state: tenantState } = useTenant();
  const [users, setUsers] = useState<UnifiedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UnifiedUser | null>(null);

  useEffect(() => {
    loadUnifiedUsers(tenantState.activeCompanyId, defaultUnifiedUserAdapter).then(data => setUsers(data)).catch(() => {});
  }, [tenantState.activeCompanyId]);

  const filtered = filterUnifiedUsers(users, {
    searchTerm: searchQuery,
    companyFilter: tenantState.activeCompanyId || undefined
  });

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">إدارة مستخدمي النظام (System Users)</h2>
          <p className="text-xs text-slate-500">حسابات الهوية والهويات المسجلة والوصول والأدوار والتعيينات</p>
        </div>
        <div className="text-xs font-semibold px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
          إجمالي الحسابات: {filtered.length} مستخدم
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="البحث باسم المستخدم، البريد، الرقم المدني، أو الهاتف..."
          className="w-full pr-9 pl-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-indigo-500 bg-white"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="p-3">المستخدم</th>
                <th className="p-3">البريد الإلكتروني</th>
                <th className="p-3">التصنيف</th>
                <th className="p-3">الشركات المخولة</th>
                <th className="p-3">الفروع</th>
                <th className="p-3 text-center">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(usr => (
                <tr key={usr.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                        {usr.fullName?.charAt(0) || "U"}
                      </div>
                      <span>{usr.fullName}</span>
                    </div>
                  </td>
                  <td className="p-3 text-slate-600 font-mono text-[11px]">{usr.email}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                      {usr.userType === "BOTH" ? "منصة وموظف" : usr.userType === "PLATFORM" ? "إدارة المنصة" : "موظف شركة"}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 font-semibold text-indigo-700">
                      <Building2 className="w-3.5 h-3.5" /> {usr.memberships.length} شركة
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 text-slate-600">
                      <GitBranch className="w-3.5 h-3.5 text-emerald-600" />
                      {usr.memberships[0]?.allowedBranchIds?.length === 0 ? "جميع الفروع" : `${usr.memberships[0]?.allowedBranchIds?.length || 1} فرع`}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => setSelectedUser(usr)}
                      className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-[11px] transition-colors"
                    >
                      عرض الملف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">تفاصيل صلاحيات الوصول: {selectedUser.fullName}</h3>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-1">
                <p><strong>البريد الإلكتروني:</strong> {selectedUser.email}</p>
                <p><strong>الرقم المدني:</strong> {selectedUser.civilId || "غير مسجل"}</p>
                <p><strong>الدور الرئيسي:</strong> {selectedUser.primaryRole || "مدير فني"}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">عضويات الشركات والربط التشغيلي</h4>
                <div className="space-y-2">
                  {selectedUser.memberships.map((m, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 block">{m.companyNameAr || "شركة مسجلة"}</span>
                        <span className="text-[11px] text-slate-500">الدور: {m.roleId}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">نشط</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-lg bg-slate-200 text-slate-800 font-semibold text-xs hover:bg-slate-300"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
