/* eslint react/prop-types: 0 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';


vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null
  })
}));

// Mock child components and router dependencies
vi.mock('./pages/Home', () => ({ default: () => <div>Home Page</div> }));
vi.mock('./pages/Login', () => ({ default: () => <div>Login Page</div> }));
vi.mock('./pages/SignUp', () => ({ default: () => <div>SignUp Page</div> }));
vi.mock('./pages/CostCalculator', () => ({ default: () => <div>Split costs Page</div> }));
vi.mock('./components/nav_bar/NavBar', () => ({ default: () => <div>NavBar</div> }));
vi.mock('./components/Footer', () => ({ default: () => <div>Footer</div> }));

// Mock react-router-dom's createBrowserRouter
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    createBrowserRouter: vi.fn((routes) => ({
      ...routes[0],
      mock: true // Add mock identifier
    })),
    RouterProvider: ({ router }) => (
      <div data-testid="router-provider">
        {router.element}
        {router.children?.map((child) => (
          <div key={child.path}>{child.element}</div>
        ))}
      </div>
    )
  };
});

describe('App Component', () => {
  var global = global || window;
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText('NavBar')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });
});
