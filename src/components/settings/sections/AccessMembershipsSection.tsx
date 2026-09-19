import React, { useState, useEffect } from "react";
import { Building2, GitBranch, Shield, Users, CheckCircle2 } from "lucide-react";
import { useLanguage } from "../../../utils/LanguageContext";
import { useTenant } from "../../../contexts/TenantContext";
import { loadUnifiedUsers } from "../../../application/services/unifiedUserService";
import { defaultUnifiedUserAdapter } from "../../../lib/adapters/unifiedUserAdapter";
import { UnifiedUser } from "../../../domain/user/unifiedUserDomain";

export const AccessMembershipsSection: React.FC = () => {
  const { isRTL } = useLanguage();
  const { state: tenantState } = useTenant();
  const [users, setUsers] = useState<UnifiedUser[]>([]);

  useEffect(() => {
    loadUnifiedUsers(tenantState.activeCompanyId, defaultUnifiedUserAdapter).then(data => setUsers(data)).catch(() => {});
  }, [tenantState.activeCompanyId]);

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">سجل العضويات والوصول للشركات والفروع (Access & Memberships)</h2>
          <p className="text-xs text-slate-500">من يمتلك صلاحية الوصول للشركات والنطاق الجغرافي للفروع المسموح بها</p>
        </div>
      </div>

      {/* Access Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="p-3">المستخدم</th>
                <th className="p-3">الشركة المعتمدة</th>
                <th className="p-3">الدور الوظيفي في الشركة</th>
                <th className="p-3">نطاق الفروع المسموح به</th>
                <th className="p-3 text-center">حالة العضوية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.flatMap(usr =>
                usr.memberships.map((m, idx) => (
                  <tr key={`${usr.id}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                          {usr.fullName?.charAt(0) || "U"}
                        </div>
                        <span>{usr.fullName}</span>
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-indigo-900 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                      {m.companyNameAr || "شركة مسجلة"}
                    </td>
                    <td className="p-3 text-slate-700 font-medium">{m.roleId}</td>
                    <td className="p-3">
                      {m.allowedBranchIds.length === 0 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <GitBranch className="w-3.5 h-3.5" /> جميع فروع الشركة (ALL BRANCHES)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          <GitBranch className="w-3.5 h-3.5 text-indigo-600" /> {m.allowedBranchIds.length} فرع محدد (SELECTED)
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        نشط (ACTIVE)
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
