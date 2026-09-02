import React, { useState, useMemo } from "react";
import {
  ReceiptVoucher,
  VoucherType,
  PaymentMethod,
  VoucherStatus,
  LineItem,
  CustomField,
  Customer,
  Supplier,
  Branch,
  CompanySettings,
  DesignTheme
} from "../types";
import { numberToWords } from "../utils/numberToWords";
import { formatDateToDDMMMMYYYY } from "../utils/dateFormatter";
import { useLanguage } from "../utils/LanguageContext";
import { DEFAULT_COMPANY_SETTINGS } from "../utils/storage";
import { convertCurrency, AVAILABLE_CURRENCIES, formatCurrencyAmount } from "../utils/currencyConverter";
import {
  FileText,
  User,
  Users,
  CreditCard,
  Building2,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  Printer,
  FileDown,
  Layout,
  RefreshCw,
  QrCode,
  ShieldCheck,
  Check,
  Percent,
  Tag,
  Phone,
  Mail,
  MapPin,
  HelpCircle,
  BookmarkPlus,
  Receipt,
  ShoppingBag,
  Briefcase,
  ChevronRight,
  ChevronLeft,
  X,
  Sliders,
  Maximize2,
  Coins
} from "lucide-react";

interface DocWizardViewProps {
  voucher: ReceiptVoucher;
  onChange: (updated: ReceiptVoucher) => void;
  onSave: () => void;
  onPreview: () => void;
  onPrint: () => void;
  onExportPdf: () => void;
  onSwitchToFullEditor: () => void;
  onOpenAiAssistant: () => void;
  customers?: Customer[];
  suppliers?: Supplier[];
  branches?: Branch[];
  companySettings?: CompanySettings;
  designTheme: DesignTheme;
  onUpdateDesignTheme?: (theme: DesignTheme) => void;
  onQuickSaveCustomer?: (customer: Customer) => void;
  onAuditLog?: (action: string, category: string, refId: string, refName: string, descAr: string, descEn: string) => void;
}

export function DocWizardView({
  voucher,
  onChange,
  onSave,
  onPreview,
  onPrint,
  onExportPdf,
  onSwitchToFullEditor,
  onOpenAiAssistant,
  customers = [],
  suppliers = [],
  branches = [],
  companySettings = DEFAULT_COMPANY_SETTINGS,
  designTheme,
  onUpdateDesignTheme,
  onQuickSaveCustomer,
  onAuditLog
}: DocWizardViewProps) {
  const { language, t } = useLanguage();
  const isRtl = language === "ar";
  const NextIcon = isRtl ? ArrowLeft : ArrowRight;
  const PrevIcon = isRtl ? ArrowRight : ArrowLeft;

  // Wizard active step (1 to 5)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

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
    let updated = { ...voucher, [field]: value, updatedAt: new Date().toISOString() };

    // Auto currency conversion logic
    if (field === "currency" && value !== voucher.currency) {
      const oldCurrency = voucher.currency;
      const newCurrency = value;

      if (companySettings.autoConvertCurrency ?? true) {
        const convertedItems = voucher.lineItems.map((item) => {
          const convertedUnitPrice = convertCurrency(
            item.unitPrice,
            oldCurrency,
            newCurrency,
            companySettings.customExchangeRates
          );
          return {
            ...item,
            unitPrice: convertedUnitPrice,
            amount: (item.quantity || 0) * convertedUnitPrice
          };
        });

        const convertedDiscount = convertCurrency(
          voucher.discountAmount || 0,
          oldCurrency,
          newCurrency,
          companySettings.customExchangeRates
        );

        const totals = computeTotals(convertedItems, voucher.taxRate, convertedDiscount);
        updated.lineItems = convertedItems;
        updated.discountAmount = convertedDiscount;
        updated.subtotal = totals.subtotal;
        updated.taxAmount = totals.taxAmount;
        updated.totalAmount = totals.totalAmount;
        updated.amount = totals.totalAmount;
      }

      if (!updated.isCustomWords) {
        updated.amountInWords = numberToWords(updated.totalAmount, newCurrency, language);
      }
    } else if (field === "lineItems" || field === "taxRate" || field === "discountAmount") {
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

    onChange(updated);
  };

  // Line Item Handlers
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

  // Quick Preset Handlers
  const handleApplyPreset = (presetKey: "services" | "hardware" | "rent" | "consulting") => {
    setSelectedPreset(presetKey);
    let newType: VoucherType = "RECEIPT";
    let newPayer = "";
    let newPhone = "";
    let newDesc = "";
    let items: LineItem[] = [];
    let taxRate = 5;
    let paymentMethod: PaymentMethod = "BANK_TRANSFER";

    if (presetKey === "services") {
      newType = "RECEIPT";
      newPayer = isRtl ? "شركة الابتكار للحلول الرقمية ش.م.م" : "Innovation Digital Solutions LLC";
      newPhone = "+968 9123 4567";
      newDesc = isRtl ? "دفعة عقد تطوير الأنظمة السحابية والربط الإلكتروني" : "Cloud systems development contract installment";
      items = [
        {
          id: "item-1",
          description: isRtl ? "خدمات تطوير منصة الويب والربط بالسيرفرات السحابية" : "Web Platform Development & Cloud API Integration",
          quantity: 1,
          unitPrice: 450,
          amount: 450
        },
        {
          id: "item-2",
          description: isRtl ? "دعم فني وصيانة أمنية لمدة 6 أشهر" : "6 Months Technical & Security Support",
          quantity: 1,
          unitPrice: 150,
          amount: 150
        }
      ];
    } else if (presetKey === "hardware") {
      newType = "TAX_INVOICE";
      newPayer = isRtl ? "مجموعة النهضة للتجارة العامة" : "Al Nahda General Trading Group";
      newPhone = "+968 9888 1122";
      newDesc = isRtl ? "توريد وتركيب أجهزة نقاط البيع والشاشات التفاعلية" : "Supply & Installation of Interactive POS Hardware";
      items = [
        {
          id: "item-1",
          description: isRtl ? "جهاز كاشير لمس متكامل POS مع طابعة إيصالات حرارية" : "All-in-One Touch POS Terminal with Thermal Printer",
          quantity: 2,
          unitPrice: 280,
          amount: 560
        },
        {
          id: "item-2",
          description: isRtl ? "قارئ باركود لاسلكي عالي السرعة 2D" : "2D High-Speed Wireless Barcode Scanner",
          quantity: 2,
          unitPrice: 35,
          amount: 70
        }
      ];
    } else if (presetKey === "rent") {
      newType = "PAYMENT";
      newPayer = isRtl ? "الشيخ سالم بن راشد المعمري (مالك العقار)" : "Sheikh Salem Al-Maamari (Property Owner)";
      newPhone = "+968 9444 3322";
      newDesc = isRtl ? "سند صرف إيجار مقر الشركة والمستودع - الربع الثالث" : "Headquarters & Warehouse Rent Payment - Q3";
      items = [
        {
          id: "item-1",
          description: isRtl ? "إيجار مقر الشركة الرئيسي بصحار (3 أشهر)" : "Sohar HQ Office Rent (3 Months)",
          quantity: 1,
          unitPrice: 1200,
          amount: 1200
        }
      ];
      taxRate = 0;
      paymentMethod = "CHECK";
    } else if (presetKey === "consulting") {
      newType = "RECEIPT";
      newPayer = isRtl ? "مؤسسة الدليل الشامل للخدمات" : "Comprehensive Guide Center";
      newPhone = "+968 9222 5566";
      newDesc = isRtl ? "استشارات تقنية وتدريب الكوادر على الأنظمة المالية" : "IT Consulting & Financial Systems Staff Training";
      items = [
        {
          id: "item-1",
          description: isRtl ? "جلسات تدريب عملي لإدارة المخزون والمبيعات (10 ساعات)" : "Hands-on POS & Inventory Staff Training (10 Hrs)",
          quantity: 10,
          unitPrice: 25,
          amount: 250
        }
      ];
    }

    const totals = computeTotals(items, taxRate, 0);
    const updated: ReceiptVoucher = {
      ...voucher,
      type: newType,
      receivedFrom: newPayer,
      payerPhone: newPhone,
      notes: newDesc,
      lineItems: items,
      taxRate,
      discountAmount: 0,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      amount: totals.totalAmount,
      paymentMethod,
      amountInWords: numberToWords(totals.totalAmount, voucher.currency, language),
      updatedAt: new Date().toISOString()
    };
    onChange(updated);
  };

  // Select Customer
  const handleSelectCustomer = (customerId: string) => {
    const cust = customers.find((c) => c.id === customerId);
    if (cust) {
      onChange({
        ...voucher,
        receivedFrom: cust.name,
        payerPhone: cust.phone || voucher.payerPhone,
        payerEmail: cust.email || voucher.payerEmail,
        payerTaxId: cust.taxId || voucher.payerTaxId,
        payerAddress: cust.address || voucher.payerAddress,
        updatedAt: new Date().toISOString()
      });
    }
  };

  // Select Supplier
  const handleSelectSupplier = (supplierId: string) => {
    const supp = suppliers.find((s) => s.id === supplierId);
    if (supp) {
      onChange({
        ...voucher,
        receivedFrom: supp.name,
        paidTo: supp.name,
        payerPhone: supp.phone || voucher.payerPhone,
        payerEmail: supp.email || voucher.payerEmail,
        payerTaxId: supp.taxId || voucher.payerTaxId,
        payerAddress: supp.address || voucher.payerAddress,
        updatedAt: new Date().toISOString()
      });
    }
  };

  // Final Issuance Handler
  const handleCompleteIssuance = () => {
    if (!voucher.receivedFrom.trim()) {
      alert(isRtl ? "يرجى كتابة اسم الطرف المستفيد / العميل" : "Please enter the counterparty name");
      setCurrentStep(2);
      return;
    }
    if (voucher.totalAmount <= 0) {
      alert(isRtl ? "يرجى إضافة بند بمبلغ صحيح أكبر من الصفر" : "Please ensure total amount is greater than zero");
      setCurrentStep(3);
      return;
    }

    setIsSaving(true);
    onSave();
    if (onAuditLog) {
      onAuditLog(
        "ISSUE_WIZARD",
        "VOUCHER",
        voucher.id,
        voucher.voucherNumber,
        `إصدار سند مالي [${voucher.voucherNumber}] عبر معالج Doc Wizard للطرف [${voucher.receivedFrom}] بقيمة ${voucher.totalAmount} ${voucher.currency}`,
        `Issued voucher [${voucher.voucherNumber}] via Doc Wizard for [${voucher.receivedFrom}]`
      );
    }
    setIsSaving(false);
    setSaveSuccessMessage(
      isRtl
        ? `تم إصدار السند المالي ${voucher.voucherNumber} بنجاح وترحيله إلى الحسابات والسجلات!`
        : `Voucher ${voucher.voucherNumber} successfully issued and posted to ledgers!`
    );
    setTimeout(() => setSaveSuccessMessage(null), 6000);
  };

  // Steps definition
  const steps = [
    {
      num: 1,
      title: t("wizardStep1"),
      desc: t("wizardStep1Desc"),
      icon: <FileText className="w-5 h-5" />
    },
    {
      num: 2,
      title: t("wizardStep2"),
      desc: t("wizardStep2Desc"),
      icon: <User className="w-5 h-5" />
    },
    {
      num: 3,
      title: t("wizardStep3"),
      desc: t("wizardStep3Desc"),
      icon: <DollarSign className="w-5 h-5" />
    },
    {
      num: 4,
      title: t("wizardStep4"),
      desc: t("wizardStep4Desc"),
      icon: <CreditCard className="w-5 h-5" />
    },
    {
      num: 5,
      title: t("wizardStep5"),
      desc: t("wizardStep5Desc"),
      icon: <CheckCircle2 className="w-5 h-5" />
    }
  ];

  // Document Type Details
  const getDocTypeMetadata = (type: VoucherType) => {
    switch (type) {
      case "RECEIPT":
        return {
          titleAr: "سند قبض مالي",
          titleEn: "Receipt Voucher",
          badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
          icon: <Receipt className="w-4 h-4 text-emerald-600" />
        };
      case "PAYMENT":
        return {
          titleAr: "سند صرف ومصروفات",
          titleEn: "Payment Voucher",
          badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
          icon: <CreditCard className="w-4 h-4 text-rose-600" />
        };
      case "TAX_INVOICE":
        return {
          titleAr: "فاتورة ضريبية رسمية",
          titleEn: "Tax Invoice & Receipt",
          badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-300",
          icon: <FileText className="w-4 h-4 text-indigo-600" />
        };
      case "PETTY_CASH":
        return {
          titleAr: "سند عهدة ومصروفات نثرية",
          titleEn: "Petty Cash Voucher",
          badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
          icon: <ShoppingBag className="w-4 h-4 text-amber-600" />
        };
      case "QUOTATION":
        return {
          titleAr: "عرض سعر مالي",
          titleEn: "Price Quotation",
          badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
          icon: <Briefcase className="w-4 h-4 text-purple-600" />
        };
    }
  };

  const currentDocMeta = getDocTypeMetadata(voucher.type);

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Success Toast */}
      {saveSuccessMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500 animate-slideUp">
          <CheckCircle2 className="w-6 h-6 text-emerald-200 shrink-0" />
          <div className="text-sm font-bold">{saveSuccessMessage}</div>
          <button onClick={() => setSaveSuccessMessage(null)} className="p-1 hover:bg-emerald-600 rounded-lg cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner & Mode Switcher */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-indigo-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {t("docWizardTitle")}
            </span>
            <span className="text-xs font-bold text-slate-400">
              {voucher.voucherNumber}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {t("docWizardTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            {t("docWizardSubtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <button
            onClick={onOpenAiAssistant}
            className="px-3.5 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 text-xs font-bold rounded-xl border border-indigo-400/30 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{isRtl ? "المساعد الذكي" : "AI Assistant"}</span>
          </button>

          <button
            onClick={onSwitchToFullEditor}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            title={t("switchFullEditor")}
          >
            <Layout className="w-4 h-4 text-slate-400" />
            <span>{t("switchFullEditor")}</span>
          </button>

          <button
            onClick={() => setShowMobilePreview(!showMobilePreview)}
            className="lg:hidden px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>{showMobilePreview ? (isRtl ? "إخفاء المعاينة" : "Hide Preview") : (isRtl ? "معاينة المستند" : "View Preview")}</span>
          </button>
        </div>
      </div>

      {/* Wizard Step Progress Tracker */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between relative">
          {/* Progress bar background line */}
          <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-1 bg-slate-100 -z-0 hidden md:block" />
          <div
            className="absolute top-1/2 left-4 -translate-y-1/2 h-1 bg-indigo-600 transition-all duration-300 -z-0 hidden md:block"
            style={{
              width: `${((currentStep - 1) / (steps.length - 1)) * 90}%`
            }}
          />

          {steps.map((step) => {
            const isCompleted = currentStep > step.num;
            const isCurrent = currentStep === step.num;
            return (
              <button
                key={step.num}
                onClick={() => setCurrentStep(step.num)}
                className={`relative z-10 flex flex-col md:flex-row items-center gap-2 md:gap-3 p-2 rounded-xl transition-all cursor-pointer group ${
                  isCurrent ? "scale-105" : "hover:opacity-80"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-all shadow-xs ${
                    isCompleted
                      ? "bg-emerald-600 text-white shadow-emerald-500/20"
                      : isCurrent
                      ? "bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-indigo-500/30"
                      : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5 stroke-[3]" /> : step.num}
                </div>
                <div className="text-center md:text-start">
                  <div className={`text-xs font-black line-clamp-1 ${isCurrent ? "text-indigo-900" : "text-slate-700"}`}>
                    {step.title}
                  </div>
                  <div className="text-[10px] text-slate-400 hidden lg:block">
                    {step.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Wizard Form (Left) & Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Primary Column: Step-by-Step Form Content (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs relative">
            
            {/* Step Header */}
            <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  {steps[currentStep - 1].icon}
                </div>
                <div>
                  <span className="text-[11px] font-black text-indigo-600 uppercase tracking-wider">
                    {isRtl ? `الخطوة ${currentStep} من 5` : `Step ${currentStep} of 5`}
                  </span>
                  <h2 className="text-lg font-black text-slate-900">
                    {steps[currentStep - 1].title}
                  </h2>
                </div>
              </div>

              {/* Step Quick Pill */}
              <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {voucher.voucherNumber}
              </div>
            </div>

            {/* STEP 1: Document Classification, Branch, Numbers, Dates, Fast Presets */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
                {/* Fast Presets */}
                <div className="space-y-2.5">
                  <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    {t("quickFillPresets")}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("services")}
                      className={`p-3 rounded-2xl border text-start transition-all cursor-pointer flex items-center gap-3 ${
                        selectedPreset === "services"
                          ? "bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-200"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{t("presetCorporateServices")}</div>
                        <div className="text-[10px] text-slate-500">{isRtl ? "قبض تحويل بنكي - ضريبة 5%" : "Receipt transfer 5% VAT"}</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApplyPreset("hardware")}
                      className={`p-3 rounded-2xl border text-start transition-all cursor-pointer flex items-center gap-3 ${
                        selectedPreset === "hardware"
                          ? "bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-200"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{t("presetHardwareSale")}</div>
                        <div className="text-[10px] text-slate-500">{isRtl ? "فاتورة ضريبية رسمية" : "Official Tax Invoice"}</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApplyPreset("rent")}
                      className={`p-3 rounded-2xl border text-start transition-all cursor-pointer flex items-center gap-3 ${
                        selectedPreset === "rent"
                          ? "bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-200"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{t("presetOfficeRent")}</div>
                        <div className="text-[10px] text-slate-500">{isRtl ? "سند صرف بشيك مصرفي" : "Payment via bank cheque"}</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApplyPreset("consulting")}
                      className={`p-3 rounded-2xl border text-start transition-all cursor-pointer flex items-center gap-3 ${
                        selectedPreset === "consulting"
                          ? "bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-200"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{t("presetNetworkConsulting")}</div>
                        <div className="text-[10px] text-slate-500">{isRtl ? "سند قبض نقدي / تحويل" : "Consulting services receipt"}</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Document Type Visual Cards */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700">
                    {t("docCategory")} <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { type: "RECEIPT" as VoucherType, labelAr: "سند قبض مالي", labelEn: "Receipt Voucher", color: "emerald", icon: Receipt },
                      { type: "PAYMENT" as VoucherType, labelAr: "سند صرف ومصروفات", labelEn: "Payment Voucher", color: "rose", icon: CreditCard },
                      { type: "TAX_INVOICE" as VoucherType, labelAr: "فاتورة ضريبية وسند", labelEn: "Tax Invoice", color: "indigo", icon: FileText },
                      { type: "PETTY_CASH" as VoucherType, labelAr: "سند عهدة ومصروفات", labelEn: "Petty Cash", color: "amber", icon: ShoppingBag },
                      { type: "QUOTATION" as VoucherType, labelAr: "عرض سعر معتمد", labelEn: "Price Quotation", color: "purple", icon: Briefcase }
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = voucher.type === item.type;
                      return (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => handleFieldChange("type", item.type)}
                          className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                            isSelected
                              ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-indigo-400"
                              : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className={`p-2 rounded-xl ${isSelected ? "bg-white/10 text-white" : "bg-slate-100 text-slate-700"}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                          </div>
                          <div className="text-xs font-black">{isRtl ? item.labelAr : item.labelEn}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Voucher Number, Branch, and Dates Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">{t("voucherNumber")}</label>
                    <input
                      type="text"
                      value={voucher.voucherNumber}
                      onChange={(e) => handleFieldChange("voucherNumber", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">{t("issueDate")}</label>
                    <input
                      type="date"
                      value={voucher.date}
                      onChange={(e) => handleFieldChange("date", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {branches.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">{isRtl ? "الفرع المصدر" : "Issuing Branch"}</label>
                      <select
                        value={voucher.branchId || ""}
                        onChange={(e) => {
                          const br = branches.find((b) => b.id === e.target.value);
                          onChange({
                            ...voucher,
                            branchId: e.target.value,
                            branchName: br ? br.name : undefined,
                            updatedAt: new Date().toISOString()
                          });
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">{isRtl ? "الفرع الرئيسي (افتراضي)" : "Main Branch (Default)"}</option>
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">{t("referenceNo")}</label>
                    <input
                      type="text"
                      placeholder={isRtl ? "مثال: PO-9921 / عقد 402" : "e.g. PO-9921 / Contract 402"}
                      value={voucher.referenceNo || ""}
                      onChange={(e) => handleFieldChange("referenceNo", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Counterparty & Contact Details */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fadeIn">
                {/* Pick from existing Customers or Suppliers */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-indigo-600" />
                      {t("selectCustomerOrSupplier")}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {customers.length > 0 && (
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 mb-1 block">
                          {isRtl ? "العملاء المسجلين:" : "Registered Customers:"}
                        </label>
                        <select
                          onChange={(e) => handleSelectCustomer(e.target.value)}
                          defaultValue=""
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden"
                        >
                          <option value="" disabled>{isRtl ? "-- اختر عميلاً للتعبئة التلقائية --" : "-- Select a customer --"}</option>
                          {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.phone ? `(${c.phone})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {suppliers.length > 0 && (
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 mb-1 block">
                          {isRtl ? "الموردين والجهات المعتمدة:" : "Approved Suppliers:"}
                        </label>
                        <select
                          onChange={(e) => handleSelectSupplier(e.target.value)}
                          defaultValue=""
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden"
                        >
                          <option value="" disabled>{isRtl ? "-- اختر مورداً للتعبئة التلقائية --" : "-- Select a supplier --"}</option>
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} {s.phone ? `(${s.phone})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Party Name (Required) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{voucher.type === "PAYMENT" ? (isRtl ? "يصرف إلى المكرم / السادة" : "Paid To (Payee / Supplier)") : (isRtl ? "استلمنا من المكرم / السادة" : "Received From (Customer)")}</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isRtl ? "اسم العميل، الشركة، أو المستفيد..." : "Client or Beneficiary name..."}
                    value={voucher.receivedFrom}
                    onChange={(e) => handleFieldChange("receivedFrom", e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Contact Information (Phone, Email, Tax ID, Address) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t("phone")}</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="+968 9000 0000"
                      value={voucher.payerPhone || ""}
                      onChange={(e) => handleFieldChange("payerPhone", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t("email")}</span>
                    </label>
                    <input
                      type="email"
                      placeholder="client@example.com"
                      value={voucher.payerEmail || ""}
                      onChange={(e) => handleFieldChange("payerEmail", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t("vatNumber")}</span>
                    </label>
                    <input
                      type="text"
                      placeholder="OM1234567890"
                      value={voucher.payerTaxId || ""}
                      onChange={(e) => handleFieldChange("payerTaxId", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t("address")}</span>
                    </label>
                    <input
                      type="text"
                      placeholder={isRtl ? "صحار، سلطنة عمان" : "Sohar, Sultanate of Oman"}
                      value={voucher.payerAddress || ""}
                      onChange={(e) => handleFieldChange("payerAddress", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Transaction General Description */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-bold text-slate-700">{t("description")}</label>
                  <textarea
                    rows={2}
                    placeholder={isRtl ? "بيان عام للمعاملة أو الدفعة المالية..." : "General description / purpose of payment..."}
                    value={voucher.notes || ""}
                    onChange={(e) => handleFieldChange("notes", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* STEP 3: Line Items, Amounts, Taxes, Discounts & Tafqeet */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>{isRtl ? "بنود وتفاصيل المعاملة المالية" : "Financial Line Items & Breakdown"}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t("addLineItem")}</span>
                  </button>
                </div>

                {/* Line Items List */}
                <div className="space-y-3">
                  {voucher.lineItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-black text-slate-500 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                          {isRtl ? `بند #${index + 1}` : `Item #${index + 1}`}
                        </span>

                        {voucher.lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(item.id)}
                            className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                            title={t("delete")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-6 space-y-1">
                          <label className="text-[11px] font-bold text-slate-600">{t("itemDescription")}</label>
                          <input
                            type="text"
                            placeholder={isRtl ? "وصف الخدمة أو المنتج..." : "Service or product description..."}
                            value={item.description}
                            onChange={(e) => handleLineItemChange(item.id, "description", e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[11px] font-bold text-slate-600">{t("quantity")}</label>
                          <input
                            type="number"
                            min="1"
                            step="any"
                            value={item.quantity}
                            onChange={(e) => handleLineItemChange(item.id, "quantity", e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-center"
                          />
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[11px] font-bold text-slate-600">{t("unitPrice")}</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.unitPrice}
                            onChange={(e) => handleLineItemChange(item.id, "unitPrice", e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-center"
                          />
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[11px] font-bold text-slate-600">{t("amount")}</label>
                          <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-black text-slate-900 text-center">
                            {item.amount.toFixed(3)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tax, Discount, and Currency Section */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t("taxRate")} (%)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      {[0, 5, 15].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => handleFieldChange("taxRate", rate)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex-1 cursor-pointer ${
                            voucher.taxRate === rate
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {rate}%
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t("discount")}</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={voucher.discountAmount || 0}
                      onChange={(e) => handleFieldChange("discountAmount", Number(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-center"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>{t("currency")}</span>
                      {companySettings.autoConvertCurrency && (
                        <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                          <Coins className="w-3 h-3" />
                          <span>{isRtl ? "تحويل تلقائي" : "Auto-converted"}</span>
                        </span>
                      )}
                    </label>
                    <select
                      value={voucher.currency}
                      onChange={(e) => handleFieldChange("currency", e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:bg-white focus:outline-hidden"
                    >
                      {AVAILABLE_CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code} - {isRtl ? c.nameAr : c.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Financial Summary Block */}
                <div className="p-4 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl text-white space-y-2.5 shadow-md">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>{t("subtotal")}:</span>
                    <span className="font-bold font-mono">{voucher.subtotal.toFixed(3)} {voucher.currency}</span>
                  </div>
                  {voucher.taxAmount > 0 && (
                    <div className="flex items-center justify-between text-xs text-indigo-300">
                      <span>{t("taxAmount")} ({voucher.taxRate}%):</span>
                      <span className="font-bold font-mono">+{voucher.taxAmount.toFixed(3)} {voucher.currency}</span>
                    </div>
                  )}
                  {voucher.discountAmount > 0 && (
                    <div className="flex items-center justify-between text-xs text-rose-300">
                      <span>{t("discount")}:</span>
                      <span className="font-bold font-mono">-{voucher.discountAmount.toFixed(3)} {voucher.currency}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-sm font-black">{t("total")}:</span>
                    <span className="text-xl font-black text-emerald-400 font-mono">
                      {voucher.totalAmount.toFixed(3)} {voucher.currency}
                    </span>
                  </div>

                  {/* Equivalent in Base Currency if different */}
                  {voucher.currency !== (companySettings.defaultCurrency || "OMR") && (
                    <div className="py-2 px-3 bg-amber-500/20 border border-amber-400/30 rounded-xl flex items-center justify-between text-xs font-bold text-amber-200">
                      <div className="flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isRtl ? "المعادل بالعملة الأساسية:" : "Base currency equivalent:"}</span>
                      </div>
                      <span className="font-mono text-white text-sm">
                        ≈ {formatCurrencyAmount(
                          convertCurrency(
                            voucher.totalAmount,
                            voucher.currency,
                            companySettings.defaultCurrency || "OMR",
                            companySettings.customExchangeRates
                          ),
                          companySettings.defaultCurrency || "OMR"
                        )} {companySettings.defaultCurrency || "OMR"}
                      </span>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-300 bg-white/10 p-2 rounded-xl">
                    <span className="font-bold">{t("amountInWords")}: </span>
                    <span>{voucher.amountInWords}</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Payment Method, Bank Account & Settlement */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700">
                    {t("paymentMethod")} <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { method: "CASH" as PaymentMethod, labelAr: "نقداً (كاش)", labelEn: "Cash", icon: DollarSign },
                      { method: "BANK_TRANSFER" as PaymentMethod, labelAr: "تحويل بنكي", labelEn: "Bank Transfer", icon: Building2 },
                      { method: "CARD" as PaymentMethod, labelAr: "بطاقة بنكية (POS)", labelEn: "Credit / Debit Card", icon: CreditCard },
                      { method: "CHECK" as PaymentMethod, labelAr: "شيك مصرفي", labelEn: "Bank Cheque", icon: FileText },
                      { method: "ONLINE" as PaymentMethod, labelAr: "دفع إلكتروني", labelEn: "Online Payment", icon: Sparkles }
                    ].map((m) => {
                      const Icon = m.icon;
                      const isSelected = voucher.paymentMethod === m.method;
                      return (
                        <button
                          key={m.method}
                          type="button"
                          onClick={() => handleFieldChange("paymentMethod", m.method)}
                          className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                            isSelected
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300"
                              : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className={`p-2 rounded-xl ${isSelected ? "bg-white/20 text-white" : "bg-white text-slate-700 border border-slate-200"}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                          </div>
                          <div className="text-xs font-black">{isRtl ? m.labelAr : m.labelEn}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Conditional Fields: Bank, Cheque, Card */}
                {(voucher.paymentMethod === "BANK_TRANSFER" || voucher.paymentMethod === "CHECK" || voucher.paymentMethod === "ONLINE") && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      <span>{isRtl ? "تفاصيل البنك والحساب المصرفي" : "Bank & Account Details"}</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">{t("bankName")}</label>
                        <select
                          value={voucher.bankName || ""}
                          onChange={(e) => handleFieldChange("bankName", e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                        >
                          <option value="بنك مسقط (Bank Muscat)">بنك مسقط (Bank Muscat)</option>
                          <option value="بنك ظفار (Bank Dhofar)">بنك ظفار (Bank Dhofar)</option>
                          <option value="البنك الوطني العماني (NBO)">البنك الوطني العماني (NBO)</option>
                          <option value="صحار الدولي (Sohar International)">صحار الدولي (Sohar International)</option>
                          <option value="بنك نزوى (Bank Nizwa)">بنك نزوى (Bank Nizwa)</option>
                          <option value="بنك العز الإسلامي (Alizz Islamic)">بنك العز الإسلامي (Alizz Islamic)</option>
                          <option value="أخرى / حساب إلكتروني">أخرى / حساب إلكتروني</option>
                        </select>
                      </div>

                      {voucher.paymentMethod === "CHECK" && (
                        <>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">{t("chequeNumber")}</label>
                            <input
                              type="text"
                              placeholder="CHK-88129"
                              value={voucher.checkNumber || ""}
                              onChange={(e) => handleFieldChange("checkNumber", e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                            />
                          </div>
                        </>
                      )}

                      {(voucher.paymentMethod === "BANK_TRANSFER" || voucher.paymentMethod === "ONLINE") && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">{isRtl ? "اسم البنك / المرجع" : "Bank Name / Ref"}</label>
                          <input
                            type="text"
                            placeholder="Bank / OM24001000..."
                            value={voucher.bankName || ""}
                            onChange={(e) => handleFieldChange("bankName", e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment Status Pill */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700">{t("status")}</label>
                  <div className="flex items-center gap-3">
                    {[
                      { status: "PAID" as VoucherStatus, labelAr: "مدفوع بالكامل", labelEn: "Paid in Full", color: "emerald" },
                      { status: "DRAFT" as VoucherStatus, labelAr: "مسودة / قيد المراجعة", labelEn: "Draft / Pending", color: "amber" },
                      { status: "ISSUED" as VoucherStatus, labelAr: "معتمد ومصدر", labelEn: "Issued", color: "sky" }
                    ].map((st) => (
                      <button
                        key={st.status}
                        type="button"
                        onClick={() => handleFieldChange("status", st.status)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex-1 flex items-center justify-center gap-1.5 ${
                          voucher.status === st.status
                            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${voucher.status === st.status ? "bg-emerald-400" : "bg-slate-400"}`} />
                        <span>{isRtl ? st.labelAr : st.labelEn}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Terms, Notes, Approvals & Final Issuance */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">{t("notes")}</label>
                    <textarea
                      rows={2}
                      placeholder={isRtl ? "ملاحظات إضافية، بنود الضمان، أو تعليمات خاصة..." : "Special notes, warranty terms, or remarks..."}
                      value={voucher.notes || ""}
                      onChange={(e) => handleFieldChange("notes", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">{t("termsAndConditions")}</label>
                    <textarea
                      rows={2}
                      placeholder={isRtl ? "شروط الاسترجاع، فترة السداد، والمسؤولية القانونية..." : "Terms and conditions..."}
                      value={voucher.terms || ""}
                      onChange={(e) => handleFieldChange("terms", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">{t("receivedBy")}</label>
                      <input
                        type="text"
                        placeholder={isRtl ? "المستلم / أمين الصندوق" : "Received by / Cashier"}
                        value={voucher.receivedBy || ""}
                        onChange={(e) => handleFieldChange("receivedBy", e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">{t("preparedBy")}</label>
                      <input
                        type="text"
                        placeholder={isRtl ? "المحاسب / المنظم" : "Prepared by / Accountant"}
                        value={voucher.preparedBy || ""}
                        onChange={(e) => handleFieldChange("preparedBy", e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Final Checklist Box */}
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-900 text-xs font-black">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>{isRtl ? "المستند جاهز للاعتماد والترحيل المالي الرسمي" : "Document is ready for official ledger posting"}</span>
                  </div>
                  <p className="text-[11px] text-emerald-800/80">
                    {isRtl
                      ? "سيتم حفظ المستند، توليد الباركود ورمز الاستجابة السريعة QR، وتحديث حركة الصندوق فوراً."
                      : "Document will be archived, stamped with official QR and reflected in cashier ledger."}
                  </p>
                </div>
              </div>
            )}

            {/* Bottom Wizard Navigation Footer */}
            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between gap-3">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <PrevIcon className="w-4 h-4" />
                  <span>{t("prevStep")}</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span>{t("nextStep")}</span>
                    <NextIcon className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleCompleteIssuance}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSaving ? t("issuingVoucher") : t("issueVoucherNow")}</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Right / Secondary Column: High-Fidelity Side Live Preview (5 cols) */}
        <div className={`lg:col-span-5 space-y-4 ${showMobilePreview ? "block" : "hidden lg:block"}`}>
          <div className="sticky top-6 space-y-3">
            {/* Preview Toolbar Header */}
            <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-md flex items-center justify-between gap-2 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold tracking-tight">{t("livePreview")}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onPrint}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-colors cursor-pointer"
                  title={t("print")}
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onExportPdf}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-colors cursor-pointer"
                  title={t("exportPdf")}
                >
                  <FileDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onPreview}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>{isRtl ? "معاينة كاملة" : "Full View"}</span>
                </button>
              </div>
            </div>

            {/* Live Paper Simulation Container */}
            <div
              id="doc-wizard-live-preview-paper"
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl space-y-5 text-slate-800 relative overflow-hidden transition-all text-xs"
            >
              {/* Paper Watermark / Seal background */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] select-none font-black text-8xl text-slate-900 rotate-12">
                OFFICIAL
              </div>

              {/* Company Header Block */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    {companySettings?.companyName}
                  </h3>
                  <div className="text-[10px] text-slate-500">
                    {companySettings?.tagline || "Smart Business Solutions"}
                  </div>
                  {companySettings?.taxId && (
                    <div className="text-[9px] font-mono text-slate-400">
                      VAT: {companySettings.taxId}
                    </div>
                  )}
                </div>

                {/* Mini QR or Stamp */}
                <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-700 shrink-0">
                  <QrCode className="w-8 h-8 opacity-80" />
                </div>
              </div>

              {/* Document Title Banner */}
              <div className="bg-slate-900 text-white rounded-xl py-2 px-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black">{currentDocMeta.titleAr}</div>
                  <div className="text-[9px] text-slate-300 font-mono uppercase">{currentDocMeta.titleEn}</div>
                </div>
                <div className="text-end">
                  <div className="text-xs font-black font-mono text-amber-300">{voucher.voucherNumber}</div>
                  <div className="text-[9px] text-slate-300">{voucher.date}</div>
                </div>
              </div>

              {/* Counterparty & Key Info */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[10px] font-bold text-slate-500">
                    {voucher.type === "PAYMENT" ? (isRtl ? "المستفيد:" : "Payee:") : (isRtl ? "العميل:" : "Client:")}
                  </span>
                  <span className="text-xs font-black text-slate-900 text-end">
                    {voucher.receivedFrom || (isRtl ? "---" : "---")}
                  </span>
                </div>
                {voucher.payerPhone && (
                  <div className="flex items-center justify-between text-[10px] text-slate-500" dir="ltr">
                    <span className="font-bold">Phone:</span>
                    <span>{voucher.payerPhone}</span>
                  </div>
                )}
                {voucher.referenceNo && (
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="font-bold">{isRtl ? "رقم المرجع:" : "Ref #:"}</span>
                    <span className="font-mono">{voucher.referenceNo}</span>
                  </div>
                )}
              </div>

              {/* Line Items Table Simulation */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between px-1">
                  <span>{isRtl ? "البيان / الخدمات" : "Items / Description"}</span>
                  <span>{isRtl ? "المبلغ" : "Amount"}</span>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {voucher.lineItems.map((item, idx) => (
                    <div key={item.id || idx} className="p-2 flex items-center justify-between bg-white text-[10px]">
                      <div className="max-w-[70%]">
                        <div className="font-bold text-slate-800 line-clamp-1">{item.description || (isRtl ? "بند غير محدد" : "Item")}</div>
                        <div className="text-slate-400 text-[9px]">
                          {item.quantity} × {item.unitPrice.toFixed(3)}
                        </div>
                      </div>
                      <div className="font-black text-slate-900 font-mono">
                        {item.amount.toFixed(3)} {voucher.currency}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Breakdown */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 text-[11px]">
                <div className="flex items-center justify-between text-slate-600">
                  <span>{t("subtotal")}:</span>
                  <span className="font-mono">{voucher.subtotal.toFixed(3)}</span>
                </div>
                {voucher.taxAmount > 0 && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span>{t("taxAmount")} ({voucher.taxRate}%):</span>
                    <span className="font-mono">+{voucher.taxAmount.toFixed(3)}</span>
                  </div>
                )}
                {voucher.discountAmount > 0 && (
                  <div className="flex items-center justify-between text-rose-600">
                    <span>{t("discount")}:</span>
                    <span className="font-mono">-{voucher.discountAmount.toFixed(3)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs font-black text-slate-900 pt-1 border-t border-slate-200">
                  <span>{t("total")}:</span>
                  <span className="text-indigo-700 font-mono font-black">{voucher.totalAmount.toFixed(3)} {voucher.currency}</span>
                </div>
              </div>

              {/* Amount in words */}
              <div className="text-[10px] text-slate-600 italic bg-amber-50/50 p-2 rounded-lg border border-amber-100/60 leading-tight">
                "{voucher.amountInWords}"
              </div>

              {/* Settlement & Signatures */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                <div>
                  <span className="font-bold">{isRtl ? "طريقة الدفع: " : "Method: "}</span>
                  <span>{voucher.paymentMethod}</span>
                </div>
                <div className="text-end">
                  <span className="font-bold">{isRtl ? "الحالة: " : "Status: "}</span>
                  <span className="font-black text-emerald-700">{voucher.status}</span>
                </div>
              </div>
            </div>

            {/* Helper Tip */}
            <div className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{t("previewSideTip")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
