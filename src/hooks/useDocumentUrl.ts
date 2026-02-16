/**
 * useDocumentUrl Hook
 *
 * Checks if a document exists in R2 storage and returns availability state.
 * - Always returns the R2 URL (/api/media/documents/{filename})
 * - Returns isAvailable=true if file exists in R2, false otherwise
 * - No fallback to local files (R2-only approach)
 * - Re-checks when window regains focus (to detect deletions)
 */

import { useEffect, useState } from 'react';
import { DOCUMENTS } from '@/config/documents';

type DocumentKey = keyof typeof DOCUMENTS;

interface UseDocumentUrlResult {
  url: string;
  isLoading: boolean;
  isAvailable: boolean;
  originalFilename: string | null;
}

export function useDocumentUrl(docKey: DocumentKey): UseDocumentUrlResult {
  const document = DOCUMENTS[docKey];
  const [isLoading, setIsLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);
  const [originalFilename, setOriginalFilename] = useState<string | null>(null);
  const [checkTrigger, setCheckTrigger] = useState(0);

  // Always use R2 URL (no fallback)
  const filename = document.path.split('/').pop() || '';
  const url = `/api/media/documents/${filename}`;

  useEffect(() => {
    const checkR2 = async () => {
      if (!filename) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // HEAD request to check if file exists in R2
        // Add cache-busting timestamp to prevent browser caching
        const cacheBuster = `?_=${Date.now()}`;
        const response = await fetch(url + cacheBuster, {
          method: 'HEAD',
          cache: 'no-store', // Prevent browser from using cached response
        });

        if (response.ok) {
          // File exists in R2
          setIsAvailable(true);
          // Get original filename from response header
          const filename = response.headers.get('X-Original-Filename');
          setOriginalFilename(filename);
        } else {
          // File not in R2
          setIsAvailable(false);
          setOriginalFilename(null);
        }
      } catch (error) {
        // Network error or file not found
        setIsAvailable(false);
        console.warn(`Failed to check R2 for ${filename}:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    checkR2();
  }, [docKey, filename, url, checkTrigger]);

  // Re-check when window regains focus (e.g., after navigating back from admin panel)
  useEffect(() => {
    const handleFocus = () => {
      setCheckTrigger(prev => prev + 1);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return { url, isLoading, isAvailable, originalFilename };
}
