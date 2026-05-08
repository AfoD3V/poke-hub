## ADDED Requirements

### Requirement: Traefik IngressRoute exposes the UI on pokehub.local
The chart SHALL create a Traefik `IngressRoute` CRD that routes HTTP traffic for `pokehub.local` to the UI Service on port 3000.

#### Scenario: UI reachable via local domain
- **WHEN** `/etc/hosts` maps `pokehub.local` to the k3s node IP and the chart is installed
- **THEN** `curl -L http://pokehub.local` SHALL return the SvelteKit app HTML

### Requirement: Traefik IngressRoute exposes the API on api.pokehub.local
The chart SHALL create a Traefik `IngressRoute` CRD that routes HTTP traffic for `api.pokehub.local` to the API Service on port 3000, including WebSocket upgrade support.

#### Scenario: API reachable via local domain
- **WHEN** `/etc/hosts` maps `api.pokehub.local` to the k3s node IP and the chart is installed
- **THEN** `curl http://api.pokehub.local/health` SHALL return HTTP 200

#### Scenario: WebSocket connections are proxied
- **WHEN** a client opens `ws://api.pokehub.local/ws`
- **THEN** the WebSocket handshake SHALL complete successfully through Traefik

### Requirement: Ingress routes are configurable via Helm values
The hostnames (`pokehub.local`, `api.pokehub.local`) SHALL be overridable through `values.yaml` so the chart can be deployed to different environments without modifying templates.

#### Scenario: Custom hostname via values
- **WHEN** the chart is installed with `ingress.ui.host=pokehub.example.com`
- **THEN** the IngressRoute SHALL use `pokehub.example.com` as the match rule
