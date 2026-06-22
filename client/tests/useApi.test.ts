import { renderHook, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  useReferenceData,
  useCustomers,
  useTransactions,
  useCreateDispute,
  useDisputeDetail,
  useAcknowledge,
} from '../src/hooks/useApi';

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  mockFetch.mockReset();
});

describe('useReferenceData', () => {
  it('fetches reference data on mount and returns data', async () => {
    const mockData = {
      paymentTypes: ['CARD', 'EFT', 'INTERNAL'],
      issueCategories: ['DUPLICATE_DEBIT', 'UNAUTHORISED'],
      dataSource: 'MOCK',
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const { result } = renderHook(() => useReferenceData());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith('/api/reference-data');
  });

  it('sets error when fetch fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    });

    const { result } = renderHook(() => useReferenceData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Failed to fetch reference data: 500');
  });
});

describe('useCustomers', () => {
  it('fetches customers with search param', async () => {
    const mockCustomers = [
      { id: '1', name: 'John', email: 'john@test.com', accountNumber: 'ACC001' },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ customers: mockCustomers }),
    });

    const { result } = renderHook(() => useCustomers('John'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockCustomers);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith('/api/customers?search=John');
  });

  it('fetches all customers when search is empty', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ customers: [] }),
    });

    const { result } = renderHook(() => useCustomers(''));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/customers');
  });

  it('sets error on fetch failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    });

    const { result } = renderHook(() => useCustomers('test'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch customers: 500');
    expect(result.current.data).toBeNull();
  });
});

describe('useTransactions', () => {
  it('fetches transactions for a given customerId', async () => {
    const mockTransactions = [
      {
        id: 'txn-1',
        customerId: 'cust-1',
        amount: 1000,
        paymentType: 'CARD',
        status: 'COMPLETED',
        description: 'Purchase',
        transactionDate: '2026-06-20',
      },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ transactions: mockTransactions }),
    });

    const { result } = renderHook(() => useTransactions('cust-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockTransactions);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith('/api/transactions?customerId=cust-1');
  });

  it('returns null data when customerId is empty', async () => {
    const { result } = renderHook(() => useTransactions(''));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('sets error on fetch failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({}),
    });

    const { result } = renderHook(() => useTransactions('cust-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch transactions: 404');
  });
});

describe('useCreateDispute', () => {
  it('creates a dispute and returns response', async () => {
    const mockResponse = {
      disputeId: 'disp-1',
      referenceNumber: 'DSP-001',
      status: 'TRIAGED',
      triage: {
        recommendation: 'Immediate Reversal',
        recommendationCode: 'IMMEDIATE_REVERSAL',
        priority: 'LOW',
        ageIndicator: 'NEW',
        rulesTriggered: [{ ruleId: 'RULE-002', ruleName: 'Card + Duplicate Debit', conditions: {} }],
      },
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() => useCreateDispute());

    let response: unknown;
    await act(async () => {
      response = await result.current.mutate({
        transactionId: 'txn-1',
        paymentType: 'CARD',
        issueCategory: 'DUPLICATE_DEBIT',
      });
    });

    expect(response).toEqual(mockResponse);
    expect(result.current.data).toEqual(mockResponse);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith('/api/disputes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactionId: 'txn-1',
        paymentType: 'CARD',
        issueCategory: 'DUPLICATE_DEBIT',
      }),
    });
  });

  it('sets error when creation fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: () => Promise.resolve({ error: 'Invalid payment type' }),
    });

    const { result } = renderHook(() => useCreateDispute());

    await act(async () => {
      await expect(
        result.current.mutate({
          transactionId: 'txn-1',
          paymentType: 'INVALID',
          issueCategory: 'DUPLICATE_DEBIT',
        })
      ).rejects.toThrow();
    });

    expect(result.current.error).toBe('Invalid payment type');
    expect(result.current.data).toBeNull();
  });
});

describe('useDisputeDetail', () => {
  it('fetches dispute detail when disputeId is provided', async () => {
    const mockDetail = {
      disputeId: 'disp-1',
      referenceNumber: 'DSP-001',
      status: 'TRIAGED',
      paymentType: 'CARD',
      issueCategory: 'DUPLICATE_DEBIT',
      priority: 'LOW',
      ageIndicator: 'NEW',
      recommendation: 'Immediate Reversal',
      recommendationCode: 'IMMEDIATE_REVERSAL',
      rulesTriggered: [],
      transaction: { id: 'txn-1', customerId: 'cust-1', amount: 1000, paymentType: 'CARD', status: 'COMPLETED', description: 'Test', transactionDate: '2026-06-20' },
      customer: { id: 'cust-1', name: 'John', email: 'john@test.com', accountNumber: 'ACC001' },
      createdAt: '2026-06-21T00:00:00Z',
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockDetail),
    });

    const { result } = renderHook(() => useDisputeDetail('disp-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockDetail);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith('/api/disputes/disp-1');
  });

  it('returns null data when disputeId is empty', async () => {
    const { result } = renderHook(() => useDisputeDetail(''));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('sets error on fetch failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({}),
    });

    const { result } = renderHook(() => useDisputeDetail('disp-999'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch dispute detail: 404');
  });
});

describe('useAcknowledge', () => {
  it('acknowledges a dispute successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ disputeId: 'disp-1', acknowledged: true, nextAction: 'RETURN_TO_CAPTURE' }),
    });

    const { result } = renderHook(() => useAcknowledge());

    await act(async () => {
      await result.current.mutate('disp-1');
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith('/api/disputes/disp-1/acknowledge', {
      method: 'POST',
    });
  });

  it('sets error when acknowledge fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({}),
    });

    const { result } = renderHook(() => useAcknowledge());

    await act(async () => {
      await expect(result.current.mutate('disp-999')).rejects.toThrow();
    });

    expect(result.current.error).toBe('Failed to acknowledge dispute: 404');
  });
});
