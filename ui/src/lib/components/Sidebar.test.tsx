import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Sidebar } from './Sidebar';

describe('Sidebar', () => {
  it('renders without throwing', () => {
    const { getByRole } = render(<Sidebar />);
    expect(getByRole('navigation')).toBeInTheDocument();
  });

  it('renders Home, Search, Collection links', () => {
    const { getByText } = render(<Sidebar />);
    expect(getByText(/Home/i)).toBeInTheDocument();
    expect(getByText(/Search/i)).toBeInTheDocument();
    expect(getByText(/Collection/i)).toBeInTheDocument();
  });
});
