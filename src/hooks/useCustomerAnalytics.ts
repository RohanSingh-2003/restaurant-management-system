import { useState, useEffect, useCallback } from 'react';
import type { CustomerBehaviourData } from '../types/dataset';
import { loadDataset, getCustomerAnalytics, subscribeDatasetUpdates } from '../services/tarriDataService';

export function useCustomerAnalytics() {
  const [data, setData] = useState<CustomerBehaviourData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadCounter, setReloadCounter] = useState(0);

  useEffect(() => {
    let isMounted = true;
    loadDataset()
      .then((records) => {
        if (isMounted) {
          const analytics = getCustomerAnalytics(records);
          setData(analytics);
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
        .then((records) => {
          if (isMounted) {
            const analytics = getCustomerAnalytics(records);
            setData(analytics);
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

  return {
    data,
    isLoading,
    error,
    reload,
  };
}
