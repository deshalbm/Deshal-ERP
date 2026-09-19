import React from "react";
import { Shield, Lock, FileText, Database, Server, RefreshCw } from "lucide-react";
import { useLanguage } from "../../../utils/LanguageContext";
import { ActivityLogsManager } from "../../ActivityLogsManager";

interface SystemSecuritySectionProps {
  onClearAuditLogs?: () => void;
  onOpenSecuritySettings?: () => void;
}

export const SystemSecuritySection: React.FC<SystemSecuritySectionProps> = ({
  onClearAuditLogs,
  onOpenSecuritySettings
}) => {
  const { isRTL } = useLanguage();

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">الأمان، سجل النشاطات ومعلومات النظام (System & Security)</h2>
          <p className="text-xs text-slate-500">إدارة سجلات التدقيق، سياسات الجلسات، ومعلومات النظام البرمجية</p>
        </div>
      </div>

      {/* Security Quick Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-600" /> إعدادات أمان الحساب والجلسات
        </h3>
        <p className="text-slate-600">
          تغيير كلمة المرور، القفل التلقائي للشاشة، وتأمين رمز PIN للجلسات السريعة.
        </p>
        {onOpenSecuritySettings && (
          <button
            onClick={onOpenSecuritySettings}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
          >
            فتح إعدادات الأمان الحليفة
          </button>
        )}
      </div>

      {/* Audit Logs Embed */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-600" /> سجل نشاطات وأحداث التدقيق (Activity Audit Log)
        </h3>
        <ActivityLogsManager onClearLogs={onClearAuditLogs} />
      </div>

    </div>
  );
};
