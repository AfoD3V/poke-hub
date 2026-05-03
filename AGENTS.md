# PokeHub - AI Agent Instructions

## Current State

Update this section as the project progresses.

- Completed: (none)
- In progress: Phase 1, Task 1 - Core Infrastructure and Database Scaffold
- Next up: Phase 1, Task 2 - Security and Authentication System

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

### Communication and Implementation

- Plan first. Output a concrete plan before touching 3+ files or creating a new
  DB schema, and wait for human approval.
- Shared types. Any data crossing the client/server boundary must be typed in
  `shared/`. No `any` types allowed.
- UI design. Do not invent UI styles. Use Tailwind CSS and follow the dark mode
  design guidelines.
- Use Playwright MCP for browser-based debugging, developing, and testing when
  needed.

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

Agents must update this section immediately when discovering a new caveat, bug
fix, or project-specific quirk.

- Example: SvelteKit SSR needs to correctly pass the HttpOnly cookie to the Hono
  backend during `load()` functions, otherwise SSR requests will fail
  authentication.
- (Add new learnings here...)
