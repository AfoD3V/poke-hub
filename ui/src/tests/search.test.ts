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

describe('Search page', () => {
	const originalFetch = globalThis.fetch;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	it('renders the search heading and input', () => {
		render(SearchPage, { props: { data: { sets: [], cards: [], totalCount: 0, query: '', mode: 'name', setId: '', cardNumber: '', error: null } } });
		expect(screen.getByRole('heading', { name: /card search/i })).toBeInTheDocument();
		expect(screen.getByLabelText(/search query/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
	});

	it('shows a loading state during fetch', async () => {
		globalThis.fetch = mockFetch({ cards: [], totalCount: 0 });
		render(SearchPage, { props: { data: { sets: [], cards: [], totalCount: 0, query: '', mode: 'name', setId: '', cardNumber: '', error: null } } });

		const input = screen.getByLabelText(/search query/i);
		const button = screen.getByRole('button', { name: /search/i });

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

		render(SearchPage, { props: { data: { sets: [], cards: [], totalCount: 0, query: '', mode: 'name', setId: '', cardNumber: '', error: null } } });

		const input = screen.getByLabelText(/search query/i);
		const button = screen.getByRole('button', { name: /search/i });

		await fireEvent.input(input, { target: { value: 'Pikachu' } });
		fireEvent.click(button);

		await waitFor(() => {
			expect(screen.getByText('Pikachu')).toBeInTheDocument();
		});
	});

	it('shows an error message when the request fails', async () => {
		globalThis.fetch = mockFetch({ error: 'Upstream failed' }, false, 502);

		render(SearchPage, { props: { data: { sets: [], cards: [], totalCount: 0, query: '', mode: 'name', setId: '', cardNumber: '', error: null } } });

		const input = screen.getByLabelText(/search query/i);
		const button = screen.getByRole('button', { name: /search/i });

		await fireEvent.input(input, { target: { value: 'Pikachu' } });
		fireEvent.click(button);

		await waitFor(() => {
			expect(screen.getByRole('alert')).toHaveTextContent(/upstream failed/i);
		});
	});
});
