## Context

PokeHub's frontend is currently SvelteKit with adapter-node SSR. The holographic card effect (`Card.svelte`) is the most visually sensitive component — it uses Svelte's built-in `spring()` motion stores for physics-based cursor tracking, and ~560 lines of scoped CSS for per-rarity holo effects. Everything else (auth, routing, data loading) follows SvelteKit conventions that have direct Next.js equivalents.

The backend (`server/` — Hono on Bun) is completely unaffected. The `shared/` TypeScript types are reused as-is. Infrastructure (Docker Compose, k3s, GitHub Actions) requires only build-path changes.

**Current UI surface:**
- 7 Svelte components (`Card`, `HoverTilt`, `CardModal`, `Toast`, `Sidebar`, `LanguageSelector`, `SeriesBrowser`)
- 14 routes across 3 layout groups (root, `auth/`, `(app)/`)
- 8 API proxy route handlers (`+server.ts` files forwarding to Hono)
- Auth: SSR form actions with HttpOnly JWT cookie

## Goals / Non-Goals

**Goals:**
- Pixel-accurate visual parity with current SvelteKit UI — especially card holo effects and hover tilt
- Atomic, independently-validatable migration tasks
- Zero changes to `server/`, `shared/`, Docker infrastructure (except build paths)
- Parallel operation: new Next.js app runs on port 4001 until cutover; existing `ui/` untouched
- All existing tests pass on the new stack; no net reduction in coverage

**Non-Goals:**
- Adding new features or visual enhancements during migration
- Converting to Tailwind CSS (stay with CSS Modules for 1:1 style parity)
- React Native or any non-web target
- Changing the authentication mechanism (JWT/HttpOnly stays identical)

## Decisions

### D1: Next.js 14 App Router (not bare Vite + React)

**Chosen:** Next.js 14 with App Router.

SvelteKit's mental model maps almost 1:1:

| SvelteKit | Next.js App Router |
|---|---|
| `+page.server.ts` (load) | `page.tsx` as async Server Component |
| `+layout.svelte` | `layout.tsx` |
| `+page.server.ts` (actions) | Server Actions (`'use server'`) |
| `+server.ts` | Route Handlers (`route.ts`) |
| Route groups `(app)/` | Route groups `(app)/` |
| `hooks.server.ts` | `middleware.ts` |

**Alternatives considered:**
- *Vite + React SPA*: Loses SSR; the `Set-Cookie` cookie-forwarding auth pattern requires a server. Would need a separate proxy layer.
- *Remix*: Similar capability to Next.js but smaller ecosystem and less community momentum for the animation libraries that motivated this migration.

### D2: CSS Modules (not Tailwind, not styled-components)

**Chosen:** Each Svelte component's `<style>` block is extracted verbatim into a `ComponentName.module.css` file.

The holographic effect CSS relies on: CSS custom properties, `data-*` attribute selectors, `::before`/`::after` pseudo-elements, `mix-blend-mode`, `clip-path`, and complex multi-layer `background-image` with `background-blend-mode`. These are all valid CSS Modules. Zero refactoring of selectors needed.

**Alternatives considered:**
- *Tailwind*: Cannot express the holo rarity selectors (`[data-rarity="rare holo"] .card__shine`) or multi-layer background stacks without large amounts of arbitrary-value utilities and `@apply` hacks. High visual regression risk.
- *Styled-components / Emotion*: CSS-in-JS adds runtime overhead and complicates SSR streaming. No benefit over CSS Modules for this use case.

### D3: Custom `useSpring` hook mirroring Svelte's `spring()` API

**Chosen:** Build a `useSpring<T>(initialValue: T, config: SpringConfig): [T, SetSpring<T>]` hook using `requestAnimationFrame` with the same damped-spring ODE that Svelte uses internally.

The holo Card and HoverTilt components use spring stores with specific `stiffness`/`damping` pairs (`{ stiffness: 0.066, damping: 0.25 }` and `{ stiffness: 0.01, damping: 0.06 }`). Replicating the identical differential equation is what makes the physics feel the same — not just "springy".

The Svelte spring ODE is: `velocity += (target - value) * stiffness; velocity *= (1 - damping); value += velocity`. This runs per-frame.

**Alternatives considered:**
- *react-spring / @react-spring/web*: Different physics model (tension/friction), would require re-tuning all constants by feel rather than by formula — high visual regression risk.
- *Framer Motion `useSpring`*: Same problem — different physics model. Also adds ~30 KB to bundle.
- *CSS `transition` with `cubic-bezier`*: Cannot express the pointer-tracking updates (value changes every pointermove frame), not a valid substitute.

### D4: Parallel build in `ui-react/` directory

**Chosen:** New Next.js app lives in `ui-react/` with its own `package.json` and `Dockerfile`. Docker Compose adds a temporary `ui-react` service on port 4001. Cutover happens in a single commit that renames `ui-react/` to `ui/` and updates `docker-compose.yml`.

**Alternatives considered:**
- *In-place replacement of `ui/`*: Risky — breaks the running app for the entire duration of the migration. Impossible to validate components in isolation.
- *Feature flags / gradual route migration*: Complex to maintain; the SvelteKit and Next.js routing conventions are incompatible at the file-system level.

### D5: `middleware.ts` for auth guard (replaces SvelteKit `+layout.server.ts`)

**Chosen:** Next.js `middleware.ts` reads the JWT cookie and redirects unauthenticated requests to `/auth/login` for all `(app)/` routes. This runs at the edge before any component renders — identical protection to SvelteKit's `+layout.server.ts` load guard.

### D6: Server Actions for auth (login, register, logout)

**Chosen:** Auth form submissions use Next.js Server Actions (`'use server'`). The Server Action calls the Hono API, receives the `Set-Cookie` header, and sets it via `cookies().set()` — the same manual extraction pattern documented in `CLAUDE.md` for SvelteKit.

## Risks / Trade-offs

**[Risk] `useSpring` physics divergence feels different** → Mitigation: Implement the exact Svelte ODE; add a visual regression Playwright screenshot test comparing the React Card against a reference screenshot of the Svelte Card at the same cursor position. Block cutover on screenshot diff < 1% threshold.

**[Risk] CSS Module class name hashing breaks `data-*` attribute selectors** → Mitigation: CSS Modules do not hash `data-*` attribute selectors or pseudo-elements — only class names (`.card__shine`) are hashed. The `data-rarity` selectors in the holo CSS target the data attribute, not a class, so they work without changes. Verified: `[data-rarity="rare holo"] .card__shine` → only `.card__shine` is hashed; the attribute selector remains literal.

**[Risk] Next.js streaming SSR breaks HttpOnly cookie forwarding** → Mitigation: Auth pages use `'use server'` actions (not streaming) and `cookies()` from `next/headers`, which is the correct Next.js 14 API for this pattern.

**[Risk] Parallel port (4001) confusion during development** → Mitigation: Clear `docker-compose.yml` comment marks the `ui-react` service as temporary. Cutover commit removes it.

**[Risk] `$shared` alias not resolved in Next.js** → Mitigation: Add `paths: { "$shared/*": ["../shared/*"] }` to `ui-react/tsconfig.json`. Unlike SvelteKit, Next.js does not auto-generate aliases, so this must be explicit. Test with `tsc --noEmit` after setup.

## Migration Plan

1. **Bootstrap** (`ui-react/` created, Docker service on 4001) — zero user-visible change
2. **Spring hook** (unit-tested, visual reference screenshots taken from current Svelte app)
3. **CSS extraction** (all `.module.css` files created, linted)
4. **Components** (ported one-by-one, each validated in isolation via test page at `/dev/components`)
5. **Routes** (ported in order: auth → home → search → collection → admin)
6. **API proxy routes** (ported `+server.ts` → `route.ts`)
7. **Auth flow** (Server Actions, cookie handling, middleware guard)
8. **Visual regression** (Playwright screenshot comparison of all pages)
9. **Cutover** (`ui-react/` → `ui/`, Docker Compose updated, `ui-react` service removed)
10. **Cleanup** (old `ui/` deleted, CI paths updated)

**Rollback:** Until the cutover commit, the original `ui/` is untouched and `docker-compose.yml` can be reverted to the previous `ui` service build path in one line.

## Open Questions

- None blocking. Framework choices (Next.js, CSS Modules, custom spring hook) are resolved above.
