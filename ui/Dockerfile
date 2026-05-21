# Build context: repo root
# docker build -f ui-react/Dockerfile -t pokehub-ui-react .

# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Shared types (aliased as $shared)
COPY shared/ ./shared/

# Install deps
COPY ui-react/package.json ui-react/package-lock.json* ./ui-react/
RUN cd ui-react && npm ci

# Source
COPY ui-react/ ./ui-react/

# next build outputs standalone server to ui-react/.next/standalone/
ENV NEXT_TELEMETRY_DISABLED=1
RUN cd ui-react && npm run build

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

COPY --from=builder /app/ui-react/.next/standalone ./
COPY --from=builder /app/ui-react/.next/static ./.next/static
COPY --from=builder /app/ui-react/public ./public

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV BACKEND_URL=http://pokehub-api:3000
EXPOSE 3000

CMD ["node", "server.js"]
