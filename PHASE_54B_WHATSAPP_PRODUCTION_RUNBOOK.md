# Deshal ERP — Phase 54B Production WhatsApp Runbook

## 1. Environment Variables Configuration
Ensure the following variables are present in production `.env`:

```env
NODE_ENV=production
PORT=3000
REDIS_URL=redis://redis:6379
WHATSAPP_SESSION_ENCRYPTION_KEY=deshal_production_secret_32bytes_key!
```

---

## 2. Service Management Commands

### Start Dedicated Worker Process
```bash
node dist/whatsappWorker.cjs
```

### Docker Compose Container Deployment
```bash
docker compose up -d --build deshal-erp redis deshal-erp-worker
```

---

## 3. Operational Troubleshooting Procedures

### Procedure A: Stale Channel Recovery
If a channel remains in `CONNECTING` or `CONNECTED` with an inactive heartbeat:
1. Inspect watchdog status: `GET /api/admin/communication/whatsapp/watchdog/status?companyId=<companyId>`
2. Trigger channel restart: `POST /api/admin/communication/whatsapp/restart` (Body: `{ "companyId": "<companyId>" }`)

### Procedure B: Circuit Breaker Reset
If a channel circuit breaker trips to `PAUSED` or `MANUAL_REVIEW`:
1. Verify underlying transport / phone connectivity.
2. Trigger administrative reset: `POST /api/admin/communication/whatsapp/watchdog/reset` (Body: `{ "companyId": "<companyId>" }`)

### Procedure C: Retrying Dead-Letter Queue (DLQ) Jobs
1. Fetch DLQ jobs: `GET /api/admin/communication/whatsapp/dead-letter?companyId=<companyId>`
2. Trigger retry for specific job: `POST /api/admin/communication/whatsapp/dead-letter/retry` (Body: `{ "jobId": "<jobId>", "companyId": "<companyId>" }`)
