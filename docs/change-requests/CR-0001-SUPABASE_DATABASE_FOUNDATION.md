# Change Request: CR-0001

## Change ID
`CR-0001`

## Title
`CR-0001: Supabase Database Foundation, Multi-Tenant Architecture, RLS Security Model & Data Migration Strategy`

## Status
`Approved (Executing CR-0001)`

---

## 1. Objective

Establish a unified, secure, scalable Supabase + PostgreSQL database architecture for **Deshal ERP** to transition from client-side `localStorage` state into a Single Source of Truth enterprise backend.

---

## 2. Current State vs Proposed Change

| Metric / Dimension | Current State | Proposed Change (CR-0001) |
| :--- | :--- | :--- |
| **Data Persistence** | Browser `localStorage` (`rv_studio_*`) | Supabase PostgreSQL 15+ Tables |
| **Data Integrity** | String convention / No FK constraints | Database Constraints, Check Invariants, Foreign Keys |
| **Authentication** | Client-side plaintext/mock logic | Supabase Auth + JWT Sessions + `public.profiles` |
| **Authorization** | UI-only button disabling | PostgreSQL Row Level Security (RLS) + RBAC Policies |
| **Multi-Tenancy** | Single company implied | Multi-company isolated via `company_id` and RLS |
| **Accounting Invariant** | Computed client-side | Database trigger enforcing `SUM(debit) = SUM(credit)` |
| **Posted Entry Edit** | Can be modified in local state | **Protected**; Posted entries require Reversal/Adjustment |
| **Audit Log Security** | Cleared via UI button | **Append-Only**; RLS denies UPDATE and DELETE |

---

## 3. Detailed Database Schema & Proposed Tables

### Phase 1: Core Organization & Identity
- `companies`: Root multi-tenant entity.
- `branches`: Physical business locations.
- `departments`: Functional organizational units.
- `profiles`: User accounts linked to `auth.users`.
- `roles`, `permissions`, `role_permissions`, `user_roles`: Granular RBAC tables.

### Phase 2: CRM & Customer Core
- `customers`: Centralized customer records.
- `contacts`: Customer contact persons.
- `leads`, `pipeline_stages`, `opportunities`, `activities`: Sales pipeline cycle.

### Phase 3: Accounting & Finance Kernel
- `chart_of_accounts`: Hierarchical COA tree (`ASSET`, `LIABILITY`, `EQUITY`, `REVENUE`, `EXPENSE`).
- `cost_centers`: Operational cost allocation nodes.
- `fiscal_periods`: Accounting period locking.
- `journal_entries`: Double-entry transaction headers.
- `journal_entry_lines`: Debits and credits line items.
- `bank_accounts`, `bank_transactions`, `bank_reconciliations`: Bank management.
- `invoices`, `invoice_lines`, `payments`, `receipts`, `expenses`: Operational finance.

### Phase 4: HR, Workforce & Kiosk
- `employees`: Employee 360 master table.
- `employee_contracts`: Legal employment terms.
- `attendance_records`, `attendance_movement_logs`: Attendance & kiosk check-ins.
- `payroll_slips`: Monthly salary records & WPS exports.

### Phase 5: Spaces, Leasing, Services & Inventory
- `spaces`, `space_bookings`: Real estate & space reservations.
- `properties`, `units`, `lease_contracts`, `payment_installments`, `security_deposits`: Real estate leasing.
- `services`, `subscriptions`: Catalog services & client subscriptions.
- `products`, `product_categories`, `warehouses`, `inventory_transactions`, `stock_balances`: Inventory management.
- `suppliers`, `purchase_orders`, `purchase_items`: Purchasing & AP.

### Phase 6: Dynamic Requests & System Audit
- `request_types`, `requests`, `request_approvals`: Form builder & workflow engine.
- `documents`, `attachments`: File metadata & Supabase Storage links.
- `audit_logs`, `notifications`, `system_settings`: Auditability & configuration.

---

## 4. Security & Access Control Assessment

- **Service Role Key Isolation**: `SUPABASE_SERVICE_ROLE_KEY` is strictly used in Node.js server scripts (`src/lib/supabase/server.ts`). Never bundled into frontend assets.
- **Tenant Isolation Policy**:
  ```sql
  company_id IN (SELECT auth_user_company_ids())
  ```
- **Permission Policy**:
  ```sql
  auth_user_has_permission('accounting:post')
  ```

---

## 5. Affected Files & Expected Additions

### Created Documentation Artifacts
- `docs/database/DATABASE_ARCHITECTURE_PLAN.md`
- `docs/database/ENTITY_RELATIONSHIP_MAP.md`
- `docs/database/DATA_MIGRATION_PLAN.md`
- `docs/database/SUPABASE_SETUP.md`
- `docs/database/RLS_SECURITY_MODEL.md`
- `docs/database/MIGRATION_GUIDE.md`
- `docs/database/IMPLEMENTATION_STATUS.md`

### Proposed Code & Migration Additions (Post Approval)
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/types.ts`
- `supabase/migrations/0001_initial_core_schema.sql` through `0010_rls_security_policies.sql`

---

## 6. Testing & Rollback Plan

- **Automated Validation**: `npm run lint` and `npm run build` after client integration.
- **Data Integrity Tests**: Trial balance double-entry verification (`SUM(debit) = SUM(credit)`).
- **Rollback Strategy**: If Supabase connection fails, system seamlessly falls back to `localStorage` adapter. Migration rollback scripts (`DOWN`) provide clean schema removal if needed.

---

## 7. Mandatory Gate & Authorization Status

> **MANDATORY APPROVAL GATE**: Status is set to **`Pending Approval`**.  
> The agent has stopped execution and will NOT apply database migrations, create database tables, or modify application code until explicit approval is provided by the user.

**Approval Command Required**:
```text
APPROVE CR-0001
```
