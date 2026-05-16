## Why

The current Card Search has a fundamental discoverability problem: users must already know the exact card name or set ID to find anything. There is no way to browse the collection hierarchy the way physical collectors think — starting from a series (e.g. "Scarlet & Violet"), drilling into a set (e.g. "151"), and seeing all cards in that set. Additionally, the name search silently forces English, making the app unusable for collectors who know Pokémon by their Japanese or French names.

## What Changes

- **Tab 1 — By Name** gains a language selector (English, Japanese, French, German, Portuguese, Spanish, Italian). Each language routes the search to the corresponding TCGdex language endpoint (`/v2/{lang}/...`).
- **Tab 2 — By Series** replaces the "By Set & Number" tab with a three-column animated drill-down:
  - **Column 1**: Full-width grid of all series (21 total), each as a logo tile + name, sorted by `releaseDate` descending (fetched individually from series detail). Falls back to alphabetical if release dates unavailable.
  - **Column 2**: Appears after selecting a series; shows all sets in that series as logo tiles (with set logo + name + card count), sorted newest-first.
  - **Column 3**: Appears after selecting a set; shows all cards in that set rendered as holographic `Card` components, paginated at 40 per page.
  - Columns animate left on drill-down; breadcrumb navigation lets the user step back to any level.
- New backend endpoints: `GET /api/series`, `GET /api/series/:id` (with sets), `GET /api/sets/:id/cards`.
- All three new endpoints use 24h in-memory cache (same pattern as existing sets cache).
- SSR pre-fetches the series list on every search page load so Column 1 renders without a client-side waterfall.

## Capabilities

### New Capabilities

- `series-browser`: Three-column animated drill-down UI — series grid → set grid → card grid, with breadcrumb back navigation and slide animations.
- `series-api`: Backend routes `GET /api/series` and `GET /api/series/:id` returning series metadata and their sets, with 24h in-memory cache.
- `set-cards-api`: Backend route `GET /api/sets/:id/cards` returning the lightweight card list (id, name, localId, image) for a set, with 24h in-memory cache.
- `language-aware-card-search`: Name-search tab extended with a language selector; search queries are routed to the TCGdex endpoint for the chosen language.

### Modified Capabilities

- `holographic-search-ui`: The two existing search modes ("By Name" and "By Set & Number") are replaced by "By Name" (language-aware) and "By Series" (drill-down browser). The By Set & Number form and SetPicker component are removed.

## Impact

- **Backend**: 3 new Hono route handlers + 3 new service functions in `tcg-proxy.ts`; 3 new cache objects following existing pattern; new shared types `SeriesItem`, `SeriesDetail`, `SetCardItem`.
- **Frontend**: New `SeriesBrowser.svelte` page-level component replacing the set-mode form; search page server load updated to pre-fetch series; `SetPicker.svelte` and `/api/sets` proxy removed; new SvelteKit proxy routes `/api/series` and `/api/sets/[id]/cards`.
- **No DB changes**, no auth changes, no breaking changes to `GET /api/cards/search` or `GET /api/cards/by-set`.
