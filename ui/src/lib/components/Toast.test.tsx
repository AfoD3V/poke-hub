import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Toast } from './Toast';

describe('Toast', () => {
  it('renders without throwing', () => {
    const { getByText } = render(<Toast message="Test notification" severity="info" />);
    expect(getByText('Test notification')).toBeInTheDocument();
  });
});
