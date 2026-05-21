## 1. Baseline Verification

- [x] 1.1 Run `bun run test` in `server/` and `ui/` — confirm all tests green before any changes. Record pass count. **Verify:** both exit 0.
- [x] 1.2 Run `bun run lint` from repo root — confirm zero errors before any changes. **Verify:** exits 0.
- [x] 1.3 Run `npm run check` in `ui/` — confirm zero TypeScript errors. **Verify:** exits 0.

## 2. Prior Art Capture (before deletion)

- [x] 2.1 Create `openspec/specs/realtime-ws-prior-art/spec.md` — document the `ui-svelte/src/lib/ws.ts` architecture: WebSocket lifecycle (`initWs`/`destroyWs`), reconnect strategy (3 s delay, unlimited), toast store integration, SSR guard (`typeof window`), and the `onMount()` entry point pattern. Include the React redesign notes from `design.md` (Context + useEffect, SSE consideration). **Verify:** file exists; content covers all design decisions from original `ws.ts`.
- [x] 2.2 Confirm `ws.ts` has no other logic beyond connection management and toast dispatch (no auth, no message transforms, no queue). **Verify:** read `ui-svelte/src/lib/ws.ts` line by line; document any surprises in `spec.md`.

## 3. Dead Weight Removal

- [x] 3.1 Delete the root `src/` directory (`rm -rf src/`). This removes the stray `src/routes/search/+page.svelte` committed in ae2c112. **Verify:** `ls src/` returns "No such file or directory".
- [x] 3.2 Delete `ui-svelte/` (`rm -rf ui-svelte/`). **Verify:** `ls ui-svelte/` returns "No such file or directory"; `du -sh .` shows repo significantly smaller.
- [x] 3.3 Remove from root `package.json` devDependencies: `eslint-plugin-svelte`, `svelte`, `svelte-eslint-parser`. **Verify:** `grep -i svelte package.json` returns no matches in deps/devDeps.
- [x] 3.4 Run `bun install` from repo root to regenerate `bun.lock`. **Verify:** `bun install` exits 0; `grep -i svelte bun.lock` returns no matches (or only from `ui-svelte` workspace entry — which no longer exists).

## 4. Knowledge Cleanup — AGENTS.md

- [x] 4.1 Remove the following SvelteKit-specific learnings from `AGENTS.md` (search by topic, not line number — the file may have shifted):
  - `$app/*` module mocking in Vitest
  - SvelteKit form actions + `Set-Cookie` forwarding
  - SvelteKit SSR `+layout.server.ts` load guard
  - `svelte-kit sync && svelte-check` workflow
  - `$state.raw` and `SvelteMap` (Svelte 5)
  - Svelte template TypeScript cast errors
  - `adapter-node` no-dev-proxy pattern
  - `kit.alias` vs `tsconfig.json` paths precedence
  - Svelte `spring()` stores for animation (the React `useSpring` equivalent already exists)
  - SvelteKit scoped styles vs CSS Modules specificity
  - SvelteKit route group `(name)` for layout isolation (replaced by identical Next.js learning)
  - Any other learning that mentions `+page.svelte`, `+server.ts`, `+layout.server.ts`, `$lib`, or `SvelteKit` as implementation details rather than architectural concepts

  **Verify:** `grep -i "svelte" AGENTS.md` returns only references to `ui-svelte` in the architecture overview (which will be updated in 4.2) or mentions in the migration archive section — no active gotchas or learnings.

- [x] 4.2 Update the architecture section of `AGENTS.md`: remove `ui-svelte/` from the package list; confirm `ui/` is described as Next.js 14 App Router with no mention of SvelteKit. **Verify:** `grep -i "ui-svelte" AGENTS.md` returns no matches outside the migration history section (if one exists).

## 5. Knowledge Cleanup — CLAUDE.md

- [x] 5.1 Remove `ui-svelte/` from the architecture package list in `CLAUDE.md` (the `ui-svelte/ — Legacy SvelteKit frontend...` bullet). **Verify:** `grep "ui-svelte" CLAUDE.md` returns no matches.
- [x] 5.2 Audit the "Key Gotchas" section of `CLAUDE.md` for any SvelteKit-specific entries. Remove entries that describe `+page.svelte`, `+server.ts`, `svelte-check`, `$app/*`, or Svelte store patterns as implementation. **Verify:** all remaining gotchas are applicable to the Next.js + Hono codebase.
- [x] 5.3 Confirm CLAUDE.md and AGENTS.md are consistent: same architecture description, same gotchas, same current phase. **Verify:** spot-check 5 shared sections for drift.

## 6. Final Verification

- [x] 6.1 Run `bun run lint` from repo root — zero errors. **Verify:** exits 0.
- [x] 6.2 Run `bun run test` in `server/` and `ui/` — same pass count as baseline from §1.1. **Verify:** both exit 0; no new failures.
- [x] 6.3 Run `npm run check` in `ui/` — zero TypeScript errors. **Verify:** exits 0.
- [x] 6.4 Run `docker compose up -d --build` and confirm the app starts. **Verify:** `curl http://localhost:4000` returns non-500; `docker compose logs ui` shows no errors referencing deleted files.
- [x] 6.5 Take a Playwright snapshot of `/home` (logged in) to confirm no visual regression from the cleanup. **Verify:** snapshot renders sidebar, stats, and card grid as before.

## 7. Security & Wrap-Up

- [x] 7.1 Run `security-secure-coding` skill — no findings expected (no code changes, only deletions). Resolve any that surface. **Verify:** skill exits clean.
- [x] 7.2 Document any surprises found during cleanup in the `realtime-ws-prior-art/spec.md` (e.g., if `ws.ts` had additional logic not previously noted). **Verify:** spec.md reflects actual findings.
- [x] 7.3 Push branch `feature/svelte-cleanup` and open PR via `gh pr create`. **Verify:** `gh pr status` shows PR open.
