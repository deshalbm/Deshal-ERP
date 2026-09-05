import React, { useState, useEffect } from "react";
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
  ExternalLink
} from "lucide-react";

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
  onQuickSaveCustomer
}) => {
  const { language, t, dir, isRTL } = useLanguage();

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

      if (!updated.isCustomWords) {
        updated.amountInWords = numberToWords(totals.totalAmount, updated.currency, language);
      }
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
        return t("voucherTypeReceipt");
      case "TAX_INVOICE":
        return t("voucherTypeTaxInvoice");
      case "QUOTATION":
        return t("voucherTypeQuotation");
      case "PAYMENT":
        return t("voucherTypePayment");
      case "PETTY_CASH":
      default:
        return t("voucherTypePettyCash");
    }
  };

  const qrVerificationUrl = `https://erp.deshalbm.com/verify-invoice?id=${voucher.id}&token=${voucher.verificationToken || 'sec-token-2026'}`;

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

      {/* Top Banner & Quick Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-indigo-100 text-indigo-800">
              {getVoucherTypeLabel(voucher.type)}
            </span>
            <h1 className="text-xl font-bold text-slate-900 font-sans">
              #{voucher.voucherNumber || (language === "ar" ? "مسودة" : "Draft")}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === "ar"
              ? "إدارة وإنشاء السندات والفواتير مع الترقيم الذري والربط المحاسبي الآمن."
              : "Create vouchers with database atomic sequence & accounting core integration."}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onSwitchToDocWizard && (
            <button
              onClick={onSwitchToDocWizard}
              type="button"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-black rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs hover:shadow-md cursor-pointer"
            >
              <WizardIcon className="w-4 h-4 text-amber-300" />
              <span>{t("tabDocWizard")}</span>
            </button>
          )}

          <button
            onClick={onOpenAiAssistant}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>{t("aiAssistTitle")}</span>
          </button>

          <button
            onClick={onPreview}
            type="button"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-slate-600" />
            <span>{t("tabPreview")}</span>
          </button>

          <button
            onClick={onSave}
            type="button"
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{t("saveVoucher")}</span>
          </button>
        </div>
      </div>

      {/* 1. Voucher Type & Atomic Sequence Numbering */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-600" />
          <span>{language === "ar" ? "نوع السند ورقم التسلسل الآمن" : "Voucher Type & Atomic Sequence Number"}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Voucher Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("voucherType")}
            </label>
            <select
              value={voucher.type}
              onChange={(e) => handleFieldChange("type", e.target.value as VoucherType)}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            >
              <option value="RECEIPT">{t("voucherTypeReceipt")}</option>
              <option value="TAX_INVOICE">{t("voucherTypeTaxInvoice")}</option>
              <option value="QUOTATION">{t("voucherTypeQuotation")}</option>
              <option value="PAYMENT">{t("voucherTypePayment")}</option>
              <option value="PETTY_CASH">{t("voucherTypePettyCash")}</option>
            </select>
          </div>

          {/* Voucher Number (Atomic Read-Only by default + Pencil Edit ✎) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>{t("voucherNumber")}</span>
              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                <Lock className="w-3 h-3" />
                {isRTL ? "مُوَلّد ذرياً" : "Atomic"}
              </span>
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                readOnly={isNumberLocked}
                value={voucher.voucherNumber}
                onChange={(e) => handleFieldChange("voucherNumber", e.target.value)}
                className={`w-full px-3 py-2 text-xs font-bold rounded-xl border transition-all font-mono ${
                  isNumberLocked
                    ? "bg-slate-100 border-slate-300 text-slate-800 cursor-not-allowed select-none"
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
                title={isRTL ? "تعديل رقم السند (يتطلب سبب للرقابة)" : "Edit Voucher Number"}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isNumberLocked
                    ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-600"
                    : "bg-amber-100 hover:bg-amber-200 border-amber-400 text-amber-800"
                }`}
              >
                {isNumberLocked ? <Edit2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Reference No (Empty by default) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("referenceNumber")}
            </label>
            <input
              type="text"
              value={voucher.referenceNo || ""}
              onChange={(e) => handleFieldChange("referenceNo", e.target.value)}
              placeholder={isRTL ? "فارغ افتراضياً (اختياري)" : "Empty by default (Optional)"}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("status")}
            </label>
            <select
              value={voucher.status}
              onChange={(e) => handleFieldChange("status", e.target.value as VoucherStatus)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            >
              <option value="ISSUED">{t("voucherStatusIssued")}</option>
              <option value="PAID">{t("voucherStatusPaid")}</option>
              <option value="DRAFT">{t("voucherStatusDraft")}</option>
              <option value="CANCELLED">{t("voucherStatusCancelled")}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("date")}
            </label>
            <input
              type="date"
              value={voucher.date}
              onChange={(e) => handleFieldChange("date", e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

          {/* Currency */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("currency")}
            </label>
            <select
              value={voucher.currency}
              onChange={(e) => handleFieldChange("currency", e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-mono"
            >
              <option value="OMR">OMR (ريال عماني)</option>
              <option value="AED">AED (درهم إماراتي)</option>
              <option value="SAR">SAR (ريال سعودي)</option>
              <option value="USD">USD ($ US Dollar)</option>
              <option value="EUR">EUR (€ Euro)</option>
            </select>
          </div>

          {/* Source Branch (Auto-bound & Read-Only by default) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>{isRTL ? "الفرع المصدر (آمن)" : "Source Branch (Secured)"}</span>
              <span className="text-[10px] text-indigo-700 font-bold">RLS Guard</span>
            </label>
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
              className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-indigo-200 bg-indigo-50/60 text-indigo-950 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            >
              {branches.map((br) => (
                <option key={br.id} value={br.id}>
                  {br.name} ({br.city}) {br.isMain ? (isRTL ? "⭐ الرئيسي" : "⭐ Main") : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Counterparty (Customer / Supplier Picker & Inline Modal) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" />
            <span>{voucher.type === "PAYMENT" ? t("paidTo") : t("receivedFrom")}</span>
          </h2>

          <button
            type="button"
            onClick={() => setIsAddCustomerModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isRTL ? "+ إضافة عميل جديد" : "+ Add New Customer"}</span>
          </button>
        </div>

        {/* Customer Server-side Combobox */}
        <div className="relative">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {isRTL ? "البحث والتقاط العميل من قاعدة البيانات:" : "Search DB Customers:"}
          </label>
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
              placeholder={isRTL ? "ابحث باسم العميل، الهاتف، الرقم الضريبي..." : "Search by name, phone, VAT ID..."}
              className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all pl-9"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          {/* Combobox Dropdown Results */}
          {showCustomerDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-60 overflow-y-auto divide-y divide-slate-100">
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

        {/* Customer Detailed Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t("customerPhone")}</label>
            <input
              type="text"
              value={voucher.payerPhone || ""}
              onChange={(e) => handleFieldChange("payerPhone", e.target.value)}
              placeholder="+968 91234567"
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t("customerEmail")}</label>
            <input
              type="email"
              value={voucher.payerEmail || ""}
              onChange={(e) => handleFieldChange("payerEmail", e.target.value)}
              placeholder="billing@customer.com"
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t("taxNumber")}</label>
            <input
              type="text"
              value={voucher.payerTaxId || ""}
              onChange={(e) => handleFieldChange("payerTaxId", e.target.value)}
              placeholder="OM-VAT-109283"
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* 3. Master Products & Services Catalog Line Items */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-indigo-600" />
            <span>{t("lineItems")} (من سجل المنتجات والخدمات)</span>
          </h2>

          <div className="flex items-center gap-2">
            {masterProducts.length > 0 && (
              <select
                onChange={(e) => {
                  const prod = masterProducts.find((p) => p.id === e.target.value);
                  if (prod) handleAddLineItem(prod);
                  e.target.value = "";
                }}
                defaultValue=""
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 cursor-pointer"
              >
                <option value="" disabled>
                  📦 {isRTL ? "إضافة منتج من الكتالوج..." : "Add from Master Catalog..."}
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
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("addItem")}</span>
            </button>
          </div>
        </div>

        {/* Line items table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs" dir={dir}>
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="p-3 w-12 text-center">#</th>
                <th className={`p-3 ${isRTL ? "text-right" : "text-left"}`}>{t("description")}</th>
                <th className="p-3 w-24 text-center">{t("quantity")}</th>
                <th className={`p-3 w-32 ${isRTL ? "text-left" : "text-right"}`}>{t("unitPrice")} ({voucher.currency})</th>
                <th className={`p-3 w-32 ${isRTL ? "text-left" : "text-right"}`}>{t("total")} ({voucher.currency})</th>
                <th className="p-3 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {voucher.lineItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-all">
                  <td className="p-3 text-slate-400 font-mono text-center">{idx + 1}</td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleLineItemChange(item.id, "description", e.target.value)}
                      placeholder={language === "ar" ? "وصف البند أو الخدمة..." : "Item or service description..."}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleLineItemChange(item.id, "quantity", e.target.value)}
                      className="w-full px-2 py-1.5 text-xs text-center rounded-lg border border-slate-200 bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono"
                    />
                  </td>
                  <td className={`p-2 ${isRTL ? "text-left" : "text-right"}`}>
                    <input
                      type="number"
                      step="0.001"
                      value={item.unitPrice}
                      onChange={(e) => handleLineItemChange(item.id, "unitPrice", e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono"
                    />
                  </td>
                  <td className={`p-3 font-bold font-mono text-slate-900 ${isRTL ? "text-left" : "text-right"}`}>
                    {item.amount.toFixed(3)}
                  </td>
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(item.id)}
                      disabled={voucher.lineItems.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Box & Discount Type Toggle */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 pt-2">
          {/* Custom Fields */}
          <div className="w-full md:w-1/2 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
              {t("customFields")}
            </span>
            {voucher.customFields.map((cf) => (
              <div key={cf.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={cf.label}
                  readOnly
                  className="w-1/3 px-2.5 py-1 text-xs rounded-lg border border-slate-200 font-semibold text-slate-700 bg-slate-50"
                />
                <input
                  type="text"
                  value={cf.value}
                  onChange={(e) => {
                    const updated = voucher.customFields.map((f) => (f.id === cf.id ? { ...f, value: e.target.value } : f));
                    onChange({ ...voucher, customFields: updated });
                  }}
                  className="w-2/3 px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white"
                />
              </div>
            ))}
          </div>

          {/* Subtotal, Tax %, Discount Type & Total */}
          <div className="w-full md:w-1/2 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 font-mono text-xs">
            <div className="flex justify-between text-slate-600">
              <span className="font-sans">{t("subtotal")}:</span>
              <span className="font-semibold text-slate-900">
                {voucher.currency} {voucher.subtotal.toFixed(3)}
              </span>
            </div>

            {/* Discount Type Toggle */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-sans">
                <span className="text-slate-600">{isRTL ? "الخصم المالي:" : "Discount:"}</span>
                <select
                  value={voucher.discountType || "FIXED"}
                  onChange={(e) => handleFieldChange("discountType", e.target.value as DiscountType)}
                  className="px-2 py-1 text-[11px] font-bold rounded-lg border border-slate-300 bg-white"
                >
                  <option value="FIXED">{isRTL ? "مبلغ ثابت" : "Fixed Amount"}</option>
                  <option value="PERCENTAGE">{isRTL ? "نسبة مئوية (%)" : "Percentage (%)"}</option>
                </select>
                <input
                  type="number"
                  min="0"
                  value={voucher.discountValue || 0}
                  onChange={(e) => handleFieldChange("discountValue", Number(e.target.value))}
                  className="w-20 px-2 py-1 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-right font-mono"
                />
              </div>
              <span className="font-semibold text-red-600">
                - {voucher.currency} {(voucher.discountAmount || 0).toFixed(3)}
              </span>
            </div>

            {/* Tax */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-sans">
                <span className="text-slate-600">{t("taxRate")} (%):</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={voucher.taxRate}
                  onChange={(e) => handleFieldChange("taxRate", Number(e.target.value))}
                  className="w-16 px-2 py-1 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-center font-mono"
                />
              </div>
              <span className="font-semibold text-slate-900">
                + {voucher.currency} {voucher.taxAmount.toFixed(3)}
              </span>
            </div>

            <div className="border-t border-slate-300 pt-3 flex justify-between items-center text-sm font-bold text-slate-900">
              <span className="font-sans uppercase tracking-wider text-xs">{t("total")}:</span>
              <span className="text-lg font-bold text-indigo-700">
                {voucher.currency} {voucher.totalAmount.toFixed(3)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Payment Method & Instrumentation Details (POS Last 4, Proof Upload, Ref) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-indigo-600" />
          <span>{language === "ar" ? "طريقة الدفع وبيانات الأداة المالية" : "Payment Method & Instrument Details"}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t("paymentMethod")}</label>
            <select
              value={voucher.paymentMethod}
              onChange={(e) => handleFieldChange("paymentMethod", e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            >
              <option value="BANK_TRANSFER">{t("paymentMethodBankTransfer")}</option>
              <option value="CREDIT_CARD">POS / البطاقات المصرفية</option>
              <option value="CHECK">{t("paymentMethodCheck")}</option>
              <option value="CASH">{t("paymentMethodCash")}</option>
              <option value="ONLINE">{t("paymentMethodOnline")}</option>
            </select>
          </div>

          {/* POS Card: Strictly Last 4 Digits Only */}
          {voucher.paymentMethod === "CREDIT_CARD" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>{isRTL ? "آخر 4 أرقام من البطاقة" : "Card Last 4 Digits"}</span>
                <span className="text-[10px] text-emerald-700 font-bold">PCI-DSS Safe</span>
              </label>
              <input
                type="text"
                maxLength={4}
                value={voucher.posLastFour || ""}
                onChange={(e) => handlePosLastFourChange(e.target.value)}
                placeholder="1234"
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-center tracking-widest"
              />
            </div>
          )}

          {/* Bank Transfer: Ref No + Proof Upload */}
          {voucher.paymentMethod === "BANK_TRANSFER" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{isRTL ? "رقم مرجع التحويل" : "Transfer Ref No"}</label>
                <input
                  type="text"
                  value={voucher.transactionRef || ""}
                  onChange={(e) => handleFieldChange("transactionRef", e.target.value)}
                  placeholder="TRF-9028102"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{isRTL ? "صورة/إثبات التحويل البنكي" : "Transfer Proof"}</label>
                <input
                  type="text"
                  value={voucher.transferProofUrl || ""}
                  onChange={(e) => handleFieldChange("transferProofUrl", e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </>
          )}

          {voucher.paymentMethod === "ONLINE" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{isRTL ? "مرجع بوابة الدفع" : "Gateway Ref ID"}</label>
              <input
                type="text"
                value={voucher.paymentGatewayRef || ""}
                onChange={(e) => handleFieldChange("paymentGatewayRef", e.target.value)}
                placeholder="PAY-GW-9012"
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* 5. Secure Public QR Code Preview & Signatories */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-indigo-600" />
            <span>{isRTL ? "رمز التحقق الآمن QR والاعتماد الرسمى" : "Secure QR Code & Signatories"}</span>
          </h2>

          <a
            href={qrVerificationUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
          >
            <span>{isRTL ? "اختبار رابط التحقق" : "Test Verification Link"}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t("preparedBy")}</label>
            <input
              type="text"
              value={voucher.preparedBy}
              onChange={(e) => handleFieldChange("preparedBy", e.target.value)}
              placeholder={isRTL ? "المحاسب المسؤول" : "Accountant Name"}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t("approvedBy")}</label>
            <input
              type="text"
              value={voucher.approvedBy}
              onChange={(e) => handleFieldChange("approvedBy", e.target.value)}
              placeholder={isRTL ? "المدير المالي" : "Finance Controller"}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t("receivedBy")}</label>
            <input
              type="text"
              value={voucher.receivedBy}
              onChange={(e) => handleFieldChange("receivedBy", e.target.value)}
              placeholder={isRTL ? "اسم المستلم" : "Recipient Name"}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
