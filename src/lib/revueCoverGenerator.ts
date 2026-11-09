import { renderPdfCover } from './pdf-cover-renderer';
import { REVUE_COVER_FILENAME } from '@/config/documents';
const TARGET_COVER_WIDTH_PX = 900;
const JPEG_QUALITY = 0.84;

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
export async function generateRevueCoverFromPdf(pdfFile: File, signal?: AbortSignal): Promise<File> {
  return renderPdfCover(async worker => {
    signal?.throwIfAborted();
    const pdfjsLib = await import('pdfjs-dist');
    signal?.throwIfAborted();
    const data = new Uint8Array(await pdfFile.arrayBuffer());
    signal?.throwIfAborted();
    return pdfjsLib.getDocument({ data, disableAutoFetch: true, worker });
  }, TARGET_COVER_WIDTH_PX, async canvas => {
    const jpegBlob = await canvasToJpegBlob(canvas, JPEG_QUALITY);
    return new File([jpegBlob], REVUE_COVER_FILENAME, {
      type: 'image/jpeg', lastModified: Date.now(),
    });
  }, signal);
}
