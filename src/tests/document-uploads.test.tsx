import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminDocuments from '../pages/admin/AdminDocuments';
import AdminConcours from '../pages/admin/AdminConcours';
import * as api from '../lib/admin-api';
import { compressPdf, PDF_UPLOAD_LIMIT_BYTES } from '../lib/pdf-compression';
import { generateRevueCoverFromPdf } from '../lib/revueCoverGenerator';
import { toast } from '../hooks/use-toast';

vi.mock('../lib/admin-api', () => ({
  apiListDocuments: vi.fn(), apiUploadDocument: vi.fn(), apiDeleteDocument: vi.fn(),
  apiListConcours: vi.fn(), apiUploadConcours: vi.fn(), apiDeleteConcours: vi.fn(), apiReorderConcours: vi.fn(),
}));
vi.mock('../lib/pdf-compression', async (original) => ({
  ...await original<typeof import('../lib/pdf-compression')>(), compressPdf: vi.fn(),
}));
vi.mock('../lib/revueCoverGenerator', () => ({ generateRevueCoverFromPdf: vi.fn() }));
vi.mock('../hooks/use-toast', () => ({ toast: vi.fn() }));

function pdf(large = true): File {
  const file = new File(['%PDF-1.7'], 'large.pdf', { type: 'application/pdf' });
  if (large) Object.defineProperty(file, 'size', { value: PDF_UPLOAD_LIMIT_BYTES + 1 });
  return file;
}

describe('document compression before upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.apiListDocuments).mockResolvedValue({ ok: true, data: [] });
    vi.mocked(api.apiListConcours).mockResolvedValue({ ok: true, data: {
      reglements: [], 'palmares-poetique': [], 'palmares-artistique': [],
    } });
    vi.mocked(api.apiUploadDocument).mockResolvedValue({ ok: true });
    vi.mocked(api.apiUploadConcours).mockResolvedValue({ ok: true });
    vi.mocked(compressPdf).mockImplementation(async (file) => file);
  });

  for (const kind of ['documents', 'concours'] as const) {
    const label = kind === 'documents' ? "Document : Bulletin d'adhésion" : 'PDF : Règlements';
    const upload = () => kind === 'documents' ? api.apiUploadDocument : api.apiUploadConcours;
    const open = async (file: File) => {
      const view = render(kind === 'documents' ? <AdminDocuments /> : <AdminConcours />);
      const input = await screen.findByLabelText(label);
      fireEvent.change(input, { target: { files: [file] } });
      return view;
    };

    it(`${kind}: cancels large files without compression, preview generation or upload`, async () => {
      await open(pdf());
      expect(await screen.findByRole('alertdialog')).toHaveTextContent('Le site va essayer de le réduire.');
      expect(compressPdf).not.toHaveBeenCalled();
      expect(upload()).not.toHaveBeenCalled();
      await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));
      expect(compressPdf).not.toHaveBeenCalled();
      expect(generateRevueCoverFromPdf).not.toHaveBeenCalled();
      expect(screen.getByLabelText(label)).toBeEnabled();
    });

    it(`${kind}: sends the compressed file only after confirmation`, async () => {
      const large = pdf(); const small = pdf(false);
      vi.mocked(compressPdf).mockResolvedValue(small);
      await open(large);
      expect(upload()).not.toHaveBeenCalled();
      await userEvent.click(await screen.findByRole('button', { name: 'Réduire et envoyer' }));
      await waitFor(() => expect(upload()).toHaveBeenCalled());
      expect(vi.mocked(upload()).mock.calls[0][0]).toBe(small);
      expect(compressPdf).toHaveBeenCalledWith(large, expect.any(AbortSignal));
    });

    it(`${kind}: refuses compression failures and restores the upload control`, async () => {
      vi.mocked(compressPdf).mockRejectedValue(new Error('Le document reste trop volumineux.'));
      await open(pdf());
      await userEvent.click(await screen.findByRole('button', { name: 'Réduire et envoyer' }));
      await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({
        description: 'Le document reste trop volumineux.', variant: 'destructive',
      })));
      expect(upload()).not.toHaveBeenCalled();
      expect(screen.getByLabelText(label)).toBeEnabled();
    });

    it(`${kind}: uploads small PDFs without asking to reduce them`, async () => {
      const small = pdf(false); await open(small);
      await waitFor(() => expect(upload()).toHaveBeenCalled());
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(vi.mocked(upload()).mock.calls[0][0]).toBe(small);
    });

    it(`${kind}: cancels compression when leaving the page`, async () => {
      let signal: AbortSignal | undefined;
      vi.mocked(compressPdf).mockImplementation((_file, nextSignal) => {
        signal = nextSignal;
        return new Promise((_resolve, reject) => nextSignal?.addEventListener('abort', () =>
          reject(new DOMException('Cancelled', 'AbortError')), { once: true }));
      });
      const view = await open(pdf());
      await userEvent.click(await screen.findByRole('button', { name: 'Réduire et envoyer' }));
      expect(signal?.aborted).toBe(false);
      view.unmount();
      expect(signal?.aborted).toBe(true);
      expect(upload()).not.toHaveBeenCalled();
    });
  }

  it('generates the revue cover from the same compressed PDF that is uploaded', async () => {
    const large = pdf(); const small = pdf(false);
    const cover = new File(['jpeg'], 'cover.jpg', { type: 'image/jpeg' });
    vi.mocked(compressPdf).mockResolvedValue(small);
    vi.mocked(generateRevueCoverFromPdf).mockResolvedValue(cover);
    render(<AdminDocuments />);
    fireEvent.change(await screen.findByLabelText('Document : Extrait de la Revue'), { target: { files: [large] } });
    await userEvent.click(await screen.findByRole('button', { name: 'Réduire et envoyer' }));
    await waitFor(() => expect(api.apiUploadDocument).toHaveBeenCalledWith(small, 'extrait_revue.pdf', { coverFile: cover }));
    expect(generateRevueCoverFromPdf).toHaveBeenCalledWith(small);
  });
});
