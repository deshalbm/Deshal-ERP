import React, { useState } from "react";
import { CompanySettings, DesignTheme, PageSizeFormat, TemplateStyle, Employee, Branch, AuditLogEntry } from "../types";
import { useLanguage } from "../utils/LanguageContext";
import {
  Building2,
  Palette,
  Upload,
  Check,
  RotateCcw,
  Save,
  Users,
  Settings,
  FileCheck2,
  Landmark,
  Shield,
  Coins,
  RefreshCw,
  Printer,
  PenTool,
  CheckCircle2,
  MessageSquare,
  Radio
} from "lucide-react";
import { EmployeesManager } from "./EmployeesManager";
import { ActivityLogsManager } from "./ActivityLogsManager";
import { DigitalSignaturePad } from "./DigitalSignaturePad";
import { WhatsAppBaileysStudio } from "./WhatsAppBaileysStudio";
import { AVAILABLE_CURRENCIES, fetchLiveExchangeRates } from "../utils/currencyConverter";
import { DEFAULT_COMPANY_SETTINGS } from "../utils/storage";

interface SettingsStudioProps {
  settings?: CompanySettings;
  theme: DesignTheme;
  employees?: Employee[];
  branches?: Branch[];
  activeEmployeeId?: string;
  auditLogs?: AuditLogEntry[];
  onSaveSettings: (settings: CompanySettings) => void;
  onSaveTheme: (theme: DesignTheme) => void;
  onSaveEmployees?: (employees: Employee[]) => void;
  onSelectActiveEmployee?: (id: string) => void;
  onClearAuditLogs?: () => void;
  onOpenSecuritySettings?: () => void;
  onResetDefaults: () => void;
}

const PRESET_LOGOS = [
  { name: "Apex Prism", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80" },
  { name: "Global Finance", url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=200&auto=format&fit=crop&q=80" },
  { name: "Horizon Emblem", url: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&auto=format&fit=crop&q=80" },
  { name: "Corporate Crest", url: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&auto=format&fit=crop&q=80" }
];

const PRESET_PALETTES = [
  { name: "Sleek Indigo (الافتراضي)", primary: "#4f46e5", secondary: "#6366f1", accent: "#10b981" },
  { name: "Executive Slate (رمادي فاحم)", primary: "#0f172a", secondary: "#2563eb", accent: "#d97706" },
  { name: "Emerald Wealth (أخضر زمردي)", primary: "#064e3b", secondary: "#059669", accent: "#f59e0b" },
  { name: "Navy Royal (أزرق ملكي)", primary: "#1e3a8a", secondary: "#3b82f6", accent: "#f43f5e" },
  { name: "Charcoal Minimal (فحمي)", primary: "#18181b", secondary: "#52525b", accent: "#6366f1" },
  { name: "Crimson Elite (عنابي)", primary: "#881337", secondary: "#e11d48", accent: "#eab308" }
];

export const SettingsStudio: React.FC<SettingsStudioProps> = ({
  settings = DEFAULT_COMPANY_SETTINGS,
  theme,
  employees = [],
  branches = [],
  activeEmployeeId = "emp-1",
  auditLogs = [],
  onSaveSettings,
  onSaveTheme,
  onSaveEmployees,
  onSelectActiveEmployee,
  onClearAuditLogs,
  onOpenSecuritySettings,
  onResetDefaults
}) => {
  const { t, dir, isRTL, language } = useLanguage();
  const [localSettings, setLocalSettings] = useState<CompanySettings>(() => ({
    ...DEFAULT_COMPANY_SETTINGS,
    ...(settings || {})
  }));
  const [localTheme, setLocalTheme] = useState<DesignTheme>(theme);
  const [activeTab, setActiveTab] = useState<"company" | "currency" | "brand" | "theme" | "notices" | "bank" | "whatsapp" | "employees" | "logs">("company");
  const [showSavedNotification, setShowSavedNotification] = useState<boolean>(false);
  const [isUpdatingRates, setIsUpdatingRates] = useState<boolean>(false);
  const [ratesSuccessMessage, setRatesSuccessMessage] = useState<string>("");

  const handleSettingsChange = (field: keyof CompanySettings, val: any) => {
    setLocalSettings({ ...localSettings, [field]: val });
  };

  const handleBankChange = (field: keyof CompanySettings["bankDetails"], val: string) => {
    setLocalSettings({
      ...localSettings,
      bankDetails: { ...localSettings.bankDetails, [field]: val }
    });
  };

  const handleThemeChange = (field: keyof DesignTheme, val: any) => {
    setLocalTheme({ ...localTheme, [field]: val });
  };

  const handleFetchLiveRates = async () => {
    setIsUpdatingRates(true);
    try {
      const live = await fetchLiveExchangeRates();
      setLocalSettings(prev => ({
        ...prev,
        customExchangeRates: {
          ...(prev.customExchangeRates || {}),
          ...live
        }
      }));
      setRatesSuccessMessage(language === "ar" ? "تم تحديث أسعار الصرف بنجاح!" : "Exchange rates updated successfully!");
      setTimeout(() => setRatesSuccessMessage(""), 4000);
    } catch {
      setRatesSuccessMessage(language === "ar" ? "تعذر التحديث المباشر، تم اعتماد أحدث الأسعار المسجلة." : "Using latest cached rates.");
      setTimeout(() => setRatesSuccessMessage(""), 4000);
    } finally {
      setIsUpdatingRates(false);
    }
  };

  const handleSaveAll = () => {
    onSaveSettings(localSettings);
    onSaveTheme(localTheme);
    setShowSavedNotification(true);
    setTimeout(() => setShowSavedNotification(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, targetField: "logoUrl" | "signatureImageUrl" | "stampImageUrl") => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleSettingsChange(targetField, event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20" dir={dir}>
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Settings className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 font-sans">
              {t("settingsStudioTitle")}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t("settingsStudioSubtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenSecuritySettings && (
            <button
              onClick={onOpenSecuritySettings}
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition-all cursor-pointer"
            >
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>{t("securitySettings")}</span>
            </button>
          )}

          <button
            onClick={onResetDefaults}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t("resetDefaults")}</span>
          </button>

          <button
            onClick={handleSaveAll}
            type="button"
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{t("saveSettings")}</span>
          </button>
        </div>
      </div>

      {showSavedNotification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{t("settingsSavedSuccess")}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs Bar (Clean, Responsive, Overflow-Protected) */}
      <div className="overflow-x-auto custom-scrollbar pb-1">
        <div className="flex bg-slate-200/90 p-1.5 rounded-2xl border border-slate-300 text-xs font-semibold gap-1 min-w-max">
          <button
            onClick={() => setActiveTab("company")}
            className={`py-2.5 px-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "company"
                ? "bg-white text-indigo-700 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{t("tabCompany")}</span>
          </button>

          <button
            onClick={() => setActiveTab("currency")}
            className={`py-2.5 px-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "currency"
                ? "bg-white text-indigo-700 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>{language === "ar" ? "العملات والصرف" : "Currencies & FX"}</span>
          </button>

          <button
            onClick={() => setActiveTab("brand")}
            className={`py-2.5 px-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "brand"
                ? "bg-white text-indigo-700 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-purple-500" />
            <span>{t("tabBrand")}</span>
          </button>

          <button
            onClick={() => setActiveTab("theme")}
            className={`py-2.5 px-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "theme"
                ? "bg-white text-indigo-700 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <Printer className="w-3.5 h-3.5 text-teal-600" />
            <span>{t("tabTheme")}</span>
          </button>

          <button
            onClick={() => setActiveTab("notices")}
            className={`py-2.5 px-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "notices"
                ? "bg-white text-indigo-700 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
            <span>{t("tabNotices")}</span>
          </button>

          <button
            onClick={() => setActiveTab("bank")}
            className={`py-2.5 px-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "bank"
                ? "bg-white text-indigo-700 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <Landmark className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t("tabBank")}</span>
          </button>

          <button
            id="tab-whatsapp-api-btn"
            onClick={() => setActiveTab("whatsapp")}
            className={`py-2.5 px-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "whatsapp"
                ? "bg-emerald-600 text-white shadow-sm font-bold"
                : "text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50/70"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{language === "ar" ? "واتساب Baileys API" : "WhatsApp API"}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </button>

          <button
            onClick={() => setActiveTab("employees")}
            className={`py-2.5 px-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "employees"
                ? "bg-indigo-600 text-white shadow-sm font-bold"
                : "text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50/50"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t("tabEmployees")} ({employees.length})</span>
          </button>

          <button
            id="tab-activity-logs-btn"
            onClick={() => setActiveTab("logs")}
            className={`py-2.5 px-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "logs"
                ? "bg-slate-900 text-white shadow-sm font-bold"
                : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t("tabAuditLogs")}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 font-mono">
              {auditLogs.length}
            </span>
          </button>
        </div>
      </div>

      {/* Tab 1: Company Profile Details */}
      {activeTab === "company" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>{t("companyProfileTitle")}</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("companyLegalName")}
              </label>
              <input
                type="text"
                value={localSettings.companyName}
                onChange={(e) => handleSettingsChange("companyName", e.target.value)}
                placeholder="Apex Global Enterprises LLC"
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("businessTagline")}
              </label>
              <input
                type="text"
                value={localSettings.tagline}
                onChange={(e) => handleSettingsChange("tagline", e.target.value)}
                placeholder="Financial Solutions & Global Logistics"
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("taxIdNumber")}
              </label>
              <input
                type="text"
                value={localSettings.taxId}
                onChange={(e) => handleSettingsChange("taxId", e.target.value)}
                placeholder="TAX-998822441-VAT"
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("crNumber")}
              </label>
              <input
                type="text"
                value={localSettings.crNumber}
                onChange={(e) => handleSettingsChange("crNumber", e.target.value)}
                placeholder="CR-1010892341"
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("streetAddress")}
              </label>
              <input
                type="text"
                value={localSettings.address}
                onChange={(e) => handleSettingsChange("address", e.target.value)}
                placeholder="700 Financial Boulevard, Suite 2400"
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("cityStateZip")}
              </label>
              <input
                type="text"
                value={localSettings.cityStateZip}
                onChange={(e) => handleSettingsChange("cityStateZip", e.target.value)}
                placeholder="Muscat / Dubai / Riyadh"
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("country")}
              </label>
              <input
                type="text"
                value={localSettings.country}
                onChange={(e) => handleSettingsChange("country", e.target.value)}
                placeholder="Oman / UAE / Saudi Arabia"
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("primaryPhone")}
              </label>
              <input
                type="text"
                value={localSettings.phone}
                onChange={(e) => handleSettingsChange("phone", e.target.value)}
                placeholder="+968 9123 4567"
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("billingEmail")}
              </label>
              <input
                type="email"
                value={localSettings.email}
                onChange={(e) => handleSettingsChange("email", e.target.value)}
                placeholder="billing@company.com"
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("websiteUrl")}
              </label>
              <input
                type="text"
                value={localSettings.website}
                onChange={(e) => handleSettingsChange("website", e.target.value)}
                placeholder="www.company.com"
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab: Multi-Currency & Live Exchange Rates */}
      {activeTab === "currency" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {language === "ar" ? "إعدادات العملات وأسعار الصرف اللحظية" : "Currencies & Live Exchange Rates"}
                </h2>
                <p className="text-xs text-slate-500">
                  {language === "ar" ? "تحديد العملة الأساسية وإدارة العملات الإضافية وتحديث أسعار الصرف فورياً" : "Set base currency, additional supported currencies, and real-time exchange rates"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFetchLiveRates}
              disabled={isUpdatingRates}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingRates ? "animate-spin" : ""}`} />
              <span>{isUpdatingRates ? (language === "ar" ? "جارٍ التحديث..." : "Updating...") : (language === "ar" ? "تحديث أسعار الصرف الآن" : "Fetch Live Rates")}</span>
            </button>
          </div>

          {ratesSuccessMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{ratesSuccessMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Base Currency & Automation Toggles */}
            <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                {language === "ar" ? "العملة الأساسية والتحويل التلقائي" : "Base Currency & Automation"}
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t("defaultCurrency")}
                </label>
                <select
                  value={localSettings.defaultCurrency || "OMR"}
                  onChange={(e) => handleSettingsChange("defaultCurrency", e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-black rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  {AVAILABLE_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} - {c.nameAr} ({c.nameEn})
                    </option>
                  ))}
                </select>
              </div>

              {/* Automation Toggles */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={localSettings.autoConvertCurrency ?? true}
                    onChange={(e) => handleSettingsChange("autoConvertCurrency", e.target.checked)}
                    className="mt-0.5 rounded accent-indigo-600 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      {language === "ar" ? "تفعيل التحويل التلقائي للعملات في السندات" : "Auto-convert currency totals in Doc Wizard"}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {language === "ar" ? "إعادة احتساب مبالغ السندات وعروض الأسعار تلقائياً عند تغيير العملة" : "Automatically adjust item amounts when changing currencies"}
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={localSettings.showEquivalentInBaseCurrency ?? true}
                    onChange={(e) => handleSettingsChange("showEquivalentInBaseCurrency", e.target.checked)}
                    className="mt-0.5 rounded accent-indigo-600 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      {language === "ar" ? "إظهار المعادل بالعملة الأساسية في الفاتورة والسند" : "Show equivalent amount in base currency on invoices"}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {language === "ar" ? "عرض شريط توضيحي بقيمة السند بالعملة المحلية أسفل المجموع" : "Displays an equivalent banner in the base currency for foreign transactions"}
                    </span>
                  </div>
                </label>
              </div>

              {/* Supported Additional Currencies Selection */}
              <div className="pt-3 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  {language === "ar" ? "العملات الإضافية المتاحة في النظام:" : "Allowed Additional Currencies:"}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AVAILABLE_CURRENCIES.map((c) => {
                    const isSelected = (localSettings.secondaryCurrencies || ["OMR", "SAR", "AED", "USD", "EUR"]).includes(c.code);
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          const current = localSettings.secondaryCurrencies || ["OMR", "SAR", "AED", "USD", "EUR"];
                          const updated = isSelected
                            ? current.filter((x) => x !== c.code)
                            : [...current, c.code];
                          handleSettingsChange("secondaryCurrencies", updated);
                        }}
                        className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-50 border-indigo-300 text-indigo-900"
                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>{c.flag}</span>
                          <span>{c.code}</span>
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Exchange Rate Table & Custom Rates */}
            <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  {language === "ar" ? "جدول أسعار الصرف الحالية (مقابل 1 USD)" : "Active Exchange Rates (vs 1 USD)"}
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Live Engine</span>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {AVAILABLE_CURRENCIES.map((c) => {
                    const currentRate = localSettings.customExchangeRates?.[c.code] ?? (c.code === "OMR" ? 0.3845 : c.code === "SAR" ? 3.75 : c.code === "AED" ? 3.6725 : c.code === "USD" ? 1.0 : 1.0);
                    return (
                      <div key={c.code} className="p-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{c.flag}</span>
                          <div>
                            <span className="font-bold text-slate-900">{c.code}</span>
                            <span className="text-[10px] text-slate-500 block">{c.nameAr}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.0001"
                            value={currentRate}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 1;
                              handleSettingsChange("customExchangeRates", {
                                ...(localSettings.customExchangeRates || {}),
                                [c.code]: val
                              });
                            }}
                            className="w-24 px-2 py-1 text-xs font-mono font-bold text-right rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                          />
                          <span className="text-[10px] font-mono text-slate-400 w-8">{c.symbolEn}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                {language === "ar"
                  ? "💡 يمكنك تعديل سعر الصرف لأي عملة يدوياً أو النقر على 'تحديث أسعار الصرف الآن' لجلب الأسعار العالمية المباشرة تلقائياً."
                  : "💡 You can override any rate manually or click 'Fetch Live Rates' to pull international market rates."}
              </p>
            </div>

          </div>
        </div>
      )}

      {/* Tab 2: Brand Logos, Digital Signatures & Stamp */}
      {activeTab === "brand" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>{t("brandIdentityAssets")}</span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Logo Upload & Presets */}
            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                {t("companyBrandLogo")}
              </span>

              {localSettings.logoUrl && (
                <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                  <img
                    src={localSettings.logoUrl}
                    alt="Logo Preview"
                    style={{ width: `${localSettings.logoWidth || 120}px` }}
                    className="max-h-16 object-contain"
                  />
                  <span className="text-[10px] text-slate-400">Current Logo</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Logo Width: {localSettings.logoWidth || 150}px
                </label>
                <input
                  type="range"
                  min="80"
                  max="300"
                  value={localSettings.logoWidth || 150}
                  onChange={(e) => handleSettingsChange("logoWidth", Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t("uploadLogoImage")}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, "logoUrl")}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t("pasteLogoUrl")}
                </label>
                <input
                  type="text"
                  value={localSettings.logoUrl}
                  onChange={(e) => handleSettingsChange("logoUrl", e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                  {t("sampleLogoPresets")}
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_LOGOS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleSettingsChange("logoUrl", p.url)}
                      className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-white hover:bg-indigo-50 border border-slate-200 cursor-pointer"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stamp Seal Section */}
              <div className="pt-4 border-t border-slate-200 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                  {t("uploadOfficialStamp")}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, "stampImageUrl")}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 cursor-pointer"
                />
                {localSettings.stampImageUrl && (
                  <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={localSettings.stampImageUrl} alt="Stamp Seal" className="w-12 h-12 object-contain" />
                      <span className="text-[10px] text-slate-500">Seal Active</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSettingsChange("stampImageUrl", "")}
                      className="text-xs text-red-600 hover:text-red-800 font-semibold cursor-pointer"
                    >
                      {t("removeStamp")}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Digital Signature Studio (Canvas Drawing, Styles, Upload) */}
            <div className="space-y-4">
              <DigitalSignaturePad
                initialSignature={localSettings.signatureImageUrl}
                signatoryName={localSettings.authorizedSignatoryName}
                signatoryTitle={localSettings.authorizedSignatoryTitle}
                onSaveSignature={(signatureDataUrl) => {
                  handleSettingsChange("signatureImageUrl", signatureDataUrl);
                }}
                onClearSignature={() => {
                  handleSettingsChange("signatureImageUrl", "");
                }}
              />
            </div>

          </div>
        </div>
      )}

      {/* Tab 3: Colors & Templates */}
      {activeTab === "theme" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-600" />
            <span>{t("themeColorsTitle")}</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Color Swatches */}
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                {t("palettePresets")}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESET_PALETTES.map((pal) => (
                  <button
                    key={pal.name}
                    type="button"
                    onClick={() =>
                      setLocalTheme({
                        ...localTheme,
                        primaryColor: pal.primary,
                        secondaryColor: pal.secondary,
                        accentColor: pal.accent
                      })
                    }
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50 transition-all text-xs font-medium cursor-pointer"
                  >
                    <span>{pal.name}</span>
                    <div className="flex gap-1">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: pal.primary }} />
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: pal.secondary }} />
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom Color Pickers */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t("primaryColor")}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={localTheme.primaryColor}
                      onChange={(e) => handleThemeChange("primaryColor", e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300"
                    />
                    <input
                      type="text"
                      value={localTheme.primaryColor}
                      onChange={(e) => handleThemeChange("primaryColor", e.target.value)}
                      className="w-24 px-2 py-1 text-xs font-mono rounded-lg border border-slate-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t("secondaryColor")}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={localTheme.secondaryColor}
                      onChange={(e) => handleThemeChange("secondaryColor", e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300"
                    />
                    <input
                      type="text"
                      value={localTheme.secondaryColor}
                      onChange={(e) => handleThemeChange("secondaryColor", e.target.value)}
                      className="w-24 px-2 py-1 text-xs font-mono rounded-lg border border-slate-300"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Template & Paper Options */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t("templateStyle")}
                </label>
                <select
                  value={localTheme.templateId}
                  onChange={(e) => handleThemeChange("templateId", e.target.value as TemplateStyle)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-slate-50"
                >
                  <option value="modern">{t("modernClean")}</option>
                  <option value="classic">{t("corporateClassic")}</option>
                  <option value="executive">{t("executiveStamp")}</option>
                  <option value="minimalist">{t("minimalistLight")}</option>
                  <option value="thermal80">{t("thermalReceipt")}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t("pageSize")}
                </label>
                <select
                  value={localTheme.pageSize}
                  onChange={(e) => handleThemeChange("pageSize", e.target.value as PageSizeFormat)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-slate-50"
                >
                  <option value="A4">A4 (210mm x 297mm)</option>
                  <option value="A5">A5 (148mm x 210mm)</option>
                  <option value="LETTER">US Letter (216mm x 279mm)</option>
                  <option value="THERMAL_80MM">{language === "ar" ? "طابعة إيصالات حرارية 80mm POS Roll" : "Thermal 80mm POS Roll"}</option>
                  <option value="THERMAL_58MM">{language === "ar" ? "طابعة إيصالات حرارية 58mm Mobile Roll" : "Thermal 58mm Mobile Roll"}</option>
                </select>
              </div>

              {(localTheme.pageSize === "THERMAL_80MM" || localTheme.pageSize === "THERMAL_58MM" || localTheme.templateId === "thermal80") && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 animate-fadeIn">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <Printer className="w-4 h-4 text-amber-600" />
                    <span>{language === "ar" ? "وضع الطابعة الحرارية نشط (Thermal 80mm)" : "Thermal 80mm Mode Active"}</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    {language === "ar"
                      ? "تم تكييف عرض ومعاينة الفاتورة تلقائياً لعرض 80mm بدون هوامش وبخطوط واضحة أحادية المسافة مع إدراج التوقيع والباركود."
                      : "Invoice layout is optimized for continuous 80mm roll paper with high contrast and compact metadata."}
                  </p>
                </div>
              )}

              {/* Toggles */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                  {t("elementVisibility")}
                </span>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={localTheme.showLogo}
                      onChange={(e) => handleThemeChange("showLogo", e.target.checked)}
                      className="rounded accent-indigo-600"
                    />
                    <span>{t("showLogo")}</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={localTheme.showStamp}
                      onChange={(e) => handleThemeChange("showStamp", e.target.checked)}
                      className="rounded accent-indigo-600"
                    />
                    <span>{t("showStamp")}</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={localTheme.showSignatureBlock}
                      onChange={(e) => handleThemeChange("showSignatureBlock", e.target.checked)}
                      className="rounded accent-indigo-600"
                    />
                    <span>{t("showSignatures")}</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={localTheme.showQrCode}
                      onChange={(e) => handleThemeChange("showQrCode", e.target.checked)}
                      className="rounded accent-indigo-600"
                    />
                    <span>{t("showQrCode")}</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={localTheme.showWatermark}
                      onChange={(e) => handleThemeChange("showWatermark", e.target.checked)}
                      className="rounded accent-indigo-600"
                    />
                    <span>{t("showWatermark")}</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={localTheme.showBankDetails}
                      onChange={(e) => handleThemeChange("showBankDetails", e.target.checked)}
                      className="rounded accent-indigo-600"
                    />
                    <span>{t("showBankDetails")}</span>
                  </label>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Tab 4: Header, Footer & Terms */}
      {activeTab === "notices" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-indigo-600" />
            <span>{t("headerFooterTermsTitle")}</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("headerNotice")}
              </label>
              <input
                type="text"
                value={localSettings.headerNotice}
                onChange={(e) => handleSettingsChange("headerNotice", e.target.value)}
                placeholder="OFFICIAL RECEIPT VOUCHER - سند قبض مالي رسمي"
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("footerNotice")}
              </label>
              <input
                type="text"
                value={localSettings.footerNotice}
                onChange={(e) => handleSettingsChange("footerNotice", e.target.value)}
                placeholder="شكراً لتعاملكم معنا. مستند صادر إلكترونياً."
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("termsAndConditions")}
              </label>
              <textarea
                rows={4}
                value={localSettings.termsAndConditions}
                onChange={(e) => handleSettingsChange("termsAndConditions", e.target.value)}
                placeholder="شروط الدفع وسياسة الاسترجاع المعتمدة..."
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Banking Information */}
      {activeTab === "bank" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <Landmark className="w-4 h-4 text-indigo-600" />
            <span>{t("bankingInfoTitle")}</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("bankName")}
              </label>
              <input
                type="text"
                value={localSettings.bankDetails?.bankName || ""}
                onChange={(e) => handleBankChange("bankName", e.target.value)}
                placeholder="بنك مسقط / Bank Muscat / Al Rajhi Bank"
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("accountName")}
              </label>
              <input
                type="text"
                value={localSettings.bankDetails?.accountName || ""}
                onChange={(e) => handleBankChange("accountName", e.target.value)}
                placeholder="Apex Global Enterprises LLC"
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("accountNumber")}
              </label>
              <input
                type="text"
                value={localSettings.bankDetails?.accountNumber || ""}
                onChange={(e) => handleBankChange("accountNumber", e.target.value)}
                placeholder="987-654321-00"
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("ibanNumber")}
              </label>
              <input
                type="text"
                value={localSettings.bankDetails?.iban || ""}
                onChange={(e) => handleBankChange("iban", e.target.value)}
                placeholder="OM98BMUS0123456789012345"
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 bg-slate-50"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                SWIFT / BIC Code
              </label>
              <input
                type="text"
                value={localSettings.bankDetails?.swiftCode || ""}
                onChange={(e) => handleBankChange("swiftCode", e.target.value)}
                placeholder="BMUSOMRX"
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 bg-slate-50"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab: WhatsApp Baileys API Gateway */}
      {activeTab === "whatsapp" && (
        <div className="pt-2">
          <WhatsAppBaileysStudio
            settings={localSettings}
            onSaveSettings={(updated) => {
              setLocalSettings(updated);
              onSaveSettings(updated);
            }}
          />
        </div>
      )}

      {/* Tab 6: Employees & Permissions Management */}
      {activeTab === "employees" && (
        <div className="pt-2">
          <EmployeesManager
            employees={employees}
            branches={branches}
            companySettings={localSettings}
            activeEmployeeId={activeEmployeeId}
            onSaveEmployees={onSaveEmployees || (() => {})}
            onSelectActiveEmployee={onSelectActiveEmployee}
          />
        </div>
      )}

      {/* Tab 7: System Audit & Activity Logs */}
      {activeTab === "logs" && (
        <div className="pt-2">
          <ActivityLogsManager
            logs={auditLogs}
            onClearLogs={onClearAuditLogs || (() => {})}
          />
        </div>
      )}

    </div>
  );
};
