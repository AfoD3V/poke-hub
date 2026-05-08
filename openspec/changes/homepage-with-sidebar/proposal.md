## Why

PokeHub has a growing set of features (search, collection) but no unified app shell — each page duplicates its own inline navbar and there is no entry point after login. A persistent sidebar layout and a proper home dashboard will provide coherent navigation, surface key stats at a glance, and make adding future sections trivial.

## What Changes

- Replace the duplicated per-page top-navbars with a single shared sidebar layout
- Add a `/home` route that acts as the post-login landing page (replacing the current `/search` redirect)
- Update the root redirect so authenticated users land on `/home`
- Sidebar contains: PokeHub branding, nav links (Home, Search, Collection), and a bottom user/logout section
- Home dashboard shows collection stats (total cards, unique Pokémon) and quick-action entry points

## Capabilities

### New Capabilities
- `app-shell`: Persistent sidebar layout wrapping all authenticated routes with navigation and user controls
- `home-dashboard`: Post-login landing page with collection summary stats and quick-action cards

### Modified Capabilities
- `collection-management`: Remove the inline navbar from the collection page (navigation moves to sidebar)

## Impact

- `ui/src/routes/+layout.svelte` — add authenticated app-shell layout with sidebar
- `ui/src/routes/+page.server.ts` — redirect authenticated users to `/home` instead of `/search`
- `ui/src/routes/home/+page.svelte` + `+page.server.ts` — new home dashboard route
- `ui/src/routes/search/+page.svelte` — remove inline navbar
- `ui/src/routes/collection/+page.svelte` — remove inline navbar
- `ui/src/lib/components/Sidebar.svelte` — new shared sidebar component
- No backend/API changes required; dashboard stats are derived from existing collection endpoint
