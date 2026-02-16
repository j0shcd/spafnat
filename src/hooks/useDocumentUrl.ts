/**
 * useDocumentUrl Hook
 *
 * Checks if a document exists in R2 storage and returns the appropriate URL.
 * - If document exists in R2: returns /api/media/documents/{filename}
 * - If not in R2: returns the original local path from documents.ts
 *
 * This enables gradual migration from local files to R2 without breaking links.
 */

import { useEffect, useState } from 'react';
import { DOCUMENTS } from '@/config/documents';

type DocumentKey = keyof typeof DOCUMENTS;

interface UseDocumentUrlResult {
  url: string;
  isLoading: boolean;
  isFromR2: boolean;
}

export function useDocumentUrl(docKey: DocumentKey): UseDocumentUrlResult {
  const document = DOCUMENTS[docKey];
  const [url, setUrl] = useState(document.path); // Default to local path
  const [isLoading, setIsLoading] = useState(true);
  const [isFromR2, setIsFromR2] = useState(false);

  useEffect(() => {
    const checkR2 = async () => {
      // Extract filename from path
      const filename = document.path.split('/').pop();
      if (!filename) {
        setIsLoading(false);
        return;
      }

      const r2Url = `/api/media/documents/${filename}`;

      try {
        // HEAD request to check if file exists in R2 (doesn't download the file)
        const response = await fetch(r2Url, { method: 'HEAD' });

        if (response.ok) {
          // File exists in R2, use R2 URL
          setUrl(r2Url);
          setIsFromR2(true);
        }
        // If not in R2, keep using the local path (already set in useState)
      } catch (error) {
        // Network error, keep using local path
        console.warn(`Failed to check R2 for ${filename}:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    checkR2();
  }, [docKey, document.path]);

  return { url, isLoading, isFromR2 };
}
