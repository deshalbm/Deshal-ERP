# Deshal ERP — Phase 54C WhatsApp Production Runbook & Operator Guide

## 1. Environment Requirements
- Node.js >= 20.x
- Redis >= 7.2 with AOF enabled
- Environment Variables:
  - `WHATSAPP_SESSION_ENCRYPTION_KEY` (32-byte hex key for AES-256-GCM)
  - `REDIS_URL` (e.g. `redis://:password@redis:6379`)
  - `ENABLE_WHATSAPP_WORKER` (`true` for worker process)

---

## 2. Operational Procedures

### 2.1 Checking Production Infrastructure Health
To verify the operational status of the WhatsApp runtime without exposing sensitive data:
```bash
curl -s http://localhost:3000/api/admin/communication/whatsapp/production-health \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```
Expected Output:
```json
{
  "success": true,
  "health": {
    "status": "HEALTHY",
    "worker": "HEALTHY (100%)",
    "redis": "REDIS: CONNECTED",
    "encryption": "ENCRYPTION: CONFIGURED",
    "watchdog": "WATCHDOG: ACTIVE",
    "activeSessionsCount": 1
  }
}
```

### 2.2 Removing a WhatsApp Number (Session Teardown)
To disconnect and completely wipe encrypted session credentials for a company:
```bash
curl -X DELETE http://localhost:3000/api/admin/communication/whatsapp/number \
  -H "Authorization: Bearer <COMPANY_ADMIN_TOKEN>"
```
Or via Communication Center UI:
1. Navigate to **Settings** → **Communication Center**.
2. Select **الواتساب (WhatsApp)** tab.
3. Click **حذف الرقم (Remove Number)** and confirm dialog.

### 2.3 Resetting Circuit Breaker
If watchdog places a company's channel in `MANUAL_REVIEW` after repeated connection failures:
1. Navigate to Communication Center → **الواتساب (WhatsApp)** tab.
2. Click **إعاده ضبط القاطع (Watchdog Reset)**.
3. Verify status changes to `Circuit Breaker: CLOSED`.

---

## 3. Production Deployment Protocol
1. Run local automated verification gate:
   ```bash
   npm run gate:phase54c-whatsapp-production
   ```
2. Build and verify production Docker images:
   ```bash
   docker compose config
   ```
3. Deploy container updates safely (zero data loss):
   ```bash
   docker compose up -d --build deshal-erp whatsapp-worker
   ```
