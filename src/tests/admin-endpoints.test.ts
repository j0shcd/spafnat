import { beforeEach, describe, expect, it, vi } from 'vitest';
import { onRequestPost as uploadHandler } from '../../functions/api/admin/upload';
import { onRequestGet as mediaGetHandler } from '../../functions/api/media/[[path]]';

type UploadHandlerContext = Parameters<typeof uploadHandler>[0];
type MediaGetHandlerContext = Parameters<typeof mediaGetHandler>[0];

function createPdfFile(filename: string): File {
  const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]); // %PDF-1.7
  return new File([pdfBytes], filename, { type: 'application/pdf' });
}

function createJpegFile(filename: string): File {
  const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
  return new File([jpegBytes], filename, { type: 'image/jpeg' });
}

function createUploadRequest(file: File, type: 'document' | 'photo', key: string): Request {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  formData.append('key', key);

  return new Request('http://localhost/api/admin/upload', {
    method: 'POST',
    body: formData,
  });
}

describe('Admin Endpoint Security', () => {
  let env: {
    SPAF_MEDIA: {
      head: ReturnType<typeof vi.fn>;
      put: ReturnType<typeof vi.fn>;
      get: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    env = {
      SPAF_MEDIA: {
        head: vi.fn().mockResolvedValue(null),
        put: vi.fn().mockResolvedValue(undefined),
        get: vi.fn().mockResolvedValue(null),
      },
    };
  });

  it('rejects non-whitelisted document filenames during upload', async () => {
    const request = createUploadRequest(createPdfFile('evil.pdf'), 'document', '../../evil.pdf');
    const response = await uploadHandler({ request, env } as unknown as UploadHandlerContext);

    expect(response.status).toBe(400);
    expect(env.SPAF_MEDIA.put).not.toHaveBeenCalled();
  });

  it('rejects invalid photo years during upload', async () => {
    const request = createUploadRequest(createJpegFile('photo.jpg'), 'photo', '2009');
    const response = await uploadHandler({ request, env } as unknown as UploadHandlerContext);

    expect(response.status).toBe(400);
    expect(env.SPAF_MEDIA.put).not.toHaveBeenCalled();
  });

  it('blocks public media access outside allowed prefixes', async () => {
    const response = await mediaGetHandler({
      env,
      params: { path: ['private', 'backup.zip'] },
    } as unknown as MediaGetHandlerContext);

    expect(response.status).toBe(403);
    expect(env.SPAF_MEDIA.get).not.toHaveBeenCalled();
  });

  it('blocks path traversal attempts on media endpoint', async () => {
    const response = await mediaGetHandler({
      env,
      params: { path: ['documents', '..', 'secret.txt'] },
    } as unknown as MediaGetHandlerContext);

    expect(response.status).toBe(400);
    expect(env.SPAF_MEDIA.get).not.toHaveBeenCalled();
  });

  it('allows safe public prefixes to reach storage lookup', async () => {
    const response = await mediaGetHandler({
      env,
      params: { path: ['documents', 'bulletin_adhesion.pdf'] },
    } as unknown as MediaGetHandlerContext);

    expect(response.status).toBe(404);
    expect(env.SPAF_MEDIA.get).toHaveBeenCalledWith('documents/bulletin_adhesion.pdf');
  });

  it('returns encoded filename metadata and no-store cache for mutable PDFs', async () => {
    env.SPAF_MEDIA.get.mockResolvedValueOnce({
      body: null,
      size: 128,
      uploaded: new Date('2026-02-17T10:00:00.000Z'),
      httpMetadata: { contentType: 'application/pdf' },
      customMetadata: {
        originalFilename: 'appel à poètes.pdf',
        uploadedAt: '2026-02-17T10:00:00.000Z',
      },
    });

    const response = await mediaGetHandler({
      env,
      params: { path: ['documents', 'extrait_revue.pdf'] },
    } as unknown as MediaGetHandlerContext);

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    expect(decodeURIComponent(response.headers.get('X-Original-Filename-Encoded') || '')).toBe('appel à poètes.pdf');
    expect(response.headers.get('X-Uploaded-At')).toBe('2026-02-17T10:00:00.000Z');
  });

  it('keeps long-lived cache for congress photos', async () => {
    env.SPAF_MEDIA.get.mockResolvedValueOnce({
      body: null,
      size: 128,
      uploaded: new Date('2026-02-17T10:00:00.000Z'),
      httpMetadata: { contentType: 'image/jpeg' },
      customMetadata: {
        originalFilename: 'photo_2026.jpg',
        uploadedAt: '2026-02-17T10:00:00.000Z',
      },
    });

    const response = await mediaGetHandler({
      env,
      params: { path: ['congres', '2026', 'photo_1.jpg'] },
    } as unknown as MediaGetHandlerContext);

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=86400');
  });
});
