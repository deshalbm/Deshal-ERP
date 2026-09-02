import React, { useState, useEffect, useMemo } from "react";
import {
  MessageSquare,
  Server,
  QrCode,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Sliders,
  Terminal,
  Copy,
  Check,
  Power,
  LogOut,
  Shield,
  Zap,
  Globe,
  Radio,
  FileText,
  Clock,
  Trash2,
  ChevronRight,
  Sparkles,
  ExternalLink
} from "lucide-react";
import {
  CompanySettings,
  WhatsAppSettings,
  WhatsAppConnectionStatus,
  WhatsAppMessageLog,
  BaileysServerPreset,
  ReceiptVoucher
} from "../types";
import { useLanguage } from "../utils/LanguageContext";
import {
  sendBaileysTextMessage,
  checkBaileysStatus,
  fetchBaileysQrCode,
  startBaileysSession,
  logoutBaileysSession,
  formatInternationalPhoneNumber,
  BAILEYS_SERVER_NODE_SNIPPET,
  DOCKER_COMPOSE_SNIPPET
} from "../utils/whatsappBaileys";
import { loadWhatsAppLogs, clearWhatsAppLogs } from "../utils/storage";

interface WhatsAppBaileysStudioProps {
  settings: CompanySettings;
  onSaveSettings: (settings: CompanySettings) => void;
  vouchers?: ReceiptVoucher[];
}

export const WhatsAppBaileysStudio: React.FC<WhatsAppBaileysStudioProps> = ({
  settings,
  onSaveSettings,
  vouchers = []
}) => {
  const { language, dir, isRTL } = useLanguage();

  const [localWaSettings, setLocalWaSettings] = useState<WhatsAppSettings>(() => ({
    enabled: true,
    provider: "baileys",
    serverPreset: "generic_baileys",
    serverUrl: "http://localhost:8000",
    apiKey: "",
    sessionId: "deshal-erp",
    defaultCountryCode: "968",
    includePdfLink: true,
    autoSendOnVoucherCreate: false,
    autoSendOnPOSCheckout: false,
    autoSendOnDueDateReminder: false,
    customHeaderNotice: "ديشال لإدارة الأعمال (Deshal ERP) - إشعار رسمي",
    customFooterNotice: "شكراً لتعاملكم مع منظومة ديشال لإدارة الأعمال والحلول التقنية.",
    ...(settings?.whatsappSettings || {})
  }));

  const [activeTab, setActiveTab] = useState<"status" | "config" | "tester" | "vps_guide" | "logs">("status");
  const [connectionStatus, setConnectionStatus] = useState<WhatsAppConnectionStatus>("UNKNOWN");
  const [statusDetails, setStatusDetails] = useState<string>("");
  const [latency, setLatency] = useState<number | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [connectedPhone, setConnectedPhone] = useState<string | null>(null);

  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(false);
  const [isStartingSession, setIsStartingSession] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  // Test Message State
  const [testPhone, setTestPhone] = useState<string>(settings?.phone || "96877438203");
  const [testMessage, setTestMessage] = useState<string>(
    `🏢 *${settings?.companyName || "ديشال لإدارة الأعمال (Deshal ERP)"}*\n✅ *رسالة تجريبية من سرفر WhatsApp Baileys*\nتم إرسال هذا الإشعار بنجاح من خلال الربط المباشر مع سرفر الواتساب الخاص بالمنشأة.\nالوقت: ${new Date().toLocaleTimeString("ar-OM")}`
  );
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; raw?: any } | null>(null);

  // Logs state
  const [logs, setLogs] = useState<WhatsAppMessageLog[]>(() => loadWhatsAppLogs());
  const [logsSearch, setLogsSearch] = useState<string>("");

  // Code snippet copy states
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [saveSuccessNotification, setSaveSuccessNotification] = useState<boolean>(false);

  const handleCopySnippet = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2500);
  };

  // Check connection status function
  const handleCheckConnection = async () => {
    setIsCheckingStatus(true);
    try {
      const res = await checkBaileysStatus(localWaSettings);
      setConnectionStatus(res.status);
      setStatusDetails(res.details || "");
      if (res.latencyMs !== undefined) setLatency(res.latencyMs);
      if (res.phoneConnected) setConnectedPhone(res.phoneConnected);
      if (res.qrCodeData) {
        setQrCodeData(res.qrCodeData);
      } else if (res.status === "CONNECTED") {
        setQrCodeData(null);
      }
    } catch (err: any) {
      setConnectionStatus("DISCONNECTED");
      setStatusDetails(err.message || "فشل الاتصال");
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Auto-check status on mount if serverUrl is populated
  useEffect(() => {
    if (localWaSettings.serverUrl && localWaSettings.enabled) {
      handleCheckConnection();
    }
  }, []);

  // Poll status periodically when in QR_READY or CONNECTING
  useEffect(() => {
    let timer: any = null;
    if (connectionStatus === "QR_READY" || connectionStatus === "CONNECTING") {
      timer = setInterval(() => {
        handleCheckConnection();
      }, 5000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [connectionStatus, localWaSettings]);

  const handleStartSession = async () => {
    setIsStartingSession(true);
    try {
      const res = await startBaileysSession(localWaSettings);
      if (res.qrData) {
        setQrCodeData(res.qrData);
        setConnectionStatus("QR_READY");
      }
      setStatusDetails(res.message || "");
      await handleCheckConnection();
    } catch (err: any) {
      setStatusDetails(err.message);
    } finally {
      setIsStartingSession(false);
    }
  };

  const handleFetchQr = async () => {
    setIsCheckingStatus(true);
    try {
      const res = await fetchBaileysQrCode(localWaSettings);
      if (res.qrData) {
        setQrCodeData(res.qrData);
        setConnectionStatus("QR_READY");
      } else if (res.status === "CONNECTED") {
        setConnectionStatus("CONNECTED");
        setQrCodeData(null);
      }
    } catch (err: any) {
      setStatusDetails(err.message);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm(language === "ar" ? "هل أنت متأكد من تسجيل الخروج وإنهاء جلسة WhatsApp على السرفر؟" : "Are you sure you want to disconnect the WhatsApp session?")) {
      return;
    }
    setIsLoggingOut(true);
    try {
      const res = await logoutBaileysSession(localWaSettings);
      setConnectionStatus("DISCONNECTED");
      setQrCodeData(null);
      setConnectedPhone(null);
      setStatusDetails(res.message || "تم تسجيل الخروج");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSendTestMessage = async () => {
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await sendBaileysTextMessage(
        localWaSettings,
        testPhone,
        testMessage,
        {
          recipientName: "فحص الاتصال التجريبي",
          messageType: "TEST",
          sentBy: "مدير النظام"
        }
      );
      if (res.success) {
        setTestResult({
          success: true,
          message: language === "ar" ? "تم إرسال الرسالة بنجاح عبر سرفر Baileys!" : "Message dispatched successfully via Baileys API!",
          raw: res.rawResponse
        });
        setLogs(loadWhatsAppLogs());
      } else {
        setTestResult({
          success: false,
          message: res.error || "فشل إرسال الرسالة",
          raw: res.rawResponse
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "خطأ غير متوقع"
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSaveSettings = () => {
    const updated: CompanySettings = {
      ...settings,
      whatsappSettings: localWaSettings
    };
    onSaveSettings(updated);
    setSaveSuccessNotification(true);
    setTimeout(() => setSaveSuccessNotification(false), 3000);
  };

  const filteredLogs = useMemo(() => {
    if (!logsSearch.trim()) return logs;
    const q = logsSearch.toLowerCase();
    return logs.filter(
      l =>
        l.recipientPhone.toLowerCase().includes(q) ||
        (l.recipientName && l.recipientName.toLowerCase().includes(q)) ||
        (l.voucherNumber && l.voucherNumber.toLowerCase().includes(q)) ||
        l.messageSnippet.toLowerCase().includes(q)
    );
  }, [logs, logsSearch]);

  const testPhoneFormatted = useMemo(() => {
    return formatInternationalPhoneNumber(testPhone, localWaSettings.defaultCountryCode);
  }, [testPhone, localWaSettings.defaultCountryCode]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20" dir={dir}>
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-6 rounded-3xl border border-emerald-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {language === "ar" ? "بوابة WhatsApp API (Baileys)" : "WhatsApp Baileys API Gateway"}
                </h1>
                <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span>{language === "ar" ? "سرفر خاص VPS" : "Self-Hosted Private API"}</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                {language === "ar"
                  ? "ربط نظام الفواتير والسندات بسرفر الواتساب الخاص بك عبر Baileys لإرسال الإشعارات والسندات تلقائياً برقم المنشأة الرسمي."
                  : "Connect your billing & vouchers system to your own self-hosted Baileys WhatsApp server for automated official messaging."}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSaveSettings}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{language === "ar" ? "حفظ الإعدادات" : "Save Settings"}</span>
            </button>
          </div>
        </div>
      </div>

      {saveSuccessNotification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{language === "ar" ? "تم حفظ إعدادات سرفر WhatsApp Baileys بنجاح!" : "WhatsApp Baileys settings saved successfully!"}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl border border-slate-300/80 text-xs font-semibold flex-wrap gap-1">
        <button
          onClick={() => setActiveTab("status")}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "status"
              ? "bg-white text-emerald-800 shadow-md font-bold"
              : "text-slate-700 hover:text-slate-900"
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-emerald-600" />
          <span>{language === "ar" ? "حالة الاتصال والمسح" : "Status & QR Scan"}</span>
          {connectionStatus === "CONNECTED" && (
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          )}
          {connectionStatus === "QR_READY" && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("config")}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "config"
              ? "bg-white text-indigo-800 shadow-md font-bold"
              : "text-slate-700 hover:text-slate-900"
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-indigo-600" />
          <span>{language === "ar" ? "إعدادات السرفر والأتمتة" : "Server & Automation"}</span>
        </button>

        <button
          onClick={() => setActiveTab("tester")}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "tester"
              ? "bg-white text-purple-800 shadow-md font-bold"
              : "text-slate-700 hover:text-slate-900"
          }`}
        >
          <Send className="w-3.5 h-3.5 text-purple-600" />
          <span>{language === "ar" ? "فحص الإرسال المباشر" : "Live Test Dispatch"}</span>
        </button>

        <button
          onClick={() => setActiveTab("vps_guide")}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "vps_guide"
              ? "bg-slate-900 text-white shadow-md font-bold"
              : "text-slate-700 hover:text-slate-900"
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span>{language === "ar" ? "كود السرفر والتشغيل (VPS)" : "Server Code & VPS"}</span>
        </button>

        <button
          onClick={() => setActiveTab("logs")}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "logs"
              ? "bg-white text-slate-900 shadow-md font-bold"
              : "text-slate-700 hover:text-slate-900"
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{language === "ar" ? "سجل الرسائل المرسلة" : "Sent Logs"}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-800 font-mono">
            {logs.length}
          </span>
        </button>
      </div>

      {/* TAB 1: STATUS & QR SCAN */}
      {activeTab === "status" && (
        <div className="space-y-6">
          
          {/* Main Status Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Connection Indicator */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-600" />
                  <span>{language === "ar" ? "حالة اتصال سرفر Baileys" : "Baileys Server Status"}</span>
                </h3>
                <button
                  onClick={handleCheckConnection}
                  disabled={isCheckingStatus}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStatus ? "animate-spin text-emerald-600" : ""}`} />
                  <span>{language === "ar" ? "تحديث الحالة" : "Refresh"}</span>
                </button>
              </div>

              {/* Status Badge Box */}
              <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                connectionStatus === "CONNECTED"
                  ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                  : connectionStatus === "QR_READY"
                  ? "bg-amber-50/80 border-amber-200 text-amber-950"
                  : connectionStatus === "CONNECTING"
                  ? "bg-blue-50/80 border-blue-200 text-blue-950"
                  : "bg-slate-100 border-slate-200 text-slate-800"
              }`}>
                {connectionStatus === "CONNECTED" && <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />}
                {connectionStatus === "QR_READY" && <QrCode className="w-6 h-6 text-amber-600 shrink-0 mt-0.5 animate-pulse" />}
                {connectionStatus === "CONNECTING" && <RefreshCw className="w-6 h-6 text-blue-600 shrink-0 mt-0.5 animate-spin" />}
                {connectionStatus === "DISCONNECTED" && <AlertCircle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />}
                {connectionStatus === "UNKNOWN" && <Server className="w-6 h-6 text-slate-500 shrink-0 mt-0.5" />}

                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">
                      {connectionStatus === "CONNECTED" && (language === "ar" ? "متصل ومقترن بالواتساب بنجاح 🟢" : "Connected & Paired 🟢")}
                      {connectionStatus === "QR_READY" && (language === "ar" ? "بانتظار مسح رمز QR من الجوال 📱" : "QR Code Ready for Scanning 📱")}
                      {connectionStatus === "CONNECTING" && (language === "ar" ? "جاري الاتصال بالسرفر... 🟡" : "Connecting to Server... 🟡")}
                      {connectionStatus === "DISCONNECTED" && (language === "ar" ? "غير متصل أو غير مقترن 🔴" : "Disconnected 🔴")}
                      {connectionStatus === "UNKNOWN" && (language === "ar" ? "لم يتم الفحص بعد" : "Status Unknown")}
                    </span>
                    {latency !== null && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/70 border border-slate-200/70 text-slate-600">
                        {latency}ms
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {statusDetails || (language === "ar" ? "اضغط على زر فحص الاتصال للتأكد من حالة السرفر." : "Click refresh to check connection status.")}
                  </p>
                  {connectedPhone && (
                    <div className="mt-2 text-xs font-mono text-emerald-800 bg-emerald-100/60 px-2.5 py-1 rounded-lg inline-block">
                      {language === "ar" ? "الرقم المقترن:" : "Connected Number:"} <strong>{connectedPhone}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Endpoint & Server details summary */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                <div>
                  <span className="text-slate-500 block mb-0.5">{language === "ar" ? "عنوان السرفر الحالي:" : "Current Server URL:"}</span>
                  <span className="font-mono font-semibold text-slate-800 truncate block">
                    {localWaSettings.serverUrl || "http://localhost:8000"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">{language === "ar" ? "معرّف الجلسة (Session ID):" : "Session ID:"}</span>
                  <span className="font-mono font-semibold text-indigo-700 truncate block">
                    {localWaSettings.sessionId || "deshal-erp"}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap gap-2.5 pt-2">
                {connectionStatus !== "CONNECTED" && (
                  <button
                    onClick={handleStartSession}
                    disabled={isStartingSession}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{isStartingSession ? (language === "ar" ? "جاري البدء..." : "Starting...") : (language === "ar" ? "بدء جلسة جديدة (Start Session)" : "Start Session")}</span>
                  </button>
                )}

                {connectionStatus === "QR_READY" && (
                  <button
                    onClick={handleFetchQr}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>{language === "ar" ? "تحديث رمز QR" : "Refresh QR"}</span>
                  </button>
                )}

                {connectionStatus === "CONNECTED" && (
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{isLoggingOut ? (language === "ar" ? "جاري الخروج..." : "Logging out...") : (language === "ar" ? "قطع الاتصال وتسجيل الخروج" : "Disconnect / Logout")}</span>
                  </button>
                )}
              </div>
            </div>

            {/* QR Code Display Widget */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 text-white flex flex-col items-center justify-center text-center space-y-3">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                <QrCode className="w-4 h-4" />
                <span>{language === "ar" ? "ربط جهاز WhatsApp" : "Pair WhatsApp Device"}</span>
              </div>

              {qrCodeData ? (
                <div className="bg-white p-2.5 rounded-2xl shadow-xl border-4 border-emerald-500/30">
                  <img
                    src={qrCodeData.startsWith("data:") ? qrCodeData : `data:image/png;base64,${qrCodeData}`}
                    alt="WhatsApp QR Code"
                    className="w-44 h-44 object-contain rounded-lg"
                  />
                </div>
              ) : connectionStatus === "CONNECTED" ? (
                <div className="w-44 h-44 rounded-2xl bg-emerald-950/50 border border-emerald-500/30 flex flex-col items-center justify-center p-4 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-200">
                    {language === "ar" ? "الجهاز مقترن بنجاح" : "Device Paired"}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {language === "ar" ? "السرفر جاهز لإرسال السندات فوراً" : "Ready to dispatch messages"}
                  </span>
                </div>
              ) : (
                <div className="w-44 h-44 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col items-center justify-center p-4 text-center space-y-2 text-slate-400">
                  <QrCode className="w-8 h-8 text-slate-500" />
                  <span className="text-xs font-medium">
                    {language === "ar" ? "لا يوجد رمز QR حالياً" : "No active QR"}
                  </span>
                  <button
                    onClick={handleStartSession}
                    className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold hover:bg-emerald-500/30 cursor-pointer"
                  >
                    {language === "ar" ? "توليد الرمز للمسح" : "Generate QR"}
                  </button>
                </div>
              )}

              <div className="text-[10px] text-slate-400 leading-normal max-w-[200px]">
                {language === "ar" ? (
                  <>
                    افتح واتساب على جوالك ➔ <strong>الأجهزة المرتبطة</strong> ➔ <strong>ربط جهاز</strong> وامسح الرمز أعلاه.
                  </>
                ) : (
                  <>
                    Open WhatsApp ➔ <strong>Linked Devices</strong> ➔ <strong>Link a Device</strong> and scan the code.
                  </>
                )}
              </div>
            </div>

          </div>

          {/* Quick Tutorial Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm">
                1
              </div>
              <h4 className="text-xs font-bold text-slate-900">{language === "ar" ? "تشغيل السرفر على VPS" : "Deploy Server on VPS"}</h4>
              <p className="text-[11px] text-slate-600">
                {language === "ar"
                  ? "قم بتشغيل كود Baileys Express المرفق في تبويب كود السرفر على سرفرك أو عبر Docker."
                  : "Run the provided Baileys Express server script on your VPS or Docker container."}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm">
                2
              </div>
              <h4 className="text-xs font-bold text-slate-900">{language === "ar" ? "مسح الرمز والاقتران" : "Scan QR & Pair"}</h4>
              <p className="text-[11px] text-slate-600">
                {language === "ar"
                  ? "امسح رمز QR لمرة واحدة ليتم حفظ الجلسة على السرفر بصورة دائمة."
                  : "Scan the QR code once to store the session credentials permanently on the server."}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-sm">
                3
              </div>
              <h4 className="text-xs font-bold text-slate-900">{language === "ar" ? "إرسال السندات تلقائياً" : "Auto-Send Receipts"}</h4>
              <p className="text-[11px] text-slate-600">
                {language === "ar"
                  ? "يتم إرسال إشعارات السندات والفواتير للعملاء مباشرة من رقم المنشأة بنقرة زر واحدة أو تلقائياً."
                  : "Send receipt and invoice alerts to customers directly from your business number."}
              </p>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: CONFIGURATION & AUTOMATION */}
      {activeTab === "config" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>{language === "ar" ? "إعدادات اتصال سرفر WhatsApp Baileys" : "WhatsApp Baileys Server Configuration"}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === "ar"
                ? "حدد عنوان سرفر Baileys المنصب على سيرفرك الخاص (VPS) ومفتاح الأمان."
                : "Specify your self-hosted Baileys server address and authentication key."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Enable Toggle */}
            <div className="md:col-span-2 flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <span className="font-bold text-sm text-slate-900 block">
                  {language === "ar" ? "تفعيل بوابة WhatsApp Baileys المباشرة" : "Enable Direct Baileys WhatsApp Gateway"}
                </span>
                <span className="text-xs text-slate-500">
                  {language === "ar"
                    ? "عند التفعيل، سيتم إرسال الرسائل مباشرة عبر السرفر دون الحاجة لفتح تطبيق واتساب ويب يدوياً."
                    : "When enabled, messages are dispatched directly via your server in the background."}
                </span>
              </div>
              <input
                type="checkbox"
                checked={localWaSettings.enabled}
                onChange={(e) => setLocalWaSettings({ ...localWaSettings, enabled: e.target.checked })}
                className="w-5 h-5 accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Server Preset */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {language === "ar" ? "نوع ونموذج سرفر Baileys (Preset):" : "Server Architecture Preset:"}
              </label>
              <select
                value={localWaSettings.serverPreset}
                onChange={(e) => setLocalWaSettings({ ...localWaSettings, serverPreset: e.target.value as BaileysServerPreset })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="generic_baileys">
                  {language === "ar" ? "سرفر Baileys Express Standard (موصى به)" : "Standard Baileys Express API (Recommended)"}
                </option>
                <option value="evolution_api">Evolution API (v1 / v2)</option>
                <option value="baileys_http">Baileys-MD HTTP Server</option>
                <option value="wppconnect">WppConnect Server</option>
                <option value="custom">{language === "ar" ? "مخصص (Custom Endpoints)" : "Custom Endpoints"}</option>
              </select>
            </div>

            {/* Server URL */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {language === "ar" ? "عنوان سرفر الواتساب (Server URL):" : "Server Base URL:"}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={localWaSettings.serverUrl}
                  onChange={(e) => setLocalWaSettings({ ...localWaSettings, serverUrl: e.target.value })}
                  placeholder="e.g. http://192.168.1.50:8000 or https://wa.yourdomain.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none rtl:left-auto rtl:right-3" />
              </div>
            </div>

            {/* API Key / Secret Token */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {language === "ar" ? "مفتاح الأمان السري (API Key / Bearer Token):" : "API Secret / Auth Token:"}
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={localWaSettings.apiKey}
                  onChange={(e) => setLocalWaSettings({ ...localWaSettings, apiKey: e.target.value })}
                  placeholder={language === "ar" ? "اتركه فارغاً إذا لم تحدد كلمة سر على السرفر" : "Leave blank if no secret configured on server"}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none rtl:left-auto rtl:right-3" />
              </div>
            </div>

            {/* Session ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {language === "ar" ? "معرّف الجلسة (Session ID / Instance):" : "Session ID / Instance Name:"}
              </label>
              <input
                type="text"
                value={localWaSettings.sessionId}
                onChange={(e) => setLocalWaSettings({ ...localWaSettings, sessionId: e.target.value })}
                placeholder="deshal-erp"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Default Country Dialing Code */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {language === "ar" ? "مفتاح الدولة الافتراضي لأرقام الهواتف:" : "Default Country Dialing Code:"}
              </label>
              <select
                value={localWaSettings.defaultCountryCode}
                onChange={(e) => setLocalWaSettings({ ...localWaSettings, defaultCountryCode: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="968">🇴🇲 سلطنة عمان (+968)</option>
                <option value="966">🇸🇦 المملكة العربية السعودية (+966)</option>
                <option value="971">🇦🇪 الإمارات العربية المتحدة (+971)</option>
                <option value="965">🇰🇼 الكويت (+965)</option>
                <option value="973">🇧🇭 البحرين (+973)</option>
                <option value="974">🇶🇦 قطر (+974)</option>
                <option value="20">🇪🇬 جمهورية مصر العربية (+20)</option>
                <option value="962">🇯🇴 الأردن (+962)</option>
              </select>
            </div>

            {/* Include PDF Link */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                id="includePdfLink"
                checked={localWaSettings.includePdfLink}
                onChange={(e) => setLocalWaSettings({ ...localWaSettings, includePdfLink: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 cursor-pointer"
              />
              <label htmlFor="includePdfLink" className="text-xs font-semibold text-slate-800 cursor-pointer">
                {language === "ar" ? "تضمين رابط معاينة السند الإلكتروني في الرسالة" : "Include online e-voucher validation link"}
              </label>
            </div>

          </div>

          {/* Automation Rules */}
          <div className="border-t border-slate-200 pt-6 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>{language === "ar" ? "قواعد الإرسال التلقائي والأتمتة (Automation)" : "Automation Rules"}</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{language === "ar" ? "عند إنشاء سند جديد" : "On New Voucher"}</span>
                  <input
                    type="checkbox"
                    checked={localWaSettings.autoSendOnVoucherCreate}
                    onChange={(e) => setLocalWaSettings({ ...localWaSettings, autoSendOnVoucherCreate: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  {language === "ar"
                    ? "إرسال إشعار السند فور اعتماده وحفظه مباشرة لرقم هاتف العميل المسجل."
                    : "Instantly send WhatsApp receipt when voucher is saved and approved."}
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{language === "ar" ? "عند إتمام عملية بيع POS" : "On POS Sale"}</span>
                  <input
                    type="checkbox"
                    checked={localWaSettings.autoSendOnPOSCheckout}
                    onChange={(e) => setLocalWaSettings({ ...localWaSettings, autoSendOnPOSCheckout: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  {language === "ar"
                    ? "إرسال ملخص الفاتورة الحرارية عبر الواتساب في حال إدخال رقم هاتف العميل في الكاشير."
                    : "Send digital invoice summary if customer phone is provided during checkout."}
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{language === "ar" ? "تذكيرات مواعيد الاستحقاق" : "Due Date Alerts"}</span>
                  <input
                    type="checkbox"
                    checked={localWaSettings.autoSendOnDueDateReminder}
                    onChange={(e) => setLocalWaSettings({ ...localWaSettings, autoSendOnDueDateReminder: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  {language === "ar"
                    ? "تفعيل زر التذكير السريع بنقرة واحدة في مركز التنبيهات لإرسال إشعار الدفعة."
                    : "Enable one-click WhatsApp dispatch for payment reminder alerts."}
                </p>
              </div>

            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSaveSettings}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>{language === "ar" ? "حفظ التعديلات" : "Save Changes"}</span>
            </button>
          </div>

        </div>
      )}

      {/* TAB 3: LIVE TEST DISPATCHER */}
      {activeTab === "tester" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-purple-600" />
              <span>{language === "ar" ? "فحص الإرسال المباشر وتجربة الرسائل" : "Live Message Test Simulator"}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === "ar"
                ? "أدخل رقم هاتف لاختبار الاتصال وإرسال رسالة فورية عبر سرفر Baileys."
                : "Enter a phone number to test real-time dispatch via your Baileys server."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Input Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {language === "ar" ? "رقم هاتف المستلم للاختبار:" : "Recipient Phone Number:"}
                </label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="e.g. 77438203 or +968 77438203"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
                <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
                  <span>{language === "ar" ? "الصيغة الدولية المعتمدة:" : "Normalized International JID:"}</span>
                  <strong className="font-mono text-indigo-600">{testPhoneFormatted.displayFormatted || testPhoneFormatted.cleanDigits || "---"}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {language === "ar" ? "نص الرسالة التجريبية:" : "Test Message Content:"}
                </label>
                <textarea
                  rows={6}
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 leading-relaxed resize-none"
                />
              </div>

              <button
                onClick={handleSendTestMessage}
                disabled={isSendingTest || !testPhone.trim()}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                {isSendingTest ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{language === "ar" ? "جاري الإرسال عبر السرفر..." : "Dispatching via Baileys API..."}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{language === "ar" ? "إرسال الرسالة التجريبية الآن" : "Send Test Message Now"}</span>
                  </>
                )}
              </button>
            </div>

            {/* Live WhatsApp Preview & Result */}
            <div className="space-y-4">
              
              {/* WhatsApp Message Preview Bubble */}
              <div className="bg-emerald-950/90 rounded-3xl p-4 border border-emerald-800/40 shadow-inner flex flex-col justify-between min-h-[220px]">
                <div className="flex items-center justify-between border-b border-emerald-800/40 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                      WA
                    </div>
                    <div className="text-left rtl:text-right">
                      <div className="text-xs font-bold text-white leading-tight">
                        {settings?.companyName || "Deshal ERP"}
                      </div>
                      <div className="text-[10px] text-emerald-300">
                        {testPhoneFormatted.displayFormatted || "Customer"}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Bubble */}
                <div className="bg-emerald-900/90 text-white p-3.5 rounded-2xl text-xs leading-relaxed font-sans whitespace-pre-wrap shadow-sm border border-emerald-700/50">
                  {testMessage}
                </div>

                <div className="text-[10px] text-emerald-400 text-left rtl:text-right pt-2 flex items-center justify-end gap-1">
                  <span>{language === "ar" ? "تمت المعاينة" : "Preview"}</span>
                  <Check className="w-3 h-3 text-emerald-400" />
                </div>
              </div>

              {/* Execution Result Box */}
              {testResult && (
                <div className={`p-4 rounded-2xl border text-xs font-medium space-y-2 animate-in fade-in ${
                  testResult.success
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-rose-50 border-rose-200 text-rose-900"
                }`}>
                  <div className="flex items-center gap-2 font-bold">
                    {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                    <span>{testResult.message}</span>
                  </div>
                  {testResult.raw && (
                    <pre className="text-[10px] font-mono bg-black/5 p-2 rounded-lg overflow-x-auto max-h-32">
                      {JSON.stringify(testResult.raw, null, 2)}
                    </pre>
                  )}
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* TAB 4: SERVER CODE & VPS DEPLOYMENT GUIDE */}
      {activeTab === "vps_guide" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-600" />
              <span>{language === "ar" ? "كود السرفر والتشغيل على سرفرك الخاص (VPS / Docker)" : "Server Code & VPS Deployment"}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === "ar"
                ? "يمكنك نسخ وتشغيل هذا السرفر المصغر المكتوب بـ Node.js و @whiskeysockets/baileys على سرفر Ubuntu / VPS أو عبر Docker في دقائق معدودة."
                : "Copy and run this lightweight Node.js + Baileys Express server on your VPS or via Docker."}
            </p>
          </div>

          {/* Node.js Server Code */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>1. ملف السرفر <code>server.js</code> (Node.js + Baileys Express)</span>
              </span>
              <button
                onClick={() => handleCopySnippet(BAILEYS_SERVER_NODE_SNIPPET, "node_server")}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedSnippet === "node_server" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSnippet === "node_server" ? (language === "ar" ? "تم النسخ!" : "Copied!") : (language === "ar" ? "نسخ الكود" : "Copy Code")}</span>
              </button>
            </div>

            <pre className="bg-slate-950 text-slate-200 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-80 leading-relaxed border border-slate-800">
              {BAILEYS_SERVER_NODE_SNIPPET}
            </pre>
          </div>

          {/* Docker Compose Snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-emerald-600" />
                <span>2. ملف <code>docker-compose.yml</code> (التشغيل السريع بحاوية Docker)</span>
              </span>
              <button
                onClick={() => handleCopySnippet(DOCKER_COMPOSE_SNIPPET, "docker_compose")}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedSnippet === "docker_compose" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSnippet === "docker_compose" ? (language === "ar" ? "تم النسخ!" : "Copied!") : (language === "ar" ? "نسخ" : "Copy")}</span>
              </button>
            </div>

            <pre className="bg-slate-900 text-slate-200 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-56 leading-relaxed border border-slate-800">
              {DOCKER_COMPOSE_SNIPPET}
            </pre>
          </div>

          {/* Setup Steps */}
          <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 text-xs text-indigo-950 space-y-2">
            <h4 className="font-bold flex items-center gap-1.5 text-indigo-900">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>{language === "ar" ? "خطوات التشغيل على سرفر VPS في 3 دقائق:" : "3-Minute VPS Deployment Instructions:"}</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-700 leading-relaxed font-sans">
              <li>{language === "ar" ? "افتح موجه الأوامر (SSH) على سرفرك (Ubuntu/Debian)." : "Connect to your VPS via SSH."}</li>
              <li>{language === "ar" ? "أنشئ مجلداً جديداً: `mkdir baileys-wa && cd baileys-wa`" : "Create folder: `mkdir baileys-wa && cd baileys-wa`"}</li>
              <li>{language === "ar" ? "ثبّت الحزم المطلوبة: `npm install @whiskeysockets/baileys express cors qrcode pino`" : "Install dependencies: `npm install @whiskeysockets/baileys express cors qrcode pino`"}</li>
              <li>{language === "ar" ? "شغّل السرفر: `node server.js` أو عبر PM2: `pm2 start server.js --name wa-server`" : "Start server: `pm2 start server.js --name wa-server`"}</li>
              <li>{language === "ar" ? "انسخ عنوان سرفرك (مثل `http://YOUR_VPS_IP:8000`) وضعه في تبويب إعدادات السرفر بالأعلى ثم امسح رمز QR." : "Paste your VPS URL in Server Settings tab and scan the QR code."}</li>
            </ol>
          </div>

        </div>
      )}

      {/* TAB 5: SENT MESSAGES LOGS */}
      {activeTab === "logs" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>{language === "ar" ? "سجل الرسائل وإشعارات الواتساب المرسلة" : "Sent WhatsApp Messages Log"}</span>
              </h3>
              <p className="text-xs text-slate-500">
                {language === "ar"
                  ? "سجل فوري بجميع رسائل الواتساب الصادرة من النظام مع حالة التسليم."
                  : "Live dispatch history and delivery status for all outgoing WhatsApp alerts."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={logsSearch}
                onChange={(e) => setLogsSearch(e.target.value)}
                placeholder={language === "ar" ? "بحث برقم الهاتف أو المحتوى..." : "Search logs..."}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 w-48"
              />
              {logs.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm(language === "ar" ? "هل تريد مسح سجل الرسائل؟" : "Clear all logs?")) {
                      clearWhatsAppLogs();
                      setLogs([]);
                    }
                  }}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold rounded-xl text-xs flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{language === "ar" ? "مسح السجل" : "Clear"}</span>
                </button>
              )}
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs space-y-1">
              <Clock className="w-6 h-6 mx-auto text-slate-400 mb-1" />
              <p className="font-semibold">{language === "ar" ? "لا توجد رسائل مسجلة حتى الآن." : "No message logs recorded yet."}</p>
              <p className="text-[11px] text-slate-400">
                {language === "ar" ? "ستظهر الرسائل المرسلة للعملاء تلقائياً هنا." : "Dispatched customer notifications will appear here."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left rtl:text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="p-3">{language === "ar" ? "التاريخ والوقت" : "Timestamp"}</th>
                    <th className="p-3">{language === "ar" ? "المستلم" : "Recipient"}</th>
                    <th className="p-3">{language === "ar" ? "نوع الرسالة" : "Type"}</th>
                    <th className="p-3">{language === "ar" ? "مقتطف الرسالة" : "Snippet"}</th>
                    <th className="p-3">{language === "ar" ? "الحالة" : "Status"}</th>
                    <th className="p-3">{language === "ar" ? "الطريقة" : "Method"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 text-slate-500 font-mono text-[11px]">
                        {new Date(l.timestamp).toLocaleString("ar-OM")}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{l.recipientName || "العميل"}</div>
                        <div className="font-mono text-[11px] text-indigo-600">{l.recipientPhone}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                          {l.messageType}
                        </span>
                        {l.voucherNumber && (
                          <div className="text-[10px] font-mono text-slate-500 mt-0.5">{l.voucherNumber}</div>
                        )}
                      </td>
                      <td className="p-3 max-w-xs truncate text-slate-700" title={l.messageSnippet}>
                        {l.messageSnippet}
                      </td>
                      <td className="p-3">
                        {l.status === "DELIVERED" || l.status === "SENT" ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{language === "ar" ? "تم التسليم" : "Delivered"}</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px] inline-flex items-center gap-1" title={l.errorDetails}>
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            <span>{language === "ar" ? "تعذر الإرسال" : "Failed"}</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                          {l.method === "BAILEYS_API" ? "Baileys API" : "WA Web"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
