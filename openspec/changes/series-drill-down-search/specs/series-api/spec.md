## ADDED Requirements

### Requirement: Series list endpoint
The backend SHALL expose `GET /api/series` returning an array of all TCGdex series, each with `id`, `name`, `logo` (or empty string), and `releaseDate` (or empty string), sorted by `releaseDate` descending. Series without a release date SHALL appear at the end, sorted alphabetically by name.

#### Scenario: Successful response
- **WHEN** `GET /api/series` is called
- **THEN** the response is HTTP 200 with a non-empty JSON array where each item contains `id`, `name`, `logo`, and `releaseDate`

#### Scenario: Sorted newest first
- **WHEN** `GET /api/series` is called
- **THEN** series with known release dates appear before those without, and among dated series the most recently released appears first

#### Scenario: In-memory cache hit
- **WHEN** `GET /api/series` is called twice within the 24-hour TTL
- **THEN** only one upstream request is made; the second response is served from cache

#### Scenario: Upstream failure
- **WHEN** the TCGdex API returns a non-200 response or times out
- **THEN** the endpoint returns HTTP 502 with `{ "error": "..." }`

### Requirement: Series detail endpoint
The backend SHALL expose `GET /api/series/:id` returning a single series object with `id`, `name`, `logo`, `releaseDate`, and a `sets` array. Each set in the array SHALL include `id`, `name`, `logo` (or empty string), and `cardCount`.

#### Scenario: Valid series id
- **WHEN** `GET /api/series/sv` is called
- **THEN** the response is HTTP 200 with a series object whose `sets` array is non-empty and each set has at minimum `id` and `name`

#### Scenario: Unknown series id
- **WHEN** `GET /api/series/nonexistent` is called
- **THEN** the response is HTTP 404 with `{ "error": "Series not found" }`

#### Scenario: In-memory cache hit
- **WHEN** `GET /api/series/:id` is called twice within the 24-hour TTL
- **THEN** only one upstream request is made for that series id

### Requirement: SvelteKit proxy for series
The SvelteKit layer SHALL expose `GET /api/series` and `GET /api/series/[id]` that forward requests to the Hono backend and return the response unchanged.

#### Scenario: Proxy forwards correctly
- **WHEN** the UI calls `/api/series`
- **THEN** the SvelteKit route returns the same status code and body as the Hono backend
