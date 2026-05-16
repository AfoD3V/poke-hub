import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SearchPage from '../../src/routes/(app)/search/+page.svelte';

/**
 * Mocks the global fetch used by the search page.
 */
function mockFetch(response: unknown, ok = true, status = 200) {
	return vi.fn().mockResolvedValue({
		ok,
		status,
		json: async () => response
	});
}

const defaultData = {
	series: [],
	chaseCardIds: [] as string[],
	cards: [],
	totalCount: 0,
	query: '',
	mode: 'name',
	setId: '',
	cardNumber: '',
	error: null
};

describe('Search page', () => {
	const originalFetch = globalThis.fetch;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	it('renders the search heading and input', () => {
		render(SearchPage, { props: { data: defaultData } });
		expect(screen.getByRole('heading', { name: /card search/i })).toBeInTheDocument();
		expect(screen.getByLabelText(/search query/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /^search$/i })).toBeInTheDocument();
	});

	it('renders By Name and By Series tabs', () => {
		render(SearchPage, { props: { data: defaultData } });
		expect(screen.getByRole('button', { name: /by name/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /by series/i })).toBeInTheDocument();
	});

	it('shows a loading state during fetch', async () => {
		globalThis.fetch = mockFetch({ cards: [], totalCount: 0 });
		render(SearchPage, { props: { data: defaultData } });

		const input = screen.getByLabelText(/search query/i);
		const button = screen.getByRole('button', { name: /^search$/i });

		await fireEvent.input(input, { target: { value: 'Pikachu' } });
		fireEvent.click(button);

		await waitFor(() => {
			expect(screen.getByText(/searching/i)).toBeInTheDocument();
		});
	});

	it('renders search results after a successful fetch', async () => {
		globalThis.fetch = mockFetch({
			cards: [
				{
					id: 'base1-58',
					name: 'Pikachu',
					supertype: 'Pokémon',
					set: 'Base',
					number: '58',
					images: { small: 'https://example.com/s.jpg', large: 'https://example.com/l.jpg' }
				}
			],
			totalCount: 1
		});

		render(SearchPage, { props: { data: defaultData } });

		const input = screen.getByLabelText(/search query/i);
		const button = screen.getByRole('button', { name: /^search$/i });

		await fireEvent.input(input, { target: { value: 'Pikachu' } });
		fireEvent.click(button);

		await waitFor(() => {
			expect(screen.getByText('Pikachu')).toBeInTheDocument();
		});
	});

	it('shows an error message when the request fails', async () => {
		globalThis.fetch = mockFetch({ error: 'Upstream failed' }, false, 502);

		render(SearchPage, { props: { data: defaultData } });

		const input = screen.getByLabelText(/search query/i);
		const button = screen.getByRole('button', { name: /^search$/i });

		await fireEvent.input(input, { target: { value: 'Pikachu' } });
		fireEvent.click(button);

		await waitFor(() => {
			expect(screen.getByRole('alert')).toHaveTextContent(/upstream failed/i);
		});
	});

	it('switching to By Series tab renders SeriesBrowser', async () => {
		render(SearchPage, { props: { data: { ...defaultData, series: [{ id: 'sv', name: 'Scarlet & Violet', logo: '', releaseDate: '2023-03-31' }] } } });

		const seriesTab = screen.getByRole('button', { name: /by series/i });
		await fireEvent.click(seriesTab);

		// SeriesBrowser renders series tiles
		await waitFor(() => {
			expect(screen.getByText('Scarlet & Violet')).toBeInTheDocument();
		});
	});

	it('language selector is rendered in By Name tab', () => {
		render(SearchPage, { props: { data: defaultData } });
		// LanguageSelector renders a combobox with default 'en'
		const select = screen.getByRole('combobox');
		expect(select).toBeInTheDocument();
	});

	it('lang param is passed to fetch when language changes', async () => {
		let capturedUrl = '';
		globalThis.fetch = vi.fn().mockImplementation((url: string) => {
			capturedUrl = url;
			return Promise.resolve({ ok: true, status: 200, json: async () => ({ cards: [], totalCount: 0 }) });
		}) as typeof globalThis.fetch;

		render(SearchPage, { props: { data: defaultData } });

		// Change language to Japanese
		const select = screen.getByRole('combobox');
		await fireEvent.change(select, { target: { value: 'ja' } });

		// Submit search
		const input = screen.getByLabelText(/search query/i);
		await fireEvent.input(input, { target: { value: 'ピカチュウ' } });
		await fireEvent.click(screen.getByRole('button', { name: /^search$/i }));

		await waitFor(() => {
			expect(capturedUrl).toContain('lang=ja');
		});
	});
});
