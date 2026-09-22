import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NavLinks from './NavLinks';

describe('NavLinks Component', () => {
  it('renders navigation links', () => {
    render(
      <MemoryRouter>
        <NavLinks />
      </MemoryRouter>
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Split costs')).toBeInTheDocument();
    expect(screen.getByText('Budget')).toBeInTheDocument();
  });

  it('calls closeMenu when clicked if isClicked is true', () => {
    const mockCloseMenu = vi.fn();
    render(
      <MemoryRouter>
        <NavLinks isClicked={true} closeMenu={mockCloseMenu} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('Home'));
    expect(mockCloseMenu).toHaveBeenCalled();
  });
});
