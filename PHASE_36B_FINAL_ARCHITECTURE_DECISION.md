# Deshal ERP — Phase 36B: Final Multi-Tenant Architecture Decision Document
## Production-Grade Enterprise Multi-Tenant SaaS Architecture

**Document Version:** 3.0.0  
**Decision Date:** 2026-09-17  
**Author:** Principal SaaS Architect, PostgreSQL/Supabase Security Architect & Safety-Critical Code Auditor  
**Status:** ARCHITECTURE DECISIONS FROZEN & RESOLVED — READY FOR PHASE 37

---

## Executive Summary

This document freezes and formalizes all architectural, data, security, authorization, and lifecycle decisions for the **Deshal ERP Production-Grade Enterprise Multi-Tenant SaaS Platform**. All theoretical ambiguities and potential contradictions have been resolved against the actual codebase and database migrations (`0001_initial_core_schema.sql` through `0033_purge_dummy_employees_and_kiosks.sql`).

---

## 1. Final Tenant / Company Identity Model

The identity hierarchy is frozen into 5 distinct, semantically separate identifiers:

```text
Tenant ID (tenants.id)
    = SaaS / Platform identity (subscription, billing plan, provisioning lifecycle, module/feature toggles)

Company ID (companies.id)
    = Physical ERP data isolation boundary across all 50+ operational business tables

Branch ID (branches.id)
    = Operational branch boundary within a company (POS shifts, local stock levels, kiosk devices)

Membership ID (user_company_memberships.id)
    = User-to-company authorization relationship

User ID (auth.users.id / profiles.id)
    = Supabase Auth individual user identity
```

### Key Decision:
* **No Blanket `tenant_id` Columns:** We do **NOT** add a `tenant_id` column to every existing ERP operational table.
* **Physical Boundary:** Existing `company_id` foreign keys (`0001_initial_core_schema.sql` through `0033`) remain the physical ERP data isolation boundary.
* **Registry Link:** `public.tenants` contains constraint `company_id UUID UNIQUE NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT`.

---

## 2. Final Membership Model

The authoritative user authorization chain is frozen as:

```text
Supabase Auth (auth.users)
          ↓
User Profile Metadata (public.profiles)
          ↓
Active Tenant Memberships (public.user_company_memberships)
          ↓
Target ERP Company (public.companies)
```

### Exact Definition of `profiles.company_id`:
* **`profiles.company_id` Grounding:** `0001_initial_core_schema.sql` lines 50-61.
* **Legacy / UI Preference Role:** `profiles.company_id` represents **ONLY** the user's default/preferred company for UI initialization.
* **Non-Security Rule:** `profiles.company_id` is **NEVER** used as an authorization security boundary. Access control is strictly derived from `public.user_company_memberships` where `user_id = auth.uid()` and `is_active = true`.

---

## 3. Final Platform Admin Model

```text
Supabase Auth (auth.users)
          ↓
Platform Privilege Registry (public.platform_admins)
```

* **Table Definition (`0034`):**
  ```sql
  CREATE TABLE IF NOT EXISTS public.platform_admins (
      user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
      granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      granted_by UUID REFERENCES public.profiles(id)
  );
  ```
* **Authentication:** Handled 100% by Supabase Auth (`auth.users`). Passwords and authentication credentials are **NEVER** stored in `platform_admins`.
* **Platform vs Tenant Separation:** Platform Admins manage tenants, provisioning jobs, subscriptions, module/feature scope, and platform audit logs. They **CANNOT** read or alter a tenant's operational ERP data unless an explicit record exists in `public.user_company_memberships` for that tenant company.

---

## 4. Final RLS & Security Model

There is **ONE unambiguous security model** enforced directly at the database level:

```text
Authenticated Request (auth.uid())
             ↓
    is_platform_admin()?
       ├── YES → Full Access to Platform Registry & Platform Admin RPCs
       └── NO  → Evaluate auth_user_company_ids()
                     ↓
             Allowed Company IDs
                     ↓
       Row Level Security (RLS) Filter
                     ↓
       Target Tenant Data Row Returned
```

### Security Helper Functions:
1. `public.auth_user_company_ids()` (`0007_rls_policies_and_functions.sql` lines 11-16): Evaluates active memberships for `auth.uid()`.
2. `public.auth_user_has_permission(p_permission)` (`0007` lines 19-29): Evaluates RBAC permissions.
3. `public.is_platform_admin()` (New in `0034`): Evaluates whether `auth.uid()` is in `platform_admins`.

* **Frontend Rule:** Frontend state, URL parameters, React context, and browser `localStorage` are **NEVER** trusted for security boundaries.

---

## 5. Existing Company Activation Workflow

The system supports explicit activation of existing companies without duplicating data:

```text
Existing Company (public.companies)
        ↓
Platform Admin selects company
        ↓
Validate eligibility (Check CR number, check non-existence in public.tenants)
        ↓
Create public.tenants record (linking company_id = existing_company.id)
        ↓
Preserve ALL existing ERP data (journal_entries, vouchers, customers, employees, products)
        ↓
Create / Validate Admin Membership (user_company_memberships)
        ↓
Initialize Subscription (public.tenant_subscriptions)
        ↓
Initialize Module Entitlements (public.tenant_modules)
        ↓
Initialize Feature Entitlements (public.tenant_features)
        ↓
Run Tenant Health Checks
        ↓
Mark Tenant ACTIVE
```

---

## 6. New Tenant Provisioning Workflow

New tenant creation is atomic, idempotent, and retry-safe via PostgreSQL RPC `public.provision_tenant_transaction()`:

```text
New Tenant Request + Idempotency Key
        ↓
Create public.tenants (status = 'PROVISIONING')
        ↓
Create public.companies & public.branches (Main Branch)
        ↓
Create Tenant Admin Profile & public.user_company_memberships
        ↓
Create Default Tenant Roles & Permission Mappings
        ↓
Initialize public.tenant_modules & public.tenant_features
        ↓
Initialize public.tenant_subscriptions & public.system_settings
        ↓
Run Health Checks
        ↓
Mark Tenant ACTIVE
```

---

## 7. Module / Feature / Permission Hierarchy

The 7-tier logical authorization chain is frozen as:

```text
Subscription Entitlement (tenant_subscriptions)
      ↓
Module Entitlement (tenant_modules.is_enabled)
      ↓
Feature Entitlement (tenant_features.is_enabled)
      ↓
Tenant Membership (user_company_memberships)
      ↓
Assigned Role (user_roles)
      ↓
Permission (permissions / 91-permission RBAC catalog)
      ↓
Business Operation
```

* **RBAC Preservation:** The existing **91-permission RBAC catalog** (`src/domain/hr/employeePermissions.ts`) is fully preserved and extended where required.

---

## 8. Final Subscription Model

Reuses the existing `public.tenant_subscriptions` table (`0023_pos_services_scheduling.sql` lines 160-210):
* Linked via `company_id FK → public.companies(id)`.
* Tracks `plan_type` (`FREE`, `STARTER`, `PRO`, `ENTERPRISE`), billing status, and module usage quotas.
* **Entitlement vs Permission:** Subscription entitlement determines what the tenant organization has purchased; user permissions determine what an individual user within that tenant is allowed to execute.

---

## 9. Final Tenant Lifecycle State Machine

```text
                        ┌──────────────┐
                        │   PENDING    │
                        └──────┬───────┘
                               │ (Start Provisioning)
                               ▼
                        ┌──────────────┐
                        │ PROVISIONING │
                        └──────┬───────┘
                               │ (Health Checks Pass)
                               ▼
                        ┌──────────────┐
                        │    READY     │
                        └──────┬───────┘
                               │ (Activate)
                               ▼
┌──────────────┐        ┌──────────────┐
│  SUSPENDED   │◄───────┤    ACTIVE    ├───────┐
└──────┬───────┘ (Block)└──────────────┘       │ (Archive)
       │ (Reactivate)                          ▼
       └───────────────────────────────►┌──────────────┐
                                        │   ARCHIVED   │
                                        └──────────────┘
```

### Allowed Operations per State:
* **`PENDING`:** Draft state. All operational read/write **DENIED**.
* **`PROVISIONING`:** Setup in progress. Operational read/write **DENIED**.
* **`READY`:** Setup complete, health check passed. Write **DENIED** until activated.
* **`ACTIVE`:** All authorized operational read/write **PERMITTED**.
* **`SUSPENDED`:** Operational write **DENIED**; user read **DENIED**. Platform Admin inspection permitted.
* **`FAILED`:** Provisioning error. Write **DENIED**. Retry execution permitted.
* **`ARCHIVED`:** Read-only historical archive for Platform Admin. Tenant operations **DENIED**.

---

## 10. Idempotency Model

* Every provisioning call accepts an `idempotency_key` stored in `public.tenant_provisioning_jobs`.
* Duplicate calls with an existing `idempotency_key` return the existing job result without re-executing steps or creating duplicate records.

---

## 11. Migration Strategy

* **Additive-Only Migration `0034_enterprise_multi_tenant_core.sql`:** Creates `tenants`, `platform_admins`, `tenant_modules`, `tenant_features`, `tenant_provisioning_jobs`.
* **Selective Explicit Activation:** Migration `0034` does **NOT** silently auto-activate test/dummy companies. Activation is performed explicitly via the Platform Admin UI or through an audited activation script for verified production companies.

---

## 12. Rollback Strategy

* Migration `0034` does not drop or alter any of the existing 52 operational tables.
* A rollback script drops the 5 new platform tables (`tenants`, `platform_admins`, `tenant_modules`, `tenant_features`, `tenant_provisioning_jobs`), leaving all existing `companies` and operational ERP data intact.

---

## 13. Exact Phase 37–43 Sequence

```text
Phase 36B Final Decision Gate (FROZEN & COMPLETED)
        ↓
Phase 37: Domain & Application Contracts
  - Create src/domain/tenant/tenantEntities.ts
  - Create src/application/ports/tenantPorts.ts
  - Write src/tests/tenantDomain.test.ts
        ↓
Phase 38: Database & Supabase Multi-Tenancy
  - Create supabase/migrations/0034_enterprise_multi_tenant_core.sql
  - Apply RLS policies & is_platform_admin() function
  - Execute audited selective backfill
        ↓
Phase 39: Tenant Context & Authorization
  - Create src/contexts/TenantContext.tsx
  - Update src/lib/supabase/authService.ts
  - Wire AuthContext -> TenantContext bridge
        ↓
Phase 40: Provisioning Engine
  - Create src/application/services/tenantProvisioningService.ts
  - Implement transactional RPC integration & retry queue
  - Write src/tests/tenantProvisioningEngine.test.ts
        ↓
Phase 41: Platform Admin UI
  - Create src/components/platform/PlatformAdminDashboard.tsx
  - Create src/components/platform/TenantProvisioningWizard.tsx
  - Create src/components/platform/TenantHealthCheckModal.tsx
        ↓
Phase 42: ERP Integration
  - Integrate TenantContext into all 11 ERP modules
  - Enforce module capability checks across UI views
        ↓
Phase 43: Testing & Security Audit
  - Write src/tests/tenantIsolationSecurity.test.ts
  - Execute 6-command mandatory validation gate
```

---

## 14. Remaining Risks & Mitigations

1. **Offline Dev Mode:** App uses LocalStorage adapters when Supabase is unconfigured (`isSupabaseConfigured = false`). Clear UI banners will indicate offline mode.
2. **JWT Refresh Latency:** Active membership revocation blocks SQL queries immediately via RLS, while UI navigation badges refresh on the next token lifecycle event.

---

## FINAL DECISION GATE STATUS

```text
FINAL STATUS: READY FOR PHASE 37
```

All architectural contradictions have been completely resolved against the repository and database schema. Execution is frozen and prepared for Phase 37 implementation.

**STOPPING EXECUTION — AWAITING EXPLICIT APPROVAL TO BEGIN PHASE 37.**
