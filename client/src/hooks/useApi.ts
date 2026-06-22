import { useState, useEffect, useCallback } from 'react';
import type {
  Customer,
  Transaction,
  DisputeResponse,
  DisputeDetail,
  ReferenceData,
} from '../types/index';

/**
 * useReferenceData — fetches GET /api/reference-data on mount.
 */
export function useReferenceData() {
  const [data, setData] = useState<ReferenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/reference-data');
        if (!response.ok) {
          throw new Error(`Failed to fetch reference data: ${response.status}`);
        }
        const json = await response.json();
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
  }, []);

  return { data, loading, error };
}

/**
 * useCustomers — fetches GET /api/customers?search= when search changes.
 */
export function useCustomers(search: string) {
  const [data, setData] = useState<Customer[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const params = search ? `?search=${encodeURIComponent(search)}` : '';
        const response = await fetch(`/api/customers${params}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch customers: ${response.status}`);
        }
        const json = await response.json();
        if (!cancelled) {
          setData(json.customers);
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
  }, [search]);

  return { data, loading, error };
}

/**
 * useTransactions — fetches GET /api/transactions?customerId= when customerId changes.
 */
export function useTransactions(customerId: string) {
  const [data, setData] = useState<Transaction[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!customerId) {
      setData(null);
      setLoading(false);
      return;
    }

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/transactions?customerId=${encodeURIComponent(customerId)}`
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch transactions: ${response.status}`);
        }
        const json = await response.json();
        if (!cancelled) {
          setData(json.transactions);
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
  }, [customerId]);

  return { data, loading, error };
}

/**
 * useCreateDispute — returns { mutate, data, loading, error }.
 * mutate(body) sends POST /api/disputes and returns the DisputeResponse.
 */
export function useCreateDispute() {
  const [data, setData] = useState<DisputeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (body: {
      transactionId: string;
      paymentType: string;
      issueCategory: string;
    }): Promise<DisputeResponse> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/disputes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          const errorBody = await response.json().catch(() => null);
          const message =
            errorBody?.error?.message ||
            errorBody?.error ||
            `Failed to create dispute: ${response.status}`;
          throw new Error(message);
        }
        const json: DisputeResponse = await response.json();
        setData(json);
        return json;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { mutate, data, loading, error };
}

/**
 * useDisputeDetail — fetches GET /api/disputes/:id when disputeId changes.
 */
export function useDisputeDetail(disputeId: string) {
  const [data, setData] = useState<DisputeDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!disputeId) {
      setData(null);
      setLoading(false);
      return;
    }

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/disputes/${encodeURIComponent(disputeId)}`
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch dispute detail: ${response.status}`);
        }
        const json: DisputeDetail = await response.json();
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
  }, [disputeId]);

  return { data, loading, error };
}

/**
 * useAcknowledge — returns { mutate, loading, error }.
 * mutate(disputeId) sends POST /api/disputes/:id/acknowledge.
 */
export function useAcknowledge() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (disputeId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/disputes/${encodeURIComponent(disputeId)}/acknowledge`,
        { method: 'POST' }
      );
      if (!response.ok) {
        throw new Error(`Failed to acknowledge dispute: ${response.status}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, loading, error };
}
