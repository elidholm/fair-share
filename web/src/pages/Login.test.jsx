import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin
  })
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});


function getUsernameField() {
  return screen.getByLabelText((content) => content.startsWith('Username'));
}

function getPasswordField() {
  return screen.getByLabelText((content) => content.startsWith('Password'));
}

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    mockLogin.mockReset().mockResolvedValue(undefined);
  });

  it('renders login form with accessible labels', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Welcome Back' })).toBeInTheDocument();
    expect(getUsernameField()).toBeInTheDocument();
    expect(getPasswordField()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign up' })).toHaveAttribute('href', '/sign-up');
  });

  it('prevents submission when fields are empty', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(global.fetch).not.toHaveBeenCalled();

    expect(getUsernameField()).toBeRequired();
    expect(getPasswordField()).toBeRequired();
  });

  it('submits form with valid credentials and shows a loading state', async () => {
    let resolveFetch;
    const mockFetch = vi.fn(() => new Promise((resolve) => { resolveFetch = resolve; }));
    global.fetch = mockFetch;

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(getUsernameField(), { target: { value: 'testuser' } });
    fireEvent.change(getPasswordField(), { target: { value: 'correctpassword' } });
    const submitButton = screen.getByRole('button', { name: 'Login' });
    fireEvent.click(submitButton);
    expect(submitButton).toHaveAttribute('aria-busy', 'true');

    resolveFetch({ ok: true });

    await waitFor(() => expect(mockLogin).toHaveBeenCalled());

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser', password: 'correctpassword' }),
      credentials: 'include'
    });

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
    await waitFor(() => expect(submitButton).not.toHaveAttribute('aria-busy'));
  });

  it('does not navigate and shows an error when session verification fails after login', async () => {
    const mockFetch = vi.fn(() => Promise.resolve({ ok: true }));
    global.fetch = mockFetch;
    mockLogin.mockRejectedValue(new Error('Could not confirm sign-in'));

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(getUsernameField(), { target: { value: 'testuser' } });
    fireEvent.change(getPasswordField(), { target: { value: 'correctpassword' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not confirm sign-in');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows error message when API returns error', async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid credentials' })
      })
    );
    global.fetch = mockFetch;

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(getUsernameField(), { target: { value: 'testuser' } });
    fireEvent.change(getPasswordField(), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('uses default error message when API does not return error', async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({})
      })
    );
    global.fetch = mockFetch;

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(getUsernameField(), { target: { value: 'testuser' } });
    fireEvent.change(getPasswordField(), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Login failed');
  });

  it('shows a network error message when the request fails to reach the server', async () => {
    const mockFetch = vi.fn(() => Promise.reject(new TypeError('Failed to fetch')));
    global.fetch = mockFetch;

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(getUsernameField(), { target: { value: 'testuser' } });
    fireEvent.change(getPasswordField(), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to reach the server. Please try again.');
  });
});
