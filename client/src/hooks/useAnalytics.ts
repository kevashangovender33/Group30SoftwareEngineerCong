import { useState, useEffect, useCallback, useRef } from 'react';
import type { AnalyticsResponse } from '../types/index';

interface UseAnalyticsResult {
  data: AnalyticsResponse | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

const TIMEOUT_MS = 30_000;

/**
 * useAnalytics — fetches GET /api/disputes/analytics on mount.
 * Supports AbortController cleanup on unmount and a 30-second timeout.
 */
export function useAnalytics(): UseAnalyticsResult {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const retry = useCallback(() => {
    setFetchKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, TIMEOUT_MS);

    async function fetchAnalytics() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/disputes/analytics', {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch analytics: ${response.status}`);
        }

        const json: AnalyticsResponse = await response.json();

        if (!controller.signal.aborted) {
          setData(json);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          if (err instanceof DOMException && err.name === 'AbortError') {
            setError('Request timed out. Please try again.');
          } else {
            setError(
              err instanceof Error ? err.message : 'Unknown error occurred'
            );
          }
        }
      } finally {
        clearTimeout(timeoutId);
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchAnalytics();

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [fetchKey]);

  return { data, loading, error, retry };
}
