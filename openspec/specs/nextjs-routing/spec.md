## ADDED Requirements

### Requirement: App Router directory structure mirrors every SvelteKit route
`ui/src/app/` SHALL contain the following routes, matching the SvelteKit structure 1:1:

| SvelteKit route | Next.js App Router route |
|---|---|
| `routes/+page.server.ts` (redirect) | `app/page.tsx` (Server Component redirect) |
| `routes/auth/login/+page.svelte` | `app/auth/login/page.tsx` |
| `routes/auth/register/+page.svelte` | `app/auth/register/page.tsx` |
| `routes/(app)/home/+page.svelte` | `app/(app)/home/page.tsx` |
| `routes/(app)/search/+page.svelte` | `app/(app)/search/page.tsx` |
| `routes/(app)/collection/+page.svelte` | `app/(app)/collection/page.tsx` |
| `routes/(app)/admin/+page.svelte` | `app/(app)/admin/page.tsx` |
| `routes/(app)/admin/users/+page.svelte` | `app/(app)/admin/users/page.tsx` |
| `routes/(app)/admin/users/[id]/+page.svelte` | `app/(app)/admin/users/[id]/page.tsx` |
| `routes/(app)/admin/cache/+page.svelte` | `app/(app)/admin/cache/page.tsx` |

#### Scenario: All routes return 200 for authenticated requests
- **WHEN** a Playwright session with a valid auth cookie navigates to each (app)/ route
- **THEN** each page returns HTTP 200 and renders its content

#### Scenario: Auth routes return 200 without auth cookie
- **WHEN** a Playwright session without an auth cookie navigates to `/auth/login`
- **THEN** the page returns HTTP 200 and renders the login form

### Requirement: Route group (app) wraps authenticated pages with Sidebar layout
`app/(app)/layout.tsx` SHALL render the `<Sidebar>` component and a `<main>` content area. `app/auth/` routes SHALL NOT be inside the `(app)` group and SHALL NOT render the Sidebar.

#### Scenario: Sidebar present on /home
- **WHEN** Playwright navigates to `/home` (authenticated)
- **THEN** the Sidebar component is in the rendered DOM

#### Scenario: Sidebar absent on /auth/login
- **WHEN** Playwright navigates to `/auth/login`
- **THEN** no Sidebar element is in the rendered DOM

### Requirement: Root page redirects based on auth state
`app/page.tsx` SHALL redirect authenticated users to `/home` and unauthenticated users to `/auth/login`. The redirect SHALL be a server-side redirect (HTTP 307/308), not a client-side navigation.

#### Scenario: Authenticated user redirected to /home
- **WHEN** a user with a valid JWT cookie visits `/`
- **THEN** they receive a server redirect to `/home`

#### Scenario: Unauthenticated user redirected to /auth/login
- **WHEN** a user without a JWT cookie visits `/`
- **THEN** they receive a server redirect to `/auth/login`

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

### Requirement: middleware.ts protects (app) routes
`ui/src/middleware.ts` SHALL intercept all requests to paths matching `/(app)/*` pattern and redirect unauthenticated requests (no valid JWT cookie) to `/auth/login`. The JWT cookie name SHALL match the Hono backend's cookie name (`pokehub_session`).

#### Scenario: Unauthenticated access to protected route redirected
- **WHEN** a request to `/home` has no `pokehub_session` cookie
- **THEN** the middleware redirects to `/auth/login`

#### Scenario: Authenticated access to protected route passes through
- **WHEN** a request to `/home` has a valid `pokehub_session` cookie
- **THEN** the middleware allows the request to proceed

### Requirement: Data loading uses Server Components (not getServerSideProps)
`(app)/home/page.tsx`, `(app)/search/page.tsx`, and `(app)/collection/page.tsx` SHALL be async Server Components that fetch data directly from `API_BASE_URL` (forwarding the `Cookie` header from Next.js `headers()`) — replacing SvelteKit's `+page.server.ts` load functions.

#### Scenario: Home page renders collection stats server-side
- **WHEN** an authenticated user visits `/home`
- **THEN** collection stats are rendered in the initial HTML (not fetched client-side after mount)
