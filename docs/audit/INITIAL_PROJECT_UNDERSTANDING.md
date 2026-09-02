# INITIAL_PROJECT_UNDERSTANDING.md
# Deshal ERP — Initial Project Understanding Audit (Full Deep Dive)

> **Audit Date**: 2026-09-02 (Refreshed)
> **Auditor**: Senior Implementation Agent (Antigravity)
> **Phase**: READ-ONLY Discovery — No code was modified
> **Status**: COMPLETE — Verified against actual source code

---

## 1. Project Identity

| Field | Value |
|---|---|
| **Project Name** | Deshal Business Management ERP (منظومة دشال لإدارة الأعمال) |
| **Declared Version** | v2.5 (`about.md`); `0.0.0` (`package.json`) — inconsistent |
| **Project Type** | Full-Stack Single-Page ERP Web Application (SPA) |
| **Primary Language** | Arabic (RTL) with bilingual AR/EN support via i18next |
| **Target Market** | Omani SMEs and mid-to-large enterprises (Oman, GCC context) |
| **Module Count** | 20 navigable tabs + 12+ global modals + 60+ sub-components |

---

## 2. Tech Stack — Verified from Source

| Layer | Technology | Version | Evidence |
|---|---|---|---|
| **Frontend Framework** | React | 19.0.1 | `package.json` L28 |
| **Language** | TypeScript | ~5.8.2 | `package.json` L42 |
| **Build Tool** | Vite | 6.2.3 | `vite.config.ts` |
| **CSS Framework** | Tailwind CSS v4 | 4.1.14 | via `@tailwindcss/vite` |
| **Animations** | Motion (Framer Motion fork) | 12.23.24 | `package.json` L31 |
| **Icons** | Lucide React | 0.546.0 | Used throughout all components |
| **Charts** | Recharts | 3.10.1 | `HomeDashboard.tsx`, `BranchesView.tsx` |
| **Backend** | Express.js | 4.21.2 | `server.ts` |
| **Server Runner** | TSX | 4.21.0 | `npm run dev` → `tsx server.ts` |
| **AI Engine** | Google GenAI | 2.4.0 | `server.ts` L4; server-side only |
| **PDF Export** | jsPDF + html2canvas | 4.2.1 + 1.4.1 | Client-side |
| **ZIP/Batch Export** | JSZip + FileSaver | 3.10.1 + 2.0.5 | Bulk export |
| **QR Code** | qrcode | 1.5.4 | `GeneratedDocumentModal.tsx` |
| **Internationalization** | i18next + react-i18next | 26.4.0 + 17.0.12 | `translations.ts` is the actual lookup |
| **No Test Runner** | — | — | Zero test files found anywhere |

---

## 3. Project Architecture (Verified)

### 3.1 Repository Layout

```
Deshal-ERP/                         # Project root
├── server.ts                        # Express backend entry (113 lines)
├── vite.config.ts                   # Vite + Tailwind + React config
├── tsconfig.json                    # TypeScript (bundler mode, noEmit, ES2022)
├── package.json                     # name: "react-example" (not updated)
├── .env.example                     # GEMINI_API_KEY, APP_URL
├── about.md                         # Product documentation (Arabic)
├── AGENTS.md                        # AI agent governance rules
├── ANTIGRAVITY_START.md             # Antigravity quick-start instruction
├── AGENT_SETUP.md                   # Agent setup guide
├── PROJECT_AUDIT_SUMMARY.md         # Previous brief audit summary
├── bun.lock                         # Bun lockfile (bun used alongside npm)
├── src/
│   ├── App.tsx                      # ROOT — 2,581 lines, 35+ state vars
│   ├── main.tsx                     # React DOM entry (503 bytes)
│   ├── index.css                    # Global CSS (2.2 KB)
│   ├── types.ts                     # Primary types — 47,880 bytes (~1,564 lines)
│   ├── types/
│   │   ├── accounting.ts            # Accounting domain types (11.6 KB)
│   │   ├── hr.ts                    # HR domain types (12.2 KB)
│   │   └── requests.ts              # Dynamic Requests Engine types (6.2 KB)
│   ├── components/                  # 42 top-level files + 10 subdirectories
│   │   ├── accounting/              # 9 components (100–28 KB each)
│   │   ├── auth/                    # 3 components (Login, Lock, Security)
│   │   ├── common/                  # 14 shared ERP UI components
│   │   ├── help/                    # 2 components
│   │   ├── hr/                      # 9 specialized HR sub-components
│   │   ├── kiosk/                   # 2 components (AttendanceKiosk, MovementDashboard)
│   │   ├── navigation/              # 5 nav components (Sidebar, TopNav, etc.)
│   │   ├── notifications/           # 1 component
│   │   ├── onboarding/              # 1 component
│   │   └── requests/                # 7 workflow components
│   └── utils/                       # 19 utility files
│       ├── storage.ts               # PRIMARY storage — 159 KB, 4,141 lines
│       ├── accountingStorage.ts     # GL/accounting storage — 114 KB
│       ├── requestsStorage.ts       # Requests engine storage — 84 KB
│       ├── authManager.ts           # Auth logic — 23.8 KB
│       ├── hrStorage.ts             # HR storage — 33 KB
│       ├── attendanceStorage.ts     # Attendance/kiosk storage — 25.8 KB
│       ├── auditLogger.ts           # Audit log write utility — 8.8 KB
│       ├── translations.ts          # Full bilingual translations — 79 KB
│       ├── whatsappBaileys.ts       # WA integration — 24 KB
│       ├── supabaseSync.ts          # Supabase cloud backup — 7.3 KB
│       ├── kioskSecurity.ts         # PIN hashing — 14.6 KB
│       ├── pdfGenerator.ts          # PDF export — 12.4 KB
│       ├── currencyConverter.ts     # Multi-currency — 7 KB
│       ├── barcodeGenerator.ts      # Barcode generation — 4.7 KB
│       ├── pwaManager.ts            # PWA install — 2.7 KB
│       ├── recurrenceUtils.ts       # Recurring billing — 8.5 KB
│       ├── numberToWords.ts         # Arabic amount-in-words — 10 KB
│       ├── dateFormatter.ts         # Date formatting — 1.3 KB
│       └── LanguageContext.tsx      # i18n React context — 2.9 KB
├── docs/
│   ├── audit/                       # Audit documents (this file's directory)
│   ├── decisions/                   # Architecture decision records (nearly empty)
│   └── requirements/                # Requirements docs (nearly empty)
├── public/                          # Static assets
└── assets/                          # Additional assets
```

### 3.2 Frontend Architecture Pattern

- **No routing library**: All navigation is `activeTab` state in `App.tsx` (20 tab values)
- **State management**: Entirely in `App.tsx` via `useState` — no Context API for data, no Zustand, no Redux
- **Data flow**: Load from localStorage → useState initial value → props drilling to components → handler functions update state + save to localStorage
- **Bilingual**: Arabic-first with English labels via `translations.ts`; `LanguageContext.tsx` provides language toggle
- **RTL support**: `dir="rtl"` applied throughout Arabic content

### 3.3 Backend Architecture

```
server.ts (113 lines)
├── express.json({ limit: "10mb" }) — Only middleware
├── GET  /api/health                 — Status check { status: "ok" }
├── POST /api/ai/parse-voucher       — Gemini text → voucher JSON (no auth)
└── SPA serving:
    DEV:  Vite middleware (HMR support, DISABLE_HMR env var)
    PROD: express.static("dist") + SPA fallback
```

**Critical**: The server does NOT handle any business data, authentication, or permission enforcement.

### 3.4 Persistence Strategy (Three Layers)

```
Layer 1: React In-Memory State (App.tsx useState)
    └── Active session data; lost on refresh if not saved

Layer 2: Browser localStorage (PRIMARY — ALL persistent data)
    ├── 25+ keys under rv_studio_*  (core ERP data)
    ├── 4 keys under rv_auth_*      (auth session, users, magic links)
    ├── 3 keys under deshal_hr_*    (attendance, payroll, leave)
    └── accountingStorage + requestsStorage have separate key namespaces

Layer 3: Supabase (OPTIONAL — full snapshot cloud backup)
    └── Single JSONB blob upsert/pull; NOT normalized; NOT real-time
```

---

## 4. Navigation & Tab System (Verified from App.tsx L161)

```typescript
// App.tsx L161 — exact tab union type:
"home" | "pos" | "accounting" | "spaces" | "contracts" | "services" |
"portal" | "doc-wizard" | "editor" | "preview" | "history" | "crm" |
"inventory" | "purchases" | "branches" | "employees" | "requests" |
"schedules" | "settings" | "help"
```

**Navigation components**:
- `PrimarySidebar.tsx` — Desktop collapsible sidebar (9.5 KB)
- `TopNavBar.tsx` — Header with branch selector, notifications, quick actions (18 KB)
- `MobileBottomNav.tsx` — 5-tab mobile bottom bar (5.2 KB)
- `NavigationDrawer.tsx` — Mobile slide-over drawer (35.8 KB)
- `CommandPaletteModal.tsx` — `Ctrl+K` command palette (23 KB)
- `Breadcrumbs.tsx` — Simple breadcrumb trail (2.1 KB)

**URL handling**: Partial — `?tab=` and `?action=new` params handled via `useEffect` (L531-551). Browser back button does NOT navigate between tabs.

---

## 5. Data Domain Summary (Verified)

| Domain | Storage Key | Seeds? | Source of Truth |
|---|---|---|---|
| Company Settings | `rv_studio_company_settings` | Yes | localStorage |
| Design Theme | `rv_studio_design_theme` | Yes | localStorage |
| Vouchers (Receipts/Invoices) | `rv_studio_vouchers_list` | Yes (43) | localStorage |
| Customers (CRM) | `rv_studio_customers_list` | Yes (4) | localStorage |
| Inventory Items | `rv_studio_inventory_items` | Yes (8) | localStorage |
| Purchases & Suppliers | `rv_studio_purchases_list` + `_suppliers_list` | Yes | localStorage |
| Stock Movements | `rv_studio_stock_movements` | Yes | localStorage |
| Branches | `rv_studio_branches_list` | Yes (2: Sohar + Muscat) | localStorage |
| Stock Transfers | `rv_studio_stock_transfers` | Yes | localStorage |
| Employees | `rv_studio_employees_list` | Yes (5) | localStorage |
| Attendance Records | `deshal_hr_attendance_records` | Yes | localStorage |
| Payroll Slips | `deshal_hr_payroll_slips` | Yes | localStorage |
| Leave Requests | `deshal_hr_leave_requests` | Yes | localStorage |
| POS Orders | `rv_studio_pos_orders_list` | Yes | localStorage |
| Cashier Shifts | `rv_studio_cashier_shifts` | Yes | localStorage |
| Recurring Schedules | `rv_studio_recurring_schedules` | Yes | localStorage |
| Rental Spaces | `rv_studio_rental_spaces` | Yes (~4-6) | localStorage |
| Space Bookings | `rv_studio_space_bookings` | Yes | localStorage |
| Consulting Services | `rv_studio_consulting_services` | Yes (~5-8) | localStorage |
| Membership Packages | `rv_studio_membership_packages` | Yes (~3-5) | localStorage |
| Tenant Subscriptions | `rv_studio_tenant_subscriptions` | Yes | localStorage |
| Service Bookings | `rv_studio_service_bookings` | Yes | localStorage |
| Lease Contracts | `rv_studio_lease_contracts` | Yes | localStorage |
| Accounts (GL) | via `accountingStorage.ts` | Yes | localStorage |
| Journal Entries | via `accountingStorage.ts` | Yes | localStorage |
| Fiscal Periods | via `accountingStorage.ts` | Yes | localStorage |
| Dynamic Requests | via `requestsStorage.ts` | Yes | localStorage |
| Auth Users | `rv_auth_users` | Yes (5 default users) | localStorage |
| Auth Session | `rv_auth_active_session` | Auto-created | localStorage |
| Audit Logs | via `auditLogger.ts` | Empty initially | localStorage |

---

## 6. Authentication System (Verified from authManager.ts)

- **Type**: Client-side ONLY — server never validates any token
- **Login methods**: Password (plaintext comparison), PIN, Magic Link (simulated), 2FA (fake TOTP)
- **Session duration**: 7-day TTL stored in localStorage
- **Default behavior**: Auto-creates ADMIN session on first load (demo convenience — security risk)
- **Password storage**: PLAINTEXT — field named `passwordHash` contains raw strings (e.g. `"Admin@2026"`)
- **Token format**: `tok_${Math.random().toString(36).substring(2)}_${Date.now()}` — insecure, not signed
- **Lockout**: 5 failed attempts → 5-minute lockout (client-side enforcement only)
- **Roles**: `ADMIN`, `ACCOUNTANT`, `SALES`, `STOREKEEPER`, `MANAGER`, `RECEPTIONIST`, `CUSTOM`
- **Permissions**: 29 granular `EmployeePermission` flags per user/employee

---

## 7. Key Business Logic Locations (Verified)

| Business Rule | File | Verified Location |
|---|---|---|
| Tab navigation | `App.tsx` | L161, L303, L537-541 |
| Voucher number generation | `App.tsx` | L574-688 (sequential scan of in-memory list) |
| New voucher default state | `App.tsx` | `createNewVoucherState()` L574 |
| Customer auto-sync from voucher | `storage.ts` | `syncCustomerFromVoucher()` |
| Audit log trigger | `App.tsx` | `triggerAuditLog()` L422 |
| Double-entry GL | `accountingStorage.ts` | JournalEntry.isBalanced flag |
| Payroll calculation | `EmployeesManager.tsx` | Internal payroll tab |
| Attendance kiosk PIN | `kioskSecurity.ts` | SHA-256 hashing |
| Recurring schedule execution | `RecurringSchedulesView.tsx` | Manual "Execute Due" button only |
| Space booking → receipt | `App.tsx` | L1159-1270 (auto-generates receipt) |
| Lease installment collection | `App.tsx` | L1700-1804 |
| Stock decrement on POS sale | `POSView.tsx` | Internal checkout handler |
| Kiosk check-in → attendance | `App.tsx` | `handleSaveGlobalMovementLogSingle()` L474 |

---

## 8. Integration Status (Verified)

| Integration | Status | Location | Notes |
|---|---|---|---|
| **Google Gemini AI** | ✅ Active | `server.ts` POST `/api/ai/parse-voucher` | Voucher text parsing only; no auth |
| **WhatsApp Baileys** | ⚠️ Configurable | `whatsappBaileys.ts` (24 KB) | Self-hosted; defaults to localhost:8000 |
| **Supabase Cloud Sync** | ⚠️ Optional/Manual | `supabaseSync.ts` (7.3 KB) | Full blob backup; not normalized |
| **PWA** | ✅ Active | `pwaManager.ts`, `App.tsx` | Install prompt + iOS modal |
| **Camera Barcode Scanner** | ✅ Active | `BarcodeScannerModal.tsx` (19 KB) | Camera API |
| **QR Code Generation** | ✅ Active | `qrcode` library | Used in print/certificates |
| **PDF Export** | ✅ Active | `pdfGenerator.ts` + `html2canvas` | Client-side |
| **Excel Export** | ✅ Active | `JSZip` + `FileSaver` | Batch voucher export |
| **Thermal Printing** | ✅ Active | `ReceiptPreview.tsx` | CSS print media queries |

---

## 9. Modules — Verified Status

| # | Module | Tab | Component | UI | Logic | Data | Tests | Status |
|---|---|---|---|---|---|---|---|---|
| 1 | Home Dashboard | home | HomeDashboard.tsx | ✅ | ✅ | ✅ | ❌ | **Implemented** |
| 2 | POS / Cashier | pos | POSView.tsx | ✅ | ✅ | ✅ | ❌ | **Implemented** |
| 3 | General Ledger / Accounting | accounting | GeneralLedgerAccountsView.tsx | ✅ | ✅ | ✅ | ❌ | **Implemented** (no GL auto-posting) |
| 4 | Spaces & Booking | spaces | SpacesManager.tsx | ✅ | ✅ | ✅ | ❌ | **Implemented** |
| 5 | Lease Contracts | contracts | LeaseContractsManager.tsx | ✅ | ✅ | ✅ | ❌ | **Implemented** |
| 6 | Services & Subscriptions | services | ServicesManager.tsx | ✅ | ✅ | ✅ | ❌ | **Implemented** |
| 7 | Client Booking Portal | portal | ClientBookingPortal.tsx | ✅ | ✅ | ✅ | ❌ | **Implemented** |
| 8 | Document Wizard | doc-wizard | DocWizardView.tsx | ✅ | ✅ | ✅ | ❌ | **Implemented** |
| 9 | Voucher Editor | editor | VoucherForm.tsx | ✅ | ✅ | ✅ | ❌ | **Implemented** |
| 10 | Receipt Preview/Print | preview | ReceiptPreview.tsx | ✅ | ✅ | ✅ | ❌ | **Implemented** |
| 11 | Voucher History | history | VoucherHistory.tsx | ✅ | ✅ | ✅ | ❌ | **Implemented** |
| 12 | CRM / Customers | crm | CRMView.tsx | ✅ | ✅ | ✅ | ❌ | **Partially Implemented** (no Leads/Pipelines) |
| 13 | Inventory | inventory | InventoryView.tsx | ✅ | ✅ | ✅ | ❌ | **Implemented** |
| 14 | Purchases & Suppliers | purchases | PurchasesView.tsx | ✅ | ✅ | ✅ | ❌ | **Implemented** |
| 15 | Branches | branches | BranchesView.tsx | ✅ | ✅ | ✅ | ❌ | **Implemented** |
| 16 | HR & Payroll | employees | EmployeesManager.tsx | ✅ | ✅ | ✅ | ❌ | **Implemented** (WPS partial) |
| 17 | Dynamic Requests | requests | RequestsDashboard.tsx | ✅ | ✅ | ✅ | ❌ | **Implemented** |
| 18 | Recurring Schedules | schedules | RecurringSchedulesView.tsx | ✅ | ⚠️ | ✅ | ❌ | **Partial** (manual execution only) |
| 19 | Settings | settings | SettingsStudio.tsx | ✅ | ✅ | ✅ | ❌ | **Implemented** |
| 20 | Help Center | help | HelpCenterView.tsx | ✅ | ✅ | — | ❌ | **Implemented** |
| 21 | Attendance Kiosk | (modal) | AttendanceKioskModal.tsx | ✅ | ✅ | ✅ | ❌ | **Implemented** |
| 22 | Command Palette | (global) | CommandPaletteModal.tsx | ✅ | ✅ | — | ❌ | **Implemented** |
| 23 | CRM Leads | (missing) | — | ❌ | ❌ | ❌ | ❌ | **Missing** |
| 24 | CRM Opportunities | (missing) | — | ❌ | ❌ | ❌ | ❌ | **Missing** |
| 25 | CRM Pipelines/Kanban | (missing) | — | ❌ | ❌ | ❌ | ❌ | **Missing** |
| 26 | GL Auto-Posting | (missing) | — | ❌ | ❌ | ❌ | ❌ | **Missing** |
| 27 | Tests / QA | (missing) | — | ❌ | ❌ | ❌ | ❌ | **Missing** |

---

## 10. Known Architectural Constraints (Critical)

1. **Monolithic App.tsx**: 2,581 lines, 35+ `useState` variables, 50+ handler functions in ONE component
2. **No server-side persistence**: All data in localStorage — 5-10MB browser limit, no multi-device sync
3. **No real backend database**: Supabase backup is a JSONB blob, not normalized tables
4. **Authentication fully client-side**: No server enforces sessions or permissions
5. **Passwords stored as plaintext**: Critical security failure
6. **No URL routing**: Browser back/forward and deep links don't work
7. **No automated tests**: Zero test files across the entire codebase
8. **No GL auto-posting**: Operational transactions (POS, purchases, payroll) do NOT auto-post to General Ledger
9. **`loadVouchers()` mutates data**: The load function overwrites all line item descriptions with demo text — data integrity bug
10. **Recurring schedules require manual trigger**: No background scheduler exists

---

## 11. Positive Strengths (Preserve These)

1. **Rich domain model**: 40+ TypeScript interfaces across 4 type files
2. **Comprehensive functional surface**: 20 modules covering an entire SME's operations
3. **Audit trail foundation**: `triggerAuditLog()` called on every mutation — good governance baseline
4. **Cross-module auto-integrations**: Vouchers→CRM, Bookings→Vouchers, Payroll→Vouchers
5. **Professional document output**: A4, Thermal 80mm/58mm, PDF, Excel export workflows
6. **Multi-branch support**: Branch awareness throughout all modules
7. **Responsive design**: Mobile bottom nav + tablet kiosk + desktop sidebar
8. **PWA capability**: Can be installed as a native-like app on mobile and desktop
9. **Shared component library**: 14 ERP-prefixed reusable components in `components/common/`
10. **Digital signature**: Canvas-based signature capture for lease contracts
11. **QR-verified certificates**: Official document generation with QR verification codes

---

## 12. CRM Deep Understanding (Verified)

The CRM (`CRMView.tsx`, 132 KB) is **customer-centric only**:

| Feature | Exists? | Verified |
|---|---|---|
| Customer list with search/filter | ✅ Yes | `CRMView.tsx` |
| Customer 360° profile | ✅ Yes | Customer detail view |
| Interaction log (calls, meetings, notes) | ✅ Yes | CustomerInteraction[] on Customer |
| Contract history linkage | ✅ Yes | Via customerName/customerId |
| Subscription history | ✅ Yes | Via tenantSubscriptionsList |
| Voucher/payment history | ✅ Yes | Filtered by customer name |
| WhatsApp quick-contact | ✅ Yes | Opens wa.me link |
| **Leads** | ❌ Missing | No Lead type or UI |
| **Opportunities** | ❌ Missing | No Opportunity type or UI |
| **Sales Pipelines** | ❌ Missing | No Pipeline type or Kanban UI |
| **Pipeline Stages** | ❌ Missing | — |
| **Sales Activities** | ❌ Missing | — |
| **Email Integration** | ❌ Missing | Manual logging only |
| **Lead Source Tracking** | ❌ Missing | — |
| **Campaigns** | ❌ Missing | — |

**Confirmed**: CRM is customer management + interaction logging. It is NOT a full sales CRM with leads, pipelines, or opportunities.

---

## 13. Accounting Deep Understanding (Verified)

| Feature | Implementation Level | Verified |
|---|---|---|
| Chart of Accounts (5-level tree) | ✅ Full | `AccountFormModal.tsx` |
| Journal Entry creation | ✅ Full | `JournalEntryModal.tsx` |
| Double-entry validation | ✅ Client-side | `JournalEntry.isBalanced` flag |
| DRAFT → REVIEWED → APPROVED → POSTED lifecycle | ✅ Full | `accountingStorage.ts` |
| Reversal entries | ✅ Full | `ReverseEntryModal.tsx` |
| Trial Balance | ✅ Computed | `GeneralLedgerAccountsView.tsx` |
| P&L / Income Statement | ✅ Computed | Same view |
| Balance Sheet | ✅ Computed | Same view |
| Bank Reconciliation | ✅ Implemented | `BankReconciliationTab.tsx` |
| Cost Centers | ✅ Implemented | `CostCentersTab.tsx` |
| Fiscal Period locking | ✅ Implemented | `accountingStorage.ts` |
| Accounting Diagnostic Tool | ✅ Implemented | Auto-detect + fix balance issues |
| **POS → GL auto-posting** | ❌ Missing | Manual journal entries required |
| **Purchase → GL auto-posting** | ❌ Missing | Manual |
| **Payroll → GL auto-posting** | ❌ Missing | Voucher generated but no GL |
| **Space booking → GL** | ❌ Missing | Manual |

**Double-entry enforcement level**: Client-side only. No database constraint. No server-side validation.

---

## 14. HR & Attendance Deep Understanding (Verified)

| Feature | Status | Component |
|---|---|---|
| Employee list + search | ✅ Implemented | `EmployeesManager.tsx` |
| Employee 360° profile | ✅ Implemented | `Employee360Modal.tsx` (48 KB) |
| Career history | ✅ Implemented | `CareerHistoryManager.tsx` |
| Performance KPIs | ✅ Implemented | `PerformanceManager.tsx` |
| Training records | ✅ Implemented | `TrainingManager.tsx` |
| Disciplinary records | ✅ Implemented | `DisciplinaryManager.tsx` |
| Recognition & rewards | ✅ Implemented | `RecognitionManager.tsx` |
| Employment contracts | ✅ Implemented | `EmploymentContractsManager.tsx` |
| Employee documents | ✅ Implemented | `EmployeeDocumentsManager.tsx` |
| Attendance records | ✅ Implemented | Monthly flat-list view |
| Attendance Kiosk (PIN/QR check-in) | ✅ Implemented | `AttendanceKioskModal.tsx` (72 KB) |
| Movement dashboard (real-time kiosk) | ✅ Implemented | `EmployeeMovementDashboard.tsx` (79 KB) |
| Payroll slips generation | ✅ Implemented | Internal payroll tab |
| Official payslip print | ✅ Implemented | `OfficialPayslipModal.tsx` (18 KB) |
| WPS SIF file export | ⚠️ Partial | Logic exists; SIF format compliance unverified |
| Individual salary disbursement | ✅ Implemented | `IndividualSalaryDisbursementModal.tsx` (41 KB) |
| Instant bonus modal | ✅ Implemented | `InstantBonusModal.tsx` (30 KB) |
| Leave request workflow | ✅ Implemented | Submit → Approve/Reject |
| **Calendar attendance view** | ❌ Missing | Only flat-list view |
| **Remote/GPS attendance** | ❌ Missing | — |

---

## 15. Reusable Components Inventory (Must Reuse Before Creating)

| Asset | Location | Purpose |
|---|---|---|
| `ERPModal` | `components/common/ERPModal.tsx` | All modal dialogs |
| `ERPButton` | `components/common/ERPButton.tsx` | All buttons |
| `ERPInput` | `components/common/ERPInput.tsx` | All form inputs |
| `ERPSelect` | `components/common/ERPSelect.tsx` | All dropdowns |
| `ERPTable` | `components/common/ERPTable.tsx` | All data tables |
| `ERPTabs` | `components/common/ERPTabs.tsx` | In-module tab navigation |
| `ERPCard` | `components/common/ERPCard.tsx` | Content cards |
| `ERPAlert` | `components/common/ERPAlert.tsx` | Alerts/banners |
| `ERPEmptyState` | `components/common/ERPEmptyState.tsx` | Empty list states |
| `ERPLoadingState` | `components/common/ERPLoadingState.tsx` | Loading spinners |
| `ERPTooltip` | `components/common/ERPTooltip.tsx` | Hover tooltips |
| `StatusBadge` | `components/common/StatusBadge.tsx` | Status chips |
| `ActionToolbar` | `components/common/ActionToolbar.tsx` | Row action buttons |
| `DigitalSignaturePad` | `components/DigitalSignaturePad.tsx` | Canvas signature capture |
| `BarcodeScannerModal` | `components/BarcodeScannerModal.tsx` | Camera barcode scan |
| `CommandPaletteModal` | `components/navigation/CommandPaletteModal.tsx` | Ctrl+K palette |
| `WhatsAppShareModal` | `components/WhatsAppShareModal.tsx` | WA document share |
| `DashboardAnalytics` | `components/DashboardAnalytics.tsx` | Analytics charts |
| `ReceiptPreview` | `components/ReceiptPreview.tsx` | Print/PDF engine |
| `AIAssistantModal` | `components/AIAssistantModal.tsx` | AI text-to-data |

**Mandatory rule**: Search this list before creating any new component.

---

## 16. Answers to the 15 Completion Questions

1. **How does Deshal ERP actually work?** — Browser-first SPA; all data in localStorage; Express server only proxies Gemini AI calls. Tab-based navigation, no URL routing.

2. **Real architecture?** — React 19 SPA + localStorage + Express AI proxy. No real backend persistence.

3. **Technologies used?** — React 19, TypeScript 5.8, Vite 6, Tailwind CSS v4, Express 4, Google GenAI 2.4, Recharts, Motion, Lucide, jsPDF, QRCode, i18next.

4. **Where is data stored?** — 100% in browser localStorage (25+ named keys). Optional: Supabase JSONB blob backup.

5. **Source of truth per domain?** — localStorage is the ONLY source of truth. Supabase is secondary backup only.

6. **Complete modules?** — Home, POS, Accounting/GL, Spaces, Lease Contracts, Services, Portal, Doc Wizard, Voucher Editor, Preview/Print, History, Inventory, Purchases, Branches, HR/Payroll, Requests, Settings, Help, Kiosk, Command Palette.

7. **Partial modules?** — CRM (customers only; no leads/pipeline), Recurring Schedules (manual trigger only), WPS SIF export (unverified compliance).

8. **Missing modules?** — CRM Leads, Opportunities, Pipelines; GL Auto-posting; Test infrastructure; URL routing; Email notifications for approvals.

9. **Biggest security risks?** — (1) Plaintext passwords; (2) Auth is fully client-side; (3) AI endpoint has no auth/rate-limiting; (4) Auto-admin login on first load; (5) Fake 2FA (any 6-digit code accepted).

10. **Key UX problems?** — No URL routing (back button broken); monolithic App.tsx; no pagination at scale; no unsaved changes warning; no Error Boundary.

11. **What to reuse?** — The 14 `components/common/ERP*.tsx` components. WhatsAppShareModal, DigitalSignaturePad, BarcodeScannerModal, ReceiptPreview, AIAssistantModal.

12. **Key technical debt?** — `loadVouchers()` mutates data (P1); no tests; monolithic App.tsx; no URL routing; no GL auto-posting; plaintext passwords.

13. **What to develop first?** — See Section 17.

14. **Module dependencies?** — Accounting depends on Branch. HR depends on Branch + Employee. CRM depends on Customer (auto-synced from Vouchers). All modules depend on CompanySettings. GL is isolated from all operational modules (the gap).

15. **Where does about.md differ from code?** — See `docs/audit/ABOUT_MD_CORRECTIONS.md` for full details. Key: security is described as stronger than it is; WhatsApp is experimental not production-ready; Supabase is backup not sync.

---

## 17. Recommended Development Order

Priority based on: Business Value + Security Risk + Architecture Dependencies + Data Integrity + User Impact.

### Phase 0: Foundation Fixes (Do First — Before Any New Features)
1. **`CODE-4`** — Fix `loadVouchers()` data mutation bug (P1 data integrity — 1 day)
2. **`UX-3`** — Add React Error Boundary in `main.tsx` (P2 — 2 hours)
3. **`CRITICAL-1`** — Implement password hashing with PBKDF2 (P1 security — 2 days)
4. **`CRITICAL-4`** — Add rate limiting + basic API key to `/api/ai/parse-voucher` (P1 security — 1 day)
5. **`HIGH-2`** — Disable auto-admin login via env flag for production (P1 security — 1 hour)

### Phase 1: Architecture (Required for Scaling)
6. **`ARCH-2`** — Implement URL-based routing with React Router v6 (P1 — 3 days)
7. **`FIN-4`** — Auto-set installment OVERDUE status on app load (P2 — 1 day)
8. **`CODE-3`** — Fix `any` type usages in `App.tsx` (P2 — 2 hours)
9. **`UX-1`** — Add unsaved changes warning on complex forms (P2 — 1 day)
10. **`ARCH-5`** — Code splitting with React.lazy per module tab (P2 — 2 days)

### Phase 2: CRM Enhancement (High Business Value)
11. Design and implement CRM Leads domain (types → storage → UI)
12. Design and implement Opportunities with pipeline stages
13. Implement Kanban pipeline board for opportunity management

### Phase 3: GL Integration (Accounting Completeness)
14. **`FIN-1`** — Design account mapping strategy for POS, Purchases, Payroll → GL auto-posting
15. Implement GL auto-posting per transaction type

### Phase 4: Production Readiness
16. **`ARCH-4`** — Set up Vitest + React Testing Library for critical business logic tests
17. **`ARCH-3`** — Plan server-side database migration (Supabase normalized schema)
18. Move auth to server-side with signed JWTs

---

*Document created as part of Phase 1 Read-Only Audit. No code was modified.*
*Refreshed: 2026-09-02 with full source code verification.*
