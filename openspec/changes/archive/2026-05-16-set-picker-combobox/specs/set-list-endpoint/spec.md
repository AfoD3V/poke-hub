## ADDED Requirements

### Requirement: Sets list endpoint
The backend SHALL expose `GET /api/sets` returning an array of set objects sorted by `releaseDate` descending. Each object SHALL include `id`, `name`, `abbreviation` (the official printed code or empty string if absent), `cardCount`, and `releaseDate`.

#### Scenario: Successful response
- **WHEN** `GET /api/sets` is called
- **THEN** the response is HTTP 200 with `Content-Type: application/json` and a non-empty array of set objects, each containing at minimum `id` and `name`

#### Scenario: Response includes abbreviation
- **WHEN** `GET /api/sets` is called
- **THEN** sets that have an official abbreviation (e.g. the 151 set) return it in the `abbreviation` field (e.g. `"MEW"`)

#### Scenario: Response is sorted newest first
- **WHEN** `GET /api/sets` is called
- **THEN** sets are ordered by `releaseDate` descending so the most recent set appears first

#### Scenario: In-memory cache is used on repeated calls
- **WHEN** `GET /api/sets` is called twice within the 24-hour TTL
- **THEN** only one upstream GraphQL request is made; the second response is served from cache

#### Scenario: Upstream failure
- **WHEN** the TCGdex GraphQL endpoint returns a non-200 response or times out
- **THEN** the endpoint returns HTTP 502 with `{ "error": "..." }`

### Requirement: SvelteKit proxy for sets
The SvelteKit layer SHALL expose `GET /api/sets` that forwards the request to the Hono backend and returns the response unchanged.

#### Scenario: Successful proxy
- **WHEN** the UI calls `/api/sets`
- **THEN** the SvelteKit route returns the same status code and body as the Hono backend
