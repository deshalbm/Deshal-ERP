# Multi-stage Dockerfile for Deshal ERP (Production-ready)
# -----------------------------------------------------------------------------
# Feature-Agnostic: Adding application modules (CRM, HR, Accounting, etc.)
# does NOT require changing this Dockerfile.
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Stage 1: Builder Stage
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifests first for optimal layer caching
COPY package.json package-lock.json* ./

# Install dependencies deterministically using npm ci (fallback to npm install)
RUN npm ci || npm install

# Copy complete application source code
COPY . .

# Build args for client-side Vite environment variables
ARG VITE_SUPABASE_URL=https://iewceykescyycodllftl.supabase.co
ARG VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlld2NleWtlc2N5eWNvZGxsZnRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNDI5NzgsImV4cCI6MjEwMzkxODk3OH0.aeRmCHcTrslO9UCoYLljwLuAhrhX9gShNr4Lgw2x3Zc

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Build Vite static bundle & Express server bundle (fails build if compilation fails)
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2: Production Runner Stage
# -----------------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

# Production environment defaults
ENV NODE_ENV=production
ENV PORT=3000

# Copy package metadata & install production-only dependencies
COPY package.json package-lock.json* ./
RUN (npm ci --omit=dev || npm install --omit=dev) && npm cache clean --force

# Copy compiled production artifacts from builder stage
COPY --from=builder /app/dist ./dist

# Expose standard application port
EXPOSE 3000

# Health check using zero-dependency inline Node HTTP GET request
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Run container under unprivileged node user for security hardening
USER node

# Start production server
CMD ["node", "dist/server.cjs"]
