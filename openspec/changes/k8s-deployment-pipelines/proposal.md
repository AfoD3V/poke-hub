## Why

PokeHub currently runs as two ad-hoc processes (`bun run dev` for the API, Vite dev server for the UI). There is no repeatable deployment story: no container images, no resource declarations, no ingress routing. Moving to a k3s-based Kubernetes setup with Helm gives us production parity on a single-node cluster, deterministic rollouts, and a foundation for multi-environment promotion later.

## What Changes

- Dockerfiles for the `server/` (Bun API) and `ui/` (SvelteKit, served via `adapter-node`) services
- Helm umbrella chart (`charts/pokehub/`) with sub-charts for API, UI, and optional PostgreSQL (Bitnami)
- Traefik `IngressRoute` CRDs for `api.pokehub.local` and `pokehub.local`
- `.env`-to-Kubernetes-Secret mapping documented and automated via a helper script
- Local k3s cluster workflow documented in `docs/deployment.md`

## Capabilities

### New Capabilities
- `container-images`: Dockerfiles and multi-stage builds for API and UI services
- `helm-chart`: Umbrella Helm chart deploying all PokeHub workloads to k3s
- `traefik-ingress`: Traefik IngressRoute resources exposing UI and API on local domains

### Modified Capabilities

## Impact

- New top-level `charts/` directory (Helm umbrella chart)
- New `server/Dockerfile`, `ui/Dockerfile`
- New `docs/deployment.md` (setup + local workflow)
- No changes to application code or the database schema
- CI/CD pipeline (GitHub Actions) is out of scope for this change — covered separately
