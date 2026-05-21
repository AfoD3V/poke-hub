## ADDED Requirements

### Requirement: Tooling config references only active directories
The repo configuration files (`.gitignore`, `eslint.config.mjs`) SHALL NOT reference directories or build artefacts that no longer exist in the repository.

#### Scenario: No stale ignores
- **WHEN** a developer reads `.gitignore` or `eslint.config.mjs`
- **THEN** every path reference points to a directory or pattern that exists or could reasonably exist in the current project

### Requirement: README reflects the actual development workflow
The `README.md` SHALL describe the Docker Compose quick-start as the primary local development workflow, reference the correct service ports, and list the actual tech stack.

#### Scenario: Quick-start is accurate
- **WHEN** a developer follows the README quick-start from a clean checkout
- **THEN** `docker compose up -d --build` starts all services and the UI is reachable at `localhost:4000`

#### Scenario: Tech stack is accurate
- **WHEN** a developer reads the Tech Stack section of README.md
- **THEN** the frontend entry lists Next.js 14 App Router (not SvelteKit)

### Requirement: Active OpenSpec specs describe the implemented technology
Spec files in `openspec/specs/` that were written during or before the SvelteKit era SHALL be updated so implementation notes describe the React/Next.js code that was actually shipped.

#### Scenario: No misleading Svelte patterns in active specs
- **WHEN** an agent reads any spec file under `openspec/specs/`
- **THEN** implementation examples and code patterns reflect the current React/Next.js codebase, not the removed SvelteKit frontend

### Requirement: Root lockfile matches the package manager in use
The repository root SHALL contain only the lockfile(s) for the package manager(s) actually used (`bun.lock`). Stale lockfiles from other package managers SHALL be removed.

#### Scenario: Single authoritative lockfile
- **WHEN** a developer runs `bun install` at the repo root
- **THEN** only `bun.lock` is updated; no `package-lock.json` or `yarn.lock` is present at the root
