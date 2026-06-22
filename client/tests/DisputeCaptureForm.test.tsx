import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DisputeCaptureForm } from '../src/components/DisputeCaptureForm';
import type { Customer, Transaction, ReferenceData } from '../src/types/index';

const mockCustomer: Customer = {
  id: 'cust-1',
  name: 'John Doe',
  email: 'john@example.com',
  accountNumber: '1234567890',
};

const mockTransaction: Transaction = {
  id: 'tx-1',
  customerId: 'cust-1',
  amount: 5000,
  paymentType: 'CARD',
  status: 'COMPLETED',
  description: 'Online purchase at Store XYZ',
  transactionDate: '2024-01-15T10:30:00Z',
};

const mockReferenceData: ReferenceData = {
  paymentTypes: ['CARD', 'EFT', 'INTERNAL'],
  issueCategories: [
    'DUPLICATE_DEBIT',
    'FAILED_TRANSFER',
    'MISSING_PAYMENT',
    'UNAUTHORISED',
    'INCORRECT_AMOUNT',
    'CARD_DISPUTE',
  ],
  dataSource: 'mock',
};

describe('DisputeCaptureForm', () => {
  let onSubmit: ReturnType<typeof vi.fn>;
  let onBack: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSubmit = vi.fn();
    onBack = vi.fn();
    vi.restoreAllMocks();
  });

  function renderForm(props?: Partial<Parameters<typeof DisputeCaptureForm>[0]>) {
    return render(
      <DisputeCaptureForm
        customer={mockCustomer}
        transaction={mockTransaction}
        referenceData={mockReferenceData}
        onSubmit={onSubmit}
        onBack={onBack}
        {...props}
      />
    );
  }

  it('renders the heading and step indicator', () => {
    renderForm();
    expect(screen.getByText('Step 3: Capture Dispute Details')).toBeInTheDocument();
  });

  it('renders payment type as read-only and pre-populated from transaction', () => {
    renderForm();
    const paymentInput = screen.getByTestId('payment-type-select') as HTMLInputElement;
    expect(paymentInput).toHaveValue('Card Payment');
    expect(paymentInput).toHaveAttribute('readonly');
  });

  it('renders all 6 issue category options', () => {
    renderForm();
    const select = screen.getByTestId('issue-category-select') as HTMLSelectElement;
    // 6 categories + placeholder option
    expect(select.options).toHaveLength(7);
    expect(screen.getByText('Duplicate Debit')).toBeInTheDocument();
    expect(screen.getByText('Failed Transfer')).toBeInTheDocument();
    expect(screen.getByText('Missing Payment')).toBeInTheDocument();
    expect(screen.getByText('Unauthorised Transaction')).toBeInTheDocument();
    expect(screen.getByText('Incorrect Amount')).toBeInTheDocument();
    expect(screen.getByText('Card Dispute')).toBeInTheDocument();
  });

  it('renders the description textarea', () => {
    renderForm();
    expect(screen.getByTestId('description-input')).toBeInTheDocument();
  });

  it('shows validation error when submitting without issue category', async () => {
    renderForm();
    fireEvent.click(screen.getByTestId('submit-dispute-button'));
    expect(screen.getByTestId('issue-category-error')).toHaveTextContent(
      'Issue category is required'
    );
  });

  it('clears validation error when selecting an issue category', async () => {
    renderForm();
    fireEvent.click(screen.getByTestId('submit-dispute-button'));
    expect(screen.getByTestId('issue-category-error')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('issue-category-select'), {
      target: { value: 'DUPLICATE_DEBIT' },
    });
    expect(screen.queryByTestId('issue-category-error')).not.toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    renderForm();
    fireEvent.click(screen.getByTestId('back-button'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('calls mutate and onSubmit on successful form submission', async () => {
    const mockResponse = {
      disputeId: 'disp-1',
      referenceNumber: 'REF-001',
      status: 'OPEN' as const,
      triage: {
        recommendation: 'Escalate to fraud team',
        recommendationCode: 'ESCALATE_FRAUD' as const,
        priority: 'HIGH' as const,
        ageIndicator: 'NEW' as const,
        rulesTriggered: [],
      },
    };

    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      )
    );

    renderForm();

    fireEvent.change(screen.getByTestId('issue-category-select'), {
      target: { value: 'UNAUTHORISED' },
    });
    fireEvent.click(screen.getByTestId('submit-dispute-button'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(mockResponse);
    });
  });

  it('shows loading spinner while submitting', async () => {
    let resolveRequest: (value: Response) => void;
    const pendingPromise = new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    });

    vi.stubGlobal('fetch', vi.fn(() => pendingPromise));

    renderForm();

    fireEvent.change(screen.getByTestId('issue-category-select'), {
      target: { value: 'DUPLICATE_DEBIT' },
    });
    fireEvent.click(screen.getByTestId('submit-dispute-button'));

    await waitFor(() => {
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });

    expect(screen.getByTestId('submit-dispute-button')).toBeDisabled();

    // Resolve the pending request to clean up
    resolveRequest!({
      ok: true,
      json: () => Promise.resolve({ disputeId: 'disp-1', referenceNumber: 'REF-001', status: 'OPEN', triage: { recommendation: '', recommendationCode: 'CLOSE_RESOLVED', priority: 'LOW', ageIndicator: 'NEW', rulesTriggered: [] } }),
    } as Response);
  });

  it('displays transaction summary in sidebar', () => {
    renderForm();
    expect(screen.getByText('Selected Transaction')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    expect(screen.getByText('Online purchase at Store XYZ')).toBeInTheDocument();
  });

  it('handles EFT payment type display', () => {
    renderForm({
      transaction: { ...mockTransaction, paymentType: 'EFT' },
    });
    const paymentInput = screen.getByTestId('payment-type-select') as HTMLInputElement;
    expect(paymentInput).toHaveValue('EFT Payment');
  });

  it('handles null referenceData by falling back to all categories', () => {
    renderForm({ referenceData: null });
    const select = screen.getByTestId('issue-category-select') as HTMLSelectElement;
    // 6 categories + placeholder
    expect(select.options).toHaveLength(7);
  });
});
