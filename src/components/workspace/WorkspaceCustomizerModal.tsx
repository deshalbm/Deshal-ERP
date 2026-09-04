import React, { useState, useEffect } from "react";
import {
  WorkspaceConfig,
  QuickLauncherId,
  QuickActionId,
  ReportWidgetId
} from "../../types";
import {
  ALL_QUICK_LAUNCHERS,
  ALL_QUICK_ACTIONS,
  ALL_REPORT_WIDGETS,
  QuickLauncherMetadata,
  QuickActionMetadata,
  ReportWidgetMetadata
} from "../../utils/workspaceStorage";
import {
  X,
  SlidersHorizontal,
  LayoutGrid,
  PlusCircle,
  TrendingUp,
  RotateCcw,
  Save,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Info,
  Database
} from "lucide-react";

interface WorkspaceCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: WorkspaceConfig;
  onSave: (newConfig: WorkspaceConfig) => Promise<void>;
  onReset: () => Promise<void>;
  isRTL: boolean;
}

export const WorkspaceCustomizerModal: React.FC<WorkspaceCustomizerModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  onReset,
  isRTL
}) => {
  const [activeTab, setActiveTab] = useState<"launchers" | "actions" | "reports">("launchers");
  const [selectedLaunchers, setSelectedLaunchers] = useState<QuickLauncherId[]>(config.quickLaunchers || []);
  const [selectedActions, setSelectedActions] = useState<QuickActionId[]>(config.quickActions || []);
  const [selectedReports, setSelectedReports] = useState<ReportWidgetId[]>(config.reportWidgets || []);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Sync internal state when modal opens or config changes
  useEffect(() => {
    if (isOpen) {
      setSelectedLaunchers(config.quickLaunchers || []);
      setSelectedActions(config.quickActions || []);
      setSelectedReports(config.reportWidgets || []);
      setFeedbackMsg(null);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  // Toggle Handlers
  const toggleLauncher = (id: QuickLauncherId) => {
    setSelectedLaunchers((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleAction = (id: QuickActionId) => {
    setSelectedActions((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleReport = (id: ReportWidgetId) => {
    setSelectedReports((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Reordering Handlers
  const moveItem = <T,>(list: T[], index: number, direction: "up" | "down"): T[] => {
    const updated = [...list];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= updated.length) return updated;
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    return updated;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setFeedbackMsg(null);
    try {
      const updatedConfig: WorkspaceConfig = {
        ...config,
        quickLaunchers: selectedLaunchers,
        quickActions: selectedActions,
        reportWidgets: selectedReports,
        updatedAt: new Date().toISOString()
      };
      await onSave(updatedConfig);
      setFeedbackMsg(isRTL ? "تم حفظ التفضيلات بنجاح في قاعدة البيانات!" : "Workspace preferences saved to DB!");
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (e: any) {
      setFeedbackMsg(isRTL ? "حدث خطأ أثناء الحفظ" : "Error saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm(isRTL ? "هل ترغب في إعادة جميع الاختصارات والتقارير إلى الوضع الافتراضي؟" : "Reset workspace layout to factory defaults?")) {
      setIsResetting(true);
      try {
        await onReset();
        setFeedbackMsg(isRTL ? "تمت استعادة الوضع الافتراضي بنجاح" : "Reset to default complete");
        setTimeout(() => {
          onClose();
        }, 800);
      } catch (e) {
        console.error("Reset error:", e);
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/30 rounded-2xl border border-indigo-400/30 text-indigo-300">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  {isRTL ? "تخصيص مساحة العمل" : "Workspace Customization"}
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Database className="w-3 h-3" />
                  <span>{isRTL ? "مزامنة قاعدة البيانات" : "DB Synced"}</span>
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                {isRTL
                  ? "اختر الأزرار والوحدات والتقارير التي ترغب في ظهورها على صفحة مساحة العمل الخاصة بك."
                  : "Customize quick access buttons, document actions, and analytics reports for your account."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-indigo-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab("launchers")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
              activeTab === "launchers"
                ? "bg-white text-indigo-600 border-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>{isRTL ? "أزرار التنقل والأنظمة الفرعية" : "Quick Launchers"}</span>
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-indigo-50 text-indigo-700 font-extrabold">
              {selectedLaunchers.length} / {ALL_QUICK_LAUNCHERS.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("actions")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
              activeTab === "actions"
                ? "bg-white text-indigo-600 border-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isRTL ? "إجراءات إنشاء السندات" : "Creation Actions"}</span>
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-indigo-50 text-indigo-700 font-extrabold">
              {selectedActions.length} / {ALL_QUICK_ACTIONS.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
              activeTab === "reports"
                ? "bg-white text-indigo-600 border-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>{isRTL ? "قسم التقارير والمؤشرات" : "Reports & KPIs"}</span>
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-indigo-50 text-indigo-700 font-extrabold">
              {selectedReports.length} / {ALL_REPORT_WIDGETS.length}
            </span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: QUICK LAUNCHERS */}
          {activeTab === "launchers" && (
            <div className="space-y-4">
              <div className="bg-indigo-50/70 border border-indigo-100 p-3.5 rounded-2xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-900 font-medium leading-relaxed">
                  {isRTL
                    ? "حدد اختصارات الوحدات والأنظمة التي تظهر في شريط الوصول السريع بالرئيسية. يمكنك تفعيل الخيارات أو إعادة ترتيبها."
                    : "Select navigation launcher cards to display on your workspace home. Toggle checkboxes or order them as needed."}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {ALL_QUICK_LAUNCHERS.map((launcher: QuickLauncherMetadata) => {
                  const isSelected = selectedLaunchers.includes(launcher.id);
                  const selectedIndex = selectedLaunchers.indexOf(launcher.id);

                  return (
                    <div
                      key={launcher.id}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-white border-indigo-400 shadow-sm ring-1 ring-indigo-400/30"
                          : "bg-slate-50 border-slate-200 opacity-60 hover:opacity-80"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleLauncher(launcher.id)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {isRTL ? launcher.labelAr : launcher.labelEn}
                            </span>
                            {launcher.badgeAr && (
                              <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {isRTL ? launcher.badgeAr : launcher.badgeEn}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                            {isRTL ? launcher.descAr : launcher.descEn}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={selectedIndex === 0}
                            onClick={() => setSelectedLaunchers(moveItem(selectedLaunchers, selectedIndex, "up"))}
                            className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30 rounded hover:bg-slate-100 transition-colors"
                            title={isRTL ? "تقديم" : "Move Up"}
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={selectedIndex === selectedLaunchers.length - 1}
                            onClick={() => setSelectedLaunchers(moveItem(selectedLaunchers, selectedIndex, "down"))}
                            className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30 rounded hover:bg-slate-100 transition-colors"
                            title={isRTL ? "تأخير" : "Move Down"}
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CREATION ACTIONS */}
          {activeTab === "actions" && (
            <div className="space-y-4">
              <div className="bg-blue-50/70 border border-blue-100 p-3.5 rounded-2xl flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 font-medium leading-relaxed">
                  {isRTL
                    ? "اختر السندات والإجراءات السريعة المتاحة للإنشاء الفوري من الصفحة الرئيسية."
                    : "Select which quick document creation buttons to feature on your home page."}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {ALL_QUICK_ACTIONS.map((action: QuickActionMetadata) => {
                  const isSelected = selectedActions.includes(action.id);
                  const selectedIndex = selectedActions.indexOf(action.id);

                  return (
                    <div
                      key={action.id}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-white border-blue-400 shadow-sm ring-1 ring-blue-400/30"
                          : "bg-slate-50 border-slate-200 opacity-60 hover:opacity-80"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleAction(action.id)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {isRTL ? action.labelAr : action.labelEn}
                            </span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.2 rounded-md border ${action.textClass}`}>
                              {isRTL ? action.badgeAr : action.badgeEn}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                            {isRTL ? action.descAr : action.descEn}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={selectedIndex === 0}
                            onClick={() => setSelectedActions(moveItem(selectedActions, selectedIndex, "up"))}
                            className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 rounded hover:bg-slate-100 transition-colors"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={selectedIndex === selectedActions.length - 1}
                            onClick={() => setSelectedActions(moveItem(selectedActions, selectedIndex, "down"))}
                            className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 rounded hover:bg-slate-100 transition-colors"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: REPORTS & KPIS */}
          {activeTab === "reports" && (
            <div className="space-y-4">
              <div className="bg-emerald-50/70 border border-emerald-100 p-3.5 rounded-2xl flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 font-medium leading-relaxed">
                  {isRTL
                    ? "خصص قسم التقارير والمؤشرات التحليلية ومركز التنبيهات وجداول العمليات الحية بحسب ما يهمك."
                    : "Customize report widgets, financial metrics, charts, and live client lists displayed on your dashboard."}
                </div>
              </div>

              <div className="space-y-2.5">
                {ALL_REPORT_WIDGETS.map((widget: ReportWidgetMetadata) => {
                  const isSelected = selectedReports.includes(widget.id);

                  return (
                    <div
                      key={widget.id}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-white border-emerald-400 shadow-sm ring-1 ring-emerald-400/30"
                          : "bg-slate-50 border-slate-200 opacity-60 hover:opacity-80"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleReport(widget.id)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {isRTL ? widget.labelAr : widget.labelEn}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              {isRTL ? widget.categoryAr : widget.categoryEn}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                            {isRTL ? widget.descAr : widget.descEn}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <span
                          onClick={() => toggleReport(widget.id)}
                          className={`px-3 py-1 text-xs font-bold rounded-xl cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {isSelected ? (isRTL ? "مُفعّل" : "Enabled") : (isRTL ? "مخفي" : "Hidden")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Feedback Message Banner */}
        {feedbackMsg && (
          <div className="px-6 py-2 bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting || isSaving}
            className="w-full sm:w-auto px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isRTL ? "إعادة للوضع الافتراضي" : "Reset to Defaults"}</span>
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              {isRTL ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isResetting}
              className="w-full sm:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isRTL ? "جاري الحفظ..." : "Saving..."}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isRTL ? "حفظ التفضيلات وقاعدة البيانات" : "Save to Database"}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
