## Why

The Next.js frontend was migrated from SvelteKit but retained SvelteKit-era environment variable names and port defaults. The existing k3s Helm chart — which is already deployed and working — expects `API_BASE_URL` on port 4000. Without alignment, the React image fails silently in k3s: it starts on the wrong port and reads an unset env var, returning 502s for all backend calls.

## What Changes

- Rename `BACKEND_URL` → `API_BASE_URL` in all 12 Next.js source files, `ui/Dockerfile`, and `docker-compose.yml`
- Change `ui/Dockerfile` default port from 3000 → 4000 (`ENV PORT=4000`, `EXPOSE 4000`)
- Update `ui/Dockerfile` default service URL from `http://pokehub-api:3000` → `http://api-svc:3000` (matches the k3s Service name)
- `docker-compose.yml` keeps URL value `http://api:3000` (compose service name) but renames the variable

## Capabilities

### New Capabilities

_(none — this is a configuration alignment, no new product capabilities)_

### Modified Capabilities

- `nextjs-routing`: env var used by Server Components and API route proxies changes from `BACKEND_URL` to `API_BASE_URL`
- `nextjs-auth-flow`: Server Actions read the renamed env var

## Impact

- **`ui/Dockerfile`**: 2-line change (PORT + env var name/value)
- **`docker-compose.yml`**: 1-line change (env var name for the ui service)
- **12 `ui/src/` files**: `process.env.BACKEND_URL` → `process.env.API_BASE_URL` (search-replace, no logic change)
- **Helm chart / CI / k3s secrets**: no changes — these are already correct
- **Local dev**: `docker compose up` continues to work unchanged after the rename; the URL value stays `http://api:3000`
