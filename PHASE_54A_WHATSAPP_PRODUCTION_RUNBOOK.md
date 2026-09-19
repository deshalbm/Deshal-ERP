# DESHAL ERP — PHASE 54A PRODUCTION RUNBOOK

**Target Environment:** Production Docker Host (`root@178.104.32.156`, container `deshal-erp`)  
**Domain:** `erp.deshalbm.com`  

---

## 1. OPERATIONAL COMMANDS

### A. Inspect WhatsApp Channel Health
```bash
curl -s http://localhost:3000/api/admin/communication/whatsapp/health | jq .
```

### B. Inspect Company WhatsApp Status
```bash
curl -s "http://localhost:3000/api/admin/communication/whatsapp/status?companyId=company-a" | jq .
```

### C. Connect Company WhatsApp Channel (Generate QR Code)
```bash
curl -X POST http://localhost:3000/api/admin/communication/whatsapp/connect \
  -H "Content-Type: application/json" \
  -d '{"companyId":"company-a"}'
```

### D. Restart Company WhatsApp Channel (Trigger Exponential Backoff Reconnect)
```bash
curl -X POST http://localhost:3000/api/admin/communication/whatsapp/restart \
  -H "Content-Type: application/json" \
  -d '{"companyId":"company-a"}'
```

### E. Disconnect Company WhatsApp Channel (Revoke Active Session)
```bash
curl -X POST http://localhost:3000/api/admin/communication/whatsapp/disconnect \
  -H "Content-Type: application/json" \
  -d '{"companyId":"company-a"}'
```

### F. Send Test WhatsApp Message
```bash
curl -X POST http://localhost:3000/api/admin/communication/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{"companyId":"company-a","recipientPhone":"96899112233","messageText":"إشعار تجريبي"}'
```

---

## 2. TROUBLESHOOTING & EMERGENCY RECOVERY

- **Invalid Session / Auth Failure:**
  1. Trigger disconnect command via API or Communication Center UI.
  2. Initiate connect to request a fresh QR code.
  3. Scan fresh QR code using authorized WhatsApp business device.

- **High Error Failure Rate / Safety Pause:**
  1. Inspect `safetyState` via health endpoint (`GET /api/admin/communication/whatsapp/health`).
  2. If safety state is `PAUSED` or `THROTTLED`, verify recipient phone formatting and wait for 1-minute window reset.

- **Container Restart & Uptime:**
  - WhatsApp sub-worker runs inside `deshal-erp` server process (`server.ts`).
  - Container automatically restarts via Docker `restart: unless-stopped` policy.
