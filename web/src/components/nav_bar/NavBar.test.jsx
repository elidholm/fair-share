import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import NavBar from './NavBar';

vi.mock('./DesktopNavigation.jsx', () => ({ default: () => <div>Desktop Nav</div> }));
vi.mock('./MobileNavigation.jsx', () => ({ default: () => <div>Mobile Nav</div> }));

describe('NavBar Component', () => {
  afterEach(() => {
    cleanup();
    window.scrollY = 0;
  });

  it('renders both desktop and mobile navigation', () => {
    const { getByText } = render(<NavBar />);
    expect(getByText('Desktop Nav')).toBeInTheDocument();
    expect(getByText('Mobile Nav')).toBeInTheDocument();
  });

  it('does not have the is-scrolled class at the top of the page', () => {
    const { container } = render(<NavBar />);
    expect(container.querySelector('.NavBar')).not.toHaveClass('is-scrolled');
  });

  it('adds the is-scrolled class once the page is scrolled', () => {
    const { container } = render(<NavBar />);
    window.scrollY = 50;
    fireEvent.scroll(window);
    expect(container.querySelector('.NavBar')).toHaveClass('is-scrolled');
  });

  it('removes the is-scrolled class after scrolling back to the top', () => {
    const { container } = render(<NavBar />);
    window.scrollY = 50;
    fireEvent.scroll(window);
    window.scrollY = 0;
    fireEvent.scroll(window);
    expect(container.querySelector('.NavBar')).not.toHaveClass('is-scrolled');
  });
});
