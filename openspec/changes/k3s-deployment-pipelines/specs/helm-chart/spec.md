## ADDED Requirements

### Requirement: Umbrella Helm chart deploys all workloads
The repository SHALL contain a Helm umbrella chart at `charts/pokehub/` that, when installed, creates Deployments and Services for the API and UI, and optionally the PostgreSQL database.

#### Scenario: Helm install succeeds on a k3s cluster
- **WHEN** `helm install pokehub ./charts/pokehub -f values.local.yaml` is run against a running k3s cluster
- **THEN** all pods SHALL reach `Running` status within 2 minutes

#### Scenario: Helm lint passes
- **WHEN** `helm lint ./charts/pokehub` is run
- **THEN** the command SHALL exit with code 0 and report no errors

### Requirement: Secrets are injected from a Kubernetes Secret
The chart SHALL create a `pokehub-secrets` Kubernetes Secret from Helm values. API and UI Deployments SHALL reference this Secret for environment variables (`DATABASE_URL`, `JWT_SECRET`).

#### Scenario: Pods receive secret environment variables
- **WHEN** the chart is installed with valid secret values
- **THEN** the API pod SHALL have `DATABASE_URL` and `JWT_SECRET` available as environment variables

### Requirement: PostgreSQL dependency is toggleable
The chart SHALL support `postgresql.enabled: true` (deploy Bitnami PostgreSQL as a sub-chart) and `postgresql.enabled: false` with `externalDatabase.url` pointing to an external instance.

#### Scenario: External DB mode
- **WHEN** the chart is installed with `postgresql.enabled=false` and a valid `externalDatabase.url`
- **THEN** no PostgreSQL pod SHALL be created and the API SHALL connect to the external DB
