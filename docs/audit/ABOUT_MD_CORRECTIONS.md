# ABOUT_MD_CORRECTIONS.md
# Deshal ERP — `about.md` Accuracy Corrections

> **Audit Date**: 2026-09-02  
> **Phase**: Read-Only Discovery  
> **Purpose**: Identify discrepancies between `about.md` claims and actual verified implementation

---

## Summary

The existing `about.md` is generally accurate at a high level but contains several overstated, imprecise, or incomplete claims. No falsifications were found — the intent is correct, but some capabilities are presented as fully production-ready when they are currently demo-grade or partially implemented.

---

## Correction #1: Backend & Security Description Is Misleading

### In `about.md` (Line 44):
> `| **الخادم والأمان (Backend & Security)** | Express.js, Node.js, TSX, AuthSession, Kiosk PIN & Lock Screen Security |`

### Reality:
- The Express server has **only 2 endpoints**: `/api/health` and `/api/ai/parse-voucher`. It serves no business data.
- "AuthSession" is **purely client-side** — the server does **not validate** any authentication tokens.
- Passwords are stored as **plaintext** strings, not hashed.
- "Security" in the table implies server-side security enforcement, which does not exist.

### Recommended Correction:
> `| **الخادم والأمان (Backend & Security)** | Express.js (AI Proxy Only), Node.js, TSX — AuthSession & PIN in localStorage (Client-side only; server-side enforcement not yet implemented) |`

---

## Correction #2: WhatsApp Baileys Integration Described as Production-Ready

### In `about.md` (Line 135):
> `تكامل الواتساب المباشر (WhatsApp Baileys Studio): ربط النظام بخدمة الواتساب لإرسال الفواتير، السندات، وتنبيهات الدفع بشكل تلقائي.`

### Reality:
- WhatsApp Baileys requires a **self-hosted** Baileys server at a user-configured URL (defaults to `http://localhost:8000`).
- The integration is **configurable but experimental** — it requires significant DevOps setup.
- "Automatic sending" (`autoSendOnVoucherCreate`) defaults to `false` — automatic sending is disabled by default and requires user configuration.
- The server URL defaults to `localhost:8000` which only works on the same machine.

### Recommended Correction:
> `تكامل الواتساب القابل للتكوين (WhatsApp Baileys Studio): توافق مع خوادم Baileys المستضافة ذاتياً لإرسال المستندات والإشعارات. يتطلب إعداداً مسبقاً للخادم؛ الإرسال التلقائي متوقف افتراضياً.`

---

## Correction #3: Supabase Sync Described as "Cloud Sync" (More Accurate: Cloud Backup)

### In `about.md` (Line 46):
> `| **الربط والتواصل (Integration)** | WhatsApp Baileys Automation Engine, Supabase Cloud Sync |`

### In `about.md` (Line 32):
> `التكامل الذكي والربط المباشر: ربط العمليات بالذكاء الاصطناعي (Google Gemini)، التنبيهات عبر الواتساب (WhatsApp Baileys)، والمزامنة السحابية (Supabase).`

### Reality:
- Supabase sync stores the **entire app state as a single JSON blob** in one database row. It is a **cloud backup**, not a normalized cloud database.
- It does not enable **real-time multi-user sync** — the backup must be manually pushed/pulled.
- It does not enable multi-user collaboration (each device has its own localStorage).

### Recommended Correction:
> `النسخ الاحتياطي السحابي (Supabase Backup Sync)`: نسخ احتياطي يدوي لبيانات النظام إلى قاعدة بيانات Supabase كـ JSON. لا يدعم المزامنة الفورية متعددة المستخدمين.`

---

## Correction #4: "PWA & Offline First" Needs Clarification

### In `about.md` (Line 136):
> `تطبيق الويب التقدمي والعمل بدون إنترنت (PWA & Offline First): إمكانية تثبيت النظام كتطبيق على أجهزة الحاسوب والهواتف مع التنبيه التلقائي بحالة الاتصال وتخزين البيانات محلياً.`

### Reality:
- The PWA install prompt and offline indicator are implemented.
- The app works offline for **data-viewing** since data is in localStorage.
- However, **AI features (Gemini)** require an internet connection.
- There is no explicit **Service Worker cache strategy** for offline asset loading verified in the audit.

### Recommended Correction:
> `تطبيق الويب التقدمي (PWA)`: قابل للتثبيت على الهواتف والحاسوب. البيانات محلية وتعمل بدون إنترنت. مميزات الذكاء الاصطناعي تتطلب اتصالاً بالإنترنت.`

---

## Correction #5: "Authentication System" Incomplete in about.md

### Current Gap in `about.md`:
The authentication system (which includes: UserAccounts, MagicLink, OTP Password Reset, 2FA, Active Sessions, Role-Based Access) is **not documented at all** in `about.md`. Section 6 (Security features) only briefly mentions "lock screen" and "audit logs."

### Recommended Addition to Security Section:
Add a section documenting:
- Login methods: Password, PIN, Magic Link
- 2FA support (simulated TOTP)
- Role-based access: ADMIN, ACCOUNTANT, SALES, STOREKEEPER, MANAGER, RECEPTIONIST, CUSTOM
- 29 granular employee permissions
- Session management with 7-day TTL
- Account lockout after 5 failed attempts
- ⚠️ Important note: Authentication is client-side; server-side validation is not implemented

---

## Correction #6: Version Number

### In `about.md` (Line 175):
> `منظومة دشال لإدارة الأعمال ERP v2.5 • جميع الحقوق محفوظة`

### In `package.json` (Line 4):
> `"version": "0.0.0"`

### Reality:
The version declared in `about.md` (v2.5) and `package.json` (0.0.0) are inconsistent. Recommend aligning to a single version number.

---

## Correction #7: Missing Modules in `about.md`

The following modules/features exist in the codebase but are **not documented** in `about.md`:

| Missing Feature | Location | Description |
|---|---|---|
| **Client Booking Portal** | `ClientBookingPortal.tsx` | Self-service client-facing booking interface |
| **Command Palette** | `CommandPaletteModal.tsx` | Mentioned but `Ctrl+K` shortcut not explained |
| **Kiosk Attendance Mode** | `AttendanceKioskModal.tsx` | Full tablet kiosk for employee check-in/out |
| **Employee 360° Profile** | `Employee360Modal.tsx` | Comprehensive employee profile with career, performance, training, disciplinary |
| **WPS Payroll File Export** | `EmployeesManager.tsx` | SIF file export for Oman WPS compliance |
| **Digital Signature Pad** | `DigitalSignaturePad.tsx` | Canvas-based signature capture for contracts |
| **Barcode Scanner** | `BarcodeScannerModal.tsx` | Camera barcode scanning |
| **Document QR Verification** | `GeneratedDocumentModal.tsx` | QR-verified official certificates |
| **Accounting Diagnostic Tool** | `GeneralLedgerAccountsView.tsx` | Auto-detect and fix balance sheet discrepancies |
| **Fiscal Period Management** | `accountingStorage.ts` | Period locking/unlocking for GL |
| **Bank Reconciliation** | `BankReconciliationTab.tsx` | Bank statement import and matching |
| **Attendance Movement Logs** | `EmployeeMovementDashboard.tsx` | Real-time movement tracking dashboard |
| **Employee Event Center** | `EmployeeEventsCenter.tsx` | Birthdays, work anniversaries tracking |

---

## Summary of Required `about.md` Changes

| Change Type | What | Priority |
|---|---|---|
| **Correction** | Backend security is client-side only; warn about plaintext passwords | P1 (important for professional credibility) |
| **Correction** | WhatsApp is configurable, not auto-ready | P2 |
| **Correction** | Supabase is backup, not real-time sync | P2 |
| **Correction** | PWA offline has limitations (AI requires internet) | P3 |
| **Addition** | Authentication system documentation | P2 |
| **Addition** | Client Booking Portal module | P3 |
| **Addition** | Kiosk Attendance Mode | P3 |
| **Addition** | WPS Payroll export | P3 |
| **Addition** | Accounting Diagnostic + Bank Reconciliation | P3 |
| **Addition** | Digital Signature capability | P3 |
| **Fix** | Align version numbers (package.json vs about.md) | P3 |

---

*Document created as part of Phase 1 Read-Only Audit. No code was modified.*
