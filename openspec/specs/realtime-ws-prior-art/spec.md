# Prior Art: SvelteKit WebSocket Manager (`ws.ts`)

**Status:** Reference only. Source file deleted as part of `svelte-cleanup` change.
**Relevant to:** Phase 1 Task 5 — Real-Time Event Architecture.

---

## What This Was

`ui-svelte/src/lib/ws.ts` was the SvelteKit frontend's WebSocket connection manager. It handled real-time push events from the Hono backend (card add/remove notifications, admin broadcasts) and piped them into Svelte's reactive store system for toast display.

---

## Architecture

```
Browser                  ws.ts                    Svelte Stores
──────                   ─────                    ─────────────
initWs()  ─────────────▶ new WebSocket(WS_URL)
                         onopen  → log connected
                         onmessage ───────────────▶ toasts.update()
                         onerror  → log, fall thru
                         onclose  ──────────────── setTimeout(3000)
                                       │
                         reconnect() ◀─┘  (unlimited retries)
                              │
                         new WebSocket(...)  (restart cycle)

destroyWs() ────────────▶ clearTimeout()
                          ws.close()
```

**Entry point:** Called from `+layout.svelte` inside `onMount()` (browser-only). `destroyWs()` called in `onDestroy()`.

**SSR guard:** Uses `$app/environment` `browser` boolean (SvelteKit-specific import) — prevents execution during SSR. Note: design.md documented `typeof window` as the guard but the actual implementation uses the SvelteKit `browser` import.

---

## Toast Shape

```typescript
interface Toast {
  id: number;     // monotonically increasing module-level integer
  message: string;
}
```

**Note:** The original design.md documented a richer shape (`severity`, `ttl`, UUID `id`) — the actual implementation is simpler. Auto-dismiss is hardcoded at 4 000 ms; there is no per-toast TTL field. The React redesign should decide whether to add severity levels.

Dispatched to the `toasts` writable store (`Writable<Toast[]>`). Toast component reads the store reactively.

---

## Reconnect Strategy

- **Delay:** 3 000 ms fixed (no exponential backoff)
- **Retries:** Unlimited
- **Reset:** `destroyWs()` clears the pending reconnect timeout before closing
- **Rationale:** Designed for local dev resilience (server restarts frequently); production may want exponential backoff with a cap

---

## What Changes in the React Redesign (Phase 1 Task 5)

| SvelteKit pattern | React equivalent |
|---|---|
| `Writable<ToastMessage[]>` store | React Context + `useReducer`, or Zustand |
| `onMount()` / `onDestroy()` | `useEffect(() => { ...; return destroyWs; }, [])` in a `<RealtimeProvider>` |
| `typeof window` SSR guard | Same guard still needed — Next.js SSR will enter the effect on server |
| Store reactivity triggers re-render | Context value change triggers re-render; or Zustand subscription |

**Architecture to consider:**

```
app/layout.tsx
  └── <RealtimeProvider>       ← owns WebSocket lifecycle
        └── <ToastContainer>   ← subscribes to toast context
              └── {children}
```

`<RealtimeProvider>` wraps the authenticated layout (`(app)/layout.tsx`), not the root layout — no WebSocket needed on auth pages.

**SSE vs WebSocket consideration:** If the backend only pushes data (no client→server messages beyond the HTTP API), Server-Sent Events (SSE) is simpler — browser reconnects automatically, no `destroyWs()` equivalent needed, works through HTTP/2 multiplexing. Evaluate at Task 5 design time based on whether bidirectional messaging is needed.

---

## What Was NOT in ws.ts

- No authentication (JWT was handled separately via cookie on HTTP requests)
- No message queuing or deduplication
- No message type routing — only `card_added` was handled: `{ type: 'card_added', data: { cardName?: string } }`
- No binary message handling (all messages were JSON strings)
- Malformed JSON frames were silently ignored (empty `catch` block)

Any of these may be needed in the Phase 1 Task 5 design depending on what events the backend emits.

---

## Actual Findings (svelte-cleanup audit, 2026-05-21)

Reviewed `ui-svelte/src/lib/ws.ts` line by line. Differences from design.md documentation:

1. **Toast shape is simpler** — actual `{ id: number, message: string }`, not `{ id: string, severity, ttl }`.
2. **SSR guard is `$app/environment` not `typeof window`** — uses SvelteKit's `browser` boolean.
3. **Only one message type handled** — `card_added` only; no routing table.
4. **Auto-dismiss TTL is hardcoded** — 4 000 ms in `setTimeout`, not a field on the toast object.
5. **`onerror` path** — calls `socket.close()` explicitly, falling through to the `onclose` reconnect logic. No separate retry counter.
