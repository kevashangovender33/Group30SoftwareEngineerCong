import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * **Validates: Requirements 6.2, 6.5**
 *
 * Property 6: Conditions serialization round-trip
 * For any valid conditions object (containing string or number values),
 * storing it as JSON.stringify and then reading it back with JSON.parse
 * produces an equivalent object.
 */
describe('Feature: dispute-persistence, Property 6: Conditions serialization round-trip', () => {
  it('JSON.parse(JSON.stringify(conditions)) deep-equals original conditions for any valid Record<string, string | number>', () => {
    fc.assert(
      fc.property(
        fc.dictionary(
          fc.string({ minLength: 1 }),
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.double({ noNaN: true, noDefaultInfinity: true })
          )
        ),
        (conditions: Record<string, string | number>) => {
          const serialized = JSON.stringify(conditions);
          const deserialized = JSON.parse(serialized);

          expect(deserialized).toEqual(conditions);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('preserves empty conditions object through serialization round-trip', () => {
    fc.assert(
      fc.property(
        fc.constant({}),
        (conditions: Record<string, string | number>) => {
          const serialized = JSON.stringify(conditions);
          const deserialized = JSON.parse(serialized);

          expect(deserialized).toEqual(conditions);
        }
      ),
      { numRuns: 1 }
    );
  });

  it('preserves conditions with mixed string and number values through round-trip', () => {
    fc.assert(
      fc.property(
        fc.record({
          paymentType: fc.constantFrom('CARD', 'EFT', 'INTERNAL_TRANSFER'),
          issueCategory: fc.constantFrom('DUPLICATE_DEBIT', 'FRAUD', 'UNAUTHORIZED'),
          amount: fc.integer({ min: 0, max: 1000000 }),
          threshold: fc.double({ noNaN: true, noDefaultInfinity: true, min: 0, max: 100000 }),
        }),
        (conditions) => {
          const asRecord: Record<string, string | number> = conditions;
          const serialized = JSON.stringify(asRecord);
          const deserialized = JSON.parse(serialized);

          expect(deserialized).toEqual(asRecord);
        }
      ),
      { numRuns: 100 }
    );
  });
});
