## 1. Container Images

- [ ] 1.1 Write `server/Dockerfile` — multi-stage build: `oven/bun:1-alpine` builder installs deps and compiles; runner copies `dist/` and starts with `bun run start`. Confirm `docker build -t pokehub-api ./server` succeeds.
  - *Verification*: `docker run --env-file server/.env pokehub-api` starts and `GET /health` returns 200.

- [ ] 1.2 Write `ui/Dockerfile` — multi-stage: Bun builder runs `bun run build`; runner uses `node:20-alpine` with `adapter-node` output. Confirm `docker build -t pokehub-ui ./ui` succeeds.
  - *Verification*: `docker run -e PORT=3000 -e ORIGIN=http://localhost:3000 pokehub-ui` starts and responds on port 3000.

- [ ] 1.3 Add `.dockerignore` files to `server/` and `ui/` excluding `node_modules`, `.env`, and test files.
  - *Verification*: Build context size is visibly reduced (no `node_modules` in the tar).

## 2. Helm Chart

- [ ] 2.1 Scaffold umbrella chart with `helm create charts/pokehub` and clean out the default templates. Set `Chart.yaml` metadata (name, version, appVersion).
  - *Verification*: `helm lint ./charts/pokehub` passes with zero errors.

- [ ] 2.2 Create API sub-chart (`charts/pokehub/charts/api/`) with Deployment, Service, and ConfigMap templates. Deployment references `pokehub-secrets` for `DATABASE_URL` and `JWT_SECRET`.
  - *Verification*: `helm template pokehub ./charts/pokehub | grep kind` lists Deployment and Service for the API.

- [ ] 2.3 Create UI sub-chart (`charts/pokehub/charts/ui/`) with Deployment and Service templates. UI connects to API via in-cluster Service DNS (`http://pokehub-api:3000`).
  - *Verification*: `helm template` lists Deployment and Service for the UI.

- [ ] 2.4 Add Bitnami PostgreSQL as a Helm dependency in `Chart.yaml`. Wire `postgresql.enabled` toggle and `externalDatabase.url` fallback in `values.yaml`.
  - *Verification*: `helm dependency update ./charts/pokehub` fetches the Bitnami chart; `helm template` with `postgresql.enabled=false` produces no PostgreSQL resources.

- [ ] 2.5 Create `charts/pokehub/templates/secrets.yaml` generating the `pokehub-secrets` Secret from `values.secrets.*`. Add `values.local.yaml.example` (gitignored in `.gitignore`) showing required fields.
  - *Verification*: `helm template --set secrets.databaseUrl=x --set secrets.jwtSecret=y ./charts/pokehub` renders a Secret with correct keys.

## 3. Traefik Ingress

- [ ] 3.1 Create `IngressRoute` template for the UI (`pokehub.local`) in the UI sub-chart or a top-level `templates/ingress.yaml`. Hostname configurable via `values.yaml` (`ingress.ui.host`).
  - *Verification*: `helm template` renders an IngressRoute with the correct Host match rule.

- [ ] 3.2 Create `IngressRoute` template for the API (`api.pokehub.local`). Include a Traefik middleware for WebSocket passthrough if required. Hostname configurable via `ingress.api.host`.
  - *Verification*: `helm template` renders an IngressRoute for the API with correct match rule.

## 4. Local Deployment Verification

- [ ] 4.1 Install chart on local k3s cluster: `helm install pokehub ./charts/pokehub -f values.local.yaml`. Confirm all pods reach Running state.
  - *Verification*: `kubectl get pods -n pokehub` shows all pods Running.

- [ ] 4.2 Add `/etc/hosts` entries for `pokehub.local` and `api.pokehub.local`. Confirm UI loads in browser and API `/health` returns 200 via the ingress hostnames.
  - *Verification*: `curl http://api.pokehub.local/health` returns `{"status":"ok"}`.

- [ ] 4.3 Write `docs/deployment.md` covering: prerequisites (k3s, Helm, Docker), build steps, `values.local.yaml` setup, install command, `/etc/hosts` setup, and teardown.
  - *Verification*: A developer following the doc from scratch can stand up the stack without asking questions.
