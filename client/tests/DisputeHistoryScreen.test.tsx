import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DisputeHistoryScreen } from '../src/components/DisputeHistoryScreen';
import type { UseDisputeHistoryResult } from '../src/hooks/useDisputeHistory';
import type { DisputeListResponse } from '../src/types/index';

// Mock the useDisputeHistory hook
const mockRefetch = vi.fn();
let mockHookResult: UseDisputeHistoryResult;

vi.mock('../src/hooks/useDisputeHistory', () => ({
  useDisputeHistory: () => mockHookResult,
}));

// Mock child components to isolate DisputeHistoryScreen logic
vi.mock('../src/components/FilterPanel', () => ({
  FilterPanel: () => <div data-testid="filter-panel">FilterPanel</div>,
}));

vi.mock('../src/components/DisputeTable', () => ({
  DisputeTable: () => <div data-testid="dispute-table">DisputeTable</div>,
}));

vi.mock('../src/components/PaginationControls', () => ({
  PaginationControls: () => (
    <div data-testid="pagination-controls">PaginationControls</div>
  ),
}));

const sampleData: DisputeListResponse = {
  disputes: [
    {
      id: '1',
      referenceNumber: 'REF-001',
      status: 'OPEN',
      priority: 'HIGH',
      ageIndicator: 'NEW',
      paymentType: 'CARD',
      issueCategory: 'DUPLICATE_DEBIT',
      recommendedAction: 'Escalate to Fraud Team',
      createdAt: '2026-06-22T10:00:00.000Z',
      customerName: 'John Doe',
      transactionAmount: 1250,
      triggeredRuleCount: 2,
    },
  ],
  totalCount: 1,
  page: 1,
  totalPages: 1,
};

describe('DisputeHistoryScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRefetch.mockReset();
  });

  describe('Loading state', () => {
    it('renders a loading indicator when data is loading', () => {
      mockHookResult = {
        data: null,
        loading: true,
        error: null,
        refetch: mockRefetch,
      };

      render(<DisputeHistoryScreen />);
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('renders an error message and retry button on error', () => {
      mockHookResult = {
        data: null,
        loading: false,
        error: 'Failed to fetch disputes: 500',
        refetch: mockRefetch,
      };

      render(<DisputeHistoryScreen />);
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
      expect(
        screen.getByText('Failed to fetch disputes: 500')
      ).toBeInTheDocument();
    });

    it('calls refetch when retry button is clicked', () => {
      mockHookResult = {
        data: null,
        loading: false,
        error: 'Network error',
        refetch: mockRefetch,
      };

      render(<DisputeHistoryScreen />);
      fireEvent.click(screen.getByTestId('retry-button'));
      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Empty state', () => {
    it('renders an empty message when no disputes exist', () => {
      mockHookResult = {
        data: { disputes: [], totalCount: 0, page: 1, totalPages: 0 },
        loading: false,
        error: null,
        refetch: mockRefetch,
      };

      render(<DisputeHistoryScreen />);
      expect(screen.getByTestId('empty-message')).toBeInTheDocument();
      expect(screen.getByText('No disputes found.')).toBeInTheDocument();
    });

    it('hides pagination controls in empty state', () => {
      mockHookResult = {
        data: { disputes: [], totalCount: 0, page: 1, totalPages: 0 },
        loading: false,
        error: null,
        refetch: mockRefetch,
      };

      render(<DisputeHistoryScreen />);
      expect(
        screen.queryByTestId('pagination-controls')
      ).not.toBeInTheDocument();
    });

    it('includes customer name in empty message for customer-specific mode', () => {
      mockHookResult = {
        data: { disputes: [], totalCount: 0, page: 1, totalPages: 0 },
        loading: false,
        error: null,
        refetch: mockRefetch,
      };

      render(
        <DisputeHistoryScreen
          customerId="cust-1"
          customerName="Jane Smith"
        />
      );
      expect(
        screen.getByText('No disputes found for Jane Smith.')
      ).toBeInTheDocument();
    });
  });

  describe('Data state', () => {
    it('renders FilterPanel, DisputeTable, and PaginationControls with data', () => {
      mockHookResult = {
        data: sampleData,
        loading: false,
        error: null,
        refetch: mockRefetch,
      };

      render(<DisputeHistoryScreen />);
      expect(screen.getByTestId('filter-panel')).toBeInTheDocument();
      expect(screen.getByTestId('dispute-table')).toBeInTheDocument();
      expect(screen.getByTestId('pagination-controls')).toBeInTheDocument();
    });
  });

  describe('Global mode', () => {
    it('renders h1 "Dispute History" heading', () => {
      mockHookResult = {
        data: sampleData,
        loading: false,
        error: null,
        refetch: mockRefetch,
      };

      render(<DisputeHistoryScreen />);
      const heading = screen.getByRole('heading', {
        level: 1,
        name: 'Dispute History',
      });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Customer-specific mode', () => {
    it('renders h2 heading with customer name', () => {
      mockHookResult = {
        data: sampleData,
        loading: false,
        error: null,
        refetch: mockRefetch,
      };

      render(
        <DisputeHistoryScreen
          customerId="cust-1"
          customerName="Jane Smith"
          onBack={vi.fn()}
          onProceed={vi.fn()}
        />
      );
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Jane Smith');
    });

    it('renders back button and proceed button', () => {
      mockHookResult = {
        data: sampleData,
        loading: false,
        error: null,
        refetch: mockRefetch,
      };

      render(
        <DisputeHistoryScreen
          customerId="cust-1"
          customerName="Jane Smith"
          onBack={vi.fn()}
          onProceed={vi.fn()}
        />
      );
      expect(screen.getByTestId('back-button')).toBeInTheDocument();
      expect(screen.getByTestId('proceed-button')).toBeInTheDocument();
    });

    it('calls onBack when back button is clicked', () => {
      mockHookResult = {
        data: sampleData,
        loading: false,
        error: null,
        refetch: mockRefetch,
      };
      const onBack = vi.fn();

      render(
        <DisputeHistoryScreen
          customerId="cust-1"
          customerName="Jane Smith"
          onBack={onBack}
          onProceed={vi.fn()}
        />
      );
      fireEvent.click(screen.getByTestId('back-button'));
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('calls onProceed when proceed button is clicked', () => {
      mockHookResult = {
        data: sampleData,
        loading: false,
        error: null,
        refetch: mockRefetch,
      };
      const onProceed = vi.fn();

      render(
        <DisputeHistoryScreen
          customerId="cust-1"
          customerName="Jane Smith"
          onBack={vi.fn()}
          onProceed={onProceed}
        />
      );
      fireEvent.click(screen.getByTestId('proceed-button'));
      expect(onProceed).toHaveBeenCalledTimes(1);
    });
  });
});
