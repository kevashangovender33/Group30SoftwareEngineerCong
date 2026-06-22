import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomerSelect } from '../src/components/CustomerSelect';

const mockCustomers = [
  { id: 'cust-1', name: 'John Smith', email: 'john@example.com', accountNumber: 'ACCT-001' },
  { id: 'cust-2', name: 'Jane Doe', email: 'jane@example.com', accountNumber: 'ACCT-002' },
];

describe('CustomerSelect', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ customers: mockCustomers }),
        } as Response)
      )
    );
  });

  it('renders search input with correct placeholder', () => {
    render(<CustomerSelect onSelect={() => {}} />);
    const input = screen.getByTestId('customer-search-input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute(
      'placeholder',
      'Enter name, email or account number (e.g. ACCT-8823)'
    );
  });

  it('displays customer list when data is returned', async () => {
    render(<CustomerSelect onSelect={() => {}} />);

    await waitFor(() => {
      expect(screen.getByTestId('customer-list')).toBeInTheDocument();
    });

    expect(screen.getByTestId('customer-item-cust-1')).toBeInTheDocument();
    expect(screen.getByTestId('customer-item-cust-2')).toBeInTheDocument();
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('calls onSelect when a customer card is clicked', async () => {
    const onSelect = vi.fn();
    render(<CustomerSelect onSelect={onSelect} />);

    await waitFor(() => {
      expect(screen.getByTestId('customer-item-cust-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('customer-item-cust-1'));
    expect(onSelect).toHaveBeenCalledWith(mockCustomers[0]);
  });

  it('shows "No customers found" when results are empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ customers: [] }),
        } as Response)
      )
    );

    render(<CustomerSelect onSelect={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('No customers found matching your search.')).toBeInTheDocument();
    });
  });

  it('displays step indicator and heading', () => {
    render(<CustomerSelect onSelect={() => {}} />);
    expect(screen.getByText('Step 1: Select Customer')).toBeInTheDocument();
  });

  it('updates search input value when user types', async () => {
    render(<CustomerSelect onSelect={() => {}} />);
    const input = screen.getByTestId('customer-search-input');

    fireEvent.change(input, { target: { value: 'john' } });
    expect(input).toHaveValue('john');
  });
});
