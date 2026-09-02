# Deshal ERP — Production Docker Infrastructure Guide

This document outlines the containerization, build, deployment, health monitoring, and rollback procedures for **Deshal ERP**.

---

## 1. Core Infrastructure Principle

> **Application Features should not require Dockerfile changes.**

The `Dockerfile` defines **how Deshal ERP is built and runs**, not **what Deshal ERP does**. Adding or updating business modules (CRM, HR, Accounting, Inventory, POS, Bookings, etc.) occurs strictly within the application code (`src/` and `package.json`). The Docker infrastructure remains constant and feature-agnostic.

### Architectural Workflow

```text
Developer changes application code
        ↓
Git Commit / Push
        ↓
Docker Build (npm ci -> npm run build)
        ↓
Production Docker Image (Node 22-alpine + static dist)
        ↓
Deploy Container (docker-compose up -d)
        ↓
Health Check (/api/health)
        ↓
Deshal ERP Operational
```

---

## 2. Environment Configurations

### Development Mode (Native)
Run locally using Node.js dev server with hot reloading:
```bash
npm install
npm run dev
```

### Production Mode (Docker Container)
Production builds compile static assets with Vite and bundle the Node Express server (`server.ts` -> `dist/server.cjs`). The container runs as an unprivileged user (`USER node`).

---

## 3. Environment Variables & Secrets Security

**NEVER** embed secrets, API keys, or database credentials inside `Dockerfile`, images, or version control.

### Configuration Template
Copy `.env.example` to `.env` for production runtime:
```bash
cp .env.example .env
```

### Supported Variables
| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `3000` | Application HTTP port |
| `NODE_ENV` | `production` | Node environment flag |
| `GEMINI_API_KEY` | *(optional)* | Server-side AI integration key |
| `VITE_SUPABASE_URL` | *(optional)* | Supabase backend service URL |
| `VITE_SUPABASE_ANON_KEY` | *(optional)* | Supabase anonymous API key |

---

## 4. Building & Versioning Docker Images

Use explicit version tags rather than relying solely on `:latest`.

### Image Tagging Strategy
- Version Tags: `deshal-erp:1.0.0`, `deshal-erp:1.0.1`
- Date Tags: `deshal-erp:2026.09.02`

### Manual Build Command
```bash
docker build -t deshal-erp:2026.09.02 -t deshal-erp:latest .
```

---

## 5. Running Containers

### Option A: Using Docker Compose (Recommended)

Start the production stack in detached mode:
```bash
docker compose up -d
```

View container status:
```bash
docker compose ps
```

Stream live container logs:
```bash
docker compose logs -f deshal-erp
```

Stop the stack:
```bash
docker compose down
```

### Option B: Using Standalone Docker CLI

```bash
docker run -d \
  --name deshal-erp \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env \
  deshal-erp:2026.09.02
```

---

## 6. Health Checks & Diagnostics

The production server includes a built-in health endpoint:
```text
GET /api/health
```

### Container Health Check
`Dockerfile` and `docker-compose.yml` automatically execute an inline Node health check every 30 seconds:
```bash
node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"
```

### Manual Health Verification
```bash
curl http://localhost:3000/api/health
```
**Expected Response:**
```json
{"status":"ok","timestamp":"2026-09-02T12:00:00.000Z"}
```

---

## 7. SPA Routing & Fallback

The Express server handles SPA routing natively. Requests for client routes (`/accounting`, `/crm`, `/hr`, `/inventory`, `/settings`) fall back automatically to `index.html`, eliminating 404 errors on direct navigation or browser refresh.

---

## 8. Database Migrations Separation

Database schema modifications are strictly **decoupled** from Docker image builds.

1. **Build Safety**: `docker build` never alters database schemas or runs destructive migrations.
2. **Execution**: Database migrations must be run as an independent, audited step prior to container deployment.

---

## 9. Safe Deployment & Rollback Procedures

### Zero-Downtime Deployment
1. Build new version image:
   ```bash
   docker build -t deshal-erp:1.0.1 .
   ```
2. Update `TAG=1.0.1` in environment or compose file.
3. Deploy new container:
   ```bash
   TAG=1.0.1 docker compose up -d
   ```
4. Verify health check:
   ```bash
   curl http://localhost:3000/api/health
   ```

### Rollback Procedure
If the new release fails verification, instantly revert to the previous verified image tag:
```bash
TAG=1.0.0 docker compose up -d
```

---

## 10. CI/CD Integration (GitHub Actions / Cloud VPS)

Sample GitHub Actions workflow pattern (`.github/workflows/deploy.yml`):

```yaml
name: Deshal ERP Docker CI/CD

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build Docker Image
        run: docker build -t deshal-erp:${{ github.sha }} .

      - name: Run Container Health Test
        run: |
          docker run -d -p 3000:3000 --name test-app deshal-erp:${{ github.sha }}
          sleep 5
          curl --fail http://localhost:3000/api/health
          docker stop test-app && docker rm test-app
```
