// Configurable thresholds for priority calculation
export const HIGH_VALUE_THRESHOLD = 10000;
export const MEDIUM_VALUE_MIN = 5000;

// Age indicator boundaries (in calendar days)
export const AGE_NEW_MAX = 7;
export const AGE_AGING_MAX = 14;

// Valid enum sets
export const VALID_PAYMENT_TYPES = ['CARD', 'EFT', 'INTERNAL'] as const;
export const VALID_ISSUE_CATEGORIES = [
  'DUPLICATE_DEBIT',
  'FAILED_TRANSFER',
  'MISSING_PAYMENT',
  'UNAUTHORISED',
  'INCORRECT_AMOUNT',
  'CARD_DISPUTE',
] as const;
export const VALID_TRANSACTION_STATUSES = [
  'COMPLETED',
  'PENDING',
  'FAILED',
  'ALREADY_REFUNDED',
] as const;

// Human-readable display label mappings
export const PAYMENT_TYPE_LABELS: Record<
  (typeof VALID_PAYMENT_TYPES)[number],
  string
> = {
  CARD: 'Card Payment',
  EFT: 'EFT',
  INTERNAL: 'Internal Transfer',
};

export const ISSUE_CATEGORY_LABELS: Record<
  (typeof VALID_ISSUE_CATEGORIES)[number],
  string
> = {
  DUPLICATE_DEBIT: 'Duplicate Debit',
  FAILED_TRANSFER: 'Failed Transfer',
  MISSING_PAYMENT: 'Missing Payment',
  UNAUTHORISED: 'Unauthorised Transaction',
  INCORRECT_AMOUNT: 'Incorrect Amount',
  CARD_DISPUTE: 'Card Dispute',
};
