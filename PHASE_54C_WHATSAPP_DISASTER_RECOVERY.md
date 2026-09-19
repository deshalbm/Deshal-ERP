# Deshal ERP — Phase 54C WhatsApp Disaster Recovery & Outage Playbook

## 1. Overview
This document specifies the disaster recovery procedures, restart protocols, data preservation policies, and incident response workflows for the production WhatsApp infrastructure in Deshal ERP.

---

## 2. Recovery Scenarios & Action Procedures

### Scenario A: Unplanned Application Container Restart or Crash
- **Impact**: Server process terminates abruptly.
- **Automated Behavior**:
  1. Docker compose restarts the `deshal-erp` and `whatsapp-worker` containers automatically.
  2. Persistent volume `whatsapp-sessions` supplies the AES-256-GCM encrypted Baileys session files.
  3. `WhatsAppConnectionManager` auto-restores active company sessions upon first socket request or watchdog ping.
  4. BullMQ resumes message delivery from `redis-data` volume without duplicate message dispatches.
- **Manual Verification**:
  - Execute `curl -X GET http://localhost:3000/api/admin/communication/whatsapp/production-health` and check `status: "OK"`.

### Scenario B: Redis Service Outage or Restart
- **Impact**: Queue connection temporarily interrupted.
- **Automated Behavior**:
  1. ioredis client automatically enters reconnect retry mode with exponential backoff.
  2. Background worker retries queue pings until Redis service becomes available.
  3. AOF persistence in `redis-data:/data` restores queue state upon Redis startup.
- **Manual Verification**:
  - Run `docker compose exec redis redis-cli ping` to confirm `PONG`.

### Scenario C: WhatsApp Disconnect or Session Expiration
- **Impact**: Socket disconnects or WhatsApp server revokes token.
- **Automated Behavior**:
  1. `WhatsAppWatchdog` intercepts socket disconnect event.
  2. Circuit breaker opens if consecutive retries exceed threshold (`maxRetries = 5`).
  3. UI displays `Circuit Breaker: OPEN / PAUSED` status to administrative user.
- **Manual Action**:
  1. Click **"Watchdog Reset"** or trigger POST `/api/admin/communication/whatsapp/watchdog/reset`.
  2. If session is invalid, click **"Remove Number"** (DELETE `/api/admin/communication/whatsapp/number`) and re-pair with QR code.

---

## 3. Disaster Recovery Commandments
1. **Never delete Docker volumes (`redis-data`, `whatsapp-sessions`) during routine deployments.**
2. **Never store plain-text session keys in database tables or client-accessible storage.**
3. **Always verify `GET /api/admin/communication/whatsapp/production-health` after container updates.**
