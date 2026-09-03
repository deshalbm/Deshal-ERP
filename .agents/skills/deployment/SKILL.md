---
name: deployment
description: Production deployment workflow for Deshal ERP. Use whenever user requests "deploy", "deploy to server", "npm run build", "build and deploy", or "production deployment".
---

# Production Deployment Workflow — Deshal ERP

This skill defines the deterministic, safe production build and deployment workflow for Deshal ERP.

## Target Production Environment
- **Server Location**: Production server `root@178.104.32.156` (`/opt/deshal-erp`)
- **Domain**: `erp.deshalbm.com`
- **Container Service**: `deshal-erp`
- **Internal Port**: 3000 (Internal Docker container port, proxied by Traefik)
- **Docker Network**: `proxy`
- **Reverse Proxy**: Traefik
- **Git Repository**: `https://github.com/deshalbm/Deshal-ERP.git`
- **SSH Authentication**: Existing SSH connection to `root@178.104.32.156` (do not request SSH credentials if existing SSH configuration works).

---

## 1. Command Behavior Rules

### A. Command: `npm run build`
1. Execute `npm run lint` (`tsc --noEmit`) and `npm run build` locally.
2. Verify zero TypeScript compilation errors and zero Vite build errors.
3. **DO NOT DEPLOY AUTOMATICALLY** unless explicitly requested by the user.
4. Report build status (success/failure) clearly with output summary.

### B. Command: `deploy` | `deploy to server` | `build and deploy` | `production deployment`
Follow the strict 5-phase deterministic pipeline below:
`BUILD → VERIFY → DEPLOY → HEALTH CHECK → AUDIT`

---

## 2. Execution Pipeline Details

### Phase 1: Local Build & Code Verification
1. Inspect Git status (`git status`), current branch, and latest commit hash.
2. Check for uncommitted local changes:
   - **NEVER** silently discard or override local changes.
   - If uncommitted changes exist, report them to the user.
3. Run `npm run lint` (`tsc --noEmit`).
4. Run `npm run build`.
5. **CRITICAL GATE**: If build or lint fails, **STOP IMMEDIATELY**. Do not attempt deployment.

### Phase 2: Production Database Safety Guard
1. Inspect pending database migrations in `supabase/migrations/`.
2. **DATABASE SAFETY RULE**:
   - Deployment must **NEVER** automatically execute database migrations against the production database.
   - If a new migration file exists or a database schema change is required to support the new build:
     - **STOP IMMEDIATELY** and report:
       `"Production database migration required — approval needed."`
     - Do NOT execute the migration automatically. Wait for explicit user confirmation.

### Phase 3: Repository Synchronization
1. Ensure approved changes are committed to the `main` branch.
2. Push commits to remote (`git push origin main`) using existing SSH authentication (`git@github.com:deshalbm/Deshal-ERP.git`).

### Phase 4: Production Container Deployment via SSH
1. Connect to production server using existing local machine SSH configuration.
2. Navigate to project root: `/opt/deshal-erp`.
3. Pull latest approved code from `main`:
   ```bash
   git pull origin main
   ```
4. Recreate **ONLY** the Deshal ERP container using Docker Compose:
   ```bash
   docker compose up -d --build deshal-erp
   ```

### 🛑 CRITICAL PRODUCTION SAFETY RULES (NON-NEGOTIABLE):
- **DO NOT** run `docker system prune` or `docker network prune`.
- **DO NOT** delete Docker volumes.
- **DO NOT** remove, restart, or touch unrelated containers (Traefik, Evolution API, Portainer, Uptime Kuma, etc.).
- **DO NOT** modify firewall or DNS settings.
- **DO NOT** expose internal port 3000 to the public network.
- **DO NOT** overwrite production `.env` files.
- **DO NOT** print secrets, SSH keys, or Supabase service credentials in logs/output.
- **DO NOT** run destructive `git reset --hard` or force pushes on production.

### Phase 5: Health Check & Verification
1. Verify Docker container status:
   ```bash
   docker ps | grep deshal-erp
   ```
2. Verify HTTPS site accessibility:
   - Request `https://erp.deshalbm.com`
   - Confirm HTTP 200 status code response.
3. Inspect recent container logs for startup errors:
   ```bash
   docker logs --tail 50 deshal-erp
   ```
4. Report final deployment status including:
   - Deployed Git commit hash & branch
   - Container health status
   - Live URL response status

---

## 3. Rollback Procedure

If deployment fails or the container crashes after an update:
1. **Preserve Server Environment**: Do not wipe volumes or touch server configuration.
2. Report the exact failure traceback to the user.
3. If a previous known-good Git commit / Docker image exists, perform a safe rollback:
   ```bash
   git checkout <previous-known-good-commit>
   docker compose up -d --build deshal-erp
   ```
4. Verify site recovery at `https://erp.deshalbm.com`.
5. Report rollback results and await user instruction.
