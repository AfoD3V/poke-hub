import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';

describe('Sidebar', () => {
  it('renders without throwing', () => {
    const { getAllByRole } = render(<Sidebar />);
    const navs = getAllByRole('navigation');
    expect(navs.length).toBeGreaterThanOrEqual(1);
  });

  it('renders Home, Search, Collection links', () => {
    const { getAllByText } = render(<Sidebar />);
    expect(getAllByText(/Home/i).length).toBeGreaterThanOrEqual(1);
    expect(getAllByText(/Search/i).length).toBeGreaterThanOrEqual(1);
    expect(getAllByText(/Collection/i).length).toBeGreaterThanOrEqual(1);
  });

  // 1.1 — Responsive structure tests
  it('renders a bottom-nav element in the DOM (for mobile CSS show/hide)', () => {
    const { container } = render(<Sidebar />);
    // bottom-nav is always in DOM; CSS media query controls visibility
    const bottomNav = container.querySelector('[class*="bottom-nav"]');
    expect(bottomNav).toBeInTheDocument();
  });

  it('renders label text wrapped in <span> so CSS can hide on tablet', () => {
    const { container } = render(<Sidebar />);
    // Each nav-link should have a <span> wrapping the label text
    const navLinks = container.querySelectorAll('[class*="nav-link"]');
    expect(navLinks.length).toBeGreaterThan(0);
    navLinks.forEach((link) => {
      const span = link.querySelector('span');
      expect(span).toBeInTheDocument();
    });
  });

  // 1.2 — Accessibility tests
  it('each nav link has an aria-label attribute', () => {
    const { container } = render(<Sidebar />);
    const links = container.querySelectorAll('a[class*="nav-link"]');
    expect(links.length).toBeGreaterThan(0);
    links.forEach((link) => {
      expect(link).toHaveAttribute('aria-label');
    });
  });

  it('active nav link has aria-current="page"', () => {
    vi.mocked(usePathname).mockReturnValue('/home');
    const { container } = render(<Sidebar />);
    const activeLinks = container.querySelectorAll('[aria-current="page"]');
    expect(activeLinks.length).toBeGreaterThanOrEqual(1);
  });

  it('logout button is present and has type submit', () => {
    const { container } = render(<Sidebar />);
    const btn = container.querySelector('button[type="submit"]');
    expect(btn).toBeInTheDocument();
    expect(btn?.getAttribute('type')).toBe('submit');
  });
});
