/**
 * Hook to fetch and cache concours data
 * Re-fetches on window focus to ensure fresh data after admin updates
 */

import { useState, useEffect } from 'react';

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

export function useConcours(): UseConcoursResult {
  const [data, setData] = useState<ConcoursData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConcours = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/concours?category=all', {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Échec de la récupération des données');
      }

      const result = await response.json();
      setData(result as ConcoursData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConcours();

    // Re-fetch on window focus (e.g., after navigating back from admin)
    const handleFocus = () => {
      fetchConcours();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return {
    data,
    isLoading,
    error,
    refetch: fetchConcours,
  };
}
