# SECURITY_AUDIT.md
# Deshal ERP — Security Audit

> **Audit Date**: 2026-09-02  
> **Phase**: Read-Only Discovery  
> **Classification**: INTERNAL — Contains sensitive findings

---

## Executive Summary

The current Deshal ERP is built as a **client-side-first offline ERP** with an Express server that proxies only AI requests. This architecture means that **all authentication, authorization, and data protection run in the browser**. While suitable for a single-user demo or small trusted team, it has significant security implications that must be clearly understood before any enterprise deployment.

**Overall Security Posture: ⚠️ LOW (for multi-user or internet-facing deployment)**

---

## 1. Critical Security Findings

### 🔴 CRITICAL-1: Passwords Stored as Plaintext

**Location**: `src/utils/authManager.ts` L30, L52, L72, etc.

```typescript
// DEFAULT_USER_ACCOUNTS (actual code):
passwordHash: "Admin@2026",   // This is NOT a hash — it's the plaintext password
passwordHash: "Acc@2026",
passwordHash: "Store@2026",
```

**Issue**: The field is named `passwordHash` but stores plaintext credentials. All authentication comparisons are plaintext string equality:
```typescript
const isPasswordValid = user.passwordHash === passwordOrPin;
```

**Impact**:
- Any user who can read `localStorage` (or another tab/script via XSS) gets all passwords
- Passwords visible in browser DevTools → Application → Local Storage
- No password hashing (bcrypt, argon2, SHA-256 salted) is implemented

**Required Fix**: Implement client-side PBKDF2 or SHA-256 salted hashing (minimum) before storing. For production: server-side bcrypt with salt rounds.

---

### 🔴 CRITICAL-2: Authentication is Frontend-Only

**Location**: `src/utils/authManager.ts`, `server.ts`

The server has only 2 API endpoints (`/api/health`, `/api/ai/parse-voucher`). **The server does not verify any session tokens**. All permission checking is done in the React components.

**Impact**:
- Any user can open DevTools → Console and manipulate `authSession` in localStorage
- They can promote themselves to ADMIN role or grant arbitrary permissions
- API endpoints do not require authentication (the AI endpoint is wide open)

**Required Fix**: For multi-user deployment: move authentication to the server, issue signed JWTs, verify session on every API request.

---

### 🔴 CRITICAL-3: Session Token is Not Cryptographically Signed

**Location**: `src/utils/authManager.ts` L540-547

```typescript
const session: AuthSession = {
  ...
  token: `tok_${Math.random().toString(36).substring(2)}_${Date.now()}`,
  // This is a random string, not a signed JWT
};
saveAuthSession(session);  // Stored in localStorage
```

**Impact**: Tokens are not signed, so they cannot be verified server-side. `Math.random()` is not cryptographically secure. Sessions can be forged.

---

### 🔴 CRITICAL-4: AI Endpoint Has No Authentication or Rate Limiting

**Location**: `server.ts` L34-90

```typescript
app.post("/api/ai/parse-voucher", async (req, res) => {
  // No authentication check
  // No rate limiting
  // No input size validation beyond express.json({ limit: "10mb" })
  const { textPrompt } = req.body;
  // Direct call to Gemini API with GEMINI_API_KEY
  ...
});
```

**Impact**:
- If the server URL is known, anyone can call `/api/ai/parse-voucher` without authentication
- Each call consumes Gemini API credits (potential cost abuse)
- The `GEMINI_API_KEY` is exposed indirectly (adversary can exhaust your quota)

---

### 🔴 CRITICAL-5: Supabase Anon Key in Client Storage

**Location**: `src/types.ts` L298-309 (SupabaseSyncSettings)

```typescript
export interface SupabaseSyncSettings {
  supabaseUrl: string;
  supabaseAnonKey: string;  // Stored in localStorage, visible to any script
  ...
}
```

**Impact**: If XSS occurs, the Supabase anon key can be stolen. The Supabase table uses a permissive RLS policy (`FOR ALL TO anon`), so the key grants full access to sync data.

---

## 2. High Severity Findings

### 🟠 HIGH-1: No Content Security Policy (CSP)

**Issue**: No CSP header is set by the Express server, making the application vulnerable to XSS injection if any user-supplied content is improperly rendered.

---

### 🟠 HIGH-2: Auto-Login as Admin on First Load

**Location**: `src/utils/authManager.ts` L169-187

```typescript
// Default: Return initial active session for Admin Said so app is ready
const initialSession: AuthSession = {
  user: defaultUser,    // admin user
  employee: defaultEmp,
  ...
};
saveAuthSession(initialSession);
return initialSession;
```

**Impact**: When no session exists, the app creates a valid ADMIN session automatically. This means anyone who accesses the URL for the first time is immediately logged in as admin. This is a demo convenience feature but **must be disabled for production**.

---

### 🟠 HIGH-3: WhatsApp API Key in Client localStorage

**Location**: `CompanySettings.whatsappSettings.apiKey`

The WhatsApp Baileys API key is stored in `localStorage` under `rv_studio_company_settings`. If XSS occurs, this key can be stolen.

---

### 🟠 HIGH-4: Magic Links Generated Client-Side with Insecure Random

```typescript
const token = `ml_${Math.random().toString(36).substring(2, 10)}_...`;
```

`Math.random()` is not cryptographically secure. Magic link tokens can be predicted or brute-forced.

---

### 🟠 HIGH-5: 2FA is Simulated (Not Real TOTP)

**Location**: `src/utils/authManager.ts` L556-592

```typescript
// Accept valid 6-digit code (e.g. 123456 or standard TOTP test codes)
const isValidTotp = code.length === 6 && /^\d+$/.test(code);
```

**Issue**: The 2FA check accepts **any 6-digit number** as valid, not just time-based OTP codes. The TOTP "secret" (`JBSWY3DPEHPK3PXP`) is a fixed placeholder, not actually validated against time or a real TOTP algorithm.

---

## 3. Medium Severity Findings

### 🟡 MEDIUM-1: Permission Checks Are UI-Only

**Location**: Multiple component files

Permissions like `manage_inventory`, `manage_employees`, `edit_settings` are checked in the frontend only:
```typescript
if (!authSession.user.permissions.includes('manage_employees')) {
  // Show disabled button
}
```

Since these checks are client-side only, a savvy user can bypass them by editing localStorage.

---

### 🟡 MEDIUM-2: Audit Log Can Be Cleared by Any Admin

**Location**: `src/App.tsx` `handleClearAuditLogs()`

The audit log (meant for security accountability) can be cleared entirely via Settings UI. This undermines its usefulness as a tamper-evident audit trail.

---

### 🟡 MEDIUM-3: Kiosk PIN Security

**Location**: `src/utils/kioskSecurity.ts`

While the kiosk implements PIN hashing with SHA-256, the hash is stored in `localStorage`. If an attacker gains access to the device's localStorage (e.g., via XSS or physical access to DevTools), they can extract hashed PINs and attempt offline cracking.

---

### 🟡 MEDIUM-4: No HTTPS Enforcement

The Express server does not enforce HTTPS and has no redirect from HTTP to HTTPS. In production, this exposes all data in transit.

---

### 🟡 MEDIUM-5: CORS Not Configured

**Location**: `server.ts`

No CORS middleware is configured. In production, this could allow cross-origin requests to the AI endpoint from any domain.

---

## 4. Low Severity Findings

### 🔵 LOW-1: Session Expiry Not Enforced on Every Request

Sessions expire after 7 days but the expiry is only checked when `loadAuthSession()` is called on page load, not on every action.

---

### 🔵 LOW-2: IP Address in Audit Log is Hardcoded

**Location**: `src/utils/authManager.ts` L679

```typescript
ipAddress: "185.190.142.12 (Sohar, Oman)",  // Hardcoded placeholder
```

Audit logs show a fake IP address, reducing their forensic value.

---

### 🔵 LOW-3: Active Sessions List is Simulated

The "Active Devices & Sessions" feature displays hardcoded demo sessions. This gives a false sense of security monitoring.

---

### 🔵 LOW-4: No Input Validation on AI Endpoint

The AI endpoint only checks `typeof textPrompt !== "string"` but does not sanitize or limit the content before sending to Gemini. This could be used for prompt injection attacks.

---

## 5. Security Architecture Assessment

| Security Control | Status | Notes |
|---|---|---|
| Password Hashing | ❌ NOT IMPLEMENTED | Plaintext storage |
| Server-side Session Validation | ❌ NOT IMPLEMENTED | Client-only |
| API Authentication | ❌ NOT IMPLEMENTED | AI endpoint unprotected |
| Rate Limiting | ❌ NOT IMPLEMENTED | No throttling |
| HTTPS Enforcement | ❌ NOT IMPLEMENTED | HTTP only in dev |
| CORS Policy | ❌ NOT CONFIGURED | Open |
| Content Security Policy | ❌ NOT SET | No CSP header |
| Real 2FA (TOTP) | ❌ SIMULATED | Accepts any 6-digit code |
| Signed Session Tokens (JWT) | ❌ NOT IMPLEMENTED | Unsigned random string |
| Permission Enforcement (Server) | ❌ NOT IMPLEMENTED | UI-only checks |
| Input Sanitization | ⚠️ PARTIAL | Basic type checks only |
| Audit Log Integrity | ⚠️ PARTIAL | Can be cleared by admin |
| Lockout Policy | ✅ IMPLEMENTED | 5 attempts / 5 min |
| Session TTL | ✅ IMPLEMENTED | 7-day expiry |
| Secret Management | ✅ CORRECT | GEMINI_API_KEY is server-env-only |
| Kiosk PIN Hashing | ✅ IMPLEMENTED | SHA-256 via kioskSecurity.ts |

---

## 6. Deployment Context Assessment

| Deployment Scenario | Risk Level | Assessment |
|---|---|---|
| Single-user, local browser, no internet | 🟢 LOW | Acceptable for personal use |
| Trusted small team on private LAN | 🟡 MEDIUM | Acceptable if users are trusted |
| Multi-user, internet-facing SaaS | 🔴 CRITICAL | Not safe; requires complete auth overhaul |
| Offline PWA on trusted device | 🟡 MEDIUM | Acceptable if device is secured |
| Cloud deployment (public URL) | 🔴 CRITICAL | AI endpoint must be protected immediately |

---

## 7. Recommended Security Roadmap

**Phase 1 (Immediate — before any internet-facing deployment)**:
1. Add rate limiting to `/api/ai/parse-voucher` (e.g., `express-rate-limit`)
2. Add basic API key authentication for the AI endpoint
3. Implement PBKDF2 or bcrypt password hashing (even client-side as interim)
4. Disable the auto-admin-login behavior in production via environment flag

**Phase 2 (Short-term)**:
5. Move authentication to server-side; issue signed JWTs
6. Validate session token on every API request
7. Implement real TOTP 2FA (use a library like `otpauth`)
8. Add CORS configuration and Content Security Policy header

**Phase 3 (Production-ready)**:
9. Migrate to server-side database (PostgreSQL/Supabase tables with RLS)
10. Enforce permissions server-side via middleware
11. Implement tamper-proof audit logging (append-only, signed)
12. Add HTTPS enforcement and security headers

---

*Document created as part of Phase 1 Read-Only Audit. No code was modified.*
