// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { onRequestPost as upload } from '../../functions/api/admin/upload';
import { onRequestPost as concoursUpload } from '../../functions/api/admin/concours/upload';
import { onRequestPost as concoursDelete } from '../../functions/api/admin/concours/delete';
import { onRequestPost as concoursReorder } from '../../functions/api/admin/concours/reorder';
import { onRequestGet as concours } from '../../functions/api/concours';
import { onRequestGet as media, onRequestHead as mediaHead } from '../../functions/api/media/[[path]]';
import { onRequestGet as gallery } from '../../functions/api/gallery';
import { onRequestGet as files } from '../../functions/api/admin/files';
import { onRequestGet as years } from '../../functions/api/gallery/years';
import { parseJsonBodyWithLimit } from '../../functions/lib/helpers';
import { listR2Objects } from '../../functions/lib/r2';
import type { Env } from '../../functions/env';

type Handler = typeof upload;
function context(request: Request, env: unknown, params = {}): Parameters<Handler>[0] {
  return { request, env: env as Env, params } as Parameters<Handler>[0];
}
const pdf = (size = 8) => {
  const bytes = new Uint8Array(size); bytes.set([0x25, 0x50, 0x44, 0x46]);
  return new File([bytes], 'document.pdf', { type: 'application/pdf' });
};
const jpeg = () => new File([new Uint8Array([0xff, 0xd8, 0xff])], 'photo.jpg', { type: 'image/jpeg' });
function formRequest(file: File, type: string, key: string, cover?: File): Request {
  const body = new FormData(); body.set('file', file); body.set('type', type); body.set('key', key);
  if (cover) body.set('cover', cover);
  return new Request('https://spafnat.com/api/admin/upload', { method: 'POST', body });
}
function jsonRequest(body: unknown): Request {
  return new Request('https://spafnat.com/api/admin/concours', { method: 'POST', body: JSON.stringify(body) });
}
const item = { r2Key: 'concours/reglements/new.pdf' };
let env: { SPAF_MEDIA: Record<string, ReturnType<typeof vi.fn>>; SPAF_KV: Record<string, ReturnType<typeof vi.fn>> };
beforeEach(() => {
  env = {
    SPAF_MEDIA: { put: vi.fn().mockResolvedValue({}), head: vi.fn().mockResolvedValue(null), delete: vi.fn().mockResolvedValue(undefined), get: vi.fn(), list: vi.fn() },
    SPAF_KV: { get: vi.fn().mockResolvedValue([item]), put: vi.fn().mockResolvedValue(undefined), delete: vi.fn() },
  };
});

describe('request and upload boundaries', () => {
  it('cancels a headerless oversized body before consuming the rest', async () => {
    let reads = 0; const cancel = vi.fn();
    const body = new ReadableStream({ pull(controller) { reads++; controller.enqueue(new Uint8Array(512)); if (reads === 20) controller.close(); }, cancel }, { highWaterMark: 0 });
    const request = new Request('https://spafnat.com/api/contact', { method: 'POST', body, duplex: 'half' } as RequestInit);
    const result = await parseJsonBodyWithLimit(request, 1024);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(413);
    expect(reads).toBe(3); expect(cancel).toHaveBeenCalled();
  });
  it.each(['document', 'photo'])('rejects valid files in the wrong %s destination', async (type) => {
    const request = formRequest(type === 'document' ? jpeg() : pdf(), type, type === 'document' ? 'bulletin_adhesion.pdf' : '2026');
    expect((await upload(context(request, env))).status).toBe(400);
    expect(env.SPAF_MEDIA.put).not.toHaveBeenCalled();
  });
  it('accepts a full 5 MiB PDF plus a cover and multipart overhead', async () => {
    const request = formRequest(pdf(5 * 1024 * 1024), 'document', 'extrait_revue.pdf', jpeg());
    request.headers.set('Content-Length', String((await request.clone().arrayBuffer()).byteLength));
    const response = await upload(context(request, env));
    expect(response.status).toBe(200); expect(env.SPAF_MEDIA.put).toHaveBeenCalledTimes(2);
    const metadata = env.SPAF_MEDIA.put.mock.calls[0][2].customMetadata;
    expect(env.SPAF_MEDIA.put.mock.calls[1][2].customMetadata.sourcePdfVersion).toBe(metadata.uploadVersion);
  });
  it('removes the obsolete cover when uploading a revue without one', async () => {
    expect((await upload(context(formRequest(pdf(), 'document', 'extrait_revue.pdf'), env))).status).toBe(200);
    expect(env.SPAF_MEDIA.delete).toHaveBeenCalledWith('documents/extrait_revue_cover.jpg');
    expect(env.SPAF_MEDIA.delete.mock.invocationCallOrder[0]).toBeLessThan(env.SPAF_MEDIA.put.mock.invocationCallOrder[0]);
  });
  it('keeps simultaneous photo uploads with the same filename distinct', async () => {
    const keys = new Set<string>();
    env.SPAF_MEDIA.put.mockImplementation(async (key: string, _body: unknown, options: R2PutOptions) => {
      expect(options.onlyIf).toEqual({ etagDoesNotMatch: '*' });
      if (keys.has(key)) return null;
      keys.add(key); return {};
    });
    const responses = await Promise.all([1, 2].map(() => upload(context(formRequest(jpeg(), 'photo', '2026'), env))));
    expect(responses.map(r => r.status)).toEqual([200, 200]);
    const bodies = await Promise.all(responses.map(r => r.json()));
    expect(bodies[0].r2Key).not.toBe(bodies[1].r2Key); expect(keys.size).toBe(2);
  });
  it('accepts a full 5 MiB concours PDF', async () => {
    const body = new FormData(); body.set('file', pdf(5 * 1024 * 1024)); body.set('category', 'reglements');
    const request = new Request('https://spafnat.com/api/admin/concours/upload', { method: 'POST', body });
    request.headers.set('Content-Length', String((await request.clone().arrayBuffer()).byteLength));
    expect((await concoursUpload(context(request, env))).status).toBe(200);
  });
});

describe('concours canonical state', () => {
  it('ignores obsolete aggregate data and performs no writes on public reads', async () => {
    env.SPAF_KV.get.mockImplementation(async (key: string) => key === 'concours:all' ? { reglements: [{ r2Key: 'old.pdf' }] } : key === 'concours:reglements' ? [item] : []);
    const response = await concours(context(new Request('https://spafnat.com/api/concours?category=all'), env));
    expect((await response.json()).reglements).toEqual([item]);
    expect(env.SPAF_KV.put).not.toHaveBeenCalled(); expect(env.SPAF_KV.get).toHaveBeenCalledTimes(3);
  });
  it('keeps metadata available for retry when R2 deletion fails', async () => {
    env.SPAF_MEDIA.delete.mockRejectedValue(new Error('storage unavailable'));
    expect((await concoursDelete(context(jsonRequest({ category: 'reglements', r2Key: item.r2Key }), env))).status).toBe(500);
    expect(env.SPAF_KV.put).not.toHaveBeenCalled();
  });
  it.each(['constructor', '__proto__', 'toString'])('rejects inherited category %s at every endpoint', async (category) => {
    const body = new FormData(); body.set('file', pdf()); body.set('category', category);
    const responses = await Promise.all([
      concours(context(new Request(`https://spafnat.com/api/concours?category=${category}`), env)),
      concoursDelete(context(jsonRequest({ category, r2Key: `concours/${category}/x.pdf` }), env)),
      concoursReorder(context(jsonRequest({ category, r2Key: item.r2Key, direction: 'up' }), env)),
      concoursUpload(context(new Request('https://spafnat.com/api/admin/concours/upload', { method: 'POST', body }), env)),
    ]);
    expect(responses.map(r => r.status)).toEqual([400, 400, 400, 400]);
    expect(env.SPAF_KV.put).not.toHaveBeenCalled(); expect(env.SPAF_MEDIA.put).not.toHaveBeenCalled();
  });
});

describe('revue cover relationship', () => {
  it.each([media, mediaHead])('withholds a cover from a previous PDF version', async (handler) => {
    const cover = { body: null, size: 3, customMetadata: { sourcePdfVersion: 'old' } };
    env.SPAF_MEDIA.get.mockResolvedValue(cover);
    env.SPAF_MEDIA.head.mockImplementation(async (key: string) => key.endsWith('.jpg') ? cover : { customMetadata: { uploadVersion: 'new' } });
    expect((await handler(context(new Request('https://spafnat.com/api/media/documents/extrait_revue_cover.jpg'), env, { path: ['documents', 'extrait_revue_cover.jpg'] }))).status).toBe(404);
  });
  it('serves a matching cover without caching an obsolete issue image', async () => {
    env.SPAF_MEDIA.get.mockResolvedValue({ body: null, size: 3, customMetadata: { sourcePdfVersion: 'new' }, httpMetadata: { contentType: 'image/jpeg' } });
    env.SPAF_MEDIA.head.mockResolvedValue({ customMetadata: { uploadVersion: 'new' } });
    const response = await media(context(new Request('https://spafnat.com/api/media/documents/extrait_revue_cover.jpg'), env, { path: ['documents', 'extrait_revue_cover.jpg'] }));
    expect(response.status).toBe(200); expect(response.headers.get('Cache-Control')).toContain('no-store');
  });
});

describe('R2 complete listings', () => {
  it.each([gallery, files, years])('includes a second page in each listing endpoint', async (handler) => {
    const object = (key: string) => ({ key, size: 1, uploaded: new Date(), customMetadata: { originalFilename: 'archive.jpg' } });
    env.SPAF_MEDIA.list.mockResolvedValueOnce({ objects: [object('congres/2025/one.jpg')], delimitedPrefixes: ['congres/2025/'], truncated: true, cursor: 'next' })
      .mockResolvedValueOnce({ objects: [object('congres/2026/two.jpg')], delimitedPrefixes: ['congres/2026/'], truncated: false });
    const response = await handler(context(new Request('https://spafnat.com/api/gallery?year=2026&type=photos'), env));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.years ?? data.photos ?? data.files).toHaveLength(2);
    expect(env.SPAF_MEDIA.list.mock.calls[1][0].cursor).toBe('next'); expect(env.SPAF_MEDIA.head).not.toHaveBeenCalled();
  });
  it('fails visibly if a cursor stalls instead of looping or silently truncating', async () => {
    env.SPAF_MEDIA.list.mockResolvedValue({ objects: [], truncated: true, cursor: 'same' });
    await expect(listR2Objects(env.SPAF_MEDIA as unknown as R2Bucket, {})).rejects.toThrow('cursor');
    expect(env.SPAF_MEDIA.list).toHaveBeenCalledTimes(2);
  });
});
