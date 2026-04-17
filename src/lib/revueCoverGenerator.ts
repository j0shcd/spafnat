const REVUE_COVER_FILENAME = 'extrait_revue_cover.jpg';
const TARGET_COVER_WIDTH_PX = 900;
const MIN_RENDER_SCALE = 0.8;
const MAX_RENDER_SCALE = 1.8;
const JPEG_QUALITY = 0.84;

let isPdfWorkerConfigured = false;

function ensurePdfWorkerConfigured(pdfjsLib: typeof import('pdfjs-dist')): void {
  if (isPdfWorkerConfigured) return;

  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
  isPdfWorkerConfigured = true;
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Impossible de générer l’image de couverture'));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Generate a first-page JPEG cover from the revue PDF for faster public rendering.
 * This keeps admin UX as a single-file upload while shipping both assets to R2.
 */
export async function generateRevueCoverFromPdf(pdfFile: File): Promise<File> {
  const pdfjsLib = await import('pdfjs-dist');
  ensurePdfWorkerConfigured(pdfjsLib);

  const pdfBytes = new Uint8Array(await pdfFile.arrayBuffer());
  const loadingTask = pdfjsLib.getDocument({
    data: pdfBytes,
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
      throw new Error('Impossible de préparer le rendu de couverture');
    }

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    await page.render({
      canvas,
      canvasContext: context,
      viewport,
    }).promise;

    const jpegBlob = await canvasToJpegBlob(canvas, JPEG_QUALITY);
    return new File([jpegBlob], REVUE_COVER_FILENAME, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } finally {
    await pdf.destroy();
  }
}

