import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import PropTypes from 'prop-types';
import { BUDGET_CLEARED_EVENT, BUDGET_STORAGE_KEY } from '../pages/budgetStorage.js';

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
        {testLogin && <button onClick={() => login().catch(() => {})}>Login</button>}
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
    it('exposes session loading until the initial auth check settles', async () => {
      let settle;
      global.fetch.mockImplementationOnce(() => new Promise((resolve) => {
        settle = resolve;
      }));
      const SessionStatus = () => {
        const { authLoading } = useAuth();
        return <span>{authLoading ? 'Checking' : 'Ready'}</span>;
      };
      const { getByText } = render(
        <AuthProvider>
          <SessionStatus />
        </AuthProvider>
      );
      expect(getByText('Checking')).toBeInTheDocument();
      await act(async () => settle({ ok: false }));
      expect(getByText('Ready')).toBeInTheDocument();
    });

    it('exposes an initial session network failure instead of pretending it succeeded', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Offline'));
      const ErrorStatus = () => {
        const { authError } = useAuth();
        return <span role="alert">{authError}</span>;
      };
      const { getByRole } = render(
        <AuthProvider>
          <ErrorStatus />
        </AuthProvider>
      );
      await vi.waitFor(() =>
        expect(getByRole('alert')).toHaveTextContent('Could not verify your session')
      );
    });

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

    it('does not set a signed-in user when verification returns unauthorized', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false });
      global.fetch.mockResolvedValueOnce({ ok: false });

      const { getByText, getByTestId } = render(
        <AuthProvider>
          <TestComponent testLogin />
        </AuthProvider>
      );

      await act(async () => {
        getByText('Login').click();
      });
      expect(getByTestId('user-status')).toHaveTextContent('Logged out');
      expect(console.error).toHaveBeenCalledWith(
        'Auth check failed:',
        expect.objectContaining({ message: 'Could not confirm sign-in' })
      );
    });
  });

  describe('logout functionality', () => {
    it('successfully logs out', async () => {
      localStorage.setItem(BUDGET_STORAGE_KEY, '{"version":1,"months":{}}');
      const cleared = vi.fn();
      window.addEventListener(BUDGET_CLEARED_EVENT, cleared, { once: true });
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
      expect(localStorage.getItem(BUDGET_STORAGE_KEY)).toBeNull();
      expect(cleared).toHaveBeenCalledTimes(1);
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

    it('keeps local data and login state on unsuccessful sign out', async () => {
      localStorage.setItem('incomes', '[{"name":"A","amount":1}]');
      localStorage.setItem(BUDGET_STORAGE_KEY, '{"version":1,"months":{}}');
      const cleared = vi.fn();
      window.addEventListener(BUDGET_CLEARED_EVENT, cleared, { once: true });
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ username: 'testuser' })
      });
      global.fetch.mockResolvedValueOnce({ ok: false });

      const { getByText, getByTestId } = render(
        <AuthProvider>
          <TestComponent testLogout />
        </AuthProvider>
      );
      await vi.waitFor(() =>
        expect(getByTestId('user-status')).toHaveTextContent('Logged in as testuser')
      );
      await act(async () => {
        getByText('Logout').click();
      });

      expect(getByTestId('user-status')).toHaveTextContent('Logged in as testuser');
      expect(localStorage.getItem('incomes')).not.toBeNull();
      expect(localStorage.getItem(BUDGET_STORAGE_KEY)).not.toBeNull();
      expect(cleared).not.toHaveBeenCalled();
      window.removeEventListener(BUDGET_CLEARED_EVENT, cleared);
    });

    it('reports a local cleanup failure after server logout and invalidates the visible budget', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ username: 'testuser' })
      });
      global.fetch.mockResolvedValueOnce({ ok: true });
      const cleared = vi.fn();
      window.addEventListener(BUDGET_CLEARED_EVENT, cleared, { once: true });
      const remove = vi.spyOn(Storage.prototype, 'removeItem')
        .mockImplementation(() => { throw new Error('Storage unavailable'); });

      const ErrorStatus = () => {
        const { user, logout, logoutError } = useAuth();
        return (
          <>
            <span>{user ? 'Signed in' : 'Signed out'}</span>
            <button onClick={logout}>Logout</button>
            <span role="alert">{logoutError}</span>
          </>
        );
      };
      const { getByText, getByRole } = render(
        <AuthProvider>
          <ErrorStatus />
        </AuthProvider>
      );
      await vi.waitFor(() => expect(getByText('Signed in')).toBeInTheDocument());
      await act(async () => { getByText('Logout').click(); });
      expect(getByText('Signed out')).toBeInTheDocument();
      expect(getByRole('alert')).toHaveTextContent('Storage unavailable');
      expect(cleared).toHaveBeenCalledTimes(1);
      remove.mockRestore();
    });
  });
});
