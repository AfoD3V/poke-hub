## ADDED Requirements

### Requirement: Database notifications
The backend SHALL use Postgres LISTEN/NOTIFY to emit events when collection records are created.

#### Scenario: Collection insert
- **WHEN** a new card is added to `user_collection`
- **THEN** the database emits a notification payload

### Requirement: WebSocket broadcast
The backend SHALL broadcast collection events over a WebSocket channel to connected clients.

#### Scenario: Event broadcast
- **WHEN** a collection insert notification is received
- **THEN** the server sends a WebSocket message to subscribed clients

### Requirement: Toast notification
The frontend SHALL display a toast message when a collection add event is received.

#### Scenario: Card added toast
- **WHEN** the client receives a collection add WebSocket message
- **THEN** a toast is displayed with the text "Card added successfully"
