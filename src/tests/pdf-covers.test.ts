import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDocument } from 'pdfjs-dist';

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(),
}));

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,fixture');
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(callback => callback(new Blob(['cover'])));
});

describe.each(['public preview', 'admin upload'] as const)('%s PDF worker lifecycle', (flow) => {
  async function render() {
    if (flow === 'public preview') {
      const { prefetchPdfCover } = await import('../lib/pdfCoverCache');
      return prefetchPdfCover('/api/media/documents/extrait_revue.pdf');
    }
    const { generateRevueCoverFromPdf } = await import('../lib/revueCoverGenerator');
    return generateRevueCoverFromPdf(new File(['%PDF-fixture'], 'revue.pdf', { type: 'application/pdf' }));
  }

  function documentTask(failure?: 'load' | 'render') {
    const error = new Error('PDF fixture failed');
    const page = {
      getViewport: () => ({ width: 600, height: 800 }),
      render: () => ({ promise: failure === 'render' ? Promise.reject(error) : Promise.resolve() }),
    };
    // PDF.js 6 owns destroy() on the loading task, never on the document proxy.
    const task = {
      promise: failure === 'load' ? Promise.reject(error) : Promise.resolve({ getPage: async () => page }),
      destroy: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(getDocument).mockReturnValue(task as unknown as ReturnType<typeof getDocument>);
    return task;
  }

  it('releases the loading task after rendering a cover', async () => {
    const task = documentTask();
    await expect(render()).resolves.toBeDefined();
    expect(task.destroy).toHaveBeenCalledTimes(1);
  });

  it.each(['load', 'render'] as const)('releases the loading task after a %s failure', async failure => {
    const task = documentTask(failure);
    await expect(render()).rejects.toThrow('PDF fixture failed');
    expect(task.destroy).toHaveBeenCalledTimes(1);
  });
});
