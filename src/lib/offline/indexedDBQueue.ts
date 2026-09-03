/**
 * IndexedDB Offline Queue & Cache Engine for Deshal ERP
 * Replaces localStorage queue with a robust, asynchronous, multi-tab safe IndexedDB database.
 * Supports Idempotency Keys, Retry Counters, Status Tracking, and Local Read Caching.
 */

export interface OfflineOperation {
  operation_id: string; // Idempotency Key (UUID)
  entity_type:
    | 'CUSTOMER'
    | 'EMPLOYEE'
    | 'INVENTORY_ITEM'
    | 'SUPPLIER'
    | 'BRANCH'
    | 'POS_ORDER'
    | 'CASHIER_SHIFT'
    | 'ATTENDANCE_RECORD'
    | 'LEAVE_REQUEST'
    | 'PAYROLL_SLIP'
    | 'JOURNAL_ENTRY'
    | 'VOUCHER'
    | 'PURCHASE_INVOICE'
    | 'SERVICE_BOOKING'
    | 'EMPLOYEE_REQUEST';
  entity_id: string;
  action: 'UPSERT' | 'DELETE';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  company_id: string;
  user_id?: string;
  device_id?: string;
  created_at: string;
  client_timestamp: number;
  retry_count: number;
  max_retries: number;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'CONFLICT';
  last_attempt_at?: string;
  error_message?: string;
}

const DB_NAME = 'DeshalERP_OfflineEngine';
const DB_VERSION = 1;
const QUEUE_STORE = 'offline_queue';
const CACHE_STORE = 'entity_cache';

let dbInstance: IDBDatabase | null = null;

/**
 * Opens or initializes the IndexedDB database connection
 */
export async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Offline Queue Store
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        const queueStore = db.createObjectStore(QUEUE_STORE, { keyPath: 'operation_id' });
        queueStore.createIndex('status', 'status', { unique: false });
        queueStore.createIndex('created_at', 'created_at', { unique: false });
        queueStore.createIndex('company_id', 'company_id', { unique: false });
      }

      // 2. Entity Cache Store
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        const cacheStore = db.createObjectStore(CACHE_STORE, { keyPath: 'cache_key' });
        cacheStore.createIndex('entity_type', 'entity_type', { unique: false });
        cacheStore.createIndex('company_id', 'company_id', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('[IndexedDB] Failed to open database:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Enqueues a new offline operation with an Idempotency Key
 */
export async function enqueueOperation(
  operation: Omit<
    OfflineOperation,
    'operation_id' | 'created_at' | 'client_timestamp' | 'retry_count' | 'max_retries' | 'status'
  >
): Promise<OfflineOperation> {
  const db = await getDB();
  const idempotencyKey = `op-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const fullOperation: OfflineOperation = {
    ...operation,
    operation_id: idempotencyKey,
    created_at: new Date().toISOString(),
    client_timestamp: Date.now(),
    retry_count: 0,
    max_retries: 3,
    status: 'PENDING',
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(QUEUE_STORE);
    const req = store.put(fullOperation);

    req.onsuccess = () => resolve(fullOperation);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieves all pending offline operations ordered by creation time
 */
export async function getPendingOperations(companyId?: string): Promise<OfflineOperation[]> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readonly');
    const store = tx.objectStore(QUEUE_STORE);
    const req = store.getAll();

    req.onsuccess = () => {
      let ops: OfflineOperation[] = req.result ?? [];
      if (companyId) {
        ops = ops.filter((o) => o.company_id === companyId);
      }
      // Return pending or failed (retryable) operations sorted chronologically
      const pending = ops
        .filter((o) => o.status === 'PENDING' || (o.status === 'FAILED' && o.retry_count < o.max_retries))
        .sort((a, b) => a.client_timestamp - b.client_timestamp);
      resolve(pending);
    };

    req.onerror = () => reject(req.error);
  });
}

/**
 * Updates an offline operation's status, retry count, or error message
 */
export async function updateOperationStatus(
  operationId: string,
  status: OfflineOperation['status'],
  errorMessage?: string
): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(QUEUE_STORE);
    const getReq = store.get(operationId);

    getReq.onsuccess = () => {
      const op: OfflineOperation = getReq.result;
      if (!op) {
        resolve();
        return;
      }

      op.status = status;
      op.last_attempt_at = new Date().toISOString();
      if (status === 'FAILED') {
        op.retry_count += 1;
        op.error_message = errorMessage ?? 'Unknown sync failure';
      }

      const putReq = store.put(op);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Removes successfully synced operations from the queue
 */
export async function removeOperation(operationId: string): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(QUEUE_STORE);
    const req = store.delete(operationId);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Returns statistics about the offline queue
 */
export async function getQueueStats(companyId?: string): Promise<{
  pendingCount: number;
  failedCount: number;
  syncedCount: number;
  totalCount: number;
}> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(QUEUE_STORE, 'readonly');
      const store = tx.objectStore(QUEUE_STORE);
      const req = store.getAll();

      req.onsuccess = () => {
        let ops: OfflineOperation[] = req.result ?? [];
        if (companyId) {
          ops = ops.filter((o) => o.company_id === companyId);
        }
        resolve({
          pendingCount: ops.filter((o) => o.status === 'PENDING' || o.status === 'SYNCING').length,
          failedCount: ops.filter((o) => o.status === 'FAILED').length,
          syncedCount: ops.filter((o) => o.status === 'SYNCED').length,
          totalCount: ops.length,
        });
      };

      req.onerror = () => resolve({ pendingCount: 0, failedCount: 0, syncedCount: 0, totalCount: 0 });
    });
  } catch {
    return { pendingCount: 0, failedCount: 0, syncedCount: 0, totalCount: 0 };
  }
}

/**
 * Clears all operations from the offline queue
 */
export async function clearQueue(): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, 'readwrite');
      const store = tx.objectStore(QUEUE_STORE);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('[IndexedDB] Failed to clear queue:', err);
  }
}
