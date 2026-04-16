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

interface MediaHeadMetadata {
  originalFilename: string | null;
  versionToken: string | null;
}

interface DocumentAvailabilityState {
  isAvailable: boolean;
  originalFilename: string | null;
  versionToken: string | null;
  checkedAt: number;
}

interface PrefetchedDocumentResult {
  url: string;
  isAvailable: boolean;
  originalFilename: string | null;
}

const DOCUMENT_CACHE_TTL_MS = 5 * 60 * 1000;
const documentAvailabilityCache = new Map<string, DocumentAvailabilityState>();
const inFlightAvailabilityChecks = new Map<string, Promise<DocumentAvailabilityState>>();

function getDocumentFilename(docKey: DocumentKey): string {
  return DOCUMENTS[docKey].path.split('/').pop() || '';
}

function getDocumentBaseUrl(docKey: DocumentKey): string {
  const filename = getDocumentFilename(docKey);
  return filename ? `/api/media/documents/${filename}` : '';
}

function buildVersionedDocumentUrl(baseUrl: string, versionToken: string | null): string {
  if (!versionToken) return baseUrl;
  return `${baseUrl}?v=${encodeURIComponent(versionToken)}`;
}

async function fetchDocumentAvailability(
  baseUrl: string,
  filename: string,
  options?: { forceRefresh?: boolean }
): Promise<DocumentAvailabilityState> {
  const forceRefresh = options?.forceRefresh ?? false;
  const cached = documentAvailabilityCache.get(baseUrl);
  const now = Date.now();

  if (!forceRefresh && cached && now - cached.checkedAt < DOCUMENT_CACHE_TTL_MS) {
    return cached;
  }

  const inFlight = inFlightAvailabilityChecks.get(baseUrl);
  if (inFlight) {
    return inFlight;
  }

  const request = (async (): Promise<DocumentAvailabilityState> => {
    if (!filename) {
      const missingFileState: DocumentAvailabilityState = {
        isAvailable: false,
        originalFilename: null,
        versionToken: null,
        checkedAt: Date.now(),
      };
      documentAvailabilityCache.set(baseUrl, missingFileState);
      return missingFileState;
    }

    try {
      const requestUrl =
        typeof window === 'undefined'
          ? baseUrl
          : new URL(baseUrl, window.location.origin).toString();

      const response = await fetch(requestUrl, {
        method: 'HEAD',
        cache: 'no-store',
      });

      if (response.ok) {
        const metadata = parseMediaHeadMetadata(response.headers);
        const nextState: DocumentAvailabilityState = {
          isAvailable: true,
          originalFilename: metadata.originalFilename,
          versionToken: metadata.versionToken,
          checkedAt: Date.now(),
        };
        documentAvailabilityCache.set(baseUrl, nextState);
        return nextState;
      }

      const unavailableState: DocumentAvailabilityState = {
        isAvailable: false,
        originalFilename: null,
        versionToken: null,
        checkedAt: Date.now(),
      };
      documentAvailabilityCache.set(baseUrl, unavailableState);
      return unavailableState;
    } catch (error) {
      if (cached) {
        return cached;
      }

      console.warn(`Failed to check R2 for ${filename}:`, error);
      return {
        isAvailable: false,
        originalFilename: null,
        versionToken: null,
        checkedAt: Date.now(),
      };
    }
  })();

  inFlightAvailabilityChecks.set(baseUrl, request);

  try {
    return await request;
  } finally {
    inFlightAvailabilityChecks.delete(baseUrl);
  }
}

export async function prefetchDocumentUrl(docKey: DocumentKey): Promise<PrefetchedDocumentResult | null> {
  const filename = getDocumentFilename(docKey);
  const baseUrl = getDocumentBaseUrl(docKey);

  if (!filename || !baseUrl) {
    return null;
  }

  const availability = await fetchDocumentAvailability(baseUrl, filename);
  return {
    url: buildVersionedDocumentUrl(baseUrl, availability.versionToken),
    isAvailable: availability.isAvailable,
    originalFilename: availability.originalFilename,
  };
}

export function resetDocumentUrlCacheForTests(): void {
  documentAvailabilityCache.clear();
  inFlightAvailabilityChecks.clear();
}

export function parseMediaHeadMetadata(headers: Headers): MediaHeadMetadata {
  const encodedFilename = headers.get('X-Original-Filename-Encoded');
  const fallbackFilename = headers.get('X-Original-Filename');
  const uploadedAt = headers.get('X-Uploaded-At');

  const normalizeFilename = (value: string | null): string | null => {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^[a-z]+\/[a-z0-9.+-]+$/i.test(trimmed)) return null;
    return trimmed;
  };

  let originalFilename: string | null = null;

  if (encodedFilename) {
    try {
      originalFilename = normalizeFilename(decodeURIComponent(encodedFilename));
    } catch {
      originalFilename = normalizeFilename(fallbackFilename);
    }
  } else {
    originalFilename = normalizeFilename(fallbackFilename);
  }

  return {
    originalFilename: originalFilename && originalFilename.length > 0 ? originalFilename : null,
    versionToken: uploadedAt && uploadedAt.length > 0 ? uploadedAt : null,
  };
}

export function useDocumentUrl(docKey: DocumentKey): UseDocumentUrlResult {
  const filename = getDocumentFilename(docKey);
  const baseUrl = getDocumentBaseUrl(docKey);
  const [isLoading, setIsLoading] = useState(!documentAvailabilityCache.has(baseUrl));
  const [isAvailable, setIsAvailable] = useState(false);
  const [originalFilename, setOriginalFilename] = useState<string | null>(null);
  const [versionToken, setVersionToken] = useState<string | null>(null);
  const [checkTrigger, setCheckTrigger] = useState(0);

  const url = buildVersionedDocumentUrl(baseUrl, versionToken);

  useEffect(() => {
    let isMounted = true;
    const cached = documentAvailabilityCache.get(baseUrl);

    if (cached) {
      setIsAvailable(cached.isAvailable);
      setOriginalFilename(cached.originalFilename);
      setVersionToken(cached.versionToken);
      setIsLoading(false);
    } else {
      if (!filename) {
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }
    }

    const checkR2 = async () => {
      const latestCached = documentAvailabilityCache.get(baseUrl);
      const cacheAge = latestCached ? Date.now() - latestCached.checkedAt : Number.POSITIVE_INFINITY;
      const shouldForceRefresh = checkTrigger > 0 && cacheAge >= DOCUMENT_CACHE_TTL_MS;
      const availability = await fetchDocumentAvailability(baseUrl, filename, {
        forceRefresh: shouldForceRefresh,
      });

      if (!isMounted) {
        return;
      }

      setIsAvailable(availability.isAvailable);
      setOriginalFilename(availability.originalFilename);
      setVersionToken(availability.versionToken);
      setIsLoading(false);
    };

    checkR2();

    return () => {
      isMounted = false;
    };
  }, [docKey, filename, baseUrl, checkTrigger]);

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
