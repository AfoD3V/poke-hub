## Why

The Svelte → React migration (completed 2026-05-21) left three layers of debt that compound over time:

**Dead weight** — `ui-svelte/` (112 MB including node_modules), a stray `src/routes/search/+page.svelte` tracked at the repo root, and three orphaned Svelte devDependencies in the root `package.json`. None of these are referenced by any active service, build, or test. They exist because OpenSpec task 14.5 was marked complete prematurely — the deletion never ran.

**Knowledge rot** — `AGENTS.md` contains 12 SvelteKit-specific project learnings covering Svelte store patterns, `$app/*` module mocking, form action cookie forwarding, and `svelte-check` workflows. These learnings are not just irrelevant — they are actively misleading in a Next.js context. An agent reading about `$app/navigation` mocks or `SvelteMap` will apply the wrong mental model to current problems. `CLAUDE.md` still documents `ui-svelte/` as "kept as backup reference," contradicting its intended deletion.

**Unrecorded prior art** — `ui-svelte/src/lib/ws.ts` is the only non-trivial piece of SvelteKit logic without a React equivalent. It is a WebSocket connection manager (reconnect logic, toast integration, `initWs`/`destroyWs` lifecycle) directly relevant to Phase 1 Task 5 (Real-Time Event Architecture). Its design decisions should be captured before the directory is deleted.

This change executes the deferred cleanup, corrects the knowledge rot, and preserves the ws.ts prior art in the right place.

## What Changes

- **DELETE** `ui-svelte/` entire directory (112 MB, 261 dependencies, 43+ .svelte files)
- **DELETE** `src/` directory at repo root (stray `+page.svelte` from pre-refactor commit ae2c112)
- **REMOVE** from root `package.json`: `eslint-plugin-svelte`, `svelte`, `svelte-eslint-parser`
- **UPDATE** `bun.lock` to reflect dependency removal
- **PURGE** 12 SvelteKit-specific learnings from `AGENTS.md`; keep 14+ framework-agnostic and Next.js-specific learnings
- **UPDATE** `CLAUDE.md`: remove `ui-svelte/` reference, remove stale SvelteKit gotchas, ensure sync with `AGENTS.md`
- **CAPTURE** `ws.ts` architecture notes in `openspec/specs/realtime-ws-prior-art/` as reference for Phase 1 Task 5

## Capabilities

No new capabilities. This change modifies no application code — only deletes orphaned files and corrects documentation.

### Modified Capabilities

- `app-shell`: CLAUDE.md architecture description updated to reflect actual directory structure (no `ui-svelte/`)
- `agent-workflow`: AGENTS.md cleaned of stale SvelteKit learnings; Next.js-specific learnings retained

## Impact

- `ui-svelte/`: deleted
- `src/`: deleted (repo root orphan)
- `root package.json`: 3 devDeps removed
- `bun.lock`: regenerated
- `AGENTS.md`: ~12 stale learning entries removed
- `CLAUDE.md`: architecture and gotchas sections updated
- No changes to `server/`, `ui/`, `shared/`, `docker-compose.yml`, or any running service
- No regression risk: nothing in any active service references the deleted files
