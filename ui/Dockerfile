# Build context: repo root
# docker build -f ui/Dockerfile -t pokehub-ui .

# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Shared types (aliased as $shared)
COPY shared/ ./shared/

# Install deps
COPY ui/package.json ui/package-lock.json* ./ui/
RUN cd ui && npm ci

# Source
COPY ui/ ./ui/

# next build outputs standalone server to ui/.next/standalone/
ENV NEXT_TELEMETRY_DISABLED=1
RUN cd ui && npm run build

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

COPY --from=builder /app/ui/.next/standalone ./
COPY --from=builder /app/ui/.next/static ./.next/static
COPY --from=builder /app/ui/public ./public

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=4000
ENV API_BASE_URL=http://api-svc:3000
EXPOSE 4000

CMD ["node", "server.js"]
