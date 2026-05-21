## Why

The `svelte-cleanup` change removed the `ui-svelte/` directory and its deps, but left behind shallow Svelte references in tooling config (`.gitignore`, `eslint.config.mjs`), a stale root `package-lock.json` that still enumerates the removed Svelte packages, an outdated `README.md` that still describes SvelteKit as the frontend, and active OpenSpec specs that reference Svelte component patterns that have been superseded by the React/Next.js implementations. These leftovers cause confusion for agents and developers orienting themselves in the repo.

## What Changes

- **DELETE** root `package-lock.json` — this file is stale (repo uses `bun`/`bun.lock` for dependency management; the npm lockfile has never been used for installs and still lists the now-removed Svelte devDeps)
- **UPDATE** `.gitignore` — remove `.svelte-kit/` entry (build artefact of a SvelteKit project that no longer exists)
- **UPDATE** `eslint.config.mjs` — remove `'ui-svelte/**'` from the global ignores block (directory deleted)
- **UPDATE** `README.md` — replace SvelteKit quick-start with Docker Compose quick-start; update tech stack to Next.js 14 App Router; fix dev URL from `localhost:5173` to `localhost:4000`; update status line
- **UPDATE** `CLAUDE.md` — fix remaining `monorepo with three packages` heading (says three but `ui-svelte/` bullet was removed, count is now correct but context says "three" — verify); audit for any remaining Svelte phrases
- **UPDATE** active `openspec/specs/` files that contain Svelte-specific implementation notes — update to reflect the React/Next.js implementations actually shipped. Affected specs: `hover-tilt`, `card-holo-effects`, `react-spring-hook`, `react-component-library`, `nextjs-routing`, `collection-add-proxy`, `chase-cards`, `k3s-deployment`
- **UPDATE** `docs/tech-stack.md` and `docs/k3s-deployment-guide.md` — replace SvelteKit references with Next.js 14 App Router

Archive directories (`openspec/changes/archive/`) are **immutable historical records** and must NOT be modified.

## Capabilities

### New Capabilities

- None — this change modifies no application behaviour.

### Modified Capabilities

- `hover-tilt`: spec describes Svelte component patterns; update to document the React `HoverTilt` implementation
- `card-holo-effects`: spec references Svelte spring stores; update to document the `useSpring` hook approach
- `react-spring-hook`: already React-focused but may reference Svelte spring as prior art without labelling it clearly
- `nextjs-routing`: likely already accurate; audit and update if Svelte route patterns appear
- `k3s-deployment`: may reference `ui-svelte/` image name or SvelteKit build step

## Impact

- `package-lock.json` (root): deleted
- `.gitignore`: 1 line removed
- `eslint.config.mjs`: 1 line removed
- `README.md`: Quick start, tech stack, and status sections rewritten
- `CLAUDE.md`: minor audit/fixes if any phrases remain
- `openspec/specs/` (8 spec files): Svelte implementation notes updated to React equivalents
- `docs/tech-stack.md`, `docs/k3s-deployment-guide.md`: SvelteKit → Next.js references corrected
- No changes to `server/`, `ui/`, `shared/`, Docker Compose, or any running service
