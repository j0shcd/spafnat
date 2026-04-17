/**
 * Hook to fetch and cache concours data
 * Re-fetches on window focus to ensure fresh data after admin updates
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface ConcoursItem {
  r2Key: string;
  title: string;
  originalFilename: string;
  uploadedAt: string;
  size: number;
}

export type ConcoursCategory = 'reglements' | 'palmares-poetique' | 'palmares-artistique';

export type ConcoursData = Record<ConcoursCategory, ConcoursItem[]>;

interface UseConcoursResult {
  data: ConcoursData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const FOCUS_REFETCH_INTERVAL_MS = 5 * 60 * 1000;

interface FetchConcoursOptions {
  background?: boolean;
  force?: boolean;
}

export function useConcours(): UseConcoursResult {
  const [data, setData] = useState<ConcoursData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchAtRef = useRef(0);

  const fetchConcours = useCallback(async (options: FetchConcoursOptions = {}) => {
    const { background = false, force = false } = options;
    const now = Date.now();

    if (!force && now - lastFetchAtRef.current < FOCUS_REFETCH_INTERVAL_MS) {
      return;
    }

    lastFetchAtRef.current = now;

    try {
      if (!background) {
        setIsLoading(true);
      }
      setError(null);

      const response = await fetch('/api/concours?category=all');

      if (!response.ok) {
        throw new Error('Échec de la récupération des données');
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Échec de la récupération des données');
      }

      const result = await response.json();
      setData(result as ConcoursData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      if (!background) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchConcours({ force: true });

    // Re-fetch on window focus (e.g., after navigating back from admin)
    const handleFocus = () => {
      void fetchConcours({ background: true });
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchConcours]);

  return {
    data,
    isLoading,
    error,
    refetch: () => {
      void fetchConcours({ force: true });
    },
  };
}
