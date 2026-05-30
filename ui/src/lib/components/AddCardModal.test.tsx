import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { AddCardModal } from './AddCardModal';

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

  it('shows Cards and Sets tabs', () => {
    const { getByRole } = render(
      <AddCardModal onSelect={() => {}} onClose={() => {}} />
    );
    expect(getByRole('tab', { name: /cards/i })).toBeInTheDocument();
    expect(getByRole('tab', { name: /sets/i })).toBeInTheDocument();
  });

  it('Cards tab is active by default', () => {
    const { getByRole } = render(
      <AddCardModal onSelect={() => {}} onClose={() => {}} />
    );
    expect(getByRole('tab', { name: /cards/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('has a search input on Cards tab', () => {
    const { getByPlaceholderText } = render(
      <AddCardModal onSelect={() => {}} onClose={() => {}} />
    );
    expect(getByPlaceholderText(/search/i)).toBeInTheDocument();
  });
});
