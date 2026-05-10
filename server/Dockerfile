# Build context: repo root
# docker build -f server/Dockerfile -t pokehub-api .

# ── Stage 1a: all dependencies (including dev) ────────────────────────────────
FROM oven/bun:1 AS deps-dev
WORKDIR /app/server
COPY server/package.json server/bun.lock ./
RUN bun install --frozen-lockfile

# ── Stage 1b: production dependencies only ────────────────────────────────────
FROM oven/bun:1 AS deps
WORKDIR /app/server
COPY server/package.json server/bun.lock ./
RUN bun install --frozen-lockfile --production

# ── Stage migrate ─────────────────────────────────────────────────────────────
FROM oven/bun:1 AS migrate
WORKDIR /app
COPY shared/ ./shared/
COPY server/src/           ./server/src/
COPY server/drizzle/       ./server/drizzle/
COPY server/drizzle.config.ts ./server/drizzle.config.ts
COPY server/tsconfig.json  ./server/tsconfig.json
COPY server/package.json   ./server/package.json
COPY --from=deps-dev /app/server/node_modules ./server/node_modules
WORKDIR /app/server
CMD ["bunx", "drizzle-kit", "migrate"]

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM oven/bun:1-slim AS runtime
WORKDIR /app

# Shared types (server imports these at runtime via $shared alias)
COPY shared/ ./shared/

# Server source, migrations, config
COPY server/src/           ./server/src/
COPY server/drizzle/       ./server/drizzle/
COPY server/drizzle.config.ts ./server/drizzle.config.ts
COPY server/tsconfig.json  ./server/tsconfig.json
COPY server/package.json   ./server/package.json

# Production node_modules from deps stage
COPY --from=deps /app/server/node_modules ./server/node_modules

WORKDIR /app/server

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["bun", "src/index.ts"]
