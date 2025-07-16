import React from "react";
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CostCalculator from './CostCalculator';
import { useAuth } from '../context/AuthContext'

vi.mock('../context/AuthContext');

describe('CostCalculator Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: null
    });
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('loads incomes from localStorage', async () => {
    const testIncomes = [
      { name: "Test1", amount: 1000 },
      { name: "Test2", amount: 2000 }
    ];
    localStorage.setItem("incomes", JSON.stringify(testIncomes));

    render(<CostCalculator />);

    await waitFor(() => {
      expect(screen.getByText('Test1')).toBeInTheDocument();
      expect(screen.getByText('Test2')).toBeInTheDocument();
    });
  });

  it('income value updates when input changes', () => {
    localStorage.setItem("incomes", JSON.stringify([{ name: "Test", amount: "" }]));
    render(<CostCalculator />);

    const input = screen.getByTestId('income-0');
    fireEvent.change(input, { target: { value: '1000' } });
    expect(input.value).toBe('1000');
  });

  it('income fields can be reset', () => {
    localStorage.setItem("incomes", JSON.stringify([{ name: "Test", amount: "" }]));
    render(<CostCalculator />);

    const input = screen.getByTestId('income-0');
    fireEvent.change(input, { target: { value: '1000' } });
    fireEvent.change(input, { target: { value: '' } });
    expect(input.value).toBe('');
  });

  it('does not allow text input in income fields', () => {
    localStorage.setItem("incomes", JSON.stringify([{ name: "Test", amount: "" }]));
    render(<CostCalculator />);

    const input = screen.getByTestId('income-0');
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(input.value).toBe(''); // Should not allow text input
  });

  it('adds new income', () => {
    render(<CostCalculator />);

    const input = screen.getByPlaceholderText('Enter new income...');
    const addButton = screen.getByRole('button', { name: 'Add Income' });

    fireEvent.change(input, { target: { value: 'New Income' } });
    fireEvent.click(addButton);

    expect(screen.getByText('New Income')).toBeInTheDocument();
  });

  it('removes income when delete button clicked', () => {
    localStorage.setItem("incomes", JSON.stringify([{ name: "ToDelete", amount: 1000 }]));
    render(<CostCalculator />);

    const deleteButton = screen.getByTitle('ToDelete');
    fireEvent.click(deleteButton);

    expect(screen.queryByText('ToDelete')).not.toBeInTheDocument();
  });

  it('expense value updates when input changes', () => {
    localStorage.setItem("expenses", JSON.stringify([{ name: "Test", amount: "" }]));
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
    const addButton = screen.getByRole('button', { name: 'Add Expense' });

    fireEvent.change(input, { target: { value: 'New Expense' } });
    fireEvent.click(addButton);

    expect(screen.getByText('New Expense')).toBeInTheDocument();
  });

  it('removes expense when delete button clicked', () => {
    render(<CostCalculator />);

    const deleteButton = screen.getByTitle('Rent');
    fireEvent.click(deleteButton);

    expect(screen.queryByText('Rent')).not.toBeInTheDocument();
  });

  it('handles logged-in user state', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { username: "testuser" }
    });

    const mockIncomes = [{ name: "DB Income", amount: 3000 }];
    const mockExpenses = [{ name: "DB Expense", amount: 69 }];
    global.fetch = vi.fn()
      .mockImplementation((url) => {
        if (url.includes('/incomes')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ incomes: mockIncomes })
          });
        }
        if (url.includes('/expenses')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ expenses: mockExpenses })
          });
        }
        return Promise.reject(new Error('Unexpected URL'));
      });


    render(<CostCalculator />);

    expect(fetch).toHaveBeenCalledWith('/api/incomes', expect.anything());
    expect(fetch).toHaveBeenCalledWith('/api/expenses', expect.anything());

    await waitFor(() => {
      // Verify both incomes and expenses from DB are loaded
      expect(screen.getByText('DB Income')).toBeInTheDocument();
      expect(screen.getByText('DB Expense')).toBeInTheDocument();
    });
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

  it('clears both database and localStorage when user is logged in', async () => {
    // Mock logged-in user
    vi.mocked(useAuth).mockReturnValue({
      user: { username: "testuser" }
    });

    // Set up mock localStorage data
    localStorage.setItem("incomes", JSON.stringify([{ name: "Local Income", amount: 1000 }]));
    localStorage.setItem("expenses", JSON.stringify([{ name: "Local Expense", amount: 500 }]));

    const mockIncomes = [{ name: "DB Income", amount: 3000 }];
    const mockExpenses = [{ name: "DB Expense", amount: 69 }];

    // Mock fetch responses for DELETE endpoints
    global.fetch = vi.fn()
      .mockImplementation((url, options) => {
        if (url.includes('/incomes') && options?.method === 'DELETE') {
          return Promise.resolve({ ok: true });
        }
        if (url.includes('/expenses') && options?.method === 'DELETE') {
          return Promise.resolve({ ok: true });
        }
        if (url.includes('/incomes')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ incomes: mockIncomes })
          });
        }
        if (url.includes('/expenses')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ expenses: mockExpenses })
          });
        }
        return Promise.reject(new Error('Unexpected API call'));
      });

    render(<CostCalculator />);

    // Verify initial data is present
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/incomes', expect.objectContaining({
        credentials: 'include'
      }));
      expect(fetch).toHaveBeenCalledWith('/api/expenses', expect.objectContaining({
        credentials: 'include'
      }));
      expect(screen.getByText('DB Income')).toBeInTheDocument();
      expect(screen.getByText('DB Expense')).toBeInTheDocument();
    });

    // Click the clear storage button
    fireEvent.click(screen.getByTitle('Clear Local Storage'));

    await waitFor(() => {
      // Verify database DELETE calls were made
      expect(fetch).toHaveBeenCalledWith('/api/incomes', expect.objectContaining({
        method: 'DELETE',
        credentials: 'include'
      }));
      expect(fetch).toHaveBeenCalledWith('/api/expenses', expect.objectContaining({
        method: 'DELETE',
        credentials: 'include'
      }));

      // Verify localStorage was cleared
      expect(localStorage.getItem("incomes")).toBeNull();
      expect(localStorage.getItem("expenses")).toBeNull();

      // Verify UI was reset to defaults
      expect(screen.queryByText('Test Income')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Expense')).not.toBeInTheDocument();
      expect(screen.getByTestId('total-income').textContent).toBe('Total: 0 kr');
      expect(screen.getByTestId('total-expenses').textContent).toContain('Total:');
    });
  });
});
