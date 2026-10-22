import {
  PDF_UPLOAD_LIMIT_BYTES,
  PDF_COMPRESSION_TARGET_BYTES,
  MAX_PDF_INPUT_BYTES,
  PDF_COMPRESSION_TIMEOUT_MS,
  type PdfCompressionResult,
} from './pdf-compression-protocol';

export { PDF_UPLOAD_LIMIT_BYTES } from './pdf-compression-protocol';

const FAILURE_MESSAGE = 'Impossible de réduire ce document. Contactez Flore pour vous aider.';
const TOO_LARGE_MESSAGE = 'Le document reste trop volumineux. Contactez Flore pour le réduire.';
let compressionInProgress = false;

/** One disposable worker per large PDF; smaller files never load the engine. */
export async function compressPdf(file: File, signal?: AbortSignal): Promise<File> {
  if (signal?.aborted) throw new DOMException('Réduction annulée', 'AbortError');
  if (file.size <= PDF_UPLOAD_LIMIT_BYTES) return file;
  if (file.size > MAX_PDF_INPUT_BYTES) throw new Error(TOO_LARGE_MESSAGE);
  if (compressionInProgress) throw new Error('Un document est déjà en cours de préparation.');

  compressionInProgress = true;
  let worker: Worker | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let onAbort = () => {};

  try {
    return await new Promise<File>((resolve, reject) => {
      worker = new Worker(new URL('./pdf-compression.worker.ts', import.meta.url), { type: 'module' });
      onAbort = () => reject(new DOMException('Réduction annulée', 'AbortError'));
      signal?.addEventListener('abort', onAbort, { once: true });
      timer = setTimeout(() => reject(new Error(
        'La réduction prend trop de temps. Contactez Flore pour vous aider.'
      )), PDF_COMPRESSION_TIMEOUT_MS);

      worker.onmessage = ({ data }: MessageEvent<PdfCompressionResult>) => {
        if (data?.ok !== true) {
          reject(new Error(data?.ok === false && data.reason === 'too-large' ? TOO_LARGE_MESSAGE : FAILURE_MESSAGE));
          return;
        }

        const bytes = data.bytes;
        if (!(bytes instanceof Uint8Array) || bytes.length < 5 ||
            bytes.length > PDF_COMPRESSION_TARGET_BYTES ||
            String.fromCharCode(...bytes.subarray(0, 5)) !== '%PDF-') {
          reject(new Error(FAILURE_MESSAGE));
          return;
        }

        resolve(new File([bytes.slice().buffer], file.name, {
          type: 'application/pdf', lastModified: file.lastModified,
        }));
      };
      worker.onerror = (event) => {
        event.preventDefault();
        reject(new Error(FAILURE_MESSAGE));
      };
      worker.onmessageerror = () => reject(new Error(FAILURE_MESSAGE));
      worker.postMessage(file);
    });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
    worker?.terminate();
    compressionInProgress = false;
  }
}
