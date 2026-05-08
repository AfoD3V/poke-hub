# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PokeHub is a premium personal Pokémon TCG collection manager. Dark mode is the default design (graphite/deep black/dark purple). Holographic card effects use custom CSS with JS-computed cursor-tracking variables — the `pokemon-cards-css` npm package was unpublished in 2022 and we built a replacement.

**Current phase:** Phase 1, Task 5 (Real-Time Event Architecture) is next.

## Commands

### Backend (`server/`)
```bash
bun run dev          # Start with hot reload (port defined by PORT in server/.env)
bun run db:generate  # Generate Drizzle migrations after schema changes
bun run db:migrate   # Apply migrations to PostgreSQL
bun run test         # Run Vitest (NOT `bun test` — see Gotchas below)
```

### Frontend (`ui/`)
```bash
bun run dev          # Vite dev server at http://localhost:5173
bun run build        # Production build
bun run check        # svelte-check type checking
bun run test         # Run Vitest in jsdom environment
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
- **`getByLabelText` ambiguity:** When a password input and its show/hide toggle share "password" in their labels, use `getByLabelText(/password/i, { selector: "input" })`.
- **Never work on local `main`:** Changes on `main` create untracked files that conflict on `git pull` after a PR merge. Always branch first: `git checkout -b feature/...`.
- **`tsconfig.json` `paths` overrides `$lib` alias:** Adding a `paths` block to `tsconfig.json` (which extends `.svelte-kit/tsconfig.json`) silently drops the auto-generated `$lib/*` aliases. Symptom: `Cannot find module '$lib/...'` in `svelte-check`. Fix: put custom aliases (e.g. `$shared/*`) in `svelte.config.js` `kit.alias`, not `tsconfig.json`.
- **Route groups `(name)` for layout isolation:** Use `(app)/` route group to share a sidebar shell layout across authenticated pages without affecting the URL. Auth routes stay outside the group and render without the sidebar. Run `svelte-kit sync` after any route restructure before type-checking.

## Agent Workflow

- **Role:** Senior Fullstack Engineer. Use that level of judgment.
- **Efficiency:** Prefer CLI tools (`gh`, `bun`, `git`, `playwright-cli`) over manual file reads when they accomplish the same result.
- **Verification:** Never assume success — confirm state changes with a follow-up command (`gh pr status`, a Playwright snapshot, `bun run test`).
- **Context first:** Run `gh issue list` and `gh pr status` before starting any task. Use `gh` CLI for all GitHub operations.
- **Playwright CLI:** `playwright-cli open <url>` → `playwright-cli snapshot`. Use Short IDs (e.g., `e12`) for all `click`/`type` actions. `playwright-cli screenshot` to verify holo card effects.
- **Self-diagnosis:** When a CLI command fails, read the error and check `--help`/`--verbose` before asking the user.

## Conventions

- All new API endpoints need positive and negative Vitest test scenarios.
- Maintain the Postman collection (`docs/postman/`) in parallel with API changes.
- Use `playwright-cli` for visual verification of any frontend changes before marking tasks complete.
- For changes touching 3+ files or a new DB schema, output a plan and wait for approval before implementing.
- Document new framework gotchas or project-specific quirks in `AGENTS.md` > Project Learnings before marking a task complete.

## Definition of Done

A task is complete only when:
1. Linting/type checks pass (`bun run check` in `ui/`; TypeScript clean in `server/`).
2. All tests pass (`bun run test` in both packages).
3. Frontend changes verified via `playwright-cli snapshot`/`screenshot` (no visual regressions).
4. New API endpoints have tests + Postman collection updated.
5. New gotchas documented in `AGENTS.md` > Project Learnings.
6. Changes pushed to a feature branch; PR created via `gh pr create`.

## Keeping CLAUDE.md and AGENTS.md in Sync

These two files are the primary sources of truth for AI agents working in this repo and **must always be consistent with each other**.

- **When updating `AGENTS.md`** (e.g. adding a Project Learning, changing a directive, updating current status): reflect the relevant change in `CLAUDE.md` as well — update the corresponding section or add a new entry.
- **When updating `CLAUDE.md`** (e.g. adding a gotcha, changing a command, updating the current phase): ensure `AGENTS.md` reflects the same information in the appropriate section.
- Both files must be updated in the **same commit**. A change to one file without the corresponding update to the other is incomplete.
- `AGENTS.md` is the canonical home for full detail (rationale, workflow steps, tooling config). `CLAUDE.md` contains the distilled, actionable version. When in doubt: full context goes in `AGENTS.md`; the practical summary goes in `CLAUDE.md`.
