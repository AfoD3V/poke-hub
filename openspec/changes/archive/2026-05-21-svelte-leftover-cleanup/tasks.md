## 1. Baseline Verification

- [x] 1.1 Run `bun run lint` from repo root — confirm zero errors. Run `bun run test` in `server/` and `ui/` — record pass counts. **Verify:** all exit 0.
- [x] 1.2 Run `npm run check` in `ui/` — confirm zero TypeScript errors. **Verify:** exits 0.

## 2. Tooling Config Cleanup

- [x] 2.1 Remove `.svelte-kit/` from `.gitignore`. **Verify:** `grep "svelte-kit" .gitignore` returns no matches.
- [x] 2.2 Remove `'ui-svelte/**'` from the global ignores array in `eslint.config.mjs`. **Verify:** `grep "ui-svelte" eslint.config.mjs` returns no matches.
- [x] 2.3 Check `.github/workflows/` for any `npm ci` or `npm install` at the repo root (not `ui/` or `server/`). Confirm none exist, then delete `package-lock.json`. **Verify:** `ls package-lock.json` returns "No such file or directory".

## 3. README.md Rewrite

- [x] 3.1 Rewrite the Quick Start section: replace the manual `bun run dev` steps with the Docker Compose workflow (`docker compose up -d --build`). Include the service URLs: UI `localhost:4000`, API `localhost:3000`. **Verify:** no mention of `localhost:5173` or `bun run dev` in the quick start.
- [x] 3.2 Update the Tech Stack section: replace `SvelteKit + Tailwind CSS` with `Next.js 14 App Router (React 18) + Tailwind CSS`. **Verify:** `grep -i "sveltekit" README.md` returns no matches.
- [x] 3.3 Update the Status line: replace the SvelteKit scaffolding status with current phase (Phase 1 Task 5 — Real-Time Event Architecture is next). **Verify:** status line is accurate and contains no SvelteKit references.
- [x] 3.4 Confirm the test instructions still match — `bun run test` (not `bun test`) in each package. **Verify:** test section matches current commands in CLAUDE.md.

## 4. CLAUDE.md Audit

- [x] 4.1 Run `grep -i "svelte" CLAUDE.md` — review each match. The `useSpring` description mentions "Svelte spring ODE" as prior art context; this is intentional and should stay. Remove any remaining references to `ui-svelte/` or SvelteKit as active technology. **Verify:** no references to `ui-svelte/` remain; `useSpring` ODE description is preserved.

## 5. Active OpenSpec Specs — Svelte Reference Updates

- [x] 5.1 Update `openspec/specs/hover-tilt/spec.md` — add a `## React Implementation` section documenting the `HoverTilt.tsx` component (mouse-enter/leave + mousemove events, CSS custom properties, `useSpring` hook). Mark any Svelte-specific sections with a note. **Verify:** `grep -i "svelte" openspec/specs/hover-tilt/spec.md` returns only clearly-labelled historical notes (if any).
- [x] 5.2 Update `openspec/specs/card-holo-effects/spec.md` — add `## React Implementation` documenting the `Card.tsx` three-layer system (`useSpring`, JS-computed CSS vars, `.card__shine`/`.card__glare` overlays, `data-rarity` selectors). **Verify:** `grep -i "svelte" openspec/specs/card-holo-effects/spec.md` returns only labelled historical notes.
- [x] 5.3 Update `openspec/specs/react-spring-hook/spec.md` — confirm the spec describes the `useSpring` React hook; update any Svelte spring() references to describe them as prior art with a clear label. **Verify:** spec accurately describes the shipped React hook.
- [x] 5.4 Update `openspec/specs/react-component-library/spec.md` — remove or annotate any `.svelte` component references; ensure all examples reference `.tsx` components. **Verify:** no bare `.svelte` extension references remain.
- [x] 5.5 Update `openspec/specs/nextjs-routing/spec.md` — remove or annotate any SvelteKit route patterns (`+page.svelte`, `+layout.server.ts`). **Verify:** `grep -i "sveltekit\|+page\|+layout" openspec/specs/nextjs-routing/spec.md` returns no matches.
- [x] 5.6 Update `openspec/specs/collection-add-proxy/spec.md` — replace any `+server.ts` SvelteKit proxy references with `ui/src/app/api/*/route.ts` Next.js Route Handler pattern. **Verify:** spec describes the Next.js proxy approach.
- [x] 5.7 Update `openspec/specs/chase-cards/spec.md` — remove or annotate Svelte store patterns. **Verify:** `grep -i "svelte" openspec/specs/chase-cards/spec.md` returns only labelled historical notes.
- [x] 5.8 Update `openspec/specs/k3s-deployment/spec.md` — replace any `ui-svelte` image name or SvelteKit build step references with the `ui` (Next.js) image. **Verify:** `grep -i "svelte" openspec/specs/k3s-deployment/spec.md` returns no matches.

## 6. Docs Updates

- [x] 6.1 Update `docs/tech-stack.md` — replace SvelteKit frontend entry with Next.js 14 App Router. **Verify:** `grep -i "sveltekit" docs/tech-stack.md` returns no matches.
- [x] 6.2 Update `docs/k3s-deployment-guide.md` — replace any SvelteKit image/service references with the Next.js equivalent. **Verify:** `grep -i "svelte" docs/k3s-deployment-guide.md` returns no matches.

## 7. Final Verification

- [x] 7.1 Run `bun run lint` from repo root — zero errors. **Verify:** exits 0.
- [x] 7.2 Run `bun run test` in `server/` and `ui/` — same pass count as §1.1. **Verify:** both exit 0.
- [x] 7.3 Run `npm run check` in `ui/` — zero TypeScript errors. **Verify:** exits 0.
- [x] 7.4 Run `grep -ri "svelte" .gitignore eslint.config.mjs README.md CLAUDE.md docs/ openspec/specs/ --include="*.md" --include="*.mjs" --include="*.json" | grep -v "archive/" | grep -v "realtime-ws-prior-art" | grep -v "svelte-leftover-cleanup" | grep -v "svelte-cleanup"` — review each remaining match; confirm all are either labelled prior-art historical notes or the `useSpring` ODE description. **Verify:** no unexplained Svelte references.
- [x] 7.5 Run `security-secure-coding` skill — no findings expected (no code changes). **Verify:** clean.
- [x] 7.6 Push branch `feature/svelte-leftover-cleanup` and open PR via `gh pr create`. **Verify:** `gh pr status` shows PR open.
