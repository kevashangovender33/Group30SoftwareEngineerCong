import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAnalytics } from '../src/hooks/useAnalytics';

const mockAnalyticsData = {
  paymentType: [
    { label: 'Card', count: 5 },
    { label: 'EFT', count: 3 },
    { label: 'Internal Transfer', count: 2 },
  ],
  issueCategory: [{ label: 'Duplicate Debit', count: 4 }],
  status: [
    { label: 'Open', count: 4 },
    { label: 'Triaged', count: 3 },
    { label: 'Closed', count: 3 },
  ],
  priority: [
    { label: 'High', count: 3 },
    { label: 'Medium', count: 4 },
    { label: 'Low', count: 3 },
  ],
  summary: {
    totalDisputes: 10,
    openDisputes: 4,
    resolvedDisputes: 3,
    highPriorityDisputes: 3,
  },
};

describe('useAnalytics', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should start in loading state', () => {
    vi.spyOn(global, 'fetch').mockImplementation(
      () => new Promise(() => {}) // never resolves
    );

    const { result } = renderHook(() => useAnalytics());

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should transition from loading to data on success', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAnalyticsData),
    } as Response);

    const { result } = renderHook(() => useAnalytics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockAnalyticsData);
    expect(result.current.error).toBeNull();
  });

  it('should transition from loading to error on API failure', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: { message: 'Server error' } }),
    } as Response);

    const { result } = renderHook(() => useAnalytics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch analytics: 500');
    expect(result.current.data).toBeNull();
  });

  it('should transition from loading to error on network failure', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAnalytics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.data).toBeNull();
  });

  it('should re-fetch data when retry is called', async () => {
    const fetchMock = vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAnalyticsData),
      } as Response);

    const { result } = renderHook(() => useAnalytics());

    // First call fails
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBeTruthy();

    // Retry
    act(() => {
      result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockAnalyticsData);
    expect(result.current.error).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('should abort fetch on unmount', async () => {
    const abortSpy = vi.spyOn(AbortController.prototype, 'abort');

    vi.spyOn(global, 'fetch').mockImplementation(
      () => new Promise(() => {}) // never resolves
    );

    const { unmount } = renderHook(() => useAnalytics());

    unmount();

    expect(abortSpy).toHaveBeenCalled();
  });
});
