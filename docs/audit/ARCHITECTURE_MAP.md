# ARCHITECTURE_MAP.md
# Deshal ERP — Architecture Map

> **Audit Date**: 2026-09-02  
> **Phase**: Read-Only Discovery  

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DESHAL ERP SYSTEM                            │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                     BROWSER (Client)                            │  │
│  │                                                                  │  │
│  │   React 19 SPA ──────────────────────────────────────────────  │  │
│  │     App.tsx (Root State + Router)                               │  │
│  │       ├── PrimarySidebar (Navigation)                           │  │
│  │       ├── TopNavBar (Header)                                    │  │
│  │       └── [Active Tab Module Component]                         │  │
│  │                                                                  │  │
│  │   localStorage ─────────────────────────────────────────────   │  │
│  │     rv_studio_* keys (25+ namespaced collections)               │  │
│  │     rv_auth_* keys (session, users, magic links)                │  │
│  │     deshal_hr_* keys (attendance, payroll)                      │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                            │                                           │
│                     HTTP Requests                                      │
│                            │                                           │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │               Express Backend (Node.js / TSX)                   │  │
│  │                                                                  │  │
│  │   GET  /api/health             → Status check                   │  │
│  │   POST /api/ai/parse-voucher   → Gemini AI text→JSON parsing    │  │
│  │   *    /*                      → Vite SPA middleware (dev)       │  │
│  │   GET  *                       → Static dist/index.html (prod)  │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                            │                                           │
│                     External Services                                  │
│                            │                                           │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │               EXTERNAL INTEGRATIONS                             │  │
│  │                                                                  │  │
│  │   ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐  │  │
│  │   │ Google Gemini │  │   Supabase   │  │  WhatsApp Baileys  │  │  │
│  │   │  AI API       │  │  Cloud DB    │  │   (Self-hosted)    │  │  │
│  │   │  (via server) │  │  (REST API)  │  │   (REST API)       │  │  │
│  │   └──────────────┘  └──────────────┘  └────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Architecture

### 2.1 Component Hierarchy

```
src/
└── App.tsx  [ROOT — 2,581 lines, 35+ state variables]
    │
    ├── Auth Layer
    │   ├── LoginPage.tsx  (if !authSession)
    │   └── LockScreenModal.tsx  (if session.isLocked)
    │
    ├── Layout Layer
    │   ├── PrimarySidebar.tsx      [desktop collapsible sidebar]
    │   ├── TopNavBar.tsx           [header + branch selector]
    │   ├── Breadcrumbs.tsx         [navigation breadcrumbs]
    │   └── MobileBottomNav.tsx     [mobile bottom tab bar]
    │
    ├── Module Views (tab-based routing)
    │   ├── HomeDashboard.tsx       [tab: "home"]
    │   ├── POSView.tsx             [tab: "pos"]
    │   ├── GeneralLedgerAccountsView.tsx  [tab: "accounting"]
    │   ├── SpacesManager.tsx       [tab: "spaces"]
    │   ├── LeaseContractsManager.tsx  [tab: "contracts"]
    │   ├── ServicesManager.tsx     [tab: "services"]
    │   ├── ClientBookingPortal.tsx [tab: "portal"]
    │   ├── DocWizardView.tsx       [tab: "doc-wizard"]
    │   ├── VoucherForm.tsx         [tab: "editor"]
    │   ├── ReceiptPreview.tsx      [tab: "preview"]
    │   ├── VoucherHistory.tsx      [tab: "history"]
    │   ├── CRMView.tsx             [tab: "crm"]
    │   ├── InventoryView.tsx       [tab: "inventory"]
    │   ├── PurchasesView.tsx       [tab: "purchases"]
    │   ├── BranchesView.tsx        [tab: "branches"]
    │   ├── EmployeesManager.tsx    [tab: "employees"]
    │   ├── RequestsDashboard.tsx   [tab: "requests"]
    │   ├── RecurringSchedulesView.tsx  [tab: "schedules"]
    │   ├── SettingsStudio.tsx      [tab: "settings"]
    │   └── HelpCenterView.tsx      [tab: "help"]
    │
    ├── Global Modals (always rendered, shown/hidden by boolean state)
    │   ├── CommandPaletteModal.tsx
    │   ├── QuickCreateModal.tsx
    │   ├── ContextualHelpDrawer.tsx
    │   ├── ERPOnboardingModal.tsx
    │   ├── NavigationDrawer.tsx
    │   ├── NotificationsDrawer.tsx
    │   ├── AttendanceKioskModal.tsx
    │   ├── SpaceBookingModal.tsx
    │   ├── ServiceBookingModal.tsx
    │   ├── TenantSubscriptionModal.tsx
    │   ├── AIAssistantModal.tsx
    │   ├── SecuritySettingsModal.tsx
    │   ├── OfflineIndicator.tsx
    │   ├── PWAInstallBanner.tsx
    │   └── IOSInstallModal.tsx
    │
    └── Sub-module Components (mounted inside module views)
        ├── components/accounting/    [9 components]
        ├── components/auth/          [3 components]
        ├── components/common/        [14 shared components]
        ├── components/help/          [2 components]
        ├── components/hr/            [9 specialized HR components]
        ├── components/kiosk/         [2 kiosk components]
        ├── components/navigation/    [5 nav components]
        ├── components/notifications/ [1 component]
        ├── components/onboarding/    [1 component]
        └── components/requests/      [7 workflow components]
```

---

### 2.2 State Management Architecture

The entire application state is managed in `App.tsx` with React hooks:

```typescript
// App.tsx State Categories:

// Navigation
activeTab, recentTabs, favorites
isSidebarCollapsed, isSidebarOpenMobile
isCommandPaletteOpen, isQuickCreateOpen
isContextualHelpOpen, isOnboardingOpen
isNotificationsOpen

// Auth & Session
authSession, isSecurityModalOpen, isDrawerOpen
activeEmployeeId, activeBranchId

// Core Data
vouchersList, activeVoucher
customersList
inventoryList, stockMovementsList
purchasesList, suppliersList, stockTransfersList
branchesList

// HR & Payroll
employeesList, attendanceList, payrollSlipsList
leaveRequestsList

// Spaces & Bookings
rentalSpacesList, spaceBookingsList
isBookingModalOpen, selectedSpaceForBooking

// Services & Subscriptions
consultingServicesList, membershipPackagesList
tenantSubscriptionsList, serviceBookingsList
isServiceBookingModalOpen, selectedServiceForBooking
isTenantSubModalOpen, selectedTenantSubForEditing

// Accounting & GL
accountsList, journalEntriesList
revisionLogsList, fiscalPeriodsList

// Lease Contracts
leaseContractsList

// System
auditLogsList, schedulesList
companySettings, designTheme
isAiModalOpen, isIosModalOpen, isGlobalKioskModalOpen
deferredPrompt (PWA)
userName

// Computed (useMemo)
systemNotifications, breadcrumbsList
```

**Data Flow Pattern**:
```
localStorage ──→ loadXxx() ──→ useState(initial) ──→ UI Renders
                                                        ↓
                                             User Action → Handler
                                                        ↓
                                             setXxx(updated) + saveXxx(updated)
                                                        ↓
                                             localStorage updated
```

---

### 2.3 Shared Component Library (`components/common/`)

| Component | Purpose |
|---|---|
| `ERPAlert.tsx` | Info/Warning/Error/Success alert banners |
| `ERPButton.tsx` | Standardized button with variants (primary, secondary, danger, ghost) |
| `ERPCard.tsx` | Content card container with optional header |
| `ERPEmptyState.tsx` | Empty state placeholder with icon and call-to-action |
| `ERPInput.tsx` | Form input with label, validation, RTL support |
| `ERPLoadingState.tsx` | Loading spinner/skeleton |
| `ERPModal.tsx` | Modal dialog wrapper with backdrop |
| `ERPSelect.tsx` | Dropdown select with label |
| `ERPTable.tsx` | Data table with sortable columns |
| `ERPTabs.tsx` | Tab navigation within a module |
| `ERPTooltip.tsx` | Hover tooltip |
| `StatusBadge.tsx` | Status indicator chips (colors per status) |
| `ActionToolbar.tsx` | Row action button group |
| `index.ts` | Re-export barrel |

---

## 3. Data Layer Architecture

### 3.1 Storage Strategy

```
┌─────────────────────────────────────────────────────────┐
│                    STORAGE LAYERS                         │
│                                                           │
│  Layer 1: In-Memory (React State)                        │
│    └── App.tsx useState() — current session data          │
│                                                           │
│  Layer 2: localStorage (Persistent, Browser-local)       │
│    ├── src/utils/storage.ts        (25 STORAGE_KEYS)     │
│    ├── src/utils/accountingStorage.ts (4 GL keys)        │
│    ├── src/utils/attendanceStorage.ts (kiosk keys)       │
│    ├── src/utils/authManager.ts    (4 AUTH_STORAGE_KEYS) │
│    ├── src/utils/hrStorage.ts      (HR-specific keys)    │
│    ├── src/utils/requestsStorage.ts (requests keys)      │
│    └── src/utils/auditLogger.ts    (audit log key)       │
│                                                           │
│  Layer 3: Supabase (Optional Cloud Backup)               │
│    └── src/utils/supabaseSync.ts                         │
│        └── Full snapshot JSONB upsert/pull               │
│            (Configured via Settings → Supabase Sync)     │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Storage Utilities Architecture

Each storage utility follows the same pattern:

```typescript
// Pattern: Load → Parse → Seed if empty → Return
export function loadXxx(): Xxx[] {
  const raw = localStorage.getItem(STORAGE_KEYS.XXX);
  if (raw) { 
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  }
  saveXxx(DEFAULT_XXX);  // Seed default data
  return DEFAULT_XXX;
}

export function saveXxx(data: Xxx[]): void {
  localStorage.setItem(STORAGE_KEYS.XXX, JSON.stringify(data));
}
```

---

## 4. Backend Architecture

### 4.1 Express Server (`server.ts`)

```
server.ts
├── Express App initialization
├── express.json({ limit: "10mb" }) middleware
├── Lazy Gemini Client initialization
├── Routes:
│   ├── GET  /api/health           → { status: "ok", timestamp }
│   └── POST /api/ai/parse-voucher → Gemini text-to-voucher JSON
└── Conditional Vite/Static serving
    ├── DEV:  Vite middleware (HMR, SPA)
    └── PROD: express.static("dist") + SPA fallback
```

### 4.2 AI Integration

```
Client → POST /api/ai/parse-voucher
  { textPrompt: string }
          │
          ▼
  Express → GoogleGenAI.models.generateContent()
    model: "gemini-2.5-flash"
    prompt: Structured voucher extraction prompt
          │
          ▼
  Response → JSON.parse(cleanedJson)
          │
          ▼
  Client receives ReceiptVoucher partial object
  App merges with active voucher state
```

---

## 5. Authentication Architecture

```
loadAuthSession()
    │
    ├── Valid session in localStorage?
    │     └── Not expired (7-day TTL)?
    │           ├── YES → Return cached session → App renders
    │           └── NO  → clearAuthSession() → Show LoginPage
    │
    └── No session found?
          └── Auto-create default ADMIN session (Demo mode bypass)
                └── App renders without login required
```

**Login Flow**:
```
LoginPage
  ├── Email + Password → authenticateUser()
  │     ├── Find user in localStorage[rv_auth_users]
  │     ├── Compare passwordHash (PLAINTEXT comparison)
  │     ├── Check lockout (5 attempts / 5-min)
  │     ├── Check 2FA (simulated TOTP)
  │     └── Create AuthSession → save to localStorage
  │
  ├── PIN Login → authenticateUser(email, pin, isPin=true)
  │
  └── Magic Link → createMagicLink() → copy URL
        └── verifyMagicLink(token) → create session
```

> **Security Note**: Password "hashing" is actually plaintext comparison. The field is named `passwordHash` but contains the raw password string (e.g., "Admin@2026").

---

## 6. Module Integration Map

```
POS Sale ──────────────────────────────→ Creates ReceiptVoucher
                                          Updates Inventory (SALE_OUT movement)
                                          Updates Customer record

Purchase Invoice ───────────────────→ Creates StockMovement (PURCHASE_IN)
                                          Can generate Payment Voucher

Space Booking (Confirm) ─────────→ Creates ReceiptVoucher
                                          Creates/Updates Customer in CRM

Service Booking (Complete) ──────→ Creates ReceiptVoucher
                                          Deducts Tenant Subscription quota

Lease Contract (Collect Installment) → Creates ReceiptVoucher
                                          Links VoucherId to PaymentInstallment

Payroll (Disburse) ──────────────→ Creates Payment/Petty Cash Voucher
                                          Links to PayrollSlip.linkedVoucherId

Any Voucher Save ────────────────→ syncCustomerFromVoucher()
                                          Auto-creates/updates CRM record

Any Data Change ─────────────────→ triggerAuditLog()
                                          Appended to auditLogsList
```

---

## 7. Build & Deployment Configuration

| Script | Command | Notes |
|---|---|---|
| `dev` | `tsx server.ts` | Starts Express + Vite middleware; default port 3000 |
| `build` | `vite build && esbuild server.ts ...` | Builds frontend + bundles server |
| `start` | `node dist/server.cjs` | Production mode; serves static dist |
| `lint` | `tsc --noEmit` | TypeScript type check only (no test runner) |

**Environment Variables** (from `.env.example`):
- `GEMINI_API_KEY` — Required for AI features
- `APP_URL` — Application URL (for self-referential links)

---

## 8. PWA Architecture

| Feature | Implementation |
|---|---|
| Web App Manifest | Configured (details in `public/` or index.html) |
| Service Worker | Basic support, PWA install prompt handled in `App.tsx` |
| iOS Install | Custom `IOSInstallModal.tsx` + `isIosDevice()` detection |
| Offline Indicator | `OfflineIndicator.tsx` watches `navigator.onLine` |
| Install Banner | `PWAInstallBanner.tsx` responds to `beforeinstallprompt` |
| HMR Disable | `DISABLE_HMR=true` env var disables HMR + file watching |

---

*Document created as part of Phase 1 Read-Only Audit. No code was modified.*
