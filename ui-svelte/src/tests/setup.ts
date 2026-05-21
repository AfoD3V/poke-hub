import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock SvelteKit's $app/* modules which are not available in the jsdom test
// environment (they're injected by the SvelteKit Vite plugin at build time).

vi.mock('$app/forms', () => ({
	/** Minimal Svelte action stub — does nothing in unit tests. */
	enhance: () => undefined
}));

vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
	invalidate: vi.fn(),
	preloadData: vi.fn()
}));

vi.mock('$app/stores', async () => {
	const { readable } = await vi.importActual<typeof import('svelte/store')>('svelte/store');
	return {
		page: readable({
			url: new URL('http://localhost/'),
			params: {},
			route: { id: '' },
			status: 200,
			error: null,
			data: {},
			form: null
		}),
		navigating: readable(null),
		updated: readable(false)
	};
});

vi.mock('$app/environment', () => ({
	browser: false,
	building: false,
	dev: true,
	version: 'test'
}));
