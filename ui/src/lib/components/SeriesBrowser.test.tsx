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

  it('renders cards in column 3 after selectSet is called', async () => {
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

    const { getByText } = render(<SeriesBrowser series={mockSeries} onSelect={() => {}} />);

    // Click a series to load sets (col 2)
    fireEvent.click(getByText('Base'));

    // Wait for sets to load then click the set (col 3)
    await waitFor(() => getByText('Base Set'));
    fireEvent.click(getByText('Base Set'));

    // Cards should render in column 3
    await waitFor(() => {
      expect(getByText('Charizard')).toBeInTheDocument();
      expect(getByText('Gyarados')).toBeInTheDocument();
    });
  });
});
