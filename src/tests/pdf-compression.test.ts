import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { compressPdf, PDF_UPLOAD_LIMIT_BYTES } from '../lib/pdf-compression';
import { PDF_COMPRESSION_TARGET_BYTES, PDF_COMPRESSION_TIMEOUT_MS, MAX_PDF_INPUT_BYTES } from '../lib/pdf-compression-protocol';

class TestWorker {
  static instances: TestWorker[] = [];
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: ((event: { preventDefault: () => void }) => void) | null = null;
  onmessageerror: (() => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor() { TestWorker.instances.push(this); }
}

function pdf(size = PDF_UPLOAD_LIMIT_BYTES + 1): File {
  const file = new File(['%PDF-1.7'], 'document.pdf', { type: 'application/pdf', lastModified: 123 });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

const validBytes = new Uint8Array(new TextEncoder().encode('%PDF-1.7 test result'));
const oversizedPdf = new Uint8Array(PDF_COMPRESSION_TARGET_BYTES + 1);
oversizedPdf.set(validBytes);
const currentWorker = () => TestWorker.instances[TestWorker.instances.length - 1]!;

describe('bounded PDF compression', () => {
  beforeEach(() => {
    TestWorker.instances = [];
    vi.stubGlobal('Worker', TestWorker);
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

  it('leaves files up to 5 MiB untouched and does not load the worker', async () => {
    const small = pdf(PDF_UPLOAD_LIMIT_BYTES);
    expect(await compressPdf(small)).toBe(small);
    expect(TestWorker.instances).toHaveLength(0);
  });

  it('accepts only a bounded PDF result, preserves the filename and releases the worker', async () => {
    const original = pdf();
    const pending = compressPdf(original);
    const worker = currentWorker();
    expect(worker.postMessage).toHaveBeenCalledWith(original);
    worker.onmessage!({ data: { ok: true, bytes: validBytes } });
    const compressed = await pending;
    expect(compressed.name).toBe(original.name);
    expect(compressed.type).toBe('application/pdf');
    expect(compressed.size).toBe(validBytes.length);
    expect(compressed.lastModified).toBe(original.lastModified);
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it('rejects inputs over 50 MiB before loading an engine', async () => {
    await expect(compressPdf(pdf(MAX_PDF_INPUT_BYTES + 1))).rejects.toThrow('trop volumineux');
    expect(TestWorker.instances).toHaveLength(0);
  });

  it.each([
    new Uint8Array(), new TextEncoder().encode('not a PDF'),
    oversizedPdf,
  ])('rejects an invalid or oversized worker result before upload', async (bytes) => {
    const pending = compressPdf(pdf());
    currentWorker().onmessage!({ data: { ok: true, bytes } });
    await expect(pending).rejects.toThrow('Impossible de réduire');
    expect(currentWorker().terminate).toHaveBeenCalledOnce();
  });

  it.each(['protected', 'unreadable', 'too-large'])('stops safely for %s documents', async (reason) => {
    const pending = compressPdf(pdf());
    currentWorker().onmessage!({ data: { ok: false, reason } });
    await expect(pending).rejects.toThrow(/Contactez Flore/);
    expect(currentWorker().terminate).toHaveBeenCalledOnce();
  });

  it('limits concurrent engines and can start again after failure', async () => {
    const first = compressPdf(pdf());
    await expect(compressPdf(pdf())).rejects.toThrow('déjà en cours');
    expect(TestWorker.instances).toHaveLength(1);
    currentWorker().onmessage!({ data: { ok: false, reason: 'unreadable' } });
    await expect(first).rejects.toThrow();
    const second = compressPdf(pdf());
    currentWorker().onmessage!({ data: { ok: true, bytes: validBytes } });
    await expect(second).resolves.toBeInstanceOf(File);
  });

  it('terminates a hung engine after 30 seconds', async () => {
    vi.useFakeTimers();
    const pending = compressPdf(pdf());
    const assertion = expect(pending).rejects.toThrow('trop de temps');
    await vi.advanceTimersByTimeAsync(PDF_COMPRESSION_TIMEOUT_MS);
    await assertion;
    expect(currentWorker().terminate).toHaveBeenCalledOnce();
  });

  it('terminates on navigation cancellation', async () => {
    const controller = new AbortController();
    const pending = compressPdf(pdf(), controller.signal);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(currentWorker().terminate).toHaveBeenCalledOnce();
  });

  it('rejects worker crashes and releases the engine', async () => {
    const pending = compressPdf(pdf());
    const preventDefault = vi.fn();
    currentWorker().onerror!({ preventDefault });
    await expect(pending).rejects.toThrow('Impossible de réduire');
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(currentWorker().terminate).toHaveBeenCalledOnce();
  });
});

describe('PDF worker protection boundary', () => {
  let handleMessage: (event: { data: File }) => Promise<void>;
  let metadata: { encrypt: { encrypted: boolean }; qpdf: unknown[] };
  let output: Uint8Array;
  let callMain: ReturnType<typeof vi.fn>;
  let createEngine: ReturnType<typeof vi.fn>;
  let postMessage: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();
    metadata = { encrypt: { encrypted: false }, qpdf: [{}, {}] };
    output = validBytes;
    callMain = vi.fn(() => 0);
    postMessage = vi.fn();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('self', {
      addEventListener: (_name: string, listener: typeof handleMessage) => { handleMessage = listener; },
      postMessage,
    });
    createEngine = vi.fn(async () => ({
      callMain, FS: {
        mkdir: vi.fn(), writeFile: vi.fn(), unlink: vi.fn(),
        readFile: (path: string) => path === '/inspection.json'
          ? new TextEncoder().encode(JSON.stringify(metadata)) : output,
      },
    }));
    vi.doMock('virtual:spaf-qpdf-core', () => ({ default: createEngine }));
    await import('../lib/pdf-compression.worker');
  });

  afterEach(() => {
    vi.doUnmock('virtual:spaf-qpdf-core');
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.each([null, pdf(MAX_PDF_INPUT_BYTES + 1)])('rejects invalid worker input before creating an engine', async file => {
    await handleMessage({ data: file as File });
    expect(createEngine).not.toHaveBeenCalled();
    expect(postMessage).toHaveBeenCalledWith({ ok: false, reason: 'unreadable' }, {});
  });

  it.each([
    { '/Type': '/Sig' },
    { '/FT': '/Sig', '/V': '12 0 R' },
    { '/ByteRange': [0, 10, 20, 30], '/Contents': 'signature' },
  ])('refuses actual signature objects before rewriting', async (signature) => {
    metadata.qpdf[1] = { 'obj:1 0 R': { value: signature } };
    await handleMessage({ data: pdf() });
    expect(postMessage).toHaveBeenCalledWith({ ok: false, reason: 'protected' }, {});
    expect(callMain).toHaveBeenCalledTimes(1);
  });

  it('allows an unsigned form with an empty signature field', async () => {
    metadata.qpdf[1] = { 'obj:1 0 R': { value: { '/FT': '/Sig' } } };
    await handleMessage({ data: pdf() });
    expect(postMessage.mock.calls[0][0]).toEqual({ ok: true, bytes: validBytes });
    expect(callMain).toHaveBeenCalledTimes(3);
    expect(callMain.mock.calls[1][0]).toContain('--jpeg-quality=90');
  });

  it('refuses encrypted PDFs before rewriting', async () => {
    metadata.encrypt.encrypted = true;
    await handleMessage({ data: pdf() });
    expect(postMessage).toHaveBeenCalledWith({ ok: false, reason: 'protected' }, {});
    expect(callMain).toHaveBeenCalledTimes(1);
  });

  it.each([0, 1, 2])('refuses nonzero parser exit at stage %i', async (stage) => {
    callMain.mockImplementationOnce(() => stage === 0 ? 3 : 0)
      .mockImplementationOnce(() => stage === 1 ? 3 : 0)
      .mockImplementationOnce(() => stage === 2 ? 3 : 0);
    await handleMessage({ data: pdf() });
    expect(postMessage).toHaveBeenCalledWith({ ok: false, reason: 'unreadable' }, {});
    expect(callMain).toHaveBeenCalledTimes(stage + 1);
  });

  it('refuses results over the upload preparation ceiling', async () => {
    output = new Uint8Array(PDF_COMPRESSION_TARGET_BYTES + 1);
    await handleMessage({ data: pdf() });
    expect(postMessage).toHaveBeenCalledWith({ ok: false, reason: 'too-large' }, {});
  });
});
