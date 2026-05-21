import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import LanguageSelector from '../../src/lib/components/LanguageSelector.svelte';

describe('LanguageSelector', () => {
	it('renders all 7 language options', () => {
		render(LanguageSelector, { props: { value: 'en' } });
		const select = screen.getByRole('combobox');
		const options = select.querySelectorAll('option');
		expect(options.length).toBe(7);
	});

	it('default value is en', () => {
		render(LanguageSelector, { props: { value: 'en' } });
		const select = screen.getByRole('combobox') as HTMLSelectElement;
		expect(select.value).toBe('en');
	});

	it('renders English option', () => {
		render(LanguageSelector, { props: { value: 'en' } });
		expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument();
	});

	it('renders Japanese option', () => {
		render(LanguageSelector, { props: { value: 'en' } });
		expect(screen.getByRole('option', { name: 'Japanese' })).toBeInTheDocument();
	});

	it('selecting an option dispatches change event with correct code', async () => {
		const { component } = render(LanguageSelector, { props: { value: 'en' } });

		const handler = vi.fn();
		component.$on('change', (e: CustomEvent<string>) => handler(e.detail));

		const select = screen.getByRole('combobox');
		await fireEvent.change(select, { target: { value: 'ja' } });

		expect(handler).toHaveBeenCalledWith('ja');
	});
});
