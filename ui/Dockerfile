# Build context: repo root
# docker build -f ui/Dockerfile -t pokehub-ui .

# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps (UI uses npm)
COPY ui/package.json ui/package-lock.json ./ui/
RUN cd ui && npm ci

# Shared types (aliased as $shared in the UI)
COPY shared/ ./shared/

# UI source
COPY ui/ ./ui/

# adapter-node outputs a standalone Node server to ui/build/
RUN cd ui && npm run build

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

COPY --from=builder /app/ui/build ./build
COPY --from=builder /app/ui/package.json ./package.json
COPY --from=builder /app/ui/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=3000
ENV BACKEND_URL=http://pokehub-api:3000
EXPOSE 3000

CMD ["node", "build/index.js"]
