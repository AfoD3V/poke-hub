## MODIFIED Requirements

### Requirement: API proxy route handlers mirror all +server.ts files
`ui/src/app/api/` SHALL contain Next.js Route Handlers (`.../route.ts`) for every `+server.ts` API proxy:

- `app/api/cards/[id]/route.ts`
- `app/api/cards/search/route.ts`
- `app/api/cards/by-set/route.ts`
- `app/api/series/route.ts`
- `app/api/series/[id]/route.ts`
- `app/api/sets/[id]/cards/route.ts`
- `app/api/chase/add/route.ts`
- `app/api/chase/remove/route.ts`
- `app/api/collection/add/route.ts`

Each route handler SHALL forward the incoming request (including the `cookie` header) to `API_BASE_URL` (env var) and return the upstream response body and status. On network error, it SHALL return `{ error: "upstream unavailable" }` with status 502.

#### Scenario: Card search proxied correctly
- **WHEN** the client fetches `/api/cards/search?q=pikachu`
- **THEN** the route handler forwards to `API_BASE_URL/api/cards/search?q=pikachu` and returns the Hono response

#### Scenario: Cookie forwarded to backend
- **WHEN** the client fetches an authenticated proxy route
- **THEN** the upstream request from the route handler includes the `cookie` header from the original client request

#### Scenario: 502 returned on backend unavailable
- **WHEN** `API_BASE_URL` is unreachable
- **THEN** the route handler returns HTTP 502 with a JSON error body

### Requirement: Data loading uses Server Components (not getServerSideProps)
`(app)/home/page.tsx`, `(app)/search/page.tsx`, and `(app)/collection/page.tsx` SHALL be async Server Components that fetch data directly from `API_BASE_URL` (forwarding the `Cookie` header from Next.js `headers()`) — replacing SvelteKit's `+page.server.ts` load functions.

#### Scenario: Home page renders collection stats server-side
- **WHEN** an authenticated user visits `/home`
- **THEN** collection stats are rendered in the initial HTML (not fetched client-side after mount)
