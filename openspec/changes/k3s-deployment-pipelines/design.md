## Context

PokeHub is a Bun + Hono API and a SvelteKit (`adapter-node`) UI. Both services communicate over HTTP; the API connects to a PostgreSQL database. The target runtime is k3s (lightweight Kubernetes) on a single Linux node, with Traefik as the default ingress controller (bundled with k3s).

## Goals / Non-Goals

**Goals:**
- Reproducible container builds for both services via multi-stage Dockerfiles
- Helm chart that can be installed on any k3s cluster with `helm install pokehub ./charts/pokehub`
- Traefik IngressRoutes exposing `pokehub.local` (UI) and `api.pokehub.local` (API) locally
- Secrets (DATABASE_URL, JWT_SECRET) managed as Kubernetes Secrets, injected as env vars
- PostgreSQL dependency satisfied via Bitnami chart (optional; can point to external DB)

**Non-Goals:**
- GitHub Actions CI/CD pipeline (separate change)
- Production TLS certificates (Let's Encrypt / cert-manager)
- Horizontal pod autoscaling or multi-replica setup
- Helm chart publishing to a registry

## Decisions

### 1. Multi-stage Dockerfiles
Both services use multi-stage builds: a `builder` stage installs dependencies and compiles/bundles, and a `runner` stage copies only the production artefacts. This keeps final images lean.

- **API**: `oven/bun:1-alpine` for both stages. Builder runs `bun install --frozen-lockfile && bun build`. Runner copies `dist/` and starts with `bun run start`.
- **UI**: Builder uses `oven/bun:1-alpine` to run `bun run build`. Runner uses `node:20-alpine` + `@sveltejs/adapter-node` output (`build/`), started with `node build`.

**Why separate base images for UI runner?** `adapter-node` emits a standard Node.js server. Using a slim Node image avoids pulling Bun into the UI runtime layer.

### 2. Helm umbrella chart structure
```
charts/pokehub/
  Chart.yaml          # umbrella
  values.yaml         # default values for all sub-charts
  charts/
    api/              # API sub-chart
    ui/               # UI sub-chart
  templates/
    secrets.yaml      # shared Secret for DB creds + JWT
```

Bitnami PostgreSQL is added as a Helm dependency (not a sub-chart we maintain).

**Why umbrella chart over separate charts?** All three components (UI, API, DB) have shared values (namespace, image registry, secret refs). An umbrella chart keeps them versioned and deployed atomically.

### 3. Traefik IngressRoutes (CRD, not Ingress)
k3s ships Traefik with CRD support. We use `IngressRoute` (Traefik v2 CRD) instead of the standard `networking.k8s.io/Ingress` to gain middleware support (e.g. future BasicAuth, rate limiting) without annotation sprawl.

**Why not standard Ingress?** Traefik's CRDs are already available; standard Ingress requires an annotation per Traefik feature whereas CRDs are explicit and typed.

### 4. Secrets management
A Kubernetes `Secret` named `pokehub-secrets` is created by the `templates/secrets.yaml` template from Helm values. Developers provide real secrets via `--set` or a local `values.secret.yaml` (gitignored). A helper script `scripts/gen-k3s-secret.sh` converts the `.env` file to a `kubectl create secret` command for bootstrapping.

**Why Helm-managed secrets over external-secrets-operator?** Operator adds complexity not needed for a single-node dev/staging cluster. This can be upgraded to ESO later.

## Risks / Trade-offs

- **Image size** — Bun's `alpine` base is compact but Bun runtime is ~50 MB. Acceptable for a personal project. → No mitigation needed.
- **k3s-specific Traefik CRDs** — If the cluster is ever swapped for vanilla k8s + nginx-ingress, IngressRoutes must be rewritten. → Mitigation: document the CRD dependency in `docs/deployment.md`.
- **Bitnami PostgreSQL in chart** — For production the DB should be external (managed). Bitnami chart is fine for local dev. → The chart values expose `postgresql.enabled: true/false` with an `externalDatabase.url` fallback.

## Migration Plan

1. Write and test Dockerfiles locally (`docker build` + `docker run`)
2. Create `charts/pokehub/` skeleton with `helm create` then customise
3. Install on local k3s: `helm install pokehub ./charts/pokehub -f values.local.yaml`
4. Add `/etc/hosts` entries for `pokehub.local` and `api.pokehub.local`
5. Verify UI and API reachable; smoke test login + search + collection
6. Document full workflow in `docs/deployment.md`

## Open Questions

- Should the WebSocket (`/ws`) endpoint be exposed through the same Traefik IngressRoute as the API, or a dedicated route? (Traefik supports WS natively via the same route — recommend same route with `websocket: true` middleware.)
- Node version for UI runner: pin to `20` or use `lts`?
