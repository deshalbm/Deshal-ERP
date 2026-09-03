/**
 * ERP Data Context
 * Central React context replacing prop drilling in App.tsx.
 * Provides all entities with loading states and Supabase-backed mutations.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import type { Session } from '@supabase/supabase-js';
import type { SupabaseAuthUser } from '../lib/supabase/authService';
import { getCurrentSession, onAuthStateChange } from '../lib/supabase/authService';
import * as customerSvc from '../lib/supabase/customerService';
import * as employeeSvc from '../lib/supabase/employeeService';
import * as inventorySvc from '../lib/supabase/inventoryService';
import * as supplierSvc from '../lib/supabase/supplierService';
import * as companyS from '../lib/supabase/companyService';
import * as hrSvc from '../lib/supabase/hrService';
import * as accountingSvc from '../lib/supabase/accountingService';
import * as purchasesSvc from '../lib/supabase/purchasesService';
import * as spacesSvc from '../lib/supabase/spacesService';
import * as auditSvc from '../lib/supabase/auditService';

// Fallback local storage imports (used when Supabase is not configured)
import {
  loadCustomers, saveCustomers,
  loadEmployees, saveEmployees,
  loadInventory, saveInventory,
  loadSuppliers, saveSuppliers,
  loadBranches, saveBranches,
  loadStockMovements, saveStockMovements,
  loadAttendanceRecords, saveAttendanceRecords,
  loadPayrollSlips, savePayrollSlips,
  loadLeaveRequests, saveLeaveRequests,
  loadVouchers, saveVouchers,
  loadPurchases, savePurchases,
  loadRentalSpaces, saveRentalSpaces,
  loadSpaceBookings, saveSpaceBookings,
  loadLeaseContracts, saveLeaseContracts,
  loadConsultingServices, saveConsultingServices,
  loadMembershipPackages, saveMembershipPackages,
  loadTenantSubscriptions, saveTenantSubscriptions,
  loadServiceBookings, saveServiceBookings,
  loadCompanySettings, saveCompanySettings,
  loadRecurringSchedules, saveRecurringSchedules,
} from '../utils/storage';
import {
  loadAccounts, saveAccounts,
  loadJournalEntries, saveJournalEntries,
  loadFiscalPeriods, saveFiscalPeriods,
  loadCostCenters, saveCostCenters,
} from '../utils/accountingStorage';
import { loadAuditLogs, saveAuditLogs } from '../utils/auditLogger';
import type {
  Customer, Employee, InventoryItem, StockMovement, StockTransfer,
  Supplier, Branch, AttendanceRecord, PayrollSlip, LeaveRequest,
  ReceiptVoucher, PurchaseInvoice, RentalSpace, SpaceBooking,
  LeaseContract, ConsultingService, MembershipPackage, TenantSubscription,
  ServiceBooking, Account, JournalEntry, FiscalPeriod, CostCenter,
  CompanySettings, AuditLogEntry, RecurringSchedule,
} from '../types';

// ──────────────────────────────────────────────
// Context Types
// ──────────────────────────────────────────────

export interface ERPDataContextType {
  // Auth
  authUser: SupabaseAuthUser | null;
  authSession: Session | null;
  companyId: string;
  isAuthLoading: boolean;

  // Loading states
  isDataLoading: boolean;

  // Core entities
  customersList: Customer[];
  employeesList: Employee[];
  inventoryList: InventoryItem[];
  suppliersList: Supplier[];
  branchesList: Branch[];
  stockMovementsList: StockMovement[];
  stockTransfersList: StockTransfer[];
  attendanceList: AttendanceRecord[];
  payrollSlipsList: PayrollSlip[];
  leaveRequestsList: LeaveRequest[];
  vouchersList: ReceiptVoucher[];
  purchasesList: PurchaseInvoice[];
  rentalSpacesList: RentalSpace[];
  spaceBookingsList: SpaceBooking[];
  leaseContractsList: LeaseContract[];
  consultingServicesList: ConsultingService[];
  membershipPackagesList: MembershipPackage[];
  tenantSubscriptionsList: TenantSubscription[];
  serviceBookingsList: ServiceBooking[];
  accountsList: Account[];
  journalEntriesList: JournalEntry[];
  fiscalPeriodsList: FiscalPeriod[];
  costCentersList: CostCenter[];
  auditLogsList: AuditLogEntry[];
  companySettings: CompanySettings;
  schedulesList: RecurringSchedule[];

  // Mutations (save functions)
  setCustomersList: (customers: Customer[]) => void;
  setEmployeesList: (employees: Employee[]) => void;
  setInventoryList: (items: InventoryItem[]) => void;
  setSuppliersList: (suppliers: Supplier[]) => void;
  setBranchesList: (branches: Branch[]) => void;
  setStockMovementsList: (movements: StockMovement[]) => void;
  setStockTransfersList: (transfers: StockTransfer[]) => void;
  setAttendanceList: (records: AttendanceRecord[]) => void;
  setPayrollSlipsList: (slips: PayrollSlip[]) => void;
  setLeaveRequestsList: (requests: LeaveRequest[]) => void;
  setVouchersList: (vouchers: ReceiptVoucher[]) => void;
  setPurchasesList: (purchases: PurchaseInvoice[]) => void;
  setRentalSpacesList: (spaces: RentalSpace[]) => void;
  setSpaceBookingsList: (bookings: SpaceBooking[]) => void;
  setLeaseContractsList: (contracts: LeaseContract[]) => void;
  setConsultingServicesList: (services: ConsultingService[]) => void;
  setMembershipPackagesList: (packages: MembershipPackage[]) => void;
  setTenantSubscriptionsList: (subs: TenantSubscription[]) => void;
  setServiceBookingsList: (bookings: ServiceBooking[]) => void;
  setAccountsList: (accounts: Account[]) => void;
  setJournalEntriesList: (entries: JournalEntry[]) => void;
  setFiscalPeriodsList: (periods: FiscalPeriod[]) => void;
  setCostCentersList: (centers: CostCenter[]) => void;
  setAuditLogsList: (logs: AuditLogEntry[]) => void;
  setCompanySettings: (settings: CompanySettings) => void;
  setSchedulesList: (schedules: RecurringSchedule[]) => void;

  // Utility
  refreshAllData: () => Promise<void>;
  signOut: () => Promise<void>;
}

// ──────────────────────────────────────────────
// Context
// ──────────────────────────────────────────────

export const ERPDataContext = createContext<ERPDataContextType | null>(null);

export function useERPData(): ERPDataContextType {
  const ctx = useContext(ERPDataContext);
  if (!ctx) throw new Error('useERPData must be used inside ERPDataProvider');
  return ctx;
}

// ──────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────

export function ERPDataProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<SupabaseAuthUser | null>(null);
  const [authSession, setAuthSession] = useState<Session | null>(null);
  const [companyId, setCompanyId] = useState<string>('');
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // All entity states — initialized from localStorage as fallback
  const [customersList, setCustomersListState] = useState<Customer[]>([]);
  const [employeesList, setEmployeesListState] = useState<Employee[]>([]);
  const [inventoryList, setInventoryListState] = useState<InventoryItem[]>([]);
  const [suppliersList, setSuppliersListState] = useState<Supplier[]>([]);
  const [branchesList, setBranchesListState] = useState<Branch[]>([]);
  const [stockMovementsList, setStockMovementsListState] = useState<StockMovement[]>([]);
  const [stockTransfersList, setStockTransfersListState] = useState<StockTransfer[]>([]);
  const [attendanceList, setAttendanceListState] = useState<AttendanceRecord[]>([]);
  const [payrollSlipsList, setPayrollSlipsListState] = useState<PayrollSlip[]>([]);
  const [leaveRequestsList, setLeaveRequestsListState] = useState<LeaveRequest[]>([]);
  const [vouchersList, setVouchersListState] = useState<ReceiptVoucher[]>([]);
  const [purchasesList, setPurchasesListState] = useState<PurchaseInvoice[]>([]);
  const [rentalSpacesList, setRentalSpacesListState] = useState<RentalSpace[]>([]);
  const [spaceBookingsList, setSpaceBookingsListState] = useState<SpaceBooking[]>([]);
  const [leaseContractsList, setLeaseContractsListState] = useState<LeaseContract[]>([]);
  const [consultingServicesList, setConsultingServicesListState] = useState<ConsultingService[]>([]);
  const [membershipPackagesList, setMembershipPackagesListState] = useState<MembershipPackage[]>([]);
  const [tenantSubscriptionsList, setTenantSubscriptionsListState] = useState<TenantSubscription[]>([]);
  const [serviceBookingsList, setServiceBookingsListState] = useState<ServiceBooking[]>([]);
  const [accountsList, setAccountsListState] = useState<Account[]>([]);
  const [journalEntriesList, setJournalEntriesListState] = useState<JournalEntry[]>([]);
  const [fiscalPeriodsList, setFiscalPeriodsListState] = useState<FiscalPeriod[]>([]);
  const [costCentersList, setCostCentersListState] = useState<CostCenter[]>([]);
  const [auditLogsList, setAuditLogsListState] = useState<AuditLogEntry[]>([]);
  const [companySettings, setCompanySettingsState] = useState<CompanySettings>(loadCompanySettings());
  const [schedulesList, setSchedulesListState] = useState<RecurringSchedule[]>([]);

  const companyIdRef = useRef(companyId);
  companyIdRef.current = companyId;

  // ── Auth initialization ──────────────────────
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const { session, user } = await getCurrentSession();
      if (isMounted) {
        setAuthSession(session);
        setAuthUser(user);
        setCompanyId(user?.companyId ?? '');
        setIsAuthLoading(false);
      }
    };

    initAuth();

    const unsubscribe = onAuthStateChange((user, session) => {
      if (isMounted) {
        setAuthUser(user);
        setAuthSession(session);
        setCompanyId(user?.companyId ?? '');
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // ── Load all data when companyId is available ─
  useEffect(() => {
    if (!isAuthLoading) {
      loadAllData(companyId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, isAuthLoading]);

  // ── Data loading ─────────────────────────────
  const loadAllData = useCallback(async (cId: string) => {
    setIsDataLoading(true);

    if (isSupabaseConfigured && cId) {
      // Load from Supabase in parallel
      const [
        customers, employees, inventory, suppliers, branches,
        stockMovements, stockTransfers, attendance, payroll, leaves,
        vouchers, purchases, spaces, spaceBookings, leaseContracts,
        consultingServices, membershipPackages, tenantSubs, serviceBookings,
        accounts, journalEntries, fiscalPeriods, costCenters, auditLogs,
      ] = await Promise.all([
        customerSvc.getCustomers(cId),
        employeeSvc.getEmployees(cId),
        inventorySvc.getInventoryItems(cId),
        supplierSvc.getSuppliers(cId),
        companyS.getBranches(cId),
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
        accountingSvc.getCostCenters(cId),
        auditSvc.getAuditLogs(cId),
      ]);

      setCustomersListState(customers);
      setEmployeesListState(employees);
      setInventoryListState(inventory);
      setSuppliersListState(suppliers);
      setBranchesListState(branches);
      setStockMovementsListState(stockMovements);
      setStockTransfersListState(stockTransfers as StockTransfer[]);
      setAttendanceListState(attendance);
      setPayrollSlipsListState(payroll);
      setLeaveRequestsListState(leaves);
      setVouchersListState(vouchers);
      setPurchasesListState(purchases);
      setRentalSpacesListState(spaces);
      setSpaceBookingsListState(spaceBookings);
      setLeaseContractsListState(leaseContracts);
      setConsultingServicesListState(consultingServices);
      setMembershipPackagesListState(membershipPackages);
      setTenantSubscriptionsListState(tenantSubs);
      setServiceBookingsListState(serviceBookings);
      setAccountsListState(accounts);
      setJournalEntriesListState(journalEntries);
      setFiscalPeriodsListState(fiscalPeriods);
      setCostCentersListState(costCenters);
      setAuditLogsListState(auditLogs);

    } else {
      // Fallback: Load from localStorage
      setCustomersListState(loadCustomers());
      setEmployeesListState(loadEmployees());
      setInventoryListState(loadInventory());
      setSuppliersListState(loadSuppliers());
      setBranchesListState(loadBranches());
      setStockMovementsListState(loadStockMovements());
      setAttendanceListState(loadAttendanceRecords());
      setPayrollSlipsListState(loadPayrollSlips());
      setLeaveRequestsListState(loadLeaveRequests());
      setVouchersListState(loadVouchers());
      setPurchasesListState(loadPurchases());
      setRentalSpacesListState(loadRentalSpaces());
      setSpaceBookingsListState(loadSpaceBookings());
      setLeaseContractsListState(loadLeaseContracts());
      setConsultingServicesListState(loadConsultingServices());
      setMembershipPackagesListState(loadMembershipPackages());
      setTenantSubscriptionsListState(loadTenantSubscriptions());
      setServiceBookingsListState(loadServiceBookings());
      setAccountsListState(loadAccounts());
      setJournalEntriesListState(loadJournalEntries());
      setFiscalPeriodsListState(loadFiscalPeriods());
      setCostCentersListState(loadCostCenters());
      setAuditLogsListState(loadAuditLogs());
      setSchedulesListState(loadRecurringSchedules());
    }

    setIsDataLoading(false);
  }, []);

  const refreshAllData = useCallback(() => loadAllData(companyIdRef.current), [loadAllData]);

  // ── Supabase-aware save wrappers ─────────────
  // Each setter: updates state + persists to Supabase (or localStorage fallback)

  const setCustomersList = useCallback((customers: Customer[]) => {
    setCustomersListState(customers);
    if (!isSupabaseConfigured || !companyIdRef.current) {
      saveCustomers(customers);
    }
    // Individual upserts are done in component handlers
  }, []);

  const setEmployeesList = useCallback((employees: Employee[]) => {
    setEmployeesListState(employees);
    if (!isSupabaseConfigured || !companyIdRef.current) saveEmployees(employees);
  }, []);

  const setInventoryList = useCallback((items: InventoryItem[]) => {
    setInventoryListState(items);
    if (!isSupabaseConfigured || !companyIdRef.current) saveInventory(items);
  }, []);

  const setSuppliersList = useCallback((suppliers: Supplier[]) => {
    setSuppliersListState(suppliers);
    if (!isSupabaseConfigured || !companyIdRef.current) saveSuppliers(suppliers);
  }, []);

  const setBranchesList = useCallback((branches: Branch[]) => {
    setBranchesListState(branches);
    if (!isSupabaseConfigured || !companyIdRef.current) saveBranches(branches);
  }, []);

  const setStockMovementsList = useCallback((movements: StockMovement[]) => {
    setStockMovementsListState(movements);
    if (!isSupabaseConfigured || !companyIdRef.current) saveStockMovements(movements);
  }, []);

  const setStockTransfersList = useCallback((transfers: StockTransfer[]) => {
    setStockTransfersListState(transfers);
    // Transfers are written individually via inventoryService
  }, []);

  const setAttendanceList = useCallback((records: AttendanceRecord[]) => {
    setAttendanceListState(records);
    if (!isSupabaseConfigured || !companyIdRef.current) saveAttendanceRecords(records);
  }, []);

  const setPayrollSlipsList = useCallback((slips: PayrollSlip[]) => {
    setPayrollSlipsListState(slips);
    if (!isSupabaseConfigured || !companyIdRef.current) savePayrollSlips(slips);
  }, []);

  const setLeaveRequestsList = useCallback((requests: LeaveRequest[]) => {
    setLeaveRequestsListState(requests);
    if (!isSupabaseConfigured || !companyIdRef.current) saveLeaveRequests(requests);
  }, []);

  const setVouchersList = useCallback((vouchers: ReceiptVoucher[]) => {
    setVouchersListState(vouchers);
    if (!isSupabaseConfigured || !companyIdRef.current) saveVouchers(vouchers);
  }, []);

  const setPurchasesList = useCallback((purchases: PurchaseInvoice[]) => {
    setPurchasesListState(purchases);
    if (!isSupabaseConfigured || !companyIdRef.current) savePurchases(purchases);
  }, []);

  const setRentalSpacesList = useCallback((spaces: RentalSpace[]) => {
    setRentalSpacesListState(spaces);
    if (!isSupabaseConfigured || !companyIdRef.current) saveRentalSpaces(spaces);
  }, []);

  const setSpaceBookingsList = useCallback((bookings: SpaceBooking[]) => {
    setSpaceBookingsListState(bookings);
    if (!isSupabaseConfigured || !companyIdRef.current) saveSpaceBookings(bookings);
  }, []);

  const setLeaseContractsList = useCallback((contracts: LeaseContract[]) => {
    setLeaseContractsListState(contracts);
    if (!isSupabaseConfigured || !companyIdRef.current) saveLeaseContracts(contracts);
  }, []);

  const setConsultingServicesList = useCallback((services: ConsultingService[]) => {
    setConsultingServicesListState(services);
    if (!isSupabaseConfigured || !companyIdRef.current) saveConsultingServices(services);
  }, []);

  const setMembershipPackagesList = useCallback((packages: MembershipPackage[]) => {
    setMembershipPackagesListState(packages);
    if (!isSupabaseConfigured || !companyIdRef.current) saveMembershipPackages(packages);
  }, []);

  const setTenantSubscriptionsList = useCallback((subs: TenantSubscription[]) => {
    setTenantSubscriptionsListState(subs);
    if (!isSupabaseConfigured || !companyIdRef.current) saveTenantSubscriptions(subs);
  }, []);

  const setServiceBookingsList = useCallback((bookings: ServiceBooking[]) => {
    setServiceBookingsListState(bookings);
    if (!isSupabaseConfigured || !companyIdRef.current) saveServiceBookings(bookings);
  }, []);

  const setAccountsList = useCallback((accounts: Account[]) => {
    setAccountsListState(accounts);
    if (!isSupabaseConfigured || !companyIdRef.current) saveAccounts(accounts);
  }, []);

  const setJournalEntriesList = useCallback((entries: JournalEntry[]) => {
    setJournalEntriesListState(entries);
    if (!isSupabaseConfigured || !companyIdRef.current) saveJournalEntries(entries);
  }, []);

  const setFiscalPeriodsList = useCallback((periods: FiscalPeriod[]) => {
    setFiscalPeriodsListState(periods);
    if (!isSupabaseConfigured || !companyIdRef.current) saveFiscalPeriods(periods);
  }, []);

  const setCostCentersList = useCallback((centers: CostCenter[]) => {
    setCostCentersListState(centers);
    if (!isSupabaseConfigured || !companyIdRef.current) saveCostCenters(centers);
  }, []);

  const setAuditLogsList = useCallback((logs: AuditLogEntry[]) => {
    setAuditLogsListState(logs);
    if (!isSupabaseConfigured || !companyIdRef.current) saveAuditLogs(logs);
  }, []);

  const setCompanySettings = useCallback((settings: CompanySettings) => {
    setCompanySettingsState(settings);
    saveCompanySettings(settings);
  }, []);

  const setSchedulesList = useCallback((schedules: RecurringSchedule[]) => {
    setSchedulesListState(schedules);
    saveRecurringSchedules(schedules);
  }, []);

  const handleSignOut = useCallback(async () => {
    const { signOut } = await import('../lib/supabase/authService');
    await signOut();
    setAuthUser(null);
    setAuthSession(null);
    setCompanyId('');
  }, []);

  // ── Realtime subscriptions ───────────────────
  useEffect(() => {
    if (!isSupabaseConfigured || !companyId) return;

    const channel = supabase
      .channel(`erp-company-${companyId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'customers',
        filter: `company_id=eq.${companyId}`,
      }, () => {
        customerSvc.getCustomers(companyId).then(setCustomersListState);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'products',
        filter: `company_id=eq.${companyId}`,
      }, () => {
        inventorySvc.getInventoryItems(companyId).then(setInventoryListState);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'employees',
        filter: `company_id=eq.${companyId}`,
      }, () => {
        employeeSvc.getEmployees(companyId).then(setEmployeesListState);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'journal_entries',
        filter: `company_id=eq.${companyId}`,
      }, () => {
        accountingSvc.getJournalEntries(companyId).then(setJournalEntriesListState);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pos_orders',
        filter: `company_id=eq.${companyId}`,
      }, () => {
        // POS Order updated in Realtime
        purchasesSvc.getVouchers(companyId).then(setVouchersListState);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cashier_shifts',
        filter: `company_id=eq.${companyId}`,
      }, () => {
        // Cashier shift state change
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'activities',
        filter: `company_id=eq.${companyId}`,
      }, () => {
        // CRM Activity updated in Realtime
        customerSvc.getCustomers(companyId).then(setCustomersListState);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leads',
        filter: `company_id=eq.${companyId}`,
      }, () => {
        // Lead state change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId]);

  // ── Context value ────────────────────────────
  const contextValue: ERPDataContextType = {
    authUser, authSession, companyId, isAuthLoading,
    isDataLoading,
    customersList, employeesList, inventoryList, suppliersList, branchesList,
    stockMovementsList, stockTransfersList, attendanceList, payrollSlipsList,
    leaveRequestsList, vouchersList, purchasesList, rentalSpacesList, spaceBookingsList,
    leaseContractsList, consultingServicesList, membershipPackagesList,
    tenantSubscriptionsList, serviceBookingsList, accountsList, journalEntriesList,
    fiscalPeriodsList, costCentersList, auditLogsList, companySettings, schedulesList,
    setCustomersList, setEmployeesList, setInventoryList, setSuppliersList,
    setBranchesList, setStockMovementsList, setStockTransfersList, setAttendanceList,
    setPayrollSlipsList, setLeaveRequestsList, setVouchersList, setPurchasesList,
    setRentalSpacesList, setSpaceBookingsList, setLeaseContractsList,
    setConsultingServicesList, setMembershipPackagesList, setTenantSubscriptionsList,
    setServiceBookingsList, setAccountsList, setJournalEntriesList,
    setFiscalPeriodsList, setCostCentersList, setAuditLogsList,
    setCompanySettings, setSchedulesList,
    refreshAllData,
    signOut: handleSignOut,
  };

  return (
    <ERPDataContext.Provider value={contextValue}>
      {children}
    </ERPDataContext.Provider>
  );
}
