# DESHAL ERP — PHASE 47 DATABASE SECURITY MATRIX

**AUTHORITATIVE STATUS:** `PASSED — VERIFIED DATABASE & RLS SECURITY MATRIX`

---

## 1. Matrix Overview & Security Scenarios

This matrix documents the database-level security policy, tenant/company/branch scoping, RLS policy definition, and security function applied to every table in the PostgreSQL / Supabase schema for Deshal ERP.

### Legend:
- **Company Scoped:** Table contains `company_id` foreign key linked to `public.companies(id)`.
- **Branch Scoped:** Table contains `branch_id` or is scoped via employee branch assignment.
- **Tenant Scoped:** Table contains `tenant_id` or is linked to tenant company.
- **RLS Enabled:** PostgreSQL Row-Level Security (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`) is active.
- **Security Function:** PostgreSQL `SECURITY DEFINER` function evaluated in the RLS policy (`auth_user_company_ids()`, `auth_user_employee_id()`, `is_platform_admin()`, `auth_user_tenant_ids()`).

---

## 2. Complete Database Table Security Matrix

| # | Database Table | Company Scoped | Branch Scoped | Tenant Scoped | RLS Enabled | SELECT | INSERT | UPDATE | DELETE | Security Function | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **1** | `tenants` | YES | NO | YES | YES | `is_platform_admin()` OR `company_id IN (auth_user_company_ids())` | Platform Admin | Platform Admin | Platform Admin | `is_platform_admin()`, `auth_user_company_ids()` | **PASSED** |
| **2** | `platform_admins` | NO | NO | NO | YES | `is_platform_admin()` | Platform Admin | Platform Admin | Platform Admin | `is_platform_admin()` | **PASSED** |
| **3** | `tenant_modules` | NO | NO | YES | YES | `is_platform_admin()` OR `tenant_id IN (auth_user_tenant_ids())` | Platform Admin | Platform Admin | Platform Admin | `is_platform_admin()`, `auth_user_tenant_ids()` | **PASSED** |
| **4** | `tenant_features` | NO | NO | YES | YES | `is_platform_admin()` OR `tenant_id IN (auth_user_tenant_ids())` | Platform Admin | Platform Admin | Platform Admin | `is_platform_admin()`, `auth_user_tenant_ids()` | **PASSED** |
| **5** | `tenant_provisioning_jobs` | YES | NO | YES | YES | `is_platform_admin()` | Platform Admin | Platform Admin | Platform Admin | `is_platform_admin()` | **PASSED** |
| **6** | `companies` | YES (Self) | NO | YES | YES | `id IN (auth_user_company_ids())` | Authorized Member | Authorized Member | Authorized Member | `auth_user_company_ids()` | **PASSED** |
| **7** | `branches` | YES | YES (Self) | YES | YES | `company_id IN (auth_user_company_ids())` | Authorized Member | Authorized Member | Authorized Member | `auth_user_company_ids()` | **PASSED** |
| **8** | `profiles` | YES | NO | YES | YES | `id = auth.uid() OR company_id IN (auth_user_company_ids())` | Self / Auth | Self / Auth | Self / Auth | `auth_user_company_ids()` | **PASSED** |
| **9** | `user_company_memberships` | YES | YES | YES | YES | `user_id = auth.uid() OR company_id IN (auth_user_company_ids())` | Authorized Member | Authorized Member | Authorized Member | `auth_user_company_ids()` | **PASSED** |
| **10** | `employees` | YES | YES | YES | YES | `company_id IN (auth_user_company_ids())` | Authorized Member | Authorized Member | Authorized Member | `auth_user_company_ids()` | **PASSED** |
| **11** | `roles` | YES | NO | YES | YES | `company_id IN (auth_user_company_ids())` | Authorized Member | Authorized Member | Authorized Member | `auth_user_company_ids()` | **PASSED** |
| **12** | `user_roles` | YES (via Role) | NO | YES | YES | `user_id = auth.uid() OR role_id IN (company roles)` | Authorized Member | Authorized Member | Authorized Member | `auth_user_company_ids()` | **PASSED** |
| **13** | `customers` | YES | NO | YES | YES | `company_id IN (auth_user_company_ids())` | Authorized Member | Authorized Member | Authorized Member | `auth_user_company_ids()` | **PASSED** |
| **14** | `contacts` | YES (via Customer) | NO | YES | YES | `customer_id IN (company customers)` | Authorized Member | Authorized Member | Authorized Member | `auth_user_company_ids()` | **PASSED** |
| **15** | `opportunities` | YES | NO | YES | YES | `company_id IN (auth_user_company_ids())` | Authorized Member | Authorized Member | Authorized Member | `auth_user_company_ids()` | **PASSED** |
| **16** | `activities` | YES | NO | YES | YES | `company_id IN (auth_user_company_ids())` | Authorized Member | Authorized Member | Authorized Member | `auth_user_company_ids()` | **PASSED** |
| **17** | `chart_of_accounts` | YES | NO | YES | YES | `company_id IN (auth_user_company_ids())` | Authorized Member | Authorized Member | Authorized Member | `auth_user_company_ids()` | **PASSED** |
| **18** | `cost_centers` | YES | NO | YES | YES | `company_id IN (auth_user_company_ids())` | Authorized Member | Authorized Member | Authorized Member | `auth_user_company_ids()` | **PASSED** |
| **19** | `fiscal_periods` | YES | NO | YES | YES | `company_id IN (auth_user_company_ids())` | Authorized Member | Authorized Member | Authorized Member | `auth_user_company_ids()` | **PASSED** |
| **20** | `journal_entries` | YES | YES | YES | YES | `company_id IN (auth_user_company_ids())` | Authorized Member | Draft Status Only | Draft Status Only (Trig Block) | `auth_user_company_ids()`, `prevent_posted_modification()` | **PASSED** |
| **21** | `journal_entry_lines` | YES (via Entry) | NO | YES | YES | `journal_entry_id IN (company entries)` | Authorized Member | Draft Entry Only | Draft Entry Only | `auth_user_company_ids()` | **PASSED** |
| **22** | `bank_accounts` | YES | NO | YES | YES | `company_id IN (auth_user_company_ids())` | Authorized Member | Authorized Member | Authorized Member | `auth_user_company_ids()` | **PASSED** |
| **23** | `invoices` | YES | YES | YES | YES | `company_id IN (auth_user_company_ids())` | Authorized Member | Authorized Member | Authorized Member | `auth_user_company_ids()` | **PASSED** |
| **24** | `financial_vouchers` | YES | YES | YES | YES | `company_id IN (auth_user_company_ids())` | Authorized Member | Authorized Member | Authorized Member | `auth_user_company_ids()` | **PASSED** |
| **25** | `kiosk_devices` | YES | YES | YES | YES | `company_id IN (auth_user_company_ids())` | Authorized Member | Authorized Member | Authorized Member | `auth_user_company_ids()` | **PASSED** |
| **26** | `attendance_movement_logs` | YES | YES | YES | YES | `company_id IN (auth_user_company_ids())` | Authorized Member | Authorized Member | Authorized Member | `auth_user_company_ids()` | **PASSED** |
| **27** | `payroll_slips` | YES | NO | YES | YES | `company_id IN (auth_user_company_ids()) OR employee_id = auth_user_employee_id()` | Authorized Member | Authorized Member | Authorized Member | `auth_user_company_ids()`, `auth_user_employee_id()` | **PASSED** |
| **28** | `leave_requests` | YES | NO | YES | YES | `company_id IN (auth_user_company_ids()) OR employee_id = auth_user_employee_id()` | Authorized Member | Authorized Member / Self | Authorized Member | `auth_user_company_ids()`, `auth_user_employee_id()` | **PASSED** |
| **29** | `spaces` | YES | YES | YES | YES | `company_id IN (auth_user_company_ids())` | Authorized Member | Authorized Member | Authorized Member | `auth_user_company_ids()` | **PASSED** |
| **30** | `space_bookings` | YES | YES | YES | YES | `company_id IN (auth_user_company_ids())` | Authorized Member | Authorized Member | Authorized Member | `auth_user_company_ids()` | **PASSED** |
| **31** | `lease_contracts` | YES | YES | YES | YES | `company_id IN (auth_user_company_ids())` | Authorized Member | Authorized Member | Authorized Member | `auth_user_company_ids()` | **PASSED** |
| **32** | `products` | YES | NO | YES | YES | `company_id IN (auth_user_company_ids())` | Authorized Member | Authorized Member | Authorized Member | `auth_user_company_ids()` | **PASSED** |
| **33** | `warehouses` | YES | YES | YES | YES | `company_id IN (auth_user_company_ids())` | Authorized Member | Authorized Member | Authorized Member | `auth_user_company_ids()` | **PASSED** |
| **34** | `stock_balances` | YES | YES | YES | YES | `company_id IN (auth_user_company_ids())` | Authorized Member | Authorized Member | Authorized Member | `auth_user_company_ids()` | **PASSED** |
| **35** | `suppliers` | YES | NO | YES | YES | `company_id IN (auth_user_company_ids())` | Authorized Member | Authorized Member | Authorized Member | `auth_user_company_ids()` | **PASSED** |
| **36** | `purchase_orders` | YES | YES | YES | YES | `company_id IN (auth_user_company_ids())` | Authorized Member | Authorized Member | Authorized Member | `auth_user_company_ids()` | **PASSED** |
| **37** | `requests` | YES | NO | YES | YES | `company_id IN (auth_user_company_ids())` | Authorized Member | Authorized Member | Authorized Member | `auth_user_company_ids()` | **PASSED** |
| **38** | `documents` | YES | NO | YES | YES | `company_id IN (auth_user_company_ids())` | Authorized Member | Authorized Member | Authorized Member | `auth_user_company_ids()` | **PASSED** |

---

## 3. Security Boundary Verification Summary

- **Company Isolation:** Handled strictly by `company_id IN (SELECT public.auth_user_company_ids())`. `user_company_memberships` is the single authoritative source of user-company association.
- **Branch Isolation:** Handled by application domain policy `isAuthorizedForBranch` and DB queries scoped to `company_id` and authorized `branch_id`.
- **Platform Admin Isolation:** Platform Admin role grants platform administration (`tenants`, `tenant_modules`, `tenant_features`, `tenant_provisioning_jobs`), but does NOT grant access to ERP operational tables unless an active membership exists in `user_company_memberships`.
