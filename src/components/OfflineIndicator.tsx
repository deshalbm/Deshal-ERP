import React from "react";
import { WifiOff, Wifi, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useSyncStatus } from "../hooks/useSyncStatus";

export const OfflineIndicator: React.FC = () => {
  const { isOnline, isSyncing, pendingCount, failedCount, triggerManualSync } = useSyncStatus();

  // If online and no pending/failed operations, stay hidden
  if (isOnline && !isSyncing && pendingCount === 0 && failedCount === 0) {
    return null;
  }

  return (
    <div
      className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 pointer-events-auto"
      dir="rtl"
    >
      {!isOnline ? (
        <div className="flex items-center space-x-3 space-x-reverse bg-amber-500 text-slate-950 px-4 py-2 rounded-full shadow-lg text-xs font-bold border border-amber-400/50 backdrop-blur-md">
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>وضع أوفلاين (غير متصل) — {pendingCount} عملية تنتظر المزامنة محلياً</span>
        </div>
      ) : isSyncing ? (
        <div className="flex items-center space-x-3 space-x-reverse bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg text-xs font-bold border border-blue-500 backdrop-blur-md animate-pulse">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>جاري مزامنة البيانات مع خادم Supabase السحابي ({pendingCount} متبقية)...</span>
        </div>
      ) : failedCount > 0 ? (
        <div className="flex items-center space-x-3 space-x-reverse bg-red-600 text-white px-4 py-2 rounded-full shadow-lg text-xs font-bold border border-red-500 backdrop-blur-md">
          <AlertTriangle className="w-4 h-4" />
          <span>تعذر مزامنة {failedCount} عملية مع السحابة</span>
          <button
            onClick={() => triggerManualSync()}
            className="mr-2 bg-white text-red-700 px-2 py-0.5 rounded text-[11px] hover:bg-slate-100 transition-colors"
          >
            إعادة المحاولة الآن
          </button>
        </div>
      ) : pendingCount > 0 ? (
        <div className="flex items-center space-x-3 space-x-reverse bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg text-xs font-bold border border-indigo-500 backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-indigo-200" />
          <span>{pendingCount} عملية في الانتظار المباشر</span>
          <button
            onClick={() => triggerManualSync()}
            className="mr-2 bg-white text-indigo-800 px-2 py-0.5 rounded text-[11px] hover:bg-slate-100 transition-colors"
          >
            مزامنة فورية
          </button>
        </div>
      ) : null}
    </div>
  );
};
