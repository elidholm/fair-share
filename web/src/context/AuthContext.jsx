import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { BUDGET_CLEARED_EVENT, BUDGET_STORAGE_KEY } from '../pages/budgetStorage.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [logoutError, setLogoutError] = useState('');
  const [logoutPending, setLogoutPending] = useState(false);

  const login = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      if (!response || typeof response.ok !== 'boolean') {
        throw new Error('Invalid authentication response');
      }
      if (!response.ok) {
        throw new Error('Could not confirm sign-in');
      }
      const userData = await response.json();
      setUser(userData);
      setAuthError('');
      setLogoutError('');
    } catch (error) {
      console.error('Auth check failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    setLogoutError('');
    setLogoutPending(true);
    let signedOut = false;
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      if (!response || !response.ok) {
        throw new Error('Sign out failed. Try again.');
      }
      setUser(null);
      signedOut = true;
      localStorage.removeItem("incomes");
      localStorage.removeItem("expenses");
      localStorage.removeItem(BUDGET_STORAGE_KEY);
      window.dispatchEvent(new Event(BUDGET_CLEARED_EVENT));
    } catch (error) {
      console.error('Logout failed:', error);
      setLogoutError(error.message || 'Sign out failed. Try again.');
      if (signedOut) window.dispatchEvent(new Event(BUDGET_CLEARED_EVENT));
    } finally {
      setLogoutPending(false);
    }
  };

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      if (!response || typeof response.ok !== 'boolean') {
        throw new Error('Invalid authentication response');
      }
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthError('Could not verify your session. Guest features remain available.');
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, authLoading, authError, login, logout, logoutError, logoutPending }}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAuth() {
  return useContext(AuthContext);
}
