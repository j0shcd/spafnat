import { prefetchDocumentUrl } from '@/hooks/useDocumentUrl';

let inFlightRevueWarmup: Promise<void> | null = null;
const REVUE_COVER_BASE_URL = '/api/media/documents/extrait_revue_cover.jpg';

function extractVersionToken(url: string): string | null {
  const query = url.split('?')[1] ?? '';
  const params = new URLSearchParams(query);
  const versionToken = params.get('v');
  return versionToken && versionToken.length > 0 ? versionToken : null;
}

function buildRevueCoverUrl(documentUrl: string): string {
  const versionToken = extractVersionToken(documentUrl);
  if (!versionToken) return REVUE_COVER_BASE_URL;
  return `${REVUE_COVER_BASE_URL}?v=${encodeURIComponent(versionToken)}`;
}

function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Cover image preload failed'));
    img.src = url;
  });
}

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
      await preloadImage(buildRevueCoverUrl(prefetched.url));
      return;
    } catch {
      // Cover may not exist yet for legacy uploads; fall back to PDF raster warmup.
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
