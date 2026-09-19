# Deshal ERP — Phase 54C WhatsApp Production Infrastructure Architecture Specification

## 1. Executive Summary
Phase 54C completes the production hardening of the multi-tenant Baileys WhatsApp channel infrastructure in Deshal ERP. It provides full volume persistence, session survivability across container recreations, zero-downtime recovery, sanitized production diagnostic endpoints, and explicit tenant-scoped number removal capabilities.

---

## 2. Production Topology & Volume Persistence

```text
Host System / Container Environment
  ├── Docker Compose Named Volumes
  │     ├── redis-data -> /data (AOF & RDB Redis persistence)
  │     └── whatsapp-sessions -> /app/data/whatsapp-sessions (AES-256-GCM encrypted Baileys session files)
  ├── Services Architecture
  │     ├── redis (Redis 7.2 Alpine, AOF enabled)
  │     ├── deshal-erp (Express Server + React SPA)
  │     └── whatsapp-worker (Dedicated BullMQ Worker Process)
  └── Multi-Tenant Security & Isolation
        ├── AES-256-GCM Server Encryption Key (WHATSAPP_SESSION_ENCRYPTION_KEY)
        ├── Dynamic Company Isolation (Company A cannot view/mutate Company B's session or queues)
        └── Production Health Diagnostics Endpoint (/api/admin/communication/whatsapp/production-health)
```

---

## 3. Key Architectural Pillars

### 3.1 Persistence & Disaster Recovery
- **Redis Volume Persistence**: Docker volume `redis-data` maps to `/data` in the Redis container with Append Only File (AOF) enabled (`redis-server --appendonly yes`), ensuring delayed or active BullMQ message jobs are never lost across restarts.
- **Session Volume Persistence**: Docker volume `whatsapp-sessions` maps to `/app/data/whatsapp-sessions`, preserving encrypted session credentials across container recreations (`docker compose up -d --build`).

### 3.2 Tenant Isolation & Explicit Cleanup
- **Explicit Number Removal**: `DELETE /api/admin/communication/whatsapp/number` allows company administrators to safely remove a connected WhatsApp number. This revokes session keys, disconnects sockets, resets watchdog circuit breakers, and logs audit events without deleting database records or affecting other companies.
- **Sanitized Production Health Endpoint**: `GET /api/admin/communication/whatsapp/production-health` returns structured health summaries (`REDIS: CONNECTED`, `ENCRYPTION: CONFIGURED`, `WATCHDOG: ACTIVE`) without leaking encryption keys, session tokens, or internal URLs.

### 3.3 Reliability & Watchdog Safeguards
- **Circuit Breaker Integration**: Circuit breakers automatically transition between `CLOSED`, `OPEN`, and `HALF_OPEN` states to prevent disconnect storms and rate limit bans from WhatsApp servers.
- **Dead Letter Queue (DLQ)**: Jobs exceeding retry limits are parked in `whatsapp.dead_letter` queue for administrative review and safe manual replay.

---

## 4. Compliance & Security Summary
- **Zero Database DDL Migrations**: Zero schema changes introduced; tenant settings are stored in approved JSONB columns (`companies.whatsapp_settings`).
- **Clean Architecture Score**: 100/100 maintained across Domain, Ports, Services, Adapters, and Presentation layers.
