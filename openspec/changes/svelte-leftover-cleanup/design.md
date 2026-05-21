## Context

The `svelte-cleanup` change (PR #28) deleted `ui-svelte/`, removed three Svelte devDeps from `package.json`, and purged SvelteKit learnings from `AGENTS.md`/`CLAUDE.md`. It did not address:

1. **Tooling config** — `.gitignore` still has `.svelte-kit/`; `eslint.config.mjs` still ignores the deleted `ui-svelte/**` path.
2. **Root `package-lock.json`** — this file predates the switch to Bun. It is an npm lockfile that was never used for installs (the repo uses `bun.lock`) but still enumerates the now-removed Svelte packages. It has no runtime function and misleads tooling.
3. **README.md** — describes SvelteKit as the frontend, references `localhost:5173`, and links to SvelteKit install steps. The current frontend is Next.js 14 App Router on Docker Compose (`localhost:4000`).
4. **Active OpenSpec specs** — several specs in `openspec/specs/` contain Svelte-specific implementation details (spring stores, `.svelte` component structure, Svelte event directives) that were accurate for the original implementation but now describe superseded patterns.
5. **Docs** — `docs/tech-stack.md` and `docs/k3s-deployment-guide.md` mention SvelteKit.

---

## Goals / Non-Goals

**Goals:**
- Remove all dead Svelte references from tooling config files
- Rewrite README.md to match the actual Docker Compose dev workflow and Next.js stack
- Update active OpenSpec specs so the implementation notes match the React code that was shipped
- Fix any remaining Svelte phrases in CLAUDE.md
- Update docs to reflect Next.js

**Non-Goals:**
- Modifying `openspec/changes/archive/` — these are immutable historical records of past decisions
- Rewriting specs to be comprehensive documentation (only update the Svelte-specific parts)
- Any changes to application code in `server/`, `ui/`, or `shared/`
- Rewriting git history to remove Svelte from past commits

---

## Decisions

### D1: Delete `package-lock.json` rather than update it

The root `package-lock.json` is an npm lockfile for a project that uses Bun. It was never regenerated after the Svelte deps were removed (`bun install` regenerates `bun.lock`, not `package-lock.json`). The file is perpetually stale by design. Updating it would require running `npm install` at the root, which would introduce npm's resolution of the same deps that Bun already manages — creating two competing lockfiles with potentially different resolution trees.

**Decision:** Delete `package-lock.json`. The project is Bun-managed; `bun.lock` is the authoritative lockfile.

**Alternative considered:** Run `npm install` to regenerate it. Rejected — two competing lockfiles for the same deps is more confusing than one correct one.

### D2: Update active specs in place, add a "React Implementation" section

The affected specs were written before or during the migration. Their core requirements are still valid (hover tilt, holo effects, spring animation, etc.) — only the implementation notes reference Svelte. Rather than rewriting the specs entirely, add a `## React Implementation` section documenting the actual shipped approach, and mark Svelte-specific sections as `> **Note:** This describes the original SvelteKit implementation. See React Implementation below.`

This preserves the design rationale while making the current state clear.

### D3: README rewrite targets Docker Compose as the primary workflow

CLAUDE.md already documents Docker Compose as the primary dev workflow. README.md should match. The new README quick-start will be: `docker compose up -d --build` → visit `localhost:4000`.

---

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| A spec update introduces inaccuracies about the React implementation | Cross-check each spec update against the actual source file in `ui/src/` before writing |
| Deleting `package-lock.json` breaks a CI step that runs `npm ci` | Check `.github/workflows/` for any `npm ci` usage before deleting |
| README rewrite misses a step that new contributors need | Test the Docker Compose quick-start flow manually; verify all referenced env files exist |

---

## Migration Plan

No migration needed — config/doc changes only, no schema or runtime changes.

Verification steps are incorporated directly into the task list.
