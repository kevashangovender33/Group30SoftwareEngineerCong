import { VALID_PAYMENT_TYPES, VALID_ISSUE_CATEGORIES } from '../constants.js';

export const VALID_STATUSES = ['OPEN', 'TRIAGED', 'CLOSED'] as const;
export const VALID_PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'] as const;
export const VALID_SORT_BY = ['createdAt', 'priority', 'status'] as const;
export const VALID_SORT_ORDER = ['asc', 'desc'] as const;

export interface DisputeQueryParams {
  customerName?: string;
  paymentType?: string;
  issueCategory?: string;
  priority?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy: 'createdAt' | 'priority' | 'status';
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationSuccess {
  valid: true;
  params: DisputeQueryParams;
}

export interface ValidationFailure {
  valid: false;
  error: ValidationError;
}

export type ValidationResult = ValidationSuccess | ValidationFailure;

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value: string): boolean {
  if (!DATE_REGEX.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function validateDisputeQueryParams(
  query: Record<string, unknown>,
): ValidationResult {
  const params: DisputeQueryParams = {
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    pageSize: 10,
  };

  // Validate enum fields
  if (query.status !== undefined && query.status !== '') {
    const status = String(query.status);
    if (!(VALID_STATUSES as readonly string[]).includes(status)) {
      return {
        valid: false,
        error: {
          field: 'status',
          message: "Invalid value for 'status': must be OPEN, TRIAGED, or CLOSED",
        },
      };
    }
    params.status = status;
  }

  if (query.priority !== undefined && query.priority !== '') {
    const priority = String(query.priority);
    if (!(VALID_PRIORITIES as readonly string[]).includes(priority)) {
      return {
        valid: false,
        error: {
          field: 'priority',
          message: "Invalid value for 'priority': must be HIGH, MEDIUM, or LOW",
        },
      };
    }
    params.priority = priority;
  }

  if (query.paymentType !== undefined && query.paymentType !== '') {
    const paymentType = String(query.paymentType);
    if (!(VALID_PAYMENT_TYPES as readonly string[]).includes(paymentType)) {
      return {
        valid: false,
        error: {
          field: 'paymentType',
          message: "Invalid value for 'paymentType': must be CARD, EFT, or INTERNAL",
        },
      };
    }
    params.paymentType = paymentType;
  }

  if (query.issueCategory !== undefined && query.issueCategory !== '') {
    const issueCategory = String(query.issueCategory);
    if (!(VALID_ISSUE_CATEGORIES as readonly string[]).includes(issueCategory)) {
      return {
        valid: false,
        error: {
          field: 'issueCategory',
          message:
            "Invalid value for 'issueCategory': must be DUPLICATE_DEBIT, FAILED_TRANSFER, MISSING_PAYMENT, UNAUTHORISED, INCORRECT_AMOUNT, or CARD_DISPUTE",
        },
      };
    }
    params.issueCategory = issueCategory;
  }

  // Validate date fields
  if (query.startDate !== undefined && query.startDate !== '') {
    const startDate = String(query.startDate);
    if (!isValidDate(startDate)) {
      return {
        valid: false,
        error: {
          field: 'startDate',
          message: "Invalid date format for 'startDate': must be YYYY-MM-DD",
        },
      };
    }
    params.startDate = startDate;
  }

  if (query.endDate !== undefined && query.endDate !== '') {
    const endDate = String(query.endDate);
    if (!isValidDate(endDate)) {
      return {
        valid: false,
        error: {
          field: 'endDate',
          message: "Invalid date format for 'endDate': must be YYYY-MM-DD",
        },
      };
    }
    params.endDate = endDate;
  }

  // Validate startDate <= endDate
  if (params.startDate && params.endDate) {
    if (params.startDate > params.endDate) {
      return {
        valid: false,
        error: {
          field: 'startDate',
          message: 'startDate must be before or equal to endDate',
        },
      };
    }
  }

  // Validate pagination
  if (query.page !== undefined && query.page !== '') {
    const page = Number(query.page);
    if (!Number.isInteger(page) || page < 1) {
      return {
        valid: false,
        error: {
          field: 'page',
          message: 'page must be >= 1',
        },
      };
    }
    params.page = page;
  }

  if (query.pageSize !== undefined && query.pageSize !== '') {
    const pageSize = Number(query.pageSize);
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      return {
        valid: false,
        error: {
          field: 'pageSize',
          message: 'pageSize must be between 1 and 100',
        },
      };
    }
    params.pageSize = pageSize;
  }

  // Validate sort fields
  if (query.sortBy !== undefined && query.sortBy !== '') {
    const sortBy = String(query.sortBy);
    if (!(VALID_SORT_BY as readonly string[]).includes(sortBy)) {
      return {
        valid: false,
        error: {
          field: 'sortBy',
          message: "Invalid value for 'sortBy': must be createdAt, priority, or status",
        },
      };
    }
    params.sortBy = sortBy as 'createdAt' | 'priority' | 'status';
  }

  if (query.sortOrder !== undefined && query.sortOrder !== '') {
    const sortOrder = String(query.sortOrder);
    if (!(VALID_SORT_ORDER as readonly string[]).includes(sortOrder)) {
      return {
        valid: false,
        error: {
          field: 'sortOrder',
          message: "Invalid value for 'sortOrder': must be asc or desc",
        },
      };
    }
    params.sortOrder = sortOrder as 'asc' | 'desc';
  }

  // Validate customerName
  if (query.customerName !== undefined && query.customerName !== '') {
    const customerName = String(query.customerName).trim();
    if (customerName.length < 1) {
      return {
        valid: false,
        error: {
          field: 'customerName',
          message: 'customerName must be at least 1 character',
        },
      };
    }
    params.customerName = customerName;
  }

  return { valid: true, params };
}
