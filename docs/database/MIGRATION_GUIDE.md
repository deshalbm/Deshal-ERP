# Deshal ERP — Supabase Migration Execution Guide

> **Document Version**: 1.0.0  
> **Objective**: Standard operating procedure for creating, testing, and applying versioned SQL database migrations to Supabase environments.

---

## 1. Migration Directory & Naming Structure

All database schema changes must be committed as versioned SQL migration scripts in:
```text
supabase/
└── migrations/
    ├── 0001_initial_core_schema.sql
    ├── 0002_identity_access_rbac.sql
    ├── 0003_customers_crm.sql
    ├── 0004_accounting_journal_ledger.sql
    ├── 0005_hr_attendance_payroll.sql
    ├── 0006_spaces_leasing_services.sql
    ├── 0007_inventory_purchasing.sql
    ├── 0008_requests_engine.sql
    ├── 0009_system_audit_logs.sql
    └── 0010_rls_security_policies.sql
```

---

## 2. Migration Execution Rules

1. **Reversibility**: Every migration must be documented with an idempotent `UP` script and a corresponding `DOWN` rollback script.
2. **Transactional Safety**: Run DDL inside transactions (`BEGIN; ... COMMIT;`) to prevent partial migration failures.
3. **No Direct Production GUI Editing**: Never alter database columns or constraints manually in the Supabase Table Editor without writing a versioned SQL file.

---

## 3. Command Line Migration Execution

Using Supabase CLI:
```bash
# Link local environment to remote project
npx supabase link --project-ref <your-project-id>

# Run pending migrations
npx supabase db push

# Verify status
npx supabase db remote commit
```
