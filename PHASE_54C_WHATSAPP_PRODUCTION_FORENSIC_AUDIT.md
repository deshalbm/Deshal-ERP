# Deshal ERP — Phase 54C WhatsApp Production Forensic Audit

## 1. Executive Summary
This forensic audit analyzes the current production readiness of the multi-tenant WhatsApp infrastructure in Deshal ERP following Phase 54A and Phase 54B implementations. The goal of Phase 54C is to harden Redis, BullMQ, Baileys session persistence, container volume topology, connection watchdogs, and multi-tenant security controls for zero-downtime recovery and production reliability.

---

## 2. Current Architecture Topology
- **API Server**: Express HTTP server running `server.ts` (bundled as `dist/server.cjs`).
- **Worker Process**: Standalone background worker `src/workers/whatsappWorker.ts` (bundled as `dist/whatsappWorker.cjs`).
- **Queue Manager**: `WhatsAppQueueManager` managing 5 isolated BullMQ channels (`whatsapp.outbound`, `whatsapp.inbound`, `whatsapp.connection`, `whatsapp.health`, `whatsapp.dead_letter`).
- **Connection Manager**: `WhatsAppConnectionManager` coordinating Baileys socket connections and encrypted sessions.
- **Connection Watchdog**: `WhatsAppWatchdog` monitoring heartbeats, stale sessions, and managing circuit breakers (`CLOSED`, `OPEN`, `PAUSED`, `MANUAL_REVIEW`).

---

## 3. Forensic Analysis & Discovery Findings

### A. Redis Infrastructure & Volume Topology
- **Current Finding**: In `docker-compose.yml`, the `redis` service executes `redis-server --appendonly yes` on internal network `deshal-internal` without exposing port 6379 publicly.
- **Defect/Gap**: No named Docker volume is mounted to `/data` for `redis`. Container restart or host reboot could erase in-memory/AOF queue states if the container filesystem is recreated.
- **Required Hardening**: Add a persistent named volume `redis-data:/data` to the `redis` service in `docker-compose.yml`.

### B. Baileys Session Durability & Secret Isolation
- **Current Finding**: Session secrets are encrypted using AES-256-GCM via `WHATSAPP_SESSION_ENCRYPTION_KEY` and retained in server-side memory (`sessionSecrets` Map).
- **Defect/Gap**: Persistent session files need a dedicated server-side directory volume (e.g. `/app/data/whatsapp-sessions`) to guarantee session survival across host reboots and container recreations.
- **Required Hardening**: Implement server-side persistent file storage for encrypted session tokens and mount a dedicated named Docker volume `whatsapp-sessions:/app/data/whatsapp-sessions`.

### C. BullMQ Queue Stalled-Job Recovery & Idempotency
- **Current Finding**: Idempotency keys (`idempotencyKey`) prevent duplicate job creation across network retries.
- **Required Hardening**: Configure BullMQ completed and failed job retention policies (`removeOnComplete: 1000`, `removeOnFail: 5000`) and stalled job recovery check intervals to prevent memory growth and guarantee single delivery attempts.

### D. Multi-Tenant Queue & API Security Isolation
- **Current Finding**: `companyId` scopes all queue statistics, dead-letter queries, circuit breaker resets, and channel statuses.
- **Required Hardening**: Add explicit negative test coverage (5 cross-tenant queue tests, 5 cross-tenant API tests, 5 cross-tenant watchdog/session tests) in `phase54cWhatsAppProduction.test.ts`.

### E. Watchdog & Account Safety Lifecycle
- **Current Finding**: Circuit breaker transitions to `PAUSED` after 5 consecutive transport errors.
- **Required Hardening**: Implement explicit `REMOVE_NUMBER` / `DELETE` action: cleanly disconnect socket, halt queue sends, revoke encrypted session credentials, emit audit log entry, and leave company master configuration intact.

### F. Health & Observability API
- **Current Finding**: Existing health endpoint `/api/admin/communication/whatsapp/health` returns basic channel metrics.
- **Required Hardening**: Create `/api/admin/communication/whatsapp/production-health` providing safe diagnostic tags (`REDIS: CONNECTED`, `WORKER: HEALTHY`, `WHATSAPP_ENCRYPTION: CONFIGURED`) without leaking private keys or tokens.

---

## 4. Recommended Action Plan for Phase 54C
1. Update `docker-compose.yml` to include `redis-data` and `whatsapp-sessions` persistent volumes.
2. Extend `WhatsAppConnectionManager` with explicit number removal and session revocation capabilities.
3. Add `/api/admin/communication/whatsapp/production-health` endpoint in `server.ts`.
4. Update `CommunicationSection.tsx` with production health indicators and safe "Remove Number" administrative action modal.
5. Create `scripts/run-phase54c-whatsapp-production-gate.ts` (production smoke test script).
6. Create `src/tests/phase54cWhatsAppProduction.test.ts` (40+ production unit & security test scenarios).
7. Create `e2e/phase54cWhatsAppProduction.spec.ts` (Playwright E2E spec).
8. Generate 6 architectural & disaster recovery documentation files.
9. Execute mandatory validation pipeline and verify `docker compose config`.
