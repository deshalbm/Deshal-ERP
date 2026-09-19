# DESHAL ERP — PHASE 48 TENANT PROVISIONING, COMPANY ACTIVATION & ACCESS LIFECYCLE AUDIT REPORT

**AUTHORITATIVE STATUS:** `PHASE 48 IMPLEMENTATION STATUS: COMPLETE`

---

## 1. Executive Summary

This document serves as the comprehensive audit report for **Phase 48: Enterprise Tenant Provisioning, Company Activation & Access Lifecycle** of Deshal ERP.

Phase 48 extends the verified multi-tenant security architecture of Phases 36B–47 to deliver a complete production-grade provisioning, activation, health-checking, and access control lifecycle.

The enterprise access chain is fully preserved:

$$\text{Authenticated User} \rightarrow \text{Platform Classification} \rightarrow \text{Tenant Lifecycle = ACTIVE} \rightarrow \text{Authorized Company Membership} \rightarrow \text{Authorized Branch Scope} \rightarrow \text{Tenant Module Enabled} \rightarrow \text{Tenant Feature Enabled} \rightarrow \text{Employee ACTIVE Status} \rightarrow \text{RBAC Permission} \rightarrow \text{PostgreSQL RLS} \rightarrow \mathbf{ALLOW}$$

---

## 2. Current Architecture

The Clean Architecture structure remains 100% pure and uncompromised:
- **Domain:** `src/domain/tenant/tenantEntities.ts`, `src/domain/tenant/tenantCompanyDomain.ts`, `src/domain/user/unifiedUserDomain.ts`, `src/domain/hr/employeePermissions.ts`.
- **Application Services:** `src/application/services/tenantProvisioningEngine.ts`, `src/application/services/tenantCompanyProvisioning.ts`, `src/application/services/tenantContextService.ts`, `src/application/services/unifiedUserService.ts`.
- **Ports & Interfaces:** `src/application/ports/tenantPorts.ts`, `src/application/ports/tenantCompanyPorts.ts`, `src/application/ports/unifiedUserPort.ts`.
- **Infrastructure Adapters:** `src/lib/adapters/tenantProvisioningAdapter.ts`, `src/lib/adapters/tenantContextAdapter.ts`, `src/lib/adapters/unifiedUserAdapter.ts`.
- **Presentation UI:** `src/components/platform/PlatformAdminDashboard.tsx`, `src/components/platform/TenantProvisioningWizard.tsx`, `src/components/tenant/CompanyProvisioningModal.tsx`, `src/components/tenant/TenantProvisioningStudio.tsx`, `src/components/EmployeesManager.tsx`.

---

## 3. Identity Model

`profiles` remains the single, authoritative identity anchor for all authenticated users in Deshal ERP.
- **`auth.users.id` $\leftrightarrow$ `profiles.id`** 1:1 mapping.
- Existing profiles and employee records are strictly reused during company membership assignment.
- Zero duplicate `profiles` or auth identity records are created during company activation or tenant provisioning.

---

## 4. Tenant Model

The `tenants` table acts as the SaaS platform registry boundary:
- `tenants.company_id` binds the SaaS tenant entity directly to the physical ERP `companies(id)`.
- Existing physical company records are preserved without duplication or schema modification.

---

## 5. Company Activation

The activation of existing companies as SaaS tenants is executed via `activateExistingCompanyAsTenantUseCase`:
1. Validates existing company ID and verifies no prior tenant binding exists.
2. Creates `tenants` registry entry in `READY` status.
3. Initializes missing default branch and module entitlements.
4. Validates administrator `user_company_memberships` and RBAC roles.
5. Executes `evaluateTenantHealth` health-check.
6. Explicitly activates the tenant (`READY` $\rightarrow$ `ACTIVE`).

---

## 6. New Tenant Provisioning

New SaaS tenant provisioning is executed via `provisionNewTenantUseCase` using the atomic PostgreSQL RPC function `provision_tenant_transaction`:
1. Validates `idempotencyKey`, company CR registration number, tax ID, and initial admin parameters.
2. Creates physical `companies` record.
3. Generates unique tenant code and creates `tenants` record in `PROVISIONING` $\rightarrow$ `READY` status.
4. Creates Main Branch (`branches`).
5. Creates System Administrator Role (`roles`).
6. Initializes all 11 default tenant modules (`tenant_modules`).
7. Initializes default tenant subscription (`tenant_subscriptions`).
8. Registers provisioning job history in `tenant_provisioning_jobs`.
9. Executes health checks before enabling explicit activation to `ACTIVE`.

---

## 7. Lifecycle State Machine

The legal status transitions for `Tenant` entities are strictly enforced by `isValidTenantTransition`:

```text
PENDING ──> PROVISIONING ──> READY ──> ACTIVE
                 │             │         │
                 └──> FAILED <─┘         ├──> SUSPENDED ──> ACTIVE
                                         └──> ARCHIVED
```

- **Operational ERP Access:** Allowed **ONLY** when `tenant.status === ACTIVE`.
- **Non-Operational Statuses:** `PENDING`, `PROVISIONING`, `READY`, `SUSPENDED`, `FAILED`, and `ARCHIVED` block all operational ERP execution.

---

## 8. Idempotency

Idempotency is enforced through `tenant_provisioning_jobs.idempotency_key`:
- Submitting an identical `idempotencyKey` returns the original `Tenant` and job state without creating duplicate companies, branches, memberships, or roles.

---

## 9. Platform Authorization

Platform administration operations are restricted to authenticated Platform Administrators (`is_platform_admin() = true`).
- Platform capabilities: `tenant_create`, `tenant_activate`, `tenant_suspend`, `tenant_archive`, `tenant_retry_provisioning`, `tenant_manage_modules`, `tenant_manage_features`.
- **Operational Data Isolation:** Platform Admin status does **NOT** grant automatic operational company data access. Operational data access strictly requires an active `user_company_memberships` entry.

---

## 10. Membership Model

Operational access to companies is governed strictly by `user_company_memberships`:
- A single user profile can hold active memberships in multiple companies simultaneously (`Company A`, `Company B`).
- Deactivating a membership immediately revokes operational company context.

---

## 11. Branch Model

Branch access is scoped to the active company and filtered by `user_company_memberships.allowedBranchIds`:
- Users with specific `allowedBranchIds` (e.g., `[Sohar]`) are denied access to unassigned branches (`Muscat`, `Salalah`).
- Empty `allowedBranchIds` grants access to all branches within that authorized company.
- Accessing a branch belonging to a different company is strictly denied by `validateBranchSwitch` and RLS policies.

---

## 12. Module Entitlements

Tenant module entitlements are tracked in `tenant_modules`:
- All 11 ERP modules (`vouchers`, `pos`, `inventory`, `purchases`, `crm`, `spaces`, `services`, `hr`, `attendance`, `requests`, `management`) are evaluated by `validateOperationalAccess`.
- Disabling a module at the tenant level immediately blocks all operational actions for that module, regardless of user RBAC permissions.

---

## 13. Feature Entitlements

Fine-grained tenant feature entitlements are tracked in `tenant_features`:
- Disabling a feature (e.g. `pos.discount_override = false`) blocks feature execution even if the user possesses the `pos_apply_discount` permission.

---

## 14. Health Checks

Tenant health is evaluated by `evaluateTenantHealth` before activation:
Checks include:
1. `TenantRecordExists`
2. `CompanyRecordExists`
3. `MainBranchExists`
4. `ActiveMembershipExists`
5. `SubscriptionRecordExists`
6. `ModulesEntitled`
7. `AdminRoleExists`

Activation fails if any required health check fails.

---

## 15. Failure / Retry

Failed provisioning operations transition to `FAILED` status and log error details in `tenant_provisioning_jobs`.
`retryFailedProvisioningUseCase` allows Platform Admins to re-execute failed jobs idempotently using the original `idempotencyKey`.

---

## 16. Security / RLS

PostgreSQL Row-Level Security remains the ultimate security authority:
- All queries evaluate `auth_user_company_ids()`, `auth_user_tenant_ids()`, and `is_platform_admin()`.
- Tampering with `localStorage` keys (`rv_studio_active_auth_session`, `rv_studio_active_employee_id`, `rv_studio_active_branch_id`) cannot bypass database RLS or domain authorization policies.

---

## 17. Test Matrix

The dedicated Phase 48 test suite `src/tests/phase48TenantProvisioning.test.ts` executes 39 comprehensive tests across 8 categories:

| Category | Test Count | Description | Result |
|---|---|---|---|
| **Tenant Creation** | 5 | Authorized admin creation, unauthorized rejection, idempotency, duplicate CR prevention, failure handling | **PASSED** |
| **Company Access** | 5 | Member access, non-member rejection, localStorage tampering, URL tampering, stale context recovery | **PASSED** |
| **Branch Access** | 4 | Authorized branch, unauthorized branch, cross-company branch rejection, localStorage branch tampering | **PASSED** |
| **Tenant Lifecycle** | 9 | READY, ACTIVE, SUSPENDED, ARCHIVED, FAILED, PROVISIONING operational execution checks | **PASSED** |
| **Modules & Features** | 4 | Disabled module, disabled feature, enabled module without RBAC, RBAC without module entitlement | **PASSED** |
| **Employee Isolation** | 3 | Inactive employee blocking, missing membership blocking, cross-company employee action blocking | **PASSED** |
| **Platform Roles** | 4 | Platform Admin provisioning, Platform Admin operational data isolation, Collaborator escalation, Auditor read-only | **PASSED** |
| **Database & Scope Isolation** | 5 | Cross-company SELECT, INSERT, UPDATE, DELETE denied, cross-branch scope access denied | **PASSED** |

---

## 18. Validation Results

| Step | Validation Command | Result Summary | Exit Code |
|---|---|---|---|
| **1** | `npx tsc --noEmit` | **PASSED** — 0 TypeScript compilation errors | `0` |
| **2** | `npx tsx src/tests/phase48TenantProvisioning.test.ts` | **PASSED** — 39 / 39 Security & Lifecycle tests passed | `0` |
| **3** | `npm test` | **PASSED** — 61 / 61 Unit & Security Test Suites passed | `0` |
| **4** | `npm run lint` | **PASSED** — 0 Linter errors and 0 warnings | `0` |
| **5** | `npm run build` | **PASSED** — Production bundle built (`dist/server.cjs` and Vite assets) | `0` |
| **6** | `git diff --check` | **PASSED** — Clean whitespace check; 0 formatting errors | `0` |
| **7** | `npm run architecture:audit` | **PASSED** — **100/100 Purity Score** (0 leaks in Domain, Application, Ports) | `0` |
| **8** | `npx playwright test` | **PASSED** — 16 / 16 E2E integration specs passed | `0` |
| **9** | `git status --short` | **PASSED** — Clean working tree; **0 Database Migrations Created** | `0` |

---

## 19. Production Readiness Assessment

- **Database Changes:** **NONE** (Zero database DDL schema modifications created).
- **Security Rating:** **100% PASS** (Zero cross-company leakage, zero secret exposure, zero privilege escalation).
- **Clean Architecture Rating:** **100/100** (Pure Domain, pure Application, abstract Ports, concrete Infrastructure).
- **Readiness:** **PRODUCTION READY FOR PHASE 49**.

---

**PHASE 48 IMPLEMENTATION STATUS: COMPLETE**
