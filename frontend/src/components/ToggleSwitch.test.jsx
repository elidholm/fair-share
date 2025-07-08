import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ToggleSwitch from './ToggleSwitch';

describe('ToggleSwitch Component', () => {
  const mockOnChange = vi.fn();

  it('renders with default props', () => {
    render(
      <ToggleSwitch
        id="test-switch"
        checked={false}
        onChange={mockOnChange}
      />
    );
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('toggles when clicked', () => {
    render(
      <ToggleSwitch
        id="test-switch"
        checked={false}
        onChange={mockOnChange}
      />
    );
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(mockOnChange).toHaveBeenCalledWith(true);
  });

  it('handles space key press', () => {
    render(
      <ToggleSwitch
        id="test-switch"
        checked={false}
        onChange={mockOnChange}
      />
    );
    const label = screen.getByTestId('toggle-label');
    fireEvent.keyDown(label, { keyCode: 32 });
    expect(mockOnChange).toHaveBeenCalledWith(true);
  });
});
