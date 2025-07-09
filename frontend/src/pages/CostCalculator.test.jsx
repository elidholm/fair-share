import React from "react";
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CostCalculator from './CostCalculator';

describe('CostCalculator Component', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders with default incomes and expenses', () => {
    render(<CostCalculator />);

    expect(screen.getByText('Edvin')).toBeInTheDocument();
    expect(screen.getByText('Elinore')).toBeInTheDocument();
    expect(screen.getByText('Rent')).toBeInTheDocument();
    expect(screen.getByText('Parking')).toBeInTheDocument();
  });

  it('income value updates when input changes', () => {
    render(<CostCalculator />);

    const input = screen.getByTestId('income-0');
    fireEvent.change(input, { target: { value: '1000' } });
    expect(input.value).toBe('1000');
  });

  it('income fields can be reset', () => {
    render(<CostCalculator />);

    const input = screen.getByTestId('income-0');
    fireEvent.change(input, { target: { value: '1000' } });
    fireEvent.change(input, { target: { value: '' } });
    expect(input.value).toBe('');
  });

  it('does not allow text input in income fields', () => {
    render(<CostCalculator />);

    const input = screen.getByTestId('income-0');
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(input.value).toBe(''); // Should not allow text input
  });

  it('adds new income', () => {
    render(<CostCalculator />);

    const input = screen.getByPlaceholderText('Enter new income...');
    fireEvent.change(input, { target: { value: 'New Income' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Income' }));

    expect(screen.getByText('New Income')).toBeInTheDocument();
  });

  it('expense value updates when input changes', () => {
    render(<CostCalculator />);

    const input = screen.getByTestId('expense-0');
    fireEvent.change(input, { target: { value: '500' } });
    expect(input.value).toBe('500');
  });

  it('expense fields can be reset', () => {
    render(<CostCalculator />);

    const input = screen.getByTestId('expense-1');
    fireEvent.change(input, { target: { value: '1000' } });
    fireEvent.change(input, { target: { value: '' } });
    expect(input.value).toBe('');
  });

  it('does not allow text input in expense fields', () => {
    render(<CostCalculator />);
    const input = screen.getByTestId('expense-0');
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(input.value).toBe(''); // Should not allow text input
  });

  it('adds new expense', () => {
    render(<CostCalculator />);

    const input = screen.getByPlaceholderText('Enter new expense...');
    fireEvent.change(input, { target: { value: 'New Expense' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Expense' }));

    expect(screen.getByText('New Expense')).toBeInTheDocument();
  });

  it('removes income when delete button clicked', () => {
    render(<CostCalculator />);

    const deleteButton = screen.getByTitle('Edvin');
    fireEvent.click(deleteButton);

    expect(screen.queryByText('Edvin')).not.toBeInTheDocument();
  });

  it('removes expense when delete button clicked', () => {
    render(<CostCalculator />);

    const deleteButton = screen.getByTitle('Rent');
    fireEvent.click(deleteButton);

    expect(screen.queryByText('Rent')).not.toBeInTheDocument();
  });

  it('calculates shares in proportional mode', () => {
    const mockIncomes = [
      { name: "Person1", amount: 6000 },
      { name: "Person2", amount: 4000 }
    ];
    const mockExpenses = [
      { name: "Expense1", amount: 1000 }
    ];

    vi.spyOn(window.localStorage.__proto__, 'getItem')
      .mockImplementation((key) => {
        if (key === 'incomes') return JSON.stringify(mockIncomes);
        if (key === 'expenses') return JSON.stringify(mockExpenses);
        return null;
      });

    render(<CostCalculator />);

    fireEvent.click(screen.getByText('Split Expenses'));

    expect(screen.getByText(/Person1.*600.*60.00%/i)).toBeInTheDocument();
    expect(screen.getByText(/Person2.*400.*40.00%/i)).toBeInTheDocument();
  });

  it('calculates shares in equal split mode', () => {
    const mockIncomes = [
      { name: "PersonA", amount: 8000 },
      { name: "PersonB", amount: 2000 }
    ];
    const mockExpenses = [
      { name: "SharedExpense", amount: 1000 }
    ];

    vi.spyOn(window.localStorage.__proto__, 'getItem')
      .mockImplementation((key) => {
        if (key === 'incomes') return JSON.stringify(mockIncomes);
        if (key === 'expenses') return JSON.stringify(mockExpenses);
        return null;
      });

    render(<CostCalculator />);

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByText('Split Expenses'));

    expect(screen.getByText(/PersonA.*500.*50.00%/i)).toBeInTheDocument();
    expect(screen.getByText(/PersonB.*500.*50.00%/i)).toBeInTheDocument();
  });

  it('clears localStorage when reset button clicked', () => {
    render(<CostCalculator />);

    const spy = vi.spyOn(Storage.prototype, 'removeItem');
    fireEvent.click(screen.getByTitle('Clear Local Storage'));

    expect(spy).toHaveBeenCalledWith('incomes');
    expect(spy).toHaveBeenCalledWith('expenses');
  });
});
