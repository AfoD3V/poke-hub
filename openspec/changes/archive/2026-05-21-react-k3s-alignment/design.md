## Context

The k3s Helm chart (`helm/templates/ui-deployment.yaml`) has always injected `API_BASE_URL` and `PORT: 4000` into the UI container. These values were correct for the SvelteKit frontend. During the React migration the Dockerfile and source code adopted `BACKEND_URL` and port 3000, creating a mismatch. The Helm chart is the authoritative contract — all other files must align to it.

Affected files are purely configuration and pass-through: no business logic is tied to the variable name.

## Goals / Non-Goals

**Goals:**
- UI container listens on port 4000 in all environments (k3s, Docker Compose, standalone)
- `API_BASE_URL` is the single env var name used everywhere for the backend service URL
- Local Docker Compose dev workflow is unaffected

**Non-Goals:**
- No changes to Helm chart, CI workflow, or k3s Secrets
- No changes to API routing logic, middleware, or auth flow
- No refactoring of `apiProxy.ts` or Server Action logic beyond the variable rename

## Decisions

### Decision 1: Rename in source, not in Helm

**Choice:** Rename `BACKEND_URL` → `API_BASE_URL` in `ui/src/` rather than add `BACKEND_URL` to the Helm chart.

**Rationale:** The Helm chart is deployed to production. Adding a second env var as an alias creates permanent drift and two names for the same concept. Renaming in source is a one-time search-replace with no behavioural change.

**Alternatives considered:** Alias in `next.config.ts` (`env: { BACKEND_URL: process.env.API_BASE_URL }`) — rejected because it adds indirection and still leaves the Dockerfile using the wrong default.

### Decision 2: Port 4000 in Dockerfile default, not just via env override

**Choice:** Set `ENV PORT=4000` and `EXPOSE 4000` in the Dockerfile.

**Rationale:** The Helm chart passes `PORT: 4000` at runtime, which already overrides the Dockerfile default. Aligning the default prevents confusion if the image is ever run without the Helm override (e.g., manual `docker run`). `EXPOSE` is documentation — it should match the actual port.

### Decision 3: docker-compose.yml keeps `http://api:3000` as the URL value

**Choice:** In `docker-compose.yml` rename the variable to `API_BASE_URL` but keep the value `http://api:3000` (the Compose service name).

**Rationale:** The Compose network uses service name `api`; the k3s network uses `api-svc`. These are correct per-environment and must stay different. Only the variable *name* is being unified.

## Risks / Trade-offs

- **Risk:** A file is missed during the rename → API calls return 502 in k3s.
  **Mitigation:** Grep-verify zero `BACKEND_URL` occurrences remain in `ui/src/` and `ui/Dockerfile` before closing the PR. Type-check (`npm run check`) will not catch this since `process.env` values are untyped strings.

- **Risk:** Docker Compose breaks if the env var rename is applied to only some files.
  **Mitigation:** Run `docker compose up -d --build` and smoke-test login → home after the change.

## Migration Plan

1. Search-replace `BACKEND_URL` → `API_BASE_URL` in all 12 `ui/src/` files.
2. Update `ui/Dockerfile`: rename env var, update default URL, change port to 4000.
3. Update `docker-compose.yml`: rename env var for the `ui` service only.
4. Run `bun run test` and `npm run check` in `ui/`.
5. Run `docker compose up -d --build`; smoke-test; confirm port 4000 serves the app.
6. `helm lint helm/` — should pass unchanged.
7. Open PR; merge to main; CI builds and pushes the corrected image.

**Rollback:** Revert the PR. The Helm chart is unchanged so the previous image tag continues to work.

## Open Questions

_(none — scope is fully defined)_
