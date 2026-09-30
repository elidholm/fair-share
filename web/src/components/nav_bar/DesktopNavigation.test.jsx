import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DesktopNavigation from './DesktopNavigation';
import { useAuth } from '../../context/AuthContext';

vi.mock('../../context/AuthContext');

describe('DesktopNavigation Component', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: { username: 'testuser' },
      logout: vi.fn()
    });
  });

  it('renders logo', () => {
    render(
      <MemoryRouter>
        <DesktopNavigation />
      </MemoryRouter>
    );
    expect(screen.getByText('FairShare')).toBeInTheDocument();
  });

  it('shows login/signup when user is logged out', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      login: vi.fn()
    });

    render(
      <MemoryRouter>
        <DesktopNavigation />
      </MemoryRouter>
    );
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
    expect(screen.queryByText('testuser')).not.toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  it('shows logout button when user is logged in', () => {
    render(
      <MemoryRouter>
        <DesktopNavigation />
      </MemoryRouter>
    );
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
    expect(screen.queryByText('Sign Up')).not.toBeInTheDocument();
  });

  it('keeps a logout cleanup error visible after the user state changes', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      logoutError: 'Could not clear local data',
      logout: vi.fn()
    });
    render(
      <MemoryRouter>
        <DesktopNavigation />
      </MemoryRouter>
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Could not clear local data');
  });

  it('does not flash signed-out actions while checking the session', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, authLoading: true });
    render(
      <MemoryRouter>
        <DesktopNavigation />
      </MemoryRouter>
    );
    expect(screen.getByRole('status')).toHaveTextContent('Checking account');
    expect(screen.queryByRole('link', { name: 'Login' })).not.toBeInTheDocument();
  });
});
