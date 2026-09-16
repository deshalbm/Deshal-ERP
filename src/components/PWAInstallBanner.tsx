import React, { useState } from "react";
import { Download, X } from "lucide-react";
import { usePWAInstall, UsePWAInstallReturn } from "../hooks/usePWAInstall";
import { IOSInstallModal } from "./IOSInstallModal";

interface PWAInstallBannerProps {
  onInstallSuccess?: () => void;
  pwa?: UsePWAInstallReturn;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ onInstallSuccess, pwa: propPwa }) => {
  const [isIosModalOpen, setIsIosModalOpen] = useState<boolean>(false);
  const fallbackPwa = usePWAInstall({
    enabled: !propPwa,
    onInstallSuccess,
    onOpenIosModal: () => setIsIosModalOpen(true)
  });
  const pwa = propPwa || fallbackPwa;

  const handleInstallClick = async () => {
    if (pwa.isIos) {
      setIsIosModalOpen(true);
      return;
    }
    await pwa.triggerInstall();
  };

  const handleDismiss = () => {
    pwa.dismissBanner();
  };

  if (pwa.isInstalled || pwa.isDismissed) {
    return <IOSInstallModal isOpen={isIosModalOpen} onClose={() => setIsIosModalOpen(false)} />;
  }

  // Show banner if deferredPrompt is available or if on iOS Safari
  if (!pwa.deferredPrompt && !pwa.isIos) {
    return <IOSInstallModal isOpen={isIosModalOpen} onClose={() => setIsIosModalOpen(false)} />;
  }

  return (
    <>
      <div
        data-install-banner
        dir="rtl"
        className="fixed bottom-16 sm:bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-indigo-500/30 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300"
      >
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md">
            <Download className="w-5 h-5 animate-bounce" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <h4 className="font-bold text-sm text-white">تثبيت تطبيق ديشال لإدارة الأعمال (Deshal ERP)</h4>
              <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 rounded">
                PWA
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              ثبّت التطبيق على هاتفك أو حاسوبك لاستخدامه بملء الشاشة، سرعة فائقة، والعمل بدون إنترنت.
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تثبيت التطبيق الآن</span>
              </button>

              <button
                onClick={handleDismiss}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                لاحقاً
              </button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <IOSInstallModal isOpen={isIosModalOpen} onClose={() => setIsIosModalOpen(false)} />
    </>
  );
};
