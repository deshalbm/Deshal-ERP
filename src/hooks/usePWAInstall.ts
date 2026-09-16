import { useState, useEffect, useCallback } from "react";
import { BeforeInstallPromptEvent, isIosDevice, isStandaloneMode } from "../utils/pwaManager";

export interface UsePWAInstallOptions {
  enabled?: boolean;
  onNavigateTab?: (tab: string) => void;
  onOpenIosModal?: () => void;
  onInstallSuccess?: () => void;
}

export interface UsePWAInstallReturn {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isIos: boolean;
  isInstalled: boolean;
  canInstall: boolean;
  triggerInstall: () => Promise<void>;
  dismissBanner: () => void;
  isDismissed: boolean;
}

/**
 * Single authoritative PWA Installation & Lifecycle Custom Hook.
 * Manages beforeinstallprompt event, appinstalled event, URL shortcut parameters,
 * and cross-browser install triggers (Android/Chromium prompt + iOS fallback modal).
 */
export function usePWAInstall(options: UsePWAInstallOptions = {}): UsePWAInstallReturn {
  const { enabled = true, onNavigateTab, onOpenIosModal, onInstallSuccess } = options;
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => isStandaloneMode());
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      const dismissedTimestamp = localStorage.getItem("pwa_banner_dismissed");
      if (dismissedTimestamp) {
        const hoursSinceDismiss = (Date.now() - parseInt(dismissedTimestamp, 10)) / (1000 * 60 * 60);
        return hoursSinceDismiss < 48;
      }
    }
    return false;
  });

  const isIos = isIosDevice();

  useEffect(() => {
    if (typeof window === "undefined" || !enabled) return;

    // Handle PWA URL shortcut query parameters
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    const actionParam = params.get("action");

    if (onNavigateTab) {
      if (
        tabParam === "history" ||
        tabParam === "settings" ||
        tabParam === "preview" ||
        tabParam === "inventory" ||
        tabParam === "purchases" ||
        tabParam === "crm"
      ) {
        onNavigateTab(tabParam);
      } else if (actionParam === "new") {
        onNavigateTab("editor");
      }
    }

    // Single authoritative beforeinstallprompt listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // PWA appinstalled listener
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      if (onInstallSuccess) {
        onInstallSuccess();
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [enabled, onNavigateTab, onInstallSuccess]);

  const triggerInstall = useCallback(async () => {
    if (isIos) {
      if (onOpenIosModal) {
        onOpenIosModal();
      }
      return;
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice?.outcome === "accepted") {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn("[PWA] Install prompt trigger error:", err);
      }
    } else {
      if (onOpenIosModal) {
        onOpenIosModal();
      }
    }
  }, [deferredPrompt, isIos, onOpenIosModal]);

  const dismissBanner = useCallback(() => {
    setIsDismissed(true);
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      localStorage.setItem("pwa_banner_dismissed", Date.now().toString());
    }
  }, []);

  return {
    deferredPrompt,
    isIos,
    isInstalled,
    canInstall: Boolean(deferredPrompt || isIos),
    triggerInstall,
    dismissBanner,
    isDismissed
  };
}
