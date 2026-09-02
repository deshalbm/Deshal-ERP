# MODULE_INVENTORY.md
# Deshal ERP — Complete Module & Component Inventory

> **Audit Date**: 2026-09-02  
> **Phase**: Read-Only Discovery  
> **Scope**: All components, pages, sub-modules, actions, and data dependencies

---

## Module Map: Tab → Submodule → Actions

---

### 1. HOME — الرئيسية (Dashboard)
**Component**: `HomeDashboard.tsx` (45.5 KB)  
**Tab**: `home`

| Submodule | Description | Key Actions |
|---|---|---|
| KPI Cards | Total Revenue, Customers, Inventory, Employees, Profit | View-only |
| Recent Vouchers | Last 5-10 receipts/invoices | View, navigate to editor |
| Low Stock Alerts | Items below `minAlertQuantity` | Navigate to Inventory |
| Revenue Chart | Monthly trends via Recharts | View |
| Quick Actions | Create new voucher by type | RECEIPT, PAYMENT, INVOICE, QUOTATION, PETTY_CASH |
| Pending Tasks | Expiring contracts, due installments | Navigate to Contracts |
| Sales Analytics | `DashboardAnalytics.tsx` (23.9 KB) | View charts |
| Due Dates Alerts | `DueDatesAlertsCenter.tsx` (22.3 KB) | Alert center |
| Activity Logs | `ActivityLogsManager.tsx` (28.6 KB) | View audit log |

---

### 2. POS — نقطة البيع
**Component**: `POSView.tsx` (108.7 KB)  
**Tab**: `pos`

| Submodule | Description | Key Actions |
|---|---|---|
| Product Grid | Browse & search inventory items | Add to cart |
| Barcode Scanner | `BarcodeScannerModal.tsx` (19.2 KB) | Scan product barcode |
| Shopping Cart | Current order items | Modify qty, remove, apply discount |
| Customer Assignment | Link sale to CRM customer | Select/create customer |
| Payment Processing | Multi-method payment | CASH, CARD, SPLIT, CREDIT, BANK, ONLINE |
| Cashier Shift | Open/close shift with cash float | Shift report, close shift |
| Held Carts | Park & recall in-progress orders | Park, recall, delete |
| POS Receipt | Thermal receipt preview & print | Print, WhatsApp share |
| POS History | `POSView.tsx` internal tab | View past orders, refunds |
| Cash Drawer | Cash in/out movements | Add/remove cash |
| Refunds | Process item or order refunds | Refund selected items |

---

### 3. ACCOUNTING — المحاسبة والأستاذ العام
**Component**: `GeneralLedgerAccountsView.tsx` (100.7 KB)  
**Tab**: `accounting`

Sub-components in `src/components/accounting/`:

| Submodule | Component | Description | Key Actions |
|---|---|---|---|
| Chart of Accounts | `AccountFormModal.tsx` (13.3 KB) | Create/edit accounts | Add, Edit, Deactivate |
| Account Statement | `AccountStatementModal.tsx` (13.1 KB) | Ledger entries per account | View, Export |
| Journal Entries | `JournalEntryModal.tsx` (25.6 KB) | Create/edit journal entries | Create, Edit, Post, Reverse |
| Entry Details | `JournalEntryDetailsModal.tsx` (13.9 KB) | View entry details | View, Approve |
| Reversal | `ReverseEntryModal.tsx` (7.6 KB) | Reverse a posted entry | Reverse with reason |
| Bank Reconciliation | `BankReconciliationTab.tsx` (28.8 KB) | Match bank statements | Import, Match, Reconcile |
| Cost Centers | `CostCentersTab.tsx` (13.2 KB) | Manage cost centers | CRUD |
| Accounting Settings | `AccountingSettingsTab.tsx` (24.5 KB) | Configure GL settings | Save settings |
| Trial Balance | GL View internal tab | View TB report | Export |
| P&L Statement | GL View internal tab | Income statement | View, Export |
| Balance Sheet | GL View internal tab | B/S report | View, Export |
| Diagnostic Tool | GL View internal tab | Detect imbalances | Run diagnostics, auto-fix |
| Fiscal Periods | GL View internal tab | Open/close periods | Lock/Unlock period |

---

### 4. SPACES — المساحات والقاعات
**Component**: `SpacesManager.tsx` (74.6 KB)  
**Tab**: `spaces`

| Submodule | Description | Key Actions |
|---|---|---|
| Spaces List | All rental spaces (offices, halls, desks) | View, Add, Edit, Delete |
| Space Card | Detail: type, capacity, rates, amenities | Edit, Book |
| Booking Calendar | Visual availability calendar | View bookings |
| Space Booking Modal | `SpaceBookingModal.tsx` (32 KB) | New booking creation | Book hourly/daily/monthly |
| Booking Management | List of all bookings | Confirm, Cancel, Check-in |
| Voucher Generation | Auto-generate receipt from booking | Generate Voucher |

---

### 5. CONTRACTS — عقود الإيجار
**Component**: `LeaseContractsManager.tsx` (47 KB)  
**Tab**: `contracts`

Sub-components:
- `LeaseContractEditorModal.tsx` (79.6 KB)
- `LeaseContractPrintView.tsx` (26.8 KB)
- `SecurityDepositModal.tsx` (12.6 KB)
- `DigitalSignaturePad.tsx` (24.8 KB)

| Submodule | Description | Key Actions |
|---|---|---|
| Contracts List | All lease contracts with status | Filter, Search |
| Contract Editor | Full contract form (12 sections) | Create, Edit, Sign |
| Digital Signature | Lessor + Tenant signature capture | Sign (canvas pad) |
| Installment Schedule | Payment schedule with dates | View, Collect |
| Deposit Management | Security deposit tracking | Record, Settle, Refund |
| Contract Print | Official contract PDF print view | Print, PDF Export |
| WhatsApp Share | Share contract summary | Send via WhatsApp |

---

### 6. SERVICES — الخدمات الاستشارية
**Component**: `ServicesManager.tsx` (57 KB)  
**Tab**: `services`

Sub-components:
- `ServiceBookingModal.tsx` (22.4 KB)
- `TenantSubscriptionModal.tsx` (24.1 KB)

| Submodule | Description | Key Actions |
|---|---|---|
| Services Catalog | List of consulting/admin services | Add, Edit, Archive |
| Service Booking | Book a specific service | Book, Assign consultant |
| Membership Packages | Tier packages (BASIC→ENTERPRISE) | Add, Edit, Deactivate |
| Tenant Subscriptions | Active subscriptions with quotas | Create, Edit, Renew |
| Quota Tracking | Meeting hours, studio hours, consultations | Track usage |
| Voucher from Booking | Generate receipt for paid booking | Generate |

---

### 7. PORTAL — بوابة الحجز
**Component**: `ClientBookingPortal.tsx` (22.5 KB)  
**Tab**: `portal`

| Submodule | Description | Key Actions |
|---|---|---|
| Services Browse | Client-facing service catalog | Book Service |
| Spaces Browse | Available spaces for booking | Book Space |
| Subscription Check | Quota-aware pricing | Auto-apply discount |

---

### 8. DOC-WIZARD — منشئ الوثائق
**Component**: `DocWizardView.tsx` (78.2 KB)  
**Tab**: `doc-wizard`

| Submodule | Description | Key Actions |
|---|---|---|
| Step 1: Type | Select document type | RECEIPT, INVOICE, PAYMENT, QUOTATION, PETTY_CASH |
| Step 2: Party | Customer/supplier details | Select from CRM or create new |
| Step 3: Items | Line items, tax, discount | Add/edit items, apply VAT |
| Step 4: Review | Preview and finalize | Save, Print, PDF, WhatsApp |

---

### 9. EDITOR — محرر السندات
**Component**: `VoucherForm.tsx` (43.7 KB)  
**Tab**: `editor`

| Submodule | Description | Key Actions |
|---|---|---|
| Voucher Header | Type, number, date, reference | Edit |
| Party Info | Payer/payee details | Edit, link to CRM |
| Line Items | Itemized services/goods | Add, Edit, Delete |
| Financial Summary | Subtotal, tax (VAT), discount, total | Auto-calculated |
| Payment Details | Method, bank, check, transfer ref | Edit |
| Custom Fields | Configurable extra fields | Add/Edit |
| AI Assistant | `AIAssistantModal.tsx` (7.2 KB) | Parse text to voucher data |
| Amount in Words | Auto-generated, overridable | Toggle custom |

---

### 10. PREVIEW — معاينة وطباعة
**Component**: `ReceiptPreview.tsx` (52.9 KB)  
**Tab**: `preview`

| Submodule | Description | Key Actions |
|---|---|---|
| Document Preview | Full-fidelity print-ready view | View |
| Template Selector | 5 templates: modern, classic, thermal, executive, minimalist | Switch template |
| Print | Browser print dialog | Print |
| PDF Export | jsPDF + html2canvas export | Download PDF |
| WhatsApp Share | Share document summary | `WhatsAppShareModal.tsx` (23.5 KB) |

---

### 11. HISTORY — سجل السندات
**Component**: `VoucherHistory.tsx` (25.8 KB)  
**Tab**: `history`

| Submodule | Description | Key Actions |
|---|---|---|
| Vouchers List | All saved vouchers (paginated) | Filter, Search |
| Filters | Date range, type, status, customer | Apply filters |
| Bulk Actions | Select multiple vouchers | Delete, Export |
| Per-Voucher Actions | Edit, Print, PDF, Duplicate, Delete | Per row |
| Excel Export | Export filtered list to XLSX | Download |

---

### 12. CRM — إدارة العملاء
**Component**: `CRMView.tsx` (132 KB)  
**Tab**: `crm`

| Submodule | Description | Key Actions |
|---|---|---|
| Customer List | All CRM contacts | Filter by type/status/branch |
| Customer Profile 360° | Full customer details | View |
| Interactions Log | Call, meeting, WhatsApp, note, payment history | Add interaction |
| Contract History | Linked lease contracts | View, Navigate |
| Subscription History | Tenant membership subscriptions | View |
| Service Bookings | Related service bookings | View |
| Vouchers | Customer's receipt history | View, Create New |
| Quick Create Voucher | Create receipt for this customer | Navigate to editor |
| WhatsApp | Direct message to customer | Open WA link |

---

### 13. INVENTORY — المخزون
**Component**: `InventoryView.tsx` (65.7 KB)  
**Tab**: `inventory`

| Submodule | Description | Key Actions |
|---|---|---|
| Inventory List | All stock items with quantities | Filter by category/warehouse/status |
| Item CRUD | Create/Edit/Delete item | Add, Edit, Delete |
| Barcode | Generate & print item barcode | Generate, Print |
| Stock Movements | Inbound/outbound history | View |
| Low Stock Alerts | Items below min threshold | View, Create PO |
| Adjust Stock | Manual quantity adjustment | Adjust with reason |

---

### 14. PURCHASES — المشتريات والموردين
**Component**: `PurchasesView.tsx` (75.4 KB)  
**Tab**: `purchases`

| Submodule | Description | Key Actions |
|---|---|---|
| Purchase Invoices | All supplier purchase orders | Filter, Search |
| New Purchase | Create purchase invoice | Add items, link supplier |
| Receive Stock | Auto-update inventory on receive | Auto-increment inventory |
| Suppliers Directory | Supplier management | Add, Edit, Delete |
| Payment Voucher | Generate payment voucher from invoice | Auto-create PAYMENT voucher |

---

### 15. BRANCHES — إدارة الفروع
**Component**: `BranchesView.tsx` (67.1 KB)  
**Tab**: `branches`

| Submodule | Description | Key Actions |
|---|---|---|
| Branch List | All company branches | Add, Edit, Deactivate |
| Branch Performance | Per-branch revenue/vouchers | View analytics |
| Stock Transfers | Inter-branch inventory transfer | Create, Track |
| Transfer History | Log of all stock transfers | View |

---

### 16. EMPLOYEES — الموارد البشرية
**Component**: `EmployeesManager.tsx` (172.2 KB)  
**Tab**: `employees`

Sub-components in `src/components/hr/`:

| Submodule | Component | Description | Key Actions |
|---|---|---|---|
| Employee List | Main view | Directory with search | Add, Edit, Filter |
| Employee 360° Profile | `Employee360Modal.tsx` (48.2 KB) | Full employee record | View, Edit |
| Career History | `CareerHistoryManager.tsx` (14.7 KB) | Promotions & positions | Add, Edit |
| Performance | `PerformanceManager.tsx` (22.2 KB) | KPI evaluations | Add review |
| Training | `TrainingManager.tsx` (19.4 KB) | Courses & certificates | Add, Track |
| Disciplinary | `DisciplinaryManager.tsx` (17 KB) | Warnings/actions | Add record |
| Recognition | `RecognitionManager.tsx` (14 KB) | Bonuses & awards | Award |
| Contracts | `EmploymentContractsManager.tsx` (25 KB) | Work contracts | Create, Print |
| Documents | `EmployeeDocumentsManager.tsx` (16.3 KB) | IDs, certificates | Upload, Manage |
| Events | `EmployeeEventsCenter.tsx` (12.7 KB) | Birthdays, anniversaries | View |
| Attendance | Main view internal tab | Monthly attendance records | Mark, Edit |
| Payroll | Main view internal tab | Monthly salary slips | Generate, Approve, Pay |
| Payslip | `OfficialPayslipModal.tsx` (18 KB) | Official payslip print | Print PDF |
| Salary Disbursement | `IndividualSalaryDisbursementModal.tsx` (40.8 KB) | Single salary payment | Pay, Generate voucher |
| Instant Bonus | `InstantBonusModal.tsx` (29.9 KB) | Instant bonus payout | Pay bonus |
| Leave Requests | Main view internal tab | Leave request workflow | Submit, Approve/Reject |
| Kiosk Management | `EmployeeMovementDashboard.tsx` (78.8 KB) | Device/movement management | Add device, View live |

---

### 17. REQUESTS — الطلبات والنماذج
**Component**: `RequestsDashboard.tsx` (35.1 KB)  
**Tab**: `requests`

Sub-components in `src/components/requests/`:

| Submodule | Component | Description | Key Actions |
|---|---|---|---|
| Request Types | `RequestTypeBuilderModal.tsx` (44.3 KB) | Custom form builder | Create form type |
| Submit Request | `SubmitRequestModal.tsx` (28.5 KB) | Fill & submit a request | Submit |
| Request Details | `RequestDetailsModal.tsx` (26 KB) | View submitted request | Review details |
| Approval Action | `ApprovalActionModal.tsx` (11.5 KB) | Approve/reject a request | Approve, Reject |
| Dynamic Form | `DynamicFormRenderer.tsx` (16.8 KB) | Render dynamic form fields | Render form |
| Generated Docs | `GeneratedDocumentModal.tsx` (16.8 KB) | QR-verified certificates | View, Print |

---

### 18. SCHEDULES — الجدولة الدورية
**Component**: `RecurringSchedulesView.tsx` (80.6 KB)  
**Tab**: `schedules`

| Submodule | Description | Key Actions |
|---|---|---|
| Schedules List | All recurring billing/payment schedules | Filter, Search |
| New Schedule | Create a recurring rule | Set frequency, amount, party |
| Execute Due | Manually trigger due execution | Post voucher |
| Execution History | Log of all past executions | View |

---

### 19. SETTINGS — الإعدادات
**Component**: `SettingsStudio.tsx` (54.2 KB)  
**Tab**: `settings`

| Submodule | Description | Key Actions |
|---|---|---|
| Company Profile | Name, logo, tax ID, CR, contact | Edit |
| Bank Accounts | Official bank details | Edit |
| Document Design | Template, colors, fonts, sizes | Customize |
| Authorized Signatory | Name, title, signature image | Upload |
| Stamp & QR | Company stamp, QR content | Upload, Edit |
| Custom Fields | Default document fields | Add, Edit, Delete |
| Currency Settings | Default currency, exchange rates | Configure |
| Supabase Sync | `SupabaseSyncStudio.tsx` (25 KB) | Cloud backup settings | Push, Pull |
| WhatsApp | `WhatsAppBaileysStudio.tsx` (60 KB) | WA integration settings | Configure, Test |
| Employees | Employee CRUD within Settings tab | Add, Edit |
| Security | `SecuritySettingsModal.tsx` (31.7 KB) | Passwords, 2FA, sessions | Change password, manage sessions |
| Audit Logs | View system activity log | Clear logs |
| Reset Defaults | Factory reset company settings | Reset |

---

### 20. HELP — المساعدة
**Component**: `HelpCenterView.tsx` (23.7 KB)  
**Tab**: `help`

| Submodule | Description | Key Actions |
|---|---|---|
| FAQ | Frequently asked questions | Browse |
| Module Guides | Per-module usage guide | Read |
| AI Assistant | Launch AI modal | Open AI modal |
| Onboarding | `ERPOnboardingModal.tsx` (11.5 KB) | Guided onboarding tour | Start tour |
| Contextual Help | `ContextualHelpDrawer.tsx` (25.7 KB) | Context-aware help drawer | Open drawer |

---

### 21. GLOBAL MODALS (App-Level)

| Modal | Component | Trigger |
|---|---|---|
| Command Palette | `CommandPaletteModal.tsx` (23 KB) | `Ctrl+K` |
| Quick Create | `QuickCreateModal.tsx` (8.4 KB) | `+` button in TopNav |
| Attendance Kiosk | `AttendanceKioskModal.tsx` (72 KB) | TopNav kiosk button |
| AI Assistant | `AIAssistantModal.tsx` (7.2 KB) | AI button in editor/toolbar |
| Notifications | `NotificationsDrawer.tsx` (7.3 KB) | Bell icon in TopNav |
| Lock Screen | `LockScreenModal.tsx` (6.3 KB) | Auto when `session.isLocked` |
| Security Settings | `SecuritySettingsModal.tsx` (31.7 KB) | Profile menu |
| PWA Install Banner | `PWAInstallBanner.tsx` (5.8 KB) | Auto on `beforeinstallprompt` |
| iOS Install Modal | `IOSInstallModal.tsx` (5.2 KB) | iOS Safari detection |
| Space Booking | `SpaceBookingModal.tsx` (32 KB) | From Spaces module |
| Service Booking | `ServiceBookingModal.tsx` (22.4 KB) | From Services module |
| Tenant Subscription | `TenantSubscriptionModal.tsx` (24.1 KB) | From Services module |

---

## Component Size Distribution

| Size Category | Components |
|---|---|
| **Huge** (>50 KB) | `EmployeesManager.tsx` (172K), `storage.ts` (159K), `CRMView.tsx` (132K), `App.tsx` (103K), `POSView.tsx` (109K), `AttendanceKioskModal.tsx` (72K), `EmployeeMovementDashboard.tsx` (78K), `LeaseContractEditorModal.tsx` (79K), `requestsStorage.ts` (84K), `RecurringSchedulesView.tsx` (80K), `accountingStorage.ts` (114K), `WhatsAppBaileysStudio.tsx` (60K), `translations.ts` (79K), `DocWizardView.tsx` (78K), `GeneralLedgerAccountsView.tsx` (100K) |
| **Large** (20-50 KB) | 15 components |
| **Medium** (5-20 KB) | 15 components |
| **Small** (<5 KB) | 8 utility/common components |

---

*Document created as part of Phase 1 Read-Only Audit. No code was modified.*
