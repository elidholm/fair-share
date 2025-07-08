import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import PropTypes from 'prop-types';

describe('AuthContext', () => {
  var global = global || window;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  const TestComponent = ({ testLogin = false, testLogout = false }) => {
    const { user, login, logout } = useAuth();
    return (
      <div>
        <span data-testid="user-status">
          {user ? `Logged in as ${user.username}` : 'Logged out'}
        </span>
        {testLogin && <button onClick={login}>Login</button>}
        {testLogout && <button onClick={logout}>Logout</button>}
      </div>
    );
  };

  TestComponent.propTypes = {
    testLogin: PropTypes.bool,
    testLogout: PropTypes.bool
  };

  TestComponent.defaultProps = {
    testLogin: false,
    testLogout: false
  };

  describe('login functionality', () => {
    it('successfully logs in', async () => {
      const mockUser = { username: 'testuser' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser)
      });

      const { getByText, getByTestId } = render(
        <AuthProvider>
          <TestComponent testLogin={true} />
        </AuthProvider>
      );

      await act(async () => {
        getByText('Login').click();
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/me', {
        credentials: 'include'
      });
      expect(getByTestId('user-status')).toHaveTextContent('Logged in as testuser');
    });

    it('handles login failure', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Auth failed'));

      const { getByText } = render(
        <AuthProvider>
          <TestComponent testLogin={true} />
        </AuthProvider>
      );

      await act(async () => {
        getByText('Login').click();
      });

      expect(console.error).toHaveBeenCalledWith(
        'Auth check failed:',
        expect.any(Error)
      );
    });
  });

  describe('logout functionality', () => {
    it('successfully logs out', async () => {
      // Mock initial login
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ username: 'testuser' })
      });

      // Mock logout
      global.fetch.mockResolvedValueOnce({ ok: true });

      const { getByText, getByTestId } = render(
        <AuthProvider>
          <TestComponent testLogout={true} />
        </AuthProvider>
      );

      // Wait for initial login
      await vi.waitFor(() =>
        expect(getByTestId('user-status')).toHaveTextContent('Logged in as testuser')
      );

      await act(async () => {
        getByText('Logout').click();
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      expect(getByTestId('user-status')).toHaveTextContent('Logged out');
    });

    it('handles logout failure', async () => {
      // Mock initial login
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ username: 'testuser' })
      });

      // Mock failed logout
      global.fetch.mockRejectedValueOnce(new Error('Logout failed'));

      const { getByText } = render(
        <AuthProvider>
          <TestComponent testLogout={true} />
        </AuthProvider>
      );

      await act(async () => {
        getByText('Logout').click();
      });

      expect(console.error).toHaveBeenCalledWith(
        'Logout failed:',
        expect.any(Error)
      );
    });
  });
});
