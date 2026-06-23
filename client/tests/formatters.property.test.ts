import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { formatDate, formatCurrency, formatRuleCount } from '../src/utils/formatters';

describe('Feature: dispute-history-view, Property 3: Date formatting produces DD MMM YYYY', () => {
  /**
   * Validates: Requirements 7.1
   *
   * For any valid ISO 8601 date-time string (year 2000–2099), formatDate SHALL produce
   * a string matching the pattern "DD MMM YYYY" where DD is a zero-padded day (01–31),
   * MMM is a three-letter English month abbreviation, and YYYY is a four-digit year.
   */
  it('should produce DD MMM YYYY for any date in 2000–2099', () => {
    const minTs = new Date('2000-01-01T00:00:00.000Z').getTime();
    const maxTs = new Date('2099-12-31T23:59:59.999Z').getTime();

    fc.assert(
      fc.property(
        fc.integer({ min: minTs, max: maxTs }),
        (timestamp) => {
          const date = new Date(timestamp);
          const isoString = date.toISOString();
          const result = formatDate(isoString);
          expect(result).toMatch(/^\d{2} [A-Z][a-z]{2} \d{4}$/);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: dispute-history-view, Property 4: Currency formatting produces R X,XXX.XX', () => {
  /**
   * Validates: Requirements 7.2
   *
   * For any non-negative number, formatCurrency SHALL produce a string starting with "R "
   * followed by the integer part with comma-separated thousands and exactly two decimal places.
   */
  it('should produce R X,XXX.XX for any non-negative float', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 99_999_999_999 }).map((cents) => cents / 100),
        (amount) => {
          const result = formatCurrency(amount);
          expect(result.startsWith('R ')).toBe(true);
          expect(result).toMatch(/^R \d{1,3}(,\d{3})*\.\d{2}$/);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: dispute-history-view, Property 5: Rule count formatting uses correct singular/plural', () => {
  /**
   * Validates: Requirements 7.5
   *
   * For any positive integer N, formatRuleCount SHALL produce "1 rule" when N equals 1,
   * and "N rules" for all other values of N.
   */
  it('should use correct singular/plural for any positive integer 1–100', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        (count) => {
          const result = formatRuleCount(count);
          if (count === 1) {
            expect(result).toBe('1 rule');
          } else {
            expect(result).toBe(`${count} rules`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
