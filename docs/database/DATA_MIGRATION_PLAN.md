# Deshal ERP — Data Migration & Backfill Plan

> **Document Version**: 1.0.0  
> **Objective**: Safe, incremental migration of client-side `localStorage` data and seed collections into structured Supabase PostgreSQL tables without breaking existing functionality.

---

## 1. Audit of Existing Data Sources

Current data persistence relies on browser `localStorage` utilities (`src/utils/*Storage.ts`):

| Key | Current Format | Destination Table | Risk |
| :--- | :--- | :--- | :--- |
| `rv_studio_vouchers` | JSON Array of `ReceiptVoucher` | `invoices`, `receipts`, `payments` | Medium (Need type separation) |
| `rv_studio_customers` | JSON Array of `Customer` | `customers` | Low (Direct mapping) |
| `rv_studio_inventory` | JSON Array of `InventoryItem` | `products`, `stock_balances` | Low (Direct mapping) |
| `rv_studio_purchases` | JSON Array of `PurchaseInvoice` | `purchase_orders`, `supplier_invoices` | Medium (Need FK binding) |
| `rv_studio_suppliers` | JSON Array of `Supplier` | `suppliers` | Low (Direct mapping) |
| `rv_studio_employees` | JSON Array of `Employee` | `employees` | Low (Direct mapping) |
| `rv_studio_attendance_logs` | JSON Array of `AttendanceMovementLog` | `attendance_movement_logs` | Low (High volume) |
| `rv_studio_general_ledger_accounts` | JSON Array of `Account` | `chart_of_accounts` | Medium (Hierarchy mapping) |
| `rv_studio_journal_entries` | JSON Array of `JournalEntry` | `journal_entries`, `journal_entry_lines` | **High** (Debit=Credit invariant check) |
| `rv_studio_branches` | JSON Array of `Branch` | `branches` | Low (Master entity) |
| `rv_studio_spaces` | JSON Array of `RentalSpace` | `spaces` | Low (Direct mapping) |
| `rv_studio_services` | JSON Array of `ConsultingService` | `services` | Low (Direct mapping) |
| `rv_studio_lease_contracts` | JSON Array of `LeaseContract` | `lease_contracts` | Medium (Installment extraction) |
| `rv_studio_requests` | JSON Array of `SubmittedRequest` | `requests` | Medium (Field JSONB mapping) |
| `rv_studio_audit_logs` | JSON Array of `AuditLogEntry` | `audit_logs` | Low (Append-only) |

---

## 2. Field-Level Data Mapping Matrix

### 2.1 Customer Migration (`rv_studio_customers` -> `customers`)
```typescript
{
  id: customer.id -> id (UUID / Text),
  name: customer.name -> name,
  phone: customer.phone -> phone,
  email: customer.email -> email,
  city: customer.city -> city,
  taxId: customer.taxId -> tax_id,
  crNumber: customer.crNumber -> cr_number,
  company_id -> default company UUID
}
```

### 2.2 Accounting Chart of Accounts (`rv_studio_general_ledger_accounts` -> `chart_of_accounts`)
```typescript
{
  id: acc.id -> id,
  code: acc.code -> code,
  nameAr: acc.nameAr -> name_ar,
  nameEn: acc.nameEn -> name_en,
  type: acc.type -> type,
  category: acc.category -> category,
  parentId: acc.parentId -> parent_id,
  isPosting: acc.isPosting -> is_posting,
  currency: acc.currency -> currency
}
```

### 2.3 Double-Entry Journal Entries (`rv_studio_journal_entries` -> `journal_entries` + `journal_entry_lines`)
- **Parent Table (`journal_entries`)**:
  - `entry_number`, `date`, `type`, `status`, `total_debit`, `total_credit`, `is_balanced`, `description_ar`, `description_en`, `posted_at`, `created_by`.
- **Child Lines (`journal_entry_lines`)**:
  - Unpack `entry.lines[]`: `journal_entry_id`, `account_id` (matched via `account_code`), `description_ar`, `debit`, `credit`, `cost_center_id`.
- **Validation**: Verify `SUM(debit) === SUM(credit)` for every entry before inserting.

---

## 3. Incremental Migration Pipeline

Migration is executed in **5 ordered phases** to maintain referential integrity:

```text
Phase 1: Foundation Setup
  ├── Create Schema Migrations (0001 to 0012)
  ├── Seed Default Roles & Permissions
  └── Seed Default Company & Branches

Phase 2: Master Entities Migration
  ├── Customers & Contacts
  ├── Employees & User Accounts
  ├── Suppliers & Catalog Services
  └── Chart of Accounts & Cost Centers

Phase 3: Operational Assets Migration
  ├── Inventory Products & Warehouses
  ├── Spaces & Rental Units
  └── Kiosk Devices & Form Schemas

Phase 4: Transactional Data Migration
  ├── Vouchers, Invoices & Payments
  ├── POS Orders & Shift Logs
  ├── Space Bookings & Lease Contracts
  └── Journal Entries & Line Allocation

Phase 5: Reconciliation & Verification
  ├── Verify Trial Balance Equality (Debit = Credit)
  ├── Verify Inventory Stock Quantities
  └── Verify Audit Trail Continuity
```

---

## 4. Fallback & Hybrid Sync Mechanism

To ensure seamless operation during migration:
1. **Hybrid Storage Adapter**: The storage layer (`src/utils/storage.ts`) checks if Supabase is connected. If connected, read/write routes through Supabase Client; if disconnected or offline, fallback to `localStorage`.
2. **Background Backfill Script**: `src/utils/supabaseSync.ts` provides a structured `syncAllLocalStorageToSupabase()` action that reads `localStorage`, formats records, checks for duplicates, and uploads to Supabase.
3. **Data Loss Prevention**: `localStorage` records are marked as `synced_at` rather than deleted immediately.

---

## 5. Data Validation & Audit Criteria

Post-migration validation requires:
1. **Record Count Matching**: `COUNT(localStorage)` === `COUNT(PostgreSQL table)`.
2. **Financial Balance Matching**: `SUM(total_debit)` === `SUM(total_credit)` across all posted journal entries.
3. **Foreign Key Integrity Check**: 0 orphaned foreign keys.
