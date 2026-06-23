// Payment type and issue category enums
export type PaymentType = 'CARD' | 'EFT' | 'INTERNAL';

export type IssueCategory =
  | 'DUPLICATE_DEBIT'
  | 'FAILED_TRANSFER'
  | 'MISSING_PAYMENT'
  | 'UNAUTHORISED'
  | 'INCORRECT_AMOUNT'
  | 'CARD_DISPUTE';

export type TransactionStatus = 'COMPLETED' | 'PENDING' | 'FAILED' | 'ALREADY_REFUNDED';

export type DisputeStatus = 'OPEN' | 'TRIAGED' | 'CLOSED';

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

// Domain models
export interface Customer {
  id: string;
  name: string;
  email: string;
  accountNumber: string;
}

export interface Transaction {
  id: string;
  customerId: string;
  amount: number;
  paymentType: PaymentType;
  status: TransactionStatus;
  description: string;
  transactionDate: string;
}

export interface RuleTriggered {
  ruleId: string;
  ruleName: string;
  conditions: Record<string, string | number>;
}

export interface TriageResult {
  recommendation: string;
  recommendationCode: RecommendationCode;
  priority: Priority;
  ageIndicator: AgeIndicator;
  rulesTriggered: RuleTriggered[];
}

export interface DisputeResponse {
  disputeId: string;
  referenceNumber: string;
  status: DisputeStatus;
  triage: TriageResult;
}

export interface DisputeDetail {
  disputeId: string;
  referenceNumber: string;
  status: DisputeStatus;
  paymentType: PaymentType;
  issueCategory: IssueCategory;
  priority: Priority;
  ageIndicator: AgeIndicator;
  recommendation: string;
  recommendationCode: RecommendationCode;
  rulesTriggered: RuleTriggered[];
  transaction: Transaction;
  customer: Customer;
  createdAt: string;
}

export interface ReferenceData {
  paymentTypes: PaymentType[];
  issueCategories: IssueCategory[];
  dataSource: string;
}
