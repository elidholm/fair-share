import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import NavBar from './NavBar';

vi.mock('./DesktopNavigation.jsx', () => ({ default: () => <div>Desktop Nav</div> }));
vi.mock('./MobileNavigation.jsx', () => ({ default: () => <div>Mobile Nav</div> }));

describe('NavBar Component', () => {
  it('renders both desktop and mobile navigation', () => {
    const { getByText } = render(<NavBar />);
    expect(getByText('Desktop Nav')).toBeInTheDocument();
    expect(getByText('Mobile Nav')).toBeInTheDocument();
  });
});
