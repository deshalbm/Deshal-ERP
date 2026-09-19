# Deshal ERP — Phase 54B WhatsApp Runtime Architecture Specification

## 1. Executive Summary
Phase 54B establishes a production-grade multi-company WhatsApp runtime architecture for Deshal ERP. The system decouples Express HTTP API request handlers from WhatsApp transport execution using BullMQ queues, Redis, and a dedicated Node background worker process (`src/workers/whatsappWorker.ts`).

---

## 2. Architecture Topology

```
Browser / UI (React)
    ↓ (REST / HTTPS)
Express API (server.ts)
    ↓
WhatsApp Application Service (whatsappChannelService.ts)
    ↓
WhatsApp Queue Manager (whatsappQueueManager.ts)
    ↓
BullMQ / Redis (Port 6379 Internal Network)
    ↓
Dedicated WhatsApp Worker Process (whatsappWorker.ts)
    ↓
WhatsApp Connection Manager & Baileys Adapter (whatsappConnectionManager.ts)
    ↓
WhatsApp Web / Transport
```

---

## 3. Core Architectural Principles
1. **Strict Multi-Company Isolation**: Every job, channel, queue metric, and watchdog heartbeat is scoped by `companyId`. Cross-company inspection or mutation is blocked at the port/service layer.
2. **Server-Side Session Credential Encryption**: Baileys session credentials and tokens are encrypted with AES-256-GCM using `WHATSAPP_SESSION_ENCRYPTION_KEY`. Zero secrets reach client browser storage, localStorage, error logs, or public API responses.
3. **Dedicated Worker Isolation**: Background queue processing runs in `src/workers/whatsappWorker.ts`. Worker errors or session failures in Company X will never crash the Express HTTP server or affect Company Y.
4. **Automated Connection Watchdog & Circuit Breaker**: `WhatsAppWatchdog` monitors heartbeats, stale sessions, and consecutive failure counts. If failure thresholds are reached, circuit breakers transition state to `PAUSED` or `MANUAL_REVIEW`, stopping reconnect storms.
5. **Zero PostgreSQL DDL Migrations**: Channel settings, status, queue stats, and audit logs utilize existing PostgreSQL JSONB fields (`companies.whatsapp_settings`) and `audit_logs`.
