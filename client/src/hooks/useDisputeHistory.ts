import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  DisputeFilters,
  SortField,
  SortOrder,
  DisputeListResponse,
} from '../types/index';

export interface UseDisputeHistoryParams {
  filters: DisputeFilters;
  sortBy: SortField;
  sortOrder: SortOrder;
  page: number;
  pageSize: number;
  customerId?: string;
}

export interface UseDisputeHistoryResult {
  data: DisputeListResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Builds a query string from active (non-empty) params only.
 * Parameters with empty string values are omitted entirely.
 */
export function buildQueryString(params: UseDisputeHistoryParams): string {
  const searchParams = new URLSearchParams();

  const { filters, sortBy, sortOrder, page, pageSize, customerId } = params;

  // Only include customerName if non-empty
  if (filters.customerName.trim()) {
    searchParams.set('customerName', filters.customerName.trim());
  }

  // Only include enum filters if non-empty
  if (filters.paymentType) {
    searchParams.set('paymentType', filters.paymentType);
  }
  if (filters.issueCategory) {
    searchParams.set('issueCategory', filters.issueCategory);
  }
  if (filters.priority) {
    searchParams.set('priority', filters.priority);
  }
  if (filters.status) {
    searchParams.set('status', filters.status);
  }

  // Only include date range if non-empty
  if (filters.startDate) {
    searchParams.set('startDate', filters.startDate);
  }
  if (filters.endDate) {
    searchParams.set('endDate', filters.endDate);
  }

  // Only include sort if non-default
  if (sortBy !== 'createdAt') {
    searchParams.set('sortBy', sortBy);
  }
  if (sortOrder !== 'desc') {
    searchParams.set('sortOrder', sortOrder);
  }

  // Only include page if not the first page
  if (page > 1) {
    searchParams.set('page', String(page));
  }

  // Only include pageSize if not default (10)
  if (pageSize !== 10) {
    searchParams.set('pageSize', String(pageSize));
  }

  // Customer-specific filtering
  if (customerId) {
    searchParams.set('customerId', customerId);
  }

  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

/**
 * useDisputeHistory — fetches GET /api/disputes with query params.
 * Implements 300ms debounce on customerName search and
 * resets page to 1 on filter/sort changes.
 */
export function useDisputeHistory(
  params: UseDisputeHistoryParams
): UseDisputeHistoryResult {
  const [data, setData] = useState<DisputeListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track the debounced customerName value
  const [debouncedCustomerName, setDebouncedCustomerName] = useState(
    params.filters.customerName
  );

  // Track previous filter/sort values to detect changes and reset page
  const prevFiltersRef = useRef<{
    filters: Omit<DisputeFilters, 'customerName'>;
    customerName: string;
    sortBy: SortField;
    sortOrder: SortOrder;
  } | null>(null);

  const [internalPage, setInternalPage] = useState(params.page);

  // Debounce customerName with 300ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCustomerName(params.filters.customerName);
    }, 300);

    return () => clearTimeout(timer);
  }, [params.filters.customerName]);

  // Reset page to 1 when filters or sort change
  useEffect(() => {
    const currentFilterSort = {
      filters: {
        paymentType: params.filters.paymentType,
        issueCategory: params.filters.issueCategory,
        priority: params.filters.priority,
        status: params.filters.status,
        startDate: params.filters.startDate,
        endDate: params.filters.endDate,
      },
      customerName: debouncedCustomerName,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    };

    if (prevFiltersRef.current !== null) {
      const prev = prevFiltersRef.current;
      const filtersChanged =
        prev.filters.paymentType !== currentFilterSort.filters.paymentType ||
        prev.filters.issueCategory !== currentFilterSort.filters.issueCategory ||
        prev.filters.priority !== currentFilterSort.filters.priority ||
        prev.filters.status !== currentFilterSort.filters.status ||
        prev.filters.startDate !== currentFilterSort.filters.startDate ||
        prev.filters.endDate !== currentFilterSort.filters.endDate ||
        prev.customerName !== currentFilterSort.customerName ||
        prev.sortBy !== currentFilterSort.sortBy ||
        prev.sortOrder !== currentFilterSort.sortOrder;

      if (filtersChanged) {
        setInternalPage(1);
      } else {
        setInternalPage(params.page);
      }
    } else {
      setInternalPage(params.page);
    }

    prevFiltersRef.current = currentFilterSort;
  }, [
    params.filters.paymentType,
    params.filters.issueCategory,
    params.filters.priority,
    params.filters.status,
    params.filters.startDate,
    params.filters.endDate,
    debouncedCustomerName,
    params.sortBy,
    params.sortOrder,
    params.page,
  ]);

  // Trigger for manual refetch
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const refetch = useCallback(() => {
    setFetchTrigger((prev) => prev + 1);
  }, []);

  // Fetch data when debounced params or page changes
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      const queryParams: UseDisputeHistoryParams = {
        filters: {
          ...params.filters,
          customerName: debouncedCustomerName,
        },
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        page: internalPage,
        pageSize: params.pageSize,
        customerId: params.customerId,
      };

      const queryString = buildQueryString(queryParams);

      try {
        const response = await fetch(`/api/disputes${queryString}`);
        if (!response.ok) {
          const errorBody = await response.json().catch(() => null);
          const message =
            errorBody?.error?.message ||
            `Failed to fetch disputes: ${response.status}`;
          throw new Error(message);
        }
        const json: DisputeListResponse = await response.json();
        if (!cancelled) {
          setData(json);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [
    debouncedCustomerName,
    params.filters.paymentType,
    params.filters.issueCategory,
    params.filters.priority,
    params.filters.status,
    params.filters.startDate,
    params.filters.endDate,
    params.sortBy,
    params.sortOrder,
    internalPage,
    params.pageSize,
    params.customerId,
    fetchTrigger,
  ]);

  return { data, loading, error, refetch };
}
