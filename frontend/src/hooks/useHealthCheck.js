import { useState, useEffect, useCallback } from 'react';
import { getSystemHealth } from '../services/healthService';

export const useHealthCheck = (autoFetch = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [latencyMs, setLatencyMs] = useState(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      const result = await getSystemHealth();
      const endTime = performance.now();
      setLatencyMs(Math.round(endTime - startTime));
      setData(result.data);
    } catch (err) {
      const endTime = performance.now();
      setLatencyMs(Math.round(endTime - startTime));
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to connect to backend server'
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchHealth();
    }
  }, [autoFetch, fetchHealth]);

  return {
    data,
    loading,
    error,
    latencyMs,
    refetch: fetchHealth,
  };
};
