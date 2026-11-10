import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDocument } from 'pdfjs-dist';

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  PDFWorker: class { static create() { return new this(); } destroy = vi.fn(); },
  getDocument: vi.fn(),
}));

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal('Worker', class { terminate = vi.fn(); });
  vi.restoreAllMocks();
  vi.mocked(getDocument).mockClear();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,fixture');
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(callback => callback(new Blob(['cover'])));
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

function fixture(width = 600, height = 800, stall?: 'load' | 'page' | 'render', failure?: 'load' | 'render') {
  const never = new Promise<never>(() => {});
  const error = new Error('PDF fixture failed');
  const cancel = vi.fn();
  const page = {
    getViewport: ({ scale }: { scale: number }) => ({ width: width * scale, height: height * scale }),
    render: vi.fn((options: { canvas: HTMLCanvasElement }) => {
      expect(options.canvas.width).toBeGreaterThan(0);
      expect(options.canvas.height).toBeGreaterThan(0);
      expect(options.canvas.width).toBeLessThanOrEqual(2048);
      expect(options.canvas.height).toBeLessThanOrEqual(2048);
      expect(options.canvas.width * options.canvas.height).toBeLessThanOrEqual(2_000_000);
      return { promise: failure === 'render' ? Promise.reject(error) : stall === 'render' ? never : Promise.resolve(), cancel };
    }),
  };
  const task = {
    promise: failure === 'load' ? Promise.reject(error) : stall === 'load' ? never : Promise.resolve({
      getPage: () => stall === 'page' ? never : Promise.resolve(page),
    }),
    destroy: vi.fn().mockResolvedValue(undefined),
  };
  vi.mocked(getDocument).mockReturnValue(task as unknown as ReturnType<typeof getDocument>);
  return { task, page, cancel };
}

async function renderCore() {
  return (await import('../lib/pdf-cover-renderer')).renderPdfCover(
    worker => getDocument({ worker }), 900, canvas => canvas.toDataURL('image/jpeg'),
  );
}

describe('shared PDF renderer lifecycle and bounds', () => {
  it('releases the loading task after rendering a cover', async () => {
    const { task } = fixture();
    await expect(renderCore()).resolves.toBe('data:image/jpeg;base64,fixture');
    expect(task.destroy).toHaveBeenCalledTimes(1);
  });
  it.each(['load', 'render'] as const)('releases the loading task after a %s failure', async failure => {
    const { task } = fixture(600, 800, undefined, failure);
    await expect(renderCore()).rejects.toThrow('PDF fixture failed');
    expect(task.destroy).toHaveBeenCalledTimes(1);
  });
  it.each([[100_000, 100_000], [600, 1_000_000], [1_000_000, 600]])('bounds %s by %s page geometry before allocation', async (w, h) => {
    const { page } = fixture(w, h);
    await renderCore();
    const { canvas } = page.render.mock.calls[0][0];
    expect(canvas.width).toBe(0);
    expect(page.render).toHaveBeenCalledTimes(1);
  });
  it.each([0, -1, NaN, Infinity])('rejects invalid geometry %s before rendering', async width => {
    const { page, task } = fixture(width);
    await expect(renderCore()).rejects.toThrow('Dimensions');
    expect(page.render).not.toHaveBeenCalled();
    expect(task.destroy).toHaveBeenCalledTimes(1);
  });
  it.each(['load', 'page', 'render'] as const)('bounds a stalled %s phase and tears down work', async stall => {
    const { task, cancel } = fixture(600, 800, stall);
    const terminate = vi.fn();
    vi.stubGlobal('Worker', class { terminate = terminate; });
    await import('../lib/pdf-cover-renderer');
    vi.useFakeTimers();
    const pending = renderCore();
    const rejected = expect(pending).rejects.toThrow('prend trop de temps');
    await vi.advanceTimersByTimeAsync(15_001);
    await rejected;
    expect(task.destroy).toHaveBeenCalledTimes(1);
    expect(terminate).toHaveBeenCalledTimes(1);
    if (stall === 'render') expect(cancel).toHaveBeenCalledTimes(1);
  });
});

describe.each(['public preview', 'admin upload'] as const)('%s adapter cancellation', flow => {
  async function render(signal: AbortSignal) {
    if (flow === 'public preview') {
      return (await import('../lib/pdfCoverCache')).prefetchPdfCover('/fixture.pdf', signal);
    }
    return (await import('../lib/revueCoverGenerator')).generateRevueCoverFromPdf(
      new File(['%PDF-fixture'], 'fixture.pdf'), signal);
  }
  it('does not start already cancelled work', async () => {
    fixture();
    const controller = new AbortController(); controller.abort();
    await expect(render(controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    expect(getDocument).not.toHaveBeenCalled();
  });
  it('aborts an active render and never encodes it', async () => {
    const { task, cancel, page } = fixture(600, 800, 'render');
    const controller = new AbortController();
    const pending = render(controller.signal);
    await vi.waitFor(() => expect(page.render).toHaveBeenCalled());
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(task.destroy).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(HTMLCanvasElement.prototype.toDataURL).not.toHaveBeenCalled();
    expect(HTMLCanvasElement.prototype.toBlob).not.toHaveBeenCalled();
  });
});

it('returns and reuses the public JPEG data URL without rendering twice', async () => {
  const { task } = fixture();
  const { prefetchPdfCover, getCachedPdfCover } = await import('../lib/pdfCoverCache');
  const result = await prefetchPdfCover('/public.pdf');
  expect(result).toBe('data:image/jpeg;base64,fixture');
  expect(getCachedPdfCover('/public.pdf')).toBe(result);
  await expect(prefetchPdfCover('/public.pdf')).resolves.toBe(result);
  expect(getDocument).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ url: '/public.pdf', disableAutoFetch: true }));
  expect(HTMLCanvasElement.prototype.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.82);
  expect(task.destroy).toHaveBeenCalledTimes(1);
});

it('converts the uploaded PDF bytes to the configured JPEG cover file', async () => {
  const { task } = fixture();
  const { generateRevueCoverFromPdf } = await import('../lib/revueCoverGenerator');
  const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
  const result = await generateRevueCoverFromPdf(new File([bytes], 'revue.pdf', { type: 'application/pdf' }));
  expect(result).toBeInstanceOf(File);
  expect(result.name).toBe('extrait_revue_cover.jpg');
  expect(result.type).toBe('image/jpeg');
  expect(result.size).toBe(5);
  expect(getDocument).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ data: bytes, disableAutoFetch: true }));
  expect(HTMLCanvasElement.prototype.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.84);
  expect(task.destroy).toHaveBeenCalledTimes(1);
});

describe('shared public cover ownership', () => {
  it('keeps the render alive for another consumer and stops it after the last cancellation', async () => {
    const destroy = vi.fn().mockResolvedValue(undefined);
    vi.mocked(getDocument).mockReturnValue({ promise: new Promise(() => {}), destroy } as unknown as ReturnType<typeof getDocument>);
    const { prefetchPdfCover } = await import('../lib/pdfCoverCache');
    const first = new AbortController(); const second = new AbortController();
    const a = prefetchPdfCover('/shared.pdf', first.signal);
    const b = prefetchPdfCover('/shared.pdf', second.signal);
    const rejectedA = expect(a).rejects.toMatchObject({ name: 'AbortError' });
    const rejectedB = expect(b).rejects.toMatchObject({ name: 'AbortError' });
    await vi.waitFor(() => expect(getDocument).toHaveBeenCalledTimes(1));
    first.abort(); await rejectedA;
    expect(destroy).not.toHaveBeenCalled();
    expect(getDocument).toHaveBeenCalledTimes(1);
    second.abort(); await rejectedB;
    await vi.waitFor(() => expect(destroy).toHaveBeenCalledTimes(1));
  });
});

it('bounds asynchronous encoding and destroys a task even when its own destroy never settles', async () => {
  const terminate = vi.fn();
  vi.stubGlobal('Worker', class { terminate = terminate; });
  const { renderPdfCover } = await import('../lib/pdf-cover-renderer');
  const { task, encode } = {
    task: {
      promise: Promise.resolve({ getPage: async () => ({
        getViewport: ({ scale }: { scale: number }) => ({ width: 600 * scale, height: 800 * scale }),
        render: () => ({ promise: Promise.resolve(), cancel: vi.fn() }),
      }) }),
      destroy: vi.fn(() => new Promise<void>(() => {})),
    },
    encode: vi.fn(() => new Promise<string>(() => {})),
  };
  vi.useFakeTimers();
  const pending = renderPdfCover(() => task as unknown as ReturnType<typeof getDocument>, 460, encode);
  const rejected = expect(pending).rejects.toThrow('prend trop de temps');
  await vi.advanceTimersByTimeAsync(15_001);
  await rejected;
  expect(encode).toHaveBeenCalledTimes(1);
  expect(task.destroy).toHaveBeenCalledTimes(1);
  expect(terminate).toHaveBeenCalledTimes(1);
});

it('destroys a loading task delivered after cancellation without rendering or encoding', async () => {
  const { renderPdfCover } = await import('../lib/pdf-cover-renderer');
  let deliver!: (task: ReturnType<typeof getDocument>) => void;
  const late = new Promise<ReturnType<typeof getDocument>>(resolve => { deliver = resolve; });
  const controller = new AbortController();
  const encode = vi.fn();
  const load = vi.fn(() => late);
  const pending = renderPdfCover(load, 460, encode, controller.signal);
  await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(1));
  controller.abort();
  await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  const destroy = vi.fn().mockResolvedValue(undefined);
  deliver({ promise: new Promise(() => {}), destroy } as unknown as ReturnType<typeof getDocument>);
  await vi.waitFor(() => expect(destroy).toHaveBeenCalledTimes(1));
  expect(encode).not.toHaveBeenCalled();
});

it('routes every PDF viewport/render operation through the bounded renderer', async () => {
  const { readdirSync, readFileSync } = await import('node:fs');
  const { join } = await import('node:path');
  const users: string[] = [];
  function walk(root: string) {
    for (const entry of readdirSync(root, { withFileTypes: true })) {
      const path = join(root, entry.name);
      if (entry.isDirectory()) {
        if (!['tests', 'test'].includes(entry.name)) walk(path);
      } else if (/\.tsx?$/.test(path) && /\.getViewport\(|page\.render\(/.test(readFileSync(path, 'utf8'))) users.push(path);
    }
  }
  walk('src');
  expect(users).toEqual(['src/lib/pdf-cover-renderer.ts']);
});


it('enforces pixel area independently of the per-side dimension limit', async () => {
  const { renderPdfCover } = await import('../lib/pdf-cover-renderer');
  let area = 0;
  const task = {
    promise: Promise.resolve({ getPage: async () => ({
      getViewport: ({ scale }: { scale: number }) => ({ width: 10_000 * scale, height: 10_000 * scale }),
      render: ({ canvas }: { canvas: HTMLCanvasElement }) => {
        area = canvas.width * canvas.height;
        return { promise: Promise.resolve(), cancel: vi.fn() };
      },
    }) }), destroy: vi.fn().mockResolvedValue(undefined),
  };
  await renderPdfCover(() => task as unknown as ReturnType<typeof getDocument>, 2048, () => 'encoded');
  expect(area).toBeGreaterThan(1_900_000);
  expect(area).toBeLessThanOrEqual(2_000_000);
});
