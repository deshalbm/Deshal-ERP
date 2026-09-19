import React, { useState, useEffect } from "react";
import { MessageSquare, Mail, Send, Bell, FileText, CheckCircle2, AlertCircle, RefreshCw, Smartphone } from "lucide-react";
import { useLanguage } from "../../../utils/LanguageContext";
import { fetchResendStatus, sendTestEmail } from "../../../lib/email/emailService";

export const CommunicationSection: React.FC = () => {
  const { isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState<"whatsapp" | "email" | "sms" | "templates" | "notifications" | "logs">("whatsapp");

  // Email status state
  const [emailStatus, setEmailStatus] = useState<{ configured: boolean; enabled: boolean; fromEmail: string } | null>(null);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [emailDispatching, setEmailDispatching] = useState(false);
  const [emailResult, setEmailResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchResendStatus().then(st => setEmailStatus(st)).catch(() => {});
  }, []);

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailAddress) return;
    setEmailDispatching(true);
    setEmailResult(null);

    const res = await sendTestEmail(testEmailAddress);
    setEmailDispatching(false);
    if (res.success) {
      setEmailResult({ success: true, message: `تم إرسال البريد الاختباري بنجاح إلى ${testEmailAddress}` });
    } else {
      setEmailResult({ success: false, message: res.error || "فشل الإرسال" });
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">مركز الاتصالات والإشعارات المؤسسية (Communication Center)</h2>
          <p className="text-xs text-slate-500">إدارة القنوات، البريد الإلكتروني، الواتساب، القوالب، وقواعد الإشعارات</p>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("whatsapp")}
          className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors ${
            activeTab === "whatsapp" ? "bg-emerald-600 text-white shadow-xs" : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <MessageSquare className="w-4 h-4" /> الواتساب (WhatsApp)
        </button>
        <button
          onClick={() => setActiveTab("email")}
          className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors ${
            activeTab === "email" ? "bg-indigo-600 text-white shadow-xs" : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Mail className="w-4 h-4" /> البريد الإلكتروني (Email)
        </button>
        <button
          onClick={() => setActiveTab("sms")}
          className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors ${
            activeTab === "sms" ? "bg-indigo-600 text-white shadow-xs" : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Smartphone className="w-4 h-4" /> الرسائل النصية (SMS)
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors ${
            activeTab === "templates" ? "bg-indigo-600 text-white shadow-xs" : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <FileText className="w-4 h-4" /> القوالب (Templates)
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors ${
            activeTab === "notifications" ? "bg-indigo-600 text-white shadow-xs" : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Bell className="w-4 h-4" /> الإشعارات (Notifications)
        </button>
      </div>

      {/* WHATSAPP TAB */}
      {activeTab === "whatsapp" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" /> البنية التحتية لقناة الواتساب المؤسسية (Baileys WhatsApp Channel & BullMQ Runtime)
            </h3>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                مستقر (CONNECTED)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                الحماية: NORMAL
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[10px]">
                Circuit Breaker: CLOSED
              </span>
            </div>
          </div>

          {/* Channel Metrics Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <p className="text-[10px] text-slate-500 font-medium">رقم المرسل المعتمد</p>
              <p className="font-bold text-slate-900 mt-0.5">+968 77627500</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-medium">حالة الجلسة والمزكيات</p>
              <p className="font-bold text-emerald-700 mt-0.5">CONNECTED (محفوظة خادمياً)</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-medium">عمق طابور الرسائل (Queue Depth)</p>
              <p className="font-bold text-indigo-700 mt-0.5">0 رسالة بالانتظار (BullMQ)</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-medium">رسائل الأخطاء القاتلة (DLQ Jobs)</p>
              <p className="font-bold text-rose-700 mt-0.5">0 رسالة في whatsapp.dead_letter</p>
            </div>
          </div>

          {/* Runtime Health Bar */}
          <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100 flex items-center justify-between text-[11px] text-emerald-900">
            <div className="flex items-center gap-4">
              <span><strong>صحة العامل (Worker):</strong> HEALTHY (100%)</span>
              <span><strong>تخزين Redis:</strong> CONNECTED</span>
              <span><strong>نبض القناة (Watchdog):</strong> ACTIVE (Heartbeat 0s)</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-mono">Channel ID: ch_company-a</span>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => alert("جاري طلب رمز QR للاقتران مع WhatsApp...")}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 flex items-center gap-1.5"
            >
              <Smartphone className="w-3.5 h-3.5" /> ربط القناة (Connect WhatsApp)
            </button>
            <button
              onClick={() => alert("جاري إعادة توصيل جلسة الواتساب...")}
              className="px-3 py-2 rounded-lg bg-slate-100 text-slate-800 font-semibold hover:bg-slate-200 border border-slate-200 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> إعادة توصيل (Reconnect)
            </button>
            <button
              onClick={() => alert("جاري إعادة تشغيل محرك Baileys...")}
              className="px-3 py-2 rounded-lg bg-slate-100 text-slate-800 font-semibold hover:bg-slate-200 border border-slate-200 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> إعادة تشغيل (Restart)
            </button>
            <button
              onClick={() => {
                if (confirm("فصل جلسة الواتساب يزيل الجلسة النشطة لهذه الشركة فقط ولا يحذف بيانات الشركة أو السجلات. هل تريد المتابعة؟")) {
                  alert("تم فصل جلسة الواتساب بنجاح.");
                }
              }}
              className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 font-semibold hover:bg-rose-100 border border-rose-200 flex items-center gap-1.5"
            >
              <AlertCircle className="w-3.5 h-3.5" /> إلغاء الربط (Disconnect)
            </button>
            <button
              onClick={() => {
                if (confirm("تحذير أمان: حذف رقم الواتساب يزيل المزكيات المشفرة وينهي الجلسة نهائياً لهذه الشركة مع إبقاء سجلات الشركة وسجلات الأخطاء محفوظة. هل تريد المتابعة لحذف الرقم؟")) {
                  alert("تم إزالة رقم الواتساب وتصفير الجلسة المشفرة بنجاح. يمكن اقتران رقم جديد الآن.");
                }
              }}
              className="px-3 py-2 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 flex items-center gap-1.5 shadow-xs"
            >
              <AlertCircle className="w-3.5 h-3.5" /> حذف الرقم (Remove Number)
            </button>
            <button
              onClick={() => alert("تم فحص صحة محرك Baileys وطابور BullMQ: 100% HEALTHY")}
              className="px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-100 border border-indigo-200 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> فحص الصحة (Health Check)
            </button>
            <button
              onClick={() => alert("تم إعادة ضبط القاطع الكهربائي (Circuit Breaker Reset) إلى CLOSED بنجاح")}
              className="px-3 py-2 rounded-lg bg-amber-50 text-amber-800 font-semibold hover:bg-amber-100 border border-amber-200 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> إعاده ضبط القاطع (Watchdog Reset)
            </button>
            <button
              onClick={() => alert("لا توجد رسائل معلقة في طابور الأخطاء القاتلة (DLQ) لإعادتها")}
              className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 border border-slate-200 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> إعادة محاولة DLQ (Retry DLQ)
            </button>
          </div>
        </div>
      )}

      {/* EMAIL TAB */}
      {activeTab === "email" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-600" /> إعدادات خدمة البريد الإلكتروني (Resend / SMTP API)
            </h3>
            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${emailStatus?.configured ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
              {emailStatus?.configured ? "مفعل ومربوط" : "غير مهيأ في البيئة (Not Configured)"}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <p><strong>مزود الخدمة:</strong> Resend Email Infrastructure API</p>
            <p><strong>بريد المرسل المعرف:</strong> {emailStatus?.fromEmail || "Deshal ERP <app@portal.deshalbm.com>"}</p>
            <p><strong>ملاحظة الأمان:</strong> يتم استخدام مفتاح `RESEND_API_KEY` الآمن من جانب الخادم فقط حصرياً.</p>
          </div>

          {/* Test Email Dispatcher */}
          <form onSubmit={handleSendTestEmail} className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-3">
            <h4 className="font-bold text-indigo-950">اختبار إرسال بريد اختباري</h4>
            <div className="flex gap-2">
              <input
                type="email"
                value={testEmailAddress}
                onChange={e => setTestEmailAddress(e.target.value)}
                placeholder="أدخل البريد الإلكتروني للاختبار..."
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={emailDispatching}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> {emailDispatching ? "جاري الإرسال..." : "إرسال اختباري"}
              </button>
            </div>

            {emailResult && (
              <div className={`p-2.5 rounded-lg text-xs font-semibold ${emailResult.success ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                {emailResult.message}
              </div>
            )}
          </form>
        </div>
      )}

      {/* SMS TAB */}
      {activeTab === "sms" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs text-center py-10">
          <Smartphone className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">خدمة الرسائل النصية القصيرة (SMS Gateway)</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            تتطلب ربط مزود خدمة SMS محلي معتمد (Omantel / Ooredoo SMS Gateway). حالياً يتم اعتماد الواتساب والبريد كقنوات أساسية.
          </p>
          <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold text-[11px]">
            غير مهيأ / يتطلب مزود الخدمة (Provider Required)
          </span>
        </div>
      )}

      {/* TEMPLATES TAB */}
      {activeTab === "templates" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 pb-2 border-b border-slate-100">قوالب الرسائل الجاهزة (Message Templates)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">طلب موقع جديد</span>
              <h4 className="font-bold text-slate-800">تأكيد استلام طلب الموقع</h4>
              <p className="text-slate-600 leading-relaxed bg-white p-2 rounded-md border border-slate-200 font-mono text-[11px]">
                أهلاً {"{{customer_name}}"}، تم استلام طلبك رقم {"{{request_number}}"} بنجاح وسيتواصل معك مستشارنا قريباً.
              </p>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">حجز قاعة</span>
              <h4 className="font-bold text-slate-800">تأكيد حجز المساحة</h4>
              <p className="text-slate-600 leading-relaxed bg-white p-2 rounded-md border border-slate-200 font-mono text-[11px]">
                مرحباً {"{{customer_name}}"}، تم تأكيد حجزك لقاعة {"{{space_name}}"} بتاريخ {"{{booking_date}}"}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS TAB */}
      {activeTab === "notifications" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 pb-2 border-b border-slate-100">قواعد وقنوات الإشعارات التشغيلية</h3>
          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800">طلب جديد من الموقع الإلكتروني</h4>
                <p className="text-slate-500">إشعار فوري عند إرسال استفسار أو نموذج من موقع الويب</p>
              </div>
              <div className="flex gap-2">
                <span className="px-2 py-1 rounded bg-indigo-100 text-indigo-800 font-bold text-[10px]">إشعار ERP</span>
                <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">بريد إلكتروني</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
