import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SeriesBrowser } from './SeriesBrowser';

describe('SeriesBrowser', () => {
  it('renders without throwing', () => {
    const { container } = render(<SeriesBrowser onSelect={() => {}} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
