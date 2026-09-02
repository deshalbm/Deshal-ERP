import React, { useState } from "react";
import { ReceiptVoucher } from "../types";
import { useLanguage } from "../utils/LanguageContext";
import { Sparkles, X, Loader2 } from "lucide-react";

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyParsedVoucher: (parsedData: Partial<ReceiptVoucher>) => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  onApplyParsedVoucher
}) => {
  const { t, language, dir, isRTL } = useLanguage();
  const [promptText, setPromptText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) return;

    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/ai/parse-voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textPrompt: promptText })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || (isRTL ? "فشل إنشاء بيانات السند عبر الذكاء الاصطناعي" : "Failed to generate receipt voucher data"));
      }

      onApplyParsedVoucher(data.data);
      onClose();
    } catch (err: any) {
      console.error("AI Modal Error:", err);
      setErrorMsg(err.message || (isRTL ? "حدث خطأ أثناء التواصل مع المساعد الذكي" : "An error occurred while calling AI assistant."));
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = isRTL
    ? [
        "استلمنا مبلغ 1,850.000 ر.ع من شركة صحار العالمية لأعمال تركيب شاشات تفاعلية تم الدفع عبر تحويل بنكي.",
        "سند صرف بمبلغ 450.000 ر.ع لمؤسسة التجهيزات التقنية مقابل كابلات ومستلزمات شبكات بشيك بنكي رقم 1042.",
        "سند قبض نقدي بمبلغ 120.000 ر.ع من العميل سالم المعمري مقابل صيانة دورية لنظام المراقبة."
      ]
    : [
        "Received $1,850.00 from Acme Corp for Web Design services paid via Bank Wire Transfer.",
        "Payment voucher of $450.00 to Staples Office Supplies for printer paper and desk chairs paid with check #1042.",
        "Petty cash voucher $120.50 for client lunch and team refreshments paid in cash."
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" dir={dir}>
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in duration-200">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-5 ${isRTL ? "left-5" : "right-5"} text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-linear-to-tr from-purple-600 to-indigo-600 text-white rounded-2xl shadow-md">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-sans">
              {isRTL ? "إنشاء السند بالذكاء الاصطناعي" : "AI Receipt Voucher Generator"}
            </h2>
            <p className="text-xs text-slate-500">
              {isRTL ? "صف المعاملة أو الصق نص الفاتورة ليقوم الذكاء بتعبئة السند تلقائياً" : "Describe a payment or paste invoice text to auto-fill voucher fields."}
            </p>
          </div>
        </div>

        <form onSubmit={handleAiSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isRTL ? "نص المعاملة أو تفاصيل الدفعة المالية" : "Payment Description or Invoice Snippet"}
            </label>
            <textarea
              rows={4}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder={isRTL ? "مثال: تم استلام دفعة بقيمة 3200 ريال من شركة الأفق مقابل عقود الصيانة..." : "e.g. Received $3,200 from Horizon Corp for Q3 Cloud Hosting via Bank Transfer..."}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:outline-hidden bg-slate-50 font-medium"
            />
          </div>

          {/* Sample Prompts */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
              {isRTL ? "أمثلة سريعة للاستخدام:" : "Quick Prompt Examples:"}
            </span>
            <div className="space-y-1.5">
              {samplePrompts.map((sp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPromptText(sp)}
                  className={`block w-full ${isRTL ? "text-right" : "text-left"} p-2 text-[11px] text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg border border-slate-200/80 transition-all cursor-pointer truncate`}
                >
                  "{sp}"
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="text-xs text-red-600 font-semibold bg-red-50 p-2.5 rounded-xl border border-red-200">
              {errorMsg}
            </div>
          )}

          <div className={`flex justify-end gap-2 pt-2`}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
            >
              {t("cancel")}
            </button>

            <button
              type="submit"
              disabled={isLoading || !promptText.trim()}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-linear-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-500/20 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isRTL ? "جاري المعالجة..." : "Processing AI..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{isRTL ? "إنشاء وتعبئة السند" : "Generate Voucher"}</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
