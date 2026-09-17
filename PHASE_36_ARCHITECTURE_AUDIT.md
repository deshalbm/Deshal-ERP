# Deshal ERP — Phase 36: Discovery & Architecture Audit Report
## Production-Grade Enterprise Multi-Tenant SaaS Architecture

**Document Version:** 1.0.0  
**Audit Date:** 2026-09-17  
**Author:** Principal Software Architect & Safety-Critical Code Auditor  
**Status:** FORENSIC READ-ONLY AUDIT COMPLETED — AWAITING REVIEW BEFORE PHASE 37

---

## Executive Summary

Deshal ERP has undergone a thorough, read-only architectural audit to design a production-grade **Enterprise Multi-Tenant SaaS Architecture**. This audit verifies the codebase's current state, data storage model, authentication pathways, permission hierarchy, module feature flags, database schema, and row-level security (RLS) policies.

The goal is to transition Deshal ERP from a single-company local-first application with basic tenant profiles into a **true multi-tenant SaaS ERP platform** featuring strict PostgreSQL/Supabase database-level data isolation, platform administration, idempotent tenant provisioning, existing company activation, granular role-based authorization, fine-grained module feature flags, and zero data loss for existing companies.

---

## 1. Current Architecture Overview

Deshal ERP is built using React 19, TypeScript, Vite, Tailwind CSS, and a Clean Architecture (Ports & Adapters / Hexagonal Architecture) design pattern structured into four distinct layers:

```text
                               ┌─────────────────────────────┐
                               │     COMPOSITION ROOT        │
                               │  AppShell / Context Providers│
                               └──────────────┬──────────────┘
                                              │
                             ┌────────────────▼────────────────┐
                             │        PRESENTATION             │
                             │ React Components / Modals / UI  │
                             └────────────────┬────────────────┘
                                              │
                             ┌────────────────▼────────────────┐
                             │         APPLICATION             │
                             │ Use Cases / Services / Ports    │
                             └────────────────┬────────────────┘
                                              │
                             ┌────────────────▼────────────────┐
                             │            DOMAIN               │
                             │ Pure Business Rules & Engines   │
                             └─────────────────────────────────┘
                                              │
                             ┌────────────────▼────────────────┐
                             │        INFRASTRUCTURE           │
                             │ Supabase Adapter / LocalStorage │
                             └─────────────────────────────────┘
```

* **Domain (`src/domain/`):** Pure, framework-agnostic TypeScript modules (Accounting, HR/Payroll, CRM, POS, Inventory, Purchases, Spaces, Services, Requests, Tenant). Zero browser or network dependencies.
* **Application (`src/application/`):** Orchestrates use cases and owns abstract interfaces/ports (`src/application/ports/`).
* **Infrastructure (`src/lib/`, `src/utils/storage/`):** Implements ports using Supabase PostgreSQL client and LocalStorage adapters.
* **Presentation (`src/components/`, `src/contexts/`):** React components connected via `AuthContext` and `ERPDataContext`.

---

## 2. Current Authentication Architecture

Authentication operates in a dual-mode configuration:
1. **Supabase Auth (`src/lib/supabase/authService.ts`):** Handles email/password authentication using Supabase Auth JWT tokens. Securely maps authenticated `auth.users(id)` to `public.profiles(id)` and `public.user_company_memberships(user_id, company_id)`.
2. **Local Auth Fallback (`src/utils/authManager.ts`):** Serves offline/standalone mode by persisting `rv_studio_active_auth_session` in browser `localStorage`.

### Key Finding:
The application context currently uses `companyId` derived from `supabaseAuthUser.companyId` or `authSession.user.id`. There is no separate `tenant_id` concept in the current runtime context, causing `company_id` to act as both the organizational unit and the tenant boundary.

---

## 3. Current Supabase Database Schema

The database consists of **33 migration files** (`0001_initial_core_schema.sql` through `0033_purge_dummy_employees_and_kiosks.sql`).

### Core Identity & Scoping Tables:
* **`public.companies`:** Root company entity (`id`, `name_ar`, `name_en`, `cr_number`, `tax_number`, `logo_url`, `is_active`, `created_at`, `updated_at`).
* **`public.branches`:** Company branches (`id`, `company_id` FK to `companies`, `code`, `name_ar`, `name_en`, `city`, `is_active`).
* **`public.departments`:** Branch departments (`id`, `company_id` FK, `branch_id` FK).
* **`public.profiles`:** User metadata extending `auth.users` (`id` FK, `company_id` FK, `employee_id`, `full_name`, `email`, `role`, `is_active`).
* **`public.user_company_memberships`:** User-to-company mapping (`id`, `user_id` FK, `company_id` FK, `is_active`).
* **`public.roles` & `public.permissions` & `public.role_permissions` & `public.user_roles`:** RBAC catalog.

### Additional Tenant-Aware Tables:
* `tenant_subscriptions` (Migration `0023`): Links `company_id` to subscription plan, billing status, and module quotas.
* `tenant_websites` & `tenant_pages` (Migrations `0030`, `0031`): CMS and website builder tables linked via `company_id`.

---

## 4. Current Company Model

Currently, company management has two representations:
1. **Database Level (`public.companies`):** Stores basic company records, linked to branches, departments, and user profiles.
2. **Domain/Client Level (`TenantCompanyProfile` in `src/domain/tenant/tenantCompanyDomain.ts`):** Stores enterprise profile attributes (`companyId`, `crNumber`, `taxId`, `adminEmail`, `status`, `moduleFeatures`) persisted in `deshal_tenant_companies_v1` via `LocalStorageTenantCompanyAdapter`.

### Deficiency Identified:
* Missing a dedicated `public.tenants` platform registry table in Supabase PostgreSQL.
* Missing explicit `PLATFORM_ADMIN` vs `TENANT_ADMIN` role differentiation at the database layer.
* Missing database-backed tenant lifecycle state tracking (`PENDING`, `PROVISIONING`, `READY`, `ACTIVE`, `SUSPENDED`, `FAILED`, `ARCHIVED`).

---

## 5. Current Module Architecture

Deshal ERP defines **11 core functional modules**:
1. **Financials & Vouchers (`vouchers`)**
2. **POS Terminal & Cashier (`pos`)**
3. **Inventory & Warehousing (`inventory`)**
4. **Purchases & Suppliers (`purchases`)**
5. **CRM & Customers (`crm`)**
6. **Spaces, Bookings & Contracts (`spaces`)**
7. **Services & Packages (`services`)**
8. **HR & Payroll (`hr`)**
9. **Attendance & Kiosk (`attendance`)**
10. **Requests & Documents (`requests`)**
11. **Branches, System & Settings (`management`)**

Module feature flags are defined in `src/domain/tenant/tenantCompanyDomain.ts` as `TenantModuleFeatures` containing boolean controls (`crmEnabled`, `posEnabled`, `inventoryEnabled`, etc.).

---

## 6. Current Permission Architecture

Deshal ERP implements an ultra-granular RBAC system with **91 permissions** mapped across the 11 functional modules (`src/domain/hr/employeePermissions.ts`).

### Evaluation Flow:
```text
User → Active Employee Profile → Assigned Role Default Permissions + Custom Permission Overrides → evaluateEmployeePermissions()
```
Database policies utilize helper functions `public.auth_user_company_ids()` and `public.auth_user_has_permission()` to enforce RLS on queries.

---

## 7. Current Subscription Architecture

The `tenant_subscriptions` table (`0023_pos_services_scheduling.sql`) tracks subscription details:
* `plan_type`: `FREE`, `STARTER`, `PRO`, `ENTERPRISE`
* `status`: `active`, `trialing`, `past_due`, `canceled`
* Quotas: `consultation_sessions_used`, `media_studio_hours_used`, `storage_used_mb`
* Managed via `TenantSubscriptionModal.tsx`.

---

## 8. Current LocalStorage Usage

Documented in `docs/LOCAL_STORAGE_SCHEMA.md`:
* `rv_studio_active_auth_session`: Client session cache.
* `rv_studio_active_employee_id`: Active employee context.
* `rv_studio_active_branch_id`: Selected branch context.
* `deshal_tenant_companies_v1`: Local cache of provisioned tenant company profiles.
* Operational storage: `deshal_customers_v1`, `deshal_vouchers_v1`, `deshal_inventory_v1`, `deshal_journal_entries_v1`, etc.

*Rule Enforcement:* `localStorage` must remain intact as a fast client-side fallback/cache, but Supabase PostgreSQL must serve as the authoritative security boundary.

---

## 9. Tables Requiring Tenant Isolation (`tenant_id`)

The following **34 tables** contain tenant operational data and must be scoped by `tenant_id` (or mapped via company boundary):

1. `companies`
2. `branches`
3. `departments`
4. `profiles`
5. `user_company_memberships`
6. `roles`
7. `user_roles`
8. `customers`
9. `contacts`
10. `opportunities`
11. `activities`
12. `chart_of_accounts`
13. `cost_centers`
14. `fiscal_periods`
15. `journal_entries`
16. `journal_entry_lines`
17. `bank_accounts`
18. `invoices`
19. `financial_vouchers`
20. `employees`
21. `kiosk_devices`
22. `attendance_movement_logs`
23. `payroll_slips`
24. `leave_requests`
25. `spaces`
26. `space_bookings`
27. `lease_contracts`
28. `products`
29. `warehouses`
30. `stock_balances`
31. `suppliers`
32. `purchase_orders`
33. `requests`
34. `documents`

---

## 10. Tables That Must Remain Platform-Level

The following tables serve global platform administration and must **NOT** be tenant-scoped:

1. **`public.tenants` (NEW):** Master platform tenant registry.
2. **`public.platform_admins` (NEW):** Platform Administrator credentials and privileges.
3. **`public.permissions`:** Global system-wide permission catalog (shared static metadata).
4. **`public.tenant_provisioning_jobs` (NEW):** Provisioning job queue and step status logs.
5. **`public.platform_audit_logs` (NEW):** Platform-level security and provisioning audit logs.

---

## 11. Existing Migrations Relevant to Tenancy

* **`0001_initial_core_schema.sql`:** Base tables (`companies`, `branches`, `profiles`, `user_company_memberships`, `roles`).
* **`0007_rls_policies_and_functions.sql`:** Security helper `auth_user_company_ids()` and base RLS policies.
* **`0009_comprehensive_rls_policies.sql`:** Extended RLS coverage.
* **`0023_pos_services_scheduling.sql`:** `tenant_subscriptions` table.
* **`0030_multi_tenant_cms.sql` & `0031_seo_smo_geo.sql`:** Multi-tenant website CMS tables.

---

## 12. Risk Analysis

| Risk ID | Risk Description | Severity | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **R-01** | Cross-Tenant Data Leakage via manipulation of client-side `companyId` | **CRITICAL** | Enforce database RLS using `auth_user_tenant_ids()` based on `auth.uid()`, strictly ignoring frontend params. |
| **R-02** | Loss or duplication of data when activating an existing company as a tenant | **CRITICAL** | Existing company activation use case maps existing `companies.id` to `tenants.company_id` without re-inserting operational records. |
| **R-03** | Partial/broken provisioning state if a provisioning step fails mid-flight | **HIGH** | Transactional provisioning job pipeline (`tenant_provisioning_jobs`) with explicit step tracking and retry capabilities. |
| **R-04** | Privilege escalation: Tenant Admin gaining Platform Admin capabilities | **CRITICAL** | Platform Admin operations guarded by `public.is_platform_admin()` database function and isolated `platform_admins` table. |
| **R-05** | Breaking existing local-first / offline functionality | **MEDIUM** | Maintain `localStorage` adapter facades for client caching while delegating security and persistence to Supabase. |

---

## 13. Required Database Migrations

### Migration `0034_enterprise_multi_tenant_core.sql`:
1. **Create `public.tenants` Table:**
   ```sql
   CREATE TABLE IF NOT EXISTS public.tenants (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       company_id UUID UNIQUE REFERENCES public.companies(id) ON DELETE RESTRICT,
       tenant_code TEXT NOT NULL UNIQUE,
       name TEXT NOT NULL,
       status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROVISIONING', 'READY', 'ACTIVE', 'SUSPENDED', 'FAILED', 'ARCHIVED')),
       subscription_plan TEXT NOT NULL DEFAULT 'FREE',
       created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
       updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   ```
2. **Create `public.platform_admins` Table:**
   ```sql
   CREATE TABLE IF NOT EXISTS public.platform_admins (
       user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
       granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
       granted_by UUID REFERENCES public.profiles(id)
   );
   ```
3. **Create `public.tenant_modules` & `public.tenant_features` Tables:**
   Store enabled/disabled module and fine-grained feature states per tenant.
4. **Create `public.tenant_provisioning_jobs` Table:**
   Track provisioning steps, execution errors, and retry attempts.
5. **Add `tenant_id` Foreign Keys & RLS Helper:**
   Create `public.auth_user_tenant_ids()` and `public.is_platform_admin()` SQL security functions.

---

## 14. Recommended Target Architecture

```text
DESHAL ERP PLATFORM ARCHITECTURE
│
├── Platform Layer (Global)
│   ├── Platform Admin UI & Dashboard
│   ├── Platform Security Guard (is_platform_admin)
│   ├── Tenant Provisioning Engine
│   └── Platform Audit Logger
│
└── Tenant Layer (Isolated)
    ├── Tenant Context & Session Resolver
    ├── Database Row Level Security (RLS)
    ├── Tenant Company & Branch Management
    ├── Module & Feature Capability Service
    └── Operational ERP Modules (CRM, POS, Inventory, Accounting, HR, etc.)
```

---

## 15. Exact Implementation Phases

### Phase 36: Discovery & Architecture Audit (COMPLETED)
* Read-only audit of current schema, auth, modules, permissions, storage, and risks.
* Produce `PHASE_36_ARCHITECTURE_AUDIT.md`.

### Phase 37: Domain & Application Foundation
* Define pure domain models (`Tenant`, `TenantProfile`, `TenantMembership`, `TenantRole`, `TenantPermission`, `TenantModule`, `TenantFeature`, `TenantSubscription`, `TenantProvisioningJob`).
* Define application ports (`TenantRepository`, `TenantProvisioningPort`, `TenantContextPort`).
* Write unit tests for domain entities and provisioning workflows.

### Phase 38: Database & Supabase Multi-Tenancy
* Create migration `0034_enterprise_multi_tenant_core.sql`.
* Implement RLS policies and security helper functions.
* Backfill existing company records as active tenants (`tenant_id = company_id`).

### Phase 39: Tenant Context & Authorization
* Build unified `TenantContext` provider.
* Implement tenant membership, role, and permission resolution.
* Secure tenant switching for authorized Platform Admins.

### Phase 40: Provisioning Engine
* Implement `provisionNewTenant()` and `activateExistingCompanyAsTenant()` application use cases.
* Build transactional step executor with error logging and retry capabilities.
* Implement tenant health checks.

### Phase 41: Platform Admin UI
* Build `PlatformAdminDashboard.tsx`.
* Build multi-step `TenantProvisioningWizard.tsx`.
* Build `TenantHealthCheckModal.tsx` and `PlatformAuditLogView.tsx`.

### Phase 42: ERP Integration
* Wire `TenantContext` into all 11 ERP modules.
* Enforce module/feature capability checks in UI components.

### Phase 43: Testing & Security Audit
* Automated unit & integration test suites.
* Negative security tests (cross-tenant isolation, privilege escalation).
* Mandatory 6-command validation gate pass.

---

## 16. Files to be Created

1. `PHASE_36_ARCHITECTURE_AUDIT.md` (This Report)
2. `supabase/migrations/0034_enterprise_multi_tenant_core.sql`
3. `src/domain/tenant/tenantEntities.ts`
4. `src/domain/tenant/tenantProvisioningDomain.ts`
5. `src/application/ports/tenantPorts.ts`
6. `src/application/services/tenantProvisioningService.ts`
7. `src/application/services/tenantContextService.ts`
8. `src/lib/adapters/supabaseTenantAdapter.ts`
9. `src/contexts/TenantContext.tsx`
10. `src/components/platform/PlatformAdminDashboard.tsx`
11. `src/components/platform/TenantProvisioningWizard.tsx`
12. `src/components/platform/TenantHealthCheckModal.tsx`
13. `src/tests/tenantDomain.test.ts`
14. `src/tests/tenantProvisioningEngine.test.ts`
15. `src/tests/tenantIsolationSecurity.test.ts`

---

## 17. Files to be Modified

1. `src/types/auth.ts` (Add tenant context & platform admin flag)
2. `src/types/company.ts` (Add tenant ID mapping)
3. `src/contexts/AuthContext.tsx` (Integrate tenant context)
4. `src/contexts/ERPDataContext.tsx` (Scoped data loading)
5. `src/lib/supabase/authService.ts` (Include tenant membership loading)
6. `src/lib/supabase/types.ts` (Add migration 0034 table types)
7. `src/components/SettingsStudio.tsx` (Platform admin navigation tab)
8. `src/components/TenantSubscriptionModal.tsx` (Tenant scope binding)
9. `src/app/AppShell.tsx` (Platform admin banner & tenant context provider)

---

## 18. Potential Breaking Changes Assessment

* **Zero Breaking Changes:**
  * Existing single-company data will be automatically backfilled into the new `tenants` table during migration `0034`.
  * Existing `localStorage` keys remain fully operational for offline client caching.
  * Public component prop interfaces will maintain backward-compatible fallbacks.

---

## 19. Backward Compatibility Strategy

1. **Automatic Data Backfill:** Migration `0034` executes a SQL backfill script that wraps existing `public.companies` records into `public.tenants` entries with status `'ACTIVE'`.
2. **Transparent ID Resolution:** The application layer resolves `effectiveTenantId = tenant.id || company.id`, ensuring legacy queries continue to resolve seamlessly.
3. **Dual-Storage Synchronization:** Storage adapters write to both `localStorage` (for offline support) and Supabase PostgreSQL (as the authoritative source of truth).

---

## Conclusion & Next Steps

Phase 36 Discovery & Architecture Audit is complete. The repository has been thoroughly analyzed without modifying any source files.

**AWAITING APPROVAL TO PROCEED TO PHASE 37 (DOMAIN & APPLICATION FOUNDATION).**
