import * as pdfjsLib from 'pdfjs-dist';
import { renderPdfCover } from './pdf-cover-renderer';

const pdfCoverDataUrlCache = new Map<string, string>();
type CoverJob = { controller: AbortController; promise: Promise<string>; users: number };
const inFlightPdfCoverRender = new Map<string, CoverJob>();
const TARGET_COVER_WIDTH_PX = 460;

export function getCachedPdfCover(url: string): string | null {
  return pdfCoverDataUrlCache.get(url) ?? null;
}

/** Consumers share work; only the last cancellation tears down its PDF.js task. */
export async function prefetchPdfCover(url: string, signal?: AbortSignal): Promise<string> {
  signal?.throwIfAborted();
  const cached = pdfCoverDataUrlCache.get(url);
  if (cached) return cached;
  let job = inFlightPdfCoverRender.get(url);
  if (!job) {
    const controller = new AbortController();
    const promise = renderPdfCover(
      worker => pdfjsLib.getDocument({ url, disableAutoFetch: true, worker }), TARGET_COVER_WIDTH_PX,
      canvas => canvas.toDataURL('image/jpeg', 0.82), controller.signal,
    ).then(dataUrl => {
      controller.signal.throwIfAborted();
      pdfCoverDataUrlCache.set(url, dataUrl);
      return dataUrl;
    });
    job = { controller, promise, users: 0 };
    inFlightPdfCoverRender.set(url, job);
  }
  const current = job;
  current.users++;
  return new Promise<string>((resolve, reject) => {
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      signal?.removeEventListener('abort', onAbort);
      if (--current.users === 0) {
        if (inFlightPdfCoverRender.get(url) === current) inFlightPdfCoverRender.delete(url);
        current.controller.abort();
      }
    };
    const onAbort = () => {
      release();
      reject(new DOMException('Préparation annulée', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
    current.promise.then(value => { release(); resolve(value); }, error => { release(); reject(error); });
    if (signal?.aborted) onAbort();
  });
}
