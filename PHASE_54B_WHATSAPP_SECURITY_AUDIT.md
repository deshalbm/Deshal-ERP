# Deshal ERP — Phase 54B WhatsApp Security Audit

## 1. Multi-Tenant Authorization & Isolation
- **Tenant Scope Enforcement**: All REST endpoints (`/api/admin/communication/whatsapp/*`) enforce company authorization. Users cannot query, insert, or retry jobs belonging to another company.
- **Platform Admin Operational Scope**: Platform administrators manage infrastructure health without implicit operational access to tenant data without valid company membership.

## 2. Session Secrets & Credential Protection
- **AES-256-GCM Encryption**: Baileys auth credentials and tokens are encrypted on the server using `WHATSAPP_SESSION_ENCRYPTION_KEY`.
- **Zero Browser Exposure**: Session keys, private tokens, and credentials are **never** returned in REST responses, stored in `localStorage`, or logged in server logs.
- **Redis Security**: Redis runs on an isolated Docker internal bridge network (`deshal-internal`) with zero publicly mapped ports.

## 3. Anti-Abuse & Ban Safeguards
- **Opt-Out Protection**: System enforces recipient opt-out (`STOP` / `إيقاف`). Opted-out recipients are blocked with `POLICY` classification before reaching transport layer.
- **Circuit Breaker**: `WhatsAppWatchdog` trips circuit breaker (`PAUSED` or `MANUAL_REVIEW`) after 5 consecutive transport failures, preventing spam loops and IP bans.
- **Audit Logging**: Every channel state change, disconnect, watchdog reset, and DLQ retry generates an audit record in `audit_logs`.
