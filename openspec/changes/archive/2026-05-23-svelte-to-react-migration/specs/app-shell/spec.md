## MODIFIED Requirements

### Requirement: Authenticated layout uses route group isolation
The Sidebar layout SHALL only wrap routes inside the `(app)` Next.js route group (`app/(app)/layout.tsx`); auth routes (`app/auth/`) MUST remain outside this group and render without the Sidebar.

#### Scenario: Route group separation
- **WHEN** Next.js resolves the layout hierarchy for `/auth/login`
- **THEN** `app/(app)/layout.tsx` SHALL NOT be in the ancestor chain

#### Scenario: Route group separation for app routes
- **WHEN** Next.js resolves the layout hierarchy for `/home`
- **THEN** `app/(app)/layout.tsx` SHALL be in the ancestor chain and the Sidebar SHALL be rendered
