import * as pdfjsLib from 'pdfjs-dist';

const pdfCoverDataUrlCache = new Map<string, string>();
const inFlightPdfCoverRender = new Map<string, Promise<string>>();

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

    const loadingTask = pdfjsLib.getDocument(url);
    const pdf = await loadingTask.promise;

    try {
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.4 });
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

      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
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
