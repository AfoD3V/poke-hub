## ADDED Requirements

### Requirement: Set cards list endpoint
The backend SHALL expose `GET /api/sets/:id/cards` returning a lightweight array of cards in the given set. Each card SHALL include `id`, `name`, `localId`, and `image` (base URL without extension). The array SHALL be ordered by `localId` ascending (natural card number order within the set).

#### Scenario: Valid set id
- **WHEN** `GET /api/sets/sv03.5/cards` is called
- **THEN** the response is HTTP 200 with a non-empty array where each item has `id`, `name`, `localId`, and `image`

#### Scenario: Unknown set id
- **WHEN** `GET /api/sets/nonexistent/cards` is called
- **THEN** the response is HTTP 404 with `{ "error": "Set not found" }`

#### Scenario: In-memory cache hit
- **WHEN** `GET /api/sets/:id/cards` is called twice within the 24-hour TTL
- **THEN** only one upstream request is made for that set id

#### Scenario: Upstream failure
- **WHEN** the TCGdex API returns a non-200 response or times out
- **THEN** the endpoint returns HTTP 502 with `{ "error": "..." }`

### Requirement: SvelteKit proxy for set cards
The SvelteKit layer SHALL expose `GET /api/sets/[id]/cards` that forwards the request to the Hono backend and returns the response unchanged.

#### Scenario: Proxy forwards correctly
- **WHEN** the UI calls `/api/sets/sv03.5/cards`
- **THEN** the SvelteKit route returns the same status code and body as the Hono backend
