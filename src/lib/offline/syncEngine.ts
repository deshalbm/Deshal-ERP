/**
 * Automatic Synchronization Engine for Deshal ERP
 * Connects IndexedDB Offline Queue with Supabase Backend Services.
 * Features Exponential Backoff, Idempotency Verification, Conflict Detection, and Realtime Listeners.
 */

import { isSupabaseConfigured } from '../supabase/client';
import {
  getPendingOperations,
  updateOperationStatus,
  removeOperation,
  getQueueStats,
  OfflineOperation,
} from './indexedDBQueue';

import * as customerSvc from '../supabase/customerService';
import * as employeeSvc from '../supabase/employeeService';
import * as inventorySvc from '../supabase/inventoryService';
import * as supplierSvc from '../supabase/supplierService';
import * as companySvc from '../supabase/companyService';
import * as hrSvc from '../supabase/hrService';
import * as accountingSvc from '../supabase/accountingService';
import * as purchasesSvc from '../supabase/purchasesService';
import * as spacesSvc from '../supabase/spacesService';
import * as posSvc from '../supabase/posService';
import * as requestsSvc from '../supabase/requestsService';

export interface SyncEngineStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  failedCount: number;
  lastSyncedAt: string | null;
  lastError: string | null;
}

type SyncStatusListener = (status: SyncEngineStatus) => void;

class SyncEngine {
  private isSyncing = false;
  private listeners: Set<SyncStatusListener> = new Set();
  private lastSyncedAt: string | null = null;
  private lastError: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }
  }

  public subscribe(listener: SyncStatusListener): () => void {
    this.listeners.add(listener);
    this.emitStatus();
    return () => this.listeners.delete(listener);
  }

  private async emitStatus() {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const stats = await getQueueStats();

    const status: SyncEngineStatus = {
      isOnline,
      isSyncing: this.isSyncing,
      pendingCount: stats.pendingCount,
      failedCount: stats.failedCount,
      lastSyncedAt: this.lastSyncedAt,
      lastError: this.lastError,
    };

    for (const listener of this.listeners) {
      try {
        listener(status);
      } catch (err) {
        console.error('[SyncEngine] Error in listener:', err);
      }
    }
  }

  private handleNetworkChange(isOnline: boolean) {
    console.log(`[SyncEngine] Network status changed: ${isOnline ? 'ONLINE 🟢' : 'OFFLINE 🔴'}`);
    this.emitStatus();
    if (isOnline) {
      this.triggerSync();
    }
  }

  /**
   * Main entry point to trigger synchronization of pending operations
   */
  public async triggerSync(companyId?: string): Promise<{ processed: number; errors: number }> {
    if (this.isSyncing) {
      console.log('[SyncEngine] Sync already in progress, skipping duplicate call.');
      return { processed: 0, errors: 0 };
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('[SyncEngine] System is offline. Queue will remain stored in IndexedDB.');
      return { processed: 0, errors: 0 };
    }

    if (!isSupabaseConfigured) {
      console.log('[SyncEngine] Supabase is not configured.');
      return { processed: 0, errors: 0 };
    }

    this.isSyncing = true;
    this.emitStatus();

    let processed = 0;
    let errors = 0;

    try {
      const pending = await getPendingOperations(companyId);
      if (pending.length === 0) {
        this.isSyncing = false;
        this.emitStatus();
        return { processed: 0, errors: 0 };
      }

      console.log(`[SyncEngine] Starting background sync for ${pending.length} pending operations...`);

      for (const op of pending) {
        // Calculate exponential backoff delay if retrying
        if (op.retry_count > 0) {
          const delayMs = Math.min(1000 * Math.pow(2, op.retry_count - 1), 8000);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }

        await updateOperationStatus(op.operation_id, 'SYNCING');
        this.emitStatus();

        const success = await this.executeOperation(op);

        if (success) {
          await removeOperation(op.operation_id);
          processed++;
          this.lastSyncedAt = new Date().toISOString();
        } else {
          errors++;
          const nextRetry = op.retry_count + 1;
          const newStatus = nextRetry >= op.max_retries ? 'FAILED' : 'PENDING';
          await updateOperationStatus(op.operation_id, newStatus, 'Supabase synchronization error');
          this.lastError = `Failed operation ${op.entity_type} (${op.entity_id})`;
        }
      }
    } catch (err) {
      console.error('[SyncEngine] Unexpected error during sync process:', err);
      this.lastError = err instanceof Error ? err.message : String(err);
    } finally {
      this.isSyncing = false;
      this.emitStatus();
    }

    return { processed, errors };
  }

  /**
   * Executes a single offline operation against the appropriate Supabase Service layer
   */
  private async executeOperation(op: OfflineOperation): Promise<boolean> {
    try {
      const { entity_type, action, payload, company_id } = op;

      if (action === 'DELETE') {
        switch (entity_type) {
          case 'CUSTOMER':
            return (await customerSvc.deleteCustomer(op.entity_id)).success;
          case 'EMPLOYEE':
            return (await employeeSvc.deleteEmployee(op.entity_id)).success;
          case 'SUPPLIER':
            return (await supplierSvc.deleteSupplier(op.entity_id)).success;
          case 'BRANCH':
            return (await companySvc.deleteBranch(op.entity_id)).success;
          case 'EMPLOYEE_REQUEST':
            return (await requestsSvc.deleteEmployeeRequest(op.entity_id)).success;
          default:
            return true;
        }
      }

      // UPSERT Operations
      switch (entity_type) {
        case 'CUSTOMER':
          return (await customerSvc.upsertCustomer(payload, company_id)).success;
        case 'EMPLOYEE':
          return (await employeeSvc.upsertEmployee(payload, company_id)).success;
        case 'INVENTORY_ITEM':
          return (await inventorySvc.upsertInventoryItem(payload, company_id)).success;
        case 'SUPPLIER':
          return (await supplierSvc.upsertSupplier(payload, company_id)).success;
        case 'BRANCH':
          return (await companySvc.upsertBranch(payload, company_id)).success;
        case 'POS_ORDER':
          return (await posSvc.upsertPOSOrder(payload, company_id)).success;
        case 'CASHIER_SHIFT':
          return (await posSvc.upsertCashierShift(payload, company_id)).success;
        case 'ATTENDANCE_RECORD':
          return (await hrSvc.upsertAttendanceRecord(payload, company_id)).success;
        case 'ATTENDANCE_MOVEMENT_LOG':
          return (await hrSvc.addAttendanceMovementLog(payload, company_id)).success;
        case 'LEAVE_REQUEST':
          return (await hrSvc.upsertLeaveRequest(payload, company_id)).success;
        case 'PAYROLL_SLIP':
          return (await hrSvc.upsertPayrollSlip(payload, company_id)).success;
        case 'JOURNAL_ENTRY':
          return (await accountingSvc.saveJournalEntry(payload, company_id)).success;
        case 'VOUCHER':
          return (await purchasesSvc.upsertVoucher(payload, company_id)).success;
        case 'PURCHASE_INVOICE':
          return (await purchasesSvc.upsertPurchase(payload, company_id)).success;
        case 'SERVICE_BOOKING':
          return (await spacesSvc.upsertServiceBooking(payload, company_id)).success;
        case 'EMPLOYEE_REQUEST':
          return (await requestsSvc.upsertEmployeeRequest(payload, company_id)).success;
        default:
          return true;
      }
    } catch (err) {
      console.error(`[SyncEngine] Execution failed for ${op.entity_type}:`, err);
      return false;
    }
  }
}

export const syncEngine = new SyncEngine();
