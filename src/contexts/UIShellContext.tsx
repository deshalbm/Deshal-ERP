import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

export type NavTab =
  | "home"
  | "pos"
  | "accounting"
  | "spaces"
  | "contracts"
  | "services"
  | "portal"
  | "editor"
  | "preview"
  | "history"
  | "crm"
  | "inventory"
  | "purchases"
  | "branches"
  | "employees"
  | "requests"
  | "schedules"
  | "settings"
  | "help"
  | "website"
  | "cms";

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

export interface UIShellState {
  activeTab: NavTab;
  recentTabs: NavTab[];
  favorites: NavTab[];
  isSidebarCollapsed: boolean;
  isSidebarOpenMobile: boolean;
  isDrawerOpen: boolean;
  isCommandPaletteOpen: boolean;
  isQuickCreateOpen: boolean;
  isContextualHelpOpen: boolean;
  isOnboardingOpen: boolean;
  isNotificationsOpen: boolean;
  isAiModalOpen: boolean;
  isIosModalOpen: boolean;
  isGlobalKioskModalOpen: boolean;
  breadcrumbsList: BreadcrumbItem[];
}

export interface UIShellActions {
  setActiveTab: (tab: NavTab) => void;
  navigateWithHistory: (tab: NavTab) => void;
  toggleSidebarCollapse: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarOpenMobile: (open: boolean) => void;
  setDrawerOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setQuickCreateOpen: (open: boolean) => void;
  setContextualHelpOpen: (open: boolean) => void;
  setOnboardingOpen: (open: boolean) => void;
  setNotificationsOpen: (open: boolean) => void;
  setAiModalOpen: (open: boolean) => void;
  setIosModalOpen: (open: boolean) => void;
  setGlobalKioskModalOpen: (open: boolean) => void;
}

export interface UIShellContextValue {
  state: UIShellState;
  actions: UIShellActions;
}

const UIShellContext = createContext<UIShellContextValue | null>(null);

export interface UIShellProviderProps {
  children: React.ReactNode;
}

export const UIShellProvider: React.FC<UIShellProviderProps> = ({ children }) => {
  const [activeTab, setActiveTabState] = useState<NavTab>("home");
  const [recentTabs, setRecentTabs] = useState<NavTab[]>(["home", "pos", "accounting", "inventory"]);
  const [favorites] = useState<NavTab[]>(["home", "pos", "accounting", "crm", "inventory"]);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("erp_sidebar_collapsed");
      if (saved !== null) {
        return saved === "true";
      }
    }
    return true; // Default to collapsed on desktop
  });

  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState<boolean>(false);
  const [isContextualHelpOpen, setIsContextualHelpOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isIosModalOpen, setIsIosModalOpen] = useState<boolean>(false);
  const [isGlobalKioskModalOpen, setIsGlobalKioskModalOpen] = useState<boolean>(false);

  const toggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("erp_sidebar_collapsed", String(next));
      }
      return next;
    });
  }, []);

  const navigateWithHistory = useCallback((tab: NavTab) => {
    setActiveTabState(tab);
    setRecentTabs((prev) => {
      const filtered = prev.filter((t) => t !== tab);
      return [tab, ...filtered].slice(0, 8);
    });
  }, []);

  // Global Ctrl + K Keyboard Shortcut Listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const breadcrumbsList = useMemo<BreadcrumbItem[]>(() => {
    switch (activeTab) {
      case "home":
        return [{ label: "مساحة العمل (Workspace)" }];
      case "pos":
        return [{ label: "المبيعات (Sales)", onClick: () => navigateWithHistory("home") }, { label: "نقطة البيع (POS)", active: true }];
      case "accounting":
        return [{ label: "المالية (Finance)", onClick: () => navigateWithHistory("home") }, { label: "الأستاذ العام والمحاسبة", active: true }];
      case "crm":
        return [{ label: "العملاء (CRM)", active: true }];
      case "inventory":
        return [{ label: "المستودع والمخازن", onClick: () => navigateWithHistory("home") }, { label: "المخزون والأصناف", active: true }];
      case "purchases":
        return [{ label: "المستودع والمخازن", onClick: () => navigateWithHistory("home") }, { label: "المشتريات والموردين", active: true }];
      case "employees":
        return [{ label: "الموارد البشرية (HR)", active: true }];
      case "spaces":
        return [{ label: "المساحات التأجيرية", active: true }];
      case "contracts":
        return [{ label: "عقود الإيجار والخدمات", active: true }];
      case "history":
        return [{ label: "سجل السندات والفواتير", active: true }];
      case "editor":
        return [{ label: "السندات والفواتير", onClick: () => navigateWithHistory("history") }, { label: "محرر السند المالي", active: true }];
      case "preview":
        return [{ label: "السندات والفواتير", onClick: () => navigateWithHistory("history") }, { label: "معاينة وطباعة المستند", active: true }];
      case "settings":
        return [{ label: "إعدادات النظام والشركة", active: true }];
      case "help":
        return [{ label: "مركز المساعدة ودليل الاستخدام", active: true }];
      default:
        return [{ label: activeTab, active: true }];
    }
  }, [activeTab, navigateWithHistory]);

  const value: UIShellContextValue = {
    state: {
      activeTab,
      recentTabs,
      favorites,
      isSidebarCollapsed,
      isSidebarOpenMobile,
      isDrawerOpen,
      isCommandPaletteOpen,
      isQuickCreateOpen,
      isContextualHelpOpen,
      isOnboardingOpen,
      isNotificationsOpen,
      isAiModalOpen,
      isIosModalOpen,
      isGlobalKioskModalOpen,
      breadcrumbsList
    },
    actions: {
      setActiveTab: setActiveTabState,
      navigateWithHistory,
      toggleSidebarCollapse,
      setSidebarCollapsed: setIsSidebarCollapsed,
      setSidebarOpenMobile: setIsSidebarOpenMobile,
      setDrawerOpen: setIsDrawerOpen,
      setCommandPaletteOpen: setIsCommandPaletteOpen,
      setQuickCreateOpen: setIsQuickCreateOpen,
      setContextualHelpOpen: setIsContextualHelpOpen,
      setOnboardingOpen: setIsOnboardingOpen,
      setNotificationsOpen: setIsNotificationsOpen,
      setAiModalOpen: setIsAiModalOpen,
      setIosModalOpen: setIsIosModalOpen,
      setGlobalKioskModalOpen: setIsGlobalKioskModalOpen
    }
  };

  return <UIShellContext.Provider value={value}>{children}</UIShellContext.Provider>;
};

export const useUIShell = (): UIShellContextValue => {
  const context = useContext(UIShellContext);
  if (!context) {
    throw new Error("useUIShell must be used within a UIShellProvider");
  }
  return context;
};
