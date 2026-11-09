import type { PDFDocumentLoadingTask, PDFWorker, RenderTask } from 'pdfjs-dist';

export const PDF_COVER_TIMEOUT_MS = 15_000;
const MAX_DIMENSION = 2048;
const MAX_PIXELS = 2_000_000;

/** Owns the full load/render/encode lifetime; neither caller may allocate an unchecked canvas. */
export async function renderPdfCover<T>(
  load: (worker: PDFWorker) => PDFDocumentLoadingTask | Promise<PDFDocumentLoadingTask>,
  targetWidth: number,
  encode: (canvas: HTMLCanvasElement) => T | Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort(new DOMException('Préparation annulée', 'AbortError'));
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort, { once: true });
  let loadingTask: PDFDocumentLoadingTask | undefined;
  let renderTask: RenderTask | undefined;
  let pdfWorker: PDFWorker | undefined;
  let worker: Worker | undefined;
  let canvas: HTMLCanvasElement | undefined;
  const check = () => controller.signal.throwIfAborted();
  const dispose = () => {
    renderTask?.cancel();
    renderTask = undefined;
    if (loadingTask) {
      // Teardown must not hold the caller past its deadline if PDF.js never settles.
      void loadingTask.destroy().catch(() => {});
      loadingTask = undefined;
    }
    pdfWorker?.destroy();
    pdfWorker = undefined;
    worker?.terminate(); // Independent of PDF.js setup/transport teardown settling.
    worker = undefined;
    if (canvas) canvas.width = canvas.height = 0;
  };
  let rejectAborted: () => void = () => {};
  const cancelled = new Promise<never>((_, reject) => {
    rejectAborted = () => reject(controller.signal.reason);
    controller.signal.addEventListener('abort', rejectAborted, { once: true });
  });
  const timer = setTimeout(() => controller.abort(new Error(
    'La préparation de l’aperçu prend trop de temps.'
  )), PDF_COVER_TIMEOUT_MS);
  try {
    check();
    const work = (async () => {
      const pdfjs = await import('pdfjs-dist');
      check();
      worker = new Worker(new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url), { type: 'module' });
      pdfWorker = pdfjs.PDFWorker.create({ port: worker });
      loadingTask = await load(pdfWorker);
      if (controller.signal.aborted) {
        dispose(); // A cancelled dynamic import/file read may deliver its task late.
        check();
      }
      const pdf = await loadingTask.promise;
      check();
      const page = await pdf.getPage(1);
      check();
      const base = page.getViewport({ scale: 1 });
      if (![base.width, base.height, targetWidth].every(value => Number.isFinite(value) && value > 0)) {
        throw new Error('Dimensions du document invalides');
      }
      const scale = Math.min(targetWidth / base.width, MAX_DIMENSION / base.width,
        MAX_DIMENSION / base.height, Math.sqrt(MAX_PIXELS / base.width / base.height), 1.8);
      const viewport = page.getViewport({ scale });
      if (![viewport.width, viewport.height].every(value => Number.isFinite(value) && value > 0)) {
        throw new Error('Dimensions de l’aperçu invalides');
      }
      const width = Math.max(1, Math.floor(viewport.width));
      const height = Math.max(1, Math.floor(viewport.height));
      if (![width, height].every(value => Number.isFinite(value) && value >= 1 && value <= MAX_DIMENSION) ||
          width * height > MAX_PIXELS) throw new Error('Dimensions de l’aperçu invalides');
      canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Impossible de préparer l’aperçu');
      renderTask = page.render({ canvas, canvasContext: context, viewport });
      await renderTask.promise;
      check();
      const result = await encode(canvas);
      check();
      return result;
    })();
    return await Promise.race([work, cancelled]);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
    controller.signal.removeEventListener('abort', rejectAborted);
    dispose();
  }
}
