## ADDED Requirements

### Requirement: SvelteKit proxy endpoint for add-to-collection
The system SHALL provide a SvelteKit server endpoint at `POST /api/collection/add` that proxies requests to the Hono backend using `API_BASE_URL`, forwarding the browser's `cookie` header for authentication. This endpoint MUST return JSON in all cases (success and error) so that `CardModal.svelte` can parse the response without receiving HTML.

#### Scenario: Successful proxy to Hono backend
- **WHEN** an authenticated user POSTs `{ cardId, card }` to `/api/collection/add`
- **THEN** the SvelteKit endpoint forwards the request to `API_BASE_URL/api/collection/add` with the cookie header, and returns the Hono response body and status code verbatim

#### Scenario: Unauthenticated request returns JSON 401
- **WHEN** a request without a valid auth cookie is sent to `/api/collection/add`
- **THEN** the Hono backend returns `{ error: "Unauthorized" }` with status 401, and the proxy endpoint forwards this JSON response (not HTML)

#### Scenario: Hono backend unreachable returns JSON 502
- **WHEN** the Hono backend is unavailable
- **THEN** the SvelteKit endpoint returns `{ error: "Backend unavailable" }` with status 502 as JSON
