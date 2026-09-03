/**
 * Offline / Online Auto-Sync Manager
 * Handles queuing local mutations when offline, and automatically pushing them
 * to Supabase when network reconnects.
 */

import { isSupabaseConfigured } from './client';
import * as customerSvc from './customerService';
import * as employeeSvc from './employeeService';
import * as inventorySvc from './inventoryService';
import * as supplierSvc from './supplierService';
import * as companySvc from './companyService';
import * as hrSvc from './hrService';
import * as accountingSvc from './accountingService';
import * as purchasesSvc from './purchasesService';
import * as spacesSvc from './spacesService';
import * as posSvc from './posService';
import * as requestsSvc from './requestsService';
import { clearAllLocalStorage } from '../../utils/storage';

export interface OfflineSyncItem {
  id: string;
  entityType:
    | 'CUSTOMER'
    | 'EMPLOYEE'
    | 'INVENTORY_ITEM'
    | 'SUPPLIER'
    | 'BRANCH'
    | 'POS_ORDER'
    | 'CASHIER_SHIFT'
    | 'ATTENDANCE_RECORD'
    | 'ATTENDANCE_MOVEMENT_LOG'
    | 'LEAVE_REQUEST'
    | 'PAYROLL_SLIP'
    | 'JOURNAL_ENTRY'
    | 'VOUCHER'
    | 'PURCHASE_INVOICE'
    | 'SERVICE_BOOKING'
    | 'EMPLOYEE_REQUEST';
  action: 'UPSERT' | 'DELETE';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  companyId: string;
  createdAt: string;
}

const OFFLINE_QUEUE_KEY = 'deshal_offline_sync_queue';

export function getOfflineSyncQueue(): OfflineSyncItem[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOfflineSyncQueue(queue: OfflineSyncItem[]): void {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('[SyncService] Failed to save offline queue:', e);
  }
}

export function enqueueOfflineMutation(item: Omit<OfflineSyncItem, 'id' | 'createdAt'>): void {
  const queue = getOfflineSyncQueue();
  const newItem: OfflineSyncItem = {
    ...item,
    id: `sync-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  queue.push(newItem);
  saveOfflineSyncQueue(queue);
}

/**
 * Flush all offline queued items to Supabase
 */
export async function processOfflineSyncQueue(): Promise<{ processedCount: number; errorsCount: number }> {
  if (!isSupabaseConfigured || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return { processedCount: 0, errorsCount: 0 };
  }

  const queue = getOfflineSyncQueue();
  if (queue.length === 0) return { processedCount: 0, errorsCount: 0 };

  console.log(`[SyncService] Starting auto-sync for ${queue.length} offline queued items...`);

  const remainingQueue: OfflineSyncItem[] = [];
  let processedCount = 0;
  let errorsCount = 0;

  for (const item of queue) {
    try {
      let ok = false;
      const { entityType, payload, companyId } = item;

      switch (entityType) {
        case 'CUSTOMER': {
          const res = await customerSvc.upsertCustomer(payload, companyId);
          ok = res.success;
          break;
        }
        case 'EMPLOYEE': {
          const res = await employeeSvc.upsertEmployee(payload, companyId);
          ok = res.success;
          break;
        }
        case 'INVENTORY_ITEM': {
          const res = await inventorySvc.upsertInventoryItem(payload, companyId);
          ok = res.success;
          break;
        }
        case 'SUPPLIER': {
          const res = await supplierSvc.upsertSupplier(payload, companyId);
          ok = res.success;
          break;
        }
        case 'BRANCH': {
          const res = await companySvc.upsertBranch(payload, companyId);
          ok = res.success;
          break;
        }
        case 'POS_ORDER': {
          const res = await posSvc.upsertPOSOrder(payload, companyId);
          ok = res.success;
          break;
        }
        case 'CASHIER_SHIFT': {
          const res = await posSvc.upsertCashierShift(payload, companyId);
          ok = res.success;
          break;
        }
        case 'ATTENDANCE_RECORD': {
          const res = await hrSvc.upsertAttendanceRecord(payload, companyId);
          ok = res.success;
          break;
        }
        case 'ATTENDANCE_MOVEMENT_LOG': {
          const res = await hrSvc.addAttendanceMovementLog(payload, companyId);
          ok = res.success;
          break;
        }
        case 'LEAVE_REQUEST': {
          const res = await hrSvc.upsertLeaveRequest(payload, companyId);
          ok = res.success;
          break;
        }
        case 'PAYROLL_SLIP': {
          const res = await hrSvc.upsertPayrollSlip(payload, companyId);
          ok = res.success;
          break;
        }
        case 'JOURNAL_ENTRY': {
          const res = await accountingSvc.saveJournalEntry(payload, companyId);
          ok = res.success;
          break;
        }
        case 'VOUCHER': {
          const res = await purchasesSvc.upsertVoucher(payload, companyId);
          ok = res.success;
          break;
        }
        case 'PURCHASE_INVOICE': {
          const res = await purchasesSvc.upsertPurchase(payload, companyId);
          ok = res.success;
          break;
        }
        case 'SERVICE_BOOKING': {
          const res = await spacesSvc.upsertServiceBooking(payload, companyId);
          ok = res.success;
          break;
        }
        case 'EMPLOYEE_REQUEST': {
          const res = await requestsSvc.upsertEmployeeRequest(payload, companyId);
          ok = res.success;
          break;
        }
        default:
          ok = true;
      }

      if (ok) {
        processedCount++;
      } else {
        remainingQueue.push(item);
        errorsCount++;
      }
    } catch (err) {
      console.error('[SyncService] Failed syncing item:', item, err);
      remainingQueue.push(item);
      errorsCount++;
    }
  }

  saveOfflineSyncQueue(remainingQueue);

  if (remainingQueue.length === 0) {
    // If all offline queue items synced successfully, clean up local storage caches
    clearAllLocalStorage();
  }

  return { processedCount, errorsCount };
}
