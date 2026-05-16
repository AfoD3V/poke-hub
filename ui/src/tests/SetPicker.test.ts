import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import SetPicker from '../lib/components/SetPicker.svelte';
import type { SetItem } from '$shared/tcg';

const mockSets: SetItem[] = [
  { id: 'sv03.5', name: '151', abbreviation: 'MEW', cardCount: 165, releaseDate: '2023-09-22' },
  { id: 'swsh3', name: 'Darkness Ablaze', abbreviation: 'DAA', cardCount: 189, releaseDate: '2020-08-14' },
  { id: 'base1', name: 'Base Set', abbreviation: '', cardCount: 102, releaseDate: '1999-01-09' }
];

describe('SetPicker', () => {
  it('renders combobox input with correct ARIA roles', () => {
    render(SetPicker, { props: { sets: mockSets } });
    const input = screen.getByRole('combobox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).toHaveAttribute('aria-expanded');
  });

  it('shows listbox with options when focused', async () => {
    render(SetPicker, { props: { sets: mockSets } });
    const input = screen.getByRole('combobox');
    await fireEvent.focus(input);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThan(0);
  });

  it('filters by name case-insensitively', async () => {
    render(SetPicker, { props: { sets: mockSets } });
    const input = screen.getByRole('combobox');
    await fireEvent.focus(input);
    await fireEvent.input(input, { target: { value: 'darkness' } });
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Darkness Ablaze');
  });

  it('filters by abbreviation', async () => {
    render(SetPicker, { props: { sets: mockSets } });
    const input = screen.getByRole('combobox');
    await fireEvent.focus(input);
    await fireEvent.input(input, { target: { value: 'MEW' } });
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('151');
  });

  it('filters by TCGdex ID prefix', async () => {
    render(SetPicker, { props: { sets: mockSets } });
    const input = screen.getByRole('combobox');
    await fireEvent.focus(input);
    await fireEvent.input(input, { target: { value: 'sv03' } });
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('151');
  });

  it('shows "No sets found" when no match', async () => {
    render(SetPicker, { props: { sets: mockSets } });
    const input = screen.getByRole('combobox');
    await fireEvent.focus(input);
    await fireEvent.input(input, { target: { value: 'xyzxyzxyz' } });
    expect(screen.getByText(/no sets found/i)).toBeInTheDocument();
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('displays "Name (ABBR)" format for sets with abbreviation', async () => {
    render(SetPicker, { props: { sets: mockSets } });
    const input = screen.getByRole('combobox');
    await fireEvent.focus(input);
    const option = screen.getByRole('option', { name: /151 \(MEW\)/i });
    expect(option).toBeInTheDocument();
  });

  it('displays just "Name" for sets without abbreviation', async () => {
    render(SetPicker, { props: { sets: mockSets } });
    const input = screen.getByRole('combobox');
    await fireEvent.focus(input);
    const option = screen.getByRole('option', { name: /^Base Set$/i });
    expect(option).toBeInTheDocument();
  });

  it('emits select event with { id, label } when option is clicked', async () => {
    const { component } = render(SetPicker, { props: { sets: mockSets } });
    const selected: Array<{ id: string; label: string }> = [];
    component.$on('select', (e: CustomEvent<{ id: string; label: string }>) => {
      selected.push(e.detail);
    });

    const input = screen.getByRole('combobox');
    await fireEvent.focus(input);
    const option = screen.getByRole('option', { name: /151 \(MEW\)/i });
    await fireEvent.mouseDown(option);

    expect(selected).toHaveLength(1);
    expect(selected[0].id).toBe('sv03.5');
    expect(selected[0].label).toBe('151 (MEW)');
  });

  it('ArrowDown moves highlight to first option', async () => {
    render(SetPicker, { props: { sets: mockSets } });
    const input = screen.getByRole('combobox');
    await fireEvent.focus(input);
    await fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input).toHaveAttribute('aria-activedescendant', 'set-option-0');
    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('ArrowDown then ArrowUp moves highlight back', async () => {
    render(SetPicker, { props: { sets: mockSets } });
    const input = screen.getByRole('combobox');
    await fireEvent.focus(input);
    await fireEvent.keyDown(input, { key: 'ArrowDown' });
    await fireEvent.keyDown(input, { key: 'ArrowDown' });
    await fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input).toHaveAttribute('aria-activedescendant', 'set-option-0');
  });

  it('Enter selects the highlighted option and emits select event', async () => {
    const { component } = render(SetPicker, { props: { sets: mockSets } });
    const selected: Array<{ id: string; label: string }> = [];
    component.$on('select', (e: CustomEvent<{ id: string; label: string }>) => {
      selected.push(e.detail);
    });

    const input = screen.getByRole('combobox');
    await fireEvent.focus(input);
    await fireEvent.keyDown(input, { key: 'ArrowDown' });
    await fireEvent.keyDown(input, { key: 'Enter' });

    expect(selected).toHaveLength(1);
    expect(selected[0].id).toBe('sv03.5'); // first set in mockSets (newest first)
  });

  it('Escape closes dropdown without selecting', async () => {
    const { component } = render(SetPicker, { props: { sets: mockSets } });
    const selected: unknown[] = [];
    component.$on('select', () => selected.push(true));

    const input = screen.getByRole('combobox');
    await fireEvent.focus(input);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(selected).toHaveLength(0);
  });

  it('renders plain text input as fallback when sets is empty', () => {
    render(SetPicker, { props: { sets: [] } });
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    const input = screen.getByPlaceholderText(/set id \(e\.g\. sv03\.5\)/i);
    expect(input).toBeInTheDocument();
  });

  it('fallback plain input emits select with typed value as both id and label', async () => {
    const { component } = render(SetPicker, { props: { sets: [] } });
    const selected: Array<{ id: string; label: string }> = [];
    component.$on('select', (e: CustomEvent<{ id: string; label: string }>) => {
      selected.push(e.detail);
    });

    const input = screen.getByPlaceholderText(/set id \(e\.g\. sv03\.5\)/i);
    await fireEvent.input(input, { target: { value: 'sv03.5' } });

    expect(selected).toHaveLength(1);
    expect(selected[0].id).toBe('sv03.5');
    expect(selected[0].label).toBe('sv03.5');
  });
});
