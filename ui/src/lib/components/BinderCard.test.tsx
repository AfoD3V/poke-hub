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
  color: 'purple',
  pageCount: 2,
  filledSlots: 3,
  totalSlots: 32,
  estimatedValue: 96.59,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('BinderCard', () => {
  it('renders binder name', () => {
    const { getByText } = render(
      <BinderCard binder={mockBinder} onClick={() => {}} onEdit={() => {}} onDelete={() => {}} />
    );
    expect(getByText('Pokedex')).toBeInTheDocument();
  });

  it('renders page count', () => {
    const { getByText } = render(
      <BinderCard binder={mockBinder} onClick={() => {}} onEdit={() => {}} onDelete={() => {}} />
    );
    expect(getByText(/2.*page/i)).toBeInTheDocument();
  });

  it('renders filled/total slot stats', () => {
    const { getByText } = render(
      <BinderCard binder={mockBinder} onClick={() => {}} onEdit={() => {}} onDelete={() => {}} />
    );
    expect(getByText(/3.*32/)).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    const { getByRole } = render(
      <BinderCard binder={mockBinder} onClick={onClick} onEdit={() => {}} onDelete={() => {}} />
    );
    getByRole('button', { name: /open binder pokedex/i }).click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('calls onEdit when edit button clicked', () => {
    const onEdit = vi.fn();
    const { getByTitle } = render(
      <BinderCard binder={mockBinder} onClick={() => {}} onEdit={onEdit} onDelete={() => {}} />
    );
    getByTitle('Edit binder').click();
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it('calls onDelete when delete button clicked', () => {
    const onDelete = vi.fn();
    const { getByTitle } = render(
      <BinderCard binder={mockBinder} onClick={() => {}} onEdit={() => {}} onDelete={onDelete} />
    );
    getByTitle('Delete binder').click();
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('uses default purple color when color is undefined', () => {
    const binderNoColor: BinderListItem = { ...mockBinder, color: undefined };
    const { container } = render(
      <BinderCard binder={binderNoColor} onClick={() => {}} onEdit={() => {}} onDelete={() => {}} />
    );
    // cardTop should have the purple background color
    const cardTop = container.querySelector('[style]') as HTMLElement;
    expect(cardTop.style.background).toBe('rgb(124, 58, 237)');
  });
});
