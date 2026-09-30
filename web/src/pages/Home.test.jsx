import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';

function renderHome() {
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );
}

describe('Home Component', () => {
  it('renders welcome message', () => {
    renderHome();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome to Fair Share');
    expect(screen.getByText('Simplifying shared finances for couples and roommates')).toBeInTheDocument();
  });

  it('renders feature cards with real links preserving copy and destinations', () => {
    renderHome();

    expect(screen.getByRole('heading', { name: 'Split Costs' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Budget Planning' })).toBeInTheDocument();

    const splitLink = screen.getByRole('link', { name: 'Split Expenses' });
    expect(splitLink).toHaveAttribute('href', '/split-costs');

    const budgetLink = screen.getByRole('link', { name: 'Plan Budget' });
    expect(budgetLink).toHaveAttribute('href', '/budget');
  });

  it('renders the "How It Works" steps in order', () => {
    renderHome();

    const steps = screen.getAllByRole('listitem');
    expect(steps).toHaveLength(4);
    expect(steps[0]).toHaveTextContent('Enter individual incomes for fair expense distribution');
    expect(steps[1]).toHaveTextContent('Add your shared expenses with descriptions and amounts');
    expect(steps[2]).toHaveTextContent('Choose between proportional or equal splitting methods');
    expect(steps[3]).toHaveTextContent('View the calculated shares for each person');
  });

  it('renders working call-to-action links with the same copy and destinations', () => {
    renderHome();

    expect(screen.getByRole('heading', { name: 'Ready to simplify your shared finances?' })).toBeInTheDocument();

    const primaryLink = screen.getByRole('link', { name: 'Start Splitting Costs' });
    expect(primaryLink).toHaveAttribute('href', '/split-costs');

    const secondaryLink = screen.getByRole('link', { name: 'Create a Budget' });
    expect(secondaryLink).toHaveAttribute('href', '/budget');
  });
});
