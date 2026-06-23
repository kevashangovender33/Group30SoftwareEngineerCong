import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DisputeTable } from '../src/components/DisputeTable';
import type { DisputeListItem, SortField, SortOrder } from '../src/types/index';

const mockDisputes: DisputeListItem[] = [
  {
    id: 'disp-1',
    referenceNumber: 'REF-001',
    status: 'OPEN',
    priority: 'HIGH',
    ageIndicator: 'NEW',
    paymentType: 'CARD',
    issueCategory: 'DUPLICATE_DEBIT',
    recommendedAction: 'Escalate to Fraud Team',
    createdAt: '2026-06-22T14:30:00.000Z',
    customerName: 'John Smith',
    transactionAmount: 1250,
    triggeredRuleCount: 3,
  },
  {
    id: 'disp-2',
    referenceNumber: 'REF-002',
    status: 'TRIAGED',
    priority: 'MEDIUM',
    ageIndicator: 'AGING',
    paymentType: 'EFT',
    issueCategory: 'FAILED_TRANSFER',
    recommendedAction: 'Investigate',
    createdAt: '2026-05-10T09:00:00.000Z',
    customerName: 'Jane Doe',
    transactionAmount: 500.5,
    triggeredRuleCount: 1,
  },
];

function renderDisputeTable(overrides: Partial<Parameters<typeof DisputeTable>[0]> = {}) {
  const props = {
    disputes: mockDisputes,
    sortBy: 'createdAt' as SortField,
    sortOrder: 'desc' as SortOrder,
    onSort: vi.fn(),
    ...overrides,
  };
  const result = render(<DisputeTable {...props} />);
  return { ...result, props };
}

describe('DisputeTable', () => {
  describe('Column rendering', () => {
    it('renders all 9 column headers', () => {
      renderDisputeTable();
      const expectedHeaders = [
        'Date',
        'Customer',
        'Amount',
        'Payment Type',
        'Issue Category',
        'Action',
        'Priority',
        'Status',
        'Rules',
      ];
      expectedHeaders.forEach((header) => {
        expect(screen.getByText(header)).toBeInTheDocument();
      });
    });

    it('renders a row for each dispute', () => {
      renderDisputeTable();
      const rows = screen.getAllByTestId('dispute-row');
      expect(rows).toHaveLength(2);
    });

    it('renders all 9 columns of data for a dispute row', () => {
      renderDisputeTable({ disputes: [mockDisputes[0]] });

      // Date formatted
      expect(screen.getByText('22 Jun 2026')).toBeInTheDocument();
      // Customer name
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      // Amount formatted
      expect(screen.getByText('R 1,250.00')).toBeInTheDocument();
      // Payment type formatted
      expect(screen.getByText('Card Payment')).toBeInTheDocument();
      // Issue category formatted
      expect(screen.getByText('Duplicate Debit')).toBeInTheDocument();
      // Recommended action
      expect(screen.getByText('Escalate to Fraud Team')).toBeInTheDocument();
      // Priority badge
      expect(screen.getByTestId('priority-badge')).toBeInTheDocument();
      // Status badge
      expect(screen.getByTestId('status-badge')).toBeInTheDocument();
      // Rule count formatted
      expect(screen.getByText('3 rules')).toBeInTheDocument();
    });
  });

  describe('Sort indicator rendering', () => {
    it('shows ↓ on active column when sortOrder is desc', () => {
      renderDisputeTable({ sortBy: 'createdAt', sortOrder: 'desc' });
      const dateHeader = screen.getByTestId('table-header-createdAt');
      const indicator = dateHeader.querySelector('[data-testid="sort-indicator"]');
      expect(indicator).toHaveTextContent('↓');
    });

    it('shows ↑ on active column when sortOrder is asc', () => {
      renderDisputeTable({ sortBy: 'createdAt', sortOrder: 'asc' });
      const dateHeader = screen.getByTestId('table-header-createdAt');
      const indicator = dateHeader.querySelector('[data-testid="sort-indicator"]');
      expect(indicator).toHaveTextContent('↑');
    });

    it('shows ⇅ on inactive sortable columns', () => {
      renderDisputeTable({ sortBy: 'createdAt', sortOrder: 'desc' });
      const priorityHeader = screen.getByTestId('table-header-priority');
      const indicator = priorityHeader.querySelector('[data-testid="sort-indicator"]');
      expect(indicator).toHaveTextContent('⇅');
    });

    it('does not show sort indicator on non-sortable columns', () => {
      renderDisputeTable();
      const customerHeader = screen.getByTestId('table-header-customerName');
      const indicator = customerHeader.querySelector('[data-testid="sort-indicator"]');
      expect(indicator).toBeNull();
    });
  });

  describe('Sort interaction', () => {
    it('calls onSort with "createdAt" when Date header is clicked', () => {
      const { props } = renderDisputeTable();
      fireEvent.click(screen.getByTestId('table-header-createdAt'));
      expect(props.onSort).toHaveBeenCalledWith('createdAt');
    });

    it('calls onSort with "priority" when Priority header is clicked', () => {
      const { props } = renderDisputeTable();
      fireEvent.click(screen.getByTestId('table-header-priority'));
      expect(props.onSort).toHaveBeenCalledWith('priority');
    });

    it('calls onSort with "status" when Status header is clicked', () => {
      const { props } = renderDisputeTable();
      fireEvent.click(screen.getByTestId('table-header-status'));
      expect(props.onSort).toHaveBeenCalledWith('status');
    });

    it('does not call onSort when a non-sortable header is clicked', () => {
      const { props } = renderDisputeTable();
      fireEvent.click(screen.getByTestId('table-header-customerName'));
      expect(props.onSort).not.toHaveBeenCalled();
    });
  });

  describe('Formatters applied correctly', () => {
    it('applies formatDate to createdAt', () => {
      renderDisputeTable({ disputes: [mockDisputes[1]] });
      expect(screen.getByText('10 May 2026')).toBeInTheDocument();
    });

    it('applies formatCurrency to transactionAmount', () => {
      renderDisputeTable({ disputes: [mockDisputes[1]] });
      expect(screen.getByText('R 500.50')).toBeInTheDocument();
    });

    it('applies formatPaymentType for EFT', () => {
      renderDisputeTable({ disputes: [mockDisputes[1]] });
      expect(screen.getByText('EFT')).toBeInTheDocument();
    });

    it('applies formatIssueCategory for FAILED_TRANSFER', () => {
      renderDisputeTable({ disputes: [mockDisputes[1]] });
      expect(screen.getByText('Failed Transfer')).toBeInTheDocument();
    });

    it('applies formatRuleCount with singular form', () => {
      renderDisputeTable({ disputes: [mockDisputes[1]] });
      expect(screen.getByText('1 rule')).toBeInTheDocument();
    });

    it('applies formatRuleCount with plural form', () => {
      renderDisputeTable({ disputes: [mockDisputes[0]] });
      expect(screen.getByText('3 rules')).toBeInTheDocument();
    });
  });

  describe('PriorityBadge and StatusBadge rendering', () => {
    it('renders PriorityBadge in the priority column', () => {
      renderDisputeTable({ disputes: [mockDisputes[0]] });
      const badge = screen.getByTestId('priority-badge');
      expect(badge).toHaveTextContent('Priority: HIGH');
    });

    it('renders StatusBadge in the status column', () => {
      renderDisputeTable({ disputes: [mockDisputes[0]] });
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveTextContent('OPEN');
    });

    it('renders correct badges for multiple rows', () => {
      renderDisputeTable();
      const priorityBadges = screen.getAllByTestId('priority-badge');
      const statusBadges = screen.getAllByTestId('status-badge');

      expect(priorityBadges).toHaveLength(2);
      expect(statusBadges).toHaveLength(2);

      expect(priorityBadges[0]).toHaveTextContent('Priority: HIGH');
      expect(priorityBadges[1]).toHaveTextContent('Priority: MEDIUM');
      expect(statusBadges[0]).toHaveTextContent('OPEN');
      expect(statusBadges[1]).toHaveTextContent('TRIAGED');
    });
  });
});
