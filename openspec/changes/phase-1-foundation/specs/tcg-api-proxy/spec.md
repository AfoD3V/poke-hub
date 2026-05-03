## ADDED Requirements

### Requirement: Secure proxy endpoint
The backend SHALL provide proxy endpoints for pokemontcg.io requests and MUST keep API keys server-side.

#### Scenario: Proxy request
- **WHEN** the frontend requests card search data through the proxy
- **THEN** the backend forwards the request to pokemontcg.io using a server-side API key

### Requirement: Error handling
The proxy endpoint SHALL return a controlled error response when the upstream API fails or times out.

#### Scenario: Upstream failure
- **WHEN** pokemontcg.io returns an error
- **THEN** the proxy responds with a non-200 status and an error payload for the UI
