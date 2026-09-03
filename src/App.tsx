import React, { useState, useEffect, useCallback } from "react";
import { onAuthStateChange, signOut as supabaseSignOut } from "./lib/supabase/authService";
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
import { enqueueOfflineMutation } from "./lib/supabase/syncService";
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
  Account,
  JournalEntry,
  AccountingRevisionLog,
  FiscalPeriod
} from "./types";
import {
  loadAccounts,
  saveAccounts,
  loadJournalEntries,
  saveJournalEntries,
  loadAccountingRevisionLogs,
  saveAccountingRevisionLogs,
  loadFiscalPeriods,
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
  syncCustomerFromVoucher,
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
  loadConsultingServices,
  saveConsultingServices,
  loadMembershipPackages,
  saveMembershipPackages,
  loadTenantSubscriptions,
  saveTenantSubscriptions,
  loadServiceBookings,
  saveServiceBookings,
  loadLeaseContracts,
  saveLeaseContracts,
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
import { numberToWords } from "./utils/numberToWords";
import { generateUuid } from "./utils/uuid";
import { HeaderNavbar } from "./components/HeaderNavbar";
import { VoucherForm } from "./components/VoucherForm";
import { DocWizardView } from "./components/DocWizardView";
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
import { LeaseContractsManager } from "./components/LeaseContractsManager";
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
  loadActiveKioskDeviceId
} from "./utils/attendanceStorage";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { NavigationDrawer } from "./components/NavigationDrawer";
import { GeneralLedgerAccountsView } from "./components/accounting/GeneralLedgerAccountsView";
import { BeforeInstallPromptEvent, isIosDevice } from "./utils/pwaManager";
import { PrimarySidebar } from "./components/navigation/PrimarySidebar";
import { TopNavBar } from "./components/navigation/TopNavBar";
import { Breadcrumbs } from "./components/navigation/Breadcrumbs";
import { CommandPaletteModal } from "./components/navigation/CommandPaletteModal";
import { QuickCreateModal } from "./components/navigation/QuickCreateModal";
import { ContextualHelpDrawer } from "./components/help/ContextualHelpDrawer";
import { HelpCenterView } from "./components/help/HelpCenterView";
import { ERPOnboardingModal } from "./components/onboarding/ERPOnboardingModal";
import { NotificationsDrawer, ERPNotification } from "./components/notifications/NotificationsDrawer";

export default function App() {
  const [activeTab, setActiveTab] = useState<"home" | "pos" | "accounting" | "spaces" | "contracts" | "services" | "portal" | "doc-wizard" | "editor" | "preview" | "history" | "crm" | "inventory" | "purchases" | "branches" | "employees" | "requests" | "schedules" | "settings" | "help">("home");
  const [userName, setUserName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("rv_user_name") || "سعيد";
    }
    return "سعيد";
  });
  const [companySettings, setCompanySettings] = useState<CompanySettings>(loadCompanySettings());
  const [designTheme, setDesignTheme] = useState<DesignTheme>(loadDesignTheme());
  const [vouchersList, setVouchersList] = useState<ReceiptVoucher[]>(loadVouchers());
  const [customersList, setCustomersList] = useState<Customer[]>(() => loadCustomers());
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>(() => loadInventory());
  const [purchasesList, setPurchasesList] = useState<PurchaseInvoice[]>(() => loadPurchases());
  const [suppliersList, setSuppliersList] = useState<Supplier[]>(() => loadSuppliers());
  const [stockMovementsList, setStockMovementsList] = useState<StockMovement[]>(() => loadStockMovements());
  const [branchesList, setBranchesList] = useState<Branch[]>(() => loadBranches());
  const [stockTransfersList, setStockTransfersList] = useState<StockTransfer[]>(() => loadStockTransfers());
  const [schedulesList, setSchedulesList] = useState<RecurringSchedule[]>(() => loadRecurringSchedules());
  const [rentalSpacesList, setRentalSpacesList] = useState<RentalSpace[]>(() => loadRentalSpaces());
  const [spaceBookingsList, setSpaceBookingsList] = useState<SpaceBooking[]>(() => loadSpaceBookings());
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [selectedSpaceForBooking, setSelectedSpaceForBooking] = useState<RentalSpace | null>(null);

  // Deshal Accounting & General Ledger State
  const [accountsList, setAccountsList] = useState<Account[]>(() => loadAccounts());
  const [journalEntriesList, setJournalEntriesList] = useState<JournalEntry[]>(() => loadJournalEntries());
  const [revisionLogsList, setRevisionLogsList] = useState<AccountingRevisionLog[]>(() => loadAccountingRevisionLogs());
  const [fiscalPeriodsList, setFiscalPeriodsList] = useState<FiscalPeriod[]>(() => loadFiscalPeriods());

  // Office & Workspace Lease Contracts Management
  const [leaseContractsList, setLeaseContractsList] = useState<LeaseContract[]>(() => loadLeaseContracts());

  // Business Consulting, Support Services & Tenant Subscriptions
  const [consultingServicesList, setConsultingServicesList] = useState<ConsultingService[]>(() => loadConsultingServices());
  const [membershipPackagesList, setMembershipPackagesList] = useState<MembershipPackage[]>(() => loadMembershipPackages());
  const [tenantSubscriptionsList, setTenantSubscriptionsList] = useState<TenantSubscription[]>(() => loadTenantSubscriptions());
  const [serviceBookingsList, setServiceBookingsList] = useState<ServiceBooking[]>(() => loadServiceBookings());

  const [isServiceBookingModalOpen, setIsServiceBookingModalOpen] = useState<boolean>(false);
  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState<ConsultingService | null>(null);
  const [isTenantSubModalOpen, setIsTenantSubModalOpen] = useState<boolean>(false);
  const [selectedTenantSubForEditing, setSelectedTenantSubForEditing] = useState<TenantSubscription | null>(null);

  // Deshal HR & Payroll Management States
  const [employeesList, setEmployeesList] = useState<Employee[]>(() => loadEmployees());
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>(() => loadAttendanceRecords());
  const [payrollSlipsList, setPayrollSlipsList] = useState<PayrollSlip[]>(() => loadPayrollSlips());
  const [leaveRequestsList, setLeaveRequestsList] = useState<LeaveRequest[]>(() => loadLeaveRequests());
  const [activeEmployeeId, setActiveEmployeeId] = useState<string>(() => loadActiveEmployeeId());
  const [auditLogsList, setAuditLogsList] = useState<AuditLogEntry[]>(() => loadAuditLogs());
  const [activeBranchId, setActiveBranchId] = useState<string>(() => {
    const b = loadBranches();
    return b.length > 0 ? b[0].id : "branch-sohar";
  });

  // Authentication & Security Session State
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => loadAuthSession());
  const [supabaseAuthUser, setSupabaseAuthUser] = useState<SupabaseAuthUser | null>(null);
  const [isSupabaseReady, setIsSupabaseReady] = useState(!isSupabaseConfigured);

  // Load live data from Supabase PostgreSQL
  useEffect(() => {
    if (isSupabaseConfigured) {
      const cId = supabaseAuthUser?.companyId || DEFAULT_COMPANY_ID;
      Promise.all([
        customerSvc.getCustomers(cId),
        employeeSvc.getEmployees(cId),
        inventorySvc.getInventoryItems(cId),
        supplierSvc.getSuppliers(cId),
        companySvc.getBranches(cId),
        inventorySvc.getStockMovements(cId),
        inventorySvc.getStockTransfers(cId),
        hrSvc.getAttendanceRecords(cId),
        hrSvc.getPayrollSlips(cId),
        hrSvc.getLeaveRequests(cId),
        purchasesSvc.getVouchers(cId),
        purchasesSvc.getPurchases(cId),
        spacesSvc.getRentalSpaces(cId),
        spacesSvc.getSpaceBookings(cId),
        spacesSvc.getLeaseContracts(cId),
        spacesSvc.getConsultingServices(cId),
        spacesSvc.getMembershipPackages(cId),
        spacesSvc.getTenantSubscriptions(cId),
        spacesSvc.getServiceBookings(cId),
        accountingSvc.getAccounts(cId),
        accountingSvc.getJournalEntries(cId),
        accountingSvc.getFiscalPeriods(cId),
        auditSvc.getAuditLogs(cId),
      ]).then(([
        custs, emps, inv, supp, branch,
        mvmts, trs, att, payroll, leaves,
        vouch, purch, spaces, bookings, leases,
        services, pkgs, subs, sBookings,
        accts, jEntries, periods, logs
      ]) => {
        setCustomersList(custs);
        setEmployeesList(emps);
        setInventoryList(inv);
        setSuppliersList(supp);
        setBranchesList(branch);
        setStockMovementsList(mvmts);
        setStockTransfersList(trs as StockTransfer[]);
        setAttendanceList(att);
        setPayrollSlipsList(payroll);
        setLeaveRequestsList(leaves);
        setVouchersList(vouch);
        setPurchasesList(purch);
        setRentalSpacesList(spaces);
        setSpaceBookingsList(bookings);
        setLeaseContractsList(leases);
        setConsultingServicesList(services);
        setMembershipPackagesList(pkgs);
        setTenantSubscriptionsList(subs);
        setServiceBookingsList(sBookings);
        setAccountsList(accts);
        setJournalEntriesList(jEntries);
        setFiscalPeriodsList(periods);
        setAuditLogsList(logs);
      }).catch(console.error);
    }
  }, [supabaseAuthUser]);

  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // New ERP Navigation & Modal UI State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("erp_sidebar_collapsed") === "true";
    }
    return false;
  });
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState<boolean>(false);
  const [isContextualHelpOpen, setIsContextualHelpOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [recentTabs, setRecentTabs] = useState<string[]>(["home", "pos", "accounting", "inventory"]);
  const [favorites, setFavorites] = useState<string[]>(["home", "pos", "accounting", "crm", "inventory"]);

  // Smart ERP Notifications & Alerts Generator
  const systemNotifications = React.useMemo<ERPNotification[]>(() => {
    const list: ERPNotification[] = [];

    // 1. Low stock alerts
    const lowStockItems = inventoryList.filter(
      (item) => (item.quantity || 0) <= (item.minAlertQuantity || 5)
    );
    if (lowStockItems.length > 0) {
      list.push({
        id: "alert-low-stock",
        type: "warning",
        titleAr: `تنبيه نقص مخزون (${lowStockItems.length} صنف)`,
        titleEn: `Low Stock Alert (${lowStockItems.length} items)`,
        descAr: `الأصناف (${lowStockItems.slice(0, 2).map((i) => i.name).join("، ")}${lowStockItems.length > 2 ? " وغيرها" : ""}) وصلت للحد الأدنى. يُنصح بإصدار أمر شراء.`,
        descEn: `Items reached reorder point. Consider creating a purchase order.`,
        time: "تحديث لحظي",
        targetTab: "inventory"
      });
    }

    // 2. Pending vouchers or installments
    const pendingInstallments = leaseContractsList.flatMap((c) =>
      (c.paymentSchedule || []).filter((p) => p.status === "PENDING")
    );
    if (pendingInstallments.length > 0) {
      list.push({
        id: "alert-pending-installments",
        type: "info",
        titleAr: `أقساط إيجار مستحقة (${pendingInstallments.length} دفعة)`,
        titleEn: `Pending Lease Installments (${pendingInstallments.length})`,
        descAr: `يوجد دفعات إيجارية مستحقة التحصيل لمستأجري المساحات والمكاتب.`,
        descEn: `There are upcoming lease payments to collect.`,
        time: "اليوم",
        targetTab: "contracts"
      });
    }

    // 3. Unposted Journal entries or drafts
    const draftEntries = journalEntriesList.filter((j) => j.status === "DRAFT");
    if (draftEntries.length > 0) {
      list.push({
        id: "alert-draft-entries",
        type: "info",
        titleAr: `قيود محاسبية مسودة (${draftEntries.length} قيد)`,
        titleEn: `Draft Journal Entries (${draftEntries.length})`,
        descAr: `توجد قيود محاسبية تحتاج إلى المراجعة والترحيل للأستاذ العام.`,
        descEn: `Journal entries pending posting in the General Ledger.`,
        time: "اليوم",
        targetTab: "accounting"
      });
    }

    return list;
  }, [inventoryList, leaseContractsList, journalEntriesList]);

  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("erp_sidebar_collapsed", String(next));
      }
      return next;
    });
  };

  const handleNavigateWithHistory = (tab: any) => {
    setActiveTab(tab);
    setRecentTabs((prev) => {
      const filtered = prev.filter((t) => t !== tab);
      return [tab, ...filtered].slice(0, 8);
    });
  };

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

  // Supabase Auth state listener — bridges Supabase sessions with existing app auth
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsSupabaseReady(true);
      return;
    }

    const unsubscribe = onAuthStateChange((user) => {
      setSupabaseAuthUser(user);
      setIsSupabaseReady(true);
      // If Supabase has an active user and no local session, create a compatible session
      if (user && !authSession) {
        // Build a minimal AuthSession from Supabase profile for backward compatibility
        const compatUser: any = {
          id: user.id,
          employeeId: user.id,
          email: user.email,
          fullName: user.fullName,
          fullNameEn: user.fullNameEn,
          role: user.role,
          passwordHash: '',
          twoFactorEnabled: false,
          failedLoginAttempts: 0,
          isLocked: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const compatEmp: any = {
          id: user.id,
          employeeCode: 'EMP-SUPABASE',
          fullName: user.fullName,
          fullNameEn: user.fullNameEn,
          email: user.email,
          phone: '',
          role: user.role,
          jobTitle: user.role,
          department: 'الإدارة العامة',
          branchId: user.branchId || '',
          status: 'ACTIVE',
          hireDate: new Date().toISOString(),
          basicSalary: 0,
          allowances: 0,
          currency: 'OMR',
          permissions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const compatSession: AuthSession = {
          user: compatUser,
          employee: compatEmp,
          token: 'supabase-session-token',
          loginMethod: 'PASSWORD',
          authenticatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
          isLocked: false,
          activeBranchId: user.branchId || undefined,
        };
        setAuthSession(compatSession);
        saveAuthSession(compatSession);
      }
    });

    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  const breadcrumbsList = React.useMemo(() => {
    switch (activeTab) {
      case "home":
        return [{ label: "مساحة العمل (Workspace)" }];
      case "pos":
        return [{ label: "المبيعات (Sales)", onClick: () => handleNavigateWithHistory("home") }, { label: "نقطة البيع (POS)", active: true }];
      case "accounting":
        return [{ label: "المالية (Finance)", onClick: () => handleNavigateWithHistory("home") }, { label: "الأستاذ العام والمحاسبة", active: true }];
      case "crm":
        return [{ label: "العملاء (CRM)", active: true }];
      case "inventory":
        return [{ label: "المستودع والمخازن", onClick: () => handleNavigateWithHistory("home") }, { label: "المخزون والأصناف", active: true }];
      case "purchases":
        return [{ label: "المستودع والمخازن", onClick: () => handleNavigateWithHistory("home") }, { label: "المشتريات والموردين", active: true }];
      case "employees":
        return [{ label: "الموارد البشرية (HR)", active: true }];
      case "spaces":
        return [{ label: "المساحات التأجيرية", active: true }];
      case "contracts":
        return [{ label: "عقود الإيجار والخدمات", active: true }];
      case "history":
        return [{ label: "سجل السندات والفواتير", active: true }];
      case "doc-wizard":
        return [{ label: "السندات والفواتير", onClick: () => handleNavigateWithHistory("history") }, { label: "منشئ المستندات", active: true }];
      case "editor":
        return [{ label: "السندات والفواتير", onClick: () => handleNavigateWithHistory("history") }, { label: "محرر السند المالي", active: true }];
      case "preview":
        return [{ label: "السندات والفواتير", onClick: () => handleNavigateWithHistory("history") }, { label: "معاينة وطباعة المستند", active: true }];
      case "settings":
        return [{ label: "إعدادات النظام والشركة", active: true }];
      case "help":
        return [{ label: "مركز المساعدة ودليل الاستخدام", active: true }];
      default:
        return [{ label: activeTab, active: true }];
    }
  }, [activeTab]);

  const handleLoginSuccess = (session: AuthSession) => {
    setAuthSession(session);
    setActiveEmployeeId(session.user.employeeId);
    saveActiveEmployeeId(session.user.employeeId);
    setUserName(session.user.fullName);
    if (session.employee.branchId) {
      setActiveBranchId(session.employee.branchId);
    }
  };

  const handleLogout = () => {
    if (authSession) {
      triggerAuditLog(
        "LOGOUT",
        "SECURITY",
        authSession.user.id,
        authSession.user.fullName,
        `تسجيل خروج المستخدم ${authSession.user.fullName} من النظام`,
        `User ${authSession.user.fullName} logged out`
      );
    }
    clearAuthSession();
    setAuthSession(null);
    setSupabaseAuthUser(null);
    // Sign out from Supabase if configured
    if (isSupabaseConfigured) {
      supabaseSignOut().catch(console.error);
    }
  };


  const handleLockScreen = () => {
    if (authSession) {
      const lockedSession = { ...authSession, isLocked: true };
      setAuthSession(lockedSession);
      saveAuthSession(lockedSession);
    }
  };

  const handleUnlockScreen = () => {
    if (authSession) {
      const unlockedSession = { ...authSession, isLocked: false };
      setAuthSession(unlockedSession);
      saveAuthSession(unlockedSession);
    }
  };

  const handleSessionUpdated = (updatedSession: AuthSession) => {
    setAuthSession(updatedSession);
    saveAuthSession(updatedSession);
  };

  const getActiveEmployee = () => {
    return employeesList.find((e) => e.id === activeEmployeeId) || employeesList[0] || {
      id: "emp-1",
      nameAr: "سعيد بن راشد الشحي",
      nameEn: "Said Rashid Al-Shehhi",
      role: "المدير التنفيذي العام"
    };
  };

  const getActiveBranch = () => {
    return branchesList.find((b) => b.id === activeBranchId) || branchesList[0] || {
      id: "branch-sohar",
      nameAr: "فرع صحار الرئيسي",
      nameEn: "Sohar Main Branch"
    };
  };

  const triggerAuditLog = (
    action: any,
    module: any,
    entityId: string,
    entityName: string,
    descAr: string,
    descEn: string,
    details?: string
  ) => {
    const emp = getActiveEmployee();
    const branch = getActiveBranch();
    const newLogEntry = {
      action,
      module,
      entityId,
      entityName,
      descriptionAr: descAr,
      descriptionEn: descEn,
      details: details || "",
      performedByName: emp.nameAr,
      performedByRole: emp.role,
      performedByEmployeeId: emp.id,
      branchName: branch.nameAr
    };
    const updated = logActivity(newLogEntry, auditLogsList);
    setAuditLogsList(updated);
  };

  const handleClearAuditLogs = () => {
    const empty = clearAuditLogs();
    setAuditLogsList(empty);
  };

  const [activeVoucher, setActiveVoucher] = useState<ReceiptVoucher>(() => {
    const list = loadVouchers();
    const settings = loadCompanySettings();
    const curr = settings.defaultCurrency || "OMR";
    const initial = list[0] || createNewVoucherState("RECEIPT");
    if (!initial.currency || initial.currency === "USD") {
      return {
        ...initial,
        currency: curr,
        amountInWords: initial.isCustomWords ? initial.amountInWords : numberToWords(initial.totalAmount || initial.amount, curr)
      };
    }
    return initial;
  });
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isIosModalOpen, setIsIosModalOpen] = useState<boolean>(false);
  const [isGlobalKioskModalOpen, setIsGlobalKioskModalOpen] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const handleSaveGlobalMovementLogSingle = (log: AttendanceMovementLog) => {
    const currentLogs = loadAttendanceMovementLogs();
    const updatedLogs = [log, ...currentLogs];
    saveAttendanceMovementLogs(updatedLogs);

    // If CHECK_IN or CHECK_OUT, update attendanceList
    if (log.movementCategory === "CHECK_IN" || log.movementCategory === "CHECK_OUT") {
      const todayStr = new Date().toISOString().split("T")[0];
      const existingRec = attendanceList.find(
        (r) => r.employeeId === log.employeeId && r.date === todayStr
      );
      if (existingRec) {
        const updatedRecs = attendanceList.map((r) => {
          if (r.id === existingRec.id) {
            return {
              ...r,
              checkIn: log.movementCategory === "CHECK_IN" ? (log.time || r.checkIn) : r.checkIn,
              checkOut: log.movementCategory === "CHECK_OUT" ? (log.time || r.checkOut) : r.checkOut,
              status: "PRESENT" as const
            };
          }
          return r;
        });
        handleSaveAttendance(updatedRecs);
      } else {
        const emp = employeesList.find((e) => e.id === log.employeeId);
        const newRec: AttendanceRecord = {
          id: `att-${Date.now()}`,
          employeeId: log.employeeId,
          employeeCode: log.employeeCode || emp?.employeeCode || "EMP-001",
          employeeName: log.employeeName,
          jobTitle: emp?.jobTitle,
          department: emp?.department,
          date: todayStr,
          checkIn: log.movementCategory === "CHECK_IN" ? log.time : "08:00",
          checkOut: log.movementCategory === "CHECK_OUT" ? log.time : undefined,
          status: "PRESENT",
          workingHours: 8,
          overtimeHours: 0,
          lateMinutes: 0,
          branchId: log.branchId,
          branchName: log.branchName,
          notes: `مسجل تلقائياً عبر الكشك اللوحي (${log.deviceName || "Kiosk"})`
        };
        handleSaveAttendance([newRec, ...attendanceList]);
      }
    }
  };

  const handleUpdateUserName = (newName: string) => {
    setUserName(newName);
    if (typeof window !== "undefined") {
      localStorage.setItem("rv_user_name", newName);
    }
  };

  // Handle URL shortcut params (for PWA shortcuts)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      const actionParam = params.get("action");

      if (tabParam === "history" || tabParam === "settings" || tabParam === "preview" || tabParam === "inventory" || tabParam === "purchases" || tabParam === "crm") {
        setActiveTab(tabParam as any);
      } else if (actionParam === "new") {
        handleCreateNewVoucher();
      }

      // Listen for PWA prompt
      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      };
      window.addEventListener("beforeinstallprompt", handleBeforeInstall);
      return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    }
  }, []);

  const handleTriggerInstall = async () => {
    if (isIosDevice()) {
      setIsIosModalOpen(true);
      return;
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setDeferredPrompt(null);
        }
      } catch (e) {
        console.warn("Install prompt trigger error:", e);
      }
    } else {
      setIsIosModalOpen(true);
    }
  };

  function createNewVoucherState(type: VoucherType = "RECEIPT"): ReceiptVoucher {
    const year = new Date().getFullYear();
    let maxSeq = 801;
    if (vouchersList && vouchersList.length > 0) {
      vouchersList.forEach((v) => {
        const match = v.voucherNumber?.match(/(?:RV|INV|QT|PV|PC)-\d+-(\d+)/i);
        if (match && match[1]) {
          const val = parseInt(match[1], 10);
          if (!isNaN(val) && val > maxSeq) {
            maxSeq = val;
          }
        }
      });
    }
    const nextSeq = (maxSeq + 1).toString().padStart(4, "0");
    const prefix =
      type === "RECEIPT"
        ? "RV"
        : type === "TAX_INVOICE"
        ? "INV"
        : type === "QUOTATION"
        ? "QT"
        : type === "PAYMENT"
        ? "PV"
        : "PC";

    const voucherNum = `${prefix}-${year}-${nextSeq}`;
    const randRef = Math.floor(4428 + Math.random() * 100);
    const initialSubtotal = 250.000;
    const taxRate = type === "TAX_INVOICE" || type === "QUOTATION" ? 5 : 0;
    const taxAmount = (initialSubtotal * taxRate) / 100;
    const totalAmount = initialSubtotal + taxAmount;
    const curr = companySettings.defaultCurrency || "OMR";

    const descriptions: Record<VoucherType, string> = {
      RECEIPT: "دفعة عن تركيب الكاميرات وشاشات المراقبة والشاشات التفاعلية الذكية في مركز الدليل الشامل",
      TAX_INVOICE: "توريد وتركيب أجهزة تقنية وحلول برمجية ذكية مع الضريبة المضافة (5%)",
      QUOTATION: "عرض سعر لتوريد وتجهيز أنظمة مراقبة وشبكات ذكية متكاملة",
      PAYMENT: "سداد دفعة مستحقة لمؤسسة التوريدات عن قطع غيار وأجهزة شبكات",
      PETTY_CASH: "مصروفات نثرية وضيافة واحتياجات مكتبية دورية"
    };

    const notesMap: Record<VoucherType, string> = {
      RECEIPT: "تم استلام المبلغ لحساب شركة ديشال لإدارة الأعمال والحلول التقنية.",
      TAX_INVOICE: "فاتورة ضريبية رسمية خاضعة لضريبة القيمة المضافة (5% VAT) ومعتمدة إلكترونياً.",
      QUOTATION: "عرض سعر رسمي موجه للعميل. يسري هذا العرض لمدة 15 يوماً من تاريخ الإصدار.",
      PAYMENT: "سند صرف وتسجيل دفعة مالية للمورد / المصروفات التشغيلية.",
      PETTY_CASH: "سند صرف عهدة نقدية للمصروفات الدورية المعتمدة."
    };

    const categoriesMap: Record<VoucherType, string> = {
      RECEIPT: "خدمات تقنية وإيرادات",
      TAX_INVOICE: "مبيعات وخدمات ضريبية",
      QUOTATION: "عروض أسعار وصفقات",
      PAYMENT: "مصروفات تشغيلية وموردين",
      PETTY_CASH: "مصروفات نثرية وإدارية"
    };

    const clientName =
      type === "PAYMENT"
        ? "مؤسسة التوريدات والخدمات العامة"
        : type === "QUOTATION"
        ? "شركة العميل الموقر"
        : "شركة الدليل الشامل";

    return {
      id: "doc-" + Date.now(),
      type: type,
      voucherNumber: voucherNum,
      referenceNo: `${prefix}-REF-${randRef}`,
      date: new Date().toISOString().split("T")[0],
      dueDate: type === "QUOTATION" || type === "TAX_INVOICE" ? new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0] : undefined,
      receivedFrom: clientName,
      payerEmail: "info@deshalbm.com",
      payerPhone: "+968 77627500",
      payerAddress: "Maden Building - Sohar- North ALBatinah - Sultanate of Oman",
      payerTaxId: "OM-TAX-7762",
      amount: totalAmount,
      currency: curr,
      amountInWords: numberToWords(totalAmount, curr),
      isCustomWords: false,
      paymentMethod: type === "QUOTATION" ? "BANK_TRANSFER" : "BANK_TRANSFER",
      bankName: "بنك ظفار (Bank Dhofar)",
      transactionRef: `TXN-${randRef}`,
      category: categoriesMap[type],
      lineItems: [
        {
          id: "li-1",
          description: descriptions[type],
          quantity: 1,
          unitPrice: initialSubtotal,
          amount: initialSubtotal
        }
      ],
      subtotal: initialSubtotal,
      taxRate: taxRate,
      taxAmount: taxAmount,
      discountAmount: 0,
      totalAmount: totalAmount,
      notes: notesMap[type],
      terms: companySettings.termsAndConditions || "يعتبر هذا المستند إشعاراً رسمياً معتمداً.",
      customFields: [
        { id: "cf-1", label: "الموقع", value: "مركز الدليل الشامل - صحار" }
      ],
      status: type === "QUOTATION" ? "DRAFT" : "PAID",
      preparedBy: "قسم الحسابات",
      approvedBy: companySettings.authorizedSignatoryName || "إدارة ديشال للأعمال",
      receivedBy: clientName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  const handleCreateNewVoucher = (type: VoucherType = "RECEIPT") => {
    const newV = createNewVoucherState(type);
    setActiveVoucher(newV);
    setActiveTab("editor");
  };

  const handleSelectAction = (actionType: VoucherType) => {
    handleCreateNewVoucher(actionType);
  };

  const handleSaveActiveVoucher = () => {
    const existingIndex = vouchersList.findIndex((v) => v.id === activeVoucher.id);
    let updatedList: ReceiptVoucher[];
    const isNew = existingIndex < 0;

    if (existingIndex >= 0) {
      updatedList = vouchersList.map((v) => (v.id === activeVoucher.id ? activeVoucher : v));
    } else {
      updatedList = [activeVoucher, ...vouchersList];
    }

    setVouchersList(updatedList);
    saveVouchers(updatedList);

    // Trigger Audit Log
    triggerAuditLog(
      isNew ? "CREATE" : "UPDATE",
      "VOUCHERS",
      activeVoucher.id,
      activeVoucher.voucherNumber,
      `${isNew ? "إصدار" : "تعديل"} مستند ${activeVoucher.voucherNumber} للعميل ${activeVoucher.receivedFrom} بمبلغ ${activeVoucher.totalAmount?.toLocaleString()} ${activeVoucher.currency}`,
      `${isNew ? "Issued" : "Updated"} document ${activeVoucher.voucherNumber} for ${activeVoucher.receivedFrom} (${activeVoucher.totalAmount?.toLocaleString()} ${activeVoucher.currency})`,
      `${activeVoucher.notes || ""} - طريقة الدفع: ${activeVoucher.paymentMethod}`
    );

    // Auto-sync customer to CRM
    const updatedCusts = syncCustomerFromVoucher(activeVoucher, customersList);
    setCustomersList(updatedCusts);
    saveCustomers(updatedCusts);

    setActiveTab("preview");
  };

  const handleSaveCustomer = (customer: Customer) => {
    const exists = customersList.some((c) => c.id === customer.id);
    const updated = exists
      ? customersList.map((c) => (c.id === customer.id ? customer : c))
      : [customer, ...customersList];
    setCustomersList(updated);

    const cId = supabaseAuthUser?.companyId || DEFAULT_COMPANY_ID;
    if (isSupabaseConfigured) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        saveCustomers(updated);
        enqueueOfflineMutation({ entityType: 'CUSTOMER', action: 'UPSERT', payload: customer, companyId: cId });
      } else {
        customerSvc.upsertCustomer(customer, cId).then((res) => {
          if (res.success && res.data) {
            setCustomersList((prev) => prev.map((c) => (c.id === res.data!.id ? res.data! : c)));
          }
        }).catch(console.error);
      }
    } else {
      saveCustomers(updated);
    }

    triggerAuditLog(
      exists ? "UPDATE" : "CREATE",
      "CRM",
      customer.id,
      customer.name,
      `${exists ? "تحديث ملف" : "تسجيل عميل جديد"} ${customer.name}`,
      `${exists ? "Updated customer" : "Created new customer"} ${customer.name}`,
      `الهاتف: ${customer.phone || "-"} - البريد: ${customer.email || "-"}`
    );
  };

  const handleDeleteCustomer = (customerId: string) => {
    const cust = customersList.find((c) => c.id === customerId);
    const updated = customersList.filter((c) => c.id !== customerId);
    setCustomersList(updated);
    if (isSupabaseConfigured) {
      customerSvc.deleteCustomer(customerId).catch(console.error);
    }
    saveCustomers(updated);

    triggerAuditLog(
      "DELETE",
      "CRM",
      customerId,
      cust?.name || customerId,
      `حذف العميل ${cust?.name || customerId} من دليل العملاء`,
      `Deleted customer ${cust?.name || customerId} from CRM directory`
    );
  };

  const handleCreateVoucherForCustomer = (customer: Customer) => {
    const newV = createNewVoucherState();
    const customizedVoucher: ReceiptVoucher = {
      ...newV,
      receivedFrom: customer.name,
      payerPhone: customer.phone || newV.payerPhone,
      payerEmail: customer.email || newV.payerEmail,
      payerAddress: customer.address || newV.payerAddress,
      payerTaxId: customer.taxId || newV.payerTaxId,
      notes: `سند قبض خاص بالعميل: ${customer.name}`,
      updatedAt: new Date().toISOString()
    };
    setActiveVoucher(customizedVoucher);
    setActiveTab("editor");
  };

  const handleSyncCustomersWithVouchers = () => {
    let currentList = [...customersList];
    vouchersList.forEach((v) => {
      currentList = syncCustomerFromVoucher(v, currentList);
    });
    setCustomersList(currentList);
    saveCustomers(currentList);
  };

  const handleDeleteVoucher = (id: string) => {
    const target = vouchersList.find((v) => v.id === id);
    const updated = vouchersList.filter((v) => v.id !== id);
    setVouchersList(updated);
    if (isSupabaseConfigured) {
      purchasesSvc.deleteVoucher(id).catch(console.error);
    }
    saveVouchers(updated);
    if (activeVoucher.id === id && updated.length > 0) {
      setActiveVoucher(updated[0]);
    }

    triggerAuditLog(
      "DELETE",
      "VOUCHERS",
      id,
      target?.voucherNumber || id,
      `حذف المستند ${target?.voucherNumber || id} نهائياً من السجلات`,
      `Permanently deleted document ${target?.voucherNumber || id} from history`
    );
  };

  const handleDeleteMultipleVouchers = (ids: string[]) => {
    const updated = vouchersList.filter((v) => !ids.includes(v.id));
    setVouchersList(updated);
    if (isSupabaseConfigured) {
      Promise.all(ids.map((id) => purchasesSvc.deleteVoucher(id))).catch(console.error);
    }
    saveVouchers(updated);
    if (ids.includes(activeVoucher.id) && updated.length > 0) {
      setActiveVoucher(updated[0]);
    }

    triggerAuditLog(
      "DELETE",
      "VOUCHERS",
      "batch-delete",
      `حذف جماعي (${ids.length})`,
      `حذف جماعي لعدد (${ids.length}) سندات وفواتير من السجلات`,
      `Batch deleted (${ids.length}) vouchers and records from history`
    );
  };

  const handleDuplicateVoucher = (v: ReceiptVoucher) => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    const duplicated: ReceiptVoucher = {
      ...v,
      id: "rv-" + Date.now(),
      voucherNumber: `${v.voucherNumber}-COPY`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = [duplicated, ...vouchersList];
    setVouchersList(updated);
    saveVouchers(updated);
    setActiveVoucher(duplicated);
    setActiveTab("editor");

    triggerAuditLog(
      "CREATE",
      "VOUCHERS",
      duplicated.id,
      duplicated.voucherNumber,
      `استنساخ مستند جديد ${duplicated.voucherNumber} من النسخة الأصلية ${v.voucherNumber}`,
      `Duplicated new document ${duplicated.voucherNumber} from original ${v.voucherNumber}`
    );
  };

  const handlePrint = () => {
    triggerAuditLog(
      "PRINT",
      "VOUCHERS",
      activeVoucher.id,
      activeVoucher.voucherNumber,
      `طباعة المستند ${activeVoucher.voucherNumber} على الطابعة المعتمدة`,
      `Printed document ${activeVoucher.voucherNumber} on default printer`
    );

    if (activeTab !== "preview") {
      setActiveTab("preview");
      setTimeout(() => window.print(), 350);
    } else {
      window.print();
    }
  };

  const handleExportPdf = async () => {
    triggerAuditLog(
      "EXPORT",
      "VOUCHERS",
      activeVoucher.id,
      activeVoucher.voucherNumber,
      `تصدير المستند ${activeVoucher.voucherNumber} إلى ملف PDF`,
      `Exported document ${activeVoucher.voucherNumber} to PDF`
    );

    if (activeTab !== "preview") {
      setActiveTab("preview");
      await new Promise((res) => setTimeout(res, 350));
    }
    const success = await exportToPdf("receipt-voucher-print-area", activeVoucher.voucherNumber, designTheme.pageSize);
    if (!success) {
      console.warn("PDF export fallback: opening browser print dialog");
      window.print();
    }
  };

  const handleApplyAiData = (parsedData: Partial<ReceiptVoucher>) => {
    const lineItems = parsedData.lineItems && parsedData.lineItems.length > 0
      ? parsedData.lineItems.map((item, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          description: item.description || "Service",
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 100,
          amount: (item.quantity || 1) * (item.unitPrice || 100)
        }))
      : activeVoucher.lineItems;

    const subtotal = lineItems.reduce((acc, i) => acc + i.amount, 0);
    const taxRate = parsedData.taxRate !== undefined ? parsedData.taxRate : activeVoucher.taxRate;
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;
    const currency = parsedData.currency || activeVoucher.currency;

    const merged: ReceiptVoucher = {
      ...activeVoucher,
      type: (parsedData.type as VoucherType) || activeVoucher.type,
      receivedFrom: parsedData.receivedFrom || activeVoucher.receivedFrom,
      paidTo: parsedData.paidTo || activeVoucher.paidTo,
      currency: currency,
      paymentMethod: parsedData.paymentMethod || activeVoucher.paymentMethod,
      checkNumber: parsedData.checkNumber || activeVoucher.checkNumber,
      bankName: parsedData.bankName || activeVoucher.bankName,
      transactionRef: parsedData.transactionRef || activeVoucher.transactionRef,
      category: parsedData.category || activeVoucher.category,
      notes: parsedData.notes || activeVoucher.notes,
      lineItems: lineItems,
      subtotal: subtotal,
      taxRate: taxRate,
      taxAmount: taxAmount,
      totalAmount: totalAmount,
      amount: totalAmount,
      amountInWords: numberToWords(totalAmount, currency),
      isCustomWords: false,
      updatedAt: new Date().toISOString()
    };

    setActiveVoucher(merged);
    setActiveTab("editor");
  };

  const handleSaveCompanySettings = (newSettings: CompanySettings) => {
    setCompanySettings(newSettings);
    saveCompanySettings(newSettings);
    triggerAuditLog(
      "SETTINGS_UPDATE",
      "SETTINGS",
      "company-settings",
      "إعدادات الشركة والملف القانوني",
      "تحديث الملف التعريفي للشركة والحسابات البنكية المعتمدة",
      "Updated corporate profile, business details, and official bank accounts"
    );
    if (newSettings.defaultCurrency && activeVoucher.currency !== newSettings.defaultCurrency) {
      const updatedCurr = newSettings.defaultCurrency;
      setActiveVoucher((prev) => ({
        ...prev,
        currency: updatedCurr,
        amountInWords: prev.isCustomWords
          ? prev.amountInWords
          : numberToWords(prev.totalAmount || prev.amount, updatedCurr)
      }));
    }
  };

  const handleSaveDesignTheme = (newTheme: DesignTheme) => {
    setDesignTheme(newTheme);
    saveDesignTheme(newTheme);
    triggerAuditLog(
      "SETTINGS_UPDATE",
      "SETTINGS",
      "design-theme",
      "سمات وتصميم السندات",
      `تحديث ألوان وقالب التصميم (${newTheme.primaryColor} - ${newTheme.templateId})`,
      `Updated template theme styling (${newTheme.primaryColor} - ${newTheme.templateId})`
    );
  };

  const handleSaveInventory = (items: InventoryItem[]) => {
    setInventoryList(items);
    const cId = supabaseAuthUser?.companyId || DEFAULT_COMPANY_ID;
    if (isSupabaseConfigured) {
      saveInventory(items);
      Promise.all(items.map((item) => inventorySvc.upsertInventoryItem(item, cId))).catch(console.error);
    } else {
      saveInventory(items);
    }
    triggerAuditLog(
      "UPDATE",
      "INVENTORY",
      "inventory-items",
      "سجل المخزون",
      `تحديث كميات وقيم مستودع الأصناف (${items.length} صنف)`,
      `Updated inventory items and stock levels (${items.length} items)`
    );
  };

  const handleSavePurchases = (purchases: PurchaseInvoice[]) => {
    setPurchasesList(purchases);
    const cId = supabaseAuthUser?.companyId || DEFAULT_COMPANY_ID;
    if (isSupabaseConfigured) {
      savePurchases(purchases);
      Promise.all(purchases.map((p) => purchasesSvc.upsertPurchaseInvoice(p, cId))).catch(console.error);
    } else {
      savePurchases(purchases);
    }
    triggerAuditLog(
      "UPDATE",
      "PURCHASES",
      "purchase-invoices",
      "فواتير المشتريات",
      `تحديث سجل فواتير المشتريات وأوامر الشراء (${purchases.length} فاتورة)`,
      `Updated purchase invoices records (${purchases.length} invoices)`
    );
  };

  const handleSaveSuppliers = (suppliers: Supplier[]) => {
    setSuppliersList(suppliers);
    const cId = supabaseAuthUser?.companyId || DEFAULT_COMPANY_ID;
    if (isSupabaseConfigured) {
      saveSuppliers(suppliers);
      Promise.all(suppliers.map((s) => supplierSvc.upsertSupplier(s, cId))).catch(console.error);
    } else {
      saveSuppliers(suppliers);
    }
  };

  const handleSaveMovements = (movements: StockMovement[]) => {
    setStockMovementsList(movements);
    saveStockMovements(movements);
  };

  const handleCreatePaymentVoucherFromPurchase = (purchase: PurchaseInvoice) => {
    const newV = createNewVoucherState("PAYMENT");
    const invoiceLabel = purchase.purchaseNumber || purchase.supplierInvoiceNo || "";
    const voucher: ReceiptVoucher = {
      ...newV,
      receivedFrom: purchase.supplierName,
      amount: purchase.totalAmount,
      totalAmount: purchase.totalAmount,
      subtotal: purchase.subtotal,
      taxAmount: purchase.taxAmount,
      taxRate: purchase.taxRate,
      currency: purchase.currency || companySettings.defaultCurrency || "OMR",
      amountInWords: numberToWords(purchase.totalAmount, purchase.currency || companySettings.defaultCurrency || "OMR"),
      notes: `سداد فاتورة مشتريات وتوريد رقم #${invoiceLabel} - المورد: ${purchase.supplierName}`,
      category: "مشتريات وتوريدات",
      lineItems: purchase.items.map((pi, idx) => ({
        id: `li-purch-${idx}`,
        description: `${pi.name} (${pi.quantity} ${pi.unit || "قطعة"})`,
        quantity: pi.quantity,
        unitPrice: pi.unitCost,
        amount: pi.amount
      })),
      updatedAt: new Date().toISOString()
    };
    setActiveVoucher(voucher);
    setActiveTab("editor");
  };

  const handleSaveBranches = (branches: Branch[]) => {
    setBranchesList(branches);
    const cId = supabaseAuthUser?.companyId || DEFAULT_COMPANY_ID;
    if (isSupabaseConfigured) {
      saveBranches(branches);
      Promise.all(branches.map((b) => companySvc.upsertBranch(b, cId))).catch(console.error);
    } else {
      saveBranches(branches);
    }
    triggerAuditLog(
      "UPDATE",
      "BRANCHES",
      "branches-list",
      "فروع المؤسسة",
      `تحديث بيانات وتوزيع الفروع (${branches.length} فروع)`,
      `Updated company branches and distribution (${branches.length} branches)`
    );
  };

  const handleSaveTransfers = (transfers: StockTransfer[]) => {
    setStockTransfersList(transfers);
    saveStockTransfers(transfers);
    triggerAuditLog(
      "TRANSFER",
      "INVENTORY",
      "transfers-list",
      "مناقلات المخزون",
      `تسجيل مناقلة مخزنية جديدة بين الفروع`,
      `Recorded inter-branch stock dispatch & transfer`
    );
  };

  const handleSaveEmployees = (employees: Employee[]) => {
    setEmployeesList(employees);
    const cId = supabaseAuthUser?.companyId || DEFAULT_COMPANY_ID;
    if (isSupabaseConfigured) {
      saveEmployees(employees);
      Promise.all(employees.map((emp) => employeeSvc.upsertEmployee(emp, cId))).catch(console.error);
    } else {
      saveEmployees(employees);
    }
    triggerAuditLog(
      "UPDATE",
      "SETTINGS",
      "employees-list",
      "سجل الموظفين والصلاحيات",
      `تحديث قائمة الموظفين وتعيين الصلاحيات (${employees.length} موظف)`,
      `Updated employees directory and role permissions (${employees.length} staff)`
    );
  };

  const handleSaveAttendance = (records: AttendanceRecord[]) => {
    setAttendanceList(records);
    const cId = supabaseAuthUser?.companyId || DEFAULT_COMPANY_ID;
    if (isSupabaseConfigured) {
      saveAttendanceRecords(records);
      Promise.all(records.map((r) => hrSvc.upsertAttendanceRecord(r, cId))).catch(console.error);
    } else {
      saveAttendanceRecords(records);
    }
    triggerAuditLog(
      "UPDATE",
      "SETTINGS",
      "attendance-records",
      "سجلات الحضور والانصراف",
      `تحديث سجلات الحضور والانصراف (${records.length} حركة)`,
      `Updated attendance & time-tracking logs (${records.length} records)`
    );
  };

  const handleSavePayrollSlips = (slips: PayrollSlip[]) => {
    setPayrollSlipsList(slips);
    const cId = supabaseAuthUser?.companyId || DEFAULT_COMPANY_ID;
    if (isSupabaseConfigured) {
      savePayrollSlips(slips);
      Promise.all(slips.map((s) => hrSvc.upsertPayrollSlip(s, cId))).catch(console.error);
    } else {
      savePayrollSlips(slips);
    }
    triggerAuditLog(
      "UPDATE",
      "SETTINGS",
      "payroll-slips",
      "مسيرات الرواتب وحماية الأجور",
      `تحديث مسيرات الرواتب الشهرية (${slips.length} قسيمة)`,
      `Updated monthly payroll batches and slips (${slips.length} slips)`
    );
  };

  const handleSaveLeaveRequests = (requests: LeaveRequest[]) => {
    setLeaveRequestsList(requests);
    const cId = supabaseAuthUser?.companyId || DEFAULT_COMPANY_ID;
    if (isSupabaseConfigured) {
      saveLeaveRequests(requests);
      Promise.all(requests.map((r) => hrSvc.upsertLeaveRequest(r, cId))).catch(console.error);
    } else {
      saveLeaveRequests(requests);
    }
    triggerAuditLog(
      "UPDATE",
      "SETTINGS",
      "leave-requests",
      "طلبات الإجازات والغياب",
      `تحديث سجلات وطلبات الإجازات (${requests.length} طلب)`,
      `Updated leave requests and absence records (${requests.length} requests)`
    );
  };

  const handleSelectActiveEmployee = (id: string) => {
    setActiveEmployeeId(id);
    saveActiveEmployeeId(id);
  };

  const handleSaveVouchersList = (list: ReceiptVoucher[]) => {
    setVouchersList(list);
    saveVouchers(list);
  };

  const handleSaveCustomersList = (list: Customer[]) => {
    setCustomersList(list);
    const cId = supabaseAuthUser?.companyId || DEFAULT_COMPANY_ID;
    if (isSupabaseConfigured) {
      saveCustomers(list);
      Promise.all(list.map((c) => customerSvc.upsertCustomer(c, cId))).catch(console.error);
    } else {
      saveCustomers(list);
    }
  };

  const handleSaveSchedules = (schedules: RecurringSchedule[]) => {
    setSchedulesList(schedules);
    saveRecurringSchedules(schedules);
  };

  const handleSaveRentalSpaces = (spaces: RentalSpace[]) => {
    setRentalSpacesList(spaces);
    const cId = supabaseAuthUser?.companyId || DEFAULT_COMPANY_ID;
    if (isSupabaseConfigured) {
      saveRentalSpaces(spaces);
      Promise.all(spaces.map((s) => spacesSvc.upsertRentalSpace(s, cId))).catch(console.error);
    } else {
      saveRentalSpaces(spaces);
    }
    triggerAuditLog(
      "UPDATE",
      "SETTINGS",
      "spaces-list",
      "القاعات ومساحات العمل",
      `تحديث دليل قاعات التدريب ومساحات العمل (${spaces.length} مساحة)`,
      `Updated smart rental spaces directory (${spaces.length} spaces)`
    );
  };

  const handleSaveSpaceBookings = (bookings: SpaceBooking[]) => {
    setSpaceBookingsList(bookings);
    const cId = supabaseAuthUser?.companyId || DEFAULT_COMPANY_ID;
    if (isSupabaseConfigured) {
      saveSpaceBookings(bookings);
      Promise.all(bookings.map((b) => spacesSvc.upsertSpaceBooking(b, cId))).catch(console.error);
    } else {
      saveSpaceBookings(bookings);
    }
    triggerAuditLog(
      "UPDATE",
      "SETTINGS",
      "bookings-list",
      "حجوزات القاعات",
      `تحديث قائمة حجوزات القاعات والمساحات (${bookings.length} حجز)`,
      `Updated space reservations (${bookings.length} bookings)`
    );
  };

  const handleConfirmSpaceBooking = (newBooking: SpaceBooking, autoGenerateVoucher: boolean = true) => {
    let finalBooking = { ...newBooking };

    // Auto-generate official Receipt Voucher & invoice if requested
    if (autoGenerateVoucher) {
      const lineItems = [
        {
          id: `item-${Date.now()}`,
          description: `${finalBooking.spaceName} - ${finalBooking.purpose} (${finalBooking.rentalType === "HOURLY" ? `${finalBooking.duration} ساعة` : finalBooking.rentalType === "DAILY" ? `${finalBooking.duration} يوم` : `${finalBooking.duration} شهر`})`,
          quantity: finalBooking.duration,
          unitPrice: finalBooking.unitPrice,
          amount: finalBooking.subtotal
        }
      ];

      const subtotal = finalBooking.subtotal;
      const taxAmount = finalBooking.taxAmount;
      const totalAmount = finalBooking.totalAmount;
      const currency = finalBooking.currency || companySettings.defaultCurrency || "OMR";

      const newVoucher: ReceiptVoucher = {
        id: `rv-${Date.now()}`,
        voucherNumber: `RV-SP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        referenceNo: finalBooking.bookingNumber,
        date: finalBooking.startDate || new Date().toISOString().split("T")[0],
        type: "RECEIPT",
        receivedFrom: finalBooking.customerName,
        payerPhone: finalBooking.customerPhone,
        payerEmail: finalBooking.customerEmail,
        amount: totalAmount,
        amountInWords: numberToWords(totalAmount, currency),
        currency: currency,
        paymentMethod: finalBooking.paymentMethod || "CREDIT_CARD",
        category: "إيرادات حجز وتأجير قاعات ومساحات عمل",
        notes: `سند قبض مالي تم إنشاؤه تلقائياً مقابل حجز ${finalBooking.spaceName} - رقم الحجز: ${finalBooking.bookingNumber}`,
        terms: "شكراً لتعاملكم معنا. يُرجى الالتزام بمواعيد الحجز وسياسة استخدام القاعات ومساحات العمل.",
        customFields: [],
        lineItems: lineItems,
        subtotal: subtotal,
        taxRate: 5,
        taxAmount: taxAmount,
        discountAmount: 0,
        totalAmount: totalAmount,
        isCustomWords: false,
        status: "PAID",
        branchId: finalBooking.branchId || activeBranchId,
        branchName: finalBooking.branchName,
        preparedBy: userName || "النظام الآلي",
        approvedBy: "الإدارة المالية",
        receivedBy: finalBooking.customerName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedVouchers = [newVoucher, ...vouchersList];
      setVouchersList(updatedVouchers);
      saveVouchers(updatedVouchers);

      finalBooking.linkedVoucherId = newVoucher.id;
      finalBooking.linkedVoucherNumber = newVoucher.voucherNumber;
      finalBooking.paymentStatus = "PAID";

      setActiveVoucher(newVoucher);
      setActiveTab("preview");

      triggerAuditLog(
        "CREATE",
        "VOUCHERS",
        newVoucher.id,
        newVoucher.voucherNumber,
        `إنشاء سند قبض مالي تلقائي (${newVoucher.voucherNumber}) لحجز القاعة ${finalBooking.bookingNumber}`,
        `Auto-generated receipt voucher (${newVoucher.voucherNumber}) for space booking ${finalBooking.bookingNumber}`
      );
    }

    const updatedBookings = [finalBooking, ...spaceBookingsList];
    setSpaceBookingsList(updatedBookings);
    saveSpaceBookings(updatedBookings);

    // Sync / create customer if not already present
    if (finalBooking.customerName) {
      const existingCust = customersList.find((c) => 
        c.name.trim().toLowerCase() === finalBooking.customerName.trim().toLowerCase() ||
        (c.phone && finalBooking.customerPhone && c.phone.trim() === finalBooking.customerPhone.trim())
      );
      if (!existingCust) {
        const newCust: Customer = {
          id: generateUuid(),
          name: finalBooking.customerName,
          phone: finalBooking.customerPhone,
          email: finalBooking.customerEmail || "",
          type: finalBooking.customerCompany ? "CORPORATE" : "INDIVIDUAL",
          status: "ACTIVE",
          notes: finalBooking.customerCompany ? `الشركة / المؤسسة: ${finalBooking.customerCompany}` : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const updatedCusts = [newCust, ...customersList];
        setCustomersList(updatedCusts);
        saveCustomers(updatedCusts);
      }
    }

    triggerAuditLog(
      "CREATE",
      "VOUCHERS",
      finalBooking.id,
      finalBooking.bookingNumber,
      `تأكيد حجز جديد (${finalBooking.bookingNumber}) في ${finalBooking.spaceName} للمستأجر ${finalBooking.customerName}`,
      `Confirmed new booking (${finalBooking.bookingNumber}) at ${finalBooking.spaceName} for ${finalBooking.customerName}`
    );
  };

  const handleIssueVoucherFromBooking = (booking: SpaceBooking) => {
    const lineItems = [
      {
        id: `item-${Date.now()}`,
        description: `${booking.spaceName} - ${booking.purpose} (${booking.rentalType === "HOURLY" ? `${booking.duration} ساعة` : booking.rentalType === "DAILY" ? `${booking.duration} يوم` : `${booking.duration} شهر`})`,
        quantity: booking.duration,
        unitPrice: booking.unitPrice,
        amount: booking.subtotal
      }
    ];

    const subtotal = booking.subtotal;
    const taxAmount = booking.taxAmount;
    const totalAmount = booking.totalAmount;
    const currency = booking.currency || companySettings.defaultCurrency || "OMR";

    const newVoucher: ReceiptVoucher = {
      id: `rv-${Date.now()}`,
      voucherNumber: `RV-SP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      referenceNo: booking.bookingNumber,
      date: booking.startDate || new Date().toISOString().split("T")[0],
      type: "RECEIPT",
      receivedFrom: booking.customerName,
      payerPhone: booking.customerPhone,
      payerEmail: booking.customerEmail,
      amount: totalAmount,
      amountInWords: numberToWords(totalAmount, currency),
      currency: currency,
      paymentMethod: booking.paymentMethod || "CREDIT_CARD",
      category: "إيرادات حجز وتأجير قاعات ومساحات عمل",
      notes: `سند قبض مقابل حجز ${booking.spaceName} - رقم الحجز: ${booking.bookingNumber}`,
      terms: "شكراً لتعاملكم معنا. يُرجى الالتزام بمواعيد الحجز وسياسة استخدام القاعات.",
      customFields: [],
      lineItems: lineItems,
      subtotal: subtotal,
      taxRate: 5,
      taxAmount: taxAmount,
      discountAmount: 0,
      totalAmount: totalAmount,
      isCustomWords: false,
      status: "PAID",
      branchId: booking.branchId || activeBranchId,
      branchName: booking.branchName,
      preparedBy: userName || "النظام",
      approvedBy: "الإدارة المالية",
      receivedBy: booking.customerName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedVouchers = [newVoucher, ...vouchersList];
    setVouchersList(updatedVouchers);
    saveVouchers(updatedVouchers);

    // Link voucher to booking
    const updatedBookings = spaceBookingsList.map((b) =>
      b.id === booking.id ? { ...b, linkedVoucherId: newVoucher.id, linkedVoucherNumber: newVoucher.voucherNumber, paymentStatus: "PAID" as const } : b
    );
    setSpaceBookingsList(updatedBookings);
    saveSpaceBookings(updatedBookings);

    setActiveVoucher(newVoucher);
    setActiveTab("preview");

    triggerAuditLog(
      "CREATE",
      "VOUCHERS",
      newVoucher.id,
      newVoucher.voucherNumber,
      `إصدار سند قبض مالي رسمي ${newVoucher.voucherNumber} لحجز القاعة ${booking.bookingNumber}`,
      `Issued official receipt voucher ${newVoucher.voucherNumber} for space booking ${booking.bookingNumber}`
    );
  };

  const handleOpenBookingModalForSpace = (sp?: RentalSpace | null) => {
    setSelectedSpaceForBooking(sp || null);
    setIsBookingModalOpen(true);
  };

  // Consulting & Administrative Services Handlers
  const handleSaveConsultingService = (service: ConsultingService) => {
    const exists = consultingServicesList.some((s) => s.id === service.id);
    const updated = exists
      ? consultingServicesList.map((s) => (s.id === service.id ? service : s))
      : [service, ...consultingServicesList];
    setConsultingServicesList(updated);
    saveConsultingServices(updated);
    triggerAuditLog(
      "UPDATE",
      "SETTINGS",
      service.id,
      service.name,
      `حفظ وتحديث بيانات الخدمة الاستشارية (${service.name})`,
      `Saved consulting & business service (${service.nameEn || service.name})`
    );
  };

  const handleDeleteConsultingService = (serviceId: string) => {
    const target = consultingServicesList.find((s) => s.id === serviceId);
    const updated = consultingServicesList.filter((s) => s.id !== serviceId);
    setConsultingServicesList(updated);
    if (isSupabaseConfigured) {
      spacesSvc.deleteConsultingService(serviceId).catch(console.error);
    }
    saveConsultingServices(updated);
    triggerAuditLog(
      "DELETE",
      "SETTINGS",
      serviceId,
      target?.name || serviceId,
      `حذف الخدمة الاستشارية (${target?.name || serviceId}) نهائياً`,
      `Deleted consulting service (${target?.nameEn || serviceId})`
    );
  };

  const handleSaveMembershipPackage = (pkg: MembershipPackage) => {
    const exists = membershipPackagesList.some((p) => p.id === pkg.id);
    const updated = exists
      ? membershipPackagesList.map((p) => (p.id === pkg.id ? pkg : p))
      : [pkg, ...membershipPackagesList];
    setMembershipPackagesList(updated);
    saveMembershipPackages(updated);
    triggerAuditLog(
      "UPDATE",
      "SETTINGS",
      pkg.id,
      pkg.name,
      `تحديث باقة اشتراك المستأجرين والحصص المجانية (${pkg.name})`,
      `Saved membership tier package (${pkg.nameEn || pkg.name})`
    );
  };

  const handleDeleteMembershipPackage = (pkgId: string) => {
    const updated = membershipPackagesList.filter((p) => p.id !== pkgId);
    setMembershipPackagesList(updated);
    if (isSupabaseConfigured) {
      spacesSvc.deleteMembershipPackage(pkgId).catch(console.error);
    }
    saveMembershipPackages(updated);
  };

  const handleSaveTenantSubscription = (sub: TenantSubscription) => {
    const exists = tenantSubscriptionsList.some((s) => s.id === sub.id);
    const updated = exists
      ? tenantSubscriptionsList.map((s) => (s.id === sub.id ? sub : s))
      : [sub, ...tenantSubscriptionsList];
    setTenantSubscriptionsList(updated);
    saveTenantSubscriptions(updated);
    triggerAuditLog(
      "UPDATE",
      "SETTINGS",
      sub.id,
      sub.customerName,
      `تحديث اشتراك المستأجر وحصص الساعات المجانية (${sub.customerName})`,
      `Updated tenant subscription and quota usage (${sub.customerName})`
    );
  };

  const handleDeleteTenantSubscription = (subId: string) => {
    const updated = tenantSubscriptionsList.filter((s) => s.id !== subId);
    setTenantSubscriptionsList(updated);
    if (isSupabaseConfigured) {
      spacesSvc.deleteTenantSubscription(subId).catch(console.error);
    }
    saveTenantSubscriptions(updated);
  };

  const handleConfirmServiceBooking = (newBooking: ServiceBooking, autoGenerateVoucher: boolean = true) => {
    let finalBooking = { ...newBooking };

    // 1. If tenant subscription quota was utilized, deduct it from their quota balance
    if (finalBooking.tenantSubscriptionId && finalBooking.isCoveredByMembership) {
      const targetSub = tenantSubscriptionsList.find((s) => s.id === finalBooking.tenantSubscriptionId);
      if (targetSub) {
        let updatedSub = { ...targetSub };
        if (finalBooking.category === "MEDIA_STUDIO") {
          updatedSub.mediaStudioHoursUsed = (updatedSub.mediaStudioHoursUsed || 0) + 1;
        } else {
          updatedSub.consultationSessionsUsed = (updatedSub.consultationSessionsUsed || 0) + 1;
        }
        updatedSub.updatedAt = new Date().toISOString();
        const updatedSubs = tenantSubscriptionsList.map((s) => (s.id === updatedSub.id ? updatedSub : s));
        setTenantSubscriptionsList(updatedSubs);
        saveTenantSubscriptions(updatedSubs);
      }
    }

    // 2. Auto-generate official Receipt Voucher
    if (autoGenerateVoucher) {
      const lineItems = [
        {
          id: `item-srv-${Date.now()}`,
          description: `${finalBooking.serviceName} (${finalBooking.duration || "جلسة استشارية / مهمة تنفيذية"})`,
          quantity: 1,
          unitPrice: finalBooking.price,
          amount: finalBooking.price
        }
      ];

      const subtotal = finalBooking.price;
      const discount = finalBooking.discount || 0;
      const taxableAmount = Math.max(0, subtotal - discount);
      const taxAmount = Number((taxableAmount * 0.05).toFixed(3));
      const totalAmount = finalBooking.isCoveredByMembership ? 0 : Number((taxableAmount + taxAmount).toFixed(3));
      const currency = finalBooking.currency || companySettings.defaultCurrency || "OMR";

      const newVoucher: ReceiptVoucher = {
        id: `rv-srv-${Date.now()}`,
        voucherNumber: `RV-SRV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        referenceNo: finalBooking.bookingNumber,
        date: finalBooking.preferredDate || new Date().toISOString().split("T")[0],
        type: "RECEIPT",
        receivedFrom: finalBooking.customerName,
        payerPhone: finalBooking.customerPhone,
        payerEmail: finalBooking.customerEmail,
        amount: totalAmount,
        amountInWords: numberToWords(totalAmount, currency),
        currency: currency,
        paymentMethod: finalBooking.paymentMethod || "CREDIT_CARD",
        category: "إيرادات خدمات استشارية وإدارية مساندة",
        notes: `سند قبض مالي مقابل حجز خدمة (${finalBooking.serviceName}) - رقم الحجز: ${finalBooking.bookingNumber}${finalBooking.isCoveredByMembership ? " (مغطاة بالكامل مجاناً ضمن باقة اشتراك المستأجر)" : ""}`,
        terms: "شكراً لاختياركم خدماتنا الاستشارية. يرجى مراجعة فريق العمل لمتابعة جدول تنفيذ الخدمة.",
        customFields: [],
        lineItems: lineItems,
        subtotal: subtotal,
        taxRate: 5,
        taxAmount: taxAmount,
        discountAmount: discount,
        totalAmount: totalAmount,
        isCustomWords: false,
        status: "PAID",
        branchId: activeBranchId,
        preparedBy: userName || "النظام الذكي",
        approvedBy: "الإدارة المالية",
        receivedBy: finalBooking.customerName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedVouchers = [newVoucher, ...vouchersList];
      setVouchersList(updatedVouchers);
      saveVouchers(updatedVouchers);

      finalBooking.linkedVoucherId = newVoucher.id;
      finalBooking.linkedVoucherNumber = newVoucher.voucherNumber;
      finalBooking.paymentStatus = finalBooking.isCoveredByMembership ? "FREE_QUOTA" : "PAID";

      setActiveVoucher(newVoucher);
      setActiveTab("preview");

      triggerAuditLog(
        "CREATE",
        "VOUCHERS",
        newVoucher.id,
        newVoucher.voucherNumber,
        `إنشاء سند قبض مالي رسمي (${newVoucher.voucherNumber}) لحجز الخدمة الاستشارية ${finalBooking.bookingNumber}`,
        `Auto-generated receipt voucher (${newVoucher.voucherNumber}) for service booking ${finalBooking.bookingNumber}`
      );
    }

    const updatedBookings = [finalBooking, ...serviceBookingsList];
    setServiceBookingsList(updatedBookings);
    saveServiceBookings(updatedBookings);

    // Sync Customer in CRM
    if (finalBooking.customerName) {
      const existingCust = customersList.find(
        (c) =>
          c.name.trim().toLowerCase() === finalBooking.customerName.trim().toLowerCase() ||
          (c.phone && finalBooking.customerPhone && c.phone.trim() === finalBooking.customerPhone.trim())
      );
      if (!existingCust) {
        const newCust: Customer = {
          id: generateUuid(),
          name: finalBooking.customerName,
          phone: finalBooking.customerPhone,
          email: finalBooking.customerEmail || "",
          type: finalBooking.companyName ? "CORPORATE" : "INDIVIDUAL",
          status: "ACTIVE",
          notes: finalBooking.companyName ? `الشركة: ${finalBooking.companyName}` : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const updatedCusts = [newCust, ...customersList];
        setCustomersList(updatedCusts);
        saveCustomers(updatedCusts);
      }
    }

    triggerAuditLog(
      "CREATE",
      "VOUCHERS",
      finalBooking.id,
      finalBooking.bookingNumber,
      `تأكيد حجز خدمة استشارية (${finalBooking.bookingNumber}) للعميل ${finalBooking.customerName}`,
      `Confirmed service booking (${finalBooking.bookingNumber}) for ${finalBooking.customerName}`
    );
  };

  const handleIssueVoucherFromServiceBooking = (booking: ServiceBooking) => {
    const lineItems = [
      {
        id: `item-srv-${Date.now()}`,
        description: `${booking.serviceName} (${booking.duration || "جلسة استشارية"})`,
        quantity: 1,
        unitPrice: booking.price,
        amount: booking.price
      }
    ];

    const subtotal = booking.price;
    const discount = booking.discount || 0;
    const taxableAmount = Math.max(0, subtotal - discount);
    const taxAmount = Number((taxableAmount * 0.05).toFixed(3));
    const totalAmount = booking.finalAmount;
    const currency = booking.currency || companySettings.defaultCurrency || "OMR";

    const newVoucher: ReceiptVoucher = {
      id: `rv-srv-${Date.now()}`,
      voucherNumber: `RV-SRV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      referenceNo: booking.bookingNumber,
      date: booking.preferredDate || new Date().toISOString().split("T")[0],
      type: "RECEIPT",
      receivedFrom: booking.customerName,
      payerPhone: booking.customerPhone,
      payerEmail: booking.customerEmail,
      amount: totalAmount,
      amountInWords: numberToWords(totalAmount, currency),
      currency: currency,
      paymentMethod: booking.paymentMethod || "CREDIT_CARD",
      category: "إيرادات خدمات استشارية وإدارية مساندة",
      notes: `سند قبض مقابل حجز ${booking.serviceName} - رقم الحجز: ${booking.bookingNumber}`,
      terms: "شكراً لتعاملكم معنا. يرجى الاحتفاظ بالسند كإثبات سداد رسمي.",
      customFields: [],
      lineItems: lineItems,
      subtotal: subtotal,
      taxRate: 5,
      taxAmount: taxAmount,
      discountAmount: discount,
      totalAmount: totalAmount,
      isCustomWords: false,
      status: "PAID",
      branchId: activeBranchId,
      preparedBy: userName || "النظام",
      approvedBy: "الإدارة المالية",
      receivedBy: booking.customerName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedVouchers = [newVoucher, ...vouchersList];
    setVouchersList(updatedVouchers);
    saveVouchers(updatedVouchers);

    const updatedBookings = serviceBookingsList.map((b) =>
      b.id === booking.id
        ? { ...b, linkedVoucherId: newVoucher.id, linkedVoucherNumber: newVoucher.voucherNumber, paymentStatus: "PAID" as const }
        : b
    );
    setServiceBookingsList(updatedBookings);
    saveServiceBookings(updatedBookings);

    setActiveVoucher(newVoucher);
    setActiveTab("preview");

    triggerAuditLog(
      "CREATE",
      "VOUCHERS",
      newVoucher.id,
      newVoucher.voucherNumber,
      `إصدار سند قبض مالي رسمي ${newVoucher.voucherNumber} لحجز الخدمة ${booking.bookingNumber}`,
      `Issued official receipt voucher ${newVoucher.voucherNumber} for service booking ${booking.bookingNumber}`
    );
  };

  const handleOpenServiceBookingModal = (srv?: ConsultingService | null) => {
    setSelectedServiceForBooking(srv || null);
    setIsServiceBookingModalOpen(true);
  };

  const handleOpenTenantSubModal = (sub?: TenantSubscription | null) => {
    setSelectedTenantSubForEditing(sub || null);
    setIsTenantSubModalOpen(true);
  };

  // Lease Contracts Handlers
  const handleSaveLeaseContract = (contract: LeaseContract) => {
    const exists = leaseContractsList.some((c) => c.id === contract.id);
    const updated = exists
      ? leaseContractsList.map((c) => (c.id === contract.id ? contract : c))
      : [contract, ...leaseContractsList];
    setLeaseContractsList(updated);
    saveLeaseContracts(updated);

    // Sync Customer in CRM if not present
    if (contract.tenantName) {
      const existingCust = customersList.find(
        (c) =>
          c.name.trim().toLowerCase() === contract.tenantName.trim().toLowerCase() ||
          (c.phone && contract.tenantPhone && c.phone.trim() === contract.tenantPhone.trim())
      );
      if (!existingCust) {
        const newCust: Customer = {
          id: generateUuid(),
          name: contract.tenantName,
          phone: contract.tenantPhone,
          email: contract.tenantEmail || "",
          address: contract.tenantAddress,
          taxId: contract.tenantTaxNumber,
          type: contract.tenantType === "CORPORATE" ? "CORPORATE" : "INDIVIDUAL",
          status: "ACTIVE",
          notes: `مستأجر - عقد رقم: ${contract.contractNumber} (${contract.spaceName})`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const updatedCusts = [newCust, ...customersList];
        setCustomersList(updatedCusts);
        saveCustomers(updatedCusts);
      }
    }

    triggerAuditLog(
      exists ? "UPDATE" : "CREATE",
      "VOUCHERS",
      contract.id,
      contract.contractNumber,
      `${exists ? "تحديث وتعديل" : "إصدار وتوثيق"} عقد إيجار تجاري (${contract.contractNumber}) للمستأجر ${contract.tenantName}`,
      `${exists ? "Updated" : "Issued and signed"} lease contract (${contract.contractNumber}) for tenant ${contract.tenantName}`
    );
  };

  const handleDeleteLeaseContract = (contractId: string) => {
    const target = leaseContractsList.find((c) => c.id === contractId);
    const updated = leaseContractsList.filter((c) => c.id !== contractId);
    setLeaseContractsList(updated);
    if (isSupabaseConfigured) {
      spacesSvc.deleteLeaseContract(contractId).catch(console.error);
    }
    saveLeaseContracts(updated);

    triggerAuditLog(
      "DELETE",
      "VOUCHERS",
      contractId,
      target?.contractNumber || contractId,
      `حذف عقد الإيجار (${target?.contractNumber || contractId}) نهائياً من السجلات`,
      `Deleted lease contract (${target?.contractNumber || contractId})`
    );
  };

  const handleCollectInstallment = (contract: LeaseContract, installment: PaymentInstallment) => {
    const currYear = new Date().getFullYear();
    const randSeq = Math.floor(1000 + Math.random() * 9000);
    const voucherNum = `RV-LEAS-${currYear}-${randSeq}`;
    const curr = installment.currency || "OMR";

    const lineItems = [
      {
        id: `li-inst-${Date.now()}`,
        description: `${installment.titleAr} - عن عقد الإيجار (${contract.contractNumber}) - ${contract.spaceName}`,
        quantity: 1,
        unitPrice: installment.amount,
        amount: installment.amount
      }
    ];

    const newVoucher: ReceiptVoucher = {
      id: `rv-inst-${Date.now()}`,
      voucherNumber: voucherNum,
      referenceNo: contract.contractNumber,
      date: new Date().toISOString().split("T")[0],
      type: "RECEIPT",
      receivedFrom: contract.tenantName,
      payerPhone: contract.tenantPhone,
      payerEmail: contract.tenantEmail,
      payerAddress: contract.tenantAddress,
      payerTaxId: contract.tenantTaxNumber,
      amount: installment.totalAmount,
      amountInWords: numberToWords(installment.totalAmount, curr),
      currency: curr,
      paymentMethod: "BANK_TRANSFER",
      category: "إيرادات تأجير المكاتب ومساحات العمل",
      notes: `سداد الدفعة الإيجارية (${installment.titleAr}) - عقد رقم (${contract.contractNumber}) - الوحدة: ${contract.spaceName}`,
      terms: companySettings.termsAndConditions || "يعتبر هذا المستند إشعاراً رسمياً وسند قبض معتمد قانونياً.",
      customFields: [
        { id: "cf-lc-1", label: "رقم العقد الإيجاري", value: contract.contractNumber },
        { id: "cf-lc-2", label: "العين المؤجرة", value: contract.spaceName }
      ],
      lineItems: lineItems,
      subtotal: installment.amount,
      taxRate: installment.taxRate || 5,
      taxAmount: installment.taxAmount || 0,
      discountAmount: 0,
      totalAmount: installment.totalAmount,
      isCustomWords: false,
      status: "PAID",
      branchId: contract.branchId || activeBranchId,
      preparedBy: userName || "مدير التأجير",
      approvedBy: "الإدارة المالية",
      receivedBy: contract.tenantName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedVouchers = [newVoucher, ...vouchersList];
    setVouchersList(updatedVouchers);
    saveVouchers(updatedVouchers);

    // Update Installment in Contract
    const updatedInstallments = contract.installments.map((inst) =>
      inst.id === installment.id
        ? {
            ...inst,
            status: "PAID" as const,
            paidDate: new Date().toISOString().split("T")[0],
            linkedVoucherId: newVoucher.id,
            linkedVoucherNumber: newVoucher.voucherNumber
          }
        : inst
    );

    const updatedContract: LeaseContract = {
      ...contract,
      installments: updatedInstallments,
      updatedAt: new Date().toISOString()
    };

    const updatedContractsList = leaseContractsList.map((c) =>
      c.id === contract.id ? updatedContract : c
    );
    setLeaseContractsList(updatedContractsList);
    saveLeaseContracts(updatedContractsList);

    setActiveVoucher(newVoucher);
    setActiveTab("preview");

    triggerAuditLog(
      "CREATE",
      "VOUCHERS",
      newVoucher.id,
      newVoucher.voucherNumber,
      `تحصيل القسط الإيجاري وإصدار سند قبض (${newVoucher.voucherNumber}) للعقد (${contract.contractNumber})`,
      `Collected lease installment and issued receipt (${newVoucher.voucherNumber}) for contract (${contract.contractNumber})`
    );
  };

  const handleSaveDepositSettlement = (contract: LeaseContract, refundData?: any) => {
    let updatedVouchers = vouchersList;

    if (refundData && refundData.amount > 0) {
      const currYear = new Date().getFullYear();
      const randSeq = Math.floor(1000 + Math.random() * 9000);
      const pvNum = `PV-DEP-${currYear}-${randSeq}`;
      const curr = "OMR";

      const refundVoucher: ReceiptVoucher = {
        id: `pv-dep-${Date.now()}`,
        voucherNumber: pvNum,
        referenceNo: contract.contractNumber,
        date: new Date().toISOString().split("T")[0],
        type: "PAYMENT",
        receivedFrom: contract.tenantName,
        payerPhone: contract.tenantPhone,
        payerEmail: contract.tenantEmail,
        payerAddress: contract.tenantAddress,
        amount: refundData.amount,
        amountInWords: numberToWords(refundData.amount, curr),
        currency: curr,
        paymentMethod: "BANK_TRANSFER",
        category: "أمانات وتأمينات المستأجرين المستردة",
        notes: `رد وتسوية مبلغ التأمين المسترد لعقد الإيجار (${contract.contractNumber}) بعد فحص وإخلاء ${contract.spaceName}`,
        terms: "تم تسوية التأمين وإخلاء طرف المستأجر بموجب محضر المعاينة المعتمد.",
        customFields: [
          { id: "cf-dep-1", label: "رقم العقد الإيجاري", value: contract.contractNumber },
          { id: "cf-dep-2", label: "المستأجر", value: contract.tenantName }
        ],
        lineItems: [
          {
            id: `li-dep-${Date.now()}`,
            description: `رد التأمين المسترد عن عقد الإيجار (${contract.contractNumber})`,
            quantity: 1,
            unitPrice: refundData.amount,
            amount: refundData.amount
          }
        ],
        subtotal: refundData.amount,
        taxRate: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: refundData.amount,
        isCustomWords: false,
        status: "PAID",
        branchId: contract.branchId || activeBranchId,
        preparedBy: userName || "مدير التأجير",
        approvedBy: "الإدارة المالية",
        receivedBy: contract.tenantName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      updatedVouchers = [refundVoucher, ...vouchersList];
      setVouchersList(updatedVouchers);
      saveVouchers(updatedVouchers);
    }

    const updatedContracts = leaseContractsList.map((c) =>
      c.id === contract.id ? contract : c
    );
    setLeaseContractsList(updatedContracts);
    saveLeaseContracts(updatedContracts);

    triggerAuditLog(
      "UPDATE",
      "VOUCHERS",
      contract.id,
      contract.contractNumber,
      `تسوية الضمان المالي ومحضر الاستلام للعقد (${contract.contractNumber}) للمستأجر ${contract.tenantName}`,
      `Settled security deposit & handover for contract (${contract.contractNumber})`
    );
  };

  const handleShareContractWhatsApp = (contract: LeaseContract) => {
    const text = encodeURIComponent(
      `*عقد إيجار مكتب ومساحة عمل معتمد*\n` +
      `--------------------------------\n` +
      `🏢 *المؤجر:* ${contract.lessorCompanyName}\n` +
      `👤 *المستأجر:* ${contract.tenantName}\n` +
      `📄 *رقم العقد:* ${contract.contractNumber}\n` +
      `📍 *العين المؤجرة:* ${contract.spaceName} (${contract.spaceCode})\n` +
      `🗓 *المدة:* من ${contract.startDate} إلى ${contract.endDate} (${contract.durationMonths} شهراً)\n` +
      `💰 *القيمة الإجمالية:* ${contract.finalContractValue.toFixed(3)} ر.ع\n` +
      `🛡 *الضمان المالي (التأمين):* ${contract.securityDeposit.depositAmount.toFixed(3)} ر.ع\n` +
      `🔐 *كود التوثيق الرقمي:* ${contract.signatureVerificationCode}\n` +
      `--------------------------------\n` +
      `تم توثيق واعتماد العقد إلكترونياً بنظام إدارة مساحات العمل.`
    );
    const cleanPhone = (contract.tenantPhone || "").replace(/\D/g, "");
    const targetUrl = cleanPhone.length > 6
      ? `https://wa.me/${cleanPhone}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(targetUrl, "_blank");
  };

  const handleResetDefaults = () => {
    setCompanySettings(DEFAULT_COMPANY_SETTINGS);
    saveCompanySettings(DEFAULT_COMPANY_SETTINGS);
    setDesignTheme(DEFAULT_DESIGN_THEME);
    saveDesignTheme(DEFAULT_DESIGN_THEME);
    triggerAuditLog(
      "SETTINGS_UPDATE",
      "SETTINGS",
      "factory-reset",
      "إعادة ضبط المصنع",
      "إعادة تعيين كافة إعدادات الشركة وقوالب التصميم للقيم الافتراضية",
      "Reset all company settings and design templates to initial defaults"
    );
  };

  const handleSaveAccounts = (updated: Account[]) => {
    setAccountsList(updated);
    const cId = supabaseAuthUser?.companyId || DEFAULT_COMPANY_ID;
    if (isSupabaseConfigured) {
      saveAccounts(updated);
      Promise.all(updated.map((acc) => accountingSvc.upsertAccount(acc, cId))).catch(console.error);
    } else {
      saveAccounts(updated);
    }
  };

  const handleSaveJournalEntries = (updated: JournalEntry[]) => {
    setJournalEntriesList(updated);
    const cId = supabaseAuthUser?.companyId || DEFAULT_COMPANY_ID;
    if (isSupabaseConfigured) {
      saveJournalEntries(updated);
      Promise.all(updated.map((entry) => accountingSvc.saveJournalEntry(entry, cId))).catch(console.error);
    } else {
      saveJournalEntries(updated);
    }
  };

  const handleSaveRevisionLogs = (updated: AccountingRevisionLog[]) => {
    setRevisionLogsList(updated);
    saveAccountingRevisionLogs(updated);
  };

  const handleSaveFiscalPeriods = (updated: FiscalPeriod[]) => {
    setFiscalPeriodsList(updated);
    saveFiscalPeriods(updated);
  };

  if (!authSession) {
    return (
      <LoginPage
        companySettings={companySettings}
        onLoginSuccess={handleLoginSuccess}
        onAuditLog={triggerAuditLog}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans antialiased flex flex-row pb-16 lg:pb-0 overflow-x-hidden">
      
      {/* Primary Collapsible Sidebar */}
      <PrimarySidebar
        isOpen={isSidebarOpenMobile}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        activeTab={activeTab}
        onSelectTab={handleNavigateWithHistory}
        session={authSession}
        counts={{
          vouchers: vouchersList.length,
          inventory: inventoryList.length,
          customers: customersList.length,
          employees: employeesList.length,
          lowStock: inventoryList.filter((i) => (i.quantity || 0) <= (i.minAlertQuantity || 5)).length
        }}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
      />

      {/* Main Content Area Layout */}
      <div
        className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ${
          isSidebarCollapsed ? "lg:ms-20" : "lg:ms-72"
        }`}
      >
        {/* Navigation Top Bar */}
        <TopNavBar
          activeTab={activeTab}
          companySettings={companySettings}
          branches={branchesList}
          activeBranchId={activeBranchId}
          onSelectBranch={setActiveBranchId}
          onNavigateTab={handleNavigateWithHistory}
          onToggleSidebar={() => setIsSidebarOpenMobile(true)}
          onOpenAttendanceKiosk={() => setIsGlobalKioskModalOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          unreadNotificationsCount={systemNotifications.length}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenQuickCreate={() => setIsQuickCreateOpen(true)}
          onOpenContextualHelp={() => setIsContextualHelpOpen(true)}
          onOpenSecuritySettings={() => setIsSecurityModalOpen(true)}
          onLogout={handleLogout}
          session={authSession}
          userName={userName}
        />

        {/* Main View Area */}
        <main className={activeTab === "pos" ? "flex-1 w-full" : "flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto"}>
          {/* Breadcrumbs Navigation */}
          {activeTab !== "pos" && (
            <div className="mb-4">
              <Breadcrumbs
                items={breadcrumbsList}
                onNavigateHome={() => handleNavigateWithHistory("home")}
              />
            </div>
          )}

          {activeTab === "home" && (
            <HomeDashboard
              userName={userName}
              onUpdateUserName={handleUpdateUserName}
              companySettings={companySettings}
              vouchers={vouchersList}
              customers={customersList}
              inventory={inventoryList}
              purchases={purchasesList}
              branches={branchesList}
              onSelectAction={handleSelectAction}
              onNavigateTab={handleNavigateWithHistory}
              onViewVoucher={(v) => {
                setActiveVoucher(v);
                handleNavigateWithHistory("preview");
              }}
              onQuickCreateForCustomer={handleCreateVoucherForCustomer}
            />
          )}

          {activeTab === "help" && (
            <HelpCenterView
              onNavigateTab={handleNavigateWithHistory}
              onOpenAiAssistant={() => setIsAiModalOpen(true)}
              onOpenOnboarding={() => setIsOnboardingOpen(true)}
            />
          )}

        {activeTab === "pos" && (
          <POSView
            inventory={inventoryList}
            customers={customersList}
            branches={branchesList}
            activeBranchId={activeBranchId}
            activeEmployee={getActiveEmployee()}
            companySettings={companySettings}
            vouchers={vouchersList}
            onSaveInventory={handleSaveInventory}
            onSaveMovements={handleSaveMovements}
            onSaveVouchers={handleSaveVouchersList}
            onSaveCustomers={handleSaveCustomersList}
            onAuditLog={triggerAuditLog}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === "accounting" && (
          <GeneralLedgerAccountsView
            accounts={accountsList}
            journalEntries={journalEntriesList}
            revisionLogs={revisionLogsList}
            fiscalPeriods={fiscalPeriodsList}
            branches={branchesList}
            companySettings={companySettings}
            vouchers={vouchersList}
            purchases={purchasesList}
            payrollSlips={payrollSlipsList}
            onSaveAccounts={handleSaveAccounts}
            onSaveJournalEntries={handleSaveJournalEntries}
            onSaveRevisionLogs={handleSaveRevisionLogs}
            onSaveFiscalPeriods={handleSaveFiscalPeriods}
            currentUserName={userName}
            activeBranchId={activeBranchId}
          />
        )}

        {activeTab === "spaces" && (
          <SpacesManager
            spaces={rentalSpacesList}
            bookings={spaceBookingsList}
            branches={branchesList}
            session={authSession}
            onSaveSpace={(sp) => {
              const exists = rentalSpacesList.some((s) => s.id === sp.id);
              const updated = exists ? rentalSpacesList.map((s) => s.id === sp.id ? sp : s) : [sp, ...rentalSpacesList];
              handleSaveRentalSpaces(updated);
            }}
            onDeleteSpace={(spId) => {
              const updated = rentalSpacesList.filter((s) => s.id !== spId);
              handleSaveRentalSpaces(updated);
            }}
            onSaveBooking={(bk) => {
              const exists = spaceBookingsList.some((b) => b.id === bk.id);
              const updated = exists ? spaceBookingsList.map((b) => b.id === bk.id ? bk : b) : [bk, ...spaceBookingsList];
              handleSaveSpaceBookings(updated);
            }}
            onCancelBooking={(bkId) => {
              const updated = spaceBookingsList.map((b) => b.id === bkId ? { ...b, status: "CANCELLED" as const } : b);
              handleSaveSpaceBookings(updated);
            }}
            onOpenBookingModal={(sp) => handleOpenBookingModalForSpace(sp)}
            onGenerateVoucherForBooking={handleIssueVoucherFromBooking}
          />
        )}

        {activeTab === "contracts" && (
          <LeaseContractsManager
            contracts={leaseContractsList}
            spaces={rentalSpacesList}
            branches={branchesList}
            customers={customersList}
            packages={membershipPackagesList}
            vouchers={vouchersList}
            session={authSession}
            companySettings={companySettings}
            onSaveContract={handleSaveLeaseContract}
            onDeleteContract={handleDeleteLeaseContract}
            onCollectInstallment={handleCollectInstallment}
            onSaveDepositSettlement={handleSaveDepositSettlement}
            onShareWhatsApp={handleShareContractWhatsApp}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === "services" && (
          <ServicesManager
            services={consultingServicesList}
            packages={membershipPackagesList}
            subscriptions={tenantSubscriptionsList}
            bookings={serviceBookingsList}
            branches={branchesList}
            customers={customersList}
            session={authSession}
            onSaveService={handleSaveConsultingService}
            onDeleteService={handleDeleteConsultingService}
            onSavePackage={handleSaveMembershipPackage}
            onDeletePackage={handleDeleteMembershipPackage}
            onSaveSubscription={handleSaveTenantSubscription}
            onDeleteSubscription={handleDeleteTenantSubscription}
            onSaveBooking={(bk) => {
              const exists = serviceBookingsList.some((b) => b.id === bk.id);
              const updated = exists ? serviceBookingsList.map((b) => b.id === bk.id ? bk : b) : [bk, ...serviceBookingsList];
              setServiceBookingsList(updated);
              saveServiceBookings(updated);
            }}
            onCancelBooking={(bkId) => {
              const updated = serviceBookingsList.map((b) => b.id === bkId ? { ...b, status: "CANCELLED" as const } : b);
              setServiceBookingsList(updated);
              saveServiceBookings(updated);
            }}
            onOpenBookingModal={handleOpenServiceBookingModal}
            onOpenSubscriptionModal={handleOpenTenantSubModal}
            onGenerateVoucherForBooking={handleIssueVoucherFromServiceBooking}
          />
        )}

        {activeTab === "portal" && (
          <ClientBookingPortal
            services={consultingServicesList}
            spaces={rentalSpacesList}
            branches={branchesList}
            customers={customersList}
            subscriptions={tenantSubscriptionsList}
            packages={membershipPackagesList}
            onBookService={handleOpenServiceBookingModal}
            onBookSpace={handleOpenBookingModalForSpace}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === "doc-wizard" && (
          <DocWizardView
            voucher={activeVoucher}
            onChange={setActiveVoucher}
            onSave={handleSaveActiveVoucher}
            onPreview={() => setActiveTab("preview")}
            onPrint={handlePrint}
            onExportPdf={handleExportPdf}
            onSwitchToFullEditor={() => setActiveTab("editor")}
            onOpenAiAssistant={() => setIsAiModalOpen(true)}
            customers={customersList}
            suppliers={suppliersList}
            branches={branchesList}
            companySettings={companySettings}
            designTheme={designTheme}
            onUpdateDesignTheme={handleSaveDesignTheme}
            onQuickSaveCustomer={handleSaveCustomer}
            onAuditLog={triggerAuditLog}
          />
        )}

        {activeTab === "editor" && (
          <VoucherForm
            voucher={activeVoucher}
            onChange={setActiveVoucher}
            onSave={handleSaveActiveVoucher}
            onPreview={() => setActiveTab("preview")}
            onOpenAiAssistant={() => setIsAiModalOpen(true)}
            onSwitchToDocWizard={() => setActiveTab("doc-wizard")}
            customers={customersList}
            branches={branchesList}
            onQuickSaveCustomer={handleSaveCustomer}
          />
        )}

        {activeTab === "preview" && (
          <ReceiptPreview
            voucher={activeVoucher}
            settings={companySettings}
            theme={designTheme}
            onPrint={handlePrint}
            onExportPdf={handleExportPdf}
            onUpdateTheme={handleSaveDesignTheme}
          />
        )}

        {activeTab === "history" && (
          <VoucherHistory
            vouchers={vouchersList}
            settings={companySettings}
            theme={designTheme}
            onSelectVoucher={(v) => {
              setActiveVoucher(v);
              setActiveTab("editor");
            }}
            onDeleteVoucher={handleDeleteVoucher}
            onDeleteMultipleVouchers={handleDeleteMultipleVouchers}
            onDuplicateVoucher={handleDuplicateVoucher}
            onNewVoucher={handleCreateNewVoucher}
            onPrintVoucher={(v) => {
              setActiveVoucher(v);
              setActiveTab("preview");
              setTimeout(() => window.print(), 300);
            }}
            onExportPdfVoucher={(v) => {
              setActiveVoucher(v);
              setActiveTab("preview");
              setTimeout(() => {
                exportToPdf("receipt-voucher-print-area", v.voucherNumber, designTheme.pageSize);
              }, 400);
            }}
          />
        )}

        {activeTab === "inventory" && (
          <InventoryView
            inventory={inventoryList}
            movements={stockMovementsList}
            companySettings={companySettings}
            branches={branchesList}
            onSaveInventory={handleSaveInventory}
            onSaveMovements={handleSaveMovements}
            onNavigateToPurchases={() => setActiveTab("purchases")}
          />
        )}

        {activeTab === "purchases" && (
          <PurchasesView
            purchases={purchasesList}
            suppliers={suppliersList}
            inventory={inventoryList}
            movements={stockMovementsList}
            companySettings={companySettings}
            branches={branchesList}
            onSavePurchases={handleSavePurchases}
            onSaveSuppliers={handleSaveSuppliers}
            onSaveInventory={handleSaveInventory}
            onSaveMovements={handleSaveMovements}
            onCreatePaymentVoucher={handleCreatePaymentVoucherFromPurchase}
            onNavigateToInventory={() => setActiveTab("inventory")}
          />
        )}

        {activeTab === "branches" && (
          <BranchesView
            branches={branchesList}
            activeBranchId={activeBranchId}
            transfers={stockTransfersList}
            vouchers={vouchersList}
            inventory={inventoryList}
            purchases={purchasesList}
            companySettings={companySettings}
            onSaveBranches={handleSaveBranches}
            onSaveTransfers={handleSaveTransfers}
            onSelectActiveBranch={setActiveBranchId}
            onUpdateInventoryAfterTransfer={handleSaveInventory}
            onNavigateToVouchersByBranch={() => {
              setActiveTab("history");
            }}
          />
        )}

        {activeTab === "crm" && (
          <CRMView
            customers={customersList}
            vouchers={vouchersList}
            leaseContracts={leaseContractsList}
            subscriptions={tenantSubscriptionsList}
            packages={membershipPackagesList}
            services={consultingServicesList}
            serviceBookings={serviceBookingsList}
            spaces={rentalSpacesList}
            branches={branchesList}
            companySettings={companySettings}
            onSaveCustomer={handleSaveCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onCreateVoucherForCustomer={handleCreateVoucherForCustomer}
            onViewVoucher={(v) => {
              setActiveVoucher(v);
              setActiveTab("preview");
            }}
            onSyncWithVouchers={handleSyncCustomersWithVouchers}
            onSaveContract={handleSaveLeaseContract}
            onCollectInstallment={handleCollectInstallment}
            onSaveSubscription={handleSaveTenantSubscription}
            onSaveServiceBooking={(bk) => {
              const exists = serviceBookingsList.some((b) => b.id === bk.id);
              const updated = exists ? serviceBookingsList.map((b) => b.id === bk.id ? bk : b) : [bk, ...serviceBookingsList];
              setServiceBookingsList(updated);
              saveServiceBookings(updated);
            }}
            onOpenServiceBookingModal={handleOpenServiceBookingModal}
            onOpenTenantSubModal={handleOpenTenantSubModal}
            onOpenSpaceBookingModal={handleOpenBookingModalForSpace}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === "schedules" && (
          <RecurringSchedulesView
            schedules={schedulesList}
            vouchers={vouchersList}
            customers={customersList}
            suppliers={suppliersList}
            branches={branchesList}
            activeBranchId={activeBranchId}
            companySettings={companySettings}
            onSaveSchedules={handleSaveSchedules}
            onSaveVouchers={handleSaveVouchersList}
            onViewVoucher={(v) => {
              setActiveVoucher(v);
              setActiveTab("preview");
            }}
            onAuditLog={triggerAuditLog}
          />
        )}

        {activeTab === "employees" && (
          <EmployeesManager
            employees={employeesList}
            branches={branchesList}
            companySettings={companySettings}
            activeEmployeeId={activeEmployeeId}
            attendanceRecords={attendanceList}
            payrollSlips={payrollSlipsList}
            leaveRequests={leaveRequestsList}
            vouchers={vouchersList}
            onSaveEmployees={handleSaveEmployees}
            onSaveAttendance={handleSaveAttendance}
            onSavePayrollSlips={handleSavePayrollSlips}
            onSaveLeaveRequests={handleSaveLeaveRequests}
            onSelectActiveEmployee={handleSelectActiveEmployee}
            onSaveVouchers={handleSaveVouchersList}
            onViewVoucher={(v) => {
              setActiveVoucher(v);
              setActiveTab("preview");
            }}
            onAuditLog={triggerAuditLog}
          />
        )}

        {activeTab === "requests" && (
          <RequestsDashboard
            employees={employeesList}
            branches={branchesList}
            currentEmployee={employeesList.find((e) => e.id === activeEmployeeId)}
            companySettings={companySettings}
          />
        )}

        {activeTab === "settings" && (
          <SettingsStudio
            settings={companySettings}
            theme={designTheme}
            employees={employeesList}
            branches={branchesList}
            activeEmployeeId={activeEmployeeId}
            auditLogs={auditLogsList}
            onSaveSettings={handleSaveCompanySettings}
            onSaveTheme={handleSaveDesignTheme}
            onSaveEmployees={handleSaveEmployees}
            onSelectActiveEmployee={handleSelectActiveEmployee}
            onClearAuditLogs={handleClearAuditLogs}
            onOpenSecuritySettings={() => setIsSecurityModalOpen(true)}
            onResetDefaults={handleResetDefaults}
          />
        )}
      </main>
      </div>

      {/* Global Command Palette Modal (Ctrl + K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={handleNavigateWithHistory}
        onSelectAction={(action) => {
          handleSelectAction(action);
          setIsCommandPaletteOpen(false);
        }}
        onOpenAiAssistant={() => setIsAiModalOpen(true)}
        onOpenAttendanceKiosk={() => setIsGlobalKioskModalOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
      />

      {/* Global Quick Create Modal */}
      <QuickCreateModal
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        onSelectVoucherType={(action) => {
          handleSelectAction(action);
          setIsQuickCreateOpen(false);
        }}
        onNavigateTab={handleNavigateWithHistory}
        onQuickCreateCustomer={() => handleNavigateWithHistory("crm")}
        onQuickCreateProduct={() => handleNavigateWithHistory("inventory")}
        onQuickCreateEmployee={() => handleNavigateWithHistory("employees")}
        onQuickCreateSpaceBooking={() => {
          setSelectedSpaceForBooking(rentalSpacesList[0] || null);
          setIsBookingModalOpen(true);
        }}
      />

      {/* Contextual Page Help Drawer */}
      <ContextualHelpDrawer
        isOpen={isContextualHelpOpen}
        onClose={() => setIsContextualHelpOpen(false)}
        activeTab={activeTab}
        onNavigateTab={handleNavigateWithHistory}
        onOpenHelpCenter={() => handleNavigateWithHistory("help")}
        onOpenAiAssistant={() => setIsAiModalOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
      />

      {/* Guided ERP Onboarding Modal */}
      <ERPOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onNavigateTab={handleNavigateWithHistory}
      />

      {/* Mobile Bottom Navigation (Smart Touch Navigation for Phones / Tablets) */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewVoucher={handleCreateNewVoucher}
        onOpenAiAssistant={() => setIsAiModalOpen(true)}
        onOpenDrawer={() => setIsDrawerOpen(true)}
      />

      {/* Global Slide-Over Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onNewVoucher={handleCreateNewVoucher}
        onOpenAiAssistant={() => setIsAiModalOpen(true)}
        onOpenAttendanceKiosk={() => setIsGlobalKioskModalOpen(true)}
        onOpenSecuritySettings={() => setIsSecurityModalOpen(true)}
        onLockScreen={handleLockScreen}
        onLogout={handleLogout}
        session={authSession}
        vouchersCount={vouchersList.length}
        inventoryCount={inventoryList.length}
        customersCount={customersList.length}
        employeesCount={employeesList.length}
      />

      {/* Offline Status Connectivity Banner */}
      <OfflineIndicator />

      {/* PWA Install Banner */}
      <PWAInstallBanner />

      {/* iOS Manual Installation Modal */}
      <IOSInstallModal
        isOpen={isIosModalOpen}
        onClose={() => setIsIosModalOpen(false)}
      />

      {/* Attendance Tablet Kiosk Global Modal */}
      <AttendanceKioskModal
        isOpen={isGlobalKioskModalOpen}
        onClose={() => setIsGlobalKioskModalOpen(false)}
        employees={employeesList}
        branches={branchesList}
        companySettings={companySettings}
        kioskDevices={loadKioskDevices()}
        movementTypes={loadMovementTypes()}
        movementLogs={loadAttendanceMovementLogs()}
        activeDeviceId={loadActiveKioskDeviceId()}
        onSaveMovementLog={handleSaveGlobalMovementLogSingle}
        onAuditLog={triggerAuditLog}
      />

      {/* Smart Space / Hall Instant Booking Modal */}
      <SpaceBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        space={selectedSpaceForBooking}
        spaces={rentalSpacesList}
        branches={branchesList}
        bookings={spaceBookingsList}
        customers={customersList}
        onConfirmBooking={handleConfirmSpaceBooking}
      />

      {/* Business Services & Advisory Instant Booking Modal */}
      <ServiceBookingModal
        isOpen={isServiceBookingModalOpen}
        onClose={() => setIsServiceBookingModalOpen(false)}
        service={selectedServiceForBooking}
        services={consultingServicesList}
        branches={branchesList}
        customers={customersList}
        subscriptions={tenantSubscriptionsList}
        packages={membershipPackagesList}
        onConfirmBooking={handleConfirmServiceBooking}
      />

      {/* Tenant Subscription & Free Quotas Management Modal */}
      <TenantSubscriptionModal
        isOpen={isTenantSubModalOpen}
        onClose={() => setIsTenantSubModalOpen(false)}
        subscription={selectedTenantSubForEditing}
        customers={customersList}
        packages={membershipPackagesList}
        branches={branchesList}
        onSaveSubscription={handleSaveTenantSubscription}
      />

      {/* AI Assistant Modal */}
      <AIAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyParsedVoucher={handleApplyAiData}
      />

      {/* Smart Notifications and Alerts Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={systemNotifications}
        onNavigateTab={(tab) => {
          setIsNotificationsOpen(false);
          handleNavigateWithHistory(tab);
        }}
      />

      {/* Account Security & Passwords Settings Modal */}
      {authSession && (
        <SecuritySettingsModal
          session={authSession}
          isOpen={isSecurityModalOpen}
          onClose={() => setIsSecurityModalOpen(false)}
          onSessionUpdated={handleSessionUpdated}
          onAuditLog={triggerAuditLog}
        />
      )}

      {/* Quick Screen Lock Modal */}
      {authSession && authSession.isLocked && (
        <LockScreenModal
          session={authSession}
          onUnlock={handleUnlockScreen}
          onSwitchAccount={handleLogout}
        />
      )}

    </div>
  );
}
