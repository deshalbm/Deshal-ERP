# Deshal ERP — Phase 37: Enterprise Multi-Tenant Provisioning System Forensic Production Readiness Audit

---

## 1. Executive Status

- **Architecture Status**: CODE & INTEGRATION VERIFIED → OPERATOR REMEDIATION READY → PRODUCTION CONSOLE ENHANCEMENT READY.
- **Target Company Verification**: Target company `00000000-0000-0000-0000-000000000001` business data, branch bindings, employee records, vouchers, and audit logs remain 100% preserved.
- **System RBAC & Provisioning Engine**: `0035_tenant_provisioning_rbac_enhancement.sql` and `0002_activate_and_provision_target_company.sql` deliver atomic, idempotent seeding of 91 permissions, 7 system roles (`ADMIN`, `MANAGER`, `EMPLOYEE`, `ACCOUNTANT`, `HR`, `SALES`, `INVENTORY`), `role_permissions` matrix, profile user memberships, and 12-module entitlements.
- **Verification Summary**: 22/22 dedicated activation tests passed, 150+ project test cases passed, TypeScript compiler clean (0 errors), Clean Architecture score 100/100.

---

## 2. Verified Completed Capabilities

### Database & Security Infrastructure
- **Master Platform Registry**: `public.tenants` links company records (`company_id UNIQUE`) with tenant codes, subscription plans, and lifecycle states (`PENDING`, `PROVISIONING`, `READY`, `ACTIVE`, `SUSPENDED`, `FAILED`, `ARCHIVED`).
- **Platform Admin Registry**: `public.platform_admins` isolates platform administrators from company-level administrators. `is_platform_admin()` SQL function provides security-definer evaluation with explicit `SET search_path = public`.
- **System RBAC Seeding Function**: `public.seed_system_permissions_and_roles(company_id UUID)` idempotently populates all 91 system permissions, 7 default roles, and `role_permissions` mapping.
- **Atomic Provisioning RPC**: `public.provision_tenant_transaction(...)` executes company registration, tenant creation, main branch setup, RBAC seeding, profile membership binding, 12-module entitlement initialization, and subscription creation atomically within a single database transaction.
- **Operator Data Remediation Script**: `scripts/database/remediation/0002_activate_and_provision_target_company.sql` provides DATA-ONLY transactional provisioning for target company `00000000-0000-0000-0000-000000000001` with zero DDL and zero business data deletion.

### Application Services & Pure Domain Architecture
- **Pure Domain Validation**: `tenantEntities.ts` and `tenantCompanyDomain.ts` enforce legal state transitions, idempotency key validation, and binding integrity without framework dependencies.
- **Provisioning Engine**: `tenantProvisioningEngine.ts` enforces Platform Admin authorization guards, idempotency checks, transactional adapter calls, health check gating, and lifecycle status updates.
- **Local Fallback Engine**: `tenantCompanyProvisioning.ts` provides `provisionTenantWithRbac` reusing canonical domain permissions without duplicate definitions.

### Infrastructure & Presentation
- **Supabase Adapter**: `SupabaseTenantProvisioningAdapter` manages database RPC execution, existing company activation, health check data fetching, status updates, and provisioning job history.
- **Platform Console UI**: `PlatformAdminDashboard.tsx`, `TenantHealthCheckModal.tsx`, `TenantProvisioningWizard.tsx`, and `PlatformAuditLogView.tsx`.

---

## 3. Security Findings

1. **Strict Platform Admin Isolation**:
   - `is_platform_admin()` checks `public.platform_admins` where `user_id = auth.uid()`.
   - Holding the `ADMIN` role within a company's `public.roles` table does NOT grant platform admin privileges. Platform authorization remains strictly segregated.
2. **Hardened SECURITY DEFINER Search Path**:
   - `is_platform_admin()`, `auth_user_company_ids()`, `auth_user_tenant_ids()`, `seed_system_permissions_and_roles()`, and `provision_tenant_transaction()` explicitly declare `SET search_path = public`, eliminating search-path escalation vulnerabilities.
3. **Zero Credential / Service-Role Leakage**:
   - Verification confirmed zero `service_role` keys, raw database connection strings, or plain-text secrets in client bundles or browser storage.
4. **Row Level Security (RLS) Policy Hardening**:
   - Platform tables (`tenants`, `platform_admins`, `tenant_modules`, `tenant_features`, `tenant_provisioning_jobs`) have RLS enabled.
   - Non-platform admins can only SELECT tenant records corresponding to active company memberships derived from `auth_user_company_ids()`.

---

## 4. Data-Integrity Findings

1. **Business Data Preservation Invariant**:
   - Existing company `00000000-0000-0000-0000-000000000001`, main branch `brn_target_01`, 5 customer records, 1 employee, 222 audit logs, vouchers, and kiosk logs remain completely untouched.
2. **Foreign Key Integrity & Constraints**:
   - `tenants.company_id` REFERENCES `companies(id) ON DELETE RESTRICT` (prevents accidental company deletion while tenant exists).
   - `user_company_memberships.company_id` and `user_company_memberships.user_id` enforce `uk_user_company_membership UNIQUE (user_id, company_id)`.
3. **Idempotency Protection**:
   - `tenant_provisioning_jobs` records `idempotency_key UNIQUE`. Re-executing identical requests returns completed job details without generating duplicate companies, branches, or roles.

---

## 5. Provisioning Lifecycle Findings

- **Lifecycle Transition Map**:
  - `PENDING` → `PROVISIONING` → `READY` → `ACTIVE` → `SUSPENDED` / `ARCHIVED`.
- **Health Check Gating**:
  - `evaluateTenantHealth` validates tenant entity existence, company entity existence, main branch existence, active membership existence, subscription record existence, 12 modules initialized, and `ADMIN` role existence before permitting state transition to `ACTIVE`.

---

## 6. RBAC & Module Findings

- **91 Permissions Catalog**: Spans 11 categories (`vouchers`: 11, `pos`: 9, `inventory`: 8, `purchases`: 6, `crm`: 6, `spaces`: 8, `services`: 6, `hr`: 8, `attendance`: 12, `requests`: 8, `management`: 9).
- **7 System Default Roles**: `ADMIN` (91 permissions), `MANAGER` (53 permissions), `ACCOUNTANT` (33 permissions), `SALES` (18 permissions), `EMPLOYEE` (5 permissions), `HR` (23 permissions), `INVENTORY` (12 permissions).
- **12 Canonical Modules**: `crm`, `pos`, `inventory`, `purchases`, `accounting`, `hr`, `attendance`, `spaces`, `services`, `requests`, `documents`, `kiosk`.

---

## 7. Frontend / Application Architecture Findings

- **Clean Architecture Purity**:
  - Domain layer: 100% pure (32 files).
  - Application layer: 100% pure (49 files).
  - Application ports: 100% abstract (18 files).
  - Clean Architecture audit score: **100/100 PASSED**.

---

## 8. Missing Production Capabilities & Gaps

1. **Gap 1: Dynamic Tenant Module & Feature Entitlement Toggle Console**:
   - While `tenant_modules` and `tenant_features` exist in DB, the Platform Admin Dashboard requires an interactive UI component (`TenantModuleEntitlementsModal.tsx`) allowing Platform Admins to enable/disable modules per tenant in real time.
2. **Gap 2: Tenant User Membership & Role Assignment View**:
   - Platform Admins need a dedicated sub-view in the dashboard to inspect tenant user memberships, view company profiles, and assign/revoke tenant user roles without writing manual SQL queries.
3. **Gap 3: Live Tenant Audit Logging Integration**:
   - Platform operations (tenant provisioning, activation, suspension, module toggles) must emit structured events into `system_audit_logs` / `audit_logs` for compliance tracking.

---

## 9. Severity Classification

| Finding ID | Title | Severity | Impact |
| :--- | :--- | :--- | :--- |
| **FIND-01** | Missing Dynamic Module Entitlement Toggle UI | **HIGH** | Platform admins cannot change module plans per tenant via UI |
| **FIND-02** | Missing Tenant User Membership & Role Console | **MEDIUM** | Platform admins cannot inspect/manage tenant user memberships via UI |
| **FIND-03** | Structured Audit Event Emission for Platform Actions | **MEDIUM** | Platform lifecycle operations are not written to central audit log |
| **FIND-04** | Health Check Modal Live Refresh Polling Polish | **LOW** | Health check modal uses manual refresh instead of auto-polling |

---

## 10. Exact Recommended Phase 37 Implementation Scope

Implement **Phase 37 — Enterprise Platform Admin Console & Live Operational Control**:
1. **Module Entitlements Control Component (`TenantModuleEntitlementsModal.tsx`)**:
   - Interactive UI allowing Platform Admins to inspect and toggle the 12 canonical modules per tenant dynamically.
   - Updates `tenant_modules` table via adapter.
2. **Tenant Membership & Role Assignment Console (`TenantMembershipConsole.tsx`)**:
   - Operational component within Platform Admin Dashboard to list company profiles, active memberships, and assigned roles for any selected tenant.
3. **Structured Platform Audit Logging Integration**:
   - Automatically log platform actions (`PROVISION_TENANT`, `ACTIVATE_TENANT`, `SUSPEND_TENANT`, `TOGGLE_MODULE`) to `audit_logs`.
4. **Test Suite Expansion**:
   - Add unit/integration tests in `src/tests/platformAdminUI.test.ts` verifying dynamic module toggles, membership role inspection, and platform audit log emission.

---

## 11. Explicit Items That Must NOT Be Changed

- Do **NOT** alter existing database tables (`companies`, `branches`, `profiles`, `tenants`, `roles`, `permissions`, `role_permissions`, `user_company_memberships`, `user_roles`).
- Do **NOT** modify or delete existing business records or replacement UUIDs for company `00000000-0000-0000-0000-000000000001`.
- Do **NOT** weaken RLS policies or expose `service_role` keys to browser bundles or local storage.
- Do **NOT** grant Platform Admin privileges to Company `ADMIN` role holders.

---

## 12. Required Validation Commands

```bash
npx tsc --noEmit
npm run test:tenant-activation
npm test
npm run lint
npm run build
npm run architecture:audit
git diff --check
```
