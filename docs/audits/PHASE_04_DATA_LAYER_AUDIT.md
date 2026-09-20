# Deshal ERP — Phase 4 Data Layer & ERPDataContext Audit

## Executive Summary

- **Document Target**: Data Layer Architecture & `ERPDataContext.tsx` Forensic Audit.
- **Date**: 2026-09-19
- **Status**: Comprehensive Baseline Forensic Audit.
- **Scope**: Audit existing state management, Supabase entity queries, localStorage fallbacks, loading lifecycle, error handling, offline queue sync, and consumer context dependencies before refactoring.

---

## A. Current Architecture

The current ERP data layer centers around a single monolithic React context file: `src/contexts/ERPDataContext.tsx` (764 lines).
It sits at the top level of the app provider hierarchy (`main.tsx` → `LanguageProvider` → `ERPDataProvider` → `App`).
It directly couples state management (26 state variables), parallel Supabase API calls (`loadAllData`), local storage fallbacks (`utils/storage.ts`, `utils/accountingStorage.ts`), online/offline window listeners (`processOfflineSyncQueue`), and Supabase Postgres Realtime subscriptions (`supabase.channel(...)`).

---

## B. Responsibility Map

`ERPDataContext.tsx` currently mixes 7 distinct responsibilities in one file:
1. **React State Storage**: Maintains 26 React `useState` hooks for all core domain entity lists.
2. **Auth & Session Initialization**: Calls `getCurrentSession()` on mount and manages `authUser`, `authSession`, and `companyId`.
3. **Data Loading Orchestration**: Calls 26 Supabase service functions in parallel via `Promise.all`.
4. **Local Persistence Sync**: Calls `save*` localStorage functions inside setter functions when Supabase is unconfigured or offline.
5. **Offline Queue Sync**: Flushes `processOfflineSyncQueue()` on network `online` event.
6. **Realtime WebSockets**: Listens to PostgreSQL `postgres_changes` across 8 tables and refetches entities when events arrive.
7. **Entity Setters**: Exposes 26 `set*List` callbacks that combine local state updates with conditional Supabase/offline persistence calls.

---

## C. Dependency Map

### Inbound Dependencies (10 Consuming Contexts + 2 Components)
1. `AccountingContext.tsx`
2. `CRMContext.tsx`
3. `HRContext.tsx`
4. `InventoryContext.tsx`
5. `SpacesContext.tsx`
6. `VouchersContext.tsx`
7. `ContractsContext.tsx`
8. `ServicesContext.tsx`
9. `MasterDataContext.tsx`
10. `AuthContext.tsx`
11. `EmployeesManager.tsx`
12. `SettingsStudio.tsx`

### Outbound Dependencies (10 Supabase Services + 4 Storage Adapters)
- Services: `customerService`, `employeeService`, `inventoryService`, `supplierService`, `companyService`, `hrService`, `accountingService`, `purchasesService`, `spacesService`, `auditService`, `requestsService`, `syncService`.
- Storage Adapters: `storage.ts`, `accountingStorage.ts`, `auditLogger.ts`, `attendanceStorage.ts`.

---

## D. Data Loading Map

1. On component mount or when `companyId` changes:
   - If `!isSupabaseConfigured`: loads 26 entities from `localStorage` synchronously.
   - If `isSupabaseConfigured` & `companyId` is valid UUID: clears legacy localStorage keys, then runs `Promise.all([...26 Supabase calls...])`.
2. Post-processing:
   - Filters clean employees (`emp-1..5` test IDs filtered out).
   - Updates entity state arrays.
   - Saves clean employees, attendance, movement logs, payroll, leave requests into localStorage.

---

## E. Persistence Map

Each setter function (e.g., `setCustomersList`, `setAttendanceList`, `setVouchersList`) follows a dual-mode pattern:
- Updates local React state immediately.
- If `!isSupabaseConfigured`: persists to `localStorage`.
- If `isSupabaseConfigured` & offline (`!navigator.onLine`): enqueues mutation into `enqueueOfflineMutation`.
- If `isSupabaseConfigured` & online: calls appropriate Supabase service upsert method (e.g. `hrSvc.upsertAttendanceRecord`, `purchasesSvc.upsertVoucher`).

---

## F. Sync Map

- Listens for window `online` event.
- When reconnected: calls `processOfflineSyncQueue()`.
- If `processedCount > 0`: re-triggers `loadAllData(companyId)`.

---

## G. Realtime Map

Listens on channel `erp-company-${companyId}` for table changes:
- `customers` → refetches customers
- `products` → refetches inventory
- `employees` → refetches employees
- `journal_entries` → refetches journal entries
- `pos_orders` → refetches vouchers
- `cashier_shifts` → (no-op log)
- `activities` → refetches customers
- `leads` → (no-op log)

---

## H. Auth & Company Lifecycle

- `UNAUTHENTICATED`: `companyId = ''`, `isAuthLoading = false`, zero protected API queries executed.
- `AUTHENTICATED + no valid company`: `companyId = ''`, zero protected API queries executed.
- `AUTHENTICATED + valid company`: `companyId = UUID`, loads company-scoped ERP data.
- `COMPANY A → COMPANY B`: Currently lacks cancellation token (`AbortController`); stale requests from company A could resolve after B and overwrite B's state.

---

## I. Problems Found

1. **No AbortController / Cancellation**: Risk of race conditions during company switches or fast unmounts.
2. **All-or-Nothing Load Failure**: Single unhandled rejection in `Promise.all` corrupts full load sequence.
3. **Binary Loading State**: `isDataLoading: boolean` cannot distinguish initial boot, background refresh, ready, or error states.
4. **Error Masking**: Errors in data loading were not mapped via `mapSupabaseError` or exposed to UI context.
5. **Monolithic Code Placement**: Realtime subscriptions, sync listeners, and loading logic all live inside component render body.

---

## J. Target Architecture

```
        UI Components & Consuming Contexts
                      │
                      ▼
             ERPDataContext & Hook
          (State, AbortController, State Machine)
         ┌────────────┴────────────┐
         ▼                         ▼
   erpDataLoader          useERPRealtimeSubscriptions
(Orchestration Service)         (WebSocket Hook)
         │                         │
         ▼                         ▼
Domain Supabase Services      Supabase Realtime Channel
(customerSvc, hrSvc, etc.)    (erp-company-${companyId})
```

---

## K. Planned Extraction Boundaries

1. **`src/application/services/erpDataLoader.ts`**:
   - Pure orchestration function `fetchAllERPData(companyId, signal)`.
   - Delegates entity queries to existing service files (`customerSvc`, `employeeSvc`, etc.) without duplicating query logic or adding business rules.
   - Wraps individual calls with `mapSupabaseError` to record errors without crashing the whole batch.
   - Handles localStorage fallback ONLY when Supabase is not configured.

2. **`src/hooks/useERPRealtimeSubscriptions.ts`**:
   - Isolate Realtime Postgres channel setup and cleanup (`useEffect` + `supabase.removeChannel`).

3. **`src/contexts/ERPDataContext.tsx`**:
   - Manage state machine (`INITIAL_LOADING`, `READY`, `REFRESHING`, `ERROR`).
   - Expose `dataState`, `isInitialLoading`, `isRefreshing`, `isReady`, `isError`, `dataError`.
   - Manage `AbortController` for company transitions.
   - Provide targeted refresh methods (`refreshCustomers`, `refreshInventory`, `refreshHR`, `refreshAccounting`, `refreshVouchers`, `refreshSpaces`).
   - Maintain 100% backward compatibility for all existing properties and setters.
