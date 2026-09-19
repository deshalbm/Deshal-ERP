# DESHAL ERP — PHASE 54B FORENSIC RUNTIME AUDIT REPORT

**Phase:** Phase 54B — Production WhatsApp Runtime, BullMQ Queue, Persistent Baileys Sessions & Multi-Tenant Reliability  
**Timestamp:** 2026-09-19T18:46:44+04:00  
**Status:** FORENSIC AUDIT COMPLETED  

---

## 1. FORENSIC AUDIT FINDINGS

### A. Is Evolution API currently responsible for WhatsApp sessions?
* **Finding:** On the production host (`root@178.104.32.156`), an external Evolution API Docker container exists on the host network. In the ERP client codebase (`src/utils/whatsappBaileys.ts` & `src/types/common.ts`), `evolution_api` is supported as a server preset option via HTTP REST API (`/instance/fetchInstances`, `/message/sendText`). However, inside the `deshal-erp` repository itself, there is no direct container management or session coupling to Evolution API.

### B. Is `whatsappBaileys.ts` creating real Baileys sockets?
* **Finding:** No. `src/utils/whatsappBaileys.ts` contains client-side HTTP helper functions that send REST calls to a configured gateway URL, as well as a documentation code snippet string (`BAILEYS_SERVER_NODE_SNIPPET`). It does NOT import or instantiate Baileys sockets directly inside the browser or React client.

### C. Are there currently two possible WhatsApp gateways?
* **Finding:** Yes. The application supports an HTTP gateway architecture where client requests can target an external Evolution API instance or a generic Baileys HTTP gateway. In Phase 54A, server-side REST API endpoints (`/api/admin/communication/whatsapp/*`) and the `WhatsAppConnectionManager` service were added to unify transport orchestration.

### D. Where are sessions currently persisted?
* **Finding:** In Phase 54A, channel metadata, connection status, phone numbers, and safety settings persist in the database inside `companies.whatsapp_settings` (JSONB) and `audit_logs`. Server session secrets are encrypted with AES-256-GCM using `WHATSAPP_SESSION_ENCRYPTION_KEY`. No session credentials or pairing secrets exist in browser `localStorage`.

### E. Is Redis already available?
* **Finding:** No Redis driver (`ioredis` or `redis`) is currently installed in `package.json`. In production, Redis can be connected via `REDIS_URL` or run on the internal Docker network.

### F. Is BullMQ already installed?
* **Finding:** No. `bullmq` is not currently listed in `package.json`.

### G. Is the existing connection manager creating a live Baileys socket or an abstraction?
* **Finding:** In Phase 54A, `WhatsAppConnectionManager` (`src/lib/whatsapp/whatsappConnectionManager.ts`) provides a complete in-memory connection manager, state machine, AES-256-GCM session encryptor, queue buffer, idempotency guard, and backoff engine. It simulates socket transport for zero-dependency execution and unit testing.

### H. Production Implementations vs. Placeholders/In-Memory Implementations
* **Production Implementations:**
  - Pure domain state machine & anti-spam policies (`src/domain/whatsapp/whatsappDomain.ts`).
  - Abstract application port (`src/application/ports/whatsappPort.ts`).
  - Application orchestration service (`src/application/services/whatsappChannelService.ts`).
  - AES-256-GCM encrypted session credential store (`src/lib/whatsapp/whatsappConnectionManager.ts`).
  - Express REST API endpoints in `server.ts`.
  - Communication Center UI integration (`CommunicationSection.tsx`).
* **In-Memory / Queue Extensions for Phase 54B:**
  - Queue runner & BullMQ / in-memory Redis queue engine (`whatsapp.outbound`, `whatsapp.inbound`, `whatsapp.connection`, `whatsapp.health`, `whatsapp.dead_letter`).
  - Dedicated long-running worker process (`src/workers/whatsappWorker.ts`).
  - Persistent Baileys auth state file/db adapter.

---

## 2. PRODUCTION RUNTIME TOPOLOGY

```text
React / Communication Center (Browser UI)
           │
           │ Authenticated REST API (companyId context)
           ▼
Express API (`server.ts`)
           │
           ├── WhatsApp Channel Application Service
           │
           ▼
Redis Broker / Queue Engine (BullMQ / Durable Buffer)
           │
           ▼
Dedicated WhatsApp Worker Process (`src/workers/whatsappWorker.ts`)
           │
           ├── WhatsApp Connection Manager (`whatsappConnectionManager.ts`)
           ├── Baileys Socket Runtime (@whiskeysockets/baileys / Transport)
           └── Encrypted Persistent Session Store (AES-256-GCM)
```

---

## 3. DATABASE DDL DISCIPLINE

- **PostgreSQL DDL Status:** **ZERO Schema Migrations Required.**
- All channel connection states, active phone numbers, safety settings, rate limit configs, and delivery logs persist inside the existing `companies.whatsapp_settings` JSONB structure and standard `audit_logs` table.

---

**FORENSIC RUNTIME AUDIT COMPLETED — PROCEEDING TO PHASE 54B IMPLEMENTATION**
