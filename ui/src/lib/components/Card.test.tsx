import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { Card } from './Card';
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
  attacks: [],
  weaknesses: [],
};

describe('Card', () => {
  it('renders without throwing', () => {
    const { getByRole } = render(<Card card={mockCard} onExpand={() => {}} />);
    expect(getByRole('listitem')).toBeInTheDocument();
  });

  it('sets data-rarity attribute on root element', () => {
    const { getByRole } = render(<Card card={mockCard} onExpand={() => {}} />);
    expect(getByRole('listitem')).toHaveAttribute('data-rarity', 'rare holo');
  });

  it('sets data-supertype attribute on root element', () => {
    const { getByRole } = render(<Card card={mockCard} onExpand={() => {}} />);
    expect(getByRole('listitem')).toHaveAttribute('data-supertype', 'pokémon');
  });

  it('applies type class name for fire type', () => {
    const { getByRole } = render(<Card card={mockCard} onExpand={() => {}} />);
    expect(getByRole('listitem').className).toContain('fire');
  });

  it('writes CSS custom properties on pointer move', () => {
    const { getByRole } = render(<Card card={mockCard} onExpand={() => {}} />);
    const root = getByRole('listitem');
    const rotator = root.querySelector('[role="button"]')!;
    fireEvent.pointerMove(rotator, { clientX: 50, clientY: 50 });
    expect(root.getAttribute('style')).toContain('--pointer-x');
    expect(root.getAttribute('style')).toContain('--pointer-y');
    expect(root.getAttribute('style')).toContain('--card-opacity');
  });

  it('calls onExpand when clicked', () => {
    let expanded: TcgCard | null = null;
    const { getByRole } = render(<Card card={mockCard} onExpand={(c) => { expanded = c; }} />);
    const rotator = getByRole('button');
    fireEvent.click(rotator);
    expect(expanded).toEqual(mockCard);
  });

  it('shows fallback when no image src', () => {
    const noImageCard = { ...mockCard, images: undefined } as unknown as TcgCard;
    const { queryByRole } = render(<Card card={noImageCard as TcgCard} onExpand={() => {}} />);
    expect(queryByRole('img')).not.toBeInTheDocument();
  });
});
