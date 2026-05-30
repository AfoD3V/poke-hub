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

## Architecture Reference

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the single authoritative reference on structural, naming, and organisational decisions across this monorepo.

> **Prime Directive:** Does this structure serve the code, or does the code serve the structure?

### When to consult `ARCHITECTURE.md`

- **Before adding any new file**: run through the Decision Checklist (5 questions) to confirm the correct layer, naming, and responsibility.
- **When asked "where does this go?"**: `ARCHITECTURE.md` is the authoritative answer — not memory, not convention, not precedent.
- **When introducing a new structural pattern**: update `ARCHITECTURE.md` in the same commit.

### What `ARCHITECTURE.md` covers

| Section | Purpose |
|---------|---------|
| Repo Layout | Top-level directories and their roles; mapping from reference arch to real paths |
| Frontend Structure | Layer rules for `ui/src/` — `app/`, `lib/components/`, `lib/hooks/`, `app/api/` |
| Backend Structure | Hono layering: routes → services → Drizzle |
| Shared Package | Cross-boundary types; no `any`, no logic |
| Naming Conventions | File/folder naming table; semantic naming rules |
| Anti-Patterns | 8 explicitly forbidden patterns with correct alternatives |
| When to Break the Rules | 5 documented exceptions with rationale and resolution |
| Decision Checklist | 5 questions to answer before creating any new file |

---

## Tech Stack

| Layer      | Technology                          |
| ---        | ---                                 |
| Frontend   | Next.js 14 App Router (React 18)    |
| Card UI    | Custom holographic CSS + `useSpring` hook (inspired by pokemon-cards-css) |
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
|-- ui/           ← Next.js 14 App Router (primary frontend)
|-- server/
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

### Required Skills

Invoke these skills automatically — do not wait to be asked.

| Trigger | Skills to invoke |
| --- | --- |
| Any frontend file (`.tsx`, `.ts`, or anything under `ui/`) | `ui-ux-pro-max` |
| Any backend file (anything under `server/`, Hono routes, middleware, services) | `hono` |
| Browser debugging, visual verification, or end-to-end testing of any UI change | `playwright-cli` |
| Final step of any OpenSpec task implementation (before opening a PR) | `security-secure-coding` |

**Security gate:** The `security-secure-coding` skill must be run as the last step after all tests pass and before `gh pr create`. All findings must be resolved — do not open the PR until the skill reports no outstanding issues.

**Playwright CLI skill:** The `playwright-cli` skill provides browser automation for debugging, checking correctness, and visual verification. Use it for:
- Confirming a page renders correctly after any frontend change.
- Debugging unexpected UI behaviour (snapshots reveal the accessibility tree; screenshots reveal visuals).
- End-to-end flow verification (e.g. login → search → result) before marking a task done.
- Never use `playwright-cli open <url>` a second time during a session — it resets cookies. Navigate within the session using `playwright-cli click <ref>` on nav links.

---

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
- Hide secrets. External API keys must never touch the frontend. The Next.js
  client only communicates with the Hono backend, which acts as a secure proxy.
- Safe queries. All database interactions must go through Drizzle ORM. Raw SQL
  is forbidden.
- Environment variables. Never commit `.env` files. Keep `.env.example` updated.

### Test-Driven Development (TDD) — Mandatory

**All new development MUST follow strict TDD. This is not optional.**

**The TDD cycle:**
1. **Red** — Write failing tests first. Before any implementation code exists, write the tests that specify the expected behavior. Run them and confirm they fail.
2. **Green** — Implement the minimum code needed to make the tests pass.
3. **Done** — Run `bun run test` and confirm all tests pass. Passing tests are the definition of done for each task.

**OpenSpec `tasks.md` rule:** Writing failing tests MUST be the first task group in every `tasks.md` (e.g. `## 1. Tests — write failing tests`). No implementation task group may appear before it. This applies to every change — backend services, frontend components, shared types, and integration flows.

**Other test requirements:**
- No tests, no merge. Every new feature must include tests.
- Backend tests: use Vitest for unit testing services and Hono API routes.
- Frontend tests: use Vitest + React Testing Library for component rendering and state verification.
- UI states: always handle loading and error states in the UI.
- Task verification steps must be actionable. For tasks broken into steps (e.g., 1.1, 1.2, 1.3), each step's verification MUST be executable either manually or with tests at that stage.

**API testing rule — non-negotiable:** Any time an API endpoint is added or modified, BOTH of the following are required before the task is considered done:
1. **Vitest unit tests** — at minimum one positive scenario (happy path) and one negative scenario (error/invalid input) in `server/src/routes/<name>.test.ts`.
2. **Postman collection** — add or update the corresponding request in `docs/postman/pokehub.postman_collection.json` with appropriate test scripts (status code assertions, response shape checks).

Neither replaces the other. Both are required, every time, for every endpoint.

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

### Keeping AGENTS.md, CLAUDE.md, and ARCHITECTURE.md in Sync

`AGENTS.md`, `CLAUDE.md`, and `ARCHITECTURE.md` are the three primary sources of truth for AI agents in this repo and **must always be consistent with each other**.

- **When updating `AGENTS.md`** (e.g. adding a Project Learning, changing a directive, updating current status): reflect the relevant change in `CLAUDE.md` as well — update the corresponding section or add a new entry.
- **When updating `CLAUDE.md`** (e.g. adding a gotcha, changing a command, updating the current phase): ensure `AGENTS.md` reflects the same information in the appropriate section.
- **When introducing a new structural pattern** (a new layer, convention, or directory): update `ARCHITECTURE.md` in the **same commit** as the code change.
- All three files must be updated in the **same commit** when a structural change is involved. A change to one file without the corresponding update to the others is incomplete.
- `AGENTS.md` is the canonical home for full detail (rationale, workflow steps, tooling config). `CLAUDE.md` contains the distilled, actionable version. `ARCHITECTURE.md` is the authoritative structural reference. When in doubt: full context goes in `AGENTS.md`; the practical summary goes in `CLAUDE.md`; structural conventions go in `ARCHITECTURE.md`.

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

### ESLint

ESLint 9 (flat config) is configured at the repo root via `eslint.config.mjs` and covers all three packages:

| Scope | Files | Rules |
| --- | --- | --- |
| Backend | `server/src/**/*.ts` | `@typescript-eslint/recommended`, `no-explicit-any: error` |
| Shared | `shared/**/*.ts` | same as backend |
| Frontend React | `ui/src/**/*.{ts,tsx}` | `@typescript-eslint/recommended` + `react-hooks/recommended` |

- Run **`bun run lint`** from the repo root to lint everything.
- Run **`bun run lint:fix`** to auto-fix safe issues.
- Both `ui/` and `server/` also expose `bun run lint` for package-scoped runs.
- ESLint must pass (zero errors) before any PR is opened — it is step 1 of the Definition of Done.

---

### GitHub (`gh` CLI)

Use `gh` as the primary tool for all GitHub operations. Fall back to raw `git` only when `gh` has no equivalent.

- **Orient first:** Run `gh issue list` and `gh pr status` before beginning any task.
- **Branch:** `git checkout -b feature/task_name` before writing any code. Never commit to `main`.
- **Commits:** Commit incrementally with meaningful messages — not "update", "fix", or "wip". Never commit `.env` files, secrets, or the `resources/` directory.
- **PR:** `gh pr create --title "..." --body "..."` once the feature is complete and all tests pass. Requires human approval — stop and present a full PR summary before opening.

### Git Workflow — CLI Rules

Follow this sequence without deviation:

1. **Create the branch from an up-to-date `main`** — before branching, always run `git checkout main && git fetch origin && git pull origin main` to sync with remote. Then `git checkout -b feature/task_name`. Never push to `main` or `master`.
2. **Commit incrementally** as you complete logical units of work. Messages must be meaningful and descriptive.
3. **Open a PR only after** the feature is complete and all tests pass. Present PR title, target branch, and a summary of changes to the human before running `gh pr create`.
4. **Return to `main` after the PR is created** — run `git checkout main` immediately so the next task starts from a clean base.

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

1. ESLint passes — run `bun run lint` from the repo root; zero errors allowed.
2. Type checks pass (`npm run check` in `ui/`, TypeScript compiler clean in `server/`).
3. All tests pass (`bun run test` in both `server/` and `ui/`).
4. Frontend changes verified via `playwright-cli snapshot`/`screenshot` (no visual regressions).
5. New API endpoints have positive and negative Vitest test scenarios and the Postman collection is updated.
6. Any new framework gotcha or project-specific quirk is documented in `Project Learnings` below.
7. Security check via `security-secure-coding` skill completed — all findings resolved before opening the PR.
8. Changes are pushed to a feature branch and a PR is created via `gh pr create` (with human approval if required by the permission model).

---

## What Agents Should Never Do

- Never commit code directly to `main`. Always use `feature/task_name` branches.
- Never commit the `resources/` directory. It must remain gitignored.
- Never remove or rename existing API endpoints without flagging it as a
  breaking change.
- Never bypass the Hono proxy to fetch external data directly from the Next.js client.
- Never write `any` in TypeScript. Use `unknown` with type guards if necessary.
- Never modify Drizzle migration files once they have been applied. Create a new migration.
- Never implement complex backend logic inside route handlers; extract it to
  `server/src/services/`.

---

## Project Learnings

**Agents must update this section immediately when discovering a new caveat,
bug fix, or project-specific quirk. See "Learning & Knowledge Capture" above.**

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
  rotation value in JavaScript (using the `useSpring` hook), append the `deg`
  unit there, and store the result as a dimensioned CSS variable like
  `--rotate-x: 8.5deg`. The CSS transform then reads it verbatim:
  `rotateY(var(--rotate-x, 0deg))`.
- **Holographic card effect architecture (reference: simeydotme/pokemon-cards-css):**
  The production-quality holo effect requires three things working together:
  (1) Custom `useSpring` hook for `rotate`, `glare`, and `background` spring values — this
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
- **`overflow: hidden` on any ancestor of a tilted card causes "invisible frame" clipping:**
  Even when `overflow: hidden` is on a non-face wrapper (`.face-inner`), the spring tilt on
  `card__rotator` projects the card outside that ancestor's 2D bounds — edges disappear as if
  clipped by an invisible box. The flip animation does NOT require `overflow: hidden`; it is
  governed entirely by `backface-visibility: hidden` on `.face`.
  Fix: Remove `overflow: hidden` from `.face-inner`. Move the rounded-corner clip directly onto
  the `<img>` element via `border-radius: 4.55% / 3.5%` — images are clipped by their own
  `border-radius` without needing an overflow parent.
  Also remove `transform-style: preserve-3d` from `.card__rotator` in Card.tsx (grid cards):
  HoverTilt's `.hover-tilt` is the `preserve-3d` root; keeping it on the rotator puts
  `.card__front`'s `overflow: hidden` inside a 3D stacking context causing the same artifact.
- **Bun `mock.module` intercepts dynamic imports:** When route handlers use
  `await import("../services/collection")` at request time (deferred DB
  connection), Bun's `mock.module("../services/collection", factory)` still
  intercepts the import correctly — the mock is registered in the module
  registry before the handler runs. Register mocks at the top of the test file
  (before any `describe` or `it` blocks) to guarantee they take effect.
- **Drizzle `inArray` for multi-key lookups:** When fetching `cards_cache` rows
  for a list of card IDs, use `inArray(cardsCache.cardId, cardIds)` from
  `drizzle-orm` rather than issuing N individual queries. `inArray` emits a
  single `WHERE card_id IN (...)` clause and avoids N+1 query patterns.
- **`playwright-cli open <url>` resets the browser session:** Calling `playwright-cli open`
  creates a brand-new browser context, discarding all existing cookies including auth sessions.
  To navigate to an authenticated page during visual verification, stay within the existing
  session: use the sidebar nav links (via `playwright-cli click <ref>`) rather than issuing a
  new `playwright-cli open`. Only use `open` for the initial page load.
- **Vite dev server auto-increments port when default is in use:** If port 5173 (or 5174) is
  already occupied, Vite silently picks the next free port (5175, 5176, …). Always read the
  `Local:` line from `bun run dev` output (or check the dev log) to confirm the actual port
  before running `playwright-cli open` or browser tests against it.
- **TCGdex GraphQL API returns null list items, not just null fields:** When `AttacksListItem.name`
  (or another non-nullable field) is null, the TCGdex GraphQL API nulls out the **entire list item**
  (`attacks[i] === null`), not just the field. The response also carries a top-level `errors` array
  alongside a valid `data.cards` array — this is normal and should not abort processing.
  Fix: filter attacks with `a !== null && a.name !== null`. Only throw a 502 when `data.cards`
  itself is absent.
- **Drizzle `onConflictDoUpdate` requires explicit target columns for multi-column unique constraints:**
  When upserting against a composite unique constraint (e.g. `(userId, cardId)`), pass the array form
  `target: [table.userId, table.cardId]` rather than a single column. Passing a single column silently
  selects the wrong conflict target and the upsert may throw or create duplicate rows.
- **Next.js CSS Modules do NOT hash `data-*` attribute selectors:** CSS Modules hash class names but leave
  `data-*` attribute selectors untouched. Selectors like `[data-rarity="rare holo"] .card__shine` work verbatim
  in CSS Modules files — do not wrap them in `:local()`.
- **`useSpring` TDZ self-reference — use `frameRef` pattern:** A RAF callback that references itself for the
  next frame tick cannot call itself by name (temporal dead zone at declaration time). Fix: declare
  `const frameRef = useRef<FrameRequestCallback>(() => {})` and assign the real function to `frameRef.current`
  inside a `useEffect`. Start the loop with `requestAnimationFrame(frameRef.current)`. This satisfies
  `react-hooks/exhaustive-deps` and avoids the TDZ error.
- **`useState` not `useRef` for spring displayed value:** `useRef` mutations do not trigger React re-renders.
  The value displayed to the DOM must live in `useState` so each spring tick causes a re-render.
- **`useState(() => Math.random())` for seed values — avoids `react-hooks/purity`:** Calling `Math.random()`
  directly in the render body triggers the `react-hooks/purity` lint rule. Use the lazy initializer form
  `const [seed] = useState(() => Math.random())` to call it exactly once during mount.
- **`Array.from(new Set(...))` instead of `[...new Set(...)]`:** The Docker build TS target does not support
  iterating a `Set` with spread syntax. Always use `Array.from(new Set(...))` to convert to an array.
- **Next.js API Route Handlers needed for all client-side API calls:** Neither `next dev` nor adapter-node
  provide a transparent proxy. Every `/api/*` path fetched from the browser needs a `route.ts` handler
  in `ui/src/app/api/`. Use the shared `proxyGet/proxyPost/proxyDelete` helpers in `ui/src/lib/apiProxy.ts`.
- **`cancelAnimationFrame` must be stubbed via `Object.defineProperty` in tests:** `vi.stubGlobal` stubs are
  reset by `vi.restoreAllMocks()`. Use `Object.defineProperty(window, 'cancelAnimationFrame', { value: ... })`
  in `setup.ts` so the stub persists through all test files.
- **CSS Module media queries must declare base rules BEFORE overriding media queries:** In CSS Modules, the
  cascade still applies in declaration order. If a base rule (e.g. `.bottom-nav { display: none }`) is placed
  AFTER a media query that sets `.bottom-nav { display: flex }`, the base rule wins at all viewport widths.
  Always declare base/default styles first, then responsive overrides last.
- **Docker rebuilds required for CSS changes in production mode:** The Docker UI container builds a static
  Next.js production export. Unlike `next dev`, CSS Module changes are NOT hot-reloaded. Always run
  `docker compose up -d --build` after any CSS change and verify visually with `playwright-cli` before
  marking tasks done.

- **`/api/sets/:id/cards` returns a raw array, not `{ cards: [...] }`:** The Hono backend returns
  `SetCardItem[]` directly (not wrapped in an object). Parse with `const cards = await res.json() as SetCardItem[]`
  after checking `res.ok`. Do not use `body.cards ?? []` — it will always be `undefined` and silently
  return an empty grid.
- **SeriesBrowser column layout requires a flex height chain from root to `.series-browser`:** The
  3-column sliding panel uses `overflow: hidden` to clip hidden columns and `overflow-y: auto` on each
  column for per-panel scrolling. After the responsive layout change that made `.app-main` a `flex`
  column container, `.series-browser` must declare `flex: 1; min-height: 0` to fill remaining height,
  and `.app-main` + `.page` must participate in the flex chain (`display: flex; flex-direction: column;
  min-height: 0`). Without this, the columns have no anchored height and `overflow-y: auto` expands
  infinitely rather than scrolling.
- **Playwright Screenshots — always write to `screenshots/`:** All `playwright-cli screenshot` and
  `playwright-cli snapshot` calls MUST write output to `screenshots/<descriptive-name>.png` at the repo
  root. Never write screenshot files to the repo root directly, `ui/`, `server/`, or any other location.
  If the `screenshots/` directory does not yet exist, create it before writing the first screenshot.
  The directory is tracked in git (via `.gitkeep`); image files within it are gitignored via `.gitignore`.
- **Drizzle camelCase column references — snake_case doesn't exist on the JS object:** When using Drizzle
  column references inside `drizzleSql` template literals (e.g. `drizzleSql\`${table.column} > 0\``),
  always use the camelCase JS property name defined in the schema (e.g. `binderSlots.cardId`, not
  `binderSlots.card_id`). The snake_case property doesn't exist on the Drizzle table object; using it
  inserts `undefined` into the SQL template and causes a runtime query error.
- **`react-hooks/set-state-in-effect` (v5 canary) — avoid direct setState in useEffect body:** The
  `eslint-plugin-react-hooks` v5.0.0-canary shipped two new rules: `react-hooks/set-state-in-effect`
  and `react-hooks/error-boundaries`. The first flags synchronous `setState` calls and calls to
  callbacks-that-call-setState directly inside an `useEffect` body. Fix: move synchronous state resets
  to event handlers (e.g. onChange), and inline async data-fetching into a local `async function` with a
  `cancelled` flag inside the effect rather than calling a `useCallback` that sets state.
- **`react-hooks/error-boundaries` — JSX inside try/catch is flagged:** The same v5 canary rule flags
  returning JSX from inside a `try` block. Fix: collect data inside the try (using variables), then
  render JSX after the try/catch block. The error fallback JSX in the `catch` block is fine.
- **`playwright-cli open` resets browser session:** Each `playwright-cli open <url>` creates a fresh
  browser context, discarding all cookies (including auth). After login, navigate within the same
  session using `playwright-cli goto <url>` to preserve the session. Only use `open` once per session.
- **`playwright-cli fill` with `!` — use `printf` to avoid shell history expansion:** Bash/zsh
  history-expands `!` in double-quoted strings, causing playwright-cli to fill `\!` literally instead
  of `!`. Always pass passwords containing `!` via `"$(printf '%s' 'Claude123!')"` to produce a clean
  string without shell interpolation.
