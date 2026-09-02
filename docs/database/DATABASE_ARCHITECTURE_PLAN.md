# Deshal ERP — Database Architecture Plan

> **Document Version**: 1.0.0  
> **Target Engine**: Supabase (PostgreSQL 15+)  
> **Architecture Goal**: Single Source of Truth, Row Level Security (RLS), Multi-Tenant Readiness, Financial Integrity, and Enterprise Auditability.

---

## 1. Executive Summary & Core Principles

Deshal ERP is an integrated enterprise resource planning platform unifying CRM, Finance, Accounting, POS, HR, Attendance, Requests, Leasing, Spaces, Services, Inventory, and Purchasing. 

### Core Architectural Principles
1. **Single Source of Truth**: Centralized entities (e.g. `customers`, `employees`, `branches`) are shared across all operational modules. No duplicate customer or employee tables per module.
2. **Design Around Business Domains**: Tables correspond to real-world business entities and lifecycle processes, not frontend components or temporary UI states.
3. **Database-Level Integrity & Enforcement**: Critical invariants (such as double-entry balance `total_debit = total_credit`, foreign key integrity, non-destructive accounting postings) are enforced via PostgreSQL constraints, foreign keys, and database triggers—not UI logic alone.
4. **Multi-Tenant / Multi-Company Readiness**: Every core entity includes `company_id` and optional `branch_id` scoping to support isolated multi-company deployments.
5. **Zero Client Secrets**: `SUPABASE_SERVICE_ROLE_KEY` is restricted strictly to secure server-side environments. Frontend interacts via anon key governed by strict Row Level Security (RLS).

---

## 2. Business Domains & Main Entities

The database schema is structured into **14 core business domains**:

```
Deshal ERP Database Domains
├── 1. Organization & Multi-Tenancy (companies, branches, departments)
├── 2. Identity & Access Control (profiles, roles, permissions, role_permissions, user_roles)
├── 3. CRM & Customer Core (customers, contacts, leads, pipelines, pipeline_stages, opportunities, activities)
├── 4. Services & Subscriptions (services, service_packages, subscriptions, subscription_usage)
├── 5. Spaces & Booking Engine (spaces, bookings, booking_resources)
├── 6. Properties & Leasing (properties, units, tenants, lease_contracts, payment_installments, security_deposits)
├── 7. Products & Inventory (products, product_categories, warehouses, inventory_transactions, stock_balances, stock_transfers)
├── 8. Purchasing & Suppliers (suppliers, purchase_orders, purchase_order_lines, supplier_invoices)
├── 9. HR & Workforce (employees, employee_contracts, attendance_records, attendance_photos, employee_documents, performance_reviews, training_records, disciplinary_records, recognition_records)
├── 10. Dynamic Requests Engine (request_types, request_forms, requests, request_approvals, request_attachments)
├── 11. Accounting Kernel (chart_of_accounts, fiscal_periods, journal_entries, journal_entry_lines, cost_centers, bank_accounts, bank_transactions, bank_reconciliations)
├── 12. Financial Operations (invoices, invoice_lines, payments, receipts, expenses)
├── 13. Document Management (documents, attachments)
└── 14. System & Audit (notifications, audit_logs, system_settings)
```

---

## 3. Detailed Entity Relationship & Ownership Map

```
Company (Root Tenant)
 ├── Branch (1:N)
 │    ├── Department (1:N)
 │    ├── Employee (1:N)
 │    ├── Warehouse (1:N)
 │    ├── Space (1:N)
 │    └── Bank Account (1:N)
 │
 ├── Profile / User (1:N)
 │    └── User Role → Role → Permission (N:M)
 │
 ├── Customer (1:N)
 │    ├── Contact (1:N)
 │    ├── Lead / Opportunity (1:N)
 │    ├── Lease Contract (1:N)
 │    ├── Booking (1:N)
 │    ├── Subscription (1:N)
 │    └── Invoice / Payment (1:N)
 │
 ├── Supplier (1:N)
 │    └── Purchase Order → Supplier Invoice (1:N)
 │
 └── Accounting Kernel
      ├── Chart of Accounts (Hierarchical Tree)
      ├── Cost Center (1:N)
      ├── Fiscal Period (1:N)
      └── Journal Entry → Journal Entry Lines (1:N, Debit = Credit Invariant)
```

---

## 4. Multi-Tenant & Multi-Company Strategy

To guarantee data isolation without adding unnecessary overhead:
- **Tenant Scope Column**: Every business table includes `company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE`.
- **Branch Scope Column**: Operational tables include `branch_id UUID REFERENCES branches(id) ON DELETE RESTRICT`.
- **RLS Filter Pattern**: Supabase RLS policies filter rows by verifying the user's active company membership:
  ```sql
  company_id IN (
    SELECT company_id FROM user_company_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
  ```

---

## 5. Security & Access Control Architecture

### 5.1 Authentication Strategy
- **Provider**: Supabase Auth (Email/Password, Magic Link, OTP).
- **Profile Binding**: `public.profiles` table is automatically populated via a PostgreSQL trigger on `auth.users` on sign-up.

### 5.2 Authorization & RBAC
- **Roles**: System roles (`SYSTEM_ADMIN`, `COMPANY_ADMIN`, `ACCOUNTANT`, `FINANCE_OFFICER`, `HR_MANAGER`, `SALES_MANAGER`, `SALES_REP`, `RECEPTIONIST`, `EMPLOYEE`, `CUSTOMER_PORTAL`).
- **Permissions**: Granular string permissions (`accounting:post`, `accounting:reverse`, `hr:manage_payroll`, `crm:view_all`, `inventory:adjust_stock`).
- **Enforcement Layer**:
  - **Database Level**: Supabase RLS Policies.
  - **Service Layer**: Server-side middleware validation.
  - **Frontend UI**: Contextual action button rendering.

---

## 6. Financial Protection & Accounting Invariants

1. **Strict Double-Entry Balanced Check**:
   - Check Constraint / Trigger on `journal_entries` verifying `SUM(debit) = SUM(credit)`.
2. **Immutable Posted Entries**:
   - Status lifecycle: `DRAFT` → `REVIEWED` → `POSTED` → `REVERSED`.
   - Database Trigger prevents `UPDATE` or `DELETE` on rows with `status = 'POSTED'`. Modifications require a `REVERSAL` or `ADJUSTMENT` entry referencing the original entry.
3. **Fiscal Period Locking**:
   - Trigger on `journal_entries` checks `fiscal_periods` table; posting to a `CLOSED` or `LOCKED` period raises an exception.

---

## 7. Audit Strategy & Tamper-Evident Trail

All system-critical write operations generate structured records in `audit_logs`:
- **Captured Data**: `actor_id`, `company_id`, `action` (`CREATE`, `UPDATE`, `DELETE`, `POST`, `REVERSE`), `entity_type`, `entity_id`, `ip_address`, `before_state (JSONB)`, `after_state (JSONB)`, `timestamp`.
- **Append-Only Policy**: RLS Policy denies `UPDATE` and `DELETE` on `audit_logs` for all non-service-role users.

---

## 8. Database Naming Standards & Conventions

- **Tables**: `snake_case`, plural noun names (e.g. `customers`, `journal_entries`, `employee_contracts`).
- **Primary Keys**: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`.
- **Foreign Keys**: Singular entity name + `_id` (e.g. `company_id`, `customer_id`, `created_by`).
- **Timestamps**: `created_at TIMESTAMPTZ DEFAULT now()`, `updated_at TIMESTAMPTZ DEFAULT now()`.
- **Soft Delete**: `deleted_at TIMESTAMPTZ NULL`, `deleted_by UUID NULL` reserved for auditable operational entities.

---

## 9. Performance Indexing Strategy

1. **Foreign Key Indexes**: Every foreign key column has an index to prevent table scans during joins.
2. **Company/Branch Composite Indexes**: `(company_id, created_at DESC)` for multi-tenant range queries.
3. **Full-Text Search Indexes**: GIN indexes on search columns (e.g. `to_tsvector('arabic', customer_name)`).
4. **Unique Constraints**: Business keys (e.g. `company_id, entry_number`, `company_id, code`).
