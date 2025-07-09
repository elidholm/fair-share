import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';

describe('Home Component', () => {
  it('renders welcome message', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome to Fair Share');
    expect(screen.getByText('Simplifying shared finances for couples and roommates')).toBeInTheDocument();
  });

  it('renders feature cards', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(screen.getByText('Split Costs')).toBeInTheDocument();
    expect(screen.getByText('Budget Planning')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Split Expenses|Plan Budget/ })).toHaveLength(2);
  });
});
