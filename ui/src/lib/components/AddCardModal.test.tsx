import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { AddCardModal } from './AddCardModal';

// Mock fetch so collection loading on mount doesn't fail in jsdom
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ entries: [] }),
  }));
});

describe('AddCardModal', () => {
  it('renders modal with title "Add card"', () => {
    const { getByText } = render(
      <AddCardModal onSelect={() => {}} onClose={() => {}} />
    );
    expect(getByText(/add card/i)).toBeInTheDocument();
  });

  it('has role dialog with aria-label', () => {
    const { getByRole } = render(
      <AddCardModal onSelect={() => {}} onClose={() => {}} />
    );
    expect(getByRole('dialog')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    const { getByLabelText } = render(
      <AddCardModal onSelect={() => {}} onClose={onClose} />
    );
    fireEvent.click(getByLabelText(/close/i));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(<AddCardModal onSelect={() => {}} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows Collection and Cards tabs only', () => {
    const { getByRole, queryByRole } = render(
      <AddCardModal onSelect={() => {}} onClose={() => {}} />
    );
    expect(getByRole('tab', { name: /collection/i })).toBeInTheDocument();
    expect(getByRole('tab', { name: /cards/i })).toBeInTheDocument();
    expect(queryByRole('tab', { name: /sets/i })).not.toBeInTheDocument();
  });

  it('Collection tab is active by default', () => {
    const { getByRole } = render(
      <AddCardModal onSelect={() => {}} onClose={() => {}} />
    );
    expect(getByRole('tab', { name: /collection/i })).toHaveAttribute('aria-selected', 'true');
    expect(getByRole('tab', { name: /cards/i })).toHaveAttribute('aria-selected', 'false');
  });

  it('has a filter input on Collection tab', () => {
    const { getByPlaceholderText } = render(
      <AddCardModal onSelect={() => {}} onClose={() => {}} />
    );
    expect(getByPlaceholderText(/filter/i)).toBeInTheDocument();
  });

  it('has a search input on Cards tab', () => {
    const { getByRole, getByPlaceholderText } = render(
      <AddCardModal onSelect={() => {}} onClose={() => {}} />
    );
    fireEvent.click(getByRole('tab', { name: /cards/i }));
    expect(getByPlaceholderText(/search for a card/i)).toBeInTheDocument();
  });
});
