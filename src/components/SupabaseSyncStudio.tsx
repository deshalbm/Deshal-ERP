import React, { useState } from "react";
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Database,
  Key,
  Globe,
  Terminal,
  Copy,
  Check,
  ShieldCheck,
  FileDown,
  FileUp,
  Clock,
  Sparkles,
  Server,
  Layers
} from "lucide-react";
import {
  CompanySettings,
  DesignTheme,
  ReceiptVoucher,
  Customer,
  InventoryItem,
  StockMovement,
  PurchaseInvoice,
  Supplier,
  Branch,
  StockTransfer,
  Employee,
  AuditLogEntry,
  POSOrder,
  RecurringSchedule
} from "../types";
import { DEFAULT_COMPANY_SETTINGS } from "../utils/storage";
import { useLanguage } from "../utils/LanguageContext";
import {
  FullAppBackupSnapshot,
  testSupabaseConnection,
  pushBackupToSupabase,
  pullBackupFromSupabase,
  generateSupabaseSqlSetup
} from "../utils/supabaseSync";

interface SupabaseSyncStudioProps {
  settings?: CompanySettings;
  theme: DesignTheme;
  vouchers: ReceiptVoucher[];
  customers: Customer[];
  inventory: InventoryItem[];
  purchases: PurchaseInvoice[];
  suppliers: Supplier[];
  stockMovements: StockMovement[];
  branches: Branch[];
  stockTransfers: StockTransfer[];
  employees: Employee[];
  schedules: RecurringSchedule[];
  posOrders: POSOrder[];
  auditLogs: AuditLogEntry[];
  onSaveSettings: (settings: CompanySettings) => void;
  onRestoreSnapshot: (snapshot: FullAppBackupSnapshot) => void;
  onAuditLog?: (action: any, module: any, id: string, name: string, descAr: string, descEn: string) => void;
}

export const SupabaseSyncStudio: React.FC<SupabaseSyncStudioProps> = ({
  settings = DEFAULT_COMPANY_SETTINGS,
  theme,
  vouchers,
  customers,
  inventory,
  purchases,
  suppliers,
  stockMovements,
  branches,
  stockTransfers,
  employees,
  schedules,
  posOrders,
  auditLogs,
  onSaveSettings,
  onRestoreSnapshot,
  onAuditLog
}) => {
  const { language, isRTL } = useLanguage();

  const syncConfig = settings.supabaseSync || {
    enabled: false,
    supabaseUrl: "",
    supabaseAnonKey: "",
    tableName: "deshal_erp_backups",
    syncKey: "company-main-tenant",
    autoSync: true,
    syncIntervalMinutes: 15,
    lastSyncStatus: "IDLE"
  };

  const [localConfig, setLocalConfig] = useState(syncConfig);
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [showSqlSetup, setShowSqlSetup] = useState<boolean>(false);

  const handleConfigChange = (field: string, val: any) => {
    const updated = { ...localConfig, [field]: val };
    setLocalConfig(updated);
    onSaveSettings({
      ...settings,
      supabaseSync: updated
    });
  };

  // Compile current snapshot payload
  const buildCurrentSnapshot = (): FullAppBackupSnapshot => {
    return {
      version: "2.5.0",
      timestamp: new Date().toISOString(),
      backupId: `backup-${Date.now()}`,
      companyName: settings?.companyName || "Deshal Business ERP",
      syncKey: localConfig.syncKey || "default-tenant",
      data: {
        settings,
        theme,
        vouchers,
        customers,
        inventory,
        purchases,
        suppliers,
        stockMovements,
        branches,
        stockTransfers,
        employees,
        schedules,
        posOrders,
        auditLogs
      }
    };
  };

  // 1. Test Supabase Connection
  const handleTestConnection = async () => {
    if (!localConfig.supabaseUrl || !localConfig.supabaseAnonKey) {
      setTestResult({
        success: false,
        message: language === "ar" ? "يرجى كتابة عنوان URL والمفتاح العام لـ Supabase أولاً" : "Please enter Supabase URL and Anon Key"
      });
      return;
    }

    setTestingConnection(true);
    setTestResult(null);

    const res = await testSupabaseConnection(localConfig.supabaseUrl, localConfig.supabaseAnonKey);
    setTestResult(res);
    setTestingConnection(false);
  };

  // 2. Push Backup to Supabase
  const handlePushBackup = async () => {
    if (!localConfig.supabaseUrl || !localConfig.supabaseAnonKey) {
      alert(language === "ar" ? "يرجى تعيين إعدادات Supabase أولاً" : "Configure Supabase credentials first");
      return;
    }

    setIsPushing(true);
    setSyncMessage(null);

    const snapshot = buildCurrentSnapshot();
    const res = await pushBackupToSupabase(
      localConfig.supabaseUrl,
      localConfig.supabaseAnonKey,
      localConfig.tableName,
      localConfig.syncKey,
      snapshot
    );

    setIsPushing(false);

    if (res.success) {
      const updatedConfig = {
        ...localConfig,
        lastSyncedAt: res.timestamp || new Date().toISOString(),
        lastSyncStatus: "SUCCESS" as const,
        lastSyncMessage: res.message
      };
      setLocalConfig(updatedConfig);
      onSaveSettings({
        ...settings,
        supabaseSync: updatedConfig
      });
      setSyncMessage({ type: "success", text: res.message });

      if (onAuditLog) {
        onAuditLog(
          "BACKUP",
          "SETTINGS",
          "supabase-push",
          "Supabase Cloud Backup",
          `رفع نسخة احتياطية سحابية كاملة إلى Supabase (${vouchers.length} سند، ${inventory.length} منتج)`,
          `Pushed cloud backup snapshot to Supabase`
        );
      }
    } else {
      const updatedConfig = {
        ...localConfig,
        lastSyncStatus: "ERROR" as const,
        lastSyncMessage: res.message
      };
      setLocalConfig(updatedConfig);
      setSyncMessage({ type: "error", text: res.message });
    }
  };

  // 3. Pull Backup from Supabase
  const handlePullBackup = async () => {
    if (!localConfig.supabaseUrl || !localConfig.supabaseAnonKey) {
      alert(language === "ar" ? "يرجى تعيين إعدادات Supabase أولاً" : "Configure Supabase credentials first");
      return;
    }

    const confirm = window.confirm(
      language === "ar"
        ? "تنبيه: سيتم استرجاع ومزامنة البيانات من السحابة وتحديث السجلات الحالية على هذا الجهاز. هل ترغب في المتابعة؟"
        : "Warning: This will restore and sync cloud data onto this device. Continue?"
    );
    if (!confirm) return;

    setIsPulling(true);
    setSyncMessage(null);

    const res = await pullBackupFromSupabase(
      localConfig.supabaseUrl,
      localConfig.supabaseAnonKey,
      localConfig.tableName,
      localConfig.syncKey
    );

    setIsPulling(false);

    if (res.success && res.snapshot) {
      onRestoreSnapshot(res.snapshot);
      setSyncMessage({ type: "success", text: res.message });

      const updatedConfig = {
        ...localConfig,
        lastSyncedAt: new Date().toISOString(),
        lastSyncStatus: "SUCCESS" as const,
        lastSyncMessage: res.message
      };
      setLocalConfig(updatedConfig);

      if (onAuditLog) {
        onAuditLog(
          "RESTORE",
          "SETTINGS",
          "supabase-pull",
          "Supabase Cloud Restore",
          `استرجاع وتحديث البيانات من سحابة Supabase بنجاح`,
          `Restored cloud snapshot from Supabase`
        );
      }
    } else {
      setSyncMessage({ type: "error", text: res.message });
    }
  };

  // 4. Export JSON Snapshot File
  const handleExportJsonFile = () => {
    const snapshot = buildCurrentSnapshot();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(snapshot, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `deshal-erp-backup-${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // 5. Import Local JSON File
  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && json.data) {
          const confirm = window.confirm(
            language === "ar"
              ? `تم العثور على نسخة احتياطية صالحة بتاريخ ${json.timestamp || "سابق"}. هل ترغب في استعادتها الآن؟`
              : "Valid backup file detected. Restore now?"
          );
          if (confirm) {
            onRestoreSnapshot(json);
            alert(language === "ar" ? "تمت استعادة النسخة الاحتياطية بنجاح!" : "Backup restored successfully!");
          }
        } else {
          alert(language === "ar" ? "الملف لا يحتوي على صيغة نسخ احتياطي صالحة" : "Invalid backup file structure");
        }
      } catch (err) {
        alert(language === "ar" ? "تعذر قراءة ملف JSON" : "Failed to parse JSON file");
      }
    };
    reader.readAsText(file);
  };

  const sqlSetupScript = generateSupabaseSqlSetup(localConfig.tableName);

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSetupScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Cloud Sync Hero & Status Header */}
      <div className="p-6 bg-linear-to-br from-slate-900 via-slate-900 to-indigo-950/40 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <Cloud className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {language === "ar" ? "النسخ الاحتياطي والمزامنة السحابية (Supabase)" : "Supabase Cloud Backup & Sync"}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Realtime Cloud
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === "ar"
                  ? "ربط بيانات السندات والمخزن والعملاء بحساب Supabase لضمان عدم فقدان البيانات والمزامنة بين أجهزة الموظفين"
                  : "Sync vouchers, inventory & CRM across employee devices with Supabase"}
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localConfig.enabled}
              onChange={(e) => handleConfigChange("enabled", e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            <span className="ms-2 text-xs font-bold text-slate-300">
              {localConfig.enabled ? (language === "ar" ? "مفعل" : "Enabled") : (language === "ar" ? "معطل" : "Disabled")}
            </span>
          </label>
        </div>

        {/* Live Status Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80">
            <p className="text-[11px] text-slate-400">{language === "ar" ? "حالة الربط السحابي" : "Sync Status"}</p>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-xs">
              {localConfig.supabaseUrl ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{language === "ar" ? "تم إعداد الحساب" : "Configured"}</span>
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{language === "ar" ? "بحاجة لإدخال البيانات" : "Not Configured"}</span>
                </span>
              )}
            </div>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80">
            <p className="text-[11px] text-slate-400">{language === "ar" ? "آخر مزامنة سحابية" : "Last Synced"}</p>
            <p className="text-xs font-bold text-white font-mono mt-1">
              {localConfig.lastSyncedAt ? new Date(localConfig.lastSyncedAt).toLocaleString() : (language === "ar" ? "لم تتم بعد" : "Never")}
            </p>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80">
            <p className="text-[11px] text-slate-400">{language === "ar" ? "إجمالي السجلات المحلية" : "Total Local Records"}</p>
            <p className="text-xs font-bold text-indigo-400 font-mono mt-1">
              {vouchers.length} {language === "ar" ? "سندات" : "vouchers"} • {inventory.length} {language === "ar" ? "منتج" : "items"}
            </p>
          </div>
        </div>
      </div>

      {/* Supabase Configuration Form */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-600" />
          <span>{language === "ar" ? "إعدادات الاتصال بمشروع Supabase الخاص بك" : "Supabase Project Credentials"}</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span>{language === "ar" ? "عنوان مشروع Supabase (Project URL):" : "Supabase Project URL:"}</span>
            </label>
            <input
              type="text"
              placeholder="https://xyzabcdefghijklm.supabase.co"
              value={localConfig.supabaseUrl}
              onChange={(e) => handleConfigChange("supabaseUrl", e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-600" />
              <span>{language === "ar" ? "المفتاح العام (anon / public key):" : "Supabase Anon / Public Key:"}</span>
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={localConfig.supabaseAnonKey}
              onChange={(e) => handleConfigChange("supabaseAnonKey", e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              {language === "ar" ? "اسم جدول النسخ الاحتياطي في Supabase:" : "Table Name in Supabase:"}
            </label>
            <input
              type="text"
              placeholder="deshal_erp_backups"
              value={localConfig.tableName}
              onChange={(e) => handleConfigChange("tableName", e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              {language === "ar" ? "معرّف المزامنة (Tenant / Sync Key):" : "Sync Channel / Tenant Key:"}
            </label>
            <input
              type="text"
              placeholder="sohar-main-company"
              value={localConfig.syncKey}
              onChange={(e) => handleConfigChange("syncKey", e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 ${
              testResult.success
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span className="font-medium">{testResult.message}</span>
          </div>
        )}

        {/* Sync Operations Result */}
        {syncMessage && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 ${
              syncMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {syncMessage.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span className="font-bold">{syncMessage.text}</span>
          </div>
        )}

        {/* Cloud Actions Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? "animate-spin" : ""}`} />
            <span>{testingConnection ? (language === "ar" ? "جاري الفحص..." : "Testing...") : (language === "ar" ? "اختبار الاتصال" : "Test Connection")}</span>
          </button>

          <button
            type="button"
            onClick={handlePushBackup}
            disabled={isPushing}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <CloudUpload className={`w-4 h-4 ${isPushing ? "animate-bounce" : ""}`} />
            <span>{isPushing ? (language === "ar" ? "جاري الرفع..." : "Pushing...") : (language === "ar" ? "رفع نسخة سحابية الآن" : "Push Backup to Cloud")}</span>
          </button>

          <button
            type="button"
            onClick={handlePullBackup}
            disabled={isPulling}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <CloudDownload className={`w-4 h-4 ${isPulling ? "animate-bounce" : ""}`} />
            <span>{isPulling ? (language === "ar" ? "جاري الاسترجاع..." : "Pulling...") : (language === "ar" ? "استرجاع ومزامنة من السحابة" : "Pull from Cloud")}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSqlSetup(!showSqlSetup)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ms-auto"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{showSqlSetup ? (language === "ar" ? "إخفاء كود SQL" : "Hide SQL") : (language === "ar" ? "كود إعداد جدول SQL" : "Supabase SQL Setup")}</span>
          </button>
        </div>
      </div>

      {/* SQL Setup Script Drawer */}
      {showSqlSetup && (
        <div className="p-5 bg-slate-950 rounded-3xl border border-slate-800 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <Terminal className="w-4 h-4" />
              <span>{language === "ar" ? "انسخ الكود التالي ونفذه في Supabase SQL Editor لإنشاء الجدول:" : "Run this SQL script in Supabase SQL Editor:"}</span>
            </div>
            <button
              type="button"
              onClick={handleCopySql}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? (language === "ar" ? "تم النسخ!" : "Copied!") : (language === "ar" ? "نسخ الكود" : "Copy SQL")}</span>
            </button>
          </div>

          <pre className="p-4 bg-black/60 rounded-2xl text-[11px] font-mono text-emerald-300 overflow-x-auto border border-slate-800/80 leading-relaxed">
            {sqlSetupScript}
          </pre>
        </div>
      )}

      {/* Offline JSON Snapshots Export / Import */}
      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-3">
        <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-700" />
          <span>{language === "ar" ? "النسخ الاحتياطي المحلي اليدوي (ملف JSON Snapshot)" : "Manual Offline Snapshot (JSON)"}</span>
        </h4>
        <p className="text-xs text-slate-500">
          {language === "ar"
            ? "يمكنك تحميل ملف نسخة احتياطية كاملة لجهازك ونقلها عبر الفلاش ديسك أو استعادتها بدون اتصال بالإنترنت."
            : "Download or import full JSON snapshot backups locally without internet."}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleExportJsonFile}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-indigo-600" />
            <span>{language === "ar" ? "تحميل ملف النسخة الاحتياطية (JSON)" : "Export Backup File (JSON)"}</span>
          </button>

          <label className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer">
            <FileUp className="w-4 h-4 text-emerald-600" />
            <span>{language === "ar" ? "استيراد ملف نسخة احتياطية" : "Import Backup File"}</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJsonFile}
              className="hidden"
            />
          </label>
        </div>
      </div>

    </div>
  );
};
