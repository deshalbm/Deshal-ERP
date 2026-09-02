# TECHNICAL_DEBT.md
# Deshal ERP — Technical Debt Register

> **Audit Date**: 2026-09-02  
> **Phase**: Read-Only Discovery  

---

## Overview

This document catalogs all identified technical debt in the Deshal ERP codebase. Each item includes:
- **Location**: Where in the code
- **Problem**: What is wrong
- **Risk**: Potential negative impact if unaddressed
- **Effort**: Estimated effort to fix (S=Small, M=Medium, L=Large, XL=Extra-Large)
- **Priority**: Business impact priority (P1=Critical, P2=High, P3=Medium, P4=Low)

---

## Category 1: Architecture Debt

### [ARCH-1] Monolithic App.tsx — Single Responsibility Violation
- **Location**: `src/App.tsx` (2,581 lines)
- **Problem**: Entire application state (35+ useState variables), all event handlers (50+ functions), and routing logic live in one component. This violates the Single Responsibility Principle.
- **Risk**: 
  - Debugging becomes extremely difficult
  - Any change has high risk of unintended side effects
  - Performance: every state update re-renders all children
  - Onboarding new developers is very slow
- **Effort**: XL (requires architectural refactor; feature-by-feature extraction)
- **Priority**: P1

---

### [ARCH-2] No URL-Based Routing
- **Location**: `src/App.tsx` L161 (activeTab state)
- **Problem**: Navigation is tab-state-based, not URL-based. Browser back/forward, deep linking, and bookmarking don't work.
- **Risk**: Poor user experience; users lose their place on refresh
- **Effort**: M (React Router v6 integration + route config)
- **Priority**: P1

---

### [ARCH-3] No Server-Side Database or API
- **Location**: All `src/utils/*Storage.ts` files
- **Problem**: All data is in browser localStorage. No shared backend means:
  - Data not accessible across devices
  - Data lost if browser storage is cleared
  - No multi-user access to shared data
  - localStorage has 5-10MB limit
- **Risk**: Data loss; scalability ceiling; no real multi-user support
- **Effort**: XL (full backend migration; Supabase schema design + API layer)
- **Priority**: P1 (for any serious deployment)

---

### [ARCH-4] No Test Infrastructure
- **Location**: Entire repository
- **Problem**: Zero test files. No unit tests, no integration tests, no E2E tests.
- **Risk**: Every change is a regression risk. Business logic errors in financial calculations go undetected.
- **Effort**: L (set up Vitest + React Testing Library + MSW; write critical tests)
- **Priority**: P1

---

### [ARCH-5] No Code Splitting
- **Location**: `src/App.tsx` + all imports
- **Problem**: All 42+ component files are imported synchronously. The entire application bundle is loaded upfront.
- **Risk**: Slow initial load time; poor LCP (Largest Contentful Paint)
- **Effort**: M (React.lazy + Suspense for each module tab)
- **Priority**: P2

---

## Category 2: Code Quality Debt

### [CODE-1] Massive Component Files
- **Location**: Multiple files
- **Problem**: Component files far exceed recommended sizes:
  - `EmployeesManager.tsx`: 172 KB
  - `storage.ts`: 159 KB (data + seed data + business logic all mixed)
  - `CRMView.tsx`: 132 KB
  - `POSView.tsx`: 109 KB
  - `App.tsx`: 102 KB
- **Risk**: Impossible to read, maintain, or review; high merge conflict risk
- **Effort**: M per file (extract sub-components, separate concerns)
- **Priority**: P2

---

### [CODE-2] Seed Data Mixed with Business Logic in `storage.ts`
- **Location**: `src/utils/storage.ts` (4,141 lines)
- **Problem**: Default/seed data (sample vouchers, customers, inventory items) are hardcoded in the same file as load/save business functions. The file is 159 KB.
- **Risk**: Cannot separate production behavior from demo data; hard to maintain
- **Effort**: M (separate into `src/data/seeds/` directory)
- **Priority**: P2

---

### [CODE-3] `any` Type Usage in Critical Functions
- **Location**: `src/App.tsx` L303, L422-429

```typescript
const handleNavigateWithHistory = (tab: any) => {  // Should be Tab type
const triggerAuditLog = (
  action: any,    // Should be AuditAction
  module: any,    // Should be AuditModule
```

- **Problem**: Using `any` type defeats TypeScript's purpose
- **Risk**: Type errors silently pass through; runtime bugs harder to catch
- **Effort**: S (fix to use proper union types)
- **Priority**: P2

---

### [CODE-4] Business Logic in `loadVouchers()` Persistence Function
- **Location**: `src/utils/storage.ts` `loadVouchers()` function (L562-614)

```typescript
// Inside loadVouchers():
const updatedLineItems = (v.lineItems && v.lineItems.length > 0)
  ? v.lineItems.map(item => ({ ...item, description: TARGET_DESCRIPTION }))  // Overwrites all descriptions!
  : ...;
shouldSave = true;  // Always resaves; performance issue
```

- **Problem**: The load function mutates data (overwrites all line item descriptions to a fixed demo string) and always triggers a resave. This is a side-effecting read operation — it corrupts real data.
- **Risk**: Real user-created voucher descriptions get overwritten with demo text on every load
- **Effort**: S (remove the mutation; separate demo data seeding from reading)
- **Priority**: P1 (data integrity issue)

---

### [CODE-5] Recurring Schedule Execution is Manual Only
- **Location**: `src/components/RecurringSchedulesView.tsx`
- **Problem**: Recurring billing schedules require a user to manually click "Execute Due" to generate invoices. There's no background job or cron.
- **Risk**: Missed recurring invoices; operational risk
- **Effort**: M (implement client-side timer check on app load; long-term: server-side cron)
- **Priority**: P2

---

### [CODE-6] WhatsApp Integration is Experimental
- **Location**: `src/utils/whatsappBaileys.ts` (24.1 KB)
- **Problem**: The WhatsApp Baileys integration requires a self-hosted server (`http://localhost:8000` by default). This is experimental infrastructure not suitable for production without significant ops setup.
- **Risk**: Integration may fail silently; dependency on external self-hosted service
- **Effort**: L (proper error handling + fallback; documentation)
- **Priority**: P3

---

## Category 3: Financial Business Logic Debt

### [FIN-1] No Auto-Posting of Operational Transactions to General Ledger
- **Location**: Everywhere where vouchers/POS/purchases are created
- **Problem**: Sales, purchases, payroll disbursements, and space booking payments all create financial documents (ReceiptVouchers) but **do NOT automatically create corresponding GL journal entries**. The accounting module is isolated from operations.
- **Risk**: Financial statements do not reflect actual business activity; manual double-work required
- **Effort**: L (design account mapping; implement auto-post triggers per transaction type)
- **Priority**: P1 (for genuine accounting use)

---

### [FIN-2] Voucher Number Uniqueness Not Guaranteed
- **Location**: `src/App.tsx` `createNewVoucherState()` L574-688
- **Problem**: Voucher number generation scans the in-memory list. If two browser tabs are open simultaneously, both could generate the same number.
- **Risk**: Duplicate voucher numbers; compliance/audit failure
- **Effort**: M (server-side atomic counter; or at minimum, UUID-based numbers)
- **Priority**: P2

---

### [FIN-3] Double-Entry Not Enforced for Reversal Flow
- **Location**: `src/components/accounting/ReverseEntryModal.tsx`
- **Problem**: While the reversal creates a mirror entry, the process is client-side and has no server-side validation to prevent tampering.
- **Risk**: Balance sheet integrity can be compromised
- **Effort**: M (add server-side validation endpoint)
- **Priority**: P2

---

### [FIN-4] PaymentInstallment.status Not Automatically Updated on Due Date
- **Location**: `src/types.ts` `PaymentInstallment.status`
- **Problem**: Installments that pass their due date should automatically move to `OVERDUE`, but this status change requires manual intervention.
- **Risk**: Staff must manually monitor due dates; risk of missed collections
- **Effort**: S (check on app load: compare dueDate to today, auto-set OVERDUE)
- **Priority**: P2

---

## Category 4: Data Management Debt

### [DATA-1] No Data Migration Strategy
- **Location**: All localStorage storage functions
- **Problem**: There's no versioning of the localStorage schema. When entities gain new fields, old stored data doesn't have them, causing `undefined` field bugs.
- **Risk**: Silent failures when accessing new fields on old stored objects
- **Effort**: M (implement schema version tracking; migration functions per version)
- **Priority**: P2

---

### [DATA-2] Orphaned References on Delete
- **Location**: All delete handlers in `App.tsx`
- **Problem**: Deleting a Branch, Employee, Space, or Customer leaves orphaned references in Vouchers, Contracts, Payroll records, etc. There's no cascade delete or referential integrity check.
- **Risk**: Data inconsistency; null pointer errors in UI
- **Effort**: M (add dependency checks before delete; warn user of impacts)
- **Priority**: P2

---

### [DATA-3] Customer Identified by Both ID and Name
- **Location**: `App.tsx` L1239-1259, `storage.ts` `syncCustomerFromVoucher()`
- **Problem**: Customers are linked to other entities sometimes by `customerId` (proper reference) and sometimes by `customerName` (loose string match). This creates potential for duplicates.
- **Risk**: Duplicate customer records; incorrect customer history attribution
- **Effort**: M (standardize all customer references to use ID; add deduplication)
- **Priority**: P2

---

### [DATA-4] Supabase Backup is a JSONB Blob (Not Normalized)
- **Location**: `src/utils/supabaseSync.ts`
- **Problem**: The entire app state is backed up as a single JSONB object in one Supabase row. This is not a real database architecture — it's a cloud-stored localStorage dump.
- **Risk**: Cannot query individual records from Supabase; backup size will grow huge
- **Effort**: XL (redesign Supabase schema with proper tables)
- **Priority**: P3 (until server-side migration is planned)

---

## Category 5: UX/Accessibility Debt

### [UX-1] No Unsaved Changes Warning
- **Location**: All form components (VoucherForm, LeaseContractEditorModal, etc.)
- **Problem**: Users can accidentally close a complex form and lose all entered data with no warning.
- **Risk**: Data loss; user frustration
- **Effort**: S (add `window.beforeunload` handler when form is dirty)
- **Priority**: P2

---

### [UX-2] No Pagination in High-Volume Tables
- **Location**: `VoucherHistory.tsx`, `CRMView.tsx`, audit logs, attendance records
- **Problem**: Tables render all records without pagination. At scale (1000+ vouchers), this will degrade performance significantly.
- **Risk**: UI freezing; browser crash on large datasets
- **Effort**: M (implement pagination component; add to all tables)
- **Priority**: P2

---

### [UX-3] No Error Boundary
- **Location**: `src/main.tsx` (root render)
- **Problem**: No React Error Boundary is implemented. An unhandled error in any component crashes the entire application.
- **Risk**: Entire app becomes unusable on any runtime error
- **Effort**: S (add `<ErrorBoundary>` wrapper in main.tsx)
- **Priority**: P2

---

## Summary Matrix

| ID | Category | Issue | Priority | Effort |
|---|---|---|---|---|
| ARCH-1 | Architecture | Monolithic App.tsx | P1 | XL |
| ARCH-2 | Architecture | No URL routing | P1 | M |
| ARCH-3 | Architecture | No server database | P1 | XL |
| ARCH-4 | Architecture | No tests | P1 | L |
| ARCH-5 | Architecture | No code splitting | P2 | M |
| CODE-1 | Code Quality | Huge component files | P2 | M |
| CODE-2 | Code Quality | Storage.ts mixed concerns | P2 | M |
| CODE-3 | Code Quality | `any` type usage | P2 | S |
| CODE-4 | Code Quality | loadVouchers mutates data | P1 | S |
| CODE-5 | Code Quality | Manual-only schedules | P2 | M |
| CODE-6 | Code Quality | WA integration experimental | P3 | L |
| FIN-1 | Financial | No GL auto-posting | P1 | L |
| FIN-2 | Financial | Voucher# race condition | P2 | M |
| FIN-3 | Financial | Reversal not server-validated | P2 | M |
| FIN-4 | Financial | Installments not auto-OVERDUE | P2 | S |
| DATA-1 | Data | No migration strategy | P2 | M |
| DATA-2 | Data | Orphaned references on delete | P2 | M |
| DATA-3 | Data | Customer ID/name inconsistency | P2 | M |
| DATA-4 | Data | Supabase blob backup | P3 | XL |
| UX-1 | UX | No unsaved changes warning | P2 | S |
| UX-2 | UX | No pagination | P2 | M |
| UX-3 | UX | No error boundary | P2 | S |

---

## Priority-Ordered Action Plan

### P1 — Fix Before Any Production Deployment
1. `CODE-4` — Stop `loadVouchers()` from mutating user data (**data integrity**)
2. `ARCH-3` — Plan server-side database migration (**scalability**)
3. `FIN-1` — Design GL auto-posting strategy (**accounting correctness**)
4. `ARCH-4` — Set up test infrastructure (**regression safety**)
5. `ARCH-1` + `ARCH-2` — Begin App.tsx decomposition + routing (**maintainability**)

### P2 — High Value, Plan for Next Sprint
6. `UX-3` — Add Error Boundary (quick win)
7. `FIN-4` — Auto-set installment OVERDUE status (quick win)
8. `CODE-3` — Fix `any` type usage (quick win)
9. `UX-1` — Add unsaved changes warning (quick win)
10. `DATA-2` — Add delete dependency checks
11. `ARCH-5` — Implement code splitting
12. `UX-2` — Add pagination

---

*Document created as part of Phase 1 Read-Only Audit. No code was modified.*
