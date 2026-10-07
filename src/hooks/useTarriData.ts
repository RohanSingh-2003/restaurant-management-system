import { useState, useEffect, useMemo, useCallback } from 'react';
import type { TarriRecord, DashboardMetrics } from '../types/dataset';
import { loadDataset, calculateDashboardMetrics, subscribeDatasetUpdates } from '../services/tarriDataService';

export function useTarriData() {
  const [records, setRecords] = useState<TarriRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadCounter, setReloadCounter] = useState(0);

  useEffect(() => {
    let isMounted = true;
    loadDataset()
      .then((data) => {
        if (isMounted) {
          setRecords(data);
          setIsLoading(false);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setError(err?.message || 'Failed to load restaurant dataset');
          setIsLoading(false);
        }
      });

    const unsubscribe = subscribeDatasetUpdates(() => {
      loadDataset(true)
        .then((data) => {
          if (isMounted) {
            setRecords(data);
          }
        })
        .catch(() => {});
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [reloadCounter]);

  const reload = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setReloadCounter((c) => c + 1);
  }, []);

  const metrics: DashboardMetrics | null = useMemo(() => {
    if (!records || records.length === 0) return null;
    return calculateDashboardMetrics(records);
  }, [records]);

  return {
    records,
    metrics,
    isLoading,
    error,
    reload,
  };
}
