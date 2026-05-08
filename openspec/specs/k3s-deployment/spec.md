## ADDED Requirements

### Requirement: Service Dockerfiles
The project SHALL include Dockerfiles for the SvelteKit UI and Hono API services suitable for k3s deployment.

#### Scenario: Building service images
- **WHEN** the Docker build commands are executed
- **THEN** each service image builds successfully

### Requirement: Umbrella Helm chart
The project SHALL include a Helm umbrella chart that deploys UI, API, and database components.

#### Scenario: Helm install
- **WHEN** `helm install` is run with provided values
- **THEN** UI, API, and database workloads are created

### Requirement: Traefik ingress
The Helm chart SHALL configure Traefik ingress for UI and API access in local and production domains.

#### Scenario: Ingress routing
- **WHEN** the ingress is applied
- **THEN** requests route to the correct UI and API services
