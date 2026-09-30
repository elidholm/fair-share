import React from "react";
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SignUp from './SignUp';


function getEmailField() {
  return screen.getByLabelText((content) => content.startsWith('Email Address'));
}

function getUsernameField() {
  return screen.getByLabelText((content) => content.startsWith('Username'));
}

function getPasswordField() {
  return screen.getByLabelText((content) => content.startsWith('Password') && !content.includes('Confirm'));
}

function getConfirmPasswordField() {
  return screen.getByLabelText((content) => content.startsWith('Password (Confirm'));
}

describe('SignUp Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('renders signup form with accessible labels', () => {
    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Sign Up' })).toBeInTheDocument();
    expect(getEmailField()).toBeInTheDocument();
    expect(getUsernameField()).toBeInTheDocument();
    expect(getPasswordField()).toBeInTheDocument();
    expect(getConfirmPasswordField()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('prevents submission when required fields are empty', () => {
    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(global.fetch).not.toHaveBeenCalled();

    expect(getEmailField()).toBeRequired();
    expect(getUsernameField()).toBeRequired();
    expect(getPasswordField()).toBeRequired();
    expect(getConfirmPasswordField()).toBeRequired();
  });

  it('shows an inline mismatch error as soon as the confirmation is typed', () => {
    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    );

    fireEvent.change(getPasswordField(), { target: { value: 'password123' } });
    fireEvent.change(getConfirmPasswordField(), { target: { value: 'different' } });

    expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
    expect(getConfirmPasswordField()).toHaveAttribute('aria-invalid', 'true');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('shows the mismatch error on blur even without further typing', () => {
    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    );

    fireEvent.change(getPasswordField(), { target: { value: 'password123' } });
    const confirmField = getConfirmPasswordField();
    fireEvent.change(confirmField, { target: { value: 'different' } });
    confirmField.blur();
    fireEvent.blur(confirmField);

    expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
  });

  it('blocks submission and keeps showing the mismatch error on submit', async () => {
    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    );

    fireEvent.change(getEmailField(), { target: { value: 'test@example.com' } });
    fireEvent.change(getUsernameField(), { target: { value: 'testuser' } });
    fireEvent.change(getPasswordField(), { target: { value: 'password123' } });
    fireEvent.change(getConfirmPasswordField(), { target: { value: 'different' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText("Passwords don't match")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('submits form with user input and shows a loading state', async () => {
    let resolveFetch;
    const mockFetch = vi.fn(() => new Promise((resolve) => { resolveFetch = resolve; }));
    global.fetch = mockFetch;

    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    );

    fireEvent.change(getEmailField(), { target: { value: 'test@example.com' } });
    fireEvent.change(getUsernameField(), { target: { value: 'testuser' } });
    fireEvent.change(getPasswordField(), { target: { value: 'password123' } });
    fireEvent.change(getConfirmPasswordField(), { target: { value: 'password123' } });
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    fireEvent.click(submitButton);
    expect(submitButton).toHaveAttribute('aria-busy', 'true');

    resolveFetch({ ok: true });

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      }),
      credentials: 'include'
    });

    await waitFor(() => expect(submitButton).not.toHaveAttribute('aria-busy'));
  });

  it('shows error message when API returns error', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Username already exists' })
    });

    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    );

    fireEvent.change(getEmailField(), { target: { value: 'test@example.com' } });
    fireEvent.change(getUsernameField(), { target: { value: 'testuser' } });
    fireEvent.change(getPasswordField(), { target: { value: 'password123' } });
    fireEvent.change(getConfirmPasswordField(), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Username already exists');
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
        <SignUp />
      </MemoryRouter>
    );

    fireEvent.change(getEmailField(), { target: { value: 'test@example.com' } });
    fireEvent.change(getUsernameField(), { target: { value: 'testuser' } });
    fireEvent.change(getPasswordField(), { target: { value: 'password123' } });
    fireEvent.change(getConfirmPasswordField(), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Registration failed');
  });

  it('shows a network error message when the request fails to reach the server', async () => {
    const mockFetch = vi.fn(() => Promise.reject(new TypeError('Failed to fetch')));
    global.fetch = mockFetch;

    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    );

    fireEvent.change(getEmailField(), { target: { value: 'test@example.com' } });
    fireEvent.change(getUsernameField(), { target: { value: 'testuser' } });
    fireEvent.change(getPasswordField(), { target: { value: 'password123' } });
    fireEvent.change(getConfirmPasswordField(), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to reach the server. Please try again.');
  });
});
