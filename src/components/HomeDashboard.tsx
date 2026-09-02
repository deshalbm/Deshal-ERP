import React, { useState } from "react";
import {
  ReceiptVoucher,
  CompanySettings,
  VoucherType,
  Customer,
  InventoryItem,
  PurchaseInvoice,
  Branch
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
  BookOpen
} from "lucide-react";
import { formatDateToDDMMMMYYYY } from "../utils/dateFormatter";
import { useLanguage } from "../utils/LanguageContext";
import { DEFAULT_COMPANY_SETTINGS } from "../utils/storage";
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
  userName = "سعيد",
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

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  // Financial calculations
  const totalReceipts = vouchers
    .filter((v) => v.type === "RECEIPT" || v.type === "TAX_INVOICE")
    .reduce((sum, v) => sum + (v.totalAmount || v.amount || 0), 0);

  const totalPayments = vouchers
    .filter((v) => v.type === "PAYMENT" || v.type === "PETTY_CASH")
    .reduce((sum, v) => sum + (v.totalAmount || v.amount || 0), 0);

  const netBalance = totalReceipts - totalPayments;

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

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20" dir={dir}>
      
      {/* 1. Hero Greeting Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl border border-indigo-700/50">
        
        {/* Subtle decorative circles */}
        <div className="absolute top-0 left-0 -translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 translate-x-12 translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{companySettings?.companyName || t("appName")}</span>
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

          {/* Quick Date / Live Status Badge */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl flex flex-col items-center justify-center text-center shrink-0 min-w-[160px]">
            <Calendar className="w-5 h-5 text-indigo-200 mb-1" />
            <span className="text-xs text-indigo-200 font-medium">{t("date")}</span>
            <span className="text-sm font-bold text-white font-mono mt-0.5">
              {formatDateToDDMMMMYYYY(new Date().toISOString().split("T")[0])}
            </span>
            <span className="mt-2 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
              {t("pwaReady")}
            </span>
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

      {/* 4 Launchers: POS, General Ledger & Accounts, Spaces Booking & Doc Wizard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* POS Quick Launcher Banner */}
        <div 
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
                {language === "ar"
                  ? "مبيعات سريعة وباركود وفواتير فورية."
                  : "Retail checkout with instant barcodes."}
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

        {/* General Ledger & Financial Statements Launcher */}
        <div 
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

        {/* Smart Spaces & Training Halls Quick Launcher */}
        <div 
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

        {/* Doc Wizard Quick Launcher Banner */}
        <div 
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
      </div>

      {/* Due Dates & Upcoming Obligations Smart Alerts Center */}
      <DueDatesAlertsCenter
        vouchers={vouchers}
        purchases={purchases}
        companySettings={companySettings}
        onViewVoucher={onViewVoucher}
        onNavigateTab={onNavigateTab}
      />

      {/* 2. Core Action Launcher */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{t("quickActions")}</h2>
            <p className="text-xs text-slate-500 font-medium">
              {language === "ar" ? "اختر العملية المطلوبة للبدء الفوري" : "Select an action below to start immediately"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Action 1: Receipt Voucher */}
          <button
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

          {/* Action 2: Tax Invoice */}
          <button
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

          {/* Action 3: Quotation */}
          <button
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

          {/* Action 4: Payment Voucher */}
          <button
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

        </div>

        {/* Extended Modules: Inventory, Purchases, Branches, Recurring Schedules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          
          {/* Inventory Card */}
          <div
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

          {/* Purchases Card */}
          <div
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

          {/* Branches Card */}
          <div
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

          {/* Recurring Schedules & Installments Card */}
          <div
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

        </div>

      </div>

      {/* 3. Simplified Executive Report */}
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

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Total Revenue */}
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

          {/* Total Expenses / Payments */}
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

          {/* Total Purchases */}
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

          {/* Inventory Valuation */}
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

        </div>
      </div>

      {/* Visual Analytics & Financial Metrics Section (Charts with Recharts) */}
      <DashboardAnalytics
        vouchers={vouchers}
        purchases={purchases}
        inventory={inventory}
        customers={customers}
        companySettings={companySettings}
      />

      {/* 4. Dual Section: Recent Documents & Quick Client Picker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Transactions (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
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

        {/* Quick Customer Directory (1 col) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
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

      </div>

    </div>
  );
};
