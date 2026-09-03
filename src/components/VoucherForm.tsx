import React from "react";
import {
  ReceiptVoucher,
  VoucherType,
  PaymentMethod,
  VoucherStatus,
  LineItem,
  CustomField,
  Customer,
  Branch
} from "../types";
import { numberToWords } from "../utils/numberToWords";
import { generateUuid } from "../utils/uuid";
import { formatDateToDDMMMMYYYY } from "../utils/dateFormatter";
import { useLanguage } from "../utils/LanguageContext";
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
  Layers
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
  onQuickSaveCustomer
}) => {
  const { language, t, dir, isRTL } = useLanguage();

  // Recompute line items total, subtotal, tax, discount, and total
  const computeTotals = (items: LineItem[], taxRate: number, discountAmt: number) => {
    const calculatedSubtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const calculatedTax = (calculatedSubtotal * (taxRate || 0)) / 100;
    const calculatedTotal = Math.max(0, calculatedSubtotal + calculatedTax - (discountAmt || 0));

    return {
      subtotal: calculatedSubtotal,
      taxAmount: calculatedTax,
      totalAmount: calculatedTotal
    };
  };

  const handleFieldChange = (field: keyof ReceiptVoucher, value: any) => {
    const updated = { ...voucher, [field]: value, updatedAt: new Date().toISOString() };

    if (field === "lineItems" || field === "taxRate" || field === "discountAmount") {
      const totals = computeTotals(
        field === "lineItems" ? value : voucher.lineItems,
        field === "taxRate" ? value : voucher.taxRate,
        field === "discountAmount" ? value : voucher.discountAmount
      );
      updated.subtotal = totals.subtotal;
      updated.taxAmount = totals.taxAmount;
      updated.totalAmount = totals.totalAmount;
      updated.amount = totals.totalAmount;

      if (!updated.isCustomWords) {
        updated.amountInWords = numberToWords(totals.totalAmount, updated.currency, language);
      }
    }

    if (field === "currency" && !updated.isCustomWords) {
      updated.amountInWords = numberToWords(updated.totalAmount, value, language);
    }

    onChange(updated);
  };

  const handleAddLineItem = () => {
    const newItem: LineItem = {
      id: "item-" + Date.now(),
      description: "",
      quantity: 1,
      unitPrice: 0,
      amount: 0
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

  const handleAddCustomField = () => {
    const newField: CustomField = {
      id: "cf-" + Date.now(),
      label: language === "ar" ? "حقل مخصص" : "Custom Field",
      value: ""
    };
    onChange({
      ...voucher,
      customFields: [...voucher.customFields, newField]
    });
  };

  const handleRemoveCustomField = (id: string) => {
    onChange({
      ...voucher,
      customFields: voucher.customFields.filter((cf) => cf.id !== id)
    });
  };

  const handleCustomFieldChange = (id: string, key: "label" | "value", val: string) => {
    onChange({
      ...voucher,
      customFields: voucher.customFields.map((cf) =>
        cf.id === id ? { ...cf, [key]: val } : cf
      )
    });
  };

  const generateAutoVoucherNumber = () => {
    const prefix =
      voucher.type === "RECEIPT"
        ? "RV"
        : voucher.type === "PAYMENT"
        ? "PV"
        : voucher.type === "PETTY_CASH"
        ? "PC"
        : "INV";
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    handleFieldChange("voucherNumber", `${prefix}-${year}-${rand}`);
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12" dir={dir}>
      
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
              ? "قم بتعبئة البيانات المالية وبنود السند وطريقة الدفع أدناه."
              : "Fill in financial details, line items, and payment breakdown below."}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onSwitchToDocWizard && (
            <button
              onClick={onSwitchToDocWizard}
              type="button"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-black rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs hover:shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all cursor-pointer"
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
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{t("saveVoucher")}</span>
          </button>
        </div>
      </div>

      {/* 1. Voucher Type & General Meta */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-600" />
          <span>{language === "ar" ? "نوع السند والمعرفات المرجعية" : "Voucher Type & Reference Identifiers"}</span>
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

          {/* Voucher Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("voucherNumber")}
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={voucher.voucherNumber}
                onChange={(e) => handleFieldChange("voucherNumber", e.target.value)}
                placeholder="RV-2026-0001"
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-mono"
              />
              <button
                type="button"
                onClick={generateAutoVoucherNumber}
                title={language === "ar" ? "توليد رقم تسلسلي تلقائي" : "Auto Generate Sequence"}
                className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-slate-600 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Reference No */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("referenceNumber")}
            </label>
            <input
              type="text"
              value={voucher.referenceNo}
              onChange={(e) => handleFieldChange("referenceNo", e.target.value)}
              placeholder="e.g. INV-8812, PO-202"
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
          {/* Issue Date */}
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
            {voucher.date && (
              <p className="mt-1 text-[11px] font-mono font-medium text-slate-500">
                {formatDateToDDMMMMYYYY(voucher.date)}
              </p>
            )}
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
              <option value="OMR">OMR (ريال عماني - Omani Rial)</option>
              <option value="AED">AED (درهم إماراتي - UAE Dirham)</option>
              <option value="SAR">SAR (ريال سعودي - Saudi Riyal)</option>
              <option value="KWD">KWD (دينار كويتي - Kuwaiti Dinar)</option>
              <option value="BHD">BHD (دينار بحريني - Bahraini Dinar)</option>
              <option value="QAR">QAR (ريال قطري - Qatari Riyal)</option>
              <option value="USD">USD ($ - US Dollar)</option>
              <option value="EUR">EUR (€ - Euro)</option>
              <option value="GBP">GBP (£ - British Pound)</option>
              <option value="CAD">CAD ($ - Canadian Dollar)</option>
              <option value="AUD">AUD ($ - Australian Dollar)</option>
              <option value="INR">INR (₹ - Indian Rupee)</option>
              <option value="JPY">JPY (¥ - Japanese Yen)</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("category")}
            </label>
            <input
              type="text"
              value={voucher.category}
              onChange={(e) => handleFieldChange("category", e.target.value)}
              placeholder="e.g. Sales Income, Consulting, Rent"
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

          {/* Issuing Branch */}
          {branches.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>{language === "ar" ? "فرع إصدار السند" : "Issuing Branch"}</span>
                <span className="text-[10px] text-indigo-600 font-bold">{t("tabBranches")}</span>
              </label>
              <select
                value={voucher.branchId || branches.find((b) => b.name === voucher.branchName)?.id || ""}
                onChange={(e) => {
                  const selected = branches.find((b) => b.id === e.target.value);
                  if (selected) {
                    onChange({
                      ...voucher,
                      branchId: selected.id,
                      branchName: selected.name
                    });
                  } else {
                    onChange({
                      ...voucher,
                      branchId: undefined,
                      branchName: undefined
                    });
                  }
                }}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-indigo-200 bg-indigo-50/40 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              >
                <option value="">{language === "ar" ? "-- اختر الفرع المصدر --" : "-- Select Branch --"}</option>
                {branches.map((br) => (
                  <option key={br.id} value={br.id}>
                    {br.name} ({br.city}) {br.isMain ? (language === "ar" ? "⭐ المركز الرئيسي" : "⭐ Main Branch") : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 2. Payer / Payee Details */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" />
            <span>
              {voucher.type === "PAYMENT" ? t("paidTo") : t("receivedFrom")}
            </span>
          </h2>

          {/* CRM Quick Picker / Action */}
          {customers && customers.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <select
                onChange={(e) => {
                  const selectedId = e.target.value;
                  if (!selectedId) return;
                  const found = customers.find((c) => c.id === selectedId);
                  if (found) {
                    onChange({
                      ...voucher,
                      receivedFrom: found.name,
                      payerPhone: found.phone || voucher.payerPhone,
                      payerEmail: found.email || voucher.payerEmail,
                      payerAddress: found.address || voucher.payerAddress,
                      payerTaxId: found.taxId || voucher.payerTaxId,
                      updatedAt: new Date().toISOString()
                    });
                  }
                  e.target.value = "";
                }}
                className="px-3 py-1.5 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-200 transition-colors cursor-pointer"
                defaultValue=""
              >
                <option value="" disabled>
                  👥 {language === "ar" ? `اختيار عميل من CRM (${customers.length} مسجلين)...` : `Select CRM Customer (${customers.length})...`}
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ""}
                  </option>
                ))}
              </select>

              {voucher.receivedFrom &&
                !customers.some((c) => c.name.toLowerCase() === voucher.receivedFrom.toLowerCase().trim()) &&
                onQuickSaveCustomer && (
                  <button
                    type="button"
                    onClick={() => {
                      onQuickSaveCustomer({
                        id: generateUuid(),
                        name: voucher.receivedFrom.trim(),
                        contactPerson: "",
                        phone: voucher.payerPhone || "",
                        email: voucher.payerEmail || "",
                        address: voucher.payerAddress || "",
                        city: "Muscat",
                        country: "Oman",
                        taxId: voucher.payerTaxId || "",
                        type: "CORPORATE",
                        status: "ACTIVE",
                        tags: ["auto-saved"],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                      });
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
                    title={language === "ar" ? "حفظ هذا العميل في قاعدة بيانات CRM" : "Save this client into CRM"}
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>{language === "ar" ? "حفظ في CRM" : "Save to CRM"}</span>
                  </button>
                )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {voucher.type === "PAYMENT" ? t("paidTo") : t("receivedFrom")}
            </label>
            <input
              type="text"
              value={voucher.receivedFrom}
              onChange={(e) => handleFieldChange("receivedFrom", e.target.value)}
              placeholder={language === "ar" ? "اسم العميل أو الجهة (مثال: شركة الدليل الشامل)" : "Full Client or Entity Name"}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("taxNumber")}
            </label>
            <input
              type="text"
              value={voucher.payerTaxId || ""}
              onChange={(e) => handleFieldChange("payerTaxId", e.target.value)}
              placeholder="e.g. OM-TAX-7762"
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("customerEmail")}
            </label>
            <input
              type="email"
              value={voucher.payerEmail || ""}
              onChange={(e) => handleFieldChange("payerEmail", e.target.value)}
              placeholder="billing@customer.com"
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("customerPhone")}
            </label>
            <input
              type="text"
              value={voucher.payerPhone || ""}
              onChange={(e) => handleFieldChange("payerPhone", e.target.value)}
              placeholder="+968 77627500"
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-mono"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("customerAddress")}
            </label>
            <input
              type="text"
              value={voucher.payerAddress || ""}
              onChange={(e) => handleFieldChange("payerAddress", e.target.value)}
              placeholder={language === "ar" ? "العنوان، المدينة، الدولة" : "Street address, City, Country"}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

        </div>
      </div>

      {/* 3. Payment Method & Banking Breakdown */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-indigo-600" />
          <span>{language === "ar" ? "طريقة الدفع والتفاصيل المصرفية" : "Payment Instrument & Method Details"}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("paymentMethod")}
            </label>
            <select
              value={voucher.paymentMethod}
              onChange={(e) => handleFieldChange("paymentMethod", e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            >
              <option value="BANK_TRANSFER">{t("paymentMethodBankTransfer")}</option>
              <option value="CHECK">{t("paymentMethodCheck")}</option>
              <option value="CASH">{t("paymentMethodCash")}</option>
              <option value="CREDIT_CARD">{t("paymentMethodCreditCard")}</option>
              <option value="ONLINE">{t("paymentMethodOnline")}</option>
              <option value="OTHER">{t("paymentMethodOther")}</option>
            </select>
          </div>

          {voucher.paymentMethod === "CHECK" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("checkNumber")}
              </label>
              <input
                type="text"
                value={voucher.checkNumber || ""}
                onChange={(e) => handleFieldChange("checkNumber", e.target.value)}
                placeholder="CHK-881920"
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-mono"
              />
            </div>
          )}

          {(voucher.paymentMethod === "BANK_TRANSFER" || voucher.paymentMethod === "CHECK") && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("bankName")}
              </label>
              <input
                type="text"
                value={voucher.bankName || ""}
                onChange={(e) => handleFieldChange("bankName", e.target.value)}
                placeholder="Bank Muscat / Oman Arab Bank"
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("transactionRef")}
            </label>
            <input
              type="text"
              value={voucher.transactionRef || ""}
              onChange={(e) => handleFieldChange("transactionRef", e.target.value)}
              placeholder="e.g. TXN-9988220"
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-mono"
            />
          </div>

        </div>
      </div>

      {/* 4. Line Items & Financial Computations */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-indigo-600" />
            <span>{t("lineItems")}</span>
          </h2>

          <button
            type="button"
            onClick={handleAddLineItem}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t("addItem")}</span>
          </button>
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
                      step={voucher.currency === "OMR" || voucher.currency === "KWD" || voucher.currency === "BHD" ? "0.001" : "0.01"}
                      value={item.unitPrice}
                      onChange={(e) => handleLineItemChange(item.id, "unitPrice", e.target.value)}
                      className={`w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono ${
                        isRTL ? "text-left" : "text-right"
                      }`}
                    />
                  </td>
                  <td className={`p-3 font-bold font-mono text-slate-900 ${isRTL ? "text-left" : "text-right"}`}>
                    {item.amount.toLocaleString(undefined, {
                      minimumFractionDigits: voucher.currency === "OMR" || voucher.currency === "KWD" || voucher.currency === "BHD" ? 3 : 2,
                      maximumFractionDigits: voucher.currency === "OMR" || voucher.currency === "KWD" || voucher.currency === "BHD" ? 3 : 2
                    })}
                  </td>
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(item.id)}
                      disabled={voucher.lineItems.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Subtotal, Tax %, Discount, Total Box */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 pt-2">
          
          {/* Left: Custom Fields Manager */}
          <div className="w-full md:w-1/2 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                {t("customFields")}
              </span>
              <button
                type="button"
                onClick={handleAddCustomField}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                + {language === "ar" ? "إضافة حقل مخصص" : "Add Custom Field"}
              </button>
            </div>

            {voucher.customFields.map((cf) => (
              <div key={cf.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={cf.label}
                  onChange={(e) => handleCustomFieldChange(cf.id, "label", e.target.value)}
                  placeholder={language === "ar" ? "اسم الحقل" : "Field Name"}
                  className="w-1/3 px-2.5 py-1 text-xs rounded-lg border border-slate-200 font-semibold text-slate-700 bg-slate-50"
                />
                <input
                  type="text"
                  value={cf.value}
                  onChange={(e) => handleCustomFieldChange(cf.id, "value", e.target.value)}
                  placeholder={language === "ar" ? "القيمة" : "Value"}
                  className="w-2/3 px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveCustomField(cf.id)}
                  className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Right: Subtotal & Tax Calculation */}
          <div className="w-full md:w-1/2 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 font-mono text-xs">
            <div className="flex justify-between text-slate-600">
              <span className="font-sans">{t("subtotal")}:</span>
              <span className="font-semibold text-slate-900">
                {voucher.currency} {voucher.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-sans">{t("taxRate")} (%):</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={voucher.taxRate}
                  onChange={(e) => handleFieldChange("taxRate", Number(e.target.value))}
                  className="w-16 px-2 py-1 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-center font-mono"
                />
              </div>
              <span className="font-semibold text-slate-900">
                + {voucher.currency} {voucher.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-sans">{t("discountAmount")} ({voucher.currency}):</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={voucher.discountAmount}
                  onChange={(e) => handleFieldChange("discountAmount", Number(e.target.value))}
                  className="w-24 px-2 py-1 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-right font-mono"
                />
              </div>
              <span className="font-semibold text-red-600">
                - {voucher.currency} {voucher.discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="border-t border-slate-300 pt-3 flex justify-between items-center text-sm font-bold text-slate-900">
              <span className="font-sans uppercase tracking-wider text-xs">{t("total")}:</span>
              <span className="text-lg font-bold text-indigo-700">
                {voucher.currency} {voucher.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

        </div>

        {/* Amount in Words */}
        <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
              {t("amountInWords")}
            </span>
            <button
              type="button"
              onClick={() => handleFieldChange("isCustomWords", !voucher.isCustomWords)}
              className="text-[11px] font-semibold text-indigo-700 hover:underline cursor-pointer"
            >
              {voucher.isCustomWords
                ? (language === "ar" ? "إعادة التوليد التلقائي" : "Auto Re-generate")
                : (language === "ar" ? "تعديل النص يدوياً" : "Manual Override")}
            </button>
          </div>

          <input
            type="text"
            disabled={!voucher.isCustomWords}
            value={voucher.amountInWords}
            onChange={(e) => handleFieldChange("amountInWords", e.target.value)}
            className={`w-full px-3 py-2 text-xs font-serif italic rounded-xl border ${
              voucher.isCustomWords
                ? "border-indigo-400 bg-white text-slate-900"
                : "border-indigo-200 bg-indigo-50/80 text-indigo-950 font-medium"
            }`}
          />
        </div>

      </div>

      {/* 5. Signatories, Notes & Terms */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Building className="w-4 h-4 text-indigo-600" />
          <span>{language === "ar" ? "التوقيعات والملاحظات والشروط" : "Signatory Roles, Notes & Terms"}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("preparedBy")}
            </label>
            <input
              type="text"
              value={voucher.preparedBy}
              onChange={(e) => handleFieldChange("preparedBy", e.target.value)}
              placeholder={language === "ar" ? "اسم المحاسب" : "Accountant Name"}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("approvedBy")}
            </label>
            <input
              type="text"
              value={voucher.approvedBy}
              onChange={(e) => handleFieldChange("approvedBy", e.target.value)}
              placeholder={language === "ar" ? "المدير المالي / المفوض" : "Finance Controller"}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("receivedBy")}
            </label>
            <input
              type="text"
              value={voucher.receivedBy}
              onChange={(e) => handleFieldChange("receivedBy", e.target.value)}
              placeholder={language === "ar" ? "اسم المستلم" : "Recipient Name"}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("notes")}
            </label>
            <textarea
              rows={3}
              value={voucher.notes}
              onChange={(e) => handleFieldChange("notes", e.target.value)}
              placeholder={language === "ar" ? "إضافة ملاحظات داخلية أو تفاصيل سداد..." : "Add internal remarks or notes..."}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("termsAndConditions")}
            </label>
            <textarea
              rows={3}
              value={voucher.terms}
              onChange={(e) => handleFieldChange("terms", e.target.value)}
              placeholder={language === "ar" ? "الشروط والأحكام الخاصة بالمستند..." : "Standard disclaimer or terms for this document..."}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>

    </div>
  );
};
