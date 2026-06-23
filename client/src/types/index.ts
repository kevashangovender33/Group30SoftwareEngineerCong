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

// ─── Dispute History View Types ────────────────────────────────────────────────

export interface DisputeListItem {
  id: string;
  referenceNumber: string;
  status: DisputeStatus;
  priority: Priority;
  ageIndicator: AgeIndicator;
  paymentType: PaymentType;
  issueCategory: string;
  recommendedAction: string;
  createdAt: string;           // ISO 8601
  customerName: string;
  transactionAmount: number;
  triggeredRuleCount: number;
}

export interface DisputeListResponse {
  disputes: DisputeListItem[];
  totalCount: number;
  page: number;
  totalPages: number;
}

export interface DisputeFilters {
  customerName: string;
  paymentType: string;
  issueCategory: string;
  priority: string;
  status: string;
  startDate: string;
  endDate: string;
}

export type SortField = 'createdAt' | 'priority' | 'status';
export type SortOrder = 'asc' | 'desc';

export interface DisputeHistoryState {
  filters: DisputeFilters;
  sortBy: SortField;
  sortOrder: SortOrder;
  currentPage: number;
  pageSize: number;
}

export const DEFAULT_DISPUTE_HISTORY_STATE: DisputeHistoryState = {
  filters: {
    customerName: '',
    paymentType: '',
    issueCategory: '',
    priority: '',
    status: '',
    startDate: '',
    endDate: '',
  },
  sortBy: 'createdAt',
  sortOrder: 'desc',
  currentPage: 1,
  pageSize: 10,
};

export type Screen =
  | 'SELECT_CUSTOMER'
  | 'SELECT_TRANSACTION'
  | 'CAPTURE_DISPUTE'
  | 'TRIAGE_RESULT'
  | 'DISPUTE_HISTORY'
  | 'CUSTOMER_DISPUTE_HISTORY'
  | 'ANALYTICS_DASHBOARD';

// ─── Analytics Dashboard Types ─────────────────────────────────────────────────

export interface AnalyticsBreakdown {
  label: string;
  count: number;
}

export interface AnalyticsSummary {
  totalDisputes: number;
  openDisputes: number;
  resolvedDisputes: number;
  highPriorityDisputes: number;
}

export interface AnalyticsResponse {
  paymentType: AnalyticsBreakdown[];
  issueCategory: AnalyticsBreakdown[];
  status: AnalyticsBreakdown[];
  priority: AnalyticsBreakdown[];
  summary: AnalyticsSummary;
}
