import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { SeriesBrowser } from './SeriesBrowser';
import type { SeriesItem, SeriesDetail, SetCardItem } from '$shared/tcg';

const mockSeries: SeriesItem[] = [
  { id: 'base', name: 'Base', logo: '' },
];

const mockSeriesDetail: SeriesDetail = {
  id: 'base',
  name: 'Base',
  sets: [{ id: 'base1', name: 'Base Set', logo: '', cardCount: 102 }],
};

const mockCards: SetCardItem[] = [
  { id: 'base1-4', name: 'Charizard', localId: '4', image: 'https://example.com/charizard' },
  { id: 'base1-6', name: 'Gyarados', localId: '6', image: 'https://example.com/gyarados' },
];

describe('SeriesBrowser', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders without throwing', () => {
    const { container } = render(<SeriesBrowser onSelect={() => {}} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders cards after navigating series → set', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/series/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSeriesDetail),
        });
      }
      if (url.includes('/api/sets/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCards),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    }));

    const { getAllByText, getByText } = render(<SeriesBrowser series={mockSeries} onSelect={() => {}} />);

    // "Base" appears in both the sidebar nav and the showcase grid — click the sidebar item (first)
    const baseButtons = getAllByText('Base');
    fireEvent.click(baseButtons[0]);

    // Wait for sets to load then click the set
    await waitFor(() => getByText('Base Set'));
    fireEvent.click(getByText('Base Set'));

    // Cards should render in the card grid
    await waitFor(() => {
      expect(getByText('Charizard')).toBeInTheDocument();
      expect(getByText('Gyarados')).toBeInTheDocument();
    });
  });
});
