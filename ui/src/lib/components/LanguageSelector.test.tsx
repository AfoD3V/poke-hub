import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { LanguageSelector } from './LanguageSelector';

describe('LanguageSelector', () => {
  it('renders without throwing', () => {
    const { container } = render(<LanguageSelector />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
