# Deshal ERP — Row Level Security (RLS) & Authorization Model

> **Document Version**: 1.0.0  
> **Objective**: Comprehensive PostgreSQL Row Level Security (RLS) policy design enforcing tenant isolation, role-based access control (RBAC), and accounting data protection.

---

## 1. Security Philosophy & Principles

1. **Default Deny**: RLS is enabled on **every** table (`ALTER TABLE xyz ENABLE ROW LEVEL SECURITY;`). Unless an explicit policy permits access, all SELECT, INSERT, UPDATE, and DELETE actions return zero rows or error.
2. **Tenant Scoping**: All queries are automatically constrained to companies where the authenticated user is an active member:
   ```sql
   company_id IN (SELECT auth_user_company_ids())
   ```
3. **Role & Permission Check**: Sensitive write and update actions require string permission evaluation (e.g. `auth_user_has_permission('accounting:post')`).
4. **Financial Record Protection**: Posted journal entries and financial postings cannot be updated or deleted by normal users via RLS.

---

## 2. Helper PostgreSQL Security Functions

```sql
-- Helper 1: Retrieve all active company IDs for authenticated user
CREATE OR REPLACE FUNCTION public.auth_user_company_ids()
RETURNS SETOF UUID AS $$
  SELECT company_id 
  FROM public.user_company_memberships 
  WHERE user_id = auth.uid() AND is_active = true;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper 2: Check if authenticated user holds a specific string permission
CREATE OR REPLACE FUNCTION public.auth_user_has_permission(p_permission TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = auth.uid() 
      AND p.code = p_permission
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper 3: Retrieve primary employee ID of authenticated user
CREATE OR REPLACE FUNCTION public.auth_user_employee_id()
RETURNS UUID AS $$
  SELECT employee_id 
  FROM public.profiles 
  WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

---

## 3. Domain RLS Policy Matrix

### 3.1 Organization & Identity Domain
- **`companies`**:
  - `SELECT`: Allowed if `id IN (SELECT auth_user_company_ids())`.
  - `UPDATE`: Allowed if `auth_user_has_permission('company:edit')`.
- **`profiles`**:
  - `SELECT`: Allowed for users within the same company.
  - `UPDATE`: Self update allowed (`id = auth.uid()`) or `auth_user_has_permission('users:manage')`.

---

### 3.2 Accounting & Financial Protection Domain
- **`journal_entries`**:
  - `SELECT`: Allowed for users in company with `accounting:view` permission.
  - `INSERT`: Allowed for `accounting:create` permission.
  - `UPDATE`: Allowed **ONLY IF `status = 'DRAFT'`** and user has `accounting:edit` permission.
  - **POSTED Protection Policy**:
    ```sql
    CREATE POLICY journal_entries_update_policy ON public.journal_entries
    FOR UPDATE USING (
      company_id IN (SELECT auth_user_company_ids())
      AND status = 'DRAFT'
      AND auth_user_has_permission('accounting:edit')
    );
    ```

---

### 3.3 HR & Employee Privacy Domain
- **`payroll_slips`**:
  - `SELECT`: Allowed if user is `HR_MANAGER`, `COMPANY_ADMIN`, OR if the slip belongs to the logged-in employee (`employee_id = auth_user_employee_id()`).
  - `INSERT/UPDATE`: Restricted to `hr:manage_payroll` permission holders.

---

### 3.4 Tamper-Evident Audit Logs
- **`audit_logs`**:
  - `SELECT`: Allowed for `COMPANY_ADMIN` and `AUDITOR` roles within company.
  - `INSERT`: Allowed for all authenticated users to log actions.
  - `UPDATE / DELETE`: **STRICTLY DENIED** (No policy defined -> Default Deny). Ensures audit log immutability.

---

## 4. Verification & Cross-Tenant Security Testing

1. **Cross-Company Leak Test**: Verify User A in Company 1 cannot read, insert, or modify rows in Company 2.
2. **Role Escalation Test**: Verify an Employee user cannot call `POST` or `REVERSE` on journal entries.
3. **Audit Log Tamper Test**: Verify `DELETE FROM audit_logs` fails for admin users.
