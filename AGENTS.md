# PokeHub - AI Agent Instructions

## Current State

Update this section as the project progresses.

- Completed: Phase 1, Task 1 - Core Infrastructure and Database Scaffold
- Completed: Phase 1, Task 2 - Security and Authentication System
- Completed: Phase 1, Task 3 - TCG API Proxy & Holographic Search UI
- Completed: Phase 1, Task 4 - Core Collection Management
- Next up: Phase 1, Task 5 - Real-Time Event Architecture

---

## Project Overview

PokeHub is a premium personal collection manager for Pokemon TCG enthusiasts. It
allows users to track their Pokedex progress, manage multi-language card
collections (JP, EN, CN), and eventually track market values and optimal buying
strategies.

Design philosophy: the app must look modern and premium. Dark mode is default
(graphite/deep black/dark purple). Holographic card effects are implemented
with custom CSS via `--mx`/`--my` cursor-tracking custom properties inspired
by `pokemon-cards-css` (the npm package itself was unpublished; we built a
replacement effect that uses radial gradients and SVG noise overlays).

---

## Tech Stack

| Layer      | Technology                          |
| ---        | ---                                 |
| Frontend   | SvelteKit + Tailwind CSS            |
| Card UI    | Custom holographic CSS (inspired by pokemon-cards-css) |
| Backend    | Bun + Hono (TypeScript)             |
| Database   | PostgreSQL                          |
| ORM        | Drizzle ORM                         |
| Real-time  | Postgres LISTEN/NOTIFY + WebSockets |
| Deployment | k3s + Helm Charts + Traefik Ingress |

---

## Project Structure

Keep this section updated as the project grows. Add new top-level directories,
significant subfolders, and any structural changes.

```text
poke-hub/
|-- AGENTS.md
|-- README.md
|-- docs/
|-- openspec/
|-- shared/
|-- ui/
`-- resources/
```

---

## Agent Identity and Efficiency

- **Role:** Senior Fullstack Engineer. Approach tasks with that level of judgment and ownership.
- **Efficiency:** Prefer CLI tools (`gh`, `bun`, `git`, `playwright-cli`) over manual file reads where they accomplish the same result with less token overhead.
- **Verification:** Never assume a command succeeded. Always confirm state changes with a follow-up check (e.g., `gh pr status`, a Playwright snapshot, `bun run test`).
- **Self-diagnosis:** When a CLI command fails, read the error and check `--help` or `--verbose` before asking the human for help.

---

## Agent Core Directives

### Specification Workflow and Documentation

- Always use OpenSpec. When a new feature or significant change is requested,
  use `openspec-propose` to generate a structured specification before
  implementing.
- Rely on configs. `openspec/config.yaml` is the source of truth for project
  context, UI conventions, and architectural rules.
- Maintain documentation. All technical documents and architecture overviews
  live in `docs/`. Update it when significant architectural decisions are made.
- Keep README current. Reflect all changes in `README.md` and keep it up to
  date.

### Git and Version Control Workflow

- Feature branches only. Never commit directly to `main` or `master`.
- Branch naming. Use the `feature/task_name` format (for example,
  `feature/core-infrastructure`).
- Commits. Write clear and meaningful commit messages before merging the branch.
- Reference code in `resources/`. Read-only, local reference, always gitignored,
  never committed.
- **Context first:** Before beginning any task, run `gh issue list` and `gh pr status` to orient yourself. Use `gh` CLI as the primary tool for all GitHub operations; fall back to raw `git` only when `gh` has no equivalent.

### Security First Principle

- Zero trust. All backend routes (except explicit public ones like `/auth/login`)
  must be protected by authentication middleware.
- Hide secrets. External API keys must never touch the frontend. The SvelteKit
  client only communicates with the Hono backend, which acts as a secure proxy.
- Safe queries. All database interactions must go through Drizzle ORM. Raw SQL
  is forbidden.
- Environment variables. Never commit `.env` files. Keep `.env.example` updated.

### Test-Driven Mentality

- No tests, no merge. Every new feature must include tests.
- Backend tests. Use Vitest for unit testing services and testing Hono API routes.
- Frontend tests. Use Vitest + Svelte Testing Library for component rendering and state verification.
- UI states. Always handle loading and error states in the UI.
- Task verification steps must be actionable. For tasks broken into steps (e.g., 1.1, 1.2, 1.3), each step's verification MUST be executable either manually or with tests at that stage.
- Always run tests after developing or changing code; all tests must pass before marking any task complete.
- All API endpoints must include positive and negative test scenarios.
- Maintain a Postman collection in parallel for all API testing; whenever adding new tests, update the collection with high-quality requests and appropriate test scripts.

### Communication and Implementation

- Plan first. Output a concrete plan before touching 3+ files or creating a new
  DB schema, and wait for human approval.
- When implementing tests, run them first and confirm they pass before asking
  the human to run tests locally.
- Shared types. Any data crossing the client/server boundary must be typed in
  `shared/`. No `any` types allowed.
- UI design. Do not invent UI styles. Use Tailwind CSS and follow the dark mode
  design guidelines.
- Use `playwright-cli` for browser-based debugging, developing, and testing when needed.

### Keeping AGENTS.md and CLAUDE.md in Sync

`AGENTS.md` and `CLAUDE.md` are the two primary sources of truth for AI agents in this repo and **must always be consistent with each other**.

- **When updating `AGENTS.md`** (e.g. adding a Project Learning, changing a directive, updating current status): reflect the relevant change in `CLAUDE.md` as well — update the corresponding section or add a new entry.
- **When updating `CLAUDE.md`** (e.g. adding a gotcha, changing a command, updating the current phase): ensure `AGENTS.md` reflects the same information in the appropriate section.
- Both files must be updated in the **same commit**. A change to one file without the corresponding update to the other is incomplete.
- `AGENTS.md` is the canonical home for full detail (rationale, workflow steps, tooling config). `CLAUDE.md` contains the distilled, actionable version. When in doubt: full context goes in `AGENTS.md`; the practical summary goes in `CLAUDE.md`.

---

### Keeping AGENTS.md and CLAUDE.md in Sync

`AGENTS.md` and `CLAUDE.md` are the two primary sources of truth for AI agents in this repo and **must always be consistent with each other**.

- **When updating `AGENTS.md`** (e.g. adding a Project Learning, changing a directive, updating current status): reflect the relevant change in `CLAUDE.md` as well — update the corresponding section or add a new entry.
- **When updating `CLAUDE.md`** (e.g. adding a gotcha, changing a command, updating the current phase): ensure `AGENTS.md` reflects the same information in the appropriate section.
- Both files must be updated in the **same commit**. A change to one file without the corresponding update to the other is incomplete.
- `AGENTS.md` is the canonical home for full detail (rationale, workflow steps, MCP config). `CLAUDE.md` contains the distilled, actionable version. When in doubt: full context goes in `AGENTS.md`; the practical summary goes in `CLAUDE.md`.

---

### Learning & Knowledge Capture

**Critical directive:** This is not optional advice — it is a mandatory
workflow step.

- **When to write:** Every time you discover a caveat, fix a bug, resolve a
  tooling conflict, or uncover a project-specific quirk that is not common
  knowledge, you **must** add it to the `Project Learnings` section below
  **before** marking the task complete.
- **What to write:** The root cause, the symptom, and the fix or workaround.
  Be specific enough that a future agent (or yourself) can avoid the trap.
- **When too late:** If you are about to finish a task and realize you have not
  yet documented a new learning, stop, document it, commit the change, then
  proceed.
- **Examples of learnings that must be captured:** Framework gotchas, mock
  requirements, build-tool edge cases, environment mismatches, CI-specific
  behaviors, dependency incompatibilities, anything that cost you >10 minutes
  to figure out.

---

## Tooling Configuration

### GitHub (`gh` CLI)

Use `gh` as the primary tool for all GitHub operations. Fall back to raw `git` only when `gh` has no equivalent.

- **Orient first:** Run `gh issue list` and `gh pr status` before beginning any task.
- **Branch:** `git checkout -b feature/task_name` before writing any code. Never commit to `main`.
- **Commits:** Commit incrementally with meaningful messages — not "update", "fix", or "wip". Never commit `.env` files, secrets, or the `resources/` directory.
- **PR:** `gh pr create --title "..." --body "..."` once the feature is complete and all tests pass. Requires human approval — stop and present a full PR summary before opening.

### Git Workflow — CLI Rules

Follow this sequence without deviation:

1. **Create the branch first** — `git checkout -b feature/task_name` before writing any code. Never push to `main` or `master`.
2. **Commit incrementally** as you complete logical units of work. Messages must be meaningful and descriptive.
3. **Open a PR only after** the feature is complete and all tests pass. Present PR title, target branch, and a summary of changes to the human before running `gh pr create`.

---

### Playwright (`playwright-cli`)

Use `playwright-cli` for all browser interactions and visual verification. It is not a substitute for writing proper tests.

**Snapshot protocol:**
1. Ensure the local dev server is running (`bun run dev` in `ui/`).
2. `playwright-cli open <url>` to open the target page.
3. `playwright-cli snapshot` to retrieve the UI accessibility tree.
4. **Always use Short IDs** (e.g., `e12`) for `click` and `type` actions — do not construct long CSS or XPath selectors unless no Short ID is available.
5. For holographic card effects, use `playwright-cli screenshot` and compare visually for regressions.

**When to use:**
- **Before starting frontend development**: establish a visual baseline and confirm the environment is healthy.
- **During development**: confirm UI renders correctly in dark mode, holo effects behave as expected, routing works.
- **After implementation**: verify the full flow before marking the task complete.
- **Never skip this step** for any task touching the frontend — visual regressions in a premium UI are not acceptable.
- **If a bug is found**: fix it before marking the task complete. Do not log it and move on.

---

### What You Must Never Do

- Never commit `.env` files or the `resources/` directory
- Never open a PR without explicit human approval, even if the diff looks trivial
- Never run destructive `bun` or `npm` scripts in production contexts without confirming the target environment with the human
- Never use `playwright-cli` to interact with forms or auth flows that could trigger real side effects outside a local development environment without first confirming with the human

---

## Definition of Done

A task is complete **only** when all of the following are true:

1. Code passes linting and type checks (`bun run check` in `ui/`, TypeScript compiler clean in `server/`).
2. All tests pass (`bun run test` in both `server/` and `ui/`).
3. Frontend changes verified via `playwright-cli snapshot`/`screenshot` (no visual regressions).
4. New API endpoints have positive and negative Vitest test scenarios and the Postman collection is updated.
5. Any new framework gotcha or project-specific quirk is documented in `Project Learnings` below.
6. Changes are pushed to a feature branch and a PR is created via `gh pr create` (with human approval if required by the permission model).

---

## What Agents Should Never Do

- Never commit code directly to `main`. Always use `feature/task_name` branches.
- Never commit the `resources/` directory. It must remain gitignored.
- Never remove or rename existing API endpoints without flagging it as a
  breaking change.
- Never bypass the Hono proxy to fetch external data directly from the SvelteKit client.
- Never write `any` in TypeScript. Use `unknown` with type guards if necessary.
- Never modify Drizzle migration files once they have been applied. Create a new migration.
- Never implement complex backend logic inside route handlers; extract it to
  `server/src/services/`.

---

## Project Learnings

**Agents must update this section immediately when discovering a new caveat,
bug fix, or project-specific quirk. See "Learning & Knowledge Capture" above.**

- **SvelteKit SSR + HttpOnly cookies:** SvelteKit SSR needs to correctly pass
  the HttpOnly cookie to the Hono backend during `load()` functions, otherwise
  SSR requests will fail authentication.
- **`$app/*` modules must be mocked in Vitest:** SvelteKit's `$app/forms`,
  `$app/stores`, `$app/navigation`, and `$app/environment` are injected by the
  SvelteKit Vite plugin at build time and are **not** available in the jsdom
  test environment. Always mock them in `src/tests/setup.ts` using
  `vi.mock()` before running Vitest component tests. Failure to do so results
  in `document is not defined` errors from `@testing-library/svelte`.
- **Vitest `environment` config is in `vitest.config.ts`:** Unlike old Vite
  setups, the `jsdom` environment must be set in `vitest.config.ts`
  (`defineConfig` from `vitest/config`, not `vite`). A typo like `engvironment`
  silently defaults to `node`, causing `document is not defined` errors in
  component tests with no clear indication of why.
- **Testing Library `getByLabelText` ambiguity:** When a password input and its
  show/hide toggle button both share the word "password" in their label or
  `aria-label`, `getByLabelText(/password/i)` throws a multiple-elements
  error. Use `getByLabelText(/password/i, { selector: "input" })` to target
  only the form field.
- **SvelteKit form actions + cookie forwarding:** When implementing auth form
  actions in `+page.server.ts`, the `fetch()` response from the Hono backend
  contains the `Set-Cookie` header as a raw string. You must parse the JWT
  token out of that string and then call `cookies.set()` on the SvelteKit
  `cookies` store to forward the session to the browser. Simply forwarding
  the raw header does not work because SvelteKit sanitizes headers.
- **`bun test` vs `bun run test`:** `bun test` invokes Bun's native test runner
  and ignores `package.json` scripts. As a result, Vitest and its `jsdom`
  environment config are skipped, which produces `document is not defined`
  errors in every component test. Always use `bun run test`, as it respects
  `package.json` and launches Vitest correctly.
- **Never create files on local `main`:** Making changes directly on the local
  `main` branch causes untracked files that conflict when the same files are
  merged via PR into `origin/main`. The result is a `git pull` abort with
  "untracked working tree files would be overwritten by merge." Always branch
  first: `git checkout -b feature/...` before adding or modifying any file.
  Keep `main` strictly as a clean, read-only mirror of `origin/main`.
- **`pokemon-cards-css` unpublished from npm:** The `pokemon-cards-css` package
  was pulled from npm in 2022. Direct `npm install pokemon-cards-css` fails with
  ENOVERSIONS. We replaced it with a custom cursor-tracking holographic effect
  using CSS custom properties (`--mx`/`--my`), `radial-gradient` shine overlays,
  and SVG `feTurbulence` noise — inspired by the original package but built
  in-house to avoid the missing dependency.
- **CSS `calc()` cannot multiply `%` by `deg`:** Storing rotation as
  `calc((var(--my, 50%) - 50%) * 0.24deg)` is invalid CSS — you cannot multiply
  a `<percentage>` type by an `<angle>` type in `calc()`. The expression silently
  resolves to 0 in most browsers, producing no tilt. The fix is to compute the
  rotation value in JavaScript (using Svelte `spring()` stores), append the `deg`
  unit there, and store the result as a dimensioned CSS variable like
  `--rotate-x: 8.5deg`. The CSS transform then reads it verbatim:
  `rotateY(var(--rotate-x, 0deg))`.
- **Holographic card effect architecture (reference: simeydotme/pokemon-cards-css):**
  The production-quality holo effect requires three things working together:
  (1) Svelte `spring()` stores for `rotate`, `glare`, and `background` — this
  gives the bouncy physical feel; raw CSS `transition` looks mechanical.
  (2) JS-computed CSS variables with correct units written every animation frame
  (`--rotate-x`, `--rotate-y`, `--pointer-x`, `--pointer-y`,
   `--pointer-from-center`, `--pointer-from-top`, `--pointer-from-left`,
   `--background-x`, `--background-y`, `--card-opacity`).
  (3) Two overlay `<div>` layers — `.card__shine` (`mix-blend-mode: color-dodge`)
  for the rainbow foil and `.card__glare` (`mix-blend-mode: overlay`) for the
  specular highlight — each with `::before`/`::after` pseudo-elements for depth.
  Rarity-specific CSS uses `data-rarity` attribute selectors and clip-path to
  target the art area (`inset(9.85% 8% 52.85% 8%)`) for regular holo cards.
- **CSS stacking context destroys `backface-visibility: hidden` in 3D flips:**
  Two common properties silently break card-flip animations by flattening the
  3D transform context:
  (1) `overflow: hidden` on the face element itself creates a stacking context
  that disables `backface-visibility`. Fix: move `overflow: hidden` + `border-radius`
  to a nested `.face-inner` wrapper div, keeping the outer `.face` clean.
  (2) `filter` (including `drop-shadow`) on an element with
  `transform-style: preserve-3d` flattens the 3D space for all children, also
  breaking `backface-visibility`. Fix: move the `filter` to an outer wrapper
  element that does NOT declare `transform-style: preserve-3d`.
  Symptom of both: the card flip rotates (matrix3d confirms 180°) but both
  faces remain visible simultaneously — the back face appears on top.
- **Bun `mock.module` intercepts dynamic imports:** When route handlers use
  `await import("../services/collection")` at request time (deferred DB
  connection), Bun's `mock.module("../services/collection", factory)` still
  intercepts the import correctly — the mock is registered in the module
  registry before the handler runs. Register mocks at the top of the test file
  (before any `describe` or `it` blocks) to guarantee they take effect.
- **Svelte template inline TypeScript generics are invalid:** Writing
  `on:expand={(e: CustomEvent<TcgCard>) => ...}` inside a `.svelte` template
  causes a parse error ("Unexpected token"). TypeScript generic syntax is not
  supported inside Svelte event handler expressions. Either accept the implicit
  `any` (matching the existing pattern in this codebase) or extract the handler
  to a typed function in the `<script>` block.
- **Drizzle `inArray` for multi-key lookups:** When fetching `cards_cache` rows
  for a list of card IDs, use `inArray(cardsCache.cardId, cardIds)` from
  `drizzle-orm` rather than issuing N individual queries. `inArray` emits a
  single `WHERE card_id IN (...)` clause and avoids N+1 query patterns.
- **SvelteKit `tsconfig.json` `paths` overrides `$lib` alias:** If the project's
  `tsconfig.json` extends `.svelte-kit/tsconfig.json` and also defines a `paths`
  block, the extension's `paths` (which includes the `$lib`/`$lib/*` aliases) is
  completely overridden by the local `paths`. Symptom: `Cannot find module
  '$lib/components/...'` in `svelte-check`. Fix: move custom path aliases (e.g.
  `$shared/*`) to `svelte.config.js` `kit.alias` instead of `tsconfig.json
  paths`. SvelteKit merges kit aliases into the generated tsconfig automatically.
- **SvelteKit route group `(name)` for authenticated layout isolation:** Use
  parentheses-prefixed route group directories (e.g. `(app)/`) to apply a shared
  sidebar/shell layout to authenticated pages without adding a URL segment. Auth
  pages placed outside the group inherit the root layout only, keeping them
  sidebar-free. After moving routes into a group, run `svelte-kit sync` to
  regenerate `$types` before running `svelte-check`.
