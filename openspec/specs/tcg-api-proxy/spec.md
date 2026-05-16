## Requirements

### Requirement: Secure proxy endpoint
The backend SHALL provide a proxy endpoint for card search requests and MUST keep all upstream API calls server-side. The upstream data source is TCGdex, accessed via GraphQL.

#### Scenario: Proxy request via GraphQL
- **WHEN** the frontend requests card search data through `/api/cards/search`
- **THEN** the backend sends a GraphQL POST to `https://api.tcgdex.net/v2/graphql` server-side (no API key required for TCGdex GraphQL)
- **THEN** the backend returns the mapped card list to the frontend with the same response shape as before

### Requirement: Error handling
The proxy endpoint SHALL return a controlled error response when the upstream GraphQL call fails or returns errors.

#### Scenario: Upstream GraphQL error
- **WHEN** TCGdex returns a GraphQL `errors` array in the response body
- **THEN** the proxy responds with HTTP 502 and a structured error payload

#### Scenario: Upstream network failure
- **WHEN** the fetch to `https://api.tcgdex.net/v2/graphql` times out or throws a network error
- **THEN** the proxy responds with HTTP 502 and a structured error payload for the UI
