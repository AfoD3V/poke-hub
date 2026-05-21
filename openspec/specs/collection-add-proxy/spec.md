## Requirements

### Requirement: Next.js Route Handler proxy for add-to-collection
The system SHALL provide a Next.js Route Handler at `ui/src/app/api/collection/add/route.ts` (`POST /api/collection/add`) that proxies requests to the Hono backend using `API_BASE_URL`, forwarding the browser's `cookie` header for authentication. This endpoint MUST return JSON in all cases (success and error) so that `CardModal.tsx` can parse the response without receiving HTML.

#### Scenario: Successful proxy to Hono backend
- **WHEN** an authenticated user POSTs `{ cardId, card }` to `/api/collection/add`
- **THEN** the Route Handler forwards the request to `API_BASE_URL/api/collection/add` with the cookie header, and returns the Hono response body and status code verbatim

#### Scenario: Unauthenticated request returns JSON 401
- **WHEN** a request without a valid auth cookie is sent to `/api/collection/add`
- **THEN** the Hono backend returns `{ error: "Unauthorized" }` with status 401, and the proxy Route Handler forwards this JSON response (not HTML)

#### Scenario: Hono backend unreachable returns JSON 502
- **WHEN** the Hono backend is unavailable
- **THEN** the Route Handler returns `{ error: "Backend unavailable" }` with status 502 as JSON
