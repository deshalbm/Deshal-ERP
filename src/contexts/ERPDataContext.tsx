/**
 * ERP Data Context — Deshal ERP
 * Central React context providing all entities, structured loading state machine,
 * AbortController lifecycle safety, realtime subscriptions, and targeted refreshes.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { isSupabaseConfigured } from '../lib/supabase/client';
import type { Session } from '@supabase/supabase-js';
import type { SupabaseAuthUser } from '../lib/supabase/authService';
import { getCurrentSession } from '../lib/supabase/authService';
import { processOfflineSyncQueue, enqueueOfflineMutation } from '../lib/supabase/syncService';
import { resolveCompanyId } from '../utils/uuid';
import type { ApiErrorResult } from '../lib/supabase/errorMapper';
import { fetchAllERPData } from '../application/services/erpDataLoader';
import { useERPRealtimeSubscriptions } from '../hooks/useERPRealtimeSubscriptions';

import * as customerSvc from '../lib/supabase/customerService';
import * as employeeSvc from '../lib/supabase/employeeService';
import * as inventorySvc from '../lib/supabase/inventoryService';
import * as hrSvc from '../lib/supabase/hrService';
import * as accountingSvc from '../lib/supabase/accountingService';
import * as purchasesSvc from '../lib/supabase/purchasesService';
import * as spacesSvc from '../lib/supabase/spacesService';

// Fallback local storage imports (used when Supabase is not configured)
import {
  saveCustomers,
  saveEmployees,
  saveInventory,
  saveSuppliers,
  saveBranches,
  saveStockMovements,
  saveAttendanceRecords,
  savePayrollSlips,
  saveLeaveRequests,
  saveVouchers,
  savePurchases,
  saveRentalSpaces,
  saveSpaceBookings,
  saveLeaseContracts,
  saveConsultingServices,
  saveMembershipPackages,
  saveTenantSubscriptions,
  saveServiceBookings,
  saveCompanySettings,
  saveRecurringSchedules,
  loadEmployees,
  loadAttendanceRecords,
  loadPayrollSlips,
  loadLeaveRequests,
  loadCompanySettings,
} from '../utils/storage';
import {
  saveAccounts,
  saveJournalEntries,
  saveFiscalPeriods,
  saveCostCenters,
} from '../utils/accountingStorage';
import { saveAuditLogs } from '../utils/auditLogger';
import {
  loadAttendanceMovementLogs,
  saveAttendanceMovementLogs,
} from '../utils/attendanceStorage';
import type {
  Customer, Employee, InventoryItem, StockMovement, StockTransfer,
  Supplier, Branch, AttendanceRecord, AttendanceMovementLog, PayrollSlip, LeaveRequest,
  ReceiptVoucher, PurchaseInvoice, RentalSpace, SpaceBooking,
  LeaseContract, ConsultingService, MembershipPackage, TenantSubscription,
  ServiceBooking, Account, JournalEntry, FiscalPeriod, CostCenter,
  CompanySettings, AuditLogEntry, RecurringSchedule,
} from '../types';

// ──────────────────────────────────────────────
// Context Types & State Machine
// ──────────────────────────────────────────────

export type DataLoadingState = 'INITIAL_LOADING' | 'READY' | 'REFRESHING' | 'ERROR';

export interface ERPDataContextType {
  // Auth
  authUser: SupabaseAuthUser | null;
  authSession: Session | null;
  companyId: string;
  isAuthLoading: boolean;

  // Loading states
  isDataLoading: boolean; // Backward compatibility (isInitialLoading || isRefreshing)
  dataState: DataLoadingState;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  isReady: boolean;
  isError: boolean;
  dataError: ApiErrorResult | null;

  // Core entities
  customersList: Customer[];
  employeesList: Employee[];
  inventoryList: InventoryItem[];
  suppliersList: Supplier[];
  branchesList: Branch[];
  stockMovementsList: StockMovement[];
  stockTransfersList: StockTransfer[];
  attendanceList: AttendanceRecord[];
  movementLogsList: AttendanceMovementLog[];
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
  setMovementLogsList: (logs: AttendanceMovementLog[]) => void;
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

  // Utility & Refreshes
  refreshAllData: () => Promise<void>;
  refreshCustomers: () => Promise<void>;
  refreshInventory: () => Promise<void>;
  refreshEmployees: () => Promise<void>;
  refreshHR: () => Promise<void>;
  refreshAccounting: () => Promise<void>;
  refreshVouchers: () => Promise<void>;
  refreshSpaces: () => Promise<void>;
  signOut: () => Promise<void>;
}

// ──────────────────────────────────────────────
// Context
// ──────────────────────────────────────────────

export const ERPDataContext = createContext<ERPDataContextType | null>(null);

export function useERPData(): ERPDataContextType {
  const ctx = useContext(ERPDataContext);
  if (!ctx) {
    console.warn('[ERPDataContext] useERPData was called outside ERPDataProvider; providing fallback context.');
    return {
      authUser: null,
      authSession: null,
      companyId: '00000000-0000-0000-0000-000000000001',
      isAuthLoading: false,
      isDataLoading: false,
      dataState: 'READY',
      isInitialLoading: false,
      isRefreshing: false,
      isReady: true,
      isError: false,
      dataError: null,
      customersList: [],
      employeesList: [],
      inventoryList: [],
      suppliersList: [],
      branchesList: [],
      stockMovementsList: [],
      stockTransfersList: [],
      attendanceList: [],
      movementLogsList: [],
      payrollSlipsList: [],
      leaveRequestsList: [],
      vouchersList: [],
      purchasesList: [],
      rentalSpacesList: [],
      spaceBookingsList: [],
      leaseContractsList: [],
      consultingServicesList: [],
      membershipPackagesList: [],
      tenantSubscriptionsList: [],
      serviceBookingsList: [],
      accountsList: [],
      journalEntriesList: [],
      fiscalPeriodsList: [],
      costCentersList: [],
      auditLogsList: [],
      companySettings: {} as any,
      schedulesList: [],
      setCustomersList: () => {},
      setEmployeesList: () => {},
      setInventoryList: () => {},
      setSuppliersList: () => {},
      setBranchesList: () => {},
      setStockMovementsList: () => {},
      setStockTransfersList: () => {},
      setAttendanceList: () => {},
      setMovementLogsList: () => {},
      setPayrollSlipsList: () => {},
      setLeaveRequestsList: () => {},
      setVouchersList: () => {},
      setPurchasesList: () => {},
      setRentalSpacesList: () => {},
      setSpaceBookingsList: () => {},
      setLeaseContractsList: () => {},
      setConsultingServicesList: () => {},
      setMembershipPackagesList: () => {},
      setTenantSubscriptionsList: () => {},
      setServiceBookingsList: () => {},
      setAccountsList: () => {},
      setJournalEntriesList: () => {},
      setFiscalPeriodsList: () => {},
      setCostCentersList: () => {},
      setAuditLogsList: () => {},
      setCompanySettings: () => {},
      setSchedulesList: () => {},
      refreshAllData: async () => {},
      refreshCustomers: async () => {},
      refreshInventory: async () => {},
      refreshEmployees: async () => {},
      refreshHR: async () => {},
      refreshAccounting: async () => {},
      refreshVouchers: async () => {},
      refreshSpaces: async () => {},
      signOut: async () => {},
    };
  }
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

  // Loading state machine
  const [dataState, setDataState] = useState<DataLoadingState>('INITIAL_LOADING');
  const [dataError, setDataError] = useState<ApiErrorResult | null>(null);

  // All entity states — initialized from localStorage as fallback
  const [customersList, setCustomersListState] = useState<Customer[]>([]);
  const [employeesList, setEmployeesListState] = useState<Employee[]>(() => loadEmployees());
  const [inventoryList, setInventoryListState] = useState<InventoryItem[]>([]);
  const [suppliersList, setSuppliersListState] = useState<Supplier[]>([]);
  const [branchesList, setBranchesListState] = useState<Branch[]>([]);
  const [stockMovementsList, setStockMovementsListState] = useState<StockMovement[]>([]);
  const [stockTransfersList, setStockTransfersListState] = useState<StockTransfer[]>([]);
  const [attendanceList, setAttendanceListState] = useState<AttendanceRecord[]>(() => loadAttendanceRecords());
  const [movementLogsList, setMovementLogsListState] = useState<AttendanceMovementLog[]>(() => loadAttendanceMovementLogs());
  const [payrollSlipsList, setPayrollSlipsListState] = useState<PayrollSlip[]>(() => loadPayrollSlips());
  const [leaveRequestsList, setLeaveRequestsListState] = useState<LeaveRequest[]>(() => loadLeaveRequests());
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

  // AbortController for in-flight request cancellation & race-condition protection
  const abortControllerRef = useRef<AbortController | null>(null);

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

    return () => {
      isMounted = false;
    };
  }, []);

  // ── Core Data Loading Orchestration ──────────
  const loadAllData = useCallback(async (cId: string, isBackgroundRefresh = false) => {
    // 1. Guard against unauthenticated or missing company ID
    const validCompanyId = resolveCompanyId(cId);
    if (!validCompanyId) {
      setDataState('READY');
      setDataError(null);
      return;
    }

    // 2. Cancel previous in-flight requests to prevent race conditions
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 3. Update loading state machine
    if (isBackgroundRefresh) {
      setDataState('REFRESHING');
    } else {
      setDataState('INITIAL_LOADING');
    }

    try {
      const batch = await fetchAllERPData(validCompanyId, controller.signal);

      // Check if this request was aborted or if company context switched while loading
      if (controller.signal.aborted || companyIdRef.current !== cId) {
        return;
      }

      // Populate local React state
      setCustomersListState(batch.customers);
      setEmployeesListState(batch.employees);
      setInventoryListState(batch.inventory);
      setSuppliersListState(batch.suppliers);
      setBranchesListState(batch.branches);
      setStockMovementsListState(batch.stockMovements);
      setStockTransfersListState(batch.stockTransfers);
      setAttendanceListState(batch.attendance);
      setMovementLogsListState(batch.movementLogs);
      setPayrollSlipsListState(batch.payroll);
      setLeaveRequestsListState(batch.leaves);
      setVouchersListState(batch.vouchers);
      setPurchasesListState(batch.purchases);
      setRentalSpacesListState(batch.spaces);
      setSpaceBookingsListState(batch.spaceBookings);
      setLeaseContractsListState(batch.leaseContracts);
      setConsultingServicesListState(batch.consultingServices);
      setMembershipPackagesListState(batch.membershipPackages);
      setTenantSubscriptionsListState(batch.tenantSubs);
      setServiceBookingsListState(batch.serviceBookings);
      setAccountsListState(batch.accounts);
      setJournalEntriesListState(batch.journalEntries);
      setFiscalPeriodsListState(batch.fiscalPeriods);
      setCostCentersListState(batch.costCenters);
      setAuditLogsListState(batch.auditLogs);
      setCompanySettingsState(batch.companySettings);
      setSchedulesListState(batch.schedules);

      if (batch.errors.length > 0) {
        setDataState('ERROR');
        setDataError(batch.errors[0]);
      } else {
        setDataState('READY');
        setDataError(null);
      }
    } catch (err: any) {
      if (!controller.signal.aborted && companyIdRef.current === cId) {
        setDataState('ERROR');
        setDataError({
          code: 'DATABASE_ERROR',
          message: err?.message || 'فشل تحميل بيانات النظام',
          originalError: err,
        });
      }
    }
  }, []);

  // ── Online / Offline Auto-Sync Listener ──────
  useEffect(() => {
    const handleOnline = async () => {
      if (isSupabaseConfigured && companyIdRef.current) {
        console.log('[ERPDataContext] Network online reconnected! Flushing offline queue to Supabase...');
        const { processedCount } = await processOfflineSyncQueue();
        if (processedCount > 0) {
          loadAllData(companyIdRef.current, true);
        }
      }
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [loadAllData]);

  // ── Load all data when companyId is available ─
  useEffect(() => {
    if (!isAuthLoading && (authSession || authUser) && companyId) {
      loadAllData(companyId);
    } else if (!isAuthLoading && !companyId) {
      setDataState('READY');
      setDataError(null);
    }
  }, [companyId, isAuthLoading, authSession, authUser, loadAllData]);

  // ── Realtime Subscriptions ───────────────────
  useERPRealtimeSubscriptions(companyId, {
    onCustomersUpdate: setCustomersListState,
    onInventoryUpdate: setInventoryListState,
    onEmployeesUpdate: setEmployeesListState,
    onJournalEntriesUpdate: setJournalEntriesListState,
    onVouchersUpdate: setVouchersListState,
  });

  // ── Targeted Entity Refresh Functions ─────────
  const refreshAllData = useCallback(async () => {
    await loadAllData(companyIdRef.current, true);
  }, [loadAllData]);

  const refreshCustomers = useCallback(async () => {
    if (!companyIdRef.current || !isSupabaseConfigured) return;
    try {
      const customers = await customerSvc.getCustomers(companyIdRef.current);
      setCustomersListState(customers);
    } catch (e) {
      console.error('[ERPDataContext] Failed to refresh customers:', e);
    }
  }, []);

  const refreshInventory = useCallback(async () => {
    if (!companyIdRef.current || !isSupabaseConfigured) return;
    try {
      const inventory = await inventorySvc.getInventoryItems(companyIdRef.current);
      setInventoryListState(inventory);
    } catch (e) {
      console.error('[ERPDataContext] Failed to refresh inventory:', e);
    }
  }, []);

  const refreshEmployees = useCallback(async () => {
    if (!companyIdRef.current || !isSupabaseConfigured) return;
    try {
      const employees = await employeeSvc.getEmployees(companyIdRef.current);
      if (employees && employees.length > 0) {
        setEmployeesListState(employees);
        saveEmployees(employees);
      }
    } catch (e) {
      console.error('[ERPDataContext] Failed to refresh employees:', e);
    }
  }, []);

  const refreshHR = useCallback(async () => {
    if (!companyIdRef.current || !isSupabaseConfigured) return;
    const cId = companyIdRef.current;
    try {
      const [att, logs, slips, leaves] = await Promise.all([
        hrSvc.getAttendanceRecords(cId),
        hrSvc.getAttendanceMovementLogs(cId),
        hrSvc.getPayrollSlips(cId),
        hrSvc.getLeaveRequests(cId),
      ]);
      setAttendanceListState(att);
      setMovementLogsListState(logs);
      setPayrollSlipsListState(slips);
      setLeaveRequestsListState(leaves);
    } catch (e) {
      console.error('[ERPDataContext] Failed to refresh HR:', e);
    }
  }, []);

  const refreshAccounting = useCallback(async () => {
    if (!companyIdRef.current || !isSupabaseConfigured) return;
    const cId = companyIdRef.current;
    try {
      const [accounts, entries, periods, centers] = await Promise.all([
        accountingSvc.getAccounts(cId),
        accountingSvc.getJournalEntries(cId),
        accountingSvc.getFiscalPeriods(cId),
        accountingSvc.getCostCenters(cId),
      ]);
      setAccountsListState(accounts);
      setJournalEntriesListState(entries);
      setFiscalPeriodsListState(periods);
      setCostCentersListState(centers);
    } catch (e) {
      console.error('[ERPDataContext] Failed to refresh accounting:', e);
    }
  }, []);

  const refreshVouchers = useCallback(async () => {
    if (!companyIdRef.current || !isSupabaseConfigured) return;
    try {
      const vouchers = await purchasesSvc.getVouchers(companyIdRef.current);
      setVouchersListState(vouchers);
    } catch (e) {
      console.error('[ERPDataContext] Failed to refresh vouchers:', e);
    }
  }, []);

  const refreshSpaces = useCallback(async () => {
    if (!companyIdRef.current || !isSupabaseConfigured) return;
    const cId = companyIdRef.current;
    try {
      const [spaces, bookings, contracts] = await Promise.all([
        spacesSvc.getRentalSpaces(cId),
        spacesSvc.getSpaceBookings(cId),
        spacesSvc.getLeaseContracts(cId),
      ]);
      setRentalSpacesListState(spaces);
      setSpaceBookingsListState(bookings);
      setLeaseContractsListState(contracts);
    } catch (e) {
      console.error('[ERPDataContext] Failed to refresh spaces:', e);
    }
  }, []);

  // ── Setters & Mutations ──────────────────────
  const setCustomersList = useCallback((customers: Customer[]) => {
    setCustomersListState(customers);
    if (!isSupabaseConfigured || !companyIdRef.current) saveCustomers(customers);
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
  }, []);

  const setAttendanceList = useCallback((records: AttendanceRecord[]) => {
    setAttendanceListState(records);
    saveAttendanceRecords(records);
    if (isSupabaseConfigured && companyIdRef.current) {
      const cId = companyIdRef.current;
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        records.forEach((r) => {
          enqueueOfflineMutation({ entityType: 'ATTENDANCE_RECORD', action: 'UPSERT', payload: r, companyId: cId });
        });
      } else {
        records.forEach((r) => {
          hrSvc.upsertAttendanceRecord(r, cId).catch(console.error);
        });
      }
    }
  }, []);

  const setMovementLogsList = useCallback((logs: AttendanceMovementLog[]) => {
    setMovementLogsListState(logs);
    saveAttendanceMovementLogs(logs);
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
    if (!isSupabaseConfigured || !companyIdRef.current) {
      saveVouchers(vouchers);
    } else {
      const cId = companyIdRef.current;
      saveVouchers(vouchers);
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        vouchers.forEach((v) => {
          enqueueOfflineMutation({ entityType: 'VOUCHER', action: 'UPSERT', payload: v, companyId: cId });
        });
      } else {
        vouchers.forEach((v) => {
          purchasesSvc.upsertVoucher(v, cId).catch(console.error);
        });
      }
    }
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
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setAuthUser(null);
    setAuthSession(null);
    setCompanyId('');
    setDataState('READY');
    setDataError(null);
  }, []);

  // Compute backward-compatible loading flags
  const isInitialLoading = dataState === 'INITIAL_LOADING';
  const isRefreshing = dataState === 'REFRESHING';
  const isReady = dataState === 'READY';
  const isError = dataState === 'ERROR';
  const isDataLoading = isInitialLoading || isRefreshing;

  // ── Context value ────────────────────────────
  const contextValue: ERPDataContextType = useMemo(() => ({
    authUser, authSession, companyId, isAuthLoading,
    isDataLoading, dataState, isInitialLoading, isRefreshing, isReady, isError, dataError,
    customersList, employeesList, inventoryList, suppliersList, branchesList,
    stockMovementsList, stockTransfersList, attendanceList, movementLogsList, payrollSlipsList,
    leaveRequestsList, vouchersList, purchasesList, rentalSpacesList, spaceBookingsList,
    leaseContractsList, consultingServicesList, membershipPackagesList,
    tenantSubscriptionsList, serviceBookingsList, accountsList, journalEntriesList,
    fiscalPeriodsList, costCentersList, auditLogsList, companySettings, schedulesList,
    setCustomersList, setEmployeesList, setInventoryList, setSuppliersList,
    setBranchesList, setStockMovementsList, setStockTransfersList, setAttendanceList,
    setMovementLogsList, setPayrollSlipsList, setLeaveRequestsList, setVouchersList, setPurchasesList,
    setRentalSpacesList, setSpaceBookingsList, setLeaseContractsList,
    setConsultingServicesList, setMembershipPackagesList, setTenantSubscriptionsList,
    setServiceBookingsList, setAccountsList, setJournalEntriesList,
    setFiscalPeriodsList, setCostCentersList, setAuditLogsList,
    setCompanySettings, setSchedulesList,
    refreshAllData,
    refreshCustomers,
    refreshInventory,
    refreshEmployees,
    refreshHR,
    refreshAccounting,
    refreshVouchers,
    refreshSpaces,
    signOut: handleSignOut,
  }), [
    authUser, authSession, companyId, isAuthLoading,
    isDataLoading, dataState, isInitialLoading, isRefreshing, isReady, isError, dataError,
    customersList, employeesList, inventoryList, suppliersList, branchesList,
    stockMovementsList, stockTransfersList, attendanceList, movementLogsList, payrollSlipsList,
    leaveRequestsList, vouchersList, purchasesList, rentalSpacesList, spaceBookingsList,
    leaseContractsList, consultingServicesList, membershipPackagesList,
    tenantSubscriptionsList, serviceBookingsList, accountsList, journalEntriesList,
    fiscalPeriodsList, costCentersList, auditLogsList, companySettings, schedulesList,
    setCustomersList, setEmployeesList, setInventoryList, setSuppliersList,
    setBranchesList, setStockMovementsList, setStockTransfersList, setAttendanceList,
    setMovementLogsList, setPayrollSlipsList, setLeaveRequestsList, setVouchersList, setPurchasesList,
    setRentalSpacesList, setSpaceBookingsList, setLeaseContractsList,
    setConsultingServicesList, setMembershipPackagesList, setTenantSubscriptionsList,
    setServiceBookingsList, setAccountsList, setJournalEntriesList,
    setFiscalPeriodsList, setCostCentersList, setAuditLogsList,
    setCompanySettings, setSchedulesList,
    refreshAllData,
    refreshCustomers,
    refreshInventory,
    refreshEmployees,
    refreshHR,
    refreshAccounting,
    refreshVouchers,
    refreshSpaces,
    handleSignOut,
  ]);

  return (
    <ERPDataContext.Provider value={contextValue}>
      {children}
    </ERPDataContext.Provider>
  );
}
