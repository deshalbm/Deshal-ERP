# DESHAL ERP — PHASE 54A WHATSAPP ARCHITECTURE SPECIFICATION

**Phase:** Phase 54A — Production WhatsApp Channel Infrastructure, Baileys Reliability & Anti-Abuse Architecture  
**Timestamp:** 2026-09-19T18:37:00+04:00  

---

## 1. HIGH-LEVEL SYSTEM ARCHITECTURE

```text
Deshal ERP Client (React / Communication Center)
        │
        │ Authenticated REST API (companyId context)
        ▼
Express Server (`server.ts`)
        │
        ├──► `/api/admin/communication/whatsapp/status`
        ├──► `/api/admin/communication/whatsapp/qr`
        ├──► `/api/admin/communication/whatsapp/connect`
        ├──► `/api/admin/communication/whatsapp/disconnect`
        ├──► `/api/admin/communication/whatsapp/restart`
        ├──► `/api/admin/communication/whatsapp/send`
        └──► `/api/admin/communication/whatsapp/health`
        │
        ▼
WhatsApp Application Service (`whatsappChannelService.ts`)
        │
        ├── Anti-Spam Policy Evaluator (`evaluateAntiSpamPolicy`)
        ├── Phone Number Normalizer (`formatWhatsAppRecipient`)
        ├── State Machine Validator (`validateChannelStateTransition`)
        └── Template Variable Engine (`interpolateWhatsAppTemplate`)
        │
        ▼
WhatsApp Server Connection Manager (`whatsappConnectionManager.ts`)
        │
        ├── Encrypted Session Store (AES-256-GCM)
        ├── Multi-Company Socket Orchestration (Baileys / Transport Engine)
        ├── Queue & Idempotency Buffer (`whatsapp.outbound`, `whatsapp.dead_letter`)
        └── Health & Heartbeat Monitor
```

---

## 2. MULTI-TENANT ISOLATION MODEL

1. **Company Authorization:** WhatsApp channel ownership is strictly locked to `companyId`. A user can only inspect or manage a WhatsApp channel for a company where they hold an active membership in `user_company_memberships`.
2. **Encrypted Session Isolation:** Session tokens are encrypted with `WHATSAPP_SESSION_ENCRYPTION_KEY` using AES-256-GCM and stored per company in `.sessions/company_<id>`.
3. **No Browser Credentials:** Session credentials, pairing codes, and secret tokens are NEVER sent to the client browser or stored in `localStorage`.

---

## 3. ANTI-SPAM & ACCOUNT SAFETY ENGINE

To protect company WhatsApp numbers from platform enforcement:
- **Per-Minute Limit:** Throttles outbound messages if >30 msgs/min per company.
- **Hourly Limit:** Throttles outbound messages if >500 msgs/hr per company.
- **Failure Threshold:** Automatically sets safety state to `PAUSED` if failed attempts >15 in an hour.
- **Opt-Out Protection:** Rejects message dispatch to recipients who have opted out.
- **Idempotency Guard:** Suppresses duplicate message dispatch using deterministic `idempotencyKey`.

---

## 4. DATABASE DDL DISCIPLINE
- **PostgreSQL DDL Status:** **ZERO Schema Migrations Required.**
- All channel connection states, active phone numbers, safety settings, rate limit configs, and delivery logs persist inside the existing `companies.whatsapp_settings` JSONB structure and standard `audit_logs` table.
