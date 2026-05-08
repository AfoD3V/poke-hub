import type { ServerWebSocket } from "bun";

const clients = new Set<ServerWebSocket<unknown>>();

export function registerClient(ws: ServerWebSocket<unknown>): void {
  clients.add(ws);
}

export function unregisterClient(ws: ServerWebSocket<unknown>): void {
  clients.delete(ws);
}

export function broadcast(event: unknown): void {
  const message = JSON.stringify(event);
  for (const ws of clients) {
    ws.send(message);
  }
}

export function clientCount(): number {
  return clients.size;
}
