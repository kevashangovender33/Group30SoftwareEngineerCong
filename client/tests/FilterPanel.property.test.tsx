import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('Feature: dispute-history-view, Property 8: Date range validation rejects invalid ranges', () => {
  /**
   * Validates: Requirements 4.7
   *
   * For any pair of dates where startDate is strictly later than endDate,
   * the filter panel SHALL reject the input with a validation error and SHALL NOT
   * issue an API request. For any pair where startDate <= endDate, the filter SHALL be accepted.
   */

  let onFiltersChange: ReturnType<typeof vi.fn>;
  let onClear: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onFiltersChange = vi.fn();
    onClear = vi.fn();
  });

  /**
   * Generate a date string in YYYY-MM-DD format from a Date object.
   */
  function toDateString(date: Date): string {
    const y = date.getFullYear().toString().padStart(4, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Arbitrary that generates a date between 2000-01-01 and 2099-12-31 as a YYYY-MM-DD string.
   */
  const dateArb = fc
    .integer({ min: new Date('2000-01-01').getTime(), max: new Date('2099-12-31').getTime() })
    .map((ts) => toDateString(new Date(ts)));

  it('rejects date ranges where startDate > endDate (shows error, does not call onFiltersChange)', () => {
    fc.assert(
      fc.property(
        dateArb,
        dateArb,
        (dateA, dateB) => {
          // Only test cases where start is strictly after end
          fc.pre(dateA > dateB);

          const startDate = dateA;
          const endDate = dateB;

          // Set endDate first so that when we set startDate, both are present
          const filtersWithEnd: DisputeFilters = { ...defaultFilters, endDate };

          onFiltersChange.mockClear();

          const { unmount } = render(
            <FilterPanel
              filters={filtersWithEnd}
              onFiltersChange={onFiltersChange}
              onClear={onClear}
              activeFilterCount={0}
              disabled={false}
            />
          );

          // Simulate setting the startDate that is after endDate
          const startInput = screen.getByTestId('filter-start-date');
          fireEvent.change(startInput, { target: { value: startDate } });

          // Should show validation error
          const errorEl = screen.queryByTestId('filter-date-error');
          expect(errorEl).not.toBeNull();
          expect(errorEl!.textContent).toContain('Start date must be before or equal to end date');

          // Should NOT have called onFiltersChange
          expect(onFiltersChange).not.toHaveBeenCalled();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('accepts date ranges where startDate <= endDate (no error, calls onFiltersChange)', () => {
    fc.assert(
      fc.property(
        dateArb,
        dateArb,
        (dateA, dateB) => {
          // Only test cases where start <= end
          const startDate = dateA <= dateB ? dateA : dateB;
          const endDate = dateA <= dateB ? dateB : dateA;

          // Set startDate first so that when we set endDate, both are present
          const filtersWithStart: DisputeFilters = { ...defaultFilters, startDate };

          onFiltersChange.mockClear();

          const { unmount } = render(
            <FilterPanel
              filters={filtersWithStart}
              onFiltersChange={onFiltersChange}
              onClear={onClear}
              activeFilterCount={0}
              disabled={false}
            />
          );

          // Simulate setting the endDate that is >= startDate
          const endInput = screen.getByTestId('filter-end-date');
          fireEvent.change(endInput, { target: { value: endDate } });

          // Should NOT show validation error
          const errorEl = screen.queryByTestId('filter-date-error');
          expect(errorEl).toBeNull();

          // Should have called onFiltersChange with the updated filters
          expect(onFiltersChange).toHaveBeenCalledTimes(1);
          expect(onFiltersChange).toHaveBeenCalledWith(
            expect.objectContaining({ startDate, endDate })
          );

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
