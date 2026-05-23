## ADDED Requirements

### Requirement: Next.js project bootstrapped in ui-react/
A Next.js 14 App Router project SHALL exist at `ui-react/` in the monorepo root. It SHALL use TypeScript strict mode, CSS Modules (no Tailwind), and the `$shared/*` path alias pointing to `../shared/*`.

#### Scenario: TypeScript check passes
- **WHEN** `tsc --noEmit` is run in `ui-react/`
- **THEN** zero type errors are reported

#### Scenario: $shared alias resolves
- **WHEN** a file in `ui-react/` imports from `$shared/tcg`
- **THEN** the import resolves to `shared/tcg.ts` and `tsc` does not report a module-not-found error

### Requirement: ui-react runs in Docker Compose on port 4001
A `ui-react` service SHALL be added to `docker-compose.yml` that builds `ui-react/Dockerfile` and exposes port 4001. The existing `ui` service on port 4000 SHALL remain unchanged during the parallel development phase.

#### Scenario: ui-react service starts
- **WHEN** `docker compose up ui-react` is run
- **THEN** the Next.js app is accessible at `http://localhost:4001` without errors

#### Scenario: ui-react shares api and db services
- **WHEN** the ui-react container makes a request to `http://api:3000`
- **THEN** the request reaches the Hono backend (same network as existing ui service)

### Requirement: ui-react Dockerfile produces a runnable Node image
`ui-react/Dockerfile` SHALL use a two-stage build: stage 1 compiles the Next.js app with `next build`; stage 2 copies the standalone output and runs `node server.js`. The final image SHALL NOT contain dev dependencies.

#### Scenario: Docker image builds
- **WHEN** `docker build -f ui-react/Dockerfile .` is run from repo root
- **THEN** the build completes without error and produces an image

#### Scenario: Container starts and serves requests
- **WHEN** the built image is run with `PORT=3000`
- **THEN** `GET /` returns HTTP 200 or a redirect (not an error)

### Requirement: ESLint and TypeScript configs mirror ui/ conventions
`ui-react/` SHALL have an ESLint config that enforces the same rules as `ui/` (no `any`, React hooks rules, import ordering). `tsconfig.json` SHALL extend Next.js defaults and add the `$shared` path.

#### Scenario: ESLint passes on empty project
- **WHEN** `eslint .` is run in `ui-react/` on the bootstrapped project
- **THEN** zero errors are reported
