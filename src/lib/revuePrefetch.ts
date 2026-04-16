import { prefetchDocumentUrl } from '@/hooks/useDocumentUrl';

let inFlightRevueWarmup: Promise<void> | null = null;

/**
 * Preloads the Revue document metadata and first-page preview so
 * navigating to /revue feels near-instant after hover/focus.
 */
export function warmRevuePreview(): Promise<void> {
  if (inFlightRevueWarmup) {
    return inFlightRevueWarmup;
  }

  inFlightRevueWarmup = (async () => {
    const prefetched = await prefetchDocumentUrl('extraitRevue');
    if (!prefetched?.isAvailable) {
      return;
    }

    try {
      const { prefetchPdfCover } = await import('@/lib/pdfCoverCache');
      await prefetchPdfCover(prefetched.url);
    } catch {
      // Best-effort warmup; page-level component handles fallback.
    }
  })().finally(() => {
    inFlightRevueWarmup = null;
  });

  return inFlightRevueWarmup;
}
