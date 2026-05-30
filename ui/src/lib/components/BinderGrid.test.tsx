import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { BinderGrid } from './BinderGrid';
import type { BinderPage, BinderSlot } from '$shared/binders';

const mockSlot: BinderSlot = {
  id: 'slot-1',
  pageId: 'page-1',
  slotIndex: 0,
  cardId: 'sv3pt5-001',
  cardSnapshot: {
    name: 'Bulbasaur',
    imageSmall: 'https://example.com/bulbasaur.webp',
    setName: 'Mew',
    setId: 'sv3pt5',
    setCode: 'MEW',
    rarity: 'Common',
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const emptySlot: BinderSlot = {
  id: 'slot-2',
  pageId: 'page-1',
  slotIndex: 1,
  cardId: null,
  cardSnapshot: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

function makePage(slots: BinderSlot[]): BinderPage {
  return { id: 'page-1', binderId: 'binder-1', pageNumber: 1, slots, createdAt: '2024-01-01T00:00:00.000Z' };
}

describe('BinderGrid', () => {
  it('renders correct slot count for 4x4 grid', () => {
    const page = makePage([]);
    const { getAllByTestId } = render(
      <BinderGrid page={page} gridCols={4} gridRows={4} onSlotClick={() => {}} />
    );
    expect(getAllByTestId('binder-slot')).toHaveLength(16);
  });

  it('renders correct slot count for 3x3 grid', () => {
    const page = makePage([]);
    const { getAllByTestId } = render(
      <BinderGrid page={page} gridCols={3} gridRows={3} onSlotClick={() => {}} />
    );
    expect(getAllByTestId('binder-slot')).toHaveLength(9);
  });

  it('occupied slot shows card thumbnail image', () => {
    const page = makePage([mockSlot]);
    const { getByRole } = render(
      <BinderGrid page={page} gridCols={4} gridRows={4} onSlotClick={() => {}} />
    );
    const img = getByRole('img', { name: /Bulbasaur/i });
    expect(img).toBeInTheDocument();
  });

  it('empty slot shows add icon (aria-label)', () => {
    const page = makePage([emptySlot]);
    const { getAllByLabelText } = render(
      <BinderGrid page={page} gridCols={4} gridRows={4} onSlotClick={() => {}} />
    );
    const addSlots = getAllByLabelText(/add card/i);
    expect(addSlots.length).toBeGreaterThan(0);
  });

  it('calls onSlotClick with slot index when empty slot is clicked', () => {
    const onSlotClick = vi.fn();
    const page = makePage([]);
    const { getAllByTestId } = render(
      <BinderGrid page={page} gridCols={4} gridRows={4} onSlotClick={onSlotClick} />
    );
    fireEvent.click(getAllByTestId('binder-slot')[0]);
    expect(onSlotClick).toHaveBeenCalledWith(0);
  });
});
