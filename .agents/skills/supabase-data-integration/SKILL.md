---
name: supabase-data-integration
description: Comprehensive Supabase data integration, synchronization, offline-first architecture, IndexedDB offline queue, idempotency, and audit procedures for Deshal ERP.
---

# Supabase Data Integration, Synchronization & Offline-First Skill

Use this skill whenever performing tasks related to Supabase data integration, database connectivity audit, offline-first architecture, IndexedDB offline queueing, background synchronization, conflict resolution, or RLS verification in Deshal ERP.

---

## 🎯 Architecture Principles

1. **Source of Truth**: Supabase PostgreSQL is the absolute source of truth for all operational business data.
2. **React State**: Used strictly for transient UI state, loading indicators, and form drafts.
3. **Offline Storage (IndexedDB)**: Used as a local read cache and an offline mutation queue (`offline_queue`), NEVER as a secondary independent database.
4. **LocalStorage**: Reserved only for non-sensitive user preferences (language, active theme).
5. **Idempotency & Deduplication**: Every offline mutation payload MUST include a unique `operation_id` (Idempotency Key) to prevent duplicate insertion upon automatic synchronization.
6. **Double-Entry & Security Rules**: Offline execution MUST NOT bypass RLS, user authorization, or double-entry accounting invariants.

---

## 🔄 Data Flow Architecture

```text
                DESHAL ERP
                     │
                     ▼
              React / UI Layer
                     │
                     ▼
          Application Service Layer
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
      Online Path          Offline Path
          │                     │
          ▼                     ▼
      Supabase             IndexedDB Cache
          │                     │
          │                Offline Queue (idempotency key)
          │                     │
          └──────────┬──────────┘
                     ▼
               Sync Engine (Exponential Backoff)
                     │
                     ▼
              Supabase PostgreSQL
                     │
                     ▼
            RLS / Constraints / Triggers
```

---

## 📋 Mandatory Audit & Repair Checklist

### 1. Connection & Credentials
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client code or persistent browser storage.
- Ensure safe fallback between Vite `import.meta.env` and Node `process.env`.

### 2. Service Layer Standardization
Every module MUST route CRUD through its designated service layer in `src/lib/supabase/`:
- `authService.ts` (Auth & Session management)
- `companyService.ts` (Company & Branch management)
- `customerService.ts` & `crmService.ts` (Customers, Leads, Activities)
- `supplierService.ts` & `purchasesService.ts` (Suppliers, POs, Invoices, Vouchers)
- `inventoryService.ts` (Items, Movements, Stock Transfers)
- `accountingService.ts` (Chart of Accounts, Journal Entries, Reversals, Fiscal Periods)
- `employeeService.ts` & `hrService.ts` (Employees, Attendance, Payroll, Kiosk)
- `posService.ts` (POS Orders, Cashier Shifts, Held Carts)
- `spacesService.ts` (Spaces, Bookings, Lease Contracts, Services, Subscriptions)
- `requestsService.ts` (Requests, Workflow Approvals, Documents)
- `auditService.ts` (Audit Trail Logging)

### 3. Offline-First Queue Requirements
When offline:
- Enqueue mutation with status `PENDING`, payload, client timestamp, user ID, device ID, and unique `operation_id`.
- When connectivity resumes, trigger `SyncEngine.processQueue()`.
- Use exponential backoff (e.g. 1s, 2s, 4s, 8s, max 3 retries) before marking operation as `FAILED`.
- Report status to UI (`Online`, `Syncing`, `Offline`, `Sync Error`).

---

## 🧪 Verification Commands

```bash
# 1. Type Safety Check
npx tsc --noEmit

# 2. Financial & Integration Test Suite
npm run test:finance

# 3. Production Bundle Build Check
npm run build
```
