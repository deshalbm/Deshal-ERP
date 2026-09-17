# PRODUCTION DEPLOYMENT RUNBOOK — DESHAL ERP

## 1. Executive Overview & Prerequisites

This runbook defines the operational procedure for deploying and maintaining **Deshal ERP** in production environments.

### Production Environment Prerequisites:
* **Server**: Production server `root@178.104.32.156` (`/opt/deshal-erp`)
* **Domain**: `erp.deshalbm.com` (additional hosts: `deshalbm.com`, `www.deshalbm.com`)
* **Reverse Proxy**: Traefik with Let's Encrypt TLS termination
* **Container Runtime**: Docker & Docker Compose (`docker compose up -d --build deshal-erp`)
* **Database**: Supabase PostgreSQL with Migration `0034_enterprise_multi_tenancy.sql` active.

---

## 2. Environment Variables & Secret Configuration

### A. Client-Side Variables (Vite - Exposed to Browser)
* `VITE_SUPABASE_URL`: Public Supabase Project URL (`https://<project-ref>.supabase.co`).
* `VITE_SUPABASE_ANON_KEY`: Public Supabase Anonymous JWT key (Safe for client JS).

### B. Server-Side Variables (Node.js Express / Docker Runtime Only)
* `NODE_ENV`: Set to `production`.
* `PORT`: Set to `3000` (Internal container port).
* `SUPABASE_SERVICE_ROLE_KEY`: Private Supabase Service-Role key (Server-side CMS & lead routing only; **NEVER** exposed to client JS).
* `GEMINI_API_KEY`: Google GenAI API key for server-side AI parsing.
* `RESEND_API_KEY`: Resend API key for outbound transactional emails.
* `EMAIL_FROM`: Configured sender email address (e.g. `Deshal ERP <app@portal.deshalbm.com>`).
* `EMAIL_ENABLED`: Set to `true` in production.

---

## 3. Database Verification Procedure

Before initiating container updates, verify that migration `0034_enterprise_multi_tenancy.sql` is active on Supabase:

1. Log into [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **Table Editor** and verify the existence of:
   - `tenants`
   - `platform_admins`
   - `tenant_modules`
   - `tenant_features`
   - `tenant_provisioning_jobs`
3. Verify RLS is enabled on all five tables.
4. Verify SECURITY DEFINER functions enforce `SET search_path = public`.

---

## 4. Local Build & Verification Commands

Before deploying code to production, run the 7-step local validation pipeline:

```bash
npx tsc --noEmit
npm test
npm run lint
npm run build
git diff --check
npm run architecture:audit
git status --short
```

---

## 5. Production Deployment Commands

Connect to production server via SSH and execute the deterministic container build pipeline:

```bash
# 1. Connect to production host
ssh root@178.104.32.156

# 2. Navigate to project root
cd /opt/deshal-erp

# 3. Pull approved main branch code
git pull origin main

# 4. Recreate ONLY the deshal-erp container
docker compose up -d --build deshal-erp

# 5. Verify container status
docker ps | grep deshal-erp
```

> 🛑 **CRITICAL PRODUCTION RULES:**
> - NEVER run `docker system prune` or `docker network prune`.
> - NEVER delete Docker volumes.
> - NEVER restart or modify unrelated containers (Traefik, Evolution API, Portainer, Uptime Kuma).

---

## 6. Health Checks & Verification

After container start, perform automated and manual health checks:

1. **HTTP Health Endpoint:**
   ```bash
   curl -I https://erp.deshalbm.com/api/health
   ```
   *Expected Response:* `HTTP/2 200 OK` with JSON `{"status":"ok","timestamp":"..."}`.

2. **Container Logs Verification:**
   ```bash
   docker logs --tail 50 deshal-erp
   ```
   *Expected Result:* Zero startup crash tracebacks or unhandled exceptions.

---

## 7. Security Smoke Tests

Perform non-destructive verification of multi-tenant security boundaries:

1. **Tenant Context Scoping:** Verify user login resolves company ID strictly from `user_company_memberships`.
2. **Module Guarding:** Verify disabled modules display `TenantModuleAccessGuard` lock component (`🔒`).
3. **Non-ACTIVE Lifecycle Blocking:** Verify tenants in `READY`, `SUSPENDED`, or `ARCHIVED` state display restricted access notice.
4. **Platform Admin Boundary:** Verify platform admins without operational membership are restricted from operational company data tables.
5. **Storage Tampering Immunity:** Modify `preferredCompanyId` in client localStorage and verify resolution resets to authorized membership company.

---

## 8. Rollback Procedure

If a post-deployment defect is detected:

```bash
# 1. Roll back Git commit to previous known-good tag/hash
git checkout <previous-commit-hash>

# 2. Rebuild and restart container
docker compose up -d --build deshal-erp

# 3. Verify health status
curl -I https://erp.deshalbm.com/api/health
```

---

## 9. Observability & Troubleshooting

* **Container Monitoring:** Inspect `docker ps` and container health check status.
* **Logging Location:** Log driver `json-file` capped at 10MB x 3 files. View live logs:
  ```bash
  docker logs -f --tail 100 deshal-erp
  ```
* **Provisioning Observability:** Query `tenant_provisioning_jobs` in Supabase table editor to inspect job execution status, failed steps, or error codes.

---

## 10. Post-Deployment Verification Checklist

- [x] Production build compiled with zero errors (`npm run build`).
- [x] Database migration `0034_enterprise_multi_tenancy.sql` applied.
- [x] All 11 ERP modules accessible and guarded.
- [x] Health check endpoint returning HTTP 200 OK.
- [x] HTTPS TLS certificate valid on `erp.deshalbm.com`.
- [x] Clean Architecture audit passed (100/100 score).
