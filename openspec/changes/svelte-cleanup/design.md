## Context

The Svelte → React migration was completed in commit `71a8cad` (2026-05-21). Task 14.5 of that migration — deleting `ui-svelte/` and syncing `CLAUDE.md` / `AGENTS.md` — was marked complete without executing the deletion. Three distinct problems resulted:

1. **Dead weight** (orphaned files, deps, directory)
2. **Knowledge rot** (stale SvelteKit learnings mislead agents and future engineers)
3. **Missing prior art link** (`ws.ts` WebSocket design not captured before deletion)

Each problem requires a different approach.

---

## Goals / Non-Goals

**Goals:**
- Remove all files that are not referenced by any active service or build
- Leave `AGENTS.md` and `CLAUDE.md` in a state where every retained learning is accurate and applicable to the current Next.js codebase
- Preserve the `ws.ts` WebSocket connection architecture as a reference document before the source file is deleted
- Keep all existing tests green throughout

**Non-Goals:**
- Implementing WebSocket support (that is Phase 1 Task 5)
- Removing `ui-svelte/` from git history (rewriting history on a team repo is disproportionate)
- Cleaning up OpenSpec archive directory references

---

## Decisions

### D1: Delete `ui-svelte/` entirely, do not gitignore it

`ui-svelte/` is 112 MB on disk (node_modules + .svelte-kit). The codebase is preserved in git history — `git log --all -- ui-svelte/` surfaces every commit that touched it. Keeping the directory live for "reference" adds constant noise and misleads agents about what is deployed.

**Alternatives considered:**
- *Gitignore `node_modules/` only*: Still leaves 43+ Svelte files creating ambiguity about what is active code
- *Move to `resources/`*: `resources/` is for external upstream references; internal legacy code doesn't belong there

### D2: Delete the root `src/` directory entirely

`src/routes/search/+page.svelte` was committed in ae2c112 alongside an auth fix, not as intentional feature work. The directory has no `package.json`, no tsconfig, and is not referenced by Docker or any build script. It predates the `ui-svelte/` → `ui/` rename and was simply never cleaned up.

### D3: Capture `ws.ts` as a spec artifact, not a comment in AGENTS.md

`ws.ts` contains non-trivial design decisions: reconnect timing (3 s), the decision to use Svelte stores for toast state, browser-only init guards, and `destroyWs()` lifecycle for SSR safety. These decisions will directly inform Phase 1 Task 5. Putting them in `openspec/specs/realtime-ws-prior-art/` makes them discoverable when that task starts, rather than buried in a cleanup change's commit message.

### D4: Purge SvelteKit learnings from AGENTS.md, do not archive them inline

The 12 SvelteKit-specific learnings are:
- `$app/*` module mocking in Vitest
- SvelteKit form actions + `Set-Cookie` forwarding
- SvelteKit SSR `+layout.server.ts` load guard pattern
- `svelte-kit sync && svelte-check` workflow
- `$state.raw` and `SvelteMap` (Svelte 5)
- Svelte template TypeScript cast errors
- `adapter-node` no-dev-proxy pattern
- `kit.alias` vs `tsconfig.json` paths precedence
- Svelte `spring()` stores for animation (superseded by `useSpring` React learning)
- Svelte scoped styles vs CSS Modules specificity
- SvelteKit route group `(name)` for layout isolation (→ replaced by identical Next.js learning)

All of these have either a direct Next.js equivalent already documented, or are irrelevant to the current stack. Keeping them with "DEPRECATED" markers just adds noise — agents will still read them and sometimes act on them.

The 14+ framework-agnostic learnings (CSS animation, Bun quirks, DB ORM patterns, Playwright behavior, holographic effect architecture) are retained unchanged.

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| A running service depends on deleted files | Very low | `docker-compose.yml` build contexts verified; no active service references `ui-svelte/` or root `src/` |
| Removing svelte ESLint plugin breaks linting config | Low | ESLint config already ignores `ui-svelte/**`; root `eslint.config.mjs` has no svelte rule sets for active code |
| `bun.lock` regeneration introduces dep version drift | Low | Only removing devDeps; production deps untouched; run `bun install` after removal |
| Agent reads stale ws.ts reference and tries to apply Svelte patterns | Mitigated | Prior art spec document explicitly marks patterns as Svelte-specific and notes the React redesign needed |

---

## Prior Art: ws.ts WebSocket Architecture

Before deletion, the key design from `ui-svelte/src/lib/ws.ts`:

```
┌──────────────────────────────────────────────────────┐
│              SvelteKit ws.ts Architecture             │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Browser           ws.ts             Svelte Stores   │
│  ────────          ─────             ─────────────   │
│  initWs()  ──────▶ new WebSocket()                   │
│                    onopen: connected                  │
│                    onmessage ─────────▶ toasts.set()  │
│                    onerror  ─────────▶ reconnect      │
│                    onclose  ─────────▶ setTimeout(3s) │
│                              │                        │
│  destroyWs() ───────────────▶ ws.close()             │
│  (SSR guard: typeof window)  clearTimeout()          │
│                                                      │
│  Toast shape: { id, message, severity, ttl }         │
│  Reconnect: 3 000 ms, unlimited retries              │
│  Entry point: called from +layout.svelte onMount()   │
└──────────────────────────────────────────────────────┘
```

**What changes in the React redesign (Phase 1 Task 5):**
- Svelte stores → React Context + `useReducer` (or Zustand)
- `initWs()`/`destroyWs()` → `useEffect` lifecycle in a `<RealtimeProvider>` wrapper
- SSR guard (`typeof window`) still needed — Next.js SSR will attempt to run the effect server-side
- Toast state management can use the existing `Toast.tsx` component; needs a context to push toasts from outside the component tree
- Server-Sent Events (SSE) is a viable alternative to WebSocket for unidirectional server push — reconsider at Task 5 design time

This design reference is captured in `openspec/specs/realtime-ws-prior-art/spec.md`.
