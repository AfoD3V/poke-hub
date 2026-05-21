## Why

SvelteKit covers current needs but React's ecosystem — particularly React Three Fiber, Framer Motion, and a far larger pool of animation libraries — offers a significantly richer long-term path for the premium card effects that define PokeHub's identity. The migration also opens the door to 3D card flips, shader-based holo, and shared component libraries from the broader React community.

## What Changes

- **BREAKING** Replace `ui/` (SvelteKit + adapter-node) with `ui-react/` (Next.js 14 App Router + adapter-node-equivalent via `next start`)
- Introduce a custom `useSpring` hook that mirrors Svelte's `spring()` physics API exactly — this is the visual-parity contract for the holographic card effect
- Extract all Svelte `<style>` blocks to CSS Modules (`.module.css`) so every selector, CSS custom property, and rarity effect is preserved verbatim
- Port all 7 Svelte components to React functional components
- Port all SvelteKit file-based routes to Next.js App Router equivalents
- Port SvelteKit form actions (auth) to Next.js Server Actions
- Port `+server.ts` API proxy routes to Next.js Route Handlers
- Update `ui/Dockerfile` and `docker-compose.yml` to target the Next.js build
- All other services (`server/`, `shared/`, DB, Redis) are **unchanged**

## Capabilities

### New Capabilities

- `nextjs-app-setup`: Bootstrap Next.js 14 App Router project with TypeScript, CSS Modules, `$shared` alias, Dockerfile, and Docker Compose integration running in parallel with existing `ui/` on a separate port
- `react-spring-hook`: Custom `useSpring(initialValue, config)` hook with identical physics to Svelte's `spring()` — stiffness, damping, soft-set, and reactive updates — validated by unit tests and visual parity screenshots
- `react-component-library`: All 7 Svelte components ported to React with CSS Modules; holographic Card effect and HoverTilt are highest-fidelity priority
- `nextjs-routing`: App Router directory structure mirroring every SvelteKit route including route groups, layouts, Server Components for data loading, and protected route middleware
- `nextjs-auth-flow`: Server Actions + Next.js `cookies()` API for JWT HttpOnly cookie auth, replicating the SvelteKit `Set-Cookie` forwarding pattern

### Modified Capabilities

- `auth-system`: Same JWT/cookie requirements; implementation switches from SvelteKit form actions to Next.js Server Actions — behavioral contract unchanged
- `card-holo-effects`: Same visual and interaction requirements; implementation switches from `svelte/motion` springs to `useSpring` hook — CSS layer unchanged
- `hover-tilt`: Same 3D tilt requirements; implementation switches from Svelte `spring()` to `useSpring` hook
- `app-shell`: Same sidebar + layout shell requirements; implementation switches from SvelteKit route groups to Next.js route groups
- `home-dashboard`: Same tab/panel/card grid requirements; data loading switches from `+page.server.ts` to Next.js Server Components

## Impact

- `ui/` directory: replaced by `ui-react/` (old dir kept until cutover validated)
- `docker-compose.yml`: `ui` service updated to build from `ui-react/Dockerfile`
- `shared/`: no changes — TypeScript types reused as-is
- `server/`: no changes — Hono API is frontend-agnostic
- CI/CD: Docker build context path updated; all other pipeline steps unchanged
- k3s Helm chart: container image name unchanged; no manifest changes needed
