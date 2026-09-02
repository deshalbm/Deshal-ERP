import React, { useState, useEffect } from "react";
import { WifiOff, Wifi, CheckCircle2 } from "lucide-react";

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [showReconnectedAlert, setShowReconnectedAlert] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnectedAlert(true);
      const timer = setTimeout(() => setShowReconnectedAlert(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnectedAlert(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline && !showReconnectedAlert) return null;

  return (
    <div 
      className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 pointer-events-none"
      dir="rtl"
      data-pwa-nav
    >
      {!isOnline ? (
        <div className="flex items-center space-x-2 space-x-reverse bg-amber-500 text-slate-950 px-4 py-2 rounded-full shadow-lg text-xs font-bold border border-amber-400/50 backdrop-blur-md animate-pulse">
          <WifiOff className="w-4 h-4" />
          <span>وضع غير متصل بالإنترنت - يتم حفظ بيانات السندات محلياً بدون فقدان</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2 space-x-reverse bg-emerald-600 text-white px-4 py-2 rounded-full shadow-lg text-xs font-bold border border-emerald-500 backdrop-blur-md">
          <Wifi className="w-4 h-4" />
          <span>تمت استعادة الاتصال بالإنترنت بنجاح</span>
        </div>
      )}
    </div>
  );
};
