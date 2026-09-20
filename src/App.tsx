import React, { useState, useEffect, useCallback } from "react";
import { signOut as supabaseSignOut } from "./lib/supabase/authService";
import type { SupabaseAuthUser } from "./lib/supabase/authService";
import { isSupabaseConfigured } from "./lib/supabase/client";
import * as customerSvc from "./lib/supabase/customerService";
import * as employeeSvc from "./lib/supabase/employeeService";
import * as inventorySvc from "./lib/supabase/inventoryService";
import * as supplierSvc from "./lib/supabase/supplierService";
import * as companySvc from "./lib/supabase/companyService";
import * as hrSvc from "./lib/supabase/hrService";
import * as accountingSvc from "./lib/supabase/accountingService";
import * as purchasesSvc from "./lib/supabase/purchasesService";
import * as spacesSvc from "./lib/supabase/spacesService";
import * as auditSvc from "./lib/supabase/auditService";
import { filterCleanEmployees } from "./application/hr/cleanEmployeesList";
import { resolveCompanyId } from "./utils/uuid";
const DEFAULT_COMPANY_ID = "00000000-0000-0000-0000-000000000001";
import {
  ReceiptVoucher,
  CompanySettings,
  DesignTheme,
  VoucherType,
  Customer,
  InventoryItem,
  StockMovement,
  PurchaseInvoice,
  Supplier,
  Branch,
  StockTransfer,
  Employee,
  AuditLogEntry,
  AuthSession,
  RecurringSchedule,
  RentalSpace,
  SpaceBooking,
  ConsultingService,
  MembershipPackage,
  TenantSubscription,
  ServiceBooking,
  LeaseContract,
  PaymentInstallment,
  AttendanceRecord,
  PayrollSlip,
  LeaveRequest,
  AttendanceMovementLog,
  KioskDevice,
  JournalEntry
} from "./types";
import {
  loadJournalEntries,
  saveAccounts,
  saveJournalEntries,
  saveFiscalPeriods
} from "./utils/accountingStorage";
import {
  loadCompanySettings,
  saveCompanySettings,
  loadDesignTheme,
  saveDesignTheme,
  loadVouchers,
  saveVouchers,
  loadCustomers,
  saveCustomers,
  loadInventory,
  saveInventory,
  loadPurchases,
  savePurchases,
  loadSuppliers,
  saveSuppliers,
  loadStockMovements,
  saveStockMovements,
  loadBranches,
  saveBranches,
  loadStockTransfers,
  saveStockTransfers,
  loadEmployees,
  saveEmployees,
  loadActiveEmployeeId,
  saveActiveEmployeeId,
  loadAttendanceRecords,
  saveAttendanceRecords,
  loadPayrollSlips,
  savePayrollSlips,
  loadLeaveRequests,
  saveLeaveRequests,
  loadRecurringSchedules,
  saveRecurringSchedules,
  loadRentalSpaces,
  saveRentalSpaces,
  loadSpaceBookings,
  saveSpaceBookings,
  DEFAULT_COMPANY_SETTINGS,
  DEFAULT_DESIGN_THEME
} from "./utils/storage";
import {
  loadAuthSession,
  saveAuthSession,
  clearAuthSession
} from "./utils/authManager";
// Supabase-aware auth enhancement: listens to auth state changes when configured
import {
  loadAuditLogs,
  saveAuditLogs,
  logActivity,
  clearAuditLogs
} from "./utils/auditLogger";
import { exportToPdf } from "./utils/pdfGenerator";
import { generateUuid } from "./utils/uuid";
import { HeaderNavbar } from "./components/HeaderNavbar";
import { VoucherForm } from "./components/VoucherForm";
import { ReceiptPreview } from "./components/ReceiptPreview";
import { SettingsStudio } from "./components/SettingsStudio";
import { VoucherHistory } from "./components/VoucherHistory";
import { CRMView } from "./components/CRMView";
import { InventoryView } from "./components/InventoryView";
import { PurchasesView } from "./components/PurchasesView";
import { BranchesView } from "./components/BranchesView";
import { RecurringSchedulesView } from "./components/RecurringSchedulesView";
import { EmployeesManager } from "./components/EmployeesManager";
import { RequestsDashboard } from "./components/requests/RequestsDashboard";
import { HomeDashboard } from "./components/HomeDashboard";
import { POSView } from "./components/POSView";
import { SpacesManager } from "./components/SpacesManager";
import { SpaceBookingModal } from "./components/SpaceBookingModal";
import { ServicesManager } from "./components/ServicesManager";
import { ClientBookingPortal } from "./components/ClientBookingPortal";
import { ServiceBookingModal } from "./components/ServiceBookingModal";
import { TenantSubscriptionModal } from "./components/TenantSubscriptionModal";
import { AIAssistantModal } from "./components/AIAssistantModal";
import { LoginPage } from "./components/auth/LoginPage";
import { SecuritySettingsModal } from "./components/auth/SecuritySettingsModal";
import { LockScreenModal } from "./components/auth/LockScreenModal";
import { PWAInstallBanner } from "./components/PWAInstallBanner";
import { IOSInstallModal } from "./components/IOSInstallModal";
import { AttendanceKioskModal } from "./components/kiosk/AttendanceKioskModal";
import {
  loadAttendanceMovementLogs,
  saveAttendanceMovementLogs,
  loadMovementTypes,
  loadKioskDevices,
  saveKioskDevices,
  loadActiveKioskDeviceId
} from "./utils/attendanceStorage";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { NavigationDrawer } from "./components/NavigationDrawer";

import { usePWAInstall } from "./hooks/usePWAInstall";
import { useUserProfile } from "./hooks/useUserProfile";
import { PrimarySidebar } from "./components/navigation/PrimarySidebar";
import { TopNavBar } from "./components/navigation/TopNavBar";
import { Breadcrumbs } from "./components/navigation/Breadcrumbs";
import { CommandPaletteModal } from "./components/navigation/CommandPaletteModal";
import { QuickCreateModal } from "./components/navigation/QuickCreateModal";
import { ContextualHelpDrawer } from "./components/help/ContextualHelpDrawer";
import { HelpCenterView } from "./components/help/HelpCenterView";
import { ERPOnboardingModal } from "./components/onboarding/ERPOnboardingModal";
import { NotificationsDrawer, ERPNotification } from "./components/notifications/NotificationsDrawer";
import { WebsiteView } from "./components/website/WebsiteView";
import CmsManagerView from "./components/cms/CmsManagerView";
import { AppProviders } from "./app/AppProviders";
import { AppRouter } from "./app/AppRouter";
import { AppShell } from "./app/AppShell";
import { AppRoutes } from "./app/AppRoutes";
import { useAuth } from "./contexts/AuthContext";
import { useUIShell } from "./contexts/UIShellContext";
import { useAudit } from "./contexts/AuditContext";
import { useQuickCreateActions } from "./hooks/useQuickCreateActions";
import { getSystemNotifications } from "./application/notifications/getSystemNotifications";
import { confirmSpaceBooking } from "./application/spaces/confirmSpaceBooking";
import { useKioskAttendance } from "./hooks/useKioskAttendance";
import { getActiveBranch } from "./application/masterData/getActiveBranch";
import { getActiveEmployee } from "./application/hr/getActiveEmployee";
import { useAuthLifecycleActions } from "./hooks/useAuthLifecycleActions";

function AppContent() {
  const { state: authState, actions: authActions } = useAuth();
  const { state: uiState, actions: uiActions } = useUIShell();
  const { state: auditState, actions: auditActions } = useAudit();
  const authSession = authState.authSession;
  const supabaseAuthUser = authState.supabaseAuthUser;
  const isKioskTabletUser = authState.isKioskTabletUser;
  const isSecurityModalOpen = authState.isSecurityModalOpen;

  const { userName, updateUserName } = useUserProfile();
  const {
    handleLoginSuccess,
    handleLogout,
    handleLockScreen,
    handleUnlockScreen,
    handleSessionUpdated
  } = useAuthLifecycleActions();

  // Load live data from Supabase PostgreSQL
  useEffect(() => {
    if (isSupabaseConfigured && (supabaseAuthUser || authSession)) {
      const cId = supabaseAuthUser?.companyId || (authSession?.user as any)?.companyId || DEFAULT_COMPANY_ID;
      const validCompanyId = resolveCompanyId(cId) || DEFAULT_COMPANY_ID;
      if (!validCompanyId) return;

      Promise.all([
        customerSvc.getCustomers(validCompanyId),
        employeeSvc.getEmployees(validCompanyId),
        inventorySvc.getInventoryItems(validCompanyId),
        supplierSvc.getSuppliers(validCompanyId),
        companySvc.getBranches(validCompanyId),
        inventorySvc.getStockMovements(validCompanyId),
        inventorySvc.getStockTransfers(validCompanyId),
        hrSvc.getAttendanceRecords(validCompanyId),
        hrSvc.getPayrollSlips(validCompanyId),
        hrSvc.getLeaveRequests(validCompanyId),
        purchasesSvc.getVouchers(validCompanyId),
        purchasesSvc.getPurchases(validCompanyId),
        spacesSvc.getRentalSpaces(validCompanyId),
        spacesSvc.getSpaceBookings(validCompanyId),
        spacesSvc.getLeaseContracts(validCompanyId),
        accountingSvc.getAccounts(validCompanyId),
        accountingSvc.getJournalEntries(validCompanyId),
        accountingSvc.getFiscalPeriods(validCompanyId),
        auditSvc.getAuditLogs(validCompanyId),
      ]).then(([
        custs, emps, inv, supp, branch,
        mvmts, trs, att, payroll, leaves,
        vouch, purch, spaces, bookings, leases,
        accts, jEntries, periods, logs
      ]) => {
        if (Array.isArray(emps)) {
          saveEmployees(filterCleanEmployees(emps));
        }

        saveInventory(inv);
        saveSuppliers(supp);
        saveBranches(branch);
        saveStockMovements(mvmts);
        saveStockTransfers(trs as StockTransfer[]);

        if (att && att.length > 0) {
          saveAttendanceRecords(att);
        }

        if (payroll && payroll.length > 0) {
          savePayrollSlips(payroll);
        }

        if (leaves && leaves.length > 0) {
          saveLeaveRequests(leaves);
        }

        saveVouchers(vouch);
        savePurchases(purch);
        saveAccounts(accts);
        saveJournalEntries(jEntries);
        saveFiscalPeriods(periods);
        auditActions.setAuditLogsList(logs);
      }).catch(console.error);
    }
  }, [supabaseAuthUser, auditActions]);

  // Smart ERP Notifications & Alerts Generator
  const systemNotifications = React.useMemo<ERPNotification[]>(
    () => getSystemNotifications(),
    []
  );

  const { handleSaveMovementLog: handleSaveGlobalMovementLogSingle } = useKioskAttendance();

  const pwa = usePWAInstall({
    onNavigateTab: (tab) => uiActions.setActiveTab(tab as any),
    onOpenIosModal: () => uiActions.setIosModalOpen(true)
  });

  const entityCounts = React.useMemo(
    () => ({
      vouchers: loadVouchers().length,
      inventory: loadInventory().length,
      customers: loadCustomers().length,
      employees: loadEmployees().length
    }),
    []
  );

  const {
    handleCreateNewVoucher,
    handleQuickCreateAction,
    handleCreatePaymentVoucherFromPurchase,
  } = useQuickCreateActions();

  return (
    <AppRouter>
      {!authSession ? (
        <LoginPage
          companySettings={loadCompanySettings()}
          onLoginSuccess={handleLoginSuccess}
          onAuditLog={auditActions.triggerAuditLog}
        />
      ) : isKioskTabletUser ? (
        <div className="fixed inset-0 z-50 bg-slate-950 overflow-hidden">
          <AttendanceKioskModal
            isOpen={true}
            onClose={handleLogout}
            employees={loadEmployees()}
            kioskDevices={loadKioskDevices()}
            movementTypes={loadMovementTypes()}
            movementLogs={loadAttendanceMovementLogs()}
            activeDeviceId={loadActiveKioskDeviceId()}
            onSaveMovementLog={handleSaveGlobalMovementLogSingle}
            onAuditLog={auditActions.triggerAuditLog}
          />
        </div>
      ) : (
        <>
          <AppShell
            activeTab={uiState.activeTab}
            onNavigateTab={uiActions.navigateWithHistory}
            isSidebarCollapsed={uiState.isSidebarCollapsed}
            onToggleSidebarCollapse={uiActions.toggleSidebarCollapse}
            onOpenMobileSidebar={() => uiActions.setSidebarOpenMobile(true)}
            onOpenCommandPalette={() => uiActions.setCommandPaletteOpen(true)}
            onOpenQuickCreate={() => uiActions.setQuickCreateOpen(true)}
            onOpenContextualHelp={() => uiActions.setContextualHelpOpen(true)}
            onOpenNotifications={() => uiActions.setNotificationsOpen(true)}
            onOpenOnboarding={() => uiActions.setOnboardingOpen(true)}
            onOpenAiAssistant={() => uiActions.setAiModalOpen(true)}
            onOpenGlobalKiosk={() => uiActions.setGlobalKioskModalOpen(true)}
            onOpenSecuritySettings={authActions.openSecurityModal}
            onOpenDrawer={() => uiActions.setDrawerOpen(true)}
            onNewVoucher={handleCreateNewVoucher}
            onLogout={handleLogout}
            authSession={authSession}
            systemNotificationsCount={systemNotifications.length}
            breadcrumbsList={uiState.breadcrumbsList}
            userName={userName}
            activeBranch={getActiveBranch()}
            deferredPrompt={pwa.deferredPrompt}
            onTriggerInstall={pwa.triggerInstall}
          >
            <AppRoutes
              activeTab={uiState.activeTab}
              userName={userName}
              onUpdateUserName={updateUserName}
              onCreatePaymentVoucherFromPurchase={handleCreatePaymentVoucherFromPurchase}
              onClearAuditLogs={auditActions.clearAuditLogs}
              onOpenSecuritySettings={authActions.openSecurityModal}
              getActiveEmployee={() => getActiveEmployee(userName)}
            />
          </AppShell>

          {/* Global Command Palette Modal (Ctrl + K) */}
          <CommandPaletteModal
            isOpen={uiState.isCommandPaletteOpen}
            onClose={() => uiActions.setCommandPaletteOpen(false)}
            onNavigateTab={uiActions.navigateWithHistory}
            onQuickCreate={(actId) => {
              handleQuickCreateAction(actId);
              uiActions.setCommandPaletteOpen(false);
            }}
            onSelectVoucher={() => {
              uiActions.navigateWithHistory("preview");
            }}
            vouchers={loadVouchers()}
            suppliers={loadSuppliers()}
            inventory={loadInventory()}
            employees={loadEmployees()}
            purchases={loadPurchases()}
            onOpenAiAssistant={() => uiActions.setAiModalOpen(true)}
            onOpenAttendanceKiosk={() => uiActions.setGlobalKioskModalOpen(true)}
            onOpenOnboarding={() => uiActions.setOnboardingOpen(true)}
          />

          {/* Global Quick Create Modal */}
          <QuickCreateModal
            isOpen={uiState.isQuickCreateOpen}
            onClose={() => uiActions.setQuickCreateOpen(false)}
            onSelectAction={handleQuickCreateAction}
          />

          {/* Contextual Page Help Drawer */}
          <ContextualHelpDrawer
            isOpen={uiState.isContextualHelpOpen}
            onClose={() => uiActions.setContextualHelpOpen(false)}
            activeTab={uiState.activeTab}
            onNavigateTab={uiActions.navigateWithHistory}
            onOpenHelpCenter={() => uiActions.navigateWithHistory("help")}
            onOpenAiAssistant={() => uiActions.setAiModalOpen(true)}
            onOpenOnboarding={() => uiActions.setOnboardingOpen(true)}
          />

          {/* Guided ERP Onboarding Modal */}
          <ERPOnboardingModal
            isOpen={uiState.isOnboardingOpen}
            onClose={() => uiActions.setOnboardingOpen(false)}
            onNavigateTab={uiActions.navigateWithHistory}
          />

          {/* Mobile Bottom Navigation (Smart Touch Navigation for Phones / Tablets) */}
          <MobileBottomNav
            activeTab={uiState.activeTab}
            setActiveTab={uiActions.setActiveTab}
            onNewVoucher={handleCreateNewVoucher}
            onOpenAiAssistant={() => uiActions.setAiModalOpen(true)}
            onOpenDrawer={() => uiActions.setDrawerOpen(true)}
          />

          {/* Global Slide-Over Navigation Drawer */}
          <NavigationDrawer
            isOpen={uiState.isDrawerOpen}
            onClose={() => uiActions.setDrawerOpen(false)}
            activeTab={uiState.activeTab}
            onSelectTab={uiActions.setActiveTab}
            onNewVoucher={handleCreateNewVoucher}
            onOpenAiAssistant={() => uiActions.setAiModalOpen(true)}
            onOpenAttendanceKiosk={() => uiActions.setGlobalKioskModalOpen(true)}
            onOpenSecuritySettings={authActions.openSecurityModal}
            onLockScreen={handleLockScreen}
            onLogout={handleLogout}
            session={authSession}
            vouchersCount={entityCounts.vouchers}
            inventoryCount={entityCounts.inventory}
            customersCount={entityCounts.customers}
            employeesCount={entityCounts.employees}
          />

          {/* Offline Status Connectivity Banner */}
          <OfflineIndicator />

          {/* PWA Install Banner */}
          <PWAInstallBanner pwa={pwa} />

          {/* iOS Manual Installation Modal */}
          <IOSInstallModal
            isOpen={uiState.isIosModalOpen}
            onClose={() => uiActions.setIosModalOpen(false)}
          />

          {/* Attendance Tablet Kiosk Global Modal */}
          <AttendanceKioskModal
            isOpen={uiState.isGlobalKioskModalOpen}
            onClose={() => uiActions.setGlobalKioskModalOpen(false)}
            employees={loadEmployees()}
            kioskDevices={loadKioskDevices()}
            movementTypes={loadMovementTypes()}
            movementLogs={loadAttendanceMovementLogs()}
            activeDeviceId={loadActiveKioskDeviceId()}
            onSaveMovementLog={handleSaveGlobalMovementLogSingle}
            onAuditLog={auditActions.triggerAuditLog}
          />

          {/* Smart Space / Hall Instant Booking Modal */}
          <SpaceBookingModal />

          {/* Business Services & Advisory Instant Booking Modal */}
          <ServiceBookingModal />

          {/* Tenant Subscription & Free Quotas Management Modal */}
          <TenantSubscriptionModal />

          {/* AI Assistant Modal */}
          <AIAssistantModal
            isOpen={uiState.isAiModalOpen}
            onClose={() => uiActions.setAiModalOpen(false)}
          />

          {/* Smart Notifications and Alerts Drawer */}
          <NotificationsDrawer
            isOpen={uiState.isNotificationsOpen}
            onClose={() => uiActions.setNotificationsOpen(false)}
            notifications={systemNotifications}
            onNavigateTab={(tab) => {
              uiActions.setNotificationsOpen(false);
              uiActions.navigateWithHistory(tab);
            }}
          />

          {/* Account Security & Passwords Settings Modal */}
          {authSession && (
            <SecuritySettingsModal
              session={authSession}
              isOpen={isSecurityModalOpen}
              onClose={authActions.closeSecurityModal}
              onSessionUpdated={handleSessionUpdated}
              onAuditLog={auditActions.triggerAuditLog}
            />
          )}

          {/* Quick Screen Lock Modal */}
          {authSession && authSession.isLocked && (
            <LockScreenModal
              session={authSession}
              onUnlock={handleUnlockScreen}
            />
          )}
        </>
      )}
    </AppRouter>
  );
}

export default function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}
