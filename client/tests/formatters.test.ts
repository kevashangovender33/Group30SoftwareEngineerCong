import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatCurrency,
  formatPaymentType,
  formatIssueCategory,
  formatRuleCount,
} from '../src/utils/formatters';

describe('formatDate', () => {
  it('formats a standard ISO date string', () => {
    expect(formatDate('2026-06-22T14:30:00.000Z')).toBe('22 Jun 2026');
  });

  it('formats a date at midnight UTC', () => {
    expect(formatDate('2024-01-01T00:00:00.000Z')).toBe('01 Jan 2024');
  });

  it('formats a date in December', () => {
    expect(formatDate('2023-12-31T23:59:59.999Z')).toBe('31 Dec 2023');
  });

  it('zero-pads single-digit days', () => {
    expect(formatDate('2025-03-05T10:00:00.000Z')).toBe('05 Mar 2025');
  });
});

describe('formatCurrency', () => {
  it('formats a whole number with thousands separator', () => {
    expect(formatCurrency(1250)).toBe('R 1,250.00');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('R 0.00');
  });

  it('formats a fractional amount', () => {
    expect(formatCurrency(0.5)).toBe('R 0.50');
  });

  it('formats a large amount with multiple thousands separators', () => {
    expect(formatCurrency(1000000)).toBe('R 1,000,000.00');
  });

  it('formats a very large amount', () => {
    expect(formatCurrency(999999999.99)).toBe('R 999,999,999.99');
  });

  it('formats the smallest fractional cent', () => {
    expect(formatCurrency(0.01)).toBe('R 0.01');
  });

  it('formats an amount with two decimal places', () => {
    expect(formatCurrency(99.99)).toBe('R 99.99');
  });

  it('formats a small amount under 1000', () => {
    expect(formatCurrency(500)).toBe('R 500.00');
  });
});

describe('formatPaymentType', () => {
  it('maps CARD to "Card Payment"', () => {
    expect(formatPaymentType('CARD')).toBe('Card Payment');
  });

  it('maps EFT to "EFT"', () => {
    expect(formatPaymentType('EFT')).toBe('EFT');
  });

  it('maps INTERNAL to "Internal Transfer"', () => {
    expect(formatPaymentType('INTERNAL')).toBe('Internal Transfer');
  });

  it('returns the raw value for unknown types', () => {
    expect(formatPaymentType('UNKNOWN')).toBe('UNKNOWN');
  });
});

describe('formatIssueCategory', () => {
  it('maps DUPLICATE_DEBIT to "Duplicate Debit"', () => {
    expect(formatIssueCategory('DUPLICATE_DEBIT')).toBe('Duplicate Debit');
  });

  it('maps FAILED_TRANSFER to "Failed Transfer"', () => {
    expect(formatIssueCategory('FAILED_TRANSFER')).toBe('Failed Transfer');
  });

  it('maps MISSING_PAYMENT to "Missing Payment"', () => {
    expect(formatIssueCategory('MISSING_PAYMENT')).toBe('Missing Payment');
  });

  it('maps UNAUTHORISED to "Unauthorised"', () => {
    expect(formatIssueCategory('UNAUTHORISED')).toBe('Unauthorised');
  });

  it('maps INCORRECT_AMOUNT to "Incorrect Amount"', () => {
    expect(formatIssueCategory('INCORRECT_AMOUNT')).toBe('Incorrect Amount');
  });

  it('maps CARD_DISPUTE to "Card Dispute"', () => {
    expect(formatIssueCategory('CARD_DISPUTE')).toBe('Card Dispute');
  });

  it('returns the raw value for unknown categories', () => {
    expect(formatIssueCategory('SOMETHING_ELSE')).toBe('SOMETHING_ELSE');
  });
});

describe('formatRuleCount', () => {
  it('uses singular for count of 1', () => {
    expect(formatRuleCount(1)).toBe('1 rule');
  });

  it('uses plural for count of 0', () => {
    expect(formatRuleCount(0)).toBe('0 rules');
  });

  it('uses plural for count of 2', () => {
    expect(formatRuleCount(2)).toBe('2 rules');
  });

  it('uses plural for larger counts', () => {
    expect(formatRuleCount(10)).toBe('10 rules');
  });

  it('uses plural for count of 100', () => {
    expect(formatRuleCount(100)).toBe('100 rules');
  });
});
