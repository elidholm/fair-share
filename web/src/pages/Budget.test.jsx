import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Budget from './Budget';

describe('Budget Component', () => {
  it('renders the budget page title', () => {
    render(<Budget />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Budget');
  });
});
