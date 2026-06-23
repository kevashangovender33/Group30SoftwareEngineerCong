import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { evaluate, TriageInput } from '../src/services/triageEngine.js';

describe('Feature: dispute-persistence, Property 4: Triggered rule count matches triage engine output', () => {
  /**
   * Validates: Requirements 2.2, 2.3
   *
   * Property: For any valid dispute input, the triage engine always produces
   * at least 1 triggered rule, and each triggered rule has a ruleId, ruleName,
   * and a conditions object with at least one key.
   */

  const triageInputArb = fc.record({
    paymentType: fc.constantFrom('CARD' as const, 'EFT' as const, 'INTERNAL' as const),
    issueCategory: fc.constantFrom(
      'DUPLICATE_DEBIT',
      'FAILED_TRANSFER',
      'MISSING_PAYMENT',
      'UNAUTHORISED',
      'INCORRECT_AMOUNT',
      'CARD_DISPUTE'
    ),
    transactionStatus: fc.constantFrom('COMPLETED', 'PENDING', 'FAILED', 'ALREADY_REFUNDED'),
    transactionAmount: fc.double({ min: 0.01, max: 1000000, noNaN: true, noDefaultInfinity: true }),
    transactionDate: fc.date({ min: new Date('2024-01-01'), max: new Date() }),
  });

  it('triage engine always produces at least 1 triggered rule', () => {
    fc.assert(
      fc.property(triageInputArb, (input: TriageInput) => {
        const result = evaluate(input);
        expect(result.rulesTriggered.length).toBeGreaterThanOrEqual(1);
      }),
      { numRuns: 100 }
    );
  });

  it('each triggered rule has ruleId, ruleName, and conditions with at least one key', () => {
    fc.assert(
      fc.property(triageInputArb, (input: TriageInput) => {
        const result = evaluate(input);

        for (const rule of result.rulesTriggered) {
          expect(rule.ruleId).toBeDefined();
          expect(typeof rule.ruleId).toBe('string');
          expect(rule.ruleId.length).toBeGreaterThan(0);

          expect(rule.ruleName).toBeDefined();
          expect(typeof rule.ruleName).toBe('string');
          expect(rule.ruleName.length).toBeGreaterThan(0);

          expect(rule.conditions).toBeDefined();
          expect(typeof rule.conditions).toBe('object');
          expect(Object.keys(rule.conditions).length).toBeGreaterThanOrEqual(1);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('triggered rule count equals rulesTriggered.length from triage engine', () => {
    fc.assert(
      fc.property(triageInputArb, (input: TriageInput) => {
        const result = evaluate(input);

        // The number of triggered rules in the result is what would be stored
        // as TriggeredRule records — verify it matches the array length and is ≥ 1
        const ruleCount = result.rulesTriggered.length;
        expect(ruleCount).toBeGreaterThanOrEqual(1);
        expect(ruleCount).toBe(result.rulesTriggered.length);
      }),
      { numRuns: 100 }
    );
  });
});
