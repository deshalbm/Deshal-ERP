import React, { useState, useMemo } from "react";
import {
  MessageSquare,
  Send,
  Copy,
  Check,
  X,
  Phone,
  Radio,
  FileText,
  Clock,
  ExternalLink,
  Receipt,
  FileSpreadsheet,
  Zap,
  Server,
  AlertCircle,
  RefreshCw,
  CheckCircle2
} from "lucide-react";
import { ReceiptVoucher, CompanySettings, Customer } from "../types";
import { useLanguage } from "../utils/LanguageContext";
import { formatDateToDDMMMMYYYY } from "../utils/dateFormatter";
import { numberToWords } from "../utils/numberToWords";
import { DEFAULT_COMPANY_SETTINGS, DEFAULT_WHATSAPP_SETTINGS } from "../utils/storage";
import { sendBaileysTextMessage, formatInternationalPhoneNumber } from "../utils/whatsappBaileys";

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  voucher: ReceiptVoucher;
  settings?: CompanySettings;
  customer?: Customer | null;
  onLogInteraction?: (type: string, title: string, notes: string) => void;
}

type MessageTemplateType = "RECEIPT" | "REMINDER" | "QUOTATION" | "TAX_INVOICE" | "CUSTOM";

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  voucher,
  settings = DEFAULT_COMPANY_SETTINGS,
  customer,
  onLogInteraction
}) => {
  const { language, dir, isRTL } = useLanguage();

  const waSettings = settings?.whatsappSettings;
  const isBaileysConfigured = Boolean(waSettings?.enabled && waSettings?.serverUrl);

  // Initial phone cleanup
  const initialPhone = useMemo(() => {
    const raw = voucher.payerPhone || customer?.phone || settings?.phone || "";
    return raw.replace(/[^0-9+]/g, "");
  }, [voucher, customer, settings]);

  const [phoneNumber, setPhoneNumber] = useState<string>(initialPhone);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(waSettings?.defaultCountryCode || "968");
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplateType>(() => {
    if (voucher.type === "QUOTATION") return "QUOTATION";
    if (voucher.type === "TAX_INVOICE") return "TAX_INVOICE";
    if (voucher.status === "DRAFT" || voucher.status === "ISSUED") return "REMINDER";
    return "RECEIPT";
  });
  const [customText, setCustomText] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [isSendingViaBaileys, setIsSendingViaBaileys] = useState<boolean>(false);
  const [baileysSendResult, setBaileysSendResult] = useState<{ success: boolean; message: string } | null>(null);

  // Generate Message Text based on selected template
  const messageText = useMemo(() => {
    const currency = voucher.currency || settings.defaultCurrency || "OMR";
    const amountStr = `${voucher.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 3 })} ${currency}`;
    const wordsAr = numberToWords(voucher.totalAmount, currency, "ar");
    const clientName = voucher.receivedFrom || voucher.paidTo || "العميل الكريم";
    const docDate = formatDateToDDMMMMYYYY(voucher.date);
    const dueDateStr = voucher.dueDate ? formatDateToDDMMMMYYYY(voucher.dueDate) : docDate;
    const companyTitle = settings?.companyName || "ديشال لإدارة الأعمال (Deshal ERP)";
    const companyPhone = settings?.phone || "+968 77438203";
    const bank = settings?.bankDetails || {
      bankName: "بنك ظفار",
      accountName: companyTitle,
      accountNumber: "01041112233001",
      iban: "OM960111000000001041112233001"
    };

    if (selectedTemplate === "RECEIPT") {
      return `🏢 *${companyTitle}*
📄 *إشعار سند استلام مالي رسمي*
----------------------------------------
🔢 *رقم السند:* ${voucher.voucherNumber}
👤 *استلمنا من الفاضل/السادة:* ${clientName}
💰 *المبلغ المستلم:* ${amountStr}
🔤 *المبلغ كتابة:* (${wordsAr})
📅 *تاريخ السند:* ${docDate}
💳 *طريقة الدفع:* ${voucher.paymentMethod.replace("_", " ")}${voucher.bankName ? ` (${voucher.bankName})` : ""}${voucher.checkNumber ? ` - رقم الشيك: ${voucher.checkNumber}` : ""}
📝 *البيان / الخدمة:* ${voucher.notes || voucher.category || "تقديم خدمات وأعمال تقنية"}
----------------------------------------
✅ *الحالة:* معتمد ومسجل رسمياً في النظام المالي.
📞 *للتواصل والاستفسار:* ${companyPhone}
🌐 *الموقع الإلكتروني:* ${settings?.website || "www.digititech.com"}
🙏 شكراً جزيلاً لتعاملكم واختياركم لنا.`;
    }

    if (selectedTemplate === "REMINDER") {
      return `🏢 *${companyTitle}*
⚠️ *إشعار وتذكير بمستحق مالي*
----------------------------------------
👤 *المكرم / السادة:* ${clientName}
تحية طيبة وبعد،،،
نود تذكيركم بلطف بموعد استحقاق الدفعة المالية الموضحة تفاصيلها أدناه:

📄 *رقم المعاملة / السند:* ${voucher.voucherNumber}
${voucher.referenceNo ? `📌 *رقم المرجع / العقد:* ${voucher.referenceNo}\n` : ""}💰 *المبلغ المستحق:* ${amountStr}
📅 *تاريخ الاستحقاق:* ${dueDateStr}
📝 *البيان:* ${voucher.notes || "مستحقات أعمال وخدمات متفق عليها"}

🏦 *بيانات الحساب البنكي للتحويل السريع:*
- *اسم البنك:* ${bank.bankName || "بنك ظفار"}
- *اسم الحساب:* ${bank.accountName || companyTitle}
- *رقم الحساب:* ${bank.accountNumber || "01041112233001"}
- *الآيبان (IBAN):* ${bank.iban || "OM960111000000001041112233001"}

يرجى التكرم بإشعارنا فور إتمام التحويل لإصدار سند الاستلام المعتمد.
شاكرين ومقدرين حسن تعاونكم الدائم معنا 🌹`;
    }

    if (selectedTemplate === "QUOTATION") {
      return `🏢 *${companyTitle}*
📋 *عرض سعر مالي معتمد*
----------------------------------------
🔢 *رقم عرض السعر:* ${voucher.voucherNumber}
👤 *الموجه إليه:* ${clientName}
💰 *إجمالي قيمة العرض:* ${amountStr}
📅 *تاريخ الإصدار:* ${docDate}
${voucher.dueDate ? `⏳ *صلاحية العرض حتى:* ${formatDateToDDMMMMYYYY(voucher.dueDate)}\n` : ""}
📝 *تفاصيل العرض:*
${voucher.lineItems.map((it, idx) => `${idx + 1}. ${it.description} (الكمية: ${it.quantity}) = ${(it.quantity * it.unitPrice).toFixed(3)} ${currency}`).join("\n")}

${voucher.terms ? `📌 *شروط العرض:* ${voucher.terms}\n` : ""}
يرجى تأكيد الموافقة لبدء تنفيذ الأعمال.
📞 للتواصل: ${companyPhone}`;
    }

    if (selectedTemplate === "TAX_INVOICE") {
      return `🏢 *${companyTitle}*
📑 *فاتورة ضريبية رسمية (TAX INVOICE)*
----------------------------------------
🔢 *رقم الفاتورة:* ${voucher.voucherNumber}
🏢 *الرقم الضريبي للمنشأة:* ${settings?.taxId || "OM-94288394-B"}
👤 *العميل:* ${clientName}
${voucher.payerTaxId ? `🔢 *الرقم الضريبي للعميل:* ${voucher.payerTaxId}\n` : ""}📅 *تاريخ الفاتورة:* ${docDate}
💵 *المجموع الخاضع للضريبة:* ${voucher.subtotal.toFixed(3)} ${currency}
📊 *ضريبة القيمة المضافة (5%):* ${voucher.taxAmount.toFixed(3)} ${currency}
💰 *الإجمالي النهائي شامل الضريبة:* ${voucher.totalAmount.toFixed(3)} ${currency}
----------------------------------------
✅ هذه الفاتورة صادرة إلكترونياً ومعتمدة ضريبياً.`;
    }

    return customText || `السلام عليكم ورحمة الله، مرفق لكم تفاصيل السند رقم ${voucher.voucherNumber} بقيمة ${amountStr}. شكراً لكم.`;
  }, [selectedTemplate, voucher, settings, customText]);

  // Clean and format phone for WhatsApp Web / App URL
  const formattedWhatsAppUrl = useMemo(() => {
    let clean = phoneNumber.replace(/[^0-9]/g, "");
    if (clean.length === 8 && selectedCountryCode === "968") {
      clean = "968" + clean;
    } else if (clean.startsWith("00")) {
      clean = clean.substring(2);
    }
    const encodedText = encodeURIComponent(messageText);
    return `https://api.whatsapp.com/send?phone=${clean}&text=${encodedText}`;
  }, [phoneNumber, selectedCountryCode, messageText]);

  if (!isOpen) return null;

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Direct Send via Baileys API
  const handleSendViaBaileysApi = async () => {
    if (!phoneNumber.trim()) {
      alert(language === "ar" ? "يرجى إدخال رقم هاتف العميل أولاً" : "Please enter recipient phone number");
      return;
    }

    setIsSendingViaBaileys(true);
    setBaileysSendResult(null);

    const actualText = selectedTemplate === "CUSTOM" && customText.trim() ? customText : messageText;

    try {
      const res = await sendBaileysTextMessage(
        { ...DEFAULT_WHATSAPP_SETTINGS, ...(waSettings || {}) },
        phoneNumber,
        actualText,
        {
          recipientName: voucher.receivedFrom || customer?.name || "العميل",
          voucherNumber: voucher.voucherNumber,
          messageType: selectedTemplate === "RECEIPT" ? "RECEIPT" : selectedTemplate === "TAX_INVOICE" ? "TAX_INVOICE" : selectedTemplate === "REMINDER" ? "REMINDER" : "RECEIPT",
          sentBy: "محرر السندات"
        }
      );

      if (res.success) {
        setBaileysSendResult({
          success: true,
          message: language === "ar" ? "تم إرسال الرسالة بنجاح عبر سرفر WhatsApp Baileys الخاص بك! 🚀" : "Dispatched successfully via Baileys WhatsApp API!"
        });

        if (onLogInteraction) {
          onLogInteraction(
            "WHATSAPP",
            `إرسال WhatsApp عبر سرفر Baileys (${selectedTemplate})`,
            `تم إرسال إشعار مباشر للرقم ${phoneNumber} بخصوص السند #${voucher.voucherNumber} بقيمة ${voucher.totalAmount} ${voucher.currency}`
          );
        }

        setTimeout(() => {
          onClose();
        }, 2200);
      } else {
        setBaileysSendResult({
          success: false,
          message: res.error || (language === "ar" ? "تعذر الإرسال عبر السرفر. يمكنك استخدام تطبيق WhatsApp كبديل." : "Failed to dispatch via server. Fallback to WhatsApp Web.")
        });
      }
    } catch (err: any) {
      setBaileysSendResult({
        success: false,
        message: err.message || "فشل الاتصال بسرفر الواتساب."
      });
    } finally {
      setIsSendingViaBaileys(false);
    }
  };

  // Fallback: Launch WhatsApp Web / App
  const handleLaunchWhatsAppWeb = () => {
    if (!phoneNumber.trim()) {
      alert(language === "ar" ? "يرجى إدخال رقم هاتف العميل أولاً" : "Please enter a valid customer phone number");
      return;
    }

    window.open(formattedWhatsAppUrl, "_blank", "noopener,noreferrer");

    if (onLogInteraction) {
      onLogInteraction(
        "WHATSAPP",
        `إرسال إشعار WhatsApp Web (${selectedTemplate})`,
        `تم فتح محادثة واتساب للرقم ${phoneNumber} بخصوص السند رقم ${voucher.voucherNumber}`
      );
    }

    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 max-h-[94vh] flex flex-col" dir={dir}>
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 shadow-inner">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="text-start">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{language === "ar" ? "إشعار WhatsApp المباشر" : "WhatsApp Direct Alert"}</span>
                {isBaileysConfigured ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono flex items-center gap-1 border border-emerald-500/30">
                    <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                    <span>Baileys Server API</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 font-mono">
                    WhatsApp Web
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                {language === "ar" ? `إرسال نسخة وتذكير للسند #${voucher.voucherNumber}` : `Send voucher #${voucher.voucherNumber} directly`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          
          {/* Recipient Phone & Country */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === "ar" ? "رقم هاتف العميل (WhatsApp):" : "Customer WhatsApp Number:"}</span>
            </label>

            <div className="flex gap-2">
              <select
                value={selectedCountryCode}
                onChange={(e) => setSelectedCountryCode(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-xs font-mono outline-none focus:border-emerald-500 shrink-0 cursor-pointer"
              >
                <option value="968">🇴🇲 عمان (+968)</option>
                <option value="966">🇸🇦 السعودية (+966)</option>
                <option value="971">🇦🇪 الإمارات (+971)</option>
                <option value="974">🇶🇦 قطر (+974)</option>
                <option value="965">🇰🇼 الكويت (+965)</option>
                <option value="973">🇧🇭 البحرين (+973)</option>
                <option value="20">🇪🇬 مصر (+20)</option>
                <option value="962">🇯🇴 الأردن (+962)</option>
              </select>

              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+968 9XXXXXXX"
                className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>{voucher.receivedFrom || customer?.name || "عميل غير مسمى"}</span>
              <span className="font-mono text-emerald-400 font-bold">
                {voucher.totalAmount.toFixed(3)} {voucher.currency}
              </span>
            </div>
          </div>

          {/* Template Choice Tabs */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              {language === "ar" ? "اختر صيغة وقالب الرسالة:" : "Select Message Template:"}
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "RECEIPT" as MessageTemplateType, labelAr: "سند قبض رسمي", labelEn: "Official Receipt", icon: Receipt },
                { id: "REMINDER" as MessageTemplateType, labelAr: "تذكير بالسداد", labelEn: "Payment Reminder", icon: Clock },
                { id: "QUOTATION" as MessageTemplateType, labelAr: "عرض سعر مالي", labelEn: "Price Quotation", icon: FileSpreadsheet },
                { id: "TAX_INVOICE" as MessageTemplateType, labelAr: "فاتورة ضريبية", labelEn: "Tax Invoice", icon: FileText }
              ].map((tpl) => {
                const Icon = tpl.icon;
                const active = selectedTemplate === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedTemplate(tpl.id)}
                    className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      active
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px] font-bold">
                      {language === "ar" ? tpl.labelAr : tpl.labelEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Message Text Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">
                {language === "ar" ? "معاينة نص رسالة WhatsApp الفورية:" : "Live WhatsApp Message Preview:"}
              </label>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-[11px] font-bold text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (language === "ar" ? "تم النسخ!" : "Copied!") : (language === "ar" ? "نسخ النص" : "Copy Text")}</span>
              </button>
            </div>

            <div className="relative">
              <textarea
                rows={7}
                value={selectedTemplate === "CUSTOM" ? customText : messageText}
                onChange={(e) => {
                  setSelectedTemplate("CUSTOM");
                  setCustomText(e.target.value);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-slate-200 font-sans text-xs leading-relaxed outline-none focus:border-emerald-500"
                placeholder={language === "ar" ? "اكتب رسالة مخصصة هنا..." : "Type custom message here..."}
              />
            </div>
          </div>

          {/* Baileys Execution Feedback */}
          {baileysSendResult && (
            <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
              baileysSendResult.success
                ? "bg-emerald-950/80 border-emerald-600 text-emerald-200"
                : "bg-rose-950/80 border-rose-600 text-rose-200"
            }`}>
              {baileysSendResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span className="leading-snug">{baileysSendResult.message}</span>
            </div>
          )}

        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          
          <button
            type="button"
            onClick={handleCopyMessage}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? (language === "ar" ? "تم النسخ" : "Copied") : (language === "ar" ? "نسخ فقط" : "Copy Only")}</span>
          </button>

          {/* Primary Action Button: Baileys Direct or Web */}
          <div className="w-full sm:flex-1 flex items-center gap-2">
            {isBaileysConfigured ? (
              <>
                <button
                  type="button"
                  onClick={handleSendViaBaileysApi}
                  disabled={isSendingViaBaileys || !phoneNumber.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  {isSendingViaBaileys ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>{language === "ar" ? "جاري الإرسال عبر سرفر Baileys..." : "Sending via Server..."}</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>{language === "ar" ? "إرسال مباشر عبر سرفر Baileys" : "Send via Baileys API"}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleLaunchWhatsAppWeb}
                  title={language === "ar" ? "فتح في WhatsApp Web / App كبديل" : "Open in WhatsApp Web as fallback"}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleLaunchWhatsAppWeb}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{language === "ar" ? "إرسال عبر تطبيق WhatsApp" : "Send via WhatsApp Web"}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
