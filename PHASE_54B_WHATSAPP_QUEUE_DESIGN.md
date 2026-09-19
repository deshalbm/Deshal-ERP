# Deshal ERP — Phase 54B WhatsApp Queue & Retry Design

## 1. Queue Channels Specification
Deshal ERP operates 5 isolated queue channels managed by `WhatsAppQueueManager`:

| Queue Channel Name | Purpose | Retries | Idempotency |
| :--- | :--- | :--- | :--- |
| `whatsapp.outbound` | High-priority outbound transactional message dispatch | Max 3 (Exponential) | Enforced (`companyId:channelId:send:phone:hash`) |
| `whatsapp.inbound` | Inbound webhooks & customer response events | Max 3 (Linear) | Correlation ID tagged |
| `whatsapp.connection` | QR generation, pairing, and socket state sync | Max 2 | Per-company lock |
| `whatsapp.health` | Background heartbeat and watchdog monitoring ticks | 0 (Drop if stale) | Non-blocking |
| `whatsapp.dead_letter` | Unrecoverable failed jobs after max retries | 0 (Manual retry only) | Retains original jobId & correlationId |

---

## 2. 12 Outbound Safety Guards
Before enqueueing or dispatching any outbound job, `WhatsAppQueueManager` evaluates 12 mandatory rules:
1. Company Active check
2. WhatsApp Channel Active check
3. Channel Safety State != `PAUSED`
4. Channel Safety State != `MANUAL_REVIEW`
5. Recipient phone number format normalized (`formatWhatsAppRecipient`)
6. Message text non-empty
7. Idempotency key valid
8. Recipient opt-out check (`STOP` / `إيقاف`)
9. Per-company rate limit within threshold (max 30/min, 500/hr)
10. Per-channel rate limit within threshold
11. Queue infrastructure state healthy
12. Worker process active check

---

## 3. Failure Classification & Retry Policy
Errors are deterministically classified using `classifyWhatsAppFailure`:

- `TRANSIENT` (e.g. ECONNRESET, network timeout): Retried automatically with exponential backoff (`calculateExponentialBackoff`).
- `RATE_LIMIT`: Throttled; retried after backoff delay.
- `CHANNEL_UNAVAILABLE`: Retried up to 3 times before circuit breaker evaluation.
- `POLICY` (e.g. Opt-out breach): **Never retried**. Routed directly to `whatsapp.dead_letter`.
- `AUTHENTICATION` (e.g. Expired session): **Never retried**. Channel flagged for QR pairing.
- `PERMANENT` (e.g. Invalid recipient phone): **Never retried**.
- `SYSTEM`: Retried up to max 3 attempts before DLQ routing.
