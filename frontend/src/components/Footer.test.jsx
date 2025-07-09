import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from './Footer';

describe('Footer Component', () => {
  it('renders the current year', () => {
    const currentYear = new Date().getFullYear();
    render(<Footer />);

    expect(
      screen.getByText(`FairShare — © ${currentYear} Edvin Lidholm`)
    ).toBeInTheDocument();
  });

  it('has the correct structure', () => {
    render(<Footer />);

    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
    expect(footer.tagName).toBe('FOOTER');
    expect(footer).toHaveTextContent('FairShare');
    expect(footer).toHaveTextContent('Edvin Lidholm');
  });
});
