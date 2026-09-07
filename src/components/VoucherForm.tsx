import React, { useState, useEffect, useMemo } from "react";
import {
  ReceiptVoucher,
  VoucherType,
  PaymentMethod,
  VoucherStatus,
  LineItem,
  CustomField,
  Customer,
  Branch,
  DiscountType,
  InventoryItem
} from "../types";
import { numberToWords } from "../utils/numberToWords";
import { generateUuid } from "../utils/uuid";
import { formatDateToDDMMMMYYYY } from "../utils/dateFormatter";
import { useLanguage } from "../utils/LanguageContext";
import { loadVouchers } from "../utils/storage";
import { AddCustomerModal } from "./crm/AddCustomerModal";
import { fetchNextVoucherNumber } from "../lib/supabase/accountingService";
import { searchCustomersServerSide } from "../lib/supabase/customerService";
import { searchProductsAndServicesServerSide } from "../lib/supabase/masterDataService";
import {
  Plus,
  Trash2,
  RefreshCw,
  Sparkles,
  DollarSign,
  Calendar,
  User,
  CreditCard,
  Building,
  FileText,
  CheckCircle2,
  BookmarkPlus,
  Sparkles as WizardIcon,
  Layers,
  Lock,
  Edit2,
  QrCode,
  Upload,
  AlertCircle,
  Search,
  Percent,
  ShieldAlert,
  ExternalLink,
  Receipt,
  FileSpreadsheet,
  Link,
  CheckSquare,
  Building2,
  Coins
} from "lucide-react";

import { loadCompanySettings } from "../utils/storage";
import { CompanySettings } from "../types";

interface VoucherFormProps {
  voucher: ReceiptVoucher;
  onChange: (updated: ReceiptVoucher) => void;
  onSave: () => void;
  onPreview: () => void;
  onOpenAiAssistant: () => void;
  onSwitchToDocWizard?: () => void;
  customers?: Customer[];
  branches?: Branch[];
  companyId?: string;
  companySettings?: CompanySettings;
  onQuickSaveCustomer?: (customer: Customer) => void;
}

export const VoucherForm: React.FC<VoucherFormProps> = ({
  voucher,
  onChange,
  onSave,
  onPreview,
  onOpenAiAssistant,
  onSwitchToDocWizard,
  customers = [],
  branches = [],
  companyId = "00000000-0000-0000-0000-000000000001",
  companySettings,
  onQuickSaveCustomer
}) => {
  const { language, t, dir, isRTL } = useLanguage();
  const settings = companySettings || loadCompanySettings();

  // State for Number editing lock ✎
  const [isNumberLocked, setIsNumberLocked] = useState(true);
  const [showEditReasonModal, setShowEditReasonModal] = useState(false);
  const [editReason, setEditReason] = useState("");

  // State for Add Customer Modal
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);

  // State for Customer Search Combobox
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Customer[]>(customers);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // State for Products Master Catalog Search
  const [masterProducts, setMasterProducts] = useState<InventoryItem[]>([]);

  // Existing tax invoices for linking
  const existingInvoices = useMemo(() => {
    return loadVouchers().filter((v) => v.type === "TAX_INVOICE");
  }, []);

  // Auto-generate number on initial load if empty
  useEffect(() => {
    if (!voucher.voucherNumber || voucher.voucherNumber.trim() === "" || voucher.voucherNumber === "Draft") {
      fetchNextVoucherNumber(companyId, voucher.type, voucher.branchId).then((num) => {
        onChange({ ...voucher, voucherNumber: num });
      });
    }
  }, [voucher.type, voucher.branchId]);

  // Load Master Products Catalog
  useEffect(() => {
    searchProductsAndServicesServerSide(companyId, "").then((res) => {
      setMasterProducts(res.products);
    });
  }, [companyId]);

  // Customer Server-side search effect
  useEffect(() => {
    if (customerSearchQuery.trim().length > 1) {
      setIsSearchingCustomers(true);
      searchCustomersServerSide(companyId, customerSearchQuery).then((res) => {
        setSearchResults(res.customers);
        setIsSearchingCustomers(false);
      });
    } else {
      setSearchResults(customers);
    }
  }, [customerSearchQuery, companyId, customers]);

  // Recompute totals with Discount Type (% vs Fixed)
  const computeTotals = (
    items: LineItem[],
    taxRate: number,
    discType: DiscountType = voucher.discountType || "FIXED",
    discVal: number = voucher.discountValue || 0
  ) => {
    const calculatedSubtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    let calculatedDiscountAmt = 0;
    if (discType === "PERCENTAGE") {
      const pct = Math.min(100, Math.max(0, discVal));
      calculatedDiscountAmt = (calculatedSubtotal * pct) / 100;
    } else {
      calculatedDiscountAmt = Math.min(calculatedSubtotal, Math.max(0, discVal));
    }

    const netAfterDiscount = Math.max(0, calculatedSubtotal - calculatedDiscountAmt);
    const calculatedTax = (netAfterDiscount * (taxRate || 0)) / 100;
    const calculatedTotal = Math.max(0, netAfterDiscount + calculatedTax);

    return {
      subtotal: calculatedSubtotal,
      discountAmount: calculatedDiscountAmt,
      taxAmount: calculatedTax,
      totalAmount: calculatedTotal
    };
  };

  const handleFieldChange = (field: keyof ReceiptVoucher, value: any) => {
    const updated = { ...voucher, [field]: value, updatedAt: new Date().toISOString() };

    if (
      field === "lineItems" ||
      field === "taxRate" ||
      field === "discountType" ||
      field === "discountValue" ||
      field === "discountAmount"
    ) {
      const totals = computeTotals(
        field === "lineItems" ? value : voucher.lineItems,
        field === "taxRate" ? value : voucher.taxRate,
        field === "discountType" ? value : voucher.discountType || "FIXED",
        field === "discountValue" ? value : voucher.discountValue || 0
      );
      updated.subtotal = totals.subtotal;
      updated.discountAmount = totals.discountAmount;
      updated.taxAmount = totals.taxAmount;
      updated.totalAmount = totals.totalAmount;
      updated.amount = totals.totalAmount;

      // Recalculate remaining amount for receipt voucher
      const paidAmt = updated.paidAmount ?? totals.totalAmount;
      updated.paidAmount = paidAmt;
      updated.remainingAmount = Math.max(0, totals.totalAmount - paidAmt);

      if (!updated.isCustomWords) {
        updated.amountInWords = numberToWords(totals.totalAmount, updated.currency, language);
      }
    }

    if (field === "paidAmount") {
      const paidAmt = Number(value) || 0;
      updated.paidAmount = paidAmt;
      updated.remainingAmount = Math.max(0, (updated.totalAmount || updated.amount || 0) - paidAmt);
    }

    if (field === "type") {
      fetchNextVoucherNumber(companyId, value, voucher.branchId).then((num) => {
        onChange({ ...updated, voucherNumber: num });
      });
      return;
    }

    if (field === "currency" && !updated.isCustomWords) {
      updated.amountInWords = numberToWords(updated.totalAmount, value, language);
    }

    onChange(updated);
  };

  // Add line item from master catalog or blank
  const handleAddLineItem = (masterItem?: InventoryItem) => {
    const newItem: LineItem = {
      id: "item-" + Date.now(),
      itemId: masterItem?.id,
      sku: masterItem?.sku || "",
      description: masterItem ? `${masterItem.name} (${masterItem.sku})` : "",
      quantity: 1,
      unitPrice: masterItem ? masterItem.sellingPrice : 0,
      amount: masterItem ? masterItem.sellingPrice : 0,
      unit: masterItem?.unit || "حبة"
    };
    const updatedItems = [...voucher.lineItems, newItem];
    handleFieldChange("lineItems", updatedItems);
  };

  const handleRemoveLineItem = (id: string) => {
    if (voucher.lineItems.length <= 1) return;
    const updatedItems = voucher.lineItems.filter((i) => i.id !== id);
    handleFieldChange("lineItems", updatedItems);
  };

  const handleLineItemChange = (id: string, prop: keyof LineItem, val: any) => {
    const updatedItems = voucher.lineItems.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item, [prop]: val };
        if (prop === "quantity" || prop === "unitPrice") {
          const qty = prop === "quantity" ? Number(val) : item.quantity;
          const price = prop === "unitPrice" ? Number(val) : item.unitPrice;
          updatedItem.amount = (qty || 0) * (price || 0);
        }
        return updatedItem;
      }
      return item;
    });
    handleFieldChange("lineItems", updatedItems);
  };

  // Handle POS Last 4 Digits validation
  const handlePosLastFourChange = (val: string) => {
    const cleaned = val.replace(/[^0-9]/g, "").slice(0, 4);
    handleFieldChange("posLastFour", cleaned);
  };

  // Select customer from combobox
  const handleSelectCustomer = (c: Customer) => {
    onChange({
      ...voucher,
      receivedFrom: c.name,
      payerPhone: c.phone || voucher.payerPhone,
      payerEmail: c.email || voucher.payerEmail,
      payerAddress: c.address || voucher.payerAddress,
      payerTaxId: c.taxId || voucher.payerTaxId,
      updatedAt: new Date().toISOString()
    });
    setShowCustomerDropdown(false);
  };

  // Confirm Voucher Number edit
  const handleConfirmNumberEdit = () => {
    if (!editReason.trim()) {
      alert(isRTL ? "يرجى كتابة سبب تعديل رقم السند لتسجيله في سجل الرقابة Audit Trail" : "Please specify reason for editing number");
      return;
    }
    setIsNumberLocked(false);
    setShowEditReasonModal(false);
  };

  const getVoucherTypeLabel = (type: VoucherType) => {
    switch (type) {
      case "RECEIPT":
        return isRTL ? "سند قبض مالي" : "RECEIPT VOUCHER";
      case "TAX_INVOICE":
        return isRTL ? "فاتورة ضريبية" : "TAX INVOICE";
      case "QUOTATION":
        return isRTL ? "عرض سعر / عمل" : "PRICE QUOTATION";
      case "PAYMENT":
        return isRTL ? "سند صرف ومصروفات" : "PAYMENT VOUCHER";
      case "PETTY_CASH":
      default:
        return isRTL ? "سند عهدة نثرية" : "PETTY CASH VOUCHER";
    }
  };

  const getTypeThemeColor = (type: VoucherType) => {
    switch (type) {
      case "RECEIPT":
        return { border: "border-indigo-600", bg: "bg-indigo-600", lightBg: "bg-indigo-50", text: "text-indigo-700" };
      case "TAX_INVOICE":
        return { border: "border-emerald-600", bg: "bg-emerald-600", lightBg: "bg-emerald-50", text: "text-emerald-700" };
      case "QUOTATION":
        return { border: "border-purple-600", bg: "bg-purple-600", lightBg: "bg-purple-50", text: "text-purple-700" };
      case "PAYMENT":
        return { border: "border-amber-600", bg: "bg-amber-600", lightBg: "bg-amber-50", text: "text-amber-700" };
      case "PETTY_CASH":
      default:
        return { border: "border-slate-700", bg: "bg-slate-800", lightBg: "bg-slate-100", text: "text-slate-800" };
    }
  };

  const currentTheme = getTypeThemeColor(voucher.type);
  const qrVerificationUrl = `https://erp.deshalbm.com/verify-invoice?id=${voucher.id}&token=${voucher.verificationToken || 'sec-token-2026'}`;

  const currentPaidAmt = voucher.paidAmount ?? voucher.amount ?? voucher.totalAmount;
  const currentRemainingAmt = voucher.remainingAmount ?? Math.max(0, voucher.totalAmount - currentPaidAmt);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 font-sans" dir={dir}>
      {/* Modal: Edit Voucher Number Reason Confirmation */}
      {showEditReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-600">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-base font-black text-slate-900">{isRTL ? "تأكيد تعديل رقم السند الرسمي" : "Confirm Voucher Number Override"}</h3>
            </div>
            <p className="text-xs text-slate-600">
              {isRTL
                ? "تغيير رقم السند يؤثر على التسلسل المحاسبي التلقائي. يرجى إدخال سبب التعديل لتسجيله في سجل الأنشطة والرقابة Audit Log:"
                : "Changing voucher number affects atomic accounting sequence. Enter reason for audit log:"}
            </p>
            <textarea
              rows={2}
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              placeholder={isRTL ? "مثال: بناءً على توجيهات التدقيق الخارجي / موافقة المدير المالي..." : "e.g. Approved by Finance Controller..."}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEditReasonModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleConfirmNumberEdit}
                className="px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs"
              >
                {isRTL ? "تأكيد فك القفل والتعديل" : "Unlock & Edit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Modal: Add New Customer */}
      <AddCustomerModal
        isOpen={isAddCustomerModalOpen}
        onClose={() => setIsAddCustomerModalOpen(false)}
        companyId={companyId}
        initialName={voucher.receivedFrom}
        initialPhone={voucher.payerPhone}
        onCustomerCreated={(c) => {
          handleSelectCustomer(c);
          if (onQuickSaveCustomer) onQuickSaveCustomer(c);
        }}
      />

      {/* Top Header & Interactive Document Selector Bar */}
      <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-black rounded-lg bg-indigo-500 text-white uppercase tracking-wider">
              {isRTL ? "محرر القوالب التفاعلي Live Document Canvas" : "Live Document Canvas"}
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-black mt-1">
            {isRTL ? "الكتابة والصياغة المباشرة في المستند" : "Interactive Live Document Authoring"}
          </h1>
          <p className="text-xs text-slate-300">
            {isRTL
              ? "يتم تدوين الحقول والبيانات مباشرة داخل ورقة النموذج المستهدف تماماً كما تظهر للعميل."
              : "Edit fields directly on the final document paper sheet."}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onSwitchToDocWizard && (
            <button
              onClick={onSwitchToDocWizard}
              type="button"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-black rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs hover:shadow-md cursor-pointer transition-all"
            >
              <WizardIcon className="w-4 h-4 text-amber-300" />
              <span>{t("tabDocWizard")}</span>
            </button>
          )}

          <button
            onClick={onOpenAiAssistant}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-purple-950/80 text-purple-200 hover:bg-purple-900 border border-purple-800 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>{t("aiAssistTitle")}</span>
          </button>

          <button
            onClick={onPreview}
            type="button"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-slate-300" />
            <span>{t("tabPreview")}</span>
          </button>

          <button
            onClick={onSave}
            type="button"
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-black rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{t("saveVoucher")}</span>
          </button>
        </div>
      </div>

      {/* Document Type Switcher Pills */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-2 justify-center sm:justify-start">
        {[
          { type: "RECEIPT", label: isRTL ? "سند قبض مالي" : "Receipt Voucher", icon: Receipt },
          { type: "TAX_INVOICE", label: isRTL ? "فاتورة ضريبية" : "Tax Invoice", icon: FileText },
          { type: "QUOTATION", label: isRTL ? "عرض سعر / عمل" : "Quotation", icon: FileSpreadsheet },
          { type: "PAYMENT", label: isRTL ? "سند صرف ومصروفات" : "Payment Voucher", icon: DollarSign },
          { type: "PETTY_CASH", label: isRTL ? "سند عهدة نثرية" : "Petty Cash Voucher", icon: CreditCard }
        ].map((item) => {
          const Icon = item.icon;
          const isActive = voucher.type === item.type;
          return (
            <button
              key={item.type}
              type="button"
              onClick={() => handleFieldChange("type", item.type as VoucherType)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                isActive
                  ? `${currentTheme.bg} text-white shadow-md scale-102`
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Interactive Paper Template Canvas Stage */}
      <div className="bg-slate-200/80 p-3 sm:p-6 md:p-8 rounded-3xl border border-slate-300 shadow-inner flex justify-center">
        <div className={`bg-white w-full max-w-4xl p-6 sm:p-10 rounded-2xl shadow-2xl border-t-8 ${currentTheme.border} border-x border-b border-slate-300 relative font-sans space-y-6 transition-all`}>
          
          {/* Paper Letterhead Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-6 gap-6">
            
            {/* Dynamic Company Branding & Logo Details */}
            <div className="space-y-1.5 max-w-md">
              <div className="flex items-center gap-3">
                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt={settings.companyName || "Logo"}
                    className="h-12 w-auto object-contain max-w-[160px] shrink-0"
                  />
                ) : (
                  <div className={`p-2.5 rounded-2xl ${currentTheme.lightBg} ${currentTheme.text} shrink-0`}>
                    <Building2 className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                    {settings.companyName || "شركة دِشال للحلول الذكية"}
                  </h2>
                  {settings.tagline && (
                    <p className="text-[11px] text-slate-500 font-semibold">{settings.tagline}</p>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-slate-600 font-medium">
                {[settings.address, settings.cityStateZip, settings.country].filter(Boolean).join(" | ")}
              </p>
              <div className="text-[10px] text-slate-500 font-mono flex flex-wrap gap-x-2 font-semibold">
                {settings.email && <span>{settings.email}</span>}
                {settings.phone && <span>• {settings.phone}</span>}
                {settings.taxId && <span>• VAT: {settings.taxId}</span>}
                {settings.crNumber && <span>• CR: {settings.crNumber}</span>}
              </div>
            </div>

            {/* Document Title & Number Badge Input */}
            <div className="sm:text-right space-y-3 w-full sm:w-auto">
              <div className={`inline-block ${currentTheme.bg} text-white px-5 py-2 rounded-xl font-black text-sm uppercase tracking-wider shadow-sm`}>
                {getVoucherTypeLabel(voucher.type)}
              </div>

              {/* Document Number with Atomic Lock */}
              <div className="space-y-1">
                <div className="flex items-center justify-end gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500">{t("voucherNumber")}:</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      readOnly={isNumberLocked}
                      value={voucher.voucherNumber}
                      onChange={(e) => handleFieldChange("voucherNumber", e.target.value)}
                      className={`px-3 py-1.5 text-xs font-mono font-black rounded-xl border text-center transition-all ${
                        isNumberLocked
                          ? "bg-slate-100 border-slate-300 text-slate-900 select-none"
                          : "bg-amber-50 border-amber-400 text-slate-900 focus:ring-2 focus:ring-amber-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (isNumberLocked) {
                          setShowEditReasonModal(true);
                        } else {
                          setIsNumberLocked(true);
                        }
                      }}
                      className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-600"
                    >
                      {isNumberLocked ? <Edit2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Metadata Fields Line */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block">{t("date")}</label>
                    <input
                      type="date"
                      value={voucher.date}
                      onChange={(e) => handleFieldChange("date", e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block">{t("currency")}</label>
                    <select
                      value={voucher.currency}
                      onChange={(e) => handleFieldChange("currency", e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 bg-slate-50 font-bold"
                    >
                      <option value="OMR">OMR (ريال عماني)</option>
                      <option value="AED">AED (درهم إماراتي)</option>
                      <option value="SAR">SAR (ريال سعودي)</option>
                      <option value="USD">USD ($ US Dollar)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block">{t("referenceNumber")}</label>
                    <input
                      type="text"
                      value={voucher.referenceNo || ""}
                      onChange={(e) => handleFieldChange("referenceNo", e.target.value)}
                      placeholder="REF-1092"
                      className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 bg-slate-50 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block">{isRTL ? "الفرع المصدر" : "Branch"}</label>
                    <select
                      value={voucher.branchId || (branches[0]?.id ?? "")}
                      onChange={(e) => {
                        const br = branches.find((b) => b.id === e.target.value);
                        onChange({
                          ...voucher,
                          branchId: e.target.value,
                          branchName: br ? br.name : undefined
                        });
                      }}
                      className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 bg-slate-50 font-bold"
                    >
                      {branches.map((br) => (
                        <option key={br.id} value={br.id}>
                          {br.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Party Letterhead Block (Customer / Payee Inline Details) */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <User className={`w-4 h-4 ${currentTheme.text}`} />
                <span>{voucher.type === "PAYMENT" ? isRTL ? "صرف إلى المكرم / السادة:" : "Paid To (Payee):" : isRTL ? "استلمنا من الفاضل / السادة:" : "Received From (Client):"}</span>
              </span>

              <button
                type="button"
                onClick={() => setIsAddCustomerModalOpen(true)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isRTL ? "+ إضافة عميل جديد" : "+ Add Customer"}</span>
              </button>
            </div>

            {/* Combobox Search inside document sheet */}
            <div className="relative">
              <input
                type="text"
                value={voucher.receivedFrom}
                onChange={(e) => {
                  handleFieldChange("receivedFrom", e.target.value);
                  setCustomerSearchQuery(e.target.value);
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                placeholder={isRTL ? "اكتب اسم العميل أو ابحث في قاعدة البيانات..." : "Type client name or search DB..."}
                className="w-full px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />

              {showCustomerDropdown && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {searchResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCustomer(c)}
                      className="w-full text-start p-3 hover:bg-indigo-50 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">{c.name}</div>
                        <div className="text-[10px] text-slate-500">
                          {c.phone} {c.city ? `• ${c.city}` : ""} {c.taxId ? `• VAT: ${c.taxId}` : ""}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {c.type}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sub-fields directly on paper sheet */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block">{t("customerPhone")}</label>
                <input
                  type="text"
                  value={voucher.payerPhone || ""}
                  onChange={(e) => handleFieldChange("payerPhone", e.target.value)}
                  placeholder="+968 91234567"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 block">{t("customerEmail")}</label>
                <input
                  type="email"
                  value={voucher.payerEmail || ""}
                  onChange={(e) => handleFieldChange("payerEmail", e.target.value)}
                  placeholder="info@client.com"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 block">{t("taxNumber")}</label>
                <input
                  type="text"
                  value={voucher.payerTaxId || ""}
                  onChange={(e) => handleFieldChange("payerTaxId", e.target.value)}
                  placeholder="OM-VAT-109283"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Master Catalog Line Items Table inside Document Sheet */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileText className={`w-4 h-4 ${currentTheme.text}`} />
                <span>{t("lineItems")} (بنود وخيارات المستند)</span>
              </span>

              <div className="flex items-center gap-2">
                {masterProducts.length > 0 && (
                  <select
                    onChange={(e) => {
                      const prod = masterProducts.find((p) => p.id === e.target.value);
                      if (prod) handleAddLineItem(prod);
                      e.target.value = "";
                    }}
                    defaultValue=""
                    className="px-3 py-1 text-xs font-bold rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 cursor-pointer"
                  >
                    <option value="" disabled>
                      📦 {isRTL ? "إضافة منتج من السجل..." : "Add catalog item..."}
                    </option>
                    {masterProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sellingPrice} OMR)
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={() => handleAddLineItem()}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t("addItem")}</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-300">
              <table className="w-full text-xs" dir={dir}>
                <thead className={`${currentTheme.bg} text-white font-bold uppercase tracking-wider text-[11px]`}>
                  <tr>
                    <th className="p-2.5 w-10 text-center">#</th>
                    <th className={`p-2.5 ${isRTL ? "text-right" : "text-left"}`}>{t("description")}</th>
                    <th className="p-2.5 w-20 text-center">{t("quantity")}</th>
                    <th className={`p-2.5 w-28 ${isRTL ? "text-left" : "text-right"}`}>{t("unitPrice")} ({voucher.currency})</th>
                    <th className={`p-2.5 w-28 ${isRTL ? "text-left" : "text-right"}`}>{t("total")} ({voucher.currency})</th>
                    <th className="p-2.5 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium bg-white">
                  {voucher.lineItems.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-all">
                      <td className="p-2 text-slate-400 font-mono text-center">{idx + 1}</td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleLineItemChange(item.id, "description", e.target.value)}
                          placeholder={isRTL ? "اكتب وصف الخدمة أو المنتج المباشر..." : "Write item description..."}
                          className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleLineItemChange(item.id, "quantity", e.target.value)}
                          className="w-full px-2 py-1 text-xs text-center rounded-lg border border-slate-200 font-mono"
                        />
                      </td>
                      <td className={`p-2 ${isRTL ? "text-left" : "text-right"}`}>
                        <input
                          type="number"
                          step="0.001"
                          value={item.unitPrice}
                          onChange={(e) => handleLineItemChange(item.id, "unitPrice", e.target.value)}
                          className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 font-mono"
                        />
                      </td>
                      <td className={`p-2 font-bold font-mono text-slate-900 ${isRTL ? "text-left" : "text-right"}`}>
                        {item.amount.toFixed(3)}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(item.id)}
                          disabled={voucher.lineItems.length <= 1}
                          className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Document Summary & Totals Block on Paper */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-2">
            
            {/* Notes & Custom Fields */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">{isRTL ? "ملاحظات وتفاصيل إضافية:" : "Notes & Remarks:"}</label>
                <textarea
                  rows={3}
                  value={voucher.notes || ""}
                  onChange={(e) => handleFieldChange("notes", e.target.value)}
                  placeholder={isRTL ? "اكتب أي ملاحظات خاصة بهذا المستند..." : "Add notes here..."}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                />
              </div>

              {/* Custom Fields */}
              {voucher.customFields && voucher.customFields.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    {t("customFields")}
                  </span>
                  {voucher.customFields.map((cf) => (
                    <div key={cf.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={cf.label}
                        readOnly
                        className="w-1/3 px-2 py-1 text-xs rounded-lg border border-slate-200 font-semibold text-slate-700 bg-slate-100"
                      />
                      <input
                        type="text"
                        value={cf.value}
                        onChange={(e) => {
                          const updated = voucher.customFields.map((f) => (f.id === cf.id ? { ...f, value: e.target.value } : f));
                          onChange({ ...voucher, customFields: updated });
                        }}
                        className="w-2/3 px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totals & Receipt Voucher Breakdown Box */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-300 space-y-3 font-mono text-xs shadow-xs">
              <div className="flex justify-between text-slate-600">
                <span className="font-sans font-semibold">{t("subtotal")}:</span>
                <span className="font-bold text-slate-900">
                  {voucher.currency} {voucher.subtotal.toFixed(3)}
                </span>
              </div>

              {/* Discount Selector */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-sans">
                  <span className="text-slate-600 font-semibold">{isRTL ? "الخصم:" : "Discount:"}</span>
                  <select
                    value={voucher.discountType || "FIXED"}
                    onChange={(e) => handleFieldChange("discountType", e.target.value as DiscountType)}
                    className="px-2 py-1 text-[11px] font-bold rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="FIXED">{isRTL ? "ثابت" : "Fixed"}</option>
                    <option value="PERCENTAGE">{isRTL ? "نسبة (%)" : "%"}</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    value={voucher.discountValue || 0}
                    onChange={(e) => handleFieldChange("discountValue", Number(e.target.value))}
                    className="w-16 px-2 py-1 text-xs font-semibold rounded-lg border border-slate-300 bg-white font-mono text-right"
                  />
                </div>
                <span className="font-bold text-red-600">
                  - {voucher.currency} {(voucher.discountAmount || 0).toFixed(3)}
                </span>
              </div>

              {/* Tax Rate */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-sans">
                  <span className="text-slate-600 font-semibold">{t("taxRate")} (%):</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={voucher.taxRate}
                    onChange={(e) => handleFieldChange("taxRate", Number(e.target.value))}
                    className="w-14 px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white text-center font-mono"
                  />
                </div>
                <span className="font-bold text-slate-900">
                  + {voucher.currency} {voucher.taxAmount.toFixed(3)}
                </span>
              </div>

              {/* Total Deal Amount */}
              <div className="border-t border-slate-300 pt-3 flex justify-between items-center text-sm font-black text-slate-900">
                <span className="font-sans uppercase tracking-wider text-xs font-extrabold">{isRTL ? "بلغ الإجمالي:" : "Total Deal Amount:"}</span>
                <span className={`text-lg font-black ${currentTheme.text}`}>
                  {voucher.currency} {voucher.totalAmount.toFixed(3)}
                </span>
              </div>

              {/* RECEIPT VOUCHER SPECIAL FIELDS: Paid Amount, Remaining Balance, Invoice Link */}
              {voucher.type === "RECEIPT" && (
                <div className="space-y-3 pt-3 border-t-2 border-dashed border-slate-300">
                  {/* Paid Amount */}
                  <div className="flex justify-between items-center font-sans">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-1">
                      <Coins className="w-4 h-4 text-emerald-600" />
                      <span>{isRTL ? "المبلغ المدفوع:" : "Paid Amount:"}</span>
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-500">{voucher.currency}</span>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={currentPaidAmt}
                        onChange={(e) => handleFieldChange("paidAmount", e.target.value)}
                        className="w-28 px-2.5 py-1.5 text-xs font-black font-mono rounded-xl border border-emerald-400 bg-emerald-50/60 text-emerald-950 text-right focus:bg-white focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Remaining Balance Display */}
                  <div className="flex justify-between items-center font-sans bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    <span className="text-xs font-black text-amber-900">{isRTL ? "المبلغ المتبقي:" : "Remaining Balance:"}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${currentRemainingAmt <= 0 ? "bg-emerald-200 text-emerald-900" : "bg-amber-200 text-amber-900"}`}>
                        {currentRemainingAmt <= 0 ? (isRTL ? "مُسدد بالكامل" : "Paid") : (isRTL ? "متبقي مستحق" : "Balance Due")}
                      </span>
                      <span className="text-sm font-black font-mono text-amber-950">
                        {voucher.currency} {currentRemainingAmt.toFixed(3)}
                      </span>
                    </div>
                  </div>

                  {/* Option 1: Link to Existing Invoice */}
                  <div className="space-y-1 font-sans">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <Link className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{isRTL ? "ربط السند بفاتورة موجودة (اختياري):" : "Link to Existing Invoice (Optional):"}</span>
                    </label>
                    <select
                      value={voucher.linkedInvoiceId || ""}
                      onChange={(e) => {
                        const inv = existingInvoices.find((i) => i.id === e.target.value);
                        onChange({
                          ...voucher,
                          linkedInvoiceId: inv?.id,
                          linkedInvoiceNumber: inv?.voucherNumber
                        });
                      }}
                      className="w-full px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-800"
                    >
                      <option value="">{isRTL ? "-- غير مرتبط بالفاتورة --" : "-- Not Linked --"}</option>
                      {existingInvoices.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          #{inv.voucherNumber} - {inv.receivedFrom} ({inv.totalAmount} {inv.currency})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Option 2: Auto-Generate Matching Tax Invoice */}
                  <div className="pt-1 font-sans">
                    <label className="flex items-center gap-2 p-2.5 bg-indigo-50/80 rounded-xl border border-indigo-200 text-indigo-950 text-xs font-bold cursor-pointer hover:bg-indigo-100 transition-all">
                      <input
                        type="checkbox"
                        checked={voucher.autoGenerateInvoice || false}
                        onChange={(e) => handleFieldChange("autoGenerateInvoice", e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded-md focus:ring-indigo-500 cursor-pointer"
                      />
                      <div className="flex items-center gap-1.5">
                        <CheckSquare className="w-4 h-4 text-indigo-700" />
                        <span>{isRTL ? "إنشاء فاتورة ضريبية متطابقة تلقائياً لهذا السند عند الحفظ" : "Automatically issue matching Tax Invoice upon save"}</span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Payment Details Section on Paper */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <CreditCard className={`w-4 h-4 ${currentTheme.text}`} />
              <span>{isRTL ? "طريقة وبيانات أداة السداد" : "Payment Method Details"}</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block">{t("paymentMethod")}</label>
                <select
                  value={voucher.paymentMethod}
                  onChange={(e) => handleFieldChange("paymentMethod", e.target.value as PaymentMethod)}
                  className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                >
                  <option value="BANK_TRANSFER">{t("paymentMethodBankTransfer")}</option>
                  <option value="CREDIT_CARD">POS / البطاقات المصرفية</option>
                  <option value="CHECK">{t("paymentMethodCheck")}</option>
                  <option value="CASH">{t("paymentMethodCash")}</option>
                  <option value="ONLINE">{t("paymentMethodOnline")}</option>
                </select>
              </div>

              {voucher.paymentMethod === "CREDIT_CARD" && (
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block">{isRTL ? "آخر 4 أرقام من البطاقة" : "Card Last 4 Digits"}</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={voucher.posLastFour || ""}
                    onChange={(e) => handlePosLastFourChange(e.target.value)}
                    placeholder="1234"
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-xl border border-slate-300 bg-white text-center tracking-widest"
                  />
                </div>
              )}

              {voucher.paymentMethod === "BANK_TRANSFER" && (
                <>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block">{isRTL ? "رقم مرجع التحويل" : "Transfer Ref No"}</label>
                    <input
                      type="text"
                      value={voucher.transactionRef || ""}
                      onChange={(e) => handleFieldChange("transactionRef", e.target.value)}
                      placeholder="TRF-9028102"
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-xl border border-slate-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block">{isRTL ? "صورة/إثبات التحويل" : "Transfer Proof URL"}</label>
                    <input
                      type="text"
                      value={voucher.transferProofUrl || ""}
                      onChange={(e) => handleFieldChange("transferProofUrl", e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </>
              )}

              {voucher.paymentMethod === "CHECK" && (
                <>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block">{t("checkNumber")}</label>
                    <input
                      type="text"
                      value={voucher.checkNumber || ""}
                      onChange={(e) => handleFieldChange("checkNumber", e.target.value)}
                      placeholder="CHK-9012"
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-xl border border-slate-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block">{t("bankName")}</label>
                    <input
                      type="text"
                      value={voucher.bankName || ""}
                      onChange={(e) => handleFieldChange("bankName", e.target.value)}
                      placeholder="Bank Muscat / بنك مسقط"
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Signatories & Official Paper Footer */}
          <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs">
            <div className="space-y-2">
              <span className="font-bold text-slate-600 block">{t("preparedBy")}</span>
              <input
                type="text"
                value={voucher.preparedBy || ""}
                onChange={(e) => handleFieldChange("preparedBy", e.target.value)}
                placeholder={isRTL ? "اسم المحاسب المسؤول..." : "Accountant Name..."}
                className="w-full text-center px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-slate-50"
              />
              <div className="border-b-2 border-dotted border-slate-400 pt-2 w-3/4 mx-auto" />
            </div>

            <div className="space-y-2">
              <span className="font-bold text-slate-600 block">{t("approvedBy")}</span>
              <input
                type="text"
                value={voucher.approvedBy || ""}
                onChange={(e) => handleFieldChange("approvedBy", e.target.value)}
                placeholder={isRTL ? "اسم المدير المالي..." : "Finance Controller..."}
                className="w-full text-center px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-slate-50"
              />
              <div className="border-b-2 border-dotted border-slate-400 pt-2 w-3/4 mx-auto" />
            </div>

            <div className="space-y-2">
              <span className="font-bold text-slate-600 block">{t("receivedBy")}</span>
              <input
                type="text"
                value={voucher.receivedBy || ""}
                onChange={(e) => handleFieldChange("receivedBy", e.target.value)}
                placeholder={isRTL ? "اسم المستلم..." : "Recipient Name..."}
                className="w-full text-center px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-slate-50"
              />
              <div className="border-b-2 border-dotted border-slate-400 pt-2 w-3/4 mx-auto" />
            </div>
          </div>

          {/* QR Verification Link Footer Bar */}
          <div className="pt-2 flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-100 font-mono">
            <span className="flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5 text-slate-700" />
              <span>{isRTL ? "رمز QR المحاسبي المعتمد" : "Secured QR Verification"}</span>
            </span>
            <a
              href={qrVerificationUrl}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 font-bold hover:underline flex items-center gap-0.5"
            >
              <span>{isRTL ? "اختبار التحقق العامة" : "Public Verification"}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Main Action Buttons Bar at the very bottom of the document sheet */}
          <div className="pt-6 border-t-2 border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/90 -mx-6 sm:-mx-10 -mb-6 sm:-mb-10 p-6 rounded-b-2xl">
            {/* Clear / Reset Voucher Button */}
            <button
              type="button"
              onClick={() => {
                if (window.confirm(isRTL ? "هل أنت متأكد من مسح وإعادة تعيين بيانات السند؟" : "Are you sure you want to clear/reset this voucher?")) {
                  handleFieldChange("lineItems", [{ id: "li-1", description: "", quantity: 1, unitPrice: 0, amount: 0 }]);
                  handleFieldChange("notes", "");
                  handleFieldChange("referenceNo", "");
                  handleFieldChange("receivedFrom", "");
                  handleFieldChange("paidAmount", 0);
                  handleFieldChange("remainingAmount", 0);
                }
              }}
              className="w-full sm:w-auto px-4 py-3 rounded-xl border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isRTL ? "مسح السند / إعادة تعيين" : "Clear / Reset Voucher"}</span>
            </button>

            {/* Save as Draft & Issue Voucher Buttons */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => {
                  handleFieldChange("status", "DRAFT");
                  setTimeout(() => {
                    onSave();
                  }, 50);
                }}
                className="w-1/2 sm:w-auto px-5 py-3 rounded-xl border border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-950 font-black text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <BookmarkPlus className="w-4 h-4 text-amber-600" />
                <span>{isRTL ? "حفظ كمسودة" : "Save as Draft"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (voucher.status === "DRAFT") {
                    handleFieldChange("status", "ISSUED");
                  }
                  setTimeout(() => {
                    onSave();
                  }, 50);
                }}
                className="w-1/2 sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 cursor-pointer scale-102"
              >
                <CheckCircle2 className="w-4.5 h-4.5" />
                <span>{isRTL ? "إصدار وتأكيد السند" : "Issue & Confirm Voucher"}</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
