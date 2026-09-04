import React, { useState, useEffect } from "react";
import {
  ReceiptVoucher,
  CompanySettings,
  VoucherType,
  Customer,
  InventoryItem,
  PurchaseInvoice,
  Branch,
  WorkspaceConfig,
  QuickLauncherId,
  QuickActionId,
  ReportWidgetId
} from "../types";
import {
  FileText,
  Receipt,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  TrendingUp,
  CreditCard,
  Building2,
  Clock,
  Sparkles,
  Printer,
  Eye,
  PlusCircle,
  Edit3,
  Calendar,
  Wallet,
  Settings,
  ArrowLeft,
  ArrowRight,
  Boxes,
  ShoppingCart,
  Repeat,
  BookOpen,
  SlidersHorizontal,
  FileCheck
} from "lucide-react";
import { formatDateToDDMMMMYYYY } from "../utils/dateFormatter";
import { useLanguage } from "../utils/LanguageContext";
import { DEFAULT_COMPANY_SETTINGS } from "../utils/storage";
import { loadAuthSession } from "../utils/authManager";
import {
  loadWorkspaceConfigFromLocal,
  fetchWorkspaceConfigFromSupabase,
  saveWorkspaceConfigToSupabase,
  resetWorkspaceConfig,
  ALL_QUICK_LAUNCHERS,
  ALL_QUICK_ACTIONS
} from "../utils/workspaceStorage";
import { WorkspaceCustomizerModal } from "./workspace/WorkspaceCustomizerModal";
import { DashboardAnalytics } from "./DashboardAnalytics";
import { DueDatesAlertsCenter } from "./DueDatesAlertsCenter";

interface HomeDashboardProps {
  userName?: string;
  onUpdateUserName?: (name: string) => void;
  companySettings?: CompanySettings;
  vouchers: ReceiptVoucher[];
  customers: Customer[];
  inventory?: InventoryItem[];
  purchases?: PurchaseInvoice[];
  branches?: Branch[];
  onSelectAction: (actionType: VoucherType) => void;
  onNavigateTab: (tab: "home" | "pos" | "accounting" | "spaces" | "contracts" | "services" | "portal" | "doc-wizard" | "editor" | "preview" | "history" | "crm" | "inventory" | "purchases" | "branches" | "employees" | "requests" | "schedules" | "settings") => void;
  onViewVoucher: (voucher: ReceiptVoucher) => void;
  onQuickCreateForCustomer: (customer: Customer) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  userName = "المستخدم",
  onUpdateUserName,
  companySettings = DEFAULT_COMPANY_SETTINGS,
  vouchers,
  customers,
  inventory = [],
  purchases = [],
  branches = [],
  onSelectAction,
  onNavigateTab,
  onViewVoucher,
  onQuickCreateForCustomer
}) => {
  const { language, t, dir, isRTL } = useLanguage();
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>(userName);
  const [workspaceRole, setWorkspaceRole] = useState<"all" | "accounting" | "sales" | "inventory" | "hr">("all");

  // Live ticking clock state
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const seconds = currentTime.getSeconds();
  const minutes = currentTime.getMinutes();
  const hours = currentTime.getHours();

  const secondDeg = seconds * 6;
  const minuteDeg = (minutes + seconds / 60) * 6;
  const hourDeg = ((hours % 12) + minutes / 60) * 30;

  // Get active session user for user-scoped DB persistence
  const session = loadAuthSession();
  const userId = session?.user?.id || "default_user";
  const userEmail = session?.user?.email;

  // Workspace layout customization state
  const [isCustomizerOpen, setIsCustomizerOpen] = useState<boolean>(false);
  const [workspaceConfig, setWorkspaceConfig] = useState<WorkspaceConfig>(() =>
    loadWorkspaceConfigFromLocal(userId)
  );

  // Fetch workspace config from Supabase DB on mount or user session change
  useEffect(() => {
    let isMounted = true;
    fetchWorkspaceConfigFromSupabase(userId, userEmail).then((remoteConfig) => {
      if (isMounted && remoteConfig) {
        setWorkspaceConfig(remoteConfig);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [userId, userEmail]);

  const handleSaveWorkspaceConfig = async (newConfig: WorkspaceConfig) => {
    setWorkspaceConfig(newConfig);
    await saveWorkspaceConfigToSupabase(newConfig, userId, userEmail);
  };

  const handleResetWorkspaceConfig = async () => {
    const resetConfig = await resetWorkspaceConfig(userId, userEmail);
    setWorkspaceConfig(resetConfig);
  };

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  // Financial calculations
  const totalReceipts = vouchers
    .filter((v) => v.type === "RECEIPT" || v.type === "TAX_INVOICE")
    .reduce((sum, v) => sum + (v.totalAmount || v.amount || 0), 0);

  const totalPayments = vouchers
    .filter((v) => v.type === "PAYMENT" || v.type === "PETTY_CASH")
    .reduce((sum, v) => sum + (v.totalAmount || v.amount || 0), 0);

  const totalPurchases = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const totalInventoryValue = inventory.reduce((sum, item) => sum + item.quantity * item.costPrice, 0);
  const lowStockItemsCount = inventory.filter(
    (item) => item.quantity <= item.minAlertQuantity || item.status === "LOW_STOCK" || item.status === "OUT_OF_STOCK"
  ).length;

  const currency = companySettings.defaultCurrency || vouchers[0]?.currency || "OMR";

  // Recent vouchers (last 5)
  const recentVouchers = [...vouchers].sort(
    (a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
  ).slice(0, 5);

  // Recent active customers (top 4)
  const topCustomers = customers.slice(0, 4);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim() && onUpdateUserName) {
      onUpdateUserName(nameInput.trim());
    }
    setIsEditingName(false);
  };

  const getVoucherTypeBadge = (type: VoucherType) => {
    switch (type) {
      case "RECEIPT":
        return {
          label: t("voucherTypeReceipt"),
          bg: "bg-emerald-100 text-emerald-800 border-emerald-200",
          icon: ArrowDownLeft
        };
      case "TAX_INVOICE":
        return {
          label: t("voucherTypeTaxInvoice"),
          bg: "bg-blue-100 text-blue-800 border-blue-200",
          icon: FileText
        };
      case "QUOTATION":
        return {
          label: t("voucherTypeQuotation"),
          bg: "bg-purple-100 text-purple-800 border-purple-200",
          icon: FileSpreadsheet
        };
      case "PAYMENT":
        return {
          label: t("voucherTypePayment"),
          bg: "bg-rose-100 text-rose-800 border-rose-200",
          icon: ArrowUpRight
        };
      case "PETTY_CASH":
      default:
        return {
          label: t("voucherTypePettyCash"),
          bg: "bg-amber-100 text-amber-800 border-amber-200",
          icon: Wallet
        };
    }
  };

  // Helper to render individual quick launcher cards dynamically
  const renderLauncherCard = (launcherId: QuickLauncherId) => {
    switch (launcherId) {
      case "pos":
        return (
          <div
            key="pos"
            onClick={() => onNavigateTab("pos")}
            className="relative overflow-hidden bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 rounded-2xl p-5 text-white shadow-md hover:shadow-xl transition-all cursor-pointer group border border-indigo-500/40 flex flex-col justify-between"
          >
            <div className="absolute -left-10 -bottom-10 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />
            <div className="relative z-10 flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-400 text-slate-950 px-2 py-0.5 rounded-full shadow-xs">
                    {language === "ar" ? "نظام الكاشير المباشر" : "Live POS"}
                  </span>
                </div>
                <h3 className="text-base font-black tracking-tight text-white mt-1">
                  {language === "ar" ? "نقطة البيع (POS)" : "POS Terminal"}
                </h3>
                <p className="text-xs text-indigo-100/90 mt-0.5 line-clamp-2">
                  {language === "ar" ? "مبيعات سريعة وباركود وفواتير فورية." : "Retail checkout with instant barcodes."}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-indigo-100">
              <span>{language === "ar" ? "فتح الكاشير" : "Launch POS"}</span>
              <div className="p-1.5 bg-white text-indigo-900 rounded-lg group-hover:bg-indigo-50 transition-colors">
                <ArrowIcon className="w-4 h-4" />
              </div>
            </div>
          </div>
        );

      case "accounting":
        return (
          <div
            key="accounting"
            onClick={() => onNavigateTab("accounting")}
            className="relative overflow-hidden bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-2xl p-5 text-white shadow-md hover:shadow-xl transition-all cursor-pointer group border border-teal-500/40 flex flex-col justify-between"
          >
            <div className="absolute -left-10 -bottom-10 w-36 h-36 bg-teal-400/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />
            <div className="relative z-10 flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                <BookOpen className="w-6 h-6 text-teal-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-teal-300 text-slate-950 px-2 py-0.5 rounded-full shadow-xs">
                    {language === "ar" ? "المحاسبة المتقدمة" : "IFRS GL"}
                  </span>
                </div>
                <h3 className="text-base font-black tracking-tight text-white mt-1">
                  {language === "ar" ? "دفتر الأستاذ والتقارير" : "General Ledger"}
                </h3>
                <p className="text-xs text-teal-100/90 mt-0.5 line-clamp-2">
                  {language === "ar"
                    ? "القيود المزدوجة، ميزان المراجعة، الأرباح والخسائر والميزانية."
                    : "Double entry, trial balance, P&L, balance sheet & audit trail."}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-teal-100">
              <span>{language === "ar" ? "فتح الإدارة المحاسبية" : "Open Accounting"}</span>
              <div className="p-1.5 bg-teal-400 text-slate-950 rounded-lg group-hover:bg-teal-300 transition-colors">
                <ArrowIcon className="w-4 h-4" />
              </div>
            </div>
          </div>
        );

      case "spaces":
        return (
          <div
            key="spaces"
            onClick={() => onNavigateTab("spaces")}
            className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 rounded-2xl p-5 text-white shadow-md hover:shadow-xl transition-all cursor-pointer group border border-blue-500/40 flex flex-col justify-between"
          >
            <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />
            <div className="relative z-10 flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                <Building2 className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-400 text-slate-950 px-2 py-0.5 rounded-full shadow-xs">
                    {language === "ar" ? "نظام حجز ذكي" : "Smart Booking"}
                  </span>
                </div>
                <h3 className="text-base font-black tracking-tight text-white mt-1">
                  {language === "ar" ? "حجز القاعات ومساحات العمل" : "Spaces & Meeting Halls"}
                </h3>
                <p className="text-xs text-blue-100/90 mt-0.5 line-clamp-2">
                  {language === "ar"
                    ? "تأجير قاعات التدريب والاجتماعات بالساعة أو الشهر آلياً."
                    : "Rent training halls and meeting desks hourly or monthly."}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-blue-100">
              <span>{language === "ar" ? "إدارة وطلب الحجوزات" : "Manage & Book"}</span>
              <div className="p-1.5 bg-emerald-400 text-slate-950 rounded-lg group-hover:bg-emerald-300 transition-colors">
                <ArrowIcon className="w-4 h-4" />
              </div>
            </div>
          </div>
        );

      case "doc-wizard":
        return (
          <div
            key="doc-wizard"
            onClick={() => onNavigateTab("doc-wizard")}
            className="relative overflow-hidden bg-gradient-to-r from-purple-700 via-indigo-700 to-slate-900 rounded-2xl p-5 text-white shadow-md hover:shadow-xl transition-all cursor-pointer group border border-purple-500/40 flex flex-col justify-between"
          >
            <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />
            <div className="relative z-10 flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                <Sparkles className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full shadow-xs">
                    {language === "ar" ? "معالج السندات" : "Doc Wizard"}
                  </span>
                </div>
                <h3 className="text-base font-black tracking-tight text-white mt-1">
                  {t("docWizardTitle")}
                </h3>
                <p className="text-xs text-purple-100/90 mt-0.5 line-clamp-2">
                  {t("docWizardSubtitle")}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-purple-100">
              <span>{language === "ar" ? "إصدار مستند مالي" : "Launch Doc Wizard"}</span>
              <div className="p-1.5 bg-amber-400 text-slate-950 rounded-lg group-hover:bg-amber-300 transition-colors">
                <ArrowIcon className="w-4 h-4" />
              </div>
            </div>
          </div>
        );

      case "inventory":
        return (
          <div
            key="inventory"
            onClick={() => onNavigateTab("inventory")}
            className="p-5 bg-gradient-to-br from-amber-500/10 to-orange-500/5 rounded-2xl border border-amber-200/80 hover:border-amber-400 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-amber-500 text-white rounded-xl group-hover:scale-105 transition-transform shadow-xs">
                <Boxes className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{t("tabInventory")}</h3>
                  {lowStockItemsCount > 0 && (
                    <span className="text-[10px] font-black px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full border border-rose-200">
                      {lowStockItemsCount} {t("lowStock")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {inventory.length} {t("itemName")} • {totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                </p>
              </div>
            </div>
            <div className="text-xs font-bold text-amber-800 flex items-center gap-1">
              <ArrowIcon className="w-4 h-4" />
            </div>
          </div>
        );

      case "purchases":
        return (
          <div
            key="purchases"
            onClick={() => onNavigateTab("purchases")}
            className="p-5 bg-gradient-to-br from-indigo-500/10 to-blue-500/5 rounded-2xl border border-indigo-200/80 hover:border-indigo-400 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-indigo-600 text-white rounded-xl group-hover:scale-105 transition-transform shadow-xs">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{t("tabPurchases")}</h3>
                  <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                    {purchases.length}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {totalPurchases.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                </p>
              </div>
            </div>
            <div className="text-xs font-bold text-indigo-800 flex items-center gap-1">
              <ArrowIcon className="w-4 h-4" />
            </div>
          </div>
        );

      case "branches":
        return (
          <div
            key="branches"
            onClick={() => onNavigateTab("branches")}
            className="p-5 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 rounded-2xl border border-emerald-200/80 hover:border-emerald-400 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-emerald-600 text-white rounded-xl group-hover:scale-105 transition-transform shadow-xs">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{t("tabBranches")}</h3>
                  <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                    {branches.length || 3}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {language === "ar" ? "الفروع والمخازن ومناقلات البضائع" : "Multi-branch dispatch & stock balance"}
                </p>
              </div>
            </div>
            <div className="text-xs font-bold text-emerald-800 flex items-center gap-1">
              <ArrowIcon className="w-4 h-4" />
            </div>
          </div>
        );

      case "schedules":
        return (
          <div
            key="schedules"
            onClick={() => onNavigateTab("schedules")}
            className="p-5 bg-gradient-to-br from-purple-500/10 to-indigo-500/5 rounded-2xl border border-purple-200/80 hover:border-purple-400 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-purple-600 text-white rounded-xl group-hover:scale-105 transition-transform shadow-xs">
                <Repeat className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{t("tabSchedules")}</h3>
                  <span className="text-[10px] font-black px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                    {language === "ar" ? "جدولة" : "Auto"}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {language === "ar" ? "أقساط السيارات، الإيجارات، الفواتير والاشتراكات" : "Car installments, rent, bills & subscriptions"}
                </p>
              </div>
            </div>
            <div className="text-xs font-bold text-purple-800 flex items-center gap-1">
              <ArrowIcon className="w-4 h-4" />
            </div>
          </div>
        );

      case "crm":
        return (
          <div
            key="crm"
            onClick={() => onNavigateTab("crm")}
            className="p-5 bg-gradient-to-br from-sky-500/10 to-blue-500/5 rounded-2xl border border-sky-200/80 hover:border-sky-400 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-sky-600 text-white rounded-xl group-hover:scale-105 transition-transform shadow-xs">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{t("tabCrm")}</h3>
                  <span className="text-[10px] font-black px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full">
                    {customers.length}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {language === "ar" ? "إدارة دليل العملاء والاتصالات" : "Manage client directory & contacts"}
                </p>
              </div>
            </div>
            <div className="text-xs font-bold text-sky-800 flex items-center gap-1">
              <ArrowIcon className="w-4 h-4" />
            </div>
          </div>
        );

      case "employees":
        return (
          <div
            key="employees"
            onClick={() => onNavigateTab("employees")}
            className="p-5 bg-gradient-to-br from-rose-500/10 to-pink-500/5 rounded-2xl border border-rose-200/80 hover:border-rose-400 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-rose-600 text-white rounded-xl group-hover:scale-105 transition-transform shadow-xs">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{t("tabEmployees")}</h3>
                  <span className="text-[10px] font-black px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full">
                    HR
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {language === "ar" ? "سجل الموظفين والرواتب والإجازات" : "Employee directory, salaries & leaves"}
                </p>
              </div>
            </div>
            <div className="text-xs font-bold text-rose-800 flex items-center gap-1">
              <ArrowIcon className="w-4 h-4" />
            </div>
          </div>
        );

      case "requests":
        return (
          <div
            key="requests"
            onClick={() => onNavigateTab("requests")}
            className="p-5 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 rounded-2xl border border-cyan-200/80 hover:border-cyan-400 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-cyan-600 text-white rounded-xl group-hover:scale-105 transition-transform shadow-xs">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{t("tabRequests")}</h3>
                  <span className="text-[10px] font-black px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded-full">
                    {language === "ar" ? "موافقات" : "Approvals"}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {language === "ar" ? "طلبات النثريات والموافقات الإدارية" : "Financial petty cash & leave requests"}
                </p>
              </div>
            </div>
            <div className="text-xs font-bold text-cyan-800 flex items-center gap-1">
              <ArrowIcon className="w-4 h-4" />
            </div>
          </div>
        );

      case "settings":
        return (
          <div
            key="settings"
            onClick={() => onNavigateTab("settings")}
            className="p-5 bg-gradient-to-br from-slate-500/10 to-slate-700/5 rounded-2xl border border-slate-200/80 hover:border-slate-400 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-slate-800 text-white rounded-xl group-hover:scale-105 transition-transform shadow-xs">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{t("tabSettings")}</h3>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {language === "ar" ? "إعدادات الشركة والمظهر والنسخ الاحتياطي" : "Company setup, themes & cloud backups"}
                </p>
              </div>
            </div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <ArrowIcon className="w-4 h-4" />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Helper to render individual action creation buttons dynamically
  const renderActionCard = (actionId: QuickActionId) => {
    switch (actionId) {
      case "RECEIPT":
        return (
          <button
            key="RECEIPT"
            onClick={() => onSelectAction("RECEIPT")}
            className={`group relative bg-white hover:bg-emerald-50/50 p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer ${
              isRTL ? "text-right" : "text-left"
            }`}
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ArrowDownLeft className="w-6 h-6" />
              </div>
              <div>
                <span className="inline-block text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mb-1 border border-emerald-200">
                  {language === "ar" ? "تسجيل إيرادات" : "Income Collection"}
                </span>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {t("voucherTypeReceipt")}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {language === "ar"
                    ? "استلام مبالغ نقدية أو تحويلات بنكية من العملاء وإصدار إيصال معتمد"
                    : "Collect cash or bank transfers from clients with certified receipts"}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
              <span>{t("create")}</span>
              <PlusCircle className="w-4 h-4" />
            </div>
          </button>
        );

      case "TAX_INVOICE":
        return (
          <button
            key="TAX_INVOICE"
            onClick={() => onSelectAction("TAX_INVOICE")}
            className={`group relative bg-white hover:bg-blue-50/50 p-5 rounded-2xl border border-slate-200 hover:border-blue-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer ${
              isRTL ? "text-right" : "text-left"
            }`}
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <span className="inline-block text-[11px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md mb-1 border border-blue-200">
                  {language === "ar" ? "فوترة إلكترونية + ضريبة" : "E-Invoicing + VAT"}
                </span>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  {t("voucherTypeTaxInvoice")}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {language === "ar"
                    ? "فاتورة مبيعات مفصلة مع حساب ضريبة القيمة المضافة (VAT) ورمز QR"
                    : "Itemized billing with automated VAT calculations and verification QR"}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700">
              <span>{t("create")}</span>
              <PlusCircle className="w-4 h-4" />
            </div>
          </button>
        );

      case "QUOTATION":
        return (
          <button
            key="QUOTATION"
            onClick={() => onSelectAction("QUOTATION")}
            className={`group relative bg-white hover:bg-purple-50/50 p-5 rounded-2xl border border-slate-200 hover:border-purple-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer ${
              isRTL ? "text-right" : "text-left"
            }`}
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <span className="inline-block text-[11px] font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md mb-1 border border-purple-200">
                  {language === "ar" ? "عروض الأسعار والصفقات" : "Proposals & Bids"}
                </span>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                  {t("voucherTypeQuotation")}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {language === "ar"
                    ? "تقديم مقترح مالي للعملاء بالبنود والأسعار والشروط التعاقدية"
                    : "Official quotes with custom terms, unit prices, and validity period"}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-700">
              <span>{t("create")}</span>
              <PlusCircle className="w-4 h-4" />
            </div>
          </button>
        );

      case "PAYMENT":
        return (
          <button
            key="PAYMENT"
            onClick={() => onSelectAction("PAYMENT")}
            className={`group relative bg-white hover:bg-rose-50/50 p-5 rounded-2xl border border-slate-200 hover:border-rose-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer ${
              isRTL ? "text-right" : "text-left"
            }`}
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ArrowUpRight className="w-6 h-6" />
              </div>
              <div>
                <span className="inline-block text-[11px] font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md mb-1 border border-rose-200">
                  {language === "ar" ? "تسجيل مصروفات / موردين" : "Vendor Payouts"}
                </span>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-rose-700 transition-colors">
                  {t("voucherTypePayment")}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {language === "ar"
                    ? "توثيق المبالغ المدفوعة للموردين، الإيجارات، والرواتب والمصروفات"
                    : "Document payments made to suppliers, rents, salaries, and operational costs"}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-rose-700">
              <span>{t("create")}</span>
              <PlusCircle className="w-4 h-4" />
            </div>
          </button>
        );

      case "PETTY_CASH":
        return (
          <button
            key="PETTY_CASH"
            onClick={() => onSelectAction("PETTY_CASH")}
            className={`group relative bg-white hover:bg-amber-50/50 p-5 rounded-2xl border border-slate-200 hover:border-amber-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer ${
              isRTL ? "text-right" : "text-left"
            }`}
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <span className="inline-block text-[11px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md mb-1 border border-amber-200">
                  {language === "ar" ? "مصروفات صغيرة" : "Petty Cash"}
                </span>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                  {t("voucherTypePettyCash")}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {language === "ar"
                    ? "توثيق النثريات اليومية والدفعات النقدية الصغيرة السريعة"
                    : "Record daily petty cash outflows and minor office operational costs"}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
              <span>{t("create")}</span>
              <PlusCircle className="w-4 h-4" />
            </div>
          </button>
        );

      default:
        return null;
    }
  };

  const hasAnyReportKpi =
    workspaceConfig.reportWidgets.includes("kpi_collections") ||
    workspaceConfig.reportWidgets.includes("kpi_payments") ||
    workspaceConfig.reportWidgets.includes("kpi_purchases") ||
    workspaceConfig.reportWidgets.includes("kpi_inventory");

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20" dir={dir}>
      
      {/* 1. Hero Greeting Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl border border-indigo-700/50">
        
        {/* Subtle decorative circles */}
        <div className="absolute top-0 left-0 -translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 translate-x-12 translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-indigo-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{companySettings?.companyName || t("appName")}</span>
              </div>

              {/* Workspace Customizer Button */}
              <button
                onClick={() => setIsCustomizerOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 hover:bg-amber-400/30 backdrop-blur-md border border-amber-300/40 text-xs font-bold text-amber-200 transition-all cursor-pointer shadow-xs"
                title={isRTL ? "تخصيص مساحة العمل والأزرار" : "Customize Workspace"}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-300" />
                <span>{isRTL ? "تخصيص مساحة العمل" : "Customize Workspace"}</span>
              </button>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
                {language === "ar" ? `مرحباً ${userName} 👋` : `Welcome, ${userName} 👋`}
              </h1>
              {isEditingName ? (
                <form onSubmit={handleSaveName} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="px-2 py-1 text-sm bg-white text-slate-900 rounded-lg font-bold outline-none ring-2 ring-indigo-400"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold cursor-pointer"
                  >
                    {t("save")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(false)}
                    className="px-2 py-1 text-xs bg-white/20 hover:bg-white/30 text-white rounded-lg cursor-pointer"
                  >
                    {t("cancel")}
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => {
                    setNameInput(userName);
                    setIsEditingName(true);
                  }}
                  className="p-1.5 text-indigo-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-xs"
                  title="Edit user name"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>

            <p className="text-sm sm:text-base text-indigo-100/90 max-w-xl font-medium leading-relaxed">
              {t("dashboardSubtitle")}
            </p>
          </div>

          {/* Analog Clock & Live Date Display */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3 sm:p-4 rounded-2xl flex items-center gap-3.5 shrink-0 shadow-lg">
            {/* Analog Clock Dial */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-950/70 border-2 border-indigo-300/30 flex items-center justify-center shadow-inner shrink-0">
              {/* Dial Hour Markers */}
              <div className="absolute top-1.5 text-[8px] font-extrabold text-indigo-200/80">12</div>
              <div className="absolute right-1.5 text-[8px] font-extrabold text-indigo-200/80">3</div>
              <div className="absolute bottom-1.5 text-[8px] font-extrabold text-indigo-200/80">6</div>
              <div className="absolute left-1.5 text-[8px] font-extrabold text-indigo-200/80">9</div>

              {/* Center Dot */}
              <div className="absolute w-2 h-2 bg-amber-400 rounded-full z-20 shadow-md ring-2 ring-amber-400/30" />

              {/* Hour Hand */}
              <div
                className="absolute bottom-1/2 left-1/2 w-1 bg-indigo-100 rounded-full origin-bottom z-10 transition-transform duration-200 shadow"
                style={{
                  height: "26%",
                  transform: `translateX(-50%) rotate(${hourDeg}deg)`
                }}
              />

              {/* Minute Hand */}
              <div
                className="absolute bottom-1/2 left-1/2 w-0.5 bg-cyan-300 rounded-full origin-bottom z-10 transition-transform duration-200 shadow"
                style={{
                  height: "36%",
                  transform: `translateX(-50%) rotate(${minuteDeg}deg)`
                }}
              />

              {/* Second Hand */}
              <div
                className="absolute bottom-1/2 left-1/2 w-[1.5px] bg-rose-400 rounded-full origin-bottom z-15 shadow"
                style={{
                  height: "44%",
                  transform: `translateX(-50%) rotate(${secondDeg}deg)`
                }}
              />
            </div>

            {/* Digital Time & Date Info */}
            <div className="flex flex-col text-start">
              <div className="flex items-center gap-1.5 text-xs text-indigo-200 font-semibold">
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                <span>{currentTime.toLocaleDateString(isRTL ? "ar-OM" : "en-US", { weekday: "long" })}</span>
              </div>

              {/* Digital Time Readout */}
              <span className="text-base sm:text-lg font-extrabold text-white font-mono tracking-wider my-0.5">
                {currentTime.toLocaleTimeString(isRTL ? "ar-OM" : "en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit"
                })}
              </span>

              {/* Full Date */}
              <div className="flex items-center gap-1 text-xs text-indigo-100/90 font-medium">
                <Calendar className="w-3 h-3 text-indigo-300" />
                <span>{formatDateToDDMMMMYYYY(currentTime.toISOString().split("T")[0])}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role Workspace Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-xs font-bold text-slate-500 ps-1 shrink-0">
          {isRTL ? "مساحة العمل المتخصصة:" : "Workspace View:"}
        </span>
        {[
          { id: "all", labelAr: "الرئيسية الشاملة", labelEn: "Executive All-in-One" },
          { id: "accounting", labelAr: "المحاسبة والمالية", labelEn: "Accounting & Finance" },
          { id: "sales", labelAr: "المبيعات ونقاط البيع", labelEn: "Sales & POS" },
          { id: "inventory", labelAr: "المخزون والمشتريات", labelEn: "Inventory & Supply" },
          { id: "hr", labelAr: "الموارد البشرية والرواتب", labelEn: "HR & Personnel" }
        ].map((role) => (
          <button
            key={role.id}
            onClick={() => setWorkspaceRole(role.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
              workspaceRole === role.id
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200"
            }`}
          >
            {isRTL ? role.labelAr : role.labelEn}
          </button>
        ))}
      </div>

      {/* DYNAMIC QUICK LAUNCHERS SECTION */}
      {workspaceConfig.quickLaunchers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {workspaceConfig.quickLaunchers.map((launcherId) => renderLauncherCard(launcherId))}
        </div>
      )}

      {/* SMART ALERTS CENTER WIDGET */}
      {workspaceConfig.reportWidgets.includes("smart_alerts") && (
        <DueDatesAlertsCenter
          vouchers={vouchers}
          purchases={purchases}
          companySettings={companySettings}
          onViewVoucher={onViewVoucher}
          onNavigateTab={onNavigateTab}
        />
      )}

      {/* DYNAMIC CORE CREATION ACTIONS SECTION */}
      {workspaceConfig.quickActions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t("quickActions")}</h2>
              <p className="text-xs text-slate-500 font-medium">
                {language === "ar" ? "اختر العملية المطلوبة للبدء الفوري" : "Select an action below to start immediately"}
              </p>
            </div>
            <button
              onClick={() => setIsCustomizerOpen(true)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isRTL ? "تخصيص الأزرار" : "Customize Buttons"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {workspaceConfig.quickActions.map((actionId) => renderActionCard(actionId))}
          </div>
        </div>
      )}

      {/* DYNAMIC EXECUTIVE REPORT & FINANCIAL KPIS */}
      {hasAnyReportKpi && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">{t("financialInsights")}</h2>
                <p className="text-xs text-slate-500">{t("dashboardSubtitle")}</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab("history")}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <span>{t("allVouchers")}</span>
              <ArrowIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* KPI Summary Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Revenue Collections */}
            {workspaceConfig.reportWidgets.includes("kpi_collections") && (
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                  {t("totalCollections")}
                </span>
                <p className="text-xl font-black text-emerald-950 font-mono">
                  {totalReceipts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className={`text-xs font-sans font-bold text-emerald-700 ${isRTL ? "mr-1.5" : "ml-1.5"}`}>{currency}</span>
                </p>
                <p className="text-[11px] text-emerald-600 font-medium">
                  {language === "ar" ? "سندات قبض وفواتير مدفوعة" : "Receipts & Paid Invoices"}
                </p>
              </div>
            )}

            {/* Total Expenses / Payments */}
            {workspaceConfig.reportWidgets.includes("kpi_payments") && (
              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 space-y-1">
                <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                  <ArrowUpRight className="w-4 h-4 text-rose-600" />
                  {t("totalPayments")}
                </span>
                <p className="text-xl font-black text-rose-950 font-mono">
                  {totalPayments.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className={`text-xs font-sans font-bold text-rose-700 ${isRTL ? "mr-1.5" : "ml-1.5"}`}>{currency}</span>
                </p>
                <p className="text-[11px] text-rose-600 font-medium">
                  {language === "ar" ? "سندات صرف ومصروفات تشغيلية" : "Operating & Vendor Outflows"}
                </p>
              </div>
            )}

            {/* Total Purchases */}
            {workspaceConfig.reportWidgets.includes("kpi_purchases") && (
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1">
                <span className="text-xs font-bold text-indigo-800 flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-indigo-600" />
                  {t("tabPurchases")}
                </span>
                <p className="text-xl font-black text-indigo-950 font-mono">
                  {totalPurchases.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className={`text-xs font-sans font-bold text-indigo-700 ${isRTL ? "mr-1.5" : "ml-1.5"}`}>{currency}</span>
                </p>
                <button
                  onClick={() => onNavigateTab("purchases")}
                  className="text-[11px] text-indigo-600 font-bold hover:underline"
                >
                  {language === "ar" ? `عرض فواتير المشتريات (${purchases.length}) ←` : `View PO Invoices (${purchases.length}) →`}
                </button>
              </div>
            )}

            {/* Inventory Valuation */}
            {workspaceConfig.reportWidgets.includes("kpi_inventory") && (
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-1">
                <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-amber-600" />
                  {t("inventoryValuation")}
                </span>
                <p className="text-xl font-black text-amber-950 font-mono">
                  {totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className={`text-xs font-sans font-bold text-amber-700 ${isRTL ? "mr-1.5" : "ml-1.5"}`}>{currency}</span>
                </p>
                <button
                  onClick={() => onNavigateTab("inventory")}
                  className="text-[11px] text-amber-700 font-bold hover:underline"
                >
                  {language === "ar" ? `عرض جرد المخزون (${inventory.length} أصناف) ←` : `View Stock (${inventory.length} items) →`}
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* DYNAMIC VISUAL ANALYTICS SECTION */}
      {workspaceConfig.reportWidgets.includes("visual_analytics") && (
        <DashboardAnalytics
          vouchers={vouchers}
          purchases={purchases}
          inventory={inventory}
          customers={customers}
          companySettings={companySettings}
        />
      )}

      {/* DYNAMIC DUAL SECTION: RECENT DOCUMENTS & CLIENT PICKER */}
      {(workspaceConfig.reportWidgets.includes("recent_vouchers") || workspaceConfig.reportWidgets.includes("customer_directory")) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recent Transactions (2 cols if both enabled, or full width if only recent vouchers enabled) */}
          {workspaceConfig.reportWidgets.includes("recent_vouchers") && (
            <div className={`${workspaceConfig.reportWidgets.includes("customer_directory") ? "lg:col-span-2" : "lg:col-span-3"} bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <h3 className="text-sm font-bold text-slate-900">{t("recentVouchers")}</h3>
                </div>
                <button
                  onClick={() => onNavigateTab("history")}
                  className="text-xs font-bold text-slate-500 hover:text-indigo-600 cursor-pointer"
                >
                  {t("filterAll")} ({vouchers.length})
                </button>
              </div>

              {recentVouchers.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-500">{t("noDataFound")}</p>
                  <button
                    onClick={() => onSelectAction("RECEIPT")}
                    className="mt-3 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 cursor-pointer"
                  >
                    + {t("newVoucher")}
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentVouchers.map((v) => {
                    const badge = getVoucherTypeBadge(v.type);
                    const BadgeIcon = badge.icon;
                    return (
                      <div
                        key={v.id}
                        className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2 rounded-xl border shrink-0 ${badge.bg}`}>
                            <BadgeIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {v.receivedFrom || (language === "ar" ? "بدون اسم" : "Unnamed Client")}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.2 rounded-md border ${badge.bg}`}>
                                {badge.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                              <span>#{v.voucherNumber}</span>
                              <span>•</span>
                              <span>{formatDateToDDMMMMYYYY(v.date)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className={isRTL ? "text-left" : "text-right"}>
                            <span className="font-mono font-bold text-xs text-slate-900">
                              {v.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {v.currency}
                            </span>
                            <span className={`block text-[10px] font-bold ${
                              v.status === "PAID" || v.status === "ISSUED" ? "text-emerald-600" : "text-amber-600"
                            }`}>
                              {v.status === "PAID" ? t("voucherStatusPaid") : v.status === "ISSUED" ? t("voucherStatusIssued") : t("voucherStatusDraft")}
                            </span>
                          </div>
                          <button
                            onClick={() => onViewVoucher(v)}
                            className="p-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg transition-colors cursor-pointer"
                            title={t("tabPreview")}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Quick Customer Directory */}
          {workspaceConfig.reportWidgets.includes("customer_directory") && (
            <div className={`${workspaceConfig.reportWidgets.includes("recent_vouchers") ? "lg:col-span-1" : "lg:col-span-3"} bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">{t("tabCrm")}</h3>
                  </div>
                  <button
                    onClick={() => onNavigateTab("crm")}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    {t("overview")}
                  </button>
                </div>

                <div className="space-y-2.5">
                  {topCustomers.map((cust) => (
                    <div
                      key={cust.id}
                      className="p-2.5 rounded-xl border border-slate-100 hover:border-indigo-200 bg-slate-50/70 hover:bg-indigo-50/40 transition-colors flex items-center justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{cust.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{cust.phone || cust.city || cust.company || ""}</p>
                      </div>
                      <button
                        onClick={() => onQuickCreateForCustomer(cust)}
                        className="px-2.5 py-1 bg-white hover:bg-indigo-600 hover:text-white text-indigo-600 text-[11px] font-bold rounded-lg border border-indigo-200 shadow-xs transition-colors cursor-pointer shrink-0"
                        title={t("newVoucher")}
                      >
                        + {t("newVoucher")}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => onNavigateTab("settings")}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>{t("tabSettings")}</span>
                </button>
              </div>

            </div>
          )}

        </div>
      )}

      {/* WORKSPACE CUSTOMIZER MODAL */}
      <WorkspaceCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        config={workspaceConfig}
        onSave={handleSaveWorkspaceConfig}
        onReset={handleResetWorkspaceConfig}
        isRTL={isRTL}
      />

    </div>
  );
};
