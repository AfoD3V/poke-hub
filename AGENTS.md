# PokeHub - AI Agent Instructions

## Current State

Update this section as the project progresses.

- Completed: Phase 1, Task 1 - Core Infrastructure and Database Scaffold
- In progress: Phase 1, Task 2 - Security and Authentication System
- Next up: Phase 1, Task 3 - TCG API Proxy & Holographic Search UI

---

## Project Overview

PokeHub is a premium personal collection manager for Pokemon TCG enthusiasts. It
allows users to track their Pokedex progress, manage multi-language card
collections (JP, EN, CN), and eventually track market values and optimal buying
strategies.

Design philosophy: the app must look modern and premium. Dark mode is default
(graphite/deep black/dark purple). We strictly use the `pokemon-cards-css`
library to apply dynamic, cursor-tracking holographic effects to card renders.

---

## Tech Stack

| Layer      | Technology                          |
| ---        | ---                                 |
| Frontend   | SvelteKit + Tailwind CSS            |
| Card UI    | pokemon-cards-css                   |
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
- Use Playwright MCP for browser-based debugging, developing, and testing when
  needed.

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

## Tooling and MCP Configuration

### Available MCP Tools

Two MCP servers are available. Use them — do not simulate their functionality
manually or fall back to equivalent CLI commands when an MCP tool exists for the
job.

**GitHub MCP** — use for all Git and GitHub operations:
- Branch creation, file commits, and pull request management
- Prefer this over raw `git` CLI for any operation that touches the remote
  repository

**Playwright MCP** — use for all browser interactions:
- UI development feedback, visual regression checks, and end-to-end flow
  verification
- Required for any task that involves verifying rendered output or user
  interaction flows

---

### Permission Model

The `opencode.json` config defines what requires human approval. Respect this
strictly — never attempt to work around an `ask` permission by splitting it into
smaller individually-allowed steps.

| Action | Permission | Required Behavior |
|---|---|---|
| `git *` | Auto-allowed | Execute freely |
| `npm *` | Ask | Stop. State the exact command and reason. Wait for explicit approval before proceeding. |
| `github:create_branch` | Auto-allowed | Execute freely |
| `github:push_repository_file` | Auto-allowed | Execute freely |
| `github:create_pull_request` | Ask | Stop. Present PR title, target branch, and a summary of changes. Wait for explicit approval. |
| `playwright:*` | Auto-allowed | Execute freely |

---

### Git Workflow — MCP-Specific Rules

Use the GitHub MCP server as the primary tool for all remote operations. Follow
this sequence without deviation:

1. **Create the branch first** via `github:create_branch` before writing any code
   - Branch name format: `feature/task_name`
   - Never push to `main` or `master` under any circumstances — MCP tools do not
     exempt you from this rule
2. **Commit incrementally** via `github:push_repository_file` as you complete
   logical units of work
   - Commit messages must be meaningful and descriptive — not "update", "fix",
     or "wip"
   - Never commit `.env` files, secrets, or the `resources/` directory
3. **Open a PR only after** the feature is complete and all tests pass
   - Requires human approval — stop and present a full PR summary before calling
     `github:create_pull_request`

---

### Playwright Workflow

Use Playwright MCP for verification. It is not a substitute for writing proper tests.

- **During development**: use it to confirm UI renders correctly in dark mode,
  holographic card effects behave as expected, and routing works
- **After implementation**: run the full e2e test suite to confirm nothing is
  broken before marking a task complete
- **Never skip this step** for any task touching the frontend — visual
  regressions in a premium UI are not acceptable
- **If Playwright reveals a bug**: fix it before marking the task complete. Do
  not log it and move on.

---

### What You Must Never Do With These Tools

- Never commit `.env` files or the `resources/` directory via `github:push_repository_file`
- Never open a PR without explicit human approval, even if the diff looks
  trivial
- Never run `npm install`, `npm run build`, `npm run dev`, or any destructive
  `npm` script without explicit human approval
- Never use Playwright to interact with forms or auth flows that could trigger
  real side effects outside a local development environment without first
  confirming the target environment with the human

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
