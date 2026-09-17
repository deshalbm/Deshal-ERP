import React from "react";
import { PrimarySidebar } from "../components/navigation/PrimarySidebar";
import { TopNavBar } from "../components/navigation/TopNavBar";
import { Breadcrumbs } from "../components/navigation/Breadcrumbs";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { CompanySettings, AuthSession } from "../types";
import { useMasterData } from "../contexts/MasterDataContext";
import { useAuth } from "../contexts/AuthContext";
import { useUIShell } from "../contexts/UIShellContext";
import { useTenant } from "../contexts/TenantContext";

interface AppShellProps {
  children: React.ReactNode;
  activeTab?: string;
  onNavigateTab?: (tab: any) => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
  onOpenMobileSidebar?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenQuickCreate?: () => void;
  onOpenContextualHelp?: () => void;
  onOpenNotifications?: () => void;
  onOpenOnboarding?: () => void;
  onOpenAiAssistant?: () => void;
  onOpenGlobalKiosk?: () => void;
  onOpenSecuritySettings?: () => void;
  onOpenDrawer?: () => void;
  onNewVoucher: () => void;
  onLogout?: () => void;
  authSession?: AuthSession | null;
  systemNotificationsCount: number;
  breadcrumbsList?: any[];
  companySettings?: CompanySettings;
  userName: string;
  activeBranch?: any;
  deferredPrompt: any;
  onTriggerInstall: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  activeTab: activeTabProp,
  onNavigateTab: onNavigateTabProp,
  isSidebarCollapsed: isSidebarCollapsedProp,
  onToggleSidebarCollapse: onToggleSidebarCollapseProp,
  onOpenMobileSidebar: onOpenMobileSidebarProp,
  onOpenCommandPalette: onOpenCommandPaletteProp,
  onOpenQuickCreate: onOpenQuickCreateProp,
  onOpenContextualHelp: onOpenContextualHelpProp,
  onOpenNotifications: onOpenNotificationsProp,
  onOpenOnboarding: onOpenOnboardingProp,
  onOpenAiAssistant: onOpenAiAssistantProp,
  onOpenGlobalKiosk: onOpenGlobalKioskProp,
  onOpenSecuritySettings,
  onOpenDrawer: onOpenDrawerProp,
  onNewVoucher,
  onLogout,
  authSession,
  systemNotificationsCount,
  breadcrumbsList: breadcrumbsListProp,
  companySettings: companySettingsProp,
  userName,
  activeBranch: activeBranchProp,
  deferredPrompt,
  onTriggerInstall
}) => {
  const { state: masterDataState } = useMasterData();
  const { state: authState, actions: authActions } = useAuth();
  const { state: uiState, actions: uiActions } = useUIShell();
  const tenant = useTenant();

  const activeTab = activeTabProp || uiState.activeTab;
  const onNavigateTab = onNavigateTabProp || uiActions.navigateWithHistory;
  const isSidebarCollapsed = isSidebarCollapsedProp !== undefined ? isSidebarCollapsedProp : uiState.isSidebarCollapsed;
  const onToggleSidebarCollapse = onToggleSidebarCollapseProp || uiActions.toggleSidebarCollapse;
  const onOpenMobileSidebar = onOpenMobileSidebarProp || (() => uiActions.setSidebarOpenMobile(true));
  const onOpenCommandPalette = onOpenCommandPaletteProp || (() => uiActions.setCommandPaletteOpen(true));
  const onOpenQuickCreate = onOpenQuickCreateProp || (() => uiActions.setQuickCreateOpen(true));
  const onOpenContextualHelp = onOpenContextualHelpProp || (() => uiActions.setContextualHelpOpen(true));
  const onOpenNotifications = onOpenNotificationsProp || (() => uiActions.setNotificationsOpen(true));
  const onOpenOnboarding = onOpenOnboardingProp || (() => uiActions.setOnboardingOpen(true));
  const onOpenAiAssistant = onOpenAiAssistantProp || (() => uiActions.setAiModalOpen(true));
  const onOpenGlobalKiosk = onOpenGlobalKioskProp || (() => uiActions.setGlobalKioskModalOpen(true));
  const onOpenDrawer = onOpenDrawerProp || (() => uiActions.setDrawerOpen(true));
  const breadcrumbsList = breadcrumbsListProp || uiState.breadcrumbsList;

  const currentSession = authSession !== undefined ? authSession : authState.authSession;
  const handleLogout = onLogout || authActions.logout;
  const handleOpenSecuritySettings = onOpenSecuritySettings || authActions.openSecurityModal;

  const companySettings = companySettingsProp || masterDataState.companySettings;
  const activeBranch = activeBranchProp || masterDataState.branches.find((b) => b.id === masterDataState.activeBranchId) || masterDataState.branches[0] || {
    id: "branch-sohar",
    nameAr: "فرع صحار الرئيسي",
    nameEn: "Sohar Main Branch"
  };
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Primary Sidebar (Desktop Navigation) */}
      <PrimarySidebar
        activeTab={activeTab as any}
        onSelectTab={onNavigateTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={onToggleSidebarCollapse}
        onNewVoucher={onNewVoucher}
        onOpenAiAssistant={onOpenAiAssistant}
        onOpenAttendanceKiosk={onOpenGlobalKiosk}
        onOpenSecuritySettings={handleOpenSecuritySettings}
        onLogout={handleLogout}
        session={currentSession}
        companySettings={companySettings}
        unreadNotificationsCount={systemNotificationsCount}
        onOpenNotifications={onOpenNotifications}
      />

      {/* Main Workspace Area Frame */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarCollapsed ? "md:mr-20" : "md:mr-64"}`}>
        {/* Top Navbar */}
        <TopNavBar
          userName={userName}
          activeBranch={activeBranch}
          session={currentSession}
          companySettings={companySettings}
          onOpenCommandPalette={onOpenCommandPalette}
          onOpenQuickCreate={onOpenQuickCreate}
          onOpenContextualHelp={onOpenContextualHelp}
          onOpenNotifications={onOpenNotifications}
          onOpenOnboarding={onOpenOnboarding}
          onOpenMobileSidebar={onOpenMobileSidebar}
          onOpenSecuritySettings={handleOpenSecuritySettings}
          onLogout={handleLogout}
          deferredPrompt={deferredPrompt}
          onTriggerInstall={onTriggerInstall}
          unreadNotificationsCount={systemNotificationsCount}
        />

        {/* Dynamic Breadcrumbs Bar */}
        <Breadcrumbs items={breadcrumbsList} />

        {/* Main Content Area Container */}
        <main className="flex-1 p-3 sm:p-5 md:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-12">
          {children}
        </main>
      </div>

      {/* Mobile Touch Navigation */}
      <MobileBottomNav
        activeTab={activeTab as any}
        setActiveTab={onNavigateTab}
        onNewVoucher={onNewVoucher}
        onOpenAiAssistant={onOpenAiAssistant}
        onOpenDrawer={onOpenDrawer}
      />
    </div>
  );
};
