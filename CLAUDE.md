# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PokeHub is a premium personal Pokémon TCG collection manager. Dark mode is the default design (graphite/deep black/dark purple). Holographic card effects use custom CSS with JS-computed cursor-tracking variables — the `pokemon-cards-css` npm package was unpublished in 2022 and we built a replacement.

**Current phase:** Phase 1, Task 5 (Real-Time Event Architecture) is next.

## Commands

### Local Development (Docker Compose — primary)
```bash
docker compose up -d --build   # Build images and start all services
docker compose logs -f         # Tail logs for all services
docker compose logs migrate    # Check migration output
docker compose down            # Stop all services
```

Services when running:
- UI:    http://localhost:4000
- API:   http://localhost:3000
- DB:    localhost:5432 (exposed for local tooling)
- Redis: localhost:6379

Migrations run automatically via the `migrate` service on every `docker compose up`. After a schema change, run `bun run db:generate` in `server/` to create the migration file, then `docker compose up -d --build` to apply it.

### Root (monorepo-wide)
```bash
bun run lint         # ESLint across server/, ui/, and shared/
bun run lint:fix     # ESLint with --fix
```

### Backend (`server/`) — for tests and codegen only; runtime is Docker
```bash
bun run db:generate  # Generate Drizzle migrations after schema changes
bun run test         # Run Vitest (NOT `bun test` — see Gotchas below)
bun run lint         # ESLint for server/src
```

### Frontend (`ui/`) — for tests and type-checking only; runtime is Docker
```bash
bun run check        # svelte-check type checking
bun run test         # Run Vitest in jsdom environment
bun run lint         # ESLint for ui/src (TypeScript + Svelte)
```

## Architecture

This is a monorepo with three packages:

- **`server/`** — Bun + Hono API. Route handlers are thin; business logic lives in `server/src/services/`. Routes: `/auth/*`, `/api/cards/*`, `/health`.
- **`ui/`** — SvelteKit frontend. Uses SSR form actions for auth (not client-side fetch). Communicates only with the Hono backend — never directly with external APIs.
- **`shared/`** — TypeScript types crossing the client/server boundary (`shared/auth.ts`, `shared/tcg.ts`). No `any` types allowed; use `unknown` with type guards.

### Auth Flow
JWT (HS256, 7-day, HttpOnly + SameSite=Strict cookie). SvelteKit SSR form actions receive `Set-Cookie` from Hono, extract the JWT string, then call `cookies.set()` — simply forwarding the raw header does not work (SvelteKit sanitizes it). SSR `load()` functions must forward cookies to the backend via `Cookie:` header for session validation.

### Database
PostgreSQL + Drizzle ORM. Schema is in `server/src/db/schema.ts`. Never modify applied migration files — create a new migration instead. Raw SQL is forbidden; all DB access goes through Drizzle.

### Holographic Card Effect
Three-layer system in `ui/src/lib/components/Card.svelte`:
1. Svelte `spring()` stores for `rotate`, `glare`, `background` — gives physical bounce feel
2. JS computes CSS variables with correct units every frame (`--rotate-x`, `--rotate-y`, `--pointer-x/y`, `--pointer-from-center/top/left`, `--background-x/y`, `--card-opacity`) — CSS `calc()` cannot multiply `%` by `deg`
3. Two overlay divs: `.card__shine` (`mix-blend-mode: color-dodge`) + `.card__glare` (`mix-blend-mode: overlay`) — rarity via `data-rarity` attribute selectors

## Key Gotchas

- **`bun test` vs `bun run test`:** `bun test` invokes Bun's native runner and skips Vitest + jsdom config. Always use `bun run test`.
- **`$app/*` mocks required:** SvelteKit's `$app/forms`, `$app/stores`, `$app/navigation`, `$app/environment` don't exist in jsdom. Mock them in `ui/src/tests/setup.ts` with `vi.mock()`.
- **3D flip + `overflow: hidden`:** `overflow: hidden` on a `.face` element creates a stacking context that breaks `backface-visibility: hidden`. Move it to a nested `.face-inner` wrapper. Similarly, `filter` on a `transform-style: preserve-3d` element flattens 3D space — move the filter to an outer wrapper.
- **`overflow: hidden` on any ancestor of a tilt causes "invisible frame" clipping:** Even when `overflow: hidden` is on a non-face wrapper (e.g. `.face-inner`), tilting the card via `card__rotator` extends the projected card outside that ancestor's 2D bounds — the card is clipped as if by an invisible box. Fix: remove `overflow: hidden` from `.face-inner` entirely; the flip is controlled by `backface-visibility` on `.face`, not by overflow. Move rounded-corner clipping to `border-radius` directly on `<img>` (images are clipped by their own `border-radius` without an overflow parent).
- **`getByLabelText` ambiguity:** When a password input and its show/hide toggle share "password" in their labels, use `getByLabelText(/password/i, { selector: "input" })`.
- **Never work on local `main`:** Changes on `main` create untracked files that conflict on `git pull` after a PR merge. Always branch first: `git checkout -b feature/...`.
- **Always branch from an up-to-date `main`:** Before creating any branch, run `git checkout main && git fetch origin && git pull origin main` to ensure local `main` is fully in sync with remote.
- **Return to `main` after PR:** Once a PR is created, immediately run `git checkout main` so the next task starts from a clean base.
- **`tsconfig.json` `paths` overrides `$lib` alias:** Adding a `paths` block to `tsconfig.json` (which extends `.svelte-kit/tsconfig.json`) silently drops the auto-generated `$lib/*` aliases. Symptom: `Cannot find module '$lib/...'` in `svelte-check`. Fix: put custom aliases (e.g. `$shared/*`) in `svelte.config.js` `kit.alias`, not `tsconfig.json`.
- **Route groups `(name)` for layout isolation:** Use `(app)/` route group to share a sidebar shell layout across authenticated pages without affecting the URL. Auth routes stay outside the group and render without the sidebar. Run `svelte-kit sync` after any route restructure before type-checking.
- **`playwright-cli open` resets the browser session:** Each `playwright-cli open <url>` creates a new context and discards all cookies (including auth). To visit authenticated pages during verification, navigate within the same session using `playwright-cli click <ref>` on sidebar links — do not call `open` again.
- **Vite dev server auto-increments port:** If 5173 is in use, Vite picks 5174, 5175, etc. Always read the `Local:` line from `bun run dev` output before running `playwright-cli open` or browser assertions.
- **Docker migrations use a separate `migrate` service:** `drizzle-kit` is a dev dependency and is not present in the production `api` image. A dedicated `migrate` stage in `server/Dockerfile` installs all deps (including dev) and runs `drizzle-kit migrate`. It starts before `api`, runs once, and exits. Check its output with `docker compose logs migrate`. Never try to run `db:migrate` inside the `api` container.
- **Docker Compose credentials vs `server/.env`:** The root `.env` defines actual Postgres credentials used by all containers (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `DATABASE_URL` with `@db:5432`). `server/.env` is only used for local `bun run` commands and must use `@localhost:5432` with the same credentials. Keep them in sync.
- **TCGdex GraphQL nulls entire list items, not just fields:** When a non-nullable field (e.g. `AttacksListItem.name`) is null, TCGdex returns the whole list item as `null` (e.g. `attacks[i] === null`). The response also includes a top-level `errors` array alongside valid `data.cards`. Do not treat the `errors` array as fatal — only fail if `data.cards` is absent. Filter with `a !== null && a.name !== null`.
- **SvelteKit adapter-node has no dev proxy — use `+server.ts` for client API calls:** Vite dev server proxies `/api/*` to Hono; adapter-node does not. Any client-side `fetch('/api/...')` that needs to reach Hono in Docker must have a corresponding `ui/src/routes/api/.../+server.ts` proxy endpoint that forwards the request (including the `cookie` header) to `API_BASE_URL`. Return `new Response(upstreamBody, { status })` and catch fetch errors with JSON 502.
- **Svelte 4 template `as Type` cast causes parse error:** TypeScript type assertions inside Svelte 4 template event handlers (e.g. `on:error={(e) => { (e.currentTarget as HTMLImageElement)... }}`) cause "Unexpected token" from svelte-check. Extract to a typed function in `<script>` instead.
- **`SvelteMap` is Svelte 5 only:** The `@sveltejs/mcp` autofixer may suggest replacing `Map` with `SvelteMap`. Ignore this in Svelte 4 projects.

## Required Skills

Invoke these skills automatically — do not wait to be asked:

- **Frontend work** (any `.svelte`, `.svelte.ts`, `.svelte.js`, or `ui/` file): invoke `svelte-code-writer`, `svelte-core-bestpractices`, and `ui-ux-pro-max` before writing or editing code.
- **Backend work** (any `server/` file or Hono route/middleware): invoke `hono` before writing or editing code.
- **Browser debugging, visual verification, or end-to-end testing**: invoke `playwright-cli` skill. Use it to confirm pages render correctly, debug unexpected UI behaviour via snapshots, and verify full flows (e.g. login → search → result) before marking tasks done.
- **OpenSpec task completion** (final step before opening a PR): invoke `security-secure-coding` and resolve all findings before merging to `main`.

## Agent Workflow

- **Role:** Senior Fullstack Engineer. Use that level of judgment.
- **Efficiency:** Prefer CLI tools (`gh`, `bun`, `git`, `playwright-cli`) over manual file reads when they accomplish the same result.
- **Verification:** Never assume success — confirm state changes with a follow-up command (`gh pr status`, a Playwright snapshot, `bun run test`).
- **Context first:** Run `gh issue list` and `gh pr status` before starting any task. Use `gh` CLI for all GitHub operations.
- **Playwright CLI:** `playwright-cli open <url>` → `playwright-cli snapshot`. Use Short IDs (e.g., `e12`) for all `click`/`type` actions. `playwright-cli screenshot` to verify holo card effects.
- **Self-diagnosis:** When a CLI command fails, read the error and check `--help`/`--verbose` before asking the user.

## Development Approach: Test-Driven Development (TDD)

**All new development MUST follow the TDD cycle — no exceptions.**

1. **Write failing tests first.** Before writing any implementation code, write the tests that define the expected behavior. Run them and confirm they fail (red).
2. **Implement until tests pass.** Write the minimum code needed to make the tests pass (green).
3. **Verify.** Run `bun run test` and confirm all tests pass. Passing tests are the definition of done for each task.

**In every OpenSpec `tasks.md`, writing failing tests MUST be the first task group (e.g. `## 1. Tests`).** No implementation task may appear before the test-writing task group. This applies to all changes — backend, frontend, shared types, and integration.

## Conventions

- **API testing — non-negotiable:** Any time an API endpoint is added or modified, BOTH are required: (1) Vitest unit tests (positive + negative) in `server/src/routes/<name>.test.ts`, and (2) the corresponding request added/updated in the Postman collection (`docs/postman/`) with status and shape assertions. Neither replaces the other.
- **TDD cycle:** Write failing tests first (red) → implement minimum code to pass (green) → confirm with `bun run test`. The test task group must appear first in every `tasks.md`.
- Use `playwright-cli` skill for visual verification and debugging of any frontend change before marking tasks complete.
- For changes touching 3+ files or a new DB schema, output a plan and wait for approval before implementing.
- Document new framework gotchas or project-specific quirks in `AGENTS.md` > Project Learnings before marking a task complete.

## Definition of Done

A task is complete only when:
1. ESLint passes (`bun run lint` from repo root — zero errors).
2. Type checks pass (`bun run check` in `ui/`; TypeScript clean in `server/`).
3. All tests pass (`bun run test` in both packages).
4. Frontend changes verified via `playwright-cli snapshot`/`screenshot` (no visual regressions).
5. New API endpoints have tests + Postman collection updated.
6. New gotchas documented in `AGENTS.md` > Project Learnings.
7. Security check via `security-secure-coding` skill — all findings resolved.
8. Changes pushed to a feature branch; PR created via `gh pr create`.

## Keeping CLAUDE.md and AGENTS.md in Sync

These two files are the primary sources of truth for AI agents working in this repo and **must always be consistent with each other**.

- **When updating `AGENTS.md`** (e.g. adding a Project Learning, changing a directive, updating current status): reflect the relevant change in `CLAUDE.md` as well — update the corresponding section or add a new entry.
- **When updating `CLAUDE.md`** (e.g. adding a gotcha, changing a command, updating the current phase): ensure `AGENTS.md` reflects the same information in the appropriate section.
- Both files must be updated in the **same commit**. A change to one file without the corresponding update to the other is incomplete.
- `AGENTS.md` is the canonical home for full detail (rationale, workflow steps, tooling config). `CLAUDE.md` contains the distilled, actionable version. When in doubt: full context goes in `AGENTS.md`; the practical summary goes in `CLAUDE.md`.
