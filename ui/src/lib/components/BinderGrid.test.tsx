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
  customImageUrl: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const emptySlot: BinderSlot = {
  id: 'slot-2',
  pageId: 'page-1',
  slotIndex: 1,
  cardId: null,
  cardSnapshot: null,
  customImageUrl: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

function makePage(slots: BinderSlot[]): BinderPage {
  return { id: 'page-1', binderId: 'binder-1', pageNumber: 1, slots, createdAt: '2024-01-01T00:00:00.000Z' };
}

const defaultProps = {
  gridCols: 4,
  gridRows: 4,
  onSlotClick: () => {},
  onClearSlot: () => {},
  onDragDrop: () => {},
  onUploadCustomImage: () => {},
  onClearCustomImage: () => {},
};

describe('BinderGrid', () => {
  it('renders correct slot count for 4x4 grid', () => {
    const page = makePage([]);
    const { getAllByTestId } = render(<BinderGrid page={page} {...defaultProps} />);
    expect(getAllByTestId('binder-slot')).toHaveLength(16);
  });

  it('renders correct slot count for 3x3 grid', () => {
    const page = makePage([]);
    const { getAllByTestId } = render(
      <BinderGrid page={page} {...defaultProps} gridCols={3} gridRows={3} />
    );
    expect(getAllByTestId('binder-slot')).toHaveLength(9);
  });

  it('occupied slot shows card thumbnail image', () => {
    const page = makePage([mockSlot]);
    const { getByRole } = render(<BinderGrid page={page} {...defaultProps} />);
    const img = getByRole('img', { name: /Bulbasaur/i });
    expect(img).toBeInTheDocument();
  });

  it('empty slot shows add icon (aria-label)', () => {
    const page = makePage([emptySlot]);
    const { getAllByLabelText } = render(<BinderGrid page={page} {...defaultProps} />);
    const addSlots = getAllByLabelText(/add card/i);
    expect(addSlots.length).toBeGreaterThan(0);
  });

  it('calls onSlotClick with slot index when empty slot is clicked', () => {
    const onSlotClick = vi.fn();
    const page = makePage([]);
    const { getAllByTestId } = render(
      <BinderGrid page={page} {...defaultProps} onSlotClick={onSlotClick} />
    );
    fireEvent.click(getAllByTestId('binder-slot')[0]);
    expect(onSlotClick).toHaveBeenCalledWith(0);
  });

  it('slot with custom image shows customImageUrl as src', () => {
    const customUrl = 'data:image/jpeg;base64,/9j/abc123';
    const slotWithCustom: BinderSlot = { ...mockSlot, customImageUrl: customUrl };
    const page = makePage([slotWithCustom]);
    const { getByRole } = render(<BinderGrid page={page} {...defaultProps} />);
    const img = getByRole('img', { name: /Bulbasaur/i });
    expect(img).toHaveAttribute('src', customUrl);
  });

  it('slot without custom image shows cardSnapshot imageSmall as src', () => {
    const page = makePage([mockSlot]);
    const { getByRole } = render(<BinderGrid page={page} {...defaultProps} />);
    const img = getByRole('img', { name: /Bulbasaur/i });
    expect(img).toHaveAttribute('src', mockSlot.cardSnapshot!.imageSmall);
  });

  it('upload button is visible on occupied slot', () => {
    const page = makePage([mockSlot]);
    const { getByLabelText } = render(<BinderGrid page={page} {...defaultProps} />);
    expect(getByLabelText(/upload custom image/i)).toBeInTheDocument();
  });

  it('clear custom image button visible when customImageUrl is set', () => {
    const slotWithCustom: BinderSlot = { ...mockSlot, customImageUrl: 'data:image/jpeg;base64,abc' };
    const page = makePage([slotWithCustom]);
    const { getByLabelText } = render(<BinderGrid page={page} {...defaultProps} />);
    expect(getByLabelText(/remove custom image/i)).toBeInTheDocument();
  });

  it('no clear custom image button when customImageUrl is null', () => {
    const page = makePage([mockSlot]);
    const { queryByLabelText } = render(<BinderGrid page={page} {...defaultProps} />);
    expect(queryByLabelText(/remove custom image/i)).not.toBeInTheDocument();
  });

  it('calls onClearCustomImage when clear custom image button clicked', () => {
    const onClearCustomImage = vi.fn();
    const slotWithCustom: BinderSlot = { ...mockSlot, customImageUrl: 'data:image/jpeg;base64,abc' };
    const page = makePage([slotWithCustom]);
    const { getByLabelText } = render(
      <BinderGrid page={page} {...defaultProps} onClearCustomImage={onClearCustomImage} />
    );
    fireEvent.click(getByLabelText(/remove custom image/i));
    expect(onClearCustomImage).toHaveBeenCalledWith(0);
  });
});
