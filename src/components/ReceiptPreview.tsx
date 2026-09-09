import React, { useState } from "react";
import {
  ReceiptVoucher,
  CompanySettings,
  DesignTheme,
  PageSizeFormat,
  PrintLanguage,
  VoucherType,
  PaymentMethod
} from "../types";
import { formatDateToDDMMMMYYYY } from "../utils/dateFormatter";
import { shareVoucherData } from "../utils/pwaManager";
import { useLanguage } from "../utils/LanguageContext";
import { numberToWords } from "../utils/numberToWords";
import { convertCurrency, getCurrencyInfo } from "../utils/currencyConverter";
import { DEFAULT_COMPANY_SETTINGS } from "../utils/storage";
import {
  Printer,
  FileDown,
  ZoomIn,
  ZoomOut,
  Maximize2,
  QrCode,
  Share2,
  Globe,
  CheckCircle2,
  Coins,
  Barcode as BarcodeIcon,
  MessageSquare
} from "lucide-react";
import { BarcodeRenderer } from "./BarcodeRenderer";
import { WhatsAppShareModal } from "./WhatsAppShareModal";

interface ReceiptPreviewProps {
  voucher: ReceiptVoucher;
  settings?: CompanySettings;
  theme: DesignTheme;
  onPrint: () => void;
  onExportPdf: () => void;
  onUpdateTheme?: (theme: DesignTheme) => void;
}

export const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({
  voucher,
  settings = DEFAULT_COMPANY_SETTINGS,
  theme,
  onPrint,
  onExportPdf,
  onUpdateTheme
}) => {
  const { language, t, dir, isRTL } = useLanguage();
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState<boolean>(false);
  const [printLang, setPrintLang] = useState<PrintLanguage>(
    (theme.printLanguage as PrintLanguage) || "bilingual"
  );

  const getPageDimensionsClass = (pageSize: PageSizeFormat) => {
    switch (pageSize) {
      case "A5":
        return "w-[148mm] min-h-[210mm]";
      case "LETTER":
        return "w-[216mm] min-h-[279mm]";
      case "THERMAL_80MM":
        return "w-[80mm] min-h-[140mm]";
      case "THERMAL_58MM":
        return "w-[58mm] min-h-[120mm]";
      case "A4":
      default:
        return "w-[210mm] min-h-[297mm]";
    }
  };

  const isThermal = theme.pageSize === "THERMAL_80MM" || theme.pageSize === "THERMAL_58MM";

  // Helper labels based on PrintLanguage
  const getDocTitle = (type: VoucherType) => {
    if (printLang === "ar") {
      switch (type) {
        case "RECEIPT": return "سند قبض مالي";
        case "TAX_INVOICE": return "فاتورة ضريبية وسند قبض";
        case "QUOTATION": return "عرض سعر مالي";
        case "PAYMENT": return "سند صرف ومصروفات";
        case "PETTY_CASH": return "سند عهدة نثرية";
      }
    }
    if (printLang === "en") {
      switch (type) {
        case "RECEIPT": return "RECEIPT VOUCHER";
        case "TAX_INVOICE": return "TAX INVOICE & RECEIPT";
        case "QUOTATION": return "PRICE QUOTATION";
        case "PAYMENT": return "PAYMENT VOUCHER";
        case "PETTY_CASH": return "PETTY CASH VOUCHER";
      }
    }
    // Bilingual
    switch (type) {
      case "RECEIPT": return "سند قبض / RECEIPT VOUCHER";
      case "TAX_INVOICE": return "فاتورة ضريبية / TAX INVOICE";
      case "QUOTATION": return "عرض سعر / PRICE QUOTATION";
      case "PAYMENT": return "سند صرف / PAYMENT VOUCHER";
      case "PETTY_CASH": return "سند عهدة / PETTY CASH";
    }
  };

  const getPayerLabel = () => {
    if (voucher.type === "PAYMENT") {
      if (printLang === "ar") return "يصرف إلى المكرم / السادة:";
      if (printLang === "en") return "Paid To (Payee / Vendor):";
      return "صرف إلى / Paid To (Payee):";
    }
    if (printLang === "ar") return "استلمنا من الفاضل / السادة:";
    if (printLang === "en") return "Received From (Client):";
    return "استلمنا من / Received From:";
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    const map: Record<PaymentMethod, { ar: string; en: string }> = {
      CASH: { ar: "نقداً", en: "Cash" },
      BANK_TRANSFER: { ar: "تحويل بنكي", en: "Bank Transfer" },
      CHECK: { ar: "شيك بنكي", en: "Cheque" },
      CREDIT_CARD: { ar: "بطاقة مصرفية", en: "Credit/Debit Card" },
      ONLINE: { ar: "دفع إلكتروني", en: "Online Gateway" },
      OTHER: { ar: "أخرى", en: "Other" }
    };
    const item = map[method] || { ar: method, en: method };
    if (printLang === "ar") return item.ar;
    if (printLang === "en") return item.en;
    return `${item.ar} / ${item.en}`;
  };

  // Words computation
  const wordsAr = numberToWords(voucher.totalAmount, voucher.currency, "ar");
  const wordsEn = numberToWords(voucher.totalAmount, voucher.currency, "en");

  const renderAmountInWords = () => {
    if (printLang === "ar") {
      return voucher.isCustomWords ? voucher.amountInWords : wordsAr;
    }
    if (printLang === "en") {
      return voucher.isCustomWords ? voucher.amountInWords : wordsEn;
    }
    // Bilingual
    return (
      <div className="space-y-1">
        <p className="font-semibold text-slate-900 leading-snug">{wordsAr}</p>
        <p className="text-[11px] font-serif italic text-slate-600">{wordsEn}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16" dir={dir}>
      
      {/* Quick Toolbar for Preview Controls */}
      <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4 print:hidden">
        
        {/* Print Language Selector */}
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {t("printLanguage")}:
          </span>
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-medium">
            <button
              onClick={() => {
                setPrintLang("bilingual");
                onUpdateTheme && onUpdateTheme({ ...theme, printLanguage: "bilingual" });
              }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                printLang === "bilingual"
                  ? "bg-indigo-600 text-white font-bold shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t("langBilingual")}
            </button>
            <button
              onClick={() => {
                setPrintLang("ar");
                onUpdateTheme && onUpdateTheme({ ...theme, printLanguage: "ar" });
              }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                printLang === "ar"
                  ? "bg-indigo-600 text-white font-bold shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t("langArabic")}
            </button>
            <button
              onClick={() => {
                setPrintLang("en");
                onUpdateTheme && onUpdateTheme({ ...theme, printLanguage: "en" });
              }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                printLang === "en"
                  ? "bg-indigo-600 text-white font-bold shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t("langEnglish")}
            </button>
          </div>
        </div>

        {/* Paper Size selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:inline">
            {t("pageSize")}:
          </span>
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-medium">
            {(["A4", "A5", "LETTER", "THERMAL_80MM"] as PageSizeFormat[]).map((size) => (
              <button
                key={size}
                onClick={() => onUpdateTheme && onUpdateTheme({ ...theme, pageSize: size })}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  theme.pageSize === size
                    ? "bg-indigo-600 text-white font-bold shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {size === "THERMAL_80MM" ? "Thermal" : size}
              </button>
            ))}
          </div>
        </div>

        {/* Template Style Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline">
            {t("templateStyle")}:
          </span>
          <select
            value={theme.templateId}
            onChange={(e) =>
              onUpdateTheme &&
              onUpdateTheme({ ...theme, templateId: e.target.value as any })
            }
            className="bg-slate-800 text-slate-200 border border-slate-700 text-xs rounded-xl px-2.5 py-1 font-semibold focus:outline-none"
          >
            <option value="modern">{t("modernClean")}</option>
            <option value="classic">{t("corporateClassic")}</option>
            <option value="executive">{t("executiveStamp")}</option>
            <option value="minimalist">{t("minimalistLight")}</option>
            <option value="thermal80">{t("thermalReceipt")}</option>
          </select>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-slate-300 w-10 text-center">
            {zoomLevel}%
          </span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(100)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
            title="Reset Zoom"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* WhatsApp Share Button */}
          <button
            onClick={() => setIsWhatsAppModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all"
            title={language === "ar" ? "إرسال عبر WhatsApp" : "Share via WhatsApp"}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{language === "ar" ? "واتساب" : "WhatsApp"}</span>
          </button>

          {typeof navigator !== "undefined" && navigator.share && (
            <button
              onClick={() =>
                shareVoucherData({
                  title: `سند رقم ${voucher.voucherNumber}`,
                  text: `سند مالي رقم ${voucher.voucherNumber} بمبلغ ${voucher.totalAmount.toLocaleString()} ${voucher.currency} لصالح ${voucher.receivedFrom}`,
                })
              }
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all"
              title="مشاركة"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">{t("share")}</span>
            </button>
          )}

          <button
            onClick={onPrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>{t("print")}</span>
          </button>

          <button
            onClick={onExportPdf}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all"
          >
            <FileDown className="w-4 h-4" />
            <span>{t("exportPdf")}</span>
          </button>
        </div>

      </div>

      {/* Main Printable Container Stage */}
      <div className="flex justify-center overflow-x-auto p-4 bg-slate-200/80 rounded-3xl border border-slate-300 shadow-inner">
        <div
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
          className="transition-transform duration-200"
        >
          {/* Exact Printable Node */}
          <div
            id="receipt-voucher-print-area"
            dir={printLang === "en" ? "ltr" : "rtl"}
            style={{
              fontFamily:
                theme.fontFamily === "serif"
                  ? "'Cairo', 'Tajawal', Georgia, Cambria, serif"
                  : theme.fontFamily === "mono"
                  ? "'Cairo', 'Tajawal', 'Courier New', monospace"
                  : "'Cairo', 'Tajawal', 'Alexandria', system-ui, -apple-system, sans-serif",
              color: theme.textColor || "#0f172a",
              backgroundColor: theme.backgroundColor || "#ffffff"
            }}
            className={`relative bg-white p-6 sm:p-8 md:p-10 shadow-2xl rounded-sm text-slate-900 border border-slate-300 ${getPageDimensionsClass(
              theme.pageSize
            )} print:shadow-none print:border-none print:m-0 print:p-4 print:w-full print:max-h-[280mm] print:overflow-hidden`}
          >
            
            {/* Watermark Overlay */}
            {theme.showWatermark && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0 opacity-[0.04]">
                <span className="text-8xl font-black uppercase tracking-widest -rotate-45 text-slate-900 border-8 border-slate-900 p-8 rounded-3xl">
                  {theme.watermarkText || voucher.status || "PAID"}
                </span>
              </div>
            )}

            {/* THERMAL 80MM / 58MM TEMPLATE */}
            {isThermal || theme.templateId === "thermal80" ? (
              <div className="relative z-10 space-y-3 text-xs font-mono leading-tight text-slate-900 max-w-[76mm] mx-auto p-1" dir={printLang === "en" ? "ltr" : "rtl"}>
                
                {/* Thermal Header */}
                <div className="text-center space-y-1 border-b-2 border-dashed border-slate-900 pb-3">
                  {theme.showLogo && settings?.logoUrl && (
                    <img src={settings.logoUrl} alt="Logo" crossOrigin="anonymous" className="h-10 mx-auto object-contain mb-1" />
                  )}
                  <h1 className="text-sm font-black uppercase tracking-tight">{settings?.companyName}</h1>
                  {settings?.tagline && <p className="text-[9px] text-slate-700">{settings.tagline}</p>}
                  <p className="text-[10px] text-slate-800">{settings?.address}</p>
                  <div className="text-[10px] text-slate-800 flex flex-wrap justify-center gap-x-2">
                    {settings?.phone && <span>Tel: {settings.phone}</span>}
                    {settings?.taxId && <span className="font-bold">VAT: {settings.taxId}</span>}
                    {settings?.crNumber && <span>CR: {settings.crNumber}</span>}
                  </div>
                  {voucher.branchName && (
                    <p className="text-[10px] font-bold text-slate-900 border-t border-slate-300 pt-0.5 mt-0.5">
                      {printLang === "ar" ? "الفرع: " : "Branch: "}{voucher.branchName}
                    </p>
                  )}
                  <div className="pt-1">
                    <span className="inline-block bg-slate-900 text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-xs">
                      *** {getDocTitle(voucher.type)} ***
                    </span>
                  </div>
                </div>

                {/* Thermal Meta Info */}
                <div className="text-[10px] space-y-1 border-b border-dashed border-slate-900 pb-2">
                  <div className="flex justify-between">
                    <span className="font-bold">{printLang === "ar" ? "رقم السند:" : "Voucher #:"}</span>
                    <span className="font-black text-slate-900">{voucher.voucherNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{printLang === "ar" ? "التاريخ:" : "Date:"}</span>
                    <span>{voucher.date}</span>
                  </div>
                  {voucher.receivedFrom && (
                    <div className="flex justify-between">
                      <span className="font-bold">{printLang === "ar" ? "العميل:" : "Client:"}</span>
                      <span className="font-semibold text-right max-w-[150px] truncate">{voucher.receivedFrom}</span>
                    </div>
                  )}
                  {voucher.payerPhone && (
                    <div className="flex justify-between text-slate-700">
                      <span>{printLang === "ar" ? "الهاتف:" : "Phone:"}</span>
                      <span>{voucher.payerPhone}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>{printLang === "ar" ? "طريقة السداد:" : "Payment:"}</span>
                    <span className="font-bold">{getPaymentMethodLabel(voucher.paymentMethod)}</span>
                  </div>
                  {voucher.preparedBy && (
                    <div className="flex justify-between text-slate-700">
                      <span>{printLang === "ar" ? "الكاشير / المنشئ:" : "Cashier:"}</span>
                      <span>{voucher.preparedBy}</span>
                    </div>
                  )}
                </div>

                {/* Thermal Line Items Table */}
                <div className="border-b border-dashed border-slate-900 pb-2">
                  <div className="flex justify-between text-[10px] font-bold border-b border-slate-400 pb-1 mb-1">
                    <span className="w-1/2 text-right">{printLang === "ar" ? "البند والوصف" : "Item"}</span>
                    <span className="w-1/4 text-center">{printLang === "ar" ? "الكمية" : "Qty"}</span>
                    <span className="w-1/4 text-left">{printLang === "ar" ? "الإجمالي" : "Total"}</span>
                  </div>
                  <div className="space-y-1.5 text-[10px]">
                    {voucher.lineItems.map((item, idx) => (
                      <div key={item.id || idx} className="space-y-0.5">
                        <div className="font-bold text-slate-900">{item.description || "---"}</div>
                        <div className="flex justify-between text-slate-700 font-mono">
                          <span>
                            {item.quantity} x {item.unitPrice.toFixed(voucher.currency === "OMR" || voucher.currency === "KWD" ? 3 : 2)}
                          </span>
                          <span className="font-bold text-slate-900">
                            {item.amount.toFixed(voucher.currency === "OMR" || voucher.currency === "KWD" ? 3 : 2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Thermal Financial Summary */}
                <div className="space-y-1 text-[11px] font-mono border-b-2 border-dashed border-slate-900 pb-2">
                  <div className="flex justify-between text-slate-700">
                    <span>{printLang === "ar" ? "المجموع الفرعي:" : "Subtotal:"}</span>
                    <span>{voucher.currency} {voucher.subtotal.toFixed(voucher.currency === "OMR" || voucher.currency === "KWD" ? 3 : 2)}</span>
                  </div>
                  {voucher.taxAmount > 0 && (
                    <div className="flex justify-between text-slate-700">
                      <span>{printLang === "ar" ? `الضريبة (${voucher.taxRate}%):` : `VAT (${voucher.taxRate}%):`}</span>
                      <span>+ {voucher.currency} {voucher.taxAmount.toFixed(voucher.currency === "OMR" || voucher.currency === "KWD" ? 3 : 2)}</span>
                    </div>
                  )}
                  {voucher.discountAmount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>{printLang === "ar" ? "الخصم الممنوح:" : "Discount:"}</span>
                      <span>- {voucher.currency} {voucher.discountAmount.toFixed(voucher.currency === "OMR" || voucher.currency === "KWD" ? 3 : 2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm font-black pt-1 border-t border-slate-400 text-slate-950">
                    <span>{printLang === "ar" ? "الصافي النهائي:" : "NET TOTAL:"}</span>
                    <span>{voucher.currency} {voucher.totalAmount.toFixed(voucher.currency === "OMR" || voucher.currency === "KWD" ? 3 : 2)}</span>
                  </div>

                  {/* Multi-Currency Equivalence in Base Currency */}
                  {settings.showEquivalentInBaseCurrency && settings.defaultCurrency && voucher.currency !== settings.defaultCurrency && (
                    <div className="mt-1 pt-1 border-t border-dotted border-slate-400 bg-slate-100 p-1 rounded text-center text-[10px] font-bold text-slate-800">
                      <span>
                        {printLang === "ar" ? "المعادل التقريبي: " : "Equivalent: "}
                        {settings.defaultCurrency}{" "}
                        {convertCurrency(
                          voucher.totalAmount,
                          voucher.currency,
                          settings.defaultCurrency,
                          settings.customExchangeRates
                        ).toFixed(settings.defaultCurrency === "OMR" || settings.defaultCurrency === "KWD" ? 3 : 2)}
                      </span>
                    </div>
                  )}

                  {theme.showAmountInWords && (
                    <div className="text-[9px] font-sans text-slate-800 pt-1 leading-tight">
                      {renderAmountInWords()}
                    </div>
                  )}
                </div>

                {/* Digital Signature on Thermal (If configured) */}
                {theme.showSignatureBlock && settings.signatureImageUrl && (
                  <div className="py-2 border-b border-dashed border-slate-400 text-center space-y-1">
                    <span className="text-[9px] font-bold uppercase text-slate-600 block">
                      {printLang === "ar" ? "التوقيع والاعتماد الإلكتروني:" : "Authorized Digital Signature:"}
                    </span>
                    <div className="flex justify-center">
                      <img
                        src={settings.signatureImageUrl}
                        alt="Digital Signature"
                        crossOrigin="anonymous"
                        className="h-10 object-contain mx-auto"
                      />
                    </div>
                    {settings.authorizedSignatoryName && (
                      <p className="text-[9px] font-semibold text-slate-800">{settings.authorizedSignatoryName}</p>
                    )}
                  </div>
                )}

                {/* Thermal Footer & QR */}
                <div className="text-center text-[9px] space-y-2 pt-1 text-slate-800">
                  <p className="font-bold">
                    {settings.footerNotice || (printLang === "ar" ? "*** شكراً لتعاملكم معنا ***" : "*** THANK YOU FOR YOUR BUSINESS ***")}
                  </p>
                  
                  {/* Thermal Barcode (If enabled or default) */}
                  {(theme.showBarcode !== false || theme.thermalSettings?.showBarcode !== false) && (
                    <div className="flex flex-col items-center justify-center pt-2 border-t border-dotted border-slate-400">
                      <BarcodeRenderer
                        value={voucher.voucherNumber}
                        height={32}
                        barWidth={1.4}
                        showText={true}
                        label={voucher.voucherNumber}
                        color="#000000"
                      />
                    </div>
                  )}

                  {theme.showQrCode && (
                    <div className="flex flex-col items-center justify-center pt-1">
                      <div className="p-1 bg-white border border-slate-900 rounded">
                        <QrCode className="w-16 h-16 text-slate-900" />
                      </div>
                      <span className="text-[8px] font-mono mt-0.5 text-slate-600">
                        {printLang === "ar" ? "رمز الفاتورة الإلكترونية المعتمد" : "E-Invoice QR Verification"}
                      </span>
                    </div>
                  )}
                  
                  <p className="text-[8px] text-slate-500 pt-1 font-mono">
                    {voucher.voucherNumber} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ) : theme.templateId === "classic" ? (
              /* CORPORATE CLASSIC TEMPLATE */
              <div className="relative z-10 space-y-5 print:space-y-3 text-xs leading-relaxed border-4 border-double border-slate-800 p-5 sm:p-7 rounded-xs bg-amber-50/10">
                
                {/* Traditional Calligraphy Centered Header Divider */}
                <div className="text-center space-y-1.5 border-b-2 border-slate-800 pb-5">
                  <div className="flex items-center justify-between gap-4">
                    {theme.showLogo && settings.logoUrl ? (
                      <img
                        src={settings.logoUrl}
                        alt="Brand Logo"
                        crossOrigin="anonymous"
                        style={{ width: `${settings.logoWidth || 130}px` }}
                        className="h-auto object-contain max-h-16"
                      />
                    ) : (
                      <div className="w-20" />
                    )}

                    <div className="text-center space-y-1">
                      <h1 className="text-xl font-serif font-black text-slate-950 tracking-wide">
                        {settings?.companyName}
                      </h1>
                      {settings?.tagline && (
                        <p className="text-xs font-serif italic text-slate-700">
                          {settings.tagline}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-600 font-serif">
                        {settings.address} {settings.cityStateZip ? `• ${settings.cityStateZip}` : ""} {settings.phone ? `• هاتف: ${settings.phone}` : ""}
                      </p>
                    </div>

                    <div className="text-right text-[10px] font-mono text-slate-700 space-y-0.5 shrink-0 min-w-[120px]">
                      {settings.taxId && <p><span className="font-bold">ضريبة:</span> {settings.taxId}</p>}
                      {settings.crNumber && <p><span className="font-bold">س.ت:</span> {settings.crNumber}</p>}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-center gap-3">
                    <span className="h-0.5 w-16 bg-slate-800" />
                    <span className="bg-slate-900 text-white px-5 py-1 text-xs font-serif font-black uppercase tracking-widest border border-slate-900 rounded-xs shadow-xs">
                      ❖ {getDocTitle(voucher.type)} ❖
                    </span>
                    <span className="h-0.5 w-16 bg-slate-800" />
                  </div>
                </div>

                {/* Classic Grid Box Metadata */}
                <div className="border border-slate-800 divide-y divide-slate-800 text-xs font-serif bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-800">
                    <div className="p-3 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-700">{printLang === "ar" ? "رقم السند الرسمـي:" : "Official Voucher #:"}</span>
                        <span className="font-mono font-black text-sm text-slate-950">{voucher.voucherNumber}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-700">
                        <span>{printLang === "ar" ? "تاريخ الإصـدار:" : "Issue Date:"}</span>
                        <span className="font-mono">{formatDateToDDMMMMYYYY(voucher.date)}</span>
                      </div>
                      {voucher.referenceNo && (
                        <div className="flex justify-between items-center text-slate-700">
                          <span>{printLang === "ar" ? "رقم المرجع / الفاتورة:" : "Reference #:"}</span>
                          <span className="font-mono">{voucher.referenceNo}</span>
                        </div>
                      )}
                    </div>

                    <div className="p-3 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-700">{getPayerLabel()}</span>
                        <span className="font-bold text-slate-950">{voucher.receivedFrom || "---"}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-700">
                        <span>{printLang === "ar" ? "طريقة السـداد:" : "Payment Method:"}</span>
                        <span className="font-bold text-slate-900">{getPaymentMethodLabel(voucher.paymentMethod)}</span>
                      </div>
                      {voucher.payerPhone && (
                        <div className="flex justify-between items-center text-slate-700">
                          <span>{printLang === "ar" ? "رقم الهاتف:" : "Contact Phone:"}</span>
                          <span className="font-mono">{voucher.payerPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Classic Line Items Table with Grid Lines */}
                <div className="border border-slate-800 overflow-hidden bg-white">
                  <table className="w-full text-xs font-serif border-collapse">
                    <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-2.5 w-10 text-center border-r border-slate-700">#</th>
                        <th className="p-2.5 text-right border-r border-slate-700">
                          {printLang === "ar" ? "تفصيل البيان والخدمة" : "Description"}
                        </th>
                        <th className="p-2.5 w-16 text-center border-r border-slate-700">
                          {printLang === "ar" ? "الكمية" : "Qty"}
                        </th>
                        <th className="p-2.5 w-28 text-left border-r border-slate-700">
                          {printLang === "ar" ? "السعر الفردي" : "Unit Price"}
                        </th>
                        <th className="p-2.5 w-32 text-left">
                          {printLang === "ar" ? `المبلغ (${voucher.currency})` : `Total (${voucher.currency})`}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {voucher.lineItems.map((item, index) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="p-2.5 text-center text-slate-600 font-mono border-r border-slate-300">{index + 1}</td>
                          <td className="p-2.5 font-semibold text-slate-900 border-r border-slate-300 text-right">{item.description || "---"}</td>
                          <td className="p-2.5 text-center font-mono text-slate-800 border-r border-slate-300">{item.quantity}</td>
                          <td className="p-2.5 text-left font-mono text-slate-800 border-r border-slate-300">
                            {item.unitPrice.toFixed(voucher.currency === "OMR" || voucher.currency === "KWD" ? 3 : 2)}
                          </td>
                          <td className="p-2.5 text-left font-bold font-mono text-slate-950">
                            {item.amount.toFixed(voucher.currency === "OMR" || voucher.currency === "KWD" ? 3 : 2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Classic Financial Totals & Words Block */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start font-serif">
                  
                  {/* Amount in Words */}
                  <div className="border border-slate-800 p-3 bg-white space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                      {printLang === "ar" ? "المبلغ كتابة وقدره:" : "Amount in Words:"}
                    </span>
                    <div className="text-xs font-bold text-slate-950 leading-snug">
                      {renderAmountInWords()}
                    </div>
                    {voucher.notes && (
                      <p className="text-[11px] text-slate-600 border-t border-slate-300 pt-1 mt-1">
                        <span className="font-bold">ملاحظات:</span> {voucher.notes}
                      </p>
                    )}
                  </div>

                  {/* Summary Totals */}
                  <div className="border border-slate-800 p-3.5 bg-white space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between text-slate-700">
                      <span>{printLang === "ar" ? "المجموع:" : "Subtotal:"}</span>
                      <span>{voucher.currency} {voucher.subtotal.toFixed(voucher.currency === "OMR" || voucher.currency === "KWD" ? 3 : 2)}</span>
                    </div>
                    {voucher.taxAmount > 0 && (
                      <div className="flex justify-between text-slate-700">
                        <span>{printLang === "ar" ? `الضريبة (${voucher.taxRate}%):` : `VAT:`}</span>
                        <span>+ {voucher.currency} {voucher.taxAmount.toFixed(voucher.currency === "OMR" || voucher.currency === "KWD" ? 3 : 2)}</span>
                      </div>
                    )}
                    {voucher.discountAmount > 0 && (
                      <div className="flex justify-between text-red-700">
                        <span>{printLang === "ar" ? "الخصم:" : "Discount:"}</span>
                        <span>- {voucher.currency} {voucher.discountAmount.toFixed(voucher.currency === "OMR" || voucher.currency === "KWD" ? 3 : 2)}</span>
                      </div>
                    )}
                    <div className="border-t-2 border-slate-900 pt-2 text-sm font-black flex justify-between text-slate-950">
                      <span>{printLang === "ar" ? "الصافي الإجمالي:" : "GRAND TOTAL:"}</span>
                      <span>{voucher.currency} {voucher.totalAmount.toFixed(voucher.currency === "OMR" || voucher.currency === "KWD" ? 3 : 2)}</span>
                    </div>
                  </div>

                </div>

                {/* Classic Formal Signature Section */}
                {theme.showSignatureBlock && (
                  <div className="border border-slate-800 p-4 bg-white grid grid-cols-3 gap-4 text-center font-serif text-xs items-end">
                    <div className="space-y-6">
                      <div className="h-10 flex items-end justify-center">
                        {voucher.preparedBy && <span className="border-b border-slate-800 px-3 font-semibold">{voucher.preparedBy}</span>}
                      </div>
                      <div className="border-t border-slate-800 pt-1 font-bold text-slate-800">
                        {printLang === "ar" ? "توقيع المحاسب المسؤول" : "Prepared By"}
                      </div>
                    </div>

                    <div className="space-y-2 relative">
                      {theme.showStamp && settings.stampImageUrl && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none opacity-85">
                          <img src={settings.stampImageUrl} alt="Stamp" crossOrigin="anonymous" className="w-16 h-16 object-contain rotate-[-10deg]" />
                        </div>
                      )}
                      {settings.signatureImageUrl ? (
                        <div className="h-10 flex items-end justify-center">
                          <img src={settings.signatureImageUrl} alt="Signature" crossOrigin="anonymous" className="h-8 object-contain" />
                        </div>
                      ) : (
                        <div className="h-10 flex items-end justify-center font-bold text-slate-800">
                          {settings.authorizedSignatoryName}
                        </div>
                      )}
                      <div className="border-t border-slate-800 pt-1 font-bold text-slate-900">
                        {printLang === "ar" ? "الختم الرسمي والاعتماد" : "Authorized Signature & Stamp"}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="h-10 flex items-end justify-center">
                        {voucher.receivedBy && <span className="border-b border-slate-800 px-3 font-semibold">{voucher.receivedBy}</span>}
                      </div>
                      <div className="border-t border-slate-800 pt-1 font-bold text-slate-800">
                        {printLang === "ar" ? "توقيع المستلم" : "Received By"}
                      </div>
                    </div>
                  </div>
                )}

                {/* Classic Footer & QR */}
                <div className="flex justify-between items-center text-[10px] text-slate-700 pt-2 border-t border-slate-400 font-serif">
                  <p>{settings.footerNotice || (printLang === "ar" ? "مستند رسمي صادر عن نظام المؤسسة." : "Official Corporate Receipt Document.")}</p>
                  
                  {theme.showQrCode && (
                    <div className="flex items-center gap-1.5">
                      <QrCode className="w-6 h-6 text-slate-900" />
                      <span className="font-mono text-[8px]">{voucher.voucherNumber}</span>
                    </div>
                  )}
                </div>

              </div>
            ) : theme.templateId === "executive" ? (
              /* EXECUTIVE STAMP TEMPLATE */
              <div className="relative z-10 space-y-6 print:space-y-3 text-xs leading-relaxed">
                
                {/* Luxury Gradient Banner */}
                <div
                  style={{
                    background: `linear-gradient(135deg, ${theme.primaryColor || "#1e1b4b"}, ${theme.secondaryColor || "#4338ca"})`
                  }}
                  className="p-6 rounded-2xl text-white shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4 -mt-4"
                >
                  <div className="space-y-1 text-center sm:text-right">
                    {theme.showLogo && settings.logoUrl && (
                      <img
                        src={settings.logoUrl}
                        alt="Logo"
                        crossOrigin="anonymous"
                        style={{ width: `${settings.logoWidth || 130}px` }}
                        className="h-auto object-contain max-h-16 mb-2 bg-white/10 p-1.5 rounded-xl backdrop-blur-xs"
                      />
                    )}
                    <h1 className="text-lg font-black tracking-wide uppercase">
                      {settings?.companyName}
                    </h1>
                    {settings?.tagline && <p className="text-xs text-indigo-200">{settings.tagline}</p>}
                    <p className="text-[11px] text-indigo-100 opacity-90">{settings.address} • {settings.phone}</p>
                  </div>

                  <div className="text-center sm:text-left space-y-2 shrink-0">
                    <div className="bg-white/15 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-inner">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 block">
                        EXECUTIVE DOCUMENT
                      </span>
                      <h2 className="text-sm font-black tracking-wider uppercase">
                        {getDocTitle(voucher.type)}
                      </h2>
                      <p className="text-xs font-mono font-bold text-amber-200 mt-0.5">
                        #{voucher.voucherNumber}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Executive Metadata Ribbon */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-900 text-white p-4 rounded-xl shadow-md text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-300 block">{getPayerLabel()}</span>
                    <span className="font-extrabold text-sm text-white">{voucher.receivedFrom || "---"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-300 block">{printLang === "ar" ? "تاريخ العملية:" : "Transaction Date:"}</span>
                    <span className="font-mono font-bold text-slate-200">{formatDateToDDMMMMYYYY(voucher.date)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-300 block">{printLang === "ar" ? "وسيلة الدفع:" : "Payment Channel:"}</span>
                    <span className="font-bold text-amber-300">{getPaymentMethodLabel(voucher.paymentMethod)}</span>
                  </div>
                </div>

                {/* Executive Table */}
                <div className="overflow-hidden rounded-xl border-2 border-indigo-900/20 shadow-md">
                  <table className="w-full text-xs">
                    <thead className="bg-indigo-950 text-amber-300 font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="p-3 w-10 text-center">#</th>
                        <th className="p-3 text-right">{printLang === "ar" ? "بند الخدمة والتسليم" : "Particulars"}</th>
                        <th className="p-3 w-16 text-center">{printLang === "ar" ? "الكمية" : "Qty"}</th>
                        <th className="p-3 w-28 text-left">{printLang === "ar" ? "السعر الفردي" : "Unit Rate"}</th>
                        <th className="p-3 w-32 text-left">{printLang === "ar" ? `الصافي (${voucher.currency})` : `Net (${voucher.currency})`}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {voucher.lineItems.map((item, index) => (
                        <tr key={item.id} className="hover:bg-indigo-50/30">
                          <td className="p-3 text-center text-slate-400 font-mono font-bold">{index + 1}</td>
                          <td className="p-3 font-bold text-slate-900 text-right">{item.description || "---"}</td>
                          <td className="p-3 text-center font-mono font-bold text-slate-800">{item.quantity}</td>
                          <td className="p-3 text-left font-mono text-slate-800">{item.unitPrice.toFixed(2)}</td>
                          <td className="p-3 text-left font-mono font-black text-indigo-950">{item.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Executive Summary Card & Seal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div className="space-y-2">
                    {theme.showAmountInWords && (
                      <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-200 text-indigo-950 font-medium">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block mb-0.5">
                          {printLang === "ar" ? "المبلغ المالي المعتمد كتابة:" : "Certified Amount in Words:"}
                        </span>
                        {renderAmountInWords()}
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-4 rounded-2xl shadow-lg space-y-2 font-mono">
                    <div className="flex justify-between text-xs text-indigo-200">
                      <span>Subtotal:</span>
                      <span>{voucher.currency} {voucher.subtotal.toFixed(2)}</span>
                    </div>
                    {voucher.taxAmount > 0 && (
                      <div className="flex justify-between text-xs text-indigo-200">
                        <span>VAT ({voucher.taxRate}%):</span>
                        <span>+ {voucher.currency} {voucher.taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-indigo-700 pt-2 flex justify-between items-center">
                      <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">TOTAL AMOUNT:</span>
                      <span className="text-xl font-black text-amber-300">{voucher.currency} {voucher.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Executive Digital Signatures Panel */}
                {theme.showSignatureBlock && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 grid grid-cols-3 gap-4 text-center text-xs items-end">
                    <div>
                      <div className="h-10 flex items-end justify-center font-serif italic text-slate-700">{voucher.preparedBy}</div>
                      <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">إعداد المحاسبة</div>
                    </div>
                    <div className="relative">
                      {theme.showStamp && settings.stampImageUrl && (
                        <img src={settings.stampImageUrl} alt="Stamp" crossOrigin="anonymous" className="w-16 h-16 object-contain mx-auto opacity-90" />
                      )}
                      <div className="border-t border-slate-400 pt-1 font-bold text-indigo-950">الاعتماد التنفيذي والختم</div>
                    </div>
                    <div>
                      <div className="h-10 flex items-end justify-center font-serif italic text-slate-700">{voucher.receivedBy}</div>
                      <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">اعتماد المستلم</div>
                    </div>
                  </div>
                )}

                {/* Executive Footer */}
                <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-slate-200">
                  <p className="font-semibold">{settings.footerNotice || "وثيقة تنفيذية معتمدة إلكترونياً."}</p>
                </div>

              </div>
            ) : theme.templateId === "minimalist" ? (
              /* MINIMALIST LIGHT TEMPLATE */
              <div className="relative z-10 space-y-6 print:space-y-3 text-xs leading-relaxed bg-white">
                
                {/* Minimal Header */}
                <div className="flex justify-between items-end border-b border-slate-200 pb-4">
                  <div className="space-y-1">
                    {theme.showLogo && settings.logoUrl && (
                      <img src={settings.logoUrl} alt="Logo" crossOrigin="anonymous" className="h-10 object-contain mb-2" />
                    )}
                    <h1 className="text-sm font-semibold text-slate-900 tracking-tight">{settings?.companyName}</h1>
                    <p className="text-[10px] text-slate-500">{settings.address} • {settings.phone}</p>
                  </div>

                  <div className="text-right space-y-0.5">
                    <span className="text-xs font-light uppercase tracking-widest text-slate-400 block">{getDocTitle(voucher.type)}</span>
                    <span className="text-sm font-mono font-medium text-slate-900">#{voucher.voucherNumber}</span>
                    <p className="text-[10px] text-slate-400 font-mono">{voucher.date}</p>
                  </div>
                </div>

                {/* Minimal Payer & Summary Details */}
                <div className="flex justify-between items-start text-xs py-2 text-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">{getPayerLabel()}</span>
                    <span className="font-semibold text-slate-900">{voucher.receivedFrom || "---"}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Payment</span>
                    <span className="font-medium text-slate-800">{getPaymentMethodLabel(voucher.paymentMethod)}</span>
                  </div>
                </div>

                {/* Minimal Table */}
                <table className="w-full text-xs">
                  <thead className="border-b border-slate-200 text-slate-400 font-normal uppercase text-[10px] text-right">
                    <tr>
                      <th className="py-2 text-right">Item</th>
                      <th className="py-2 text-center w-12">Qty</th>
                      <th className="py-2 text-left w-24">Price</th>
                      <th className="py-2 text-left w-24">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {voucher.lineItems.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2.5 font-medium text-slate-800 text-right">{item.description || "---"}</td>
                        <td className="py-2.5 text-center font-mono text-slate-500">{item.quantity}</td>
                        <td className="py-2.5 text-left font-mono text-slate-500">{item.unitPrice.toFixed(2)}</td>
                        <td className="py-2.5 text-left font-mono font-semibold text-slate-900">{item.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Minimal Totals */}
                <div className="flex justify-end pt-3 border-t border-slate-200">
                  <div className="w-48 space-y-1 font-mono text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span>{voucher.currency} {voucher.subtotal.toFixed(2)}</span>
                    </div>
                    {voucher.taxAmount > 0 && (
                      <div className="flex justify-between text-slate-500">
                        <span>VAT</span>
                        <span>+ {voucher.currency} {voucher.taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-slate-950 pt-2 border-t border-slate-300 text-sm">
                      <span>Total</span>
                      <span>{voucher.currency} {voucher.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Minimal Words */}
                {theme.showAmountInWords && (
                  <div className="text-[11px] text-slate-500 italic pt-2">
                    {renderAmountInWords()}
                  </div>
                )}

                {/* Minimal Signature */}
                {theme.showSignatureBlock && (
                  <div className="pt-8 grid grid-cols-2 gap-8 text-[11px] text-slate-500 border-t border-slate-100">
                    <div>
                      <div className="h-8 border-b border-slate-200" />
                      <span className="pt-1 block">Prepared</span>
                    </div>
                    <div className="text-right">
                      <div className="h-8 border-b border-slate-200" />
                      <span className="pt-1 block">Authorized</span>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              /* MODERN / CORPORATE DEFAULT TEMPLATE */
              <div className="relative z-10 space-y-5 print:space-y-3 text-xs leading-relaxed">
                
                {/* Top Accent Strip */}
                <div
                  style={{ backgroundColor: theme.primaryColor || "#4f46e5" }}
                  className="h-1.5 w-full rounded-t-sm -mt-8 -mx-8 sm:-mx-10"
                />

                {/* Header Section */}
                <div
                  style={{ borderColor: theme.primaryColor || "#4f46e5" }}
                  className="flex flex-col sm:flex-row justify-between items-start border-b-2 pb-6 gap-4"
                >
                  
                  {/* Company Logo & Details */}
                  <div className="space-y-2 max-w-md">
                    {theme.showLogo && settings.logoUrl && (
                      <img
                        src={settings.logoUrl}
                        alt="Brand Logo"
                        crossOrigin="anonymous"
                        style={{ width: `${settings.logoWidth || 140}px` }}
                        className="h-auto object-contain max-h-20 mb-2"
                      />
                    )}
                    <div>
                      <h1 className="text-base font-bold text-slate-900">
                        {settings?.companyName}
                      </h1>
                      {settings?.tagline && (
                        <p className="text-[11px] font-medium text-slate-500">
                          {settings.tagline}
                        </p>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-0.5 font-normal">
                      <p>{settings.address}, {settings.cityStateZip}, {settings.country}</p>
                      <div className="flex flex-wrap gap-x-3 text-slate-500">
                        {settings.phone && <span>{printLang === "ar" ? "هاتف:" : "Tel:"} {settings.phone}</span>}
                        {settings.email && <span>{printLang === "ar" ? "بريد:" : "Email:"} {settings.email}</span>}
                      </div>
                      <div className="flex flex-wrap gap-x-3 text-slate-500">
                        {settings.website && <span>{settings.website}</span>}
                        {settings.taxId && <span className="font-semibold text-slate-700">{printLang === "ar" ? "الرقم الضريبي:" : "Tax/VAT ID:"} {settings.taxId}</span>}
                        {settings.crNumber && <span>{printLang === "ar" ? "السجل التجاري:" : "CR:"} {settings.crNumber}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Voucher Banner & Metadata */}
                  <div className="sm:self-start space-y-2 shrink-0 text-right">
                    <div
                      style={{ backgroundColor: theme.primaryColor || "#4f46e5" }}
                      className="inline-block text-white px-4 py-2 rounded-lg font-black uppercase tracking-wider text-xs shadow-xs"
                    >
                      {getDocTitle(voucher.type)}
                    </div>

                    <div className="space-y-1 font-mono text-slate-700 text-right">
                      <p className="text-sm font-bold text-slate-900">
                        {printLang === "ar" ? "الرقم:" : printLang === "en" ? "No:" : "الرقم / No:"}{" "}
                        <span style={{ color: theme.primaryColor || "#4f46e5" }}>{voucher.voucherNumber}</span>
                      </p>
                      <p>
                        <span className="text-slate-500 font-sans font-medium">{printLang === "ar" ? "التاريخ:" : printLang === "en" ? "Date:" : "التاريخ / Date:"}</span>{" "}
                        {formatDateToDDMMMMYYYY(voucher.date)}
                      </p>
                      {voucher.referenceNo && (
                        <p>
                          <span className="text-slate-500 font-sans font-medium">{printLang === "ar" ? "المرجع:" : printLang === "en" ? "Ref:" : "المرجع / Ref:"}</span>{" "}
                          {voucher.referenceNo}
                        </p>
                      )}
                      {voucher.branchName && (
                        <p>
                          <span className="text-slate-500 font-sans font-medium">{printLang === "ar" ? "الفرع:" : printLang === "en" ? "Branch:" : "الفرع / Branch:"}</span>{" "}
                          <span className="font-semibold text-slate-800">{voucher.branchName}</span>
                        </p>
                      )}
                      <div className="pt-1">
                        <span className={`inline-block px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md border ${
                          voucher.status === "PAID"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : voucher.status === "ISSUED"
                            ? "bg-indigo-100 text-indigo-800 border-indigo-300"
                            : "bg-amber-100 text-amber-800 border-amber-300"
                        }`}>
                          {voucher.status === "PAID" ? (printLang === "en" ? "PAID" : "معتمد / مدفوع") : voucher.status}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Header Notice Banner (If any) */}
                {settings.headerNotice && (
                  <div className="bg-slate-100 p-2 text-center text-[10px] font-semibold text-slate-700 uppercase tracking-widest border-y border-slate-200">
                    {settings.headerNotice}
                  </div>
                )}

                {/* Payer / Payee Details Block */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      {getPayerLabel()}
                    </span>
                    <p className="text-sm font-extrabold text-slate-900">
                      {voucher.receivedFrom || "---"}
                    </p>
                    {voucher.payerAddress && (
                      <p className="text-slate-600 text-[11px]">{voucher.payerAddress}</p>
                    )}
                    <div className="flex flex-wrap gap-x-3 text-slate-500 text-[11px] pt-1">
                      {voucher.payerEmail && <span>{voucher.payerEmail}</span>}
                      {voucher.payerPhone && <span>{voucher.payerPhone}</span>}
                    </div>
                  </div>

                  <div className="space-y-1 md:text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      {printLang === "ar" ? "تفاصيل وطريقة الدفع:" : printLang === "en" ? "Payment Details:" : "تفاصيل السداد / Payment Details:"}
                    </span>
                    <p className="font-semibold text-slate-800">
                      <span className="text-slate-500">{printLang === "ar" ? "الطريقة:" : printLang === "en" ? "Method:" : "الطريقة / Method:"} </span>
                      <span className="text-slate-900 font-bold">{getPaymentMethodLabel(voucher.paymentMethod)}</span>
                    </p>
                    {voucher.checkNumber && (
                      <p className="text-slate-600">{printLang === "ar" ? "رقم الشيك:" : "Check #:"} <span className="font-mono">{voucher.checkNumber}</span></p>
                    )}
                    {voucher.bankName && (
                      <p className="text-slate-600">{printLang === "ar" ? "البنك:" : "Bank:"} {voucher.bankName}</p>
                    )}
                    {voucher.transactionRef && (
                      <p className="text-slate-600">{printLang === "ar" ? "المرجع البنكي:" : "Txn Ref:"} <span className="font-mono">{voucher.transactionRef}</span></p>
                    )}
                    {voucher.payerTaxId && (
                      <p className="text-slate-700 font-medium pt-1">{printLang === "ar" ? "الرقم الضريبي:" : "Tax ID:"} {voucher.payerTaxId}</p>
                    )}
                  </div>
                </div>

                {/* Custom Metadata Fields (If any) */}
                {voucher.customFields && voucher.customFields.length > 0 && (
                  <div className="flex flex-wrap gap-4 bg-slate-100/70 p-3 rounded-lg border border-slate-200/80 text-[11px]">
                    {voucher.customFields.map((cf) => (
                      <div key={cf.id} className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-600">{cf.label}:</span>
                        <span className="font-mono font-semibold text-slate-900">{cf.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Line Items Table */}
                <div className="overflow-hidden rounded-lg border border-slate-300">
                  <table className="w-full text-xs">
                    <thead
                      style={{ backgroundColor: theme.primaryColor || "#0f172a" }}
                      className="text-white font-bold uppercase tracking-wider text-[11px]"
                    >
                      <tr>
                        <th className="p-2.5 w-10 text-center">#</th>
                        <th className="p-2.5 text-right">
                          {printLang === "ar" ? "البيان والخدمة" : printLang === "en" ? "Description & Particulars" : "البيان / Description"}
                        </th>
                        <th className="p-2.5 w-16 text-center">
                          {printLang === "ar" ? "الكمية" : printLang === "en" ? "Qty" : "الكمية / Qty"}
                        </th>
                        <th className="p-2.5 w-28 text-left">
                          {printLang === "ar" ? "السعر" : printLang === "en" ? "Unit Price" : "السعر / Price"}
                        </th>
                        <th className="p-2.5 w-32 text-left">
                          {printLang === "ar" ? "الإجمالي" : printLang === "en" ? `Total (${voucher.currency})` : `الإجمالي / Total (${voucher.currency})`}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {voucher.lineItems.map((item, index) => (
                        <tr key={item.id} className="odd:bg-white even:bg-slate-50/50">
                          <td className="p-2.5 text-center text-slate-400 font-mono">{index + 1}</td>
                          <td className="p-2.5 font-medium text-slate-800 text-right">{item.description || "---"}</td>
                          <td className="p-2.5 text-center font-mono text-slate-700">{item.quantity}</td>
                          <td className="p-2.5 text-left font-mono text-slate-700">
                            {item.unitPrice.toLocaleString(undefined, {
                              minimumFractionDigits: voucher.currency === "OMR" || voucher.currency === "KWD" || voucher.currency === "BHD" ? 3 : 2,
                              maximumFractionDigits: voucher.currency === "OMR" || voucher.currency === "KWD" || voucher.currency === "BHD" ? 3 : 2
                            })}
                          </td>
                          <td className="p-2.5 text-left font-bold font-mono text-slate-900">
                            {item.amount.toLocaleString(undefined, {
                              minimumFractionDigits: voucher.currency === "OMR" || voucher.currency === "KWD" || voucher.currency === "BHD" ? 3 : 2,
                              maximumFractionDigits: voucher.currency === "OMR" || voucher.currency === "KWD" || voucher.currency === "BHD" ? 3 : 2
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary Totals & Amount in Words */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-2">
                  
                  {/* Left: Amount in Words */}
                  <div className="space-y-3">
                    {theme.showAmountInWords && (
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                          {printLang === "ar" ? "المبلغ كتابة وفقط:" : printLang === "en" ? "Amount in Words:" : "المبلغ كتابة / Amount in Words:"}
                        </span>
                        {renderAmountInWords()}
                      </div>
                    )}

                    {voucher.notes && (
                      <div className="text-[11px] text-slate-600 bg-slate-50/80 p-3 rounded-lg border border-slate-200">
                        <span className="font-bold text-slate-800 block mb-0.5">
                          {printLang === "ar" ? "ملاحظات:" : printLang === "en" ? "Notes:" : "ملاحظات / Notes:"}
                        </span>
                        <p className="whitespace-pre-line">{voucher.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Right: Subtotal, Tax, Discount, Grand Total Box */}
                  <div className="space-y-1.5 font-mono text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex justify-between text-slate-600">
                      <span className="font-sans">{printLang === "ar" ? "المجموع الجزئي:" : printLang === "en" ? "Subtotal:" : "المجموع الجزئي / Subtotal:"}</span>
                      <span className="font-semibold text-slate-900">
                        {voucher.currency} {voucher.subtotal.toLocaleString(undefined, {
                          minimumFractionDigits: voucher.currency === "OMR" || voucher.currency === "KWD" || voucher.currency === "BHD" ? 3 : 2
                        })}
                      </span>
                    </div>

                    {voucher.taxAmount > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span className="font-sans">{printLang === "ar" ? `ضريبة القيمة المضافة (${voucher.taxRate}%):` : `VAT (${voucher.taxRate}%):`}</span>
                        <span className="font-semibold text-slate-900">
                          + {voucher.currency} {voucher.taxAmount.toLocaleString(undefined, {
                            minimumFractionDigits: voucher.currency === "OMR" || voucher.currency === "KWD" || voucher.currency === "BHD" ? 3 : 2
                          })}
                        </span>
                      </div>
                    )}

                    {voucher.discountAmount > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span className="font-sans">{printLang === "ar" ? "الخصم:" : "Discount:"}</span>
                        <span className="font-semibold text-red-600">
                          - {voucher.currency} {voucher.discountAmount.toLocaleString(undefined, {
                            minimumFractionDigits: voucher.currency === "OMR" || voucher.currency === "KWD" || voucher.currency === "BHD" ? 3 : 2
                          })}
                        </span>
                      </div>
                    )}

                    <div className="border-t border-slate-300 pt-2.5 mt-2 flex justify-between items-center text-sm font-black text-slate-900">
                      <span className="font-sans font-bold uppercase tracking-wider text-xs">
                        {printLang === "ar" ? "المبلغ الإجمالي للصفقة:" : printLang === "en" ? "Total Deal Amount:" : "المبلغ الإجمالي / Total Deal:"}
                      </span>
                      <span
                        style={{ color: theme.primaryColor || "#0f172a" }}
                        className="text-lg font-black"
                      >
                        {voucher.currency} {voucher.totalAmount.toLocaleString(undefined, {
                          minimumFractionDigits: voucher.currency === "OMR" || voucher.currency === "KWD" || voucher.currency === "BHD" ? 3 : 2
                        })}
                      </span>
                    </div>

                    {/* Paid & Remaining Amount Breakdown for Receipt Vouchers */}
                    {(voucher.type === "RECEIPT" || voucher.paidAmount !== undefined) && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-300">
                        <div className="flex justify-between items-center text-slate-700">
                          <span className="font-sans font-bold text-xs">{printLang === "ar" ? "المبلغ المدفوع:" : printLang === "en" ? "Paid Amount:" : "المبلغ المدفوع / Paid:"}</span>
                          <span className="font-bold text-emerald-700">
                            {voucher.currency} {(voucher.paidAmount ?? voucher.amount ?? voucher.totalAmount).toLocaleString(undefined, {
                              minimumFractionDigits: voucher.currency === "OMR" || voucher.currency === "KWD" || voucher.currency === "BHD" ? 3 : 2
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-700">
                          <span className="font-sans font-bold text-xs">{printLang === "ar" ? "المبلغ المتبقي:" : printLang === "en" ? "Remaining Balance:" : "المتبقي / Balance Due:"}</span>
                          <span className={`font-bold ${(voucher.remainingAmount ?? Math.max(0, voucher.totalAmount - (voucher.paidAmount ?? voucher.amount ?? voucher.totalAmount))) > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                            {voucher.currency} {(voucher.remainingAmount ?? Math.max(0, voucher.totalAmount - (voucher.paidAmount ?? voucher.amount ?? voucher.totalAmount))).toLocaleString(undefined, {
                              minimumFractionDigits: voucher.currency === "OMR" || voucher.currency === "KWD" || voucher.currency === "BHD" ? 3 : 2
                            })}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Linked Invoice Badge */}
                    {voucher.linkedInvoiceNumber && (
                      <div className="mt-2 text-[11px] bg-indigo-50 p-2 rounded-lg text-indigo-900 flex justify-between items-center font-bold border border-indigo-200">
                        <span>{printLang === "ar" ? "مرتبط بالفاتورة الضريبية:" : printLang === "en" ? "Linked Tax Invoice:" : "مرتبط بالفاتورة / Linked Invoice:"}</span>
                        <span className="font-mono text-indigo-700">#{voucher.linkedInvoiceNumber}</span>
                      </div>
                    )}

                    {/* Base Currency Equivalence in Standard Preview */}
                    {settings.showEquivalentInBaseCurrency && settings.defaultCurrency && voucher.currency !== settings.defaultCurrency && (
                      <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between items-center text-xs text-indigo-900 bg-indigo-50/70 p-2 rounded-lg font-bold">
                        <span className="flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{printLang === "ar" ? `المعادل بـ (${settings.defaultCurrency}):` : `Equivalent in ${settings.defaultCurrency}:`}</span>
                        </span>
                        <span className="font-mono">
                          {settings.defaultCurrency}{" "}
                          {convertCurrency(
                            voucher.totalAmount,
                            voucher.currency,
                            settings.defaultCurrency,
                            settings.customExchangeRates
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: settings.defaultCurrency === "OMR" || settings.defaultCurrency === "KWD" || settings.defaultCurrency === "BHD" ? 3 : 2,
                            maximumFractionDigits: settings.defaultCurrency === "OMR" || settings.defaultCurrency === "KWD" || settings.defaultCurrency === "BHD" ? 3 : 2
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                </div>

                {/* Bank Details (If enabled) */}
                {theme.showBankDetails && settings.bankDetails && settings.bankDetails.bankName && (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[11px] grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div>
                      <span className="text-slate-400 font-bold block">{printLang === "ar" ? "اسم البنك" : "Bank Name"}</span>
                      <span className="font-semibold text-slate-800">{settings.bankDetails.bankName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block">{printLang === "ar" ? "اسم الحساب" : "Account Name"}</span>
                      <span className="font-semibold text-slate-800">{settings.bankDetails.accountName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block">{printLang === "ar" ? "رقم الآيبان / الحساب" : "IBAN / Account"}</span>
                      <span className="font-mono font-semibold text-slate-800">{settings.bankDetails.iban || settings.bankDetails.accountNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block">SWIFT / BIC</span>
                      <span className="font-mono font-semibold text-slate-800">{settings.bankDetails.swiftCode || "N/A"}</span>
                    </div>
                  </div>
                )}

                {/* Terms & Conditions */}
                {settings.termsAndConditions && (
                  <div className="text-[10px] text-slate-500 border-t border-slate-200 pt-3">
                    <span className="font-bold uppercase tracking-wider text-slate-600 block mb-0.5">
                      {printLang === "ar" ? "الشروط والأحكام:" : printLang === "en" ? "Terms & Conditions:" : "الشروط والأحكام / Terms & Conditions:"}
                    </span>
                    <p className="whitespace-pre-line leading-relaxed">{settings.termsAndConditions}</p>
                  </div>
                )}

                {/* Signatures & Stamp Section */}
                {theme.showSignatureBlock && (
                  <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-[11px] items-end">
                    
                    {/* Prepared By */}
                    <div className="space-y-10">
                      <div className="h-12 flex items-end justify-center font-serif italic text-slate-600">
                        {voucher.preparedBy && <span className="border-b border-slate-400 px-4">{voucher.preparedBy}</span>}
                      </div>
                      <div className="border-t border-slate-400 pt-1 font-semibold text-slate-700">
                        {printLang === "ar" ? "توقيع المحاسب" : printLang === "en" ? "Prepared By" : "إعداد المحاسب / Prepared By"}
                      </div>
                    </div>

                    {/* Approved By & Stamp */}
                    <div className="space-y-2 relative">
                      {/* Stamp Image Overlay */}
                      {theme.showStamp && settings.stampImageUrl && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 pointer-events-none opacity-80">
                          <img
                            src={settings.stampImageUrl}
                            alt="Company Stamp"
                            crossOrigin="anonymous"
                            className="w-20 h-20 object-contain rotate-[-12deg]"
                          />
                        </div>
                      )}

                      {/* Authorized Signature Image Overlay */}
                      {settings.signatureImageUrl ? (
                        <div className="h-12 flex items-end justify-center">
                          <img
                            src={settings.signatureImageUrl}
                            alt="Authorized Signature"
                            crossOrigin="anonymous"
                            className="h-10 object-contain"
                          />
                        </div>
                      ) : (
                        <div className="h-12 flex items-end justify-center font-serif italic text-slate-700">
                          {settings.authorizedSignatoryName}
                        </div>
                      )}

                      <div className="border-t border-slate-400 pt-1 font-semibold text-slate-700">
                        {printLang === "ar" ? "الاعتماد والختم الرسمي" : printLang === "en" ? "Authorized Signature & Stamp" : "الاعتماد والختم / Authorized"}
                        <p className="text-[10px] font-normal text-slate-500">{settings.authorizedSignatoryTitle}</p>
                      </div>
                    </div>

                    {/* Received By / Client */}
                    <div className="space-y-10">
                      <div className="h-12 flex items-end justify-center font-serif italic text-slate-600">
                        {voucher.receivedBy && <span className="border-b border-slate-400 px-4">{voucher.receivedBy}</span>}
                      </div>
                      <div className="border-t border-slate-400 pt-1 font-semibold text-slate-700">
                        {printLang === "ar" ? "توقيع المستلم" : printLang === "en" ? "Received By" : "توقيع المستلم / Received By"}
                      </div>
                    </div>

                  </div>
                )}

                {/* QR Code, Barcode & Footer Notice */}
                <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 pt-4 gap-3 text-[10px] text-slate-500">
                  <p className="italic max-w-md text-center sm:text-left">
                    {settings.footerNotice || (printLang === "ar" ? "شكراً لتعاملكم معنا. هذا المستند صادر إلكترونياً." : "Thank you for your business. Computer generated document.")}
                  </p>

                  <div className="flex items-center gap-3">
                    {/* Barcode in Standard Template */}
                    {theme.showBarcode !== false && (
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex flex-col items-center">
                        <BarcodeRenderer
                          value={voucher.voucherNumber}
                          height={28}
                          barWidth={1.2}
                          showText={true}
                          label={voucher.voucherNumber}
                        />
                      </div>
                    )}

                    {theme.showQrCode && (
                      <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <div className="p-1 bg-white border border-slate-300 rounded">
                          <QrCode className="w-8 h-8 text-slate-800" />
                        </div>
                        <div className="text-right font-mono text-[9px] text-slate-600">
                          <span className="font-bold block text-slate-800">{printLang === "en" ? "E-Invoice QR" : "رمز التحقق الضريبي"}</span>
                          <span>{voucher.voucherNumber}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>

      {/* WhatsApp Sharing Modal */}
      {isWhatsAppModalOpen && (
        <WhatsAppShareModal
          isOpen={isWhatsAppModalOpen}
          onClose={() => setIsWhatsAppModalOpen(false)}
          voucher={voucher}
          settings={settings}
        />
      )}

    </div>
  );
};
