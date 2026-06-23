import {
  HIGH_VALUE_THRESHOLD,
  MEDIUM_VALUE_MIN,
  AGE_NEW_MAX,
  AGE_AGING_MAX,
} from '../constants.js';

// --- Interfaces ---

export interface TriageInput {
  paymentType: 'CARD' | 'EFT' | 'INTERNAL';
  issueCategory: string;
  transactionStatus: string;
  transactionAmount: number;
  transactionDate: Date;
}

export interface RuleTriggered {
  ruleId: string;
  ruleName: string;
  conditions: Record<string, string | number>;
}

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
export type AgeIndicator = 'NEW' | 'AGING' | 'OVERDUE';
export type RecommendationCode =
  | 'CLOSE_RESOLVED'
  | 'ESCALATE_FRAUD'
  | 'IMMEDIATE_REVERSAL'
  | 'MONITOR_24H'
  | 'ESCALATE_SENIOR'
  | 'REFER_PAYMENTS'
  | 'INVESTIGATE';

export interface TriageResult {
  recommendation: string;
  recommendationCode: RecommendationCode;
  priority: Priority;
  ageIndicator: AgeIndicator;
  rulesTriggered: RuleTriggered[];
}

// --- Rule type ---

interface Rule {
  priority: number;
  id: string;
  name: string;
  match: (input: TriageInput) => boolean;
  action: RecommendationCode;
  label: string;
  conditions: (input: TriageInput) => Record<string, string | number>;
}

// --- Rules array (sorted by priority ascending) ---

const RULES: Rule[] = [
  {
    priority: 0,
    id: 'RULE-PRE-01',
    name: 'Already Refunded',
    match: (input) => input.transactionStatus === 'ALREADY_REFUNDED',
    action: 'CLOSE_RESOLVED',
    label: 'Close Dispute — Resolved',
    conditions: (input) => ({ transactionStatus: input.transactionStatus }),
  },
  {
    priority: 1,
    id: 'RULE-001',
    name: 'Unauthorised (Fraud)',
    match: (input) => input.issueCategory === 'UNAUTHORISED',
    action: 'ESCALATE_FRAUD',
    label: 'Escalate to Fraud Team',
    conditions: (input) => ({ issueCategory: input.issueCategory }),
  },
  {
    priority: 2,
    id: 'RULE-002',
    name: 'Card + Duplicate Debit',
    match: (input) =>
      input.paymentType === 'CARD' &&
      input.issueCategory === 'DUPLICATE_DEBIT',
    action: 'IMMEDIATE_REVERSAL',
    label: 'Immediate Reversal',
    conditions: (input) => ({
      paymentType: input.paymentType,
      issueCategory: input.issueCategory,
    }),
  },
  {
    priority: 3,
    id: 'RULE-003',
    name: 'EFT + Pending',
    match: (input) =>
      input.paymentType === 'EFT' &&
      input.transactionStatus === 'PENDING',
    action: 'MONITOR_24H',
    label: 'Monitor for 24 Hours',
    conditions: (input) => ({
      paymentType: input.paymentType,
      transactionStatus: input.transactionStatus,
    }),
  },
  {
    priority: 4,
    id: 'RULE-004',
    name: 'High Value (>R10,000)',
    match: (input) => input.transactionAmount > HIGH_VALUE_THRESHOLD,
    action: 'ESCALATE_SENIOR',
    label: 'Escalate to Senior Ops',
    conditions: (input) => ({ transactionAmount: input.transactionAmount }),
  },
  {
    priority: 5,
    id: 'RULE-005',
    name: 'Internal + Failed Transfer',
    match: (input) =>
      input.paymentType === 'INTERNAL' &&
      input.issueCategory === 'FAILED_TRANSFER',
    action: 'REFER_PAYMENTS',
    label: 'Refer to Payments Team',
    conditions: (input) => ({
      paymentType: input.paymentType,
      issueCategory: input.issueCategory,
    }),
  },
  {
    priority: 6,
    id: 'RULE-006',
    name: 'EFT + Missing Payment',
    match: (input) =>
      input.paymentType === 'EFT' &&
      input.issueCategory === 'MISSING_PAYMENT',
    action: 'INVESTIGATE',
    label: 'Investigate Further',
    conditions: (input) => ({
      paymentType: input.paymentType,
      issueCategory: input.issueCategory,
    }),
  },
  {
    priority: 7,
    id: 'RULE-007',
    name: 'Card + Card Dispute',
    match: (input) =>
      input.paymentType === 'CARD' &&
      input.issueCategory === 'CARD_DISPUTE',
    action: 'INVESTIGATE',
    label: 'Investigate Further',
    conditions: (input) => ({
      paymentType: input.paymentType,
      issueCategory: input.issueCategory,
    }),
  },
  {
    priority: 8,
    id: 'RULE-008',
    name: 'Incorrect Amount',
    match: (input) => input.issueCategory === 'INCORRECT_AMOUNT',
    action: 'INVESTIGATE',
    label: 'Investigate Further',
    conditions: (input) => ({ issueCategory: input.issueCategory }),
  },
  {
    priority: 99,
    id: 'RULE-DEFAULT',
    name: 'Default — Manual Review',
    match: () => true,
    action: 'INVESTIGATE',
    label: 'Investigate Further — Manual Review Required',
    conditions: (input) => ({
      paymentType: input.paymentType,
      issueCategory: input.issueCategory,
    }),
  },
];

// --- Core functions ---

/**
 * Evaluate a dispute input against the decision matrix.
 * Rules are evaluated in priority order — first match wins.
 * Priority and age indicator are calculated independently.
 */
export function evaluate(input: TriageInput): TriageResult {
  // Iterate rules in priority order; first match wins
  let matchedRule: Rule = RULES[RULES.length - 1]; // default fallback

  for (const rule of RULES) {
    if (rule.match(input)) {
      matchedRule = rule;
      break;
    }
  }

  // Calculate priority independently
  const ageInDays = calculateDaysBetween(input.transactionDate, new Date());
  const priority = calculatePriority(
    input.transactionAmount,
    input.issueCategory,
    ageInDays,
  );

  // Calculate age indicator independently
  const ageIndicator = calculateAgeIndicator(input.transactionDate);

  // Build rulesTriggered with matched rule's details
  const rulesTriggered: RuleTriggered[] = [
    {
      ruleId: matchedRule.id,
      ruleName: matchedRule.name,
      conditions: matchedRule.conditions(input),
    },
  ];

  return {
    recommendation: matchedRule.label,
    recommendationCode: matchedRule.action,
    priority,
    ageIndicator,
    rulesTriggered,
  };
}

/**
 * Calculate priority based on amount, issue category, and age in days.
 * Highest matching priority wins (HIGH > MEDIUM > LOW).
 */
export function calculatePriority(
  amount: number,
  issueCategory: string,
  ageInDays: number,
): Priority {
  // HIGH takes precedence
  if (amount > HIGH_VALUE_THRESHOLD || issueCategory === 'UNAUTHORISED') {
    return 'HIGH';
  }

  // MEDIUM conditions
  if (
    (amount >= MEDIUM_VALUE_MIN && amount <= HIGH_VALUE_THRESHOLD) ||
    ageInDays > AGE_NEW_MAX
  ) {
    return 'MEDIUM';
  }

  // All other cases
  return 'LOW';
}

/**
 * Calculate age indicator from transaction date.
 * Uses calendar days between the transaction date and now.
 */
export function calculateAgeIndicator(transactionDate: Date): AgeIndicator {
  const days = calculateDaysBetween(transactionDate, new Date());

  if (days <= AGE_NEW_MAX) return 'NEW';
  if (days <= AGE_AGING_MAX) return 'AGING';
  return 'OVERDUE';
}

// --- Helper ---

function calculateDaysBetween(from: Date, to: Date): number {
  const diffMs = to.getTime() - from.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
