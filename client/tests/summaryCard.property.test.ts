import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { formatMetricValue } from '../src/components/SummaryCard';

/**
 * Feature: dispute-analytics-dashboard
 * Property 4: Metric value formatting with thousands separators
 *
 * For any non-negative integer, the formatting function produces a string
 * containing the number formatted with appropriate thousands separators
 * and no decimal places.
 */
describe('Property 4: Metric value formatting with thousands separators', () => {
  it('produces a non-empty string for any non-negative integer', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10_000_000 }), (value) => {
        const result = formatMetricValue(value);
        expect(result.length).toBeGreaterThan(0);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('formatted result contains no decimal point', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10_000_000 }), (value) => {
        const result = formatMetricValue(value);
        expect(result).not.toContain('.');
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('matches Intl.NumberFormat expected output', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10_000_000 }), (value) => {
        const result = formatMetricValue(value);
        const expected = new Intl.NumberFormat('en-ZA', { maximumFractionDigits: 0 }).format(value);
        expect(result).toBe(expected);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('preserves numeric value when separators are removed', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10_000_000 }), (value) => {
        const result = formatMetricValue(value);
        // Remove any non-digit characters (separators)
        const digitsOnly = result.replace(/\D/g, '');
        expect(parseInt(digitsOnly, 10)).toBe(value);
        return true;
      }),
      { numRuns: 100 }
    );
  });
});
