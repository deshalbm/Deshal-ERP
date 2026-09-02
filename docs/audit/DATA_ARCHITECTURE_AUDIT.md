# DATA_ARCHITECTURE_AUDIT.md
# Deshal ERP — Data Architecture Audit

> **Audit Date**: 2026-09-02  
> **Phase**: Read-Only Discovery  

---

## 1. Data Model Summary

The system has **28+ distinct data entities** defined across 3 TypeScript files:

| Entity | File | Lines | Relationships |
|---|---|---|---|
| `Branch` | `types.ts` | L10-31 | Root entity; referenced by almost everything |
| `StockTransfer` + `StockTransferItem` | `types.ts` | L33-58 | Links 2 Branches + InventoryItems |
| `LineItem` | `types.ts` | L60-69 | Embedded in ReceiptVoucher |
| `CustomField` | `types.ts` | L71-75 | Embedded in ReceiptVoucher |
| `ReceiptVoucher` | `types.ts` | L77-117 | Core financial document; referenced by many |
| `InventoryItem` | `types.ts` | L125-146 | In Inventory, POS, Purchases |
| `StockMovement` | `types.ts` | L158-174 | References InventoryItem + Branch |
| `PurchaseInvoice` + `PurchaseItem` | `types.ts` | L194-224 | References Supplier, Branch, InventoryItem |
| `Supplier` | `types.ts` | L226-240 | Referenced by Purchases |
| `Customer` + `CustomerInteraction` | `types.ts` | L255-281 | Referenced by Vouchers, CRM, Contracts |
| `CompanySettings` | `types.ts` | L352-383 | Global config; affects all documents |
| `DesignTheme` | `types.ts` | L391-421 | Print template config |
| `Employee` | `types.ts` | L465-495 | HR core entity |
| `AttendanceRecord` | `types.ts` | L503-520 | References Employee |
| `PayrollSlip` | `types.ts` | L524-558 | References Employee, links to Voucher |
| `LeaveRequest` | `types.ts` | L564-581 | References Employee |
| `AttendanceMovementLog` | `types.ts` | L644-673 | References Employee + KioskDevice |
| `KioskDevice` | `types.ts` | L623-642 | References Branch |
| `AuditLogEntry` | `types.ts` | L750-766 | Global audit trail |
| `UserAccount` | `types.ts` | L774-798 | References Employee |
| `AuthSession` | `types.ts` | L833-842 | References UserAccount + Employee |
| `POSOrder` + `POSOrderItem` | `types.ts` | L880-917 | References Customer, Branch, InventoryItem |
| `CashierShift` + `CashMovement` | `types.ts` | L943-969 | References Employee, Branch |
| `RecurringSchedule` | `types.ts` | L995-1039 | Generates ReceiptVouchers |
| `RentalSpace` | `types.ts` | L1061-1090 | References Branch |
| `SpaceBooking` | `types.ts` | L1092-1149 | References RentalSpace, Customer, Voucher |
| `ConsultingService` | `types.ts` | L1178-1199 | Catalog item |
| `MembershipPackage` | `types.ts` | L1203-1220 | Subscription tier |
| `TenantSubscription` | `types.ts` | L1222-1252 | References Customer, MembershipPackage |
| `ServiceBooking` | `types.ts` | L1260-1304 | References ConsultingService, Customer, Voucher |
| `LeaseContract` | `types.ts` | L1426-1553 | References RentalSpace, Customer, Branch, Voucher |
| `PaymentInstallment` | `types.ts` | L1337-1356 | Embedded in LeaseContract, links to Voucher |
| `SecurityDeposit` | `types.ts` | L1365-1382 | Embedded in LeaseContract |
| `Account` | `types/accounting.ts` | L41-65 | Chart of Accounts |
| `JournalEntry` + `JournalEntryLine` | `types/accounting.ts` | L151-183 | References Account, Branch |
| `FiscalPeriod` | `types/accounting.ts` | L200-214 | Period locking |
| `BankAccount` | `types/accounting.ts` | L334-350 | References Account (GL) |
| `BankReconciliationSession` | `types/accounting.ts` | L375-399 | References BankAccount |
| `RequestType` (dynamic form) | `types/requests.ts` | — | Custom form schema |
| `SubmittedRequest` | `types/requests.ts` | — | References RequestType, Employee |

---

## 2. Entity Relationship Overview

### Core Financial Flow
```
Customer
  └──→ ReceiptVoucher (type: RECEIPT/INVOICE/QUOTATION/PAYMENT/PETTY_CASH)
           ├── LineItems[]
           └── CustomFields[]

PurchaseInvoice → Supplier
  └──→ ReceiptVoucher (type: PAYMENT, auto-generated)

SpaceBooking → RentalSpace → Branch
  └──→ ReceiptVoucher (auto-generated on booking confirmation)

ServiceBooking → ConsultingService
  └──→ ReceiptVoucher (auto-generated on completion)

LeaseContract → RentalSpace → Branch → Customer
  ├── PaymentInstallment[] → ReceiptVoucher (per installment)
  └── SecurityDeposit → ReceiptVoucher (on refund)

POSOrder → Customer → InventoryItem[]
  └──→ ReceiptVoucher (auto-generated on checkout)

PayrollSlip → Employee
  └──→ ReceiptVoucher (type: PAYMENT, on disbursement)
```

### CRM Integration
```
ReceiptVoucher.receivedFrom → syncCustomerFromVoucher() → Customer (auto-create/update)
SpaceBooking.customerName → Customer (auto-create if not exists)
LeaseContract.tenantName → Customer (auto-create if not exists)
```

### HR Hierarchy
```
Employee ──→ Branch (branchId)
           ├── AttendanceRecord[] (daily records)
           ├── PayrollSlip[] (monthly payroll)
           ├── LeaveRequest[] (leave management)
           └── AttendanceMovementLog[] (kiosk entries via KioskDevice)

UserAccount ──→ Employee (employeeId)
AuthSession ──→ UserAccount + Employee
```

### Accounting Integration
```
Account → JournalEntry → JournalEntryLine (debit/credit)
        ← TrialBalance (computed)
        ← IncomeStatement (computed)
        ← BalanceSheet (computed)

FiscalPeriod → controls posting lock/unlock
BankAccount → BankReconciliationSession → BankStatementTransaction
```

---

## 3. Data Integrity Analysis

### 3.1 Foreign Key Relationships (Client-Side Only)

All relationships are maintained by **convention/string matching** — there is no referential integrity enforcement:

| Relationship | Type | Integrity Risk |
|---|---|---|
| `ReceiptVoucher.branchId` → `Branch.id` | String ID reference | No enforcement; orphaned if branch deleted |
| `SpaceBooking.spaceId` → `RentalSpace.id` | String ID reference | No enforcement |
| `LeaseContract.customerId` → `Customer.id` | String ID reference | Optional; often identified by name |
| `PayrollSlip.employeeId` → `Employee.id` | String ID reference | No enforcement |
| `JournalEntry.branchId` → `Branch.id` | String ID reference | No enforcement |
| `UserAccount.employeeId` → `Employee.id` | String ID reference | Login breaks if employee deleted |
| `PaymentInstallment.linkedVoucherId` → `ReceiptVoucher.id` | String ID reference | No enforcement |

### 3.2 Customer Identification Inconsistency

Customers are linked to other entities in 3 different ways:
1. By `customerId` (proper ID reference) — used in some entities
2. By `customerName` (string match) — used in auto-sync logic
3. By `name`/`tenantName`/`receivedFrom` (loose string match) — in contracts/vouchers

This creates potential for **duplicate customer records** when the same entity is referenced differently.

### 3.3 Voucher Number Generation

```typescript
// From App.tsx createNewVoucherState()
let maxSeq = 801;
vouchersList.forEach((v) => {
  const match = v.voucherNumber?.match(/(?:RV|INV|QT|PV|PC)-\d+-(\\d+)/i);
  if (match) maxSeq = Math.max(maxSeq, parseInt(match[1]));
});
const nextSeq = (maxSeq + 1).toString().padStart(4, "0");
```

**Risk**: Sequential number generation on client-side with no server coordination — race condition possible if multiple browser tabs are open simultaneously.

### 3.4 localStorage Size Limits

| Entity | Data Volume | Estimated localStorage Usage |
|---|---|---|
| Vouchers (43 seeded) | ~50 KB JSON per 100 vouchers | Grows linearly |
| Audit Logs | ~1-5 KB per entry | Can grow rapidly |
| Attendance Movement Logs | ~1 KB per entry | High volume in active use |
| Full GL (Journal Entries) | ~2-10 KB per entry | Moderate |
| **Total browser localStorage limit** | ~5-10 MB (varies by browser) | **Risk at scale** |

---

## 4. Default Seed Data

The system ships with realistic seed data for demonstration:

| Dataset | Count | Description |
|---|---|---|
| Vouchers | 43 | Receipt vouchers for شركة الدليل الشامل (RV-2026-0802 to RV-2026-0844) |
| Customers | 4 | Omani corporate clients |
| Inventory Items | 8 | CCTV, networking, interactive screens equipment |
| Employees | 5 | Admin, Accountant, Storekeeper, Sales, Receptionist |
| User Accounts | 5 | One per employee with roles |
| Branches | 2 | Sohar Main + Muscat Ghala |
| Rental Spaces | ~4-6 | Training halls, offices, desks |
| Consulting Services | ~5-8 | Accounting, Marketing, HR, PRO services |
| Membership Packages | ~3-5 | STARTUP, PRO, ENTERPRISE tiers |

---

## 5. Accounting Data Architecture

### 5.1 Chart of Accounts Structure
The GL uses a **5-level hierarchical account tree**:
- Level 1: Account Type (`ASSET`, `LIABILITY`, `EQUITY`, `REVENUE`, `EXPENSE`)
- Level 2: Account Category (e.g., `CURRENT_ASSET`, `CASH_BANK`, `SALES_REVENUE`)
- Level 3-5: Sub-accounts via `parentId` self-reference

### 5.2 Double-Entry Invariant
```
JournalEntry.totalDebit === JournalEntry.totalCredit  (isBalanced must = true)
```
Enforced via `JournalEntry.isBalanced` flag but **computed client-side**, not guaranteed by a database constraint.

### 5.3 Journal Entry Lifecycle
```
DRAFT → REVIEWED → APPROVED → POSTED → REVERSED (with REVERSAL entry)
                                      └→ LOCKED
                                      └→ CANCELLED (only drafts)
```

### 5.4 Missing Accounting Integrations
The Accounting module **does not automatically post** journal entries for:
- POS sales (would need: Dr Accounts Receivable/Cash, Cr Sales Revenue, Cr VAT Payable, Dr COGS, Cr Inventory)
- Purchase invoices (would need: Dr Inventory/Expense, Dr VAT Receivable, Cr Accounts Payable)
- Payroll disbursement (partial: generates a voucher but no GL posting)

These are left as **manual** journal entry tasks.

---

## 6. Requests Engine Data Schema

The Dynamic Requests Engine (`types/requests.ts`) implements a **schema-on-write** form system:

```
RequestType (Form Schema)
  ├── id, name, description, icon
  ├── category (LEAVE, PURCHASE, HR, OPERATIONS, CUSTOM)
  ├── fields: RequestField[]
  │     ├── id, label, type (TEXT|DATE|SELECT|TEXTAREA|CHECKBOX|NUMBER|FILE)
  │     ├── required, options[], placeholder
  │     └── validationRules
  ├── approvalLevels: ApprovalLevel[]
  │     ├── order, approverRole, approverEmployeeId
  │     └── isRequired
  └── documentTemplate (for QR-verified certificate generation)

SubmittedRequest
  ├── requestTypeId → RequestType
  ├── submittedByEmployeeId → Employee
  ├── fieldValues: Record<fieldId, value>
  ├── status: DRAFT | SUBMITTED | IN_REVIEW | APPROVED | REJECTED | WITHDRAWN
  ├── approvalHistory: ApprovalHistoryEntry[]
  └── generatedDocumentUrl (for QR-verified certificates)
```

---

## 7. WhatsApp Data Schema

```
WhatsAppSettings (embedded in CompanySettings)
  ├── provider: "baileys" | "manual"
  ├── serverPreset: generic_baileys | evolution_api | baileys_http | wppconnect | custom
  ├── serverUrl, apiKey, sessionId, defaultCountryCode
  ├── Feature flags: autoSendOnVoucherCreate, autoSendOnPOSCheckout, etc.
  └── endpoints: { sendText, sendMedia, checkStatus, getQr, startSession, logoutSession }

WhatsAppMessageLog
  └── Stored in localStorage (rv_studio_whatsapp_logs)
      Records: id, timestamp, recipientPhone, messageType, status, method
```

---

## 8. Migration & Backfill Considerations

| Change Type | Current Approach | Risk |
|---|---|---|
| Adding new field to existing entity | Schema spreads with defaults in `loadXxx()` | Safe if optional |
| Renaming a field | Breaking — all stored localStorage data uses old key | **High risk; no migration** |
| Changing entity ID format | Must update all referencing entities manually | **High risk** |
| Adding new entity with relationships | Create new storage key + seed data | Safe if IDs don't conflict |
| Deleting an entity | Orphaned references remain; no cascade delete | **Data consistency risk** |

**Current migration strategy**: The `loadVouchers()` function has an example of forward-compatible migration (merging missing sample vouchers, updating currencies). This pattern should be formalized.

---

*Document created as part of Phase 1 Read-Only Audit. No code was modified.*
