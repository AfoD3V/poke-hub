## ADDED Requirements

### Requirement: Next.js project bootstrapped in ui/
A Next.js 14 App Router project SHALL exist at `ui/` in the monorepo root. It SHALL use TypeScript strict mode, CSS Modules (no Tailwind), and the `$shared/*` path alias pointing to `../shared/*`.

#### Scenario: TypeScript check passes
- **WHEN** `tsc --noEmit` is run in `ui/`
- **THEN** zero type errors are reported

#### Scenario: $shared alias resolves
- **WHEN** a file in `ui/` imports from `$shared/tcg`
- **THEN** the import resolves to `shared/tcg.ts` and `tsc` does not report a module-not-found error

### Requirement: ui runs in Docker Compose on port 4000
A `ui` service SHALL be defined in `docker-compose.yml` that builds `ui/Dockerfile` and exposes port 4000.

#### Scenario: ui service starts
- **WHEN** `docker compose up ui` is run
- **THEN** the Next.js app is accessible at `http://localhost:4000` without errors

#### Scenario: ui shares api and db services
- **WHEN** the ui container makes a request to `http://api:3000`
- **THEN** the request reaches the Hono backend (same network)

### Requirement: ui Dockerfile produces a runnable Node image
`ui/Dockerfile` SHALL use a two-stage build: stage 1 compiles the Next.js app with `next build`; stage 2 copies the standalone output and runs `node server.js`. The final image SHALL NOT contain dev dependencies.

#### Scenario: Docker image builds
- **WHEN** `docker build -f ui/Dockerfile .` is run from repo root
- **THEN** the build completes without error and produces an image

#### Scenario: Container starts and serves requests
- **WHEN** the built image is run with `PORT=3000`
- **THEN** `GET /` returns HTTP 200 or a redirect (not an error)

### Requirement: ESLint and TypeScript configs enforce project conventions
`ui/` SHALL have an ESLint config that enforces no `any`, React hooks rules, and import ordering. `tsconfig.json` SHALL extend Next.js defaults and add the `$shared` path.

#### Scenario: ESLint passes on the project
- **WHEN** `eslint .` is run in `ui/`
- **THEN** zero errors are reported
