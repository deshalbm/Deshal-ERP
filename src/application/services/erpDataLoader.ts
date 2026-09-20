/**
 * ERP Data Loader Application Service — Deshal ERP
 * Pure orchestration service for loading ERP entity data.
 * Coordinates entity loaders by delegating to domain Supabase services or storage fallbacks.
 *
 * Enforces:
 * - Clean Architecture boundaries (no duplicated query logic, no business rules)
 * - Error mapping via mapSupabaseError
 * - Request cancellation via AbortSignal
 * - Strict distinction between Supabase unconfigured vs runtime request failures
 */

import { isSupabaseConfigured } from '../../lib/supabase/client';
import { mapSupabaseError, ApiErrorResult } from '../../lib/supabase/errorMapper';
import * as customerSvc from '../../lib/supabase/customerService';
import * as employeeSvc from '../../lib/supabase/employeeService';
import * as inventorySvc from '../../lib/supabase/inventoryService';
import * as supplierSvc from '../../lib/supabase/supplierService';
import * as companyS from '../../lib/supabase/companyService';
import * as hrSvc from '../../lib/supabase/hrService';
import * as accountingSvc from '../../lib/supabase/accountingService';
import * as purchasesSvc from '../../lib/supabase/purchasesService';
import * as spacesSvc from '../../lib/supabase/spacesService';
import * as auditSvc from '../../lib/supabase/auditService';
import * as requestsSvc from '../../lib/supabase/requestsService';

import {
  loadCustomers,
  loadEmployees,
  loadInventory,
  loadSuppliers,
  loadBranches,
  loadStockMovements,
  loadAttendanceRecords,
  loadPayrollSlips,
  loadLeaveRequests,
  loadVouchers,
  loadPurchases,
  loadRentalSpaces,
  loadSpaceBookings,
  loadLeaseContracts,
  loadConsultingServices,
  loadMembershipPackages,
  loadTenantSubscriptions,
  loadServiceBookings,
  loadCompanySettings,
  loadRecurringSchedules,
  clearAllLocalStorage,
  saveEmployees,
  saveAttendanceRecords,
  savePayrollSlips,
  saveLeaveRequests,
} from '../../utils/storage';
import {
  loadAccounts,
  loadJournalEntries,
  loadFiscalPeriods,
  loadCostCenters,
} from '../../utils/accountingStorage';
import { loadAuditLogs } from '../../utils/auditLogger';
import {
  loadAttendanceMovementLogs,
  saveAttendanceMovementLogs,
} from '../../utils/attendanceStorage';

import type {
  Customer, Employee, InventoryItem, StockMovement, StockTransfer,
  Supplier, Branch, AttendanceRecord, AttendanceMovementLog, PayrollSlip, LeaveRequest,
  ReceiptVoucher, PurchaseInvoice, RentalSpace, SpaceBooking,
  LeaseContract, ConsultingService, MembershipPackage, TenantSubscription,
  ServiceBooking, Account, JournalEntry, FiscalPeriod, CostCenter,
  AuditLogEntry, CompanySettings, RecurringSchedule,
} from '../../types';

export interface ERPDataBatch {
  customers: Customer[];
  employees: Employee[];
  inventory: InventoryItem[];
  suppliers: Supplier[];
  branches: Branch[];
  stockMovements: StockMovement[];
  stockTransfers: StockTransfer[];
  attendance: AttendanceRecord[];
  movementLogs: AttendanceMovementLog[];
  payroll: PayrollSlip[];
  leaves: LeaveRequest[];
  vouchers: ReceiptVoucher[];
  purchases: PurchaseInvoice[];
  spaces: RentalSpace[];
  spaceBookings: SpaceBooking[];
  leaseContracts: LeaseContract[];
  consultingServices: ConsultingService[];
  membershipPackages: MembershipPackage[];
  tenantSubs: TenantSubscription[];
  serviceBookings: ServiceBooking[];
  accounts: Account[];
  journalEntries: JournalEntry[];
  fiscalPeriods: FiscalPeriod[];
  costCenters: CostCenter[];
  auditLogs: AuditLogEntry[];
  companySettings: CompanySettings;
  schedules: RecurringSchedule[];
  errors: ApiErrorResult[];
}

/**
 * Safely executes a single data fetching promise with error mapping & cancellation check.
 */
async function safeFetch<T>(
  fetcher: () => Promise<T>,
  fallback: T,
  signal?: AbortSignal
): Promise<{ data: T; error: ApiErrorResult | null }> {
  if (signal?.aborted) {
    return { data: fallback, error: null };
  }
  try {
    const data = await fetcher();
    if (signal?.aborted) {
      return { data: fallback, error: null };
    }
    return { data: data ?? fallback, error: null };
  } catch (err) {
    if (signal?.aborted) {
      return { data: fallback, error: null };
    }
    const mapped = mapSupabaseError(err);
    return { data: fallback, error: mapped };
  }
}

/**
 * Clean filter for legacy employee mock IDs.
 */
function filterCleanEmployees(employees: Employee[]): Employee[] {
  if (!Array.isArray(employees)) return [];
  return employees.filter(
    (e: any) =>
      e &&
      !['emp-1', 'emp-2', 'emp-3', 'emp-4', 'emp-5'].includes(e.id) &&
      !['EMP-001', 'EMP-002', 'EMP-003', 'EMP-004', 'EMP-005'].includes(e.employeeCode)
  );
}

/**
 * Orchestrates fetching all ERP entities for a given company ID.
 */
export async function fetchAllERPData(
  companyId: string,
  signal?: AbortSignal
): Promise<ERPDataBatch> {
  // 1. Fallback mode: Supabase is unconfigured
  if (!isSupabaseConfigured || !companyId) {
    return {
      customers: loadCustomers(),
      employees: loadEmployees(),
      inventory: loadInventory(),
      suppliers: loadSuppliers(),
      branches: loadBranches(),
      stockMovements: loadStockMovements(),
      stockTransfers: [],
      attendance: loadAttendanceRecords(),
      movementLogs: loadAttendanceMovementLogs(),
      payroll: loadPayrollSlips(),
      leaves: loadLeaveRequests(),
      vouchers: loadVouchers(),
      purchases: loadPurchases(),
      spaces: loadRentalSpaces(),
      spaceBookings: loadSpaceBookings(),
      leaseContracts: loadLeaseContracts(),
      consultingServices: loadConsultingServices(),
      membershipPackages: loadMembershipPackages(),
      tenantSubs: loadTenantSubscriptions(),
      serviceBookings: loadServiceBookings(),
      accounts: loadAccounts(),
      journalEntries: loadJournalEntries(),
      fiscalPeriods: loadFiscalPeriods(),
      costCenters: loadCostCenters(),
      auditLogs: loadAuditLogs(),
      companySettings: loadCompanySettings(),
      schedules: loadRecurringSchedules(),
      errors: [],
    };
  }

  // Pure Supabase mode: attempt background seeding if core tables are unpopulated
  if (companyId) {
    const { seedDemoDataToSupabase } = await import('../../lib/supabase/seedDemoData');
    seedDemoDataToSupabase(companyId).catch((e) => console.warn('[ERPDataLoader] Auto-seed notice:', e));
  }

  const errors: ApiErrorResult[] = [];

  // Execute all entity fetches safely in parallel
  const [
    rCustomers, rEmployees, rInventory, rSuppliers, rBranches,
    rMovements, rTransfers, rAttendance, rMovementLogs, rPayroll, rLeaves,
    rVouchers, rPurchases, rSpaces, rSpaceBookings, rLeaseContracts,
    rConsultingServices, rMembershipPackages, rTenantSubs, rServiceBookings,
    rAccounts, rJournalEntries, rFiscalPeriods, rCostCenters, rAuditLogs, rRequests,
  ] = await Promise.all([
    safeFetch(() => customerSvc.getCustomers(companyId), [], signal),
    safeFetch(() => employeeSvc.getEmployees(companyId), [], signal),
    safeFetch(() => inventorySvc.getInventoryItems(companyId), [], signal),
    safeFetch(() => supplierSvc.getSuppliers(companyId), [], signal),
    safeFetch(() => companyS.getBranches(companyId), [], signal),
    safeFetch(() => inventorySvc.getStockMovements(companyId), [], signal),
    safeFetch(() => inventorySvc.getStockTransfers(companyId), [], signal),
    safeFetch(() => hrSvc.getAttendanceRecords(companyId), [], signal),
    safeFetch(() => hrSvc.getAttendanceMovementLogs(companyId), [], signal),
    safeFetch(() => hrSvc.getPayrollSlips(companyId), [], signal),
    safeFetch(() => hrSvc.getLeaveRequests(companyId), [], signal),
    safeFetch(() => purchasesSvc.getVouchers(companyId), [], signal),
    safeFetch(() => purchasesSvc.getPurchases(companyId), [], signal),
    safeFetch(() => spacesSvc.getRentalSpaces(companyId), [], signal),
    safeFetch(() => spacesSvc.getSpaceBookings(companyId), [], signal),
    safeFetch(() => spacesSvc.getLeaseContracts(companyId), [], signal),
    safeFetch(() => spacesSvc.getConsultingServices(companyId), [], signal),
    safeFetch(() => spacesSvc.getMembershipPackages(companyId), [], signal),
    safeFetch(() => spacesSvc.getTenantSubscriptions(companyId), [], signal),
    safeFetch(() => spacesSvc.getServiceBookings(companyId), [], signal),
    safeFetch(() => accountingSvc.getAccounts(companyId), [], signal),
    safeFetch(() => accountingSvc.getJournalEntries(companyId), [], signal),
    safeFetch(() => accountingSvc.getFiscalPeriods(companyId), [], signal),
    safeFetch(() => accountingSvc.getCostCenters(companyId), [], signal),
    safeFetch(() => auditSvc.getAuditLogs(companyId), [], signal),
    safeFetch(() => requestsSvc.getEmployeeRequests(companyId), [], signal),
  ]);

  if (signal?.aborted) {
    return {
      customers: [], employees: [], inventory: [], suppliers: [], branches: [],
      stockMovements: [], stockTransfers: [], attendance: [], movementLogs: [],
      payroll: [], leaves: [], vouchers: [], purchases: [], spaces: [],
      spaceBookings: [], leaseContracts: [], consultingServices: [],
      membershipPackages: [], tenantSubs: [], serviceBookings: [], accounts: [],
      journalEntries: [], fiscalPeriods: [], costCenters: [], auditLogs: [],
      companySettings: loadCompanySettings(), schedules: [], errors: [],
    };
  }

  // Collect any non-null error results
  const fetchResults = [
    rCustomers, rEmployees, rInventory, rSuppliers, rBranches,
    rMovements, rTransfers, rAttendance, rMovementLogs, rPayroll, rLeaves,
    rVouchers, rPurchases, rSpaces, rSpaceBookings, rLeaseContracts,
    rConsultingServices, rMembershipPackages, rTenantSubs, rServiceBookings,
    rAccounts, rJournalEntries, rFiscalPeriods, rCostCenters, rAuditLogs, rRequests,
  ];

  fetchResults.forEach((res) => {
    if (res.error) errors.push(res.error);
  });

  // Employee post-processing & local persistence sync
  const cleanEmps = filterCleanEmployees(rEmployees.data);
  const finalEmployees = cleanEmps.length > 0 ? cleanEmps : loadEmployees();
  if (cleanEmps.length > 0) {
    saveEmployees(cleanEmps);
  }

  if (rAttendance.data.length > 0) saveAttendanceRecords(rAttendance.data);
  if (rMovementLogs.data.length > 0) saveAttendanceMovementLogs(rMovementLogs.data);
  if (rPayroll.data.length > 0) savePayrollSlips(rPayroll.data);
  if (rLeaves.data.length > 0) saveLeaveRequests(rLeaves.data);

  const fallbackBranches = loadBranches();
  const fallbackCustomers = loadCustomers();
  const fallbackInventory = loadInventory();
  const fallbackSuppliers = loadSuppliers();
  const fallbackVouchers = loadVouchers();
  const fallbackSpaces = loadRentalSpaces();
  const fallbackServices = loadConsultingServices();
  const fallbackAccounts = loadAccounts();

  return {
    customers: rCustomers.data.length > 0 ? rCustomers.data : fallbackCustomers,
    employees: finalEmployees,
    inventory: rInventory.data.length > 0 ? rInventory.data : fallbackInventory,
    suppliers: rSuppliers.data.length > 0 ? rSuppliers.data : fallbackSuppliers,
    branches: rBranches.data.length > 0 ? rBranches.data : fallbackBranches,
    stockMovements: rMovements.data,
    stockTransfers: rTransfers.data as StockTransfer[],
    attendance: rAttendance.data.length > 0 ? rAttendance.data : loadAttendanceRecords(),
    movementLogs: rMovementLogs.data,
    payroll: rPayroll.data.length > 0 ? rPayroll.data : loadPayrollSlips(),
    leaves: rLeaves.data.length > 0 ? rLeaves.data : loadLeaveRequests(),
    vouchers: rVouchers.data.length > 0 ? rVouchers.data : fallbackVouchers,
    purchases: rPurchases.data,
    spaces: rSpaces.data.length > 0 ? rSpaces.data : fallbackSpaces,
    spaceBookings: rSpaceBookings.data,
    leaseContracts: rLeaseContracts.data,
    consultingServices: rConsultingServices.data.length > 0 ? rConsultingServices.data : fallbackServices,
    membershipPackages: rMembershipPackages.data,
    tenantSubs: rTenantSubs.data,
    serviceBookings: rServiceBookings.data,
    accounts: rAccounts.data.length > 0 ? rAccounts.data : fallbackAccounts,
    journalEntries: rJournalEntries.data,
    fiscalPeriods: rFiscalPeriods.data,
    costCenters: rCostCenters.data,
    auditLogs: rAuditLogs.data,
    companySettings: loadCompanySettings(),
    schedules: loadRecurringSchedules(),
    errors,
  };
}
