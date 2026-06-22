import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  evaluate,
  calculatePriority,
  calculateAgeIndicator,
  TriageInput,
} from '../src/services/triageEngine.js';

// Helper to create a TriageInput with sensible defaults
function makeInput(overrides: Partial<TriageInput> = {}): TriageInput {
  return {
    paymentType: 'CARD',
    issueCategory: 'DUPLICATE_DEBIT',
    transactionStatus: 'COMPLETED',
    transactionAmount: 1000,
    transactionDate: new Date(), // today — age = 0 days
    ...overrides,
  };
}

// Helper to create a date N days in the past
function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

describe('triageEngine — evaluate()', () => {
  describe('Individual rule tests', () => {
    it('RULE-PRE-01: status ALREADY_REFUNDED → CLOSE_RESOLVED', () => {
      const result = evaluate(
        makeInput({
          transactionStatus: 'ALREADY_REFUNDED',
          paymentType: 'EFT',
          issueCategory: 'MISSING_PAYMENT',
        }),
      );

      expect(result.recommendationCode).toBe('CLOSE_RESOLVED');
      expect(result.recommendation).toBe('Close Dispute — Resolved');
      expect(result.rulesTriggered[0].ruleId).toBe('RULE-PRE-01');
    });

    it('RULE-001: issueCategory UNAUTHORISED → ESCALATE_FRAUD', () => {
      const result = evaluate(
        makeInput({
          issueCategory: 'UNAUTHORISED',
          transactionStatus: 'COMPLETED',
          transactionAmount: 500,
        }),
      );

      expect(result.recommendationCode).toBe('ESCALATE_FRAUD');
      expect(result.recommendation).toBe('Escalate to Fraud Team');
      expect(result.rulesTriggered[0].ruleId).toBe('RULE-001');
    });

    it('RULE-002: paymentType CARD + issueCategory DUPLICATE_DEBIT → IMMEDIATE_REVERSAL', () => {
      const result = evaluate(
        makeInput({
          paymentType: 'CARD',
          issueCategory: 'DUPLICATE_DEBIT',
          transactionStatus: 'COMPLETED',
          transactionAmount: 500,
        }),
      );

      expect(result.recommendationCode).toBe('IMMEDIATE_REVERSAL');
      expect(result.recommendation).toBe('Immediate Reversal');
      expect(result.rulesTriggered[0].ruleId).toBe('RULE-002');
    });

    it('RULE-003: paymentType EFT + transactionStatus PENDING → MONITOR_24H', () => {
      const result = evaluate(
        makeInput({
          paymentType: 'EFT',
          issueCategory: 'MISSING_PAYMENT',
          transactionStatus: 'PENDING',
          transactionAmount: 500,
        }),
      );

      expect(result.recommendationCode).toBe('MONITOR_24H');
      expect(result.recommendation).toBe('Monitor for 24 Hours');
      expect(result.rulesTriggered[0].ruleId).toBe('RULE-003');
    });

    it('RULE-004: transactionAmount > 10000 → ESCALATE_SENIOR', () => {
      const result = evaluate(
        makeInput({
          paymentType: 'EFT',
          issueCategory: 'MISSING_PAYMENT',
          transactionStatus: 'COMPLETED',
          transactionAmount: 10001,
        }),
      );

      expect(result.recommendationCode).toBe('ESCALATE_SENIOR');
      expect(result.recommendation).toBe('Escalate to Senior Ops');
      expect(result.rulesTriggered[0].ruleId).toBe('RULE-004');
    });

    it('RULE-005: paymentType INTERNAL + issueCategory FAILED_TRANSFER → REFER_PAYMENTS', () => {
      const result = evaluate(
        makeInput({
          paymentType: 'INTERNAL',
          issueCategory: 'FAILED_TRANSFER',
          transactionStatus: 'COMPLETED',
          transactionAmount: 500,
        }),
      );

      expect(result.recommendationCode).toBe('REFER_PAYMENTS');
      expect(result.recommendation).toBe('Refer to Payments Team');
      expect(result.rulesTriggered[0].ruleId).toBe('RULE-005');
    });

    it('RULE-006: paymentType EFT + issueCategory MISSING_PAYMENT → INVESTIGATE', () => {
      const result = evaluate(
        makeInput({
          paymentType: 'EFT',
          issueCategory: 'MISSING_PAYMENT',
          transactionStatus: 'COMPLETED',
          transactionAmount: 500,
        }),
      );

      expect(result.recommendationCode).toBe('INVESTIGATE');
      expect(result.recommendation).toBe('Investigate Further');
      expect(result.rulesTriggered[0].ruleId).toBe('RULE-006');
    });

    it('RULE-007: paymentType CARD + issueCategory CARD_DISPUTE → INVESTIGATE', () => {
      const result = evaluate(
        makeInput({
          paymentType: 'CARD',
          issueCategory: 'CARD_DISPUTE',
          transactionStatus: 'COMPLETED',
          transactionAmount: 500,
        }),
      );

      expect(result.recommendationCode).toBe('INVESTIGATE');
      expect(result.recommendation).toBe('Investigate Further');
      expect(result.rulesTriggered[0].ruleId).toBe('RULE-007');
    });

    it('RULE-008: issueCategory INCORRECT_AMOUNT → INVESTIGATE', () => {
      const result = evaluate(
        makeInput({
          paymentType: 'EFT',
          issueCategory: 'INCORRECT_AMOUNT',
          transactionStatus: 'COMPLETED',
          transactionAmount: 500,
        }),
      );

      expect(result.recommendationCode).toBe('INVESTIGATE');
      expect(result.recommendation).toBe('Investigate Further');
      expect(result.rulesTriggered[0].ruleId).toBe('RULE-008');
    });

    it('RULE-DEFAULT: no match → INVESTIGATE with "Manual Review Required" label', () => {
      // Use a combination that doesn't match any specific rule
      const result = evaluate(
        makeInput({
          paymentType: 'INTERNAL',
          issueCategory: 'MISSING_PAYMENT',
          transactionStatus: 'COMPLETED',
          transactionAmount: 500,
        }),
      );

      expect(result.recommendationCode).toBe('INVESTIGATE');
      expect(result.recommendation).toContain('Manual Review Required');
      expect(result.rulesTriggered[0].ruleId).toBe('RULE-DEFAULT');
    });
  });

  describe('Priority order tests (first-match-wins)', () => {
    it('UNAUTHORISED overrides high-value (RULE-001 fires before RULE-004)', () => {
      const result = evaluate(
        makeInput({
          paymentType: 'EFT',
          issueCategory: 'UNAUTHORISED',
          transactionStatus: 'COMPLETED',
          transactionAmount: 50000, // high value, but UNAUTHORISED takes priority
        }),
      );

      expect(result.recommendationCode).toBe('ESCALATE_FRAUD');
      expect(result.rulesTriggered[0].ruleId).toBe('RULE-001');
    });

    it('ALREADY_REFUNDED short-circuits even with UNAUTHORISED', () => {
      const result = evaluate(
        makeInput({
          paymentType: 'CARD',
          issueCategory: 'UNAUTHORISED',
          transactionStatus: 'ALREADY_REFUNDED',
          transactionAmount: 50000,
        }),
      );

      expect(result.recommendationCode).toBe('CLOSE_RESOLVED');
      expect(result.rulesTriggered[0].ruleId).toBe('RULE-PRE-01');
    });

    it('CARD + DUPLICATE_DEBIT at high value still gives IMMEDIATE_REVERSAL (RULE-002 fires before RULE-004)', () => {
      const result = evaluate(
        makeInput({
          paymentType: 'CARD',
          issueCategory: 'DUPLICATE_DEBIT',
          transactionStatus: 'COMPLETED',
          transactionAmount: 50000, // high value, but RULE-002 has higher priority
        }),
      );

      expect(result.recommendationCode).toBe('IMMEDIATE_REVERSAL');
      expect(result.rulesTriggered[0].ruleId).toBe('RULE-002');
    });
  });
});

describe('triageEngine — calculatePriority()', () => {
  describe('Amount boundary conditions', () => {
    it('amount=4999, not UNAUTHORISED, age=5 → LOW', () => {
      expect(calculatePriority(4999, 'DUPLICATE_DEBIT', 5)).toBe('LOW');
    });

    it('amount=5000, not UNAUTHORISED, age=5 → MEDIUM', () => {
      expect(calculatePriority(5000, 'DUPLICATE_DEBIT', 5)).toBe('MEDIUM');
    });

    it('amount=10000, not UNAUTHORISED, age=5 → MEDIUM', () => {
      expect(calculatePriority(10000, 'DUPLICATE_DEBIT', 5)).toBe('MEDIUM');
    });

    it('amount=10001, not UNAUTHORISED, age=5 → HIGH', () => {
      expect(calculatePriority(10001, 'DUPLICATE_DEBIT', 5)).toBe('HIGH');
    });
  });

  describe('UNAUTHORISED override', () => {
    it('amount=1000, UNAUTHORISED, age=5 → HIGH', () => {
      expect(calculatePriority(1000, 'UNAUTHORISED', 5)).toBe('HIGH');
    });
  });

  describe('Age boundary conditions', () => {
    it('amount=1000, not UNAUTHORISED, age=7 → LOW (within NEW threshold)', () => {
      expect(calculatePriority(1000, 'DUPLICATE_DEBIT', 7)).toBe('LOW');
    });

    it('amount=1000, not UNAUTHORISED, age=8 → MEDIUM (age > 7)', () => {
      expect(calculatePriority(1000, 'DUPLICATE_DEBIT', 8)).toBe('MEDIUM');
    });
  });

  describe('Combined low-priority scenario', () => {
    it('amount=1000, not UNAUTHORISED, age=5 → LOW', () => {
      expect(calculatePriority(1000, 'DUPLICATE_DEBIT', 5)).toBe('LOW');
    });
  });
});

describe('triageEngine — calculateAgeIndicator()', () => {
  let realDateNow: () => number;

  beforeEach(() => {
    // Fix "now" to a stable point to avoid flakiness
    realDateNow = Date.now;
    const fixedNow = new Date('2026-06-22T12:00:00.000Z').getTime();
    vi.spyOn(Date, 'now').mockReturnValue(fixedNow);
    // Also mock the Date constructor for new Date()
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-22T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('0 days ago → NEW', () => {
    const result = calculateAgeIndicator(new Date('2026-06-22T12:00:00.000Z'));
    expect(result).toBe('NEW');
  });

  it('7 days ago → NEW (boundary)', () => {
    const result = calculateAgeIndicator(new Date('2026-06-15T12:00:00.000Z'));
    expect(result).toBe('NEW');
  });

  it('8 days ago → AGING', () => {
    const result = calculateAgeIndicator(new Date('2026-06-14T12:00:00.000Z'));
    expect(result).toBe('AGING');
  });

  it('14 days ago → AGING (boundary)', () => {
    const result = calculateAgeIndicator(new Date('2026-06-08T12:00:00.000Z'));
    expect(result).toBe('AGING');
  });

  it('15 days ago → OVERDUE', () => {
    const result = calculateAgeIndicator(new Date('2026-06-07T12:00:00.000Z'));
    expect(result).toBe('OVERDUE');
  });

  it('30 days ago → OVERDUE', () => {
    const result = calculateAgeIndicator(new Date('2026-05-23T12:00:00.000Z'));
    expect(result).toBe('OVERDUE');
  });
});
