import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BinderCard } from './BinderCard';
import type { BinderListItem } from '$shared/binders';

const mockBinder: BinderListItem = {
  id: 'binder-1',
  name: 'Pokedex',
  icon: 'book-open',
  gridCols: 4,
  gridRows: 4,
  pageCount: 2,
  filledSlots: 3,
  totalSlots: 32,
  estimatedValue: 96.59,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('BinderCard', () => {
  it('renders binder name', () => {
    const { getByText } = render(<BinderCard binder={mockBinder} onClick={() => {}} />);
    expect(getByText('Pokedex')).toBeInTheDocument();
  });

  it('renders page count', () => {
    const { getByText } = render(<BinderCard binder={mockBinder} onClick={() => {}} />);
    expect(getByText(/2.*page/i)).toBeInTheDocument();
  });

  it('renders filled/total slot stats', () => {
    const { getByText } = render(<BinderCard binder={mockBinder} onClick={() => {}} />);
    expect(getByText(/3.*32/)).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    const { getByRole } = render(<BinderCard binder={mockBinder} onClick={onClick} />);
    getByRole('button').click();
    expect(onClick).toHaveBeenCalledOnce();
  });
});
