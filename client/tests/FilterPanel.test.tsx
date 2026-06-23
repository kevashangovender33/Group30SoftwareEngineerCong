import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FilterPanel } from '../src/components/FilterPanel';
import type { DisputeFilters } from '../src/types/index';

const defaultFilters: DisputeFilters = {
  customerName: '',
  paymentType: '',
  issueCategory: '',
  priority: '',
  status: '',
  startDate: '',
  endDate: '',
};

function renderFilterPanel(overrides: Partial<Parameters<typeof FilterPanel>[0]> = {}) {
  const props = {
    filters: defaultFilters,
    onFiltersChange: vi.fn(),
    onClear: vi.fn(),
    activeFilterCount: 0,
    disabled: false,
    ...overrides,
  };
  const result = render(<FilterPanel {...props} />);
  return { ...result, props };
}

describe('FilterPanel', () => {
  describe('Rendering filter controls', () => {
    it('renders customer name text input', () => {
      renderFilterPanel();
      const input = screen.getByTestId('filter-customer-name');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
    });

    it('renders payment type dropdown', () => {
      renderFilterPanel();
      const select = screen.getByTestId('filter-payment-type');
      expect(select).toBeInTheDocument();
      expect(select.tagName).toBe('SELECT');
    });

    it('renders issue category dropdown', () => {
      renderFilterPanel();
      const select = screen.getByTestId('filter-issue-category');
      expect(select).toBeInTheDocument();
      expect(select.tagName).toBe('SELECT');
    });

    it('renders priority dropdown', () => {
      renderFilterPanel();
      const select = screen.getByTestId('filter-priority');
      expect(select).toBeInTheDocument();
      expect(select.tagName).toBe('SELECT');
    });

    it('renders status dropdown', () => {
      renderFilterPanel();
      const select = screen.getByTestId('filter-status');
      expect(select).toBeInTheDocument();
      expect(select.tagName).toBe('SELECT');
    });

    it('renders start date input', () => {
      renderFilterPanel();
      const input = screen.getByTestId('filter-start-date');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'date');
    });

    it('renders end date input', () => {
      renderFilterPanel();
      const input = screen.getByTestId('filter-end-date');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'date');
    });
  });

  describe('Clear Filters button', () => {
    it('renders Clear Filters button', () => {
      renderFilterPanel();
      expect(screen.getByTestId('filter-clear')).toBeInTheDocument();
    });

    it('calls onClear when Clear Filters button is clicked', () => {
      const { props } = renderFilterPanel();
      fireEvent.click(screen.getByTestId('filter-clear'));
      expect(props.onClear).toHaveBeenCalledTimes(1);
    });
  });

  describe('Active filter count badge', () => {
    it('does not show count badge when activeFilterCount is 0', () => {
      renderFilterPanel({ activeFilterCount: 0 });
      expect(screen.queryByTestId('filter-count')).not.toBeInTheDocument();
    });

    it('shows count badge when activeFilterCount > 0', () => {
      renderFilterPanel({ activeFilterCount: 3 });
      const badge = screen.getByTestId('filter-count');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('3');
    });

    it('shows correct count for 1 active filter', () => {
      renderFilterPanel({ activeFilterCount: 1 });
      const badge = screen.getByTestId('filter-count');
      expect(badge).toHaveTextContent('1');
    });
  });

  describe('Date range validation', () => {
    it('shows error when start date is after end date', () => {
      const filters: DisputeFilters = {
        ...defaultFilters,
        endDate: '2024-01-01',
      };
      const onFiltersChange = vi.fn();
      renderFilterPanel({ filters, onFiltersChange });

      // Set start date to after end date
      fireEvent.change(screen.getByTestId('filter-start-date'), {
        target: { value: '2024-06-15' },
      });

      expect(screen.getByTestId('filter-date-error')).toBeInTheDocument();
      expect(screen.getByTestId('filter-date-error')).toHaveTextContent(
        'Start date must be before or equal to end date'
      );
    });

    it('does NOT call onFiltersChange when start > end', () => {
      const filters: DisputeFilters = {
        ...defaultFilters,
        endDate: '2024-01-01',
      };
      const onFiltersChange = vi.fn();
      renderFilterPanel({ filters, onFiltersChange });

      fireEvent.change(screen.getByTestId('filter-start-date'), {
        target: { value: '2024-06-15' },
      });

      expect(onFiltersChange).not.toHaveBeenCalled();
    });

    it('calls onFiltersChange when date range is valid', () => {
      const filters: DisputeFilters = {
        ...defaultFilters,
        startDate: '2024-01-01',
      };
      const onFiltersChange = vi.fn();
      renderFilterPanel({ filters, onFiltersChange });

      fireEvent.change(screen.getByTestId('filter-end-date'), {
        target: { value: '2024-06-15' },
      });

      expect(onFiltersChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Disabled state', () => {
    it('applies opacity and pointer-events-none when disabled', () => {
      renderFilterPanel({ disabled: true });
      const panel = screen.getByTestId('filter-panel');
      expect(panel.className).toContain('opacity-50');
      expect(panel.className).toContain('pointer-events-none');
    });

    it('does not apply disabled styles when enabled', () => {
      renderFilterPanel({ disabled: false });
      const panel = screen.getByTestId('filter-panel');
      expect(panel.className).not.toContain('opacity-50');
      expect(panel.className).not.toContain('pointer-events-none');
    });
  });

  describe('Customer name input constraints', () => {
    it('has maxLength of 100', () => {
      renderFilterPanel();
      const input = screen.getByTestId('filter-customer-name');
      expect(input).toHaveAttribute('maxLength', '100');
    });

    it('calls onFiltersChange when customer name changes', () => {
      const onFiltersChange = vi.fn();
      renderFilterPanel({ onFiltersChange });

      fireEvent.change(screen.getByTestId('filter-customer-name'), {
        target: { value: 'John' },
      });

      expect(onFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        customerName: 'John',
      });
    });
  });
});
