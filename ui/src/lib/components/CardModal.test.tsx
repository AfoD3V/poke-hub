import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { CardModal } from './CardModal';
import type { TcgCard } from '$shared/tcg';

const mockCard: TcgCard = {
  id: 'base1-4',
  name: 'Charizard',
  supertype: 'Pokémon',
  subtypes: ['Stage 2'],
  types: ['Fire'],
  rarity: 'Rare Holo',
  set: 'Base Set',
  number: '4',
  images: { small: 'https://example.com/charizard.webp', large: 'https://example.com/charizard-large.webp' },
  hp: '120',
  attacks: [{ name: 'Fire Spin', damage: '100', cost: ['Fire', 'Fire', 'Fire', 'Fire'], convertedEnergyCost: 4, text: '' }],
  weaknesses: [{ type: 'Water', value: '×2' }],
};

describe('CardModal', () => {
  it('renders card name', () => {
    const { getByText } = render(<CardModal card={mockCard} onClose={() => {}} />);
    expect(getByText('Charizard')).toBeInTheDocument();
  });

  it('renders card rarity', () => {
    const { getByText } = render(<CardModal card={mockCard} onClose={() => {}} />);
    expect(getByText(/Rare Holo/i)).toBeInTheDocument();
  });

  it('renders card set and number', () => {
    const { getByText } = render(<CardModal card={mockCard} onClose={() => {}} />);
    expect(getByText(/Base Set/i)).toBeInTheDocument();
    expect(getByText(/4/)).toBeInTheDocument();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<CardModal card={mockCard} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    const { getByTestId } = render(<CardModal card={mockCard} onClose={onClose} />);
    fireEvent.click(getByTestId('modal-backdrop'));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
