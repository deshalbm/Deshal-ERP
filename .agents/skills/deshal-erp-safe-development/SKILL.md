---
name: deshal-erp-safe-development
description: Safe development workflow for Deshal ERP. Use whenever modifying, refactoring, debugging, fixing, extending, or adding features to the Deshal ERP codebase. Enforces Clean Architecture boundaries, dependency inversion, domain purity, preservation of localStorage/data contracts, minimal-risk changes, regression testing, and mandatory validation before completion.
---

# Deshal ERP Safe Development Workflow

This skill defines the mandatory software architecture, security, data-contract, regression-prevention, and validation standards for all engineering tasks on the Deshal ERP codebase.

---

## 1. When to Apply This Skill

Automatically load and follow this skill whenever performing any of the following tasks on Deshal ERP:
- Fixing a bug or repairing a reported issue
- Adding a new feature or extending existing capabilities
- Refactoring, cleaning up, or optimizing existing code
- Modifying UI behavior, React components, hooks, or contexts
- Modifying business rules, calculations, or domain engines
- Modifying application use cases, ports, or DTOs
- Modifying infrastructure adapters, Supabase integration, or storage utilities
- Modifying authentication, role permissions, or security auditing
- Modifying core ERP domains: Accounting, HR/Payroll/Attendance, CRM, POS, Inventory, Purchases, Spaces, Bookings, Lease Contracts, Services, Documents, or Kiosk
- Modifying browser `localStorage` access or persistence schemas

---

## 2. Core Deshal ERP Architecture

Deshal ERP strictly enforces Clean Architecture (Ports and Adapters / Hexagonal Architecture).

```text
                    ┌─────────────────────────────┐
                    │     COMPOSITION ROOT        │
                    │     App / Bootstrap          │
                    │                             │
                    │  Concrete Adapter Wiring    │
                    └──────────────┬──────────────┘
                                   │
                  ┌────────────────▼────────────────┐
                  │        PRESENTATION             │
                  │ React Components / UI           │
                  │                                 │
                  │ Calls Application Use Cases     │
                  └────────────────┬────────────────┘
                                   │
                  ┌────────────────▼────────────────┐
                  │         APPLICATION             │
                  │                                 │
                  │ Use Cases / Ports / DTOs        │
                  │                                 │
                  │ Depends on Domain + Contracts   │
                  └────────────────┬────────────────┘
                                   │
                  ┌────────────────▼────────────────┐
                  │            DOMAIN               │
                  │                                 │
                  │ Pure business rules             │
                  │ Pure calculations                │
                  │ Pure state transitions          │
                  └─────────────────────────────────┘

Infrastructure / Adapters implement Application-owned ports
and are wired from the outer Composition Root.
```

### Dependency Direction Rules (`OUTER → INNER`)

#### DOMAIN (`src/domain/**`)
- **Pure business logic and calculations only.**
- **Zero React imports**, **Zero UI component imports**, **Zero context/hook imports**.
- **Zero browser globals:** No `window`, `document`, `navigator`, `localStorage`, `sessionStorage`, `fetch`.
- **Zero infrastructure or database dependencies:** No Supabase, no network calls, no storage utility calls.
- **Time determinism:** Must receive timestamps (`nowMs: number`, `todayStr: string`) as explicit parameters rather than calling ambient `Date.now()` or `new Date()`.
- **Cryptography:** Security-sensitive operations must depend on explicit `CryptoProvider` abstractions; no `Math.random()` for PINs, salts, tokens, or key generation.

#### APPLICATION (`src/application/**`)
- **Orchestrates use cases and application flows.**
- **Depends inward on Domain and Application-owned Contracts/Ports.**
- **Zero direct persistence/storage utility imports:** No `src/utils/storage`, no `localStorage`, no `sessionStorage`.
- **Zero direct infrastructure dependencies:** No Supabase client/service imports, no network APIs, no browser APIs.
- **Zero concrete adapter dependencies:** Must not import from `src/lib/adapters/*` or specify concrete adapter parameter defaults (e.g. `fn(adapter = defaultAdapter)`).
- **Abstract Ports (`src/application/ports/**`):** Interface contracts belong to the application layer. Ports must have **0 imports** from `lib/` or `utils/`.

#### PRESENTATION (`src/components/**`, `src/hooks/**`, `src/contexts/**`)
- **React UI components, state management, and user interaction.**
- Calls Application use cases for core business operations.
- Must not bypass the application layer to execute storage or infrastructure logic when a use case/port is appropriate.
- Composition Root boundaries (`App.tsx`, `LoginPage.tsx`, `SettingsStudio.tsx`, `SubmitRequestModal.tsx`, etc.) are responsible for instantiating concrete adapters and injecting them into application use cases.

#### INFRASTRUCTURE (`src/lib/**`, `src/utils/storage/**`)
- Contains concrete implementations of Application Ports: Supabase client, LocalStorage adapters, HTTP clients, Web Crypto adapters, and Browser Web APIs.
- Implements application interface contracts outside the core domain.

---

## 3. Zero-Regression Principle

**DO NOT BREAK EXISTING BEHAVIOR.** Architectural cleanliness must never be achieved by sacrificing working functionality.

### Pre-Modification Checklist
Before changing any code, perform a thorough inspection:
1. Locate all call sites and consumers of the code.
2. Identify existing data contracts and `localStorage` key schemas.
3. Identify exported TypeScript interfaces and types.
4. Locate existing unit tests in `src/tests/`.
5. Identify side effects, state mutations, and component event handlers.
6. Evaluate whether the requested change can be achieved with a minimal, targeted fix.

### Absolute Negative Constraints
- **Never perform broad rewrites** when a targeted, localized modification is sufficient.
- **Never replace working architecture** merely because another pattern looks cleaner.
- **Never rename `localStorage` keys** or change serialization formats without explicit authorization.
- **Never change database field names or Supabase RPC parameters** without explicit authorization.
- **Never delete or disable existing unit tests** to make a build pass; fix the underlying code contract instead.
- **Never remove backward-compatibility facades** unless proven 100% unused.

---

## 4. LocalStorage Contract Safety

Browser `localStorage` is a critical production data contract for Deshal ERP.

### Storage Schema Rules
- Inspect `docs/LOCAL_STORAGE_SCHEMA.md` before touching persistence functions.
- Preserve key prefixes (`deshal_*`, `rv_studio_*`, `rv_*`, `erp_*`).
- Maintain key names, JSON parsing, deep default merging, and fallback structures.
- If a new key is added, document it in `docs/LOCAL_STORAGE_SCHEMA.md` and ensure safe initialization.

---

## 5. Mandatory Safe Development Loop

For **EVERY** coding task, follow this 7-phase execution loop:

```text
Phase 1: UNDERSTAND      ── Inspect git status, files, types, callers, and tests.
Phase 2: IMPACT ANALYSIS ── Trace dependencies; search domain/application for existing code to reuse.
Phase 3: PLAN            ── Formulate a minimal, safe vertical slice plan.
Phase 4: IMPLEMENT       ── Make the smallest safe change preserving UX, contracts, and rules.
Phase 5: TEST            ── Add or update unit tests in src/tests/ for the changed behavior.
Phase 6: ARCH CHECK      ── Run boundary checks (no domain or application leaks).
Phase 7: VALIDATE        ── Run the mandatory 5-command verification gate.
```

---

## 6. Mandatory Validation Gate

Before claiming any task complete, **YOU MUST EXECUTE AND PASS** the complete validation gate in exact order:

```bash
1. npx tsc --noEmit
   # Must exit with 0 errors.

2. npm test
   # All test suites in src/tests/ must pass with 0 failures.

3. npm run lint
   # Must exit with 0 errors/warnings.

4. npm run build
   # Vite production build and server bundle must complete successfully.

5. git diff --check
   # Must exit with 0 whitespace or formatting errors.

6. npm run architecture:audit
   # Automated clean architecture audit script must pass with 0 violations.
```

### Error Resolution Policy
If any command fails:
1. Stop execution immediately.
2. Read the full error message and stack trace.
3. Identify the true root cause (contract violation, type mismatch, broken test).
4. Apply the fix.
5. Re-run the validation pipeline from step 1.
6. **Never mask errors** with `@ts-ignore`, `eslint-disable`, or empty try/catch blocks.

---

## 7. Architectural Audit Scans

Run these commands to verify architectural purity:

### 1. Domain Layer Scan
```bash
grep -RInE "from ['\"].*(components|contexts|hooks|lib|utils|supabase|react)" src/domain/
grep -RInE "(localStorage|sessionStorage|window\.|document\.|navigator\.|fetch\(|supabase|Math\.random)" src/domain/
# Expected: 0 matches
```

### 2. Application Layer Scan
```bash
grep -RInE "from ['\"].*(lib|components|contexts|hooks|utils|supabase)" src/application/
grep -RInE "(localStorage|sessionStorage|window\.|document\.|navigator\.|fetch\(|supabase)" src/application/
grep -RInE "(default[A-Z][A-Za-z0-9]*Adapter|lib/adapters)" src/application/
# Expected: 0 matches
```

### 3. Application Ports Contract Scan
```bash
grep -RInE "from ['\"].*(lib|utils|components|contexts|hooks|supabase)" src/application/ports/
# Expected: 0 matches
```

---

## 8. Business Rule Centralization & Time/Security Standards

### 1. Centralized Business Rules
Never recreate financial, tax, or statutory formulas in components or utilities. Always reuse domain engines:
- **VAT (5%) & Currency Precision (OMR 3 decimals):** `src/domain/settings/settingsEngine.ts`
- **PASI (7%) & EOSB & Attendance:** `src/domain/hr/hrEngine.ts`
- **Journal Entry & Reversals:** `src/domain/finance/doubleEntryEngine.ts`
- **Voucher Calculations & Sequences:** `src/domain/vouchers/voucherFactory.ts`
- **Space & Service Pricing:** `src/domain/spaces/spacesEngine.ts` & `src/domain/services/servicesEngine.ts`

### 2. Time & Cryptography
- Pass timestamps explicitly (`nowMs`, `todayStr`) into domain functions.
- Cryptographic PIN hashing, salt generation, and security tokens must use `CryptoProvider` abstractions in `src/domain/kiosk/kioskSecurity.ts`. Never use `Math.random()` for security secrets.

### 3. Accounting Double-Entry Invariants
- Financial postings must satisfy **Debit = Credit**.
- Never destructively update or delete posted journal entries; use approved reversal entries (`generatePostingReversalPayload`).

---

## 9. Task Completion Report Standard

When delivering completed work, report:
1. **Changed Files:** Exact list of modified and created files with basenames and line links.
2. **Architectural Rationale:** Explanation of boundary choices and reuse.
3. **Test Results:** Empirical output from `npm test`.
4. **Validation Results:** Execution status of `tsc`, `test`, `lint`, `build`, `git diff --check`, and `architecture:audit`.
5. **Regression Assessment:** Explicit statement confirming zero behavioral, data contract, or UI/UX regressions.
