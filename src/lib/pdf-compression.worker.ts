import createQpdf from '@neslinesli93/qpdf-wasm';
import wasmUrl from '@neslinesli93/qpdf-wasm/dist/qpdf.wasm?url';
import {
  MAX_PDF_INPUT_BYTES, PDF_COMPRESSION_TARGET_BYTES, type PdfCompressionResult,
} from './pdf-compression-protocol';

// qpdf diagnostics can include document content. Keep them inside this worker.
console.log = () => {};
console.error = () => {};

function hasSignature(value: unknown): boolean {
  const remaining = [value];
  while (remaining.length) {
    const item = remaining.pop();
    if (!item || typeof item !== 'object') continue;
    if ('/Type' in item && item['/Type'] === '/Sig') return true;
    if ('/FT' in item && item['/FT'] === '/Sig' && '/V' in item && item['/V'] != null) return true;
    if ('/ByteRange' in item && '/Contents' in item) return true;
    remaining.push(...Object.values(item));
  }
  return false;
}

self.addEventListener('message', async ({ data: file }: MessageEvent<File>) => {
  let result: PdfCompressionResult;
  try {
    if (!(file instanceof File) || file.size > MAX_PDF_INPUT_BYTES) {
      throw new Error('Unsupported input');
    }

    const qpdf = await createQpdf({ locateFile: () => wasmUrl });
    qpdf.FS.mkdir('/input');
    qpdf.FS.mount(qpdf.WORKERFS, { blobs: [{ name: 'document.pdf', data: file }] }, '/input');
    const input = '/input/document.pdf';
    const inspection = qpdf.callMain([
      '--json', '--json-key=encrypt', '--json-key=acroform', '--json-key=qpdf',
      input, '/inspection.json',
    ]);
    if (inspection !== 0) throw new Error('Invalid PDF');

    const inspectionBytes = qpdf.FS.readFile('/inspection.json');
    if (inspectionBytes.length > 4 * 1024 * 1024) throw new Error('PDF structure too large');
    const metadata = JSON.parse(new TextDecoder().decode(inspectionBytes)) as {
      encrypt?: { encrypted?: unknown }; qpdf?: unknown[];
    };
    if (typeof metadata?.encrypt?.encrypted !== 'boolean' ||
        !Array.isArray(metadata.qpdf) || metadata.qpdf.length !== 2) {
      throw new Error('Invalid PDF structure');
    }

    if (metadata.encrypt.encrypted || hasSignature(metadata.qpdf[1])) {
      result = { ok: false, reason: 'protected' };
    } else {
      const exitCode = qpdf.callMain([
        '--object-streams=generate', '--compress-streams=y', '--recompress-flate',
        '--compression-level=9', '--optimize-images', '--jpeg-quality=90',
        input, '/output.pdf',
      ]);
      if (exitCode !== 0) throw new Error('Compression failed');
      const bytes = new Uint8Array(qpdf.FS.readFile('/output.pdf'));
      if (bytes.length > PDF_COMPRESSION_TARGET_BYTES) {
        result = { ok: false, reason: 'too-large' };
      } else {
        if (qpdf.callMain(['--check', '/output.pdf']) !== 0) throw new Error('Invalid result');
        result = { ok: true, bytes };
      }
    }
  } catch {
    result = { ok: false, reason: 'unreadable' };
  }

  self.postMessage(result, result.ok ? { transfer: [result.bytes.buffer] } : {});
});
