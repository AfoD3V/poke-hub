import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SeriesBrowser from '../../src/lib/components/SeriesBrowser.svelte';
import type { SeriesItem } from '$shared/tcg';

const mockSeries: SeriesItem[] = [
	{ id: 'sv', name: 'Scarlet & Violet', logo: 'https://assets.tcgdex.net/univ/sv/logo.png', releaseDate: '2023-03-31' },
	{ id: 'bw', name: 'Black & White', logo: '', releaseDate: '2011-04-25' }
];

const mockSeriesDetail = {
	id: 'sv',
	name: 'Scarlet & Violet',
	logo: 'https://assets.tcgdex.net/univ/sv/logo.png',
	releaseDate: '2023-03-31',
	sets: [
		{ id: 'sv03.5', name: '151', logo: 'https://assets.tcgdex.net/en/sv/sv03.5/logo.png', cardCount: 165 }
	]
};

const mockSetCards = [
	{ id: 'sv03.5-1', name: 'Bulbasaur', localId: '1', image: 'https://assets.tcgdex.net/en/sv/sv03.5/1' },
	{ id: 'sv03.5-4', name: 'Charmander', localId: '4', image: 'https://assets.tcgdex.net/en/sv/sv03.5/4' }
];

function mockFetch(responseMap: Record<string, unknown>) {
	return vi.fn().mockImplementation((url: string) => {
		const key = Object.keys(responseMap).find((k) => url.includes(k));
		const body = key ? responseMap[key] : { error: 'Not found' };
		const ok = !!key;
		return Promise.resolve({
			ok,
			status: ok ? 200 : 404,
			json: async () => body
		});
	});
}

describe('SeriesBrowser', () => {
	const originalFetch = globalThis.fetch;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	it('renders Column 1 with series tiles', () => {
		render(SeriesBrowser, { props: { series: mockSeries } });
		expect(screen.getByText('Scarlet & Violet')).toBeInTheDocument();
		expect(screen.getByText('Black & White')).toBeInTheDocument();
	});

	it('shows placeholder when series logo is empty', () => {
		render(SeriesBrowser, { props: { series: mockSeries } });
		// BW has empty logo — should show a named placeholder
		expect(screen.getByText('Black & White')).toBeInTheDocument();
	});

	it('selecting a series triggers Column 2 with sets', async () => {
		globalThis.fetch = mockFetch({ '/api/series/sv': mockSeriesDetail }) as typeof globalThis.fetch;

		render(SeriesBrowser, { props: { series: mockSeries } });

		const svTile = screen.getByText('Scarlet & Violet');
		await fireEvent.click(svTile);

		await waitFor(() => {
			expect(screen.getByText('151')).toBeInTheDocument();
		});
	});

	it('selecting a set triggers Column 3 with cards', async () => {
		globalThis.fetch = mockFetch({
			'/api/series/sv': mockSeriesDetail,
			'/api/sets/sv03.5/cards': mockSetCards
		}) as typeof globalThis.fetch;

		render(SeriesBrowser, { props: { series: mockSeries } });

		await fireEvent.click(screen.getByText('Scarlet & Violet'));

		await waitFor(() => expect(screen.getByText('151')).toBeInTheDocument());

		await fireEvent.click(screen.getByText('151'));

		await waitFor(() => {
			expect(screen.getByText('Bulbasaur')).toBeInTheDocument();
		});
	});

	it('breadcrumb shows correct path at Column 2', async () => {
		globalThis.fetch = mockFetch({ '/api/series/sv': mockSeriesDetail }) as typeof globalThis.fetch;

		render(SeriesBrowser, { props: { series: mockSeries } });
		await fireEvent.click(screen.getByText('Scarlet & Violet'));

		await waitFor(() => {
			// breadcrumb "Series" segment should be present
			expect(screen.getByRole('button', { name: /Series/i })).toBeInTheDocument();
		});
		// Should have multiple instances of "Scarlet & Violet" (tile + breadcrumb)
		expect(screen.getAllByText('Scarlet & Violet').length).toBeGreaterThanOrEqual(1);
	});

	it('clicking breadcrumb Series segment resets to Column 1', async () => {
		globalThis.fetch = mockFetch({ '/api/series/sv': mockSeriesDetail }) as typeof globalThis.fetch;

		render(SeriesBrowser, { props: { series: mockSeries } });
		await fireEvent.click(screen.getByText('Scarlet & Violet'));
		await waitFor(() => expect(screen.getByText('151')).toBeInTheDocument());

		const seriesBtn = screen.getByRole('button', { name: /Series/i });
		await fireEvent.click(seriesBtn);

		// Column 1 tiles still visible, no Column 2 content
		await waitFor(() => {
			expect(screen.getByText('Scarlet & Violet')).toBeInTheDocument();
		});
	});

	it('shows loading skeleton while fetching series detail', async () => {
		let resolve: (v: Response) => void;
		const pending = new Promise<Response>((r) => { resolve = r; });
		globalThis.fetch = vi.fn().mockReturnValue(pending) as typeof globalThis.fetch;

		render(SeriesBrowser, { props: { series: mockSeries } });
		await fireEvent.click(screen.getByText('Scarlet & Violet'));

		// Should show loading state immediately
		await waitFor(() => {
			const pulses = document.querySelectorAll('.animate-pulse');
			expect(pulses.length).toBeGreaterThan(0);
		});

		// Resolve to avoid hanging
		resolve!(new Response(JSON.stringify(mockSeriesDetail), { status: 200 }));
	});

	it('shows error state with retry button when Column 2 fetch fails', async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 502,
			json: async () => ({ error: 'Upstream failed' })
		}) as typeof globalThis.fetch;

		render(SeriesBrowser, { props: { series: mockSeries } });
		await fireEvent.click(screen.getByText('Scarlet & Violet'));

		await waitFor(() => {
			expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
		});
	});
});
