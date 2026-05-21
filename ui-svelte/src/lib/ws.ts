import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface Toast {
	id: number;
	message: string;
}

export const toasts = writable<Toast[]>([]);

let nextId = 0;
let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function addToast(message: string) {
	const id = ++nextId;
	toasts.update((ts) => [...ts, { id, message }]);
	setTimeout(() => {
		toasts.update((ts) => ts.filter((t) => t.id !== id));
	}, 4000);
}

function connect() {
	if (!browser) return;

	const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
	const apiHost = import.meta.env.VITE_API_HOST ?? 'localhost:3000';
	const url = `${protocol}//${apiHost}/ws`;

	socket = new WebSocket(url);

	socket.addEventListener('message', (event) => {
		try {
			const msg = JSON.parse(event.data as string) as { type: string; data: { cardName?: string } };
			if (msg.type === 'card_added' && msg.data.cardName) {
				addToast(`"${msg.data.cardName}" added to your collection`);
			}
		} catch {
			// ignore malformed frames
		}
	});

	socket.addEventListener('close', () => {
		// Reconnect after 3 s — handles server restarts during dev
		reconnectTimer = setTimeout(connect, 3000);
	});

	socket.addEventListener('error', () => {
		socket?.close();
	});
}

/** Call once from the authenticated app layout's onMount. */
export function initWs() {
	if (!browser) return;
	connect();
}

/** Call on layout destroy to clean up. */
export function destroyWs() {
	if (reconnectTimer) clearTimeout(reconnectTimer);
	socket?.close();
	socket = null;
}
