import React, { useState, useMemo } from "react";
import {
  ReceiptVoucher,
  PurchaseInvoice,
  CompanySettings
} from "../types";
import { useLanguage } from "../utils/LanguageContext";
import { formatDateToDDMMMMYYYY } from "../utils/dateFormatter";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Eye,
  ArrowUpRight,
  ArrowDownLeft,
  FileSpreadsheet,
  FileText,
  Filter,
  ChevronRight,
  ChevronLeft,
  Bell,
  Sparkles,
  Search,
  ExternalLink
} from "lucide-react";

export interface DueDatesAlertItem {
  id: string;
  sourceType: "VOUCHER" | "PURCHASE" | "QUOTATION";
  number: string;
  partyName: string;
  partyPhone?: string;
  amount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  status: string;
  urgency: "OVERDUE" | "DUE_TODAY" | "DUE_SOON" | "QUOTATION_OPEN";
  daysDiff: number; // negative = overdue, 0 = today, positive = days left
  rawVoucher?: ReceiptVoucher;
  rawPurchase?: PurchaseInvoice;
}

interface DueDatesAlertsCenterProps {
  vouchers: ReceiptVoucher[];
  purchases?: PurchaseInvoice[];
  companySettings?: CompanySettings;
  onViewVoucher: (voucher: ReceiptVoucher) => void;
  onMarkVoucherPaid?: (voucherId: string) => void;
  onPostponeDueDate?: (voucherId: string, daysToAdd: number) => void;
  onNavigateTab?: (tab: any) => void;
}

export const DueDatesAlertsCenter: React.FC<DueDatesAlertsCenterProps> = ({
  vouchers,
  purchases = [],
  companySettings,
  onViewVoucher,
  onMarkVoucherPaid,
  onPostponeDueDate,
  onNavigateTab
}) => {
  const { language, t, isRTL } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<"ALL" | "OVERDUE" | "TODAY" | "SOON" | "QUOTATIONS">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const todayDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Compute all alert items
  const alertItems = useMemo<DueDatesAlertItem[]>(() => {
    const items: DueDatesAlertItem[] = [];

    // 1. Process Vouchers (TAX_INVOICE, RECEIPT, PAYMENT)
    vouchers.forEach((v) => {
      if (v.status === "PAID" || v.status === "CANCELLED") return;

      const targetDueDate = v.dueDate || v.date;
      if (!targetDueDate) return;

      const due = new Date(targetDueDate);
      due.setHours(0, 0, 0, 0);

      const diffTime = due.getTime() - todayDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (v.type === "QUOTATION") {
        // Open quotation
        items.push({
          id: v.id,
          sourceType: "QUOTATION",
          number: v.voucherNumber,
          partyName: v.receivedFrom || (language === "ar" ? "عميل غير محدد" : "Unnamed Client"),
          partyPhone: v.payerPhone,
          amount: v.totalAmount,
          currency: v.currency,
          issueDate: v.date,
          dueDate: targetDueDate,
          status: v.status,
          urgency: "QUOTATION_OPEN",
          daysDiff: diffDays,
          rawVoucher: v
        });
      } else {
        // Invoices and Payment vouchers with due dates
        let urgency: DueDatesAlertItem["urgency"] = "DUE_SOON";
        if (diffDays < 0) {
          urgency = "OVERDUE";
        } else if (diffDays === 0) {
          urgency = "DUE_TODAY";
        } else if (diffDays <= 14) {
          urgency = "DUE_SOON";
        } else {
          return; // Beyond 14 days, don't trigger urgent alert
        }

        items.push({
          id: v.id,
          sourceType: "VOUCHER",
          number: v.voucherNumber,
          partyName: v.receivedFrom || (language === "ar" ? "عميل / مورد" : "Party"),
          partyPhone: v.payerPhone,
          amount: v.totalAmount,
          currency: v.currency,
          issueDate: v.date,
          dueDate: targetDueDate,
          status: v.status,
          urgency,
          daysDiff: diffDays,
          rawVoucher: v
        });
      }
    });

    // 2. Process Purchases with due dates
    purchases.forEach((p) => {
      if (p.paymentStatus === "PAID" || p.status === "CANCELLED") return;
      const targetDueDate = p.dueDate || p.date;
      if (!targetDueDate) return;

      const due = new Date(targetDueDate);
      due.setHours(0, 0, 0, 0);

      const diffTime = due.getTime() - todayDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      let urgency: DueDatesAlertItem["urgency"] = "DUE_SOON";
      if (diffDays < 0) {
        urgency = "OVERDUE";
      } else if (diffDays === 0) {
        urgency = "DUE_TODAY";
      } else if (diffDays <= 14) {
        urgency = "DUE_SOON";
      } else {
        return;
      }

      items.push({
        id: p.id,
        sourceType: "PURCHASE",
        number: p.purchaseNumber,
        partyName: p.supplierName,
        partyPhone: p.supplierPhone,
        amount: p.totalAmount,
        currency: p.currency,
        issueDate: p.date,
        dueDate: targetDueDate,
        status: p.paymentStatus,
        urgency,
        daysDiff: diffDays,
        rawPurchase: p
      });
    });

    // Sort by urgency: Overdue first (most negative diffDays), then Today (0), then Soon, then Quotations
    return items.sort((a, b) => a.daysDiff - b.daysDiff);
  }, [vouchers, purchases, todayDate, language]);

  // Counts by urgency
  const countOverdue = alertItems.filter((i) => i.urgency === "OVERDUE").length;
  const countToday = alertItems.filter((i) => i.urgency === "DUE_TODAY").length;
  const countSoon = alertItems.filter((i) => i.urgency === "DUE_SOON").length;
  const countQuotations = alertItems.filter((i) => i.urgency === "QUOTATION_OPEN").length;

  const totalOverdueAmount = alertItems
    .filter((i) => i.urgency === "OVERDUE")
    .reduce((sum, i) => sum + i.amount, 0);

  // Filtered list
  const filteredItems = useMemo(() => {
    return alertItems.filter((item) => {
      // Tab filter
      if (activeFilter === "OVERDUE" && item.urgency !== "OVERDUE") return false;
      if (activeFilter === "TODAY" && item.urgency !== "DUE_TODAY") return false;
      if (activeFilter === "SOON" && item.urgency !== "DUE_SOON") return false;
      if (activeFilter === "QUOTATIONS" && item.urgency !== "QUOTATION_OPEN") return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.partyName.toLowerCase().includes(q);
        const matchNum = item.number.toLowerCase().includes(q);
        const matchAmount = item.amount.toString().includes(q);
        if (!matchName && !matchNum && !matchAmount) return false;
      }
      return true;
    });
  }, [alertItems, activeFilter, searchQuery]);

  const sendWhatsAppReminder = (item: DueDatesAlertItem) => {
    const phoneClean = item.partyPhone ? item.partyPhone.replace(/[^0-9]/g, "") : "";
    const currencyName = item.currency || "OMR";
    const companyTitle = companySettings?.companyName || (language === "ar" ? "ديشال لإدارة الأعمال" : "Deshal Business ERP");
    let message = "";

    if (item.sourceType === "QUOTATION") {
      message = language === "ar"
        ? `مرحباً ${item.partyName}، نود متابعة عرض السعر رقم (${item.number}) الصادر من ${companyTitle} بمبلغ ${item.amount.toLocaleString()} ${currencyName}. هل لديكم أي استفسار أو تفاصيل ترغبون بمناقشتها؟ شكراً لثقتكم.`
        : `Hello ${item.partyName}, following up on Price Quotation #${item.number} from ${companyTitle} for ${item.amount.toLocaleString()} ${currencyName}. Please let us know if you have any questions. Thank you.`;
    } else {
      const statusWord = item.daysDiff < 0 ? (language === "ar" ? "المستحقة السداد" : "overdue") : (language === "ar" ? "المستحقة قريباً" : "due soon");
      message = language === "ar"
        ? `تحية طيبة ${item.partyName}، نود تذكيركم بلطف بالفاتورة / السند رقم (${item.number}) ${statusWord} بتاريخ استحقاق (${item.dueDate}) بقيمة ${item.amount.toLocaleString()} ${currencyName} لصالح ${companyTitle}. يرجى التكرم بالسداد في أقرب وقت شاكرين تعاونكم.`
        : `Dear ${item.partyName}, this is a gentle reminder regarding invoice #${item.number} (${statusWord}) due on ${item.dueDate} for amount ${item.amount.toLocaleString()} ${currencyName} to ${companyTitle}. Thank you.`;
    }

    const encoded = encodeURIComponent(message);
    const url = phoneClean ? `https://wa.me/${phoneClean}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, "_blank");
  };

  if (alertItems.length === 0) {
    return null; // All clean, no pending alerts needed
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6" dir={isRTL ? "rtl" : "ltr"}>
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 bg-gradient-to-br from-amber-500 to-rose-500 text-white rounded-2xl shadow-md">
            <Bell className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-black text-white">
              {alertItems.length}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                {language === "ar" ? "مركز التنبيهات والمستحقات الذكي" : "Smart Financial Due Dates & Follow-ups"}
              </h2>
              {countOverdue > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-black bg-rose-100 text-rose-700 rounded-full border border-rose-200">
                  {countOverdue} {language === "ar" ? "متأخرة" : "Overdue"}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === "ar"
                ? "فحص تلقائي لمواعيد استحقاق الفواتير، السندات، وعروض الأسعار التي تتطلب متابعة"
                : "Real-time automated tracking of pending invoice dues, quotations & receivables"}
            </p>
          </div>
        </div>

        {/* Quick Overdue Amount Callout */}
        <div className="flex items-center gap-2">
          {countOverdue > 0 && (
            <div className="bg-rose-50 border border-rose-200 px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>
                {language === "ar" ? "إجمالي المتأخرات:" : "Total Overdue:"}{" "}
                <span className="font-mono font-black text-rose-700">
                  {totalOverdueAmount.toLocaleString()} {companySettings?.defaultCurrency || "OMR"}
                </span>
              </span>
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors text-xs font-semibold cursor-pointer"
          >
            {collapsed ? (language === "ar" ? "إظهار التفاصيل" : "Expand") : (language === "ar" ? "طي التنبيهات" : "Collapse")}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="space-y-4 animate-fadeIn">
          {/* Filter Pills & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setActiveFilter("ALL")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeFilter === "ALL" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {language === "ar" ? "الكل" : "All"} ({alertItems.length})
              </button>

              <button
                onClick={() => setActiveFilter("OVERDUE")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === "OVERDUE" ? "bg-rose-600 text-white shadow-xs font-bold" : "text-rose-700 hover:bg-rose-50"
                }`}
              >
                <span>{language === "ar" ? "متأخرة السداد" : "Overdue"}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeFilter === "OVERDUE" ? "bg-rose-700" : "bg-rose-100"}`}>
                  {countOverdue}
                </span>
              </button>

              <button
                onClick={() => setActiveFilter("TODAY")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === "TODAY" ? "bg-amber-600 text-white shadow-xs font-bold" : "text-amber-700 hover:bg-amber-50"
                }`}
              >
                <span>{language === "ar" ? "اليوم" : "Due Today"}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeFilter === "TODAY" ? "bg-amber-700" : "bg-amber-100"}`}>
                  {countToday}
                </span>
              </button>

              <button
                onClick={() => setActiveFilter("SOON")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === "SOON" ? "bg-blue-600 text-white shadow-xs font-bold" : "text-blue-700 hover:bg-blue-50"
                }`}
              >
                <span>{language === "ar" ? "خلال 14 يوم" : "Due Soon"}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeFilter === "SOON" ? "bg-blue-700" : "bg-blue-100"}`}>
                  {countSoon}
                </span>
              </button>

              <button
                onClick={() => setActiveFilter("QUOTATIONS")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === "QUOTATIONS" ? "bg-purple-600 text-white shadow-xs font-bold" : "text-purple-700 hover:bg-purple-50"
                }`}
              >
                <span>{language === "ar" ? "عروض أسعار للمتابعة" : "Quotations"}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeFilter === "QUOTATIONS" ? "bg-purple-700" : "bg-purple-100"}`}>
                  {countQuotations}
                </span>
              </button>
            </div>

            {/* Quick search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === "ar" ? "بحث برقم الفاتورة أو العميل..." : "Search due item..."}
                className="w-full sm:w-56 pl-3 pr-9 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredItems.map((item) => {
              const isOverdue = item.urgency === "OVERDUE";
              const isToday = item.urgency === "DUE_TODAY";
              const isQuotation = item.urgency === "QUOTATION_OPEN";

              const borderClass = isOverdue
                ? "border-rose-200 bg-rose-50/40 hover:border-rose-300"
                : isToday
                ? "border-amber-200 bg-amber-50/40 hover:border-amber-300"
                : isQuotation
                ? "border-purple-200 bg-purple-50/40 hover:border-purple-300"
                : "border-blue-200 bg-blue-50/40 hover:border-blue-300";

              const badgeColor = isOverdue
                ? "bg-rose-100 text-rose-800 border-rose-200"
                : isToday
                ? "bg-amber-100 text-amber-800 border-amber-200"
                : isQuotation
                ? "bg-purple-100 text-purple-800 border-purple-200"
                : "bg-blue-100 text-blue-800 border-blue-200";

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border ${borderClass} transition-all shadow-2xs flex flex-col justify-between space-y-3`}
                >
                  <div className="space-y-2">
                    {/* Top Row: Tag + Due Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${badgeColor}`}>
                        {isOverdue
                          ? (language === "ar" ? `متأخر ${Math.abs(item.daysDiff)} يوم` : `${Math.abs(item.daysDiff)}d Overdue`)
                          : isToday
                          ? (language === "ar" ? "مستحق اليوم!" : "Due Today!")
                          : isQuotation
                          ? (language === "ar" ? "عرض سعر معلق" : "Open Quotation")
                          : (language === "ar" ? `مستحق خلال ${item.daysDiff} يوم` : `Due in ${item.daysDiff}d`)}
                      </span>

                      <span className="text-[11px] font-mono text-slate-500">
                        {item.number}
                      </span>
                    </div>

                    {/* Party & Amount */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {item.partyName}
                      </h4>
                      <p className="text-base font-black font-mono text-slate-900 mt-0.5">
                        {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {item.currency}
                      </p>
                    </div>

                    {/* Due Date Indicator */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {language === "ar" ? "تاريخ الاستحقاق:" : "Due Date:"}{" "}
                        <span className="font-semibold text-slate-700">{formatDateToDDMMMMYYYY(item.dueDate)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      {/* WhatsApp Reminder */}
                      <button
                        onClick={() => sendWhatsAppReminder(item)}
                        className="p-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl transition-colors cursor-pointer"
                        title={language === "ar" ? "إرسال تذكير واتساب" : "WhatsApp Reminder"}
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                      </button>

                      {/* View Document */}
                      {item.rawVoucher && (
                        <button
                          onClick={() => onViewVoucher(item.rawVoucher!)}
                          className="p-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-xl transition-colors cursor-pointer"
                          title={language === "ar" ? "عرض وطباعة السند" : "View Voucher"}
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-700" />
                        </button>
                      )}

                      {/* Postpone due date */}
                      {item.rawVoucher && onPostponeDueDate && (
                        <button
                          onClick={() => onPostponeDueDate(item.rawVoucher!.id, 7)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                          title={language === "ar" ? "تأجيل الاستحقاق أسبوع" : "Snooze +7 Days"}
                        >
                          +7d
                        </button>
                      )}
                    </div>

                    {/* Mark as Paid button */}
                    {item.rawVoucher && (
                      <button
                        onClick={() => onMarkVoucherPaid(item.rawVoucher!.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{language === "ar" ? "سداد الآن" : "Mark Paid"}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
