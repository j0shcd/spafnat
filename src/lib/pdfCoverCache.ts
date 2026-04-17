import * as pdfjsLib from 'pdfjs-dist';

const pdfCoverDataUrlCache = new Map<string, string>();
const inFlightPdfCoverRender = new Map<string, Promise<string>>();
const MIN_RENDER_SCALE = 0.65;
const MAX_RENDER_SCALE = 1;
const TARGET_COVER_WIDTH_PX = 460;

let isPdfWorkerConfigured = false;

function ensurePdfWorkerConfigured() {
  if (isPdfWorkerConfigured) {
    return;
  }

  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
  isPdfWorkerConfigured = true;
}

export function getCachedPdfCover(url: string): string | null {
  return pdfCoverDataUrlCache.get(url) ?? null;
}

export async function prefetchPdfCover(url: string): Promise<string> {
  const cached = pdfCoverDataUrlCache.get(url);
  if (cached) {
    return cached;
  }

  const inFlight = inFlightPdfCoverRender.get(url);
  if (inFlight) {
    return inFlight;
  }

  const renderPromise = (async () => {
    ensurePdfWorkerConfigured();

    const loadingTask = pdfjsLib.getDocument({
      url,
      // We only need page 1 for the cover preview.
      disableAutoFetch: true,
    });
    const pdf = await loadingTask.promise;

    try {
      const page = await pdf.getPage(1);
      const baseViewport = page.getViewport({ scale: 1 });
      const fittedScale = TARGET_COVER_WIDTH_PX / baseViewport.width;
      const scale = Math.max(MIN_RENDER_SCALE, Math.min(MAX_RENDER_SCALE, fittedScale));
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Could not get canvas context');
      }

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvas,
        canvasContext: context,
        viewport,
      }).promise;

      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      pdfCoverDataUrlCache.set(url, dataUrl);
      return dataUrl;
    } finally {
      await pdf.destroy();
    }
  })();

  inFlightPdfCoverRender.set(url, renderPromise);

  try {
    return await renderPromise;
  } finally {
    inFlightPdfCoverRender.delete(url);
  }
}
