export const PDF_UPLOAD_LIMIT_BYTES = 5 * 1024 * 1024;
export const PDF_COMPRESSION_TARGET_BYTES = 4 * 1024 * 1024;
export const MAX_PDF_INPUT_BYTES = 50 * 1024 * 1024;
export const PDF_COMPRESSION_TIMEOUT_MS = 30_000;

export type PdfCompressionResult =
  | { ok: true; bytes: Uint8Array }
  | { ok: false; reason: 'protected' | 'unreadable' | 'too-large' };
