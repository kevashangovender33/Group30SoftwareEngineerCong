import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransactionSelect } from '../src/components/TransactionSelect';
import type { Transaction } from '../src/types/index';

const mockTransactions: Transaction[] = [
  {
    id: 'txn-001',
    customerId: 'cust-1',
    amount: 1429.5,
    paymentType: 'CARD',
    status: 'COMPLETED',
    description: 'WOOLWORTHS - SANDTON CITY',
    transactionDate: '2023-10-24T14:32:00Z',
  },
  {
    id: 'txn-002',
    customerId: 'cust-1',
    amount: 8999.0,
    paymentType: 'EFT',
    status: 'PENDING',
    description: 'TAKEALOT ONLINE STORE',
    transactionDate: '2023-10-24T11:05:00Z',
  },
  {
    id: 'txn-003',
    customerId: 'cust-1',
    amount: 3250.0,
    paymentType: 'CARD',
    status: 'FAILED',
    description: 'ZARA WATERFRONT',
    transactionDate: '2023-10-23T09:15:00Z',
  },
  {
    id: 'txn-004',
    customerId: 'cust-1',
    amount: 1150.0,
    paymentType: 'INTERNAL',
    status: 'ALREADY_REFUNDED',
    description: 'SHELL FORECOURT CT',
    transactionDate: '2023-10-22T16:21:00Z',
  },
];

describe('TransactionSelect', () => {
  const defaultProps = {
    customerId: 'cust-1',
    customerName: 'Adriaan van der Berg',
    onSelect: vi.fn(),
    onBack: vi.fn(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading state initially', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})) // never resolves
    );

    render(<TransactionSelect {...defaultProps} />);
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
  });

  it('renders transactions in a table after loading', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ transactions: mockTransactions }),
        } as Response)
      )
    );

    render(<TransactionSelect {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('transaction-item-txn-001')).toBeInTheDocument();
    });

    expect(screen.getByTestId('transaction-item-txn-002')).toBeInTheDocument();
    expect(screen.getByTestId('transaction-item-txn-003')).toBeInTheDocument();
    expect(screen.getByTestId('transaction-item-txn-004')).toBeInTheDocument();
  });

  it('displays the heading with step indicator and customer name', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ transactions: mockTransactions }),
        } as Response)
      )
    );

    render(<TransactionSelect {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Adriaan van der Berg')).toBeInTheDocument();
    });

    expect(screen.getByText(/Step 2/)).toBeInTheDocument();
  });

  it('formats amounts in ZAR currency format', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ transactions: [mockTransactions[0]] }),
        } as Response)
      )
    );

    render(<TransactionSelect {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('transaction-item-txn-001')).toBeInTheDocument();
    });

    // Amount should be formatted as ZAR
    expect(screen.getByText(/1[,\s]?429[.,]50/)).toBeInTheDocument();
  });

  it('shows status badges with correct styling', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ transactions: mockTransactions }),
        } as Response)
      )
    );

    render(<TransactionSelect {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('transaction-item-txn-001')).toBeInTheDocument();
    });

    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
    expect(screen.getByText('FAILED')).toBeInTheDocument();
    expect(screen.getByText('ALREADY_REFUNDED')).toBeInTheDocument();
  });

  it('calls onSelect when Select button is clicked', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ transactions: mockTransactions }),
        } as Response)
      )
    );

    render(<TransactionSelect {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('transaction-item-txn-001')).toBeInTheDocument();
    });

    const selectButtons = screen.getAllByRole('button', { name: /select/i });
    fireEvent.click(selectButtons[0]);

    expect(defaultProps.onSelect).toHaveBeenCalledWith(mockTransactions[0]);
  });

  it('calls onSelect when a row is clicked', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ transactions: mockTransactions }),
        } as Response)
      )
    );

    render(<TransactionSelect {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('transaction-item-txn-002')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('transaction-item-txn-002'));

    expect(defaultProps.onSelect).toHaveBeenCalledWith(mockTransactions[1]);
  });

  it('calls onBack when back button is clicked', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ transactions: mockTransactions }),
        } as Response)
      )
    );

    render(<TransactionSelect {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('back-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('back-button'));

    expect(defaultProps.onBack).toHaveBeenCalled();
  });

  it('shows error state when fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
        } as Response)
      )
    );

    render(<TransactionSelect {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toBeInTheDocument();
    });
  });

  it('shows empty state when no transactions exist', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ transactions: [] }),
        } as Response)
      )
    );

    render(<TransactionSelect {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('No transactions found for this customer.')).toBeInTheDocument();
    });
  });

  it('displays payment type badges', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ transactions: mockTransactions }),
        } as Response)
      )
    );

    render(<TransactionSelect {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('transaction-item-txn-001')).toBeInTheDocument();
    });

    const cardBadges = screen.getAllByText('CARD');
    expect(cardBadges.length).toBe(2); // two CARD transactions in test data
    expect(screen.getByText('EFT')).toBeInTheDocument();
    expect(screen.getByText('INTERNAL')).toBeInTheDocument();
  });
});
