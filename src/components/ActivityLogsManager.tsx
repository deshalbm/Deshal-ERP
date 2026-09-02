import React, { useState, useMemo } from "react";
import {
  Shield,
  Search,
  Download,
  Trash2,
  Filter,
  Calendar,
  Clock,
  User,
  Building2,
  FileText,
  Boxes,
  ShoppingBag,
  Sliders,
  Users,
  Eye,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Printer,
  Share2,
  ArrowRightLeft,
  ChevronDown
} from "lucide-react";
import { AuditLogEntry, AuditAction, AuditModule } from "../types";
import { useLanguage } from "../utils/LanguageContext";
import { exportAuditLogsToCsv } from "../utils/auditLogger";

interface ActivityLogsManagerProps {
  logs: AuditLogEntry[];
  onClearLogs: () => void;
  onRefresh?: () => void;
}

export const ActivityLogsManager: React.FC<ActivityLogsManagerProps> = ({
  logs,
  onClearLogs,
  onRefresh
}) => {
  const { t, language, isRTL } = useLanguage();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("ALL");
  const [selectedAction, setSelectedAction] = useState<string>("ALL");
  const [timeFilter, setTimeFilter] = useState<"ALL" | "TODAY" | "7DAYS" | "30DAYS">("ALL");
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Filter logs based on criteria
  const filteredLogs = useMemo(() => {
    const now = new Date().getTime();

    return logs.filter((log) => {
      // Time filter
      if (timeFilter !== "ALL") {
        const logTime = new Date(log.timestamp).getTime();
        const diffHours = (now - logTime) / (1000 * 60 * 60);
        if (timeFilter === "TODAY" && diffHours > 24) return false;
        if (timeFilter === "7DAYS" && diffHours > 24 * 7) return false;
        if (timeFilter === "30DAYS" && diffHours > 24 * 30) return false;
      }

      // Module filter
      if (selectedModule !== "ALL" && log.module !== selectedModule) {
        return false;
      }

      // Action filter
      if (selectedAction !== "ALL" && log.action !== selectedAction) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchAr = log.descriptionAr?.toLowerCase().includes(query);
        const matchEn = log.descriptionEn?.toLowerCase().includes(query);
        const matchEntity = log.entityName?.toLowerCase().includes(query);
        const matchUser = log.performedByName?.toLowerCase().includes(query);
        const matchRole = log.performedByRole?.toLowerCase().includes(query);
        const matchBranch = log.branchName?.toLowerCase().includes(query);
        const matchDetails = log.details?.toLowerCase().includes(query);

        return (
          matchAr ||
          matchEn ||
          matchEntity ||
          matchUser ||
          matchRole ||
          matchBranch ||
          matchDetails
        );
      }

      return true;
    });
  }, [logs, searchQuery, selectedModule, selectedAction, timeFilter]);

  // Fast metrics calculation
  const metrics = useMemo(() => {
    const total = logs.length;
    const operatorCounts: Record<string, number> = {};
    const moduleCounts: Record<string, number> = {};
    let criticalCount = 0;

    logs.forEach((log) => {
      operatorCounts[log.performedByName] = (operatorCounts[log.performedByName] || 0) + 1;
      moduleCounts[log.module] = (moduleCounts[log.module] || 0) + 1;
      if (log.action === "DELETE" || log.action === "BATCH_DELETE" || log.action === "SETTINGS_UPDATE") {
        criticalCount++;
      }
    });

    let topOperator = "-";
    let maxOpCount = 0;
    Object.entries(operatorCounts).forEach(([name, count]) => {
      if (count > maxOpCount) {
        maxOpCount = count;
        topOperator = name;
      }
    });

    let topModule = "-";
    let maxModCount = 0;
    Object.entries(moduleCounts).forEach(([mod, count]) => {
      if (count > maxModCount) {
        maxModCount = count;
        topModule = mod;
      }
    });

    return { total, topOperator, topModule, criticalCount };
  }, [logs]);

  // Action badge renderer
  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case "CREATE":
        return {
          label: t("actionCreate"),
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: <CheckCircle2 className="w-3.5 h-3.5" />
        };
      case "UPDATE":
        return {
          label: t("actionUpdate"),
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          icon: <RefreshCw className="w-3.5 h-3.5" />
        };
      case "DELETE":
      case "BATCH_DELETE":
        return {
          label: action === "BATCH_DELETE" ? t("actionBatchDelete") : t("actionDelete"),
          bg: "bg-rose-50 text-rose-700 border-rose-200",
          icon: <Trash2 className="w-3.5 h-3.5" />
        };
      case "PRINT":
        return {
          label: t("actionPrint"),
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          icon: <Printer className="w-3.5 h-3.5" />
        };
      case "EXPORT":
        return {
          label: t("actionExport"),
          bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
          icon: <Share2 className="w-3.5 h-3.5" />
        };
      case "TRANSFER":
        return {
          label: t("actionTransfer"),
          bg: "bg-purple-50 text-purple-700 border-purple-200",
          icon: <ArrowRightLeft className="w-3.5 h-3.5" />
        };
      case "SETTINGS_UPDATE":
        return {
          label: t("actionSettingsUpdate"),
          bg: "bg-slate-100 text-slate-700 border-slate-300",
          icon: <Sliders className="w-3.5 h-3.5" />
        };
      default:
        return {
          label: action,
          bg: "bg-gray-50 text-gray-700 border-gray-200",
          icon: <Shield className="w-3.5 h-3.5" />
        };
    }
  };

  // Module label and icon
  const getModuleInfo = (mod: AuditModule) => {
    switch (mod) {
      case "VOUCHERS":
        return { label: t("moduleVouchers"), icon: <FileText className="w-3.5 h-3.5" /> };
      case "CRM":
        return { label: t("moduleCrm"), icon: <Users className="w-3.5 h-3.5" /> };
      case "INVENTORY":
        return { label: t("moduleInventory"), icon: <Boxes className="w-3.5 h-3.5" /> };
      case "PURCHASES":
        return { label: t("modulePurchases"), icon: <ShoppingBag className="w-3.5 h-3.5" /> };
      case "BRANCHES":
        return { label: t("moduleBranches"), icon: <Building2 className="w-3.5 h-3.5" /> };
      case "EMPLOYEES":
        return { label: t("moduleEmployees"), icon: <User className="w-3.5 h-3.5" /> };
      case "SETTINGS":
        return { label: t("moduleSettings"), icon: <Sliders className="w-3.5 h-3.5" /> };
      default:
        return { label: t("moduleSystem"), icon: <Shield className="w-3.5 h-3.5" /> };
    }
  };

  const formatLogDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString(language === "ar" ? "ar-OM" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div id="activity-logs-container" className="space-y-6">
      {/* Title & Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
              <Shield className="w-3.5 h-3.5" />
              <span>{t("tabAuditLogs")}</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">{t("auditLogTitle")}</h2>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              {t("auditLogSubtitle")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="export-audit-csv-btn"
              onClick={() => exportAuditLogsToCsv(logs)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition shadow-sm active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>{t("exportLogsCsv")}</span>
            </button>

            <button
              id="clear-audit-logs-btn"
              onClick={() => setShowClearConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 text-sm font-medium transition border border-slate-700"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t("clearLogs")}</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-xs text-slate-400 font-medium">{t("totalLoggedOperations")}</p>
            <p className="text-2xl font-bold text-white mt-1">{metrics.total}</p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-xs text-slate-400 font-medium">{t("topOperator")}</p>
            <p className="text-base font-semibold text-indigo-300 mt-1 truncate">{metrics.topOperator}</p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-xs text-slate-400 font-medium">{t("mostActiveModule")}</p>
            <p className="text-base font-semibold text-emerald-400 mt-1">
              {metrics.topModule !== "-" ? getModuleInfo(metrics.topModule as AuditModule).label : "-"}
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-xs text-slate-400 font-medium">{t("criticalEvents")}</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{metrics.criticalCount}</p>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className={`w-4 h-4 absolute top-3.5 text-slate-400 ${isRTL ? "right-3.5" : "left-3.5"}`} />
            <input
              id="search-audit-logs-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchLogsPlaceholder")}
              className={`w-full py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition ${
                isRTL ? "pr-10 pl-3" : "pl-10 pr-3"
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className={`absolute top-3 text-slate-400 hover:text-slate-600 ${isRTL ? "left-3" : "right-3"}`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Module Filter */}
          <div className="relative">
            <select
              id="filter-audit-module"
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full py-2.5 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none font-medium text-slate-700"
            >
              <option value="ALL">{t("filterModule")}: {t("filterAll")}</option>
              <option value="VOUCHERS">{t("moduleVouchers")}</option>
              <option value="CRM">{t("moduleCrm")}</option>
              <option value="INVENTORY">{t("moduleInventory")}</option>
              <option value="PURCHASES">{t("modulePurchases")}</option>
              <option value="BRANCHES">{t("moduleBranches")}</option>
              <option value="EMPLOYEES">{t("moduleEmployees")}</option>
              <option value="SETTINGS">{t("moduleSettings")}</option>
            </select>
            <ChevronDown className={`w-4 h-4 absolute top-3.5 text-slate-400 pointer-events-none ${isRTL ? "left-3" : "right-3"}`} />
          </div>

          {/* Action Filter */}
          <div className="relative">
            <select
              id="filter-audit-action"
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full py-2.5 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none font-medium text-slate-700"
            >
              <option value="ALL">{t("filterAction")}: {t("filterAll")}</option>
              <option value="CREATE">{t("actionCreate")}</option>
              <option value="UPDATE">{t("actionUpdate")}</option>
              <option value="DELETE">{t("actionDelete")}</option>
              <option value="BATCH_DELETE">{t("actionBatchDelete")}</option>
              <option value="PRINT">{t("actionPrint")}</option>
              <option value="EXPORT">{t("actionExport")}</option>
              <option value="TRANSFER">{t("actionTransfer")}</option>
              <option value="SETTINGS_UPDATE">{t("actionSettingsUpdate")}</option>
              <option value="DUPLICATE">{t("actionDuplicate")}</option>
            </select>
            <ChevronDown className={`w-4 h-4 absolute top-3.5 text-slate-400 pointer-events-none ${isRTL ? "left-3" : "right-3"}`} />
          </div>

          {/* Time Filter */}
          <div className="relative">
            <select
              id="filter-audit-time"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="w-full py-2.5 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none font-medium text-slate-700"
            >
              <option value="ALL">{t("filterTime")}: {t("allTime")}</option>
              <option value="TODAY">{t("today")}</option>
              <option value="7DAYS">{t("last7Days")}</option>
              <option value="30DAYS">{t("last30Days")}</option>
            </select>
            <ChevronDown className={`w-4 h-4 absolute top-3.5 text-slate-400 pointer-events-none ${isRTL ? "left-3" : "right-3"}`} />
          </div>
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-semibold text-slate-800">
              {t("totalRecordsLogged")}: {filteredLogs.length}
            </span>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700">{t("noAuditLogs")}</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              {t("searchPlaceholder")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 text-start">{t("timestamp")}</th>
                  <th className="py-3.5 px-4 text-start">{t("filterAction")}</th>
                  <th className="py-3.5 px-4 text-start">{t("filterModule")}</th>
                  <th className="py-3.5 px-4 text-start">{t("details")}</th>
                  <th className="py-3.5 px-4 text-start">{t("performedBy")}</th>
                  <th className="py-3.5 px-4 text-center">{t("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const actionBadge = getActionBadge(log.action);
                  const moduleInfo = getModuleInfo(log.module);

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                        {formatLogDate(log.timestamp)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${actionBadge.bg}`}
                        >
                          {actionBadge.icon}
                          <span>{actionBadge.label}</span>
                        </span>
                      </td>

                      {/* Module */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                          {moduleInfo.icon}
                          <span>{moduleInfo.label}</span>
                        </span>
                      </td>

                      {/* Description & Entity */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {log.entityName && (
                              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                                {log.entityName}
                              </span>
                            )}
                            <p className="text-slate-800 text-xs sm:text-sm font-medium">
                              {language === "ar" ? log.descriptionAr : log.descriptionEn}
                            </p>
                          </div>
                          {log.details && (
                            <p className="text-slate-500 text-xs truncate max-w-lg">
                              {log.details}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Performed By & Branch */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div>
                          <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>{log.performedByName}</span>
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            {log.performedByRole && <span>{log.performedByRole}</span>}
                            {log.branchName && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-slate-400">
                                  <Building2 className="w-2.5 h-2.5" />
                                  <span>{log.branchName}</span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* View Details Button */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          title={t("details")}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{t("logDetailModalTitle")}</h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Action and Module Header */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${getActionBadge(selectedLog.action).bg}`}>
                  {getActionBadge(selectedLog.action).icon}
                  <span>{getActionBadge(selectedLog.action).label}</span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                  {getModuleInfo(selectedLog.module).icon}
                  <span>{getModuleInfo(selectedLog.module).label}</span>
                </span>

                {selectedLog.entityName && (
                  <span className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
                    {selectedLog.entityName}
                  </span>
                )}
              </div>

              {/* Descriptions */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 border border-slate-200/80">
                <p className="text-xs text-slate-500 font-semibold">{t("arabic")}:</p>
                <p className="text-sm font-medium text-slate-800" dir="rtl">
                  {selectedLog.descriptionAr}
                </p>
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-xs text-slate-500 font-semibold">{t("english")}:</p>
                  <p className="text-sm font-medium text-slate-800" dir="ltr">
                    {selectedLog.descriptionEn}
                  </p>
                </div>
              </div>

              {/* Detailed Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block mb-1">{t("timestamp")}</span>
                  <span className="font-mono font-medium text-slate-700">
                    {formatLogDate(selectedLog.timestamp)}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block mb-1">{t("performedBy")}</span>
                  <span className="font-semibold text-slate-800">{selectedLog.performedByName}</span>
                  {selectedLog.performedByRole && (
                    <span className="block text-slate-500 mt-0.5">{selectedLog.performedByRole}</span>
                  )}
                </div>

                {selectedLog.branchName && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block mb-1">{t("moduleBranches")}</span>
                    <span className="font-medium text-slate-800">{selectedLog.branchName}</span>
                  </div>
                )}

                {selectedLog.entityId && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block mb-1">Entity ID</span>
                    <span className="font-mono text-slate-700">{selectedLog.entityId}</span>
                  </div>
                )}
              </div>

              {selectedLog.details && (
                <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <span className="text-xs font-semibold text-indigo-900 block mb-1">
                    {t("logDetails")}
                  </span>
                  <p className="text-xs text-indigo-950 whitespace-pre-wrap">
                    {selectedLog.details}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition"
              >
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Logs Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="p-3 rounded-full bg-rose-50">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{t("clearLogs")}</h3>
            </div>

            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              {t("clearLogsConfirm")}
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition"
              >
                {t("cancel")}
              </button>
              <button
                onClick={() => {
                  onClearLogs();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium transition shadow-sm"
              >
                {t("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
