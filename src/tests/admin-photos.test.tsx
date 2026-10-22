import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminPhotos from '../pages/admin/AdminPhotos';
import { apiListPhotos, apiUploadPhoto } from '../lib/admin-api';
import { compressPhoto, PHOTO_UPLOAD_LIMIT_BYTES } from '../lib/photo-compression';
import { toast } from '../hooks/use-toast';

vi.mock('../lib/admin-api', () => ({
  apiListPhotos: vi.fn(),
  apiUploadPhoto: vi.fn(),
  apiDeletePhoto: vi.fn(),
}));
vi.mock('../lib/photo-compression', async (importOriginal) => ({
  ...await importOriginal<typeof import('../lib/photo-compression')>(),
  compressPhoto: vi.fn(),
}));
vi.mock('../hooks/use-toast', () => ({ toast: vi.fn() }));

function photo(name: string, large = false): File {
  const file = new File(['photo'], name, { type: 'image/jpeg' });
  if (large) Object.defineProperty(file, 'size', { value: PHOTO_UPLOAD_LIMIT_BYTES + 1 });
  return file;
}

function selectPhotos(files: File[]) {
  const view = render(<AdminPhotos />);
  const input = view.container.querySelector('input[type="file"]');
  expect(input).not.toBeNull();
  fireEvent.change(input!, { target: { files } });
  return view;
}

describe('photo uploads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiListPhotos).mockResolvedValue({ ok: true, data: [] });
    vi.mocked(apiUploadPhoto).mockResolvedValue({ ok: true });
    vi.mocked(compressPhoto).mockImplementation(async (file) => file);
  });

  it('requires confirmation before compressing or uploading a mixed batch', async () => {
    const small = photo('small.jpg');
    const large = photo('large.jpg', true);
    const compressed = photo('compressed.jpg');
    vi.mocked(compressPhoto).mockImplementation(async (file) => file === large ? compressed : file);
    selectPhotos([small, large]);

    expect(await screen.findByRole('alertdialog')).toHaveTextContent('Les photos trop volumineuses seront réduites automatiquement pour pouvoir être envoyées.');
    expect(screen.getByRole('alertdialog')).not.toHaveTextContent(/JPEG|originaux|Mo/);
    expect(compressPhoto).not.toHaveBeenCalled();
    expect(apiUploadPhoto).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Réduire et envoyer' }));

    await waitFor(() => expect(apiUploadPhoto).toHaveBeenCalledTimes(2));
    const year = new Date().getFullYear().toString();
    expect(apiUploadPhoto).toHaveBeenNthCalledWith(1, small, year);
    expect(apiUploadPhoto).toHaveBeenNthCalledWith(2, compressed, year);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Téléverser des photos' })).toBeEnabled());
  });

  it('cancels without compression or network writes', async () => {
    selectPhotos([photo('large.jpg', true)]);
    await userEvent.click(await screen.findByRole('button', { name: 'Annuler' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(compressPhoto).not.toHaveBeenCalled();
    expect(apiUploadPhoto).not.toHaveBeenCalled();
    expect(screen.getByRole('combobox')).toBeEnabled();
  });

  it('uploads small photos without a compression popup', async () => {
    const small = photo('small.jpg');
    selectPhotos([small]);
    await waitFor(() => expect(apiUploadPhoto).toHaveBeenCalledWith(small, expect.any(String)));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('continues after corrupt photos and upload errors, and restores the controls', async () => {
    vi.mocked(compressPhoto).mockRejectedValueOnce(new Error('decode failed')).mockResolvedValue(photo('prepared.jpg'));
    vi.mocked(apiUploadPhoto).mockResolvedValueOnce({ ok: false, error: 'network' }).mockResolvedValue({ ok: true });
    selectPhotos([photo('corrupt.jpg', true), photo('network.jpg'), photo('ok.jpg')]);
    await userEvent.click(await screen.findByRole('button', { name: 'Réduire et envoyer' }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({
      description: '1 réussie(s), 2 échouée(s) : corrupt.jpg, network.jpg',
    })));
    expect(apiUploadPhoto).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('button', { name: 'Téléverser des photos' })).toBeEnabled();
    expect(screen.getByRole('combobox')).toBeEnabled();
  });

  it('rejects unsupported HEIC before any compression or upload', async () => {
    selectPhotos([new File(['heic'], 'photo.heic', { type: 'image/heic' })]);
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' })));
    expect(compressPhoto).not.toHaveBeenCalled();
    expect(apiUploadPhoto).not.toHaveBeenCalled();
  });

  it('processes 180 photos sequentially with one upload per file and no retry loop', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    let releaseUpload: () => void = () => {};
    const firstUpload = new Promise<void>((resolve) => { releaseUpload = resolve; });
    vi.mocked(apiUploadPhoto).mockImplementation(async () => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await (vi.mocked(apiUploadPhoto).mock.calls.length === 1 ? firstUpload : Promise.resolve());
      inFlight--;
      return { ok: true };
    });
    vi.mocked(compressPhoto).mockImplementation(async (file) => {
      expect(inFlight).toBe(0);
      return file;
    });
    selectPhotos(Array.from({ length: 180 }, (_, i) => photo(`${i}.jpg`, true)));
    fireEvent.click(screen.getByRole('button', { name: 'Réduire et envoyer' }));
    await waitFor(() => expect(apiUploadPhoto).toHaveBeenCalledTimes(1));
    expect(compressPhoto).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('combobox')).toBeDisabled();
    await act(async () => { releaseUpload(); });
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({
      description: '180 photo(s) téléversée(s) avec succès',
    })), { timeout: 5000 });
    expect(maxInFlight).toBe(1);
    expect(compressPhoto).toHaveBeenCalledTimes(180);
    expect(apiUploadPhoto).toHaveBeenCalledTimes(180);
  });
});
