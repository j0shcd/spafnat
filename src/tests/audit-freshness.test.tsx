import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDocumentUrlCacheForTests, useDocumentUrl } from '../hooks/useDocumentUrl';
import { useConcours } from '../hooks/useConcours';
import { fetchGalleryYear, getCachedGalleryYear, invalidateGalleryYear, resetGalleryPrefetchCachesForTests } from '../lib/galleryPrefetch';
import AdminPhotos from '../pages/admin/AdminPhotos';
import { apiListPhotos } from '../lib/admin-api';
import type { ReactNode } from 'react';

vi.mock('../lib/admin-api', () => ({ apiListPhotos: vi.fn(), apiUploadPhoto: vi.fn(), apiDeletePhoto: vi.fn() }));
// Native select keeps this response-order regression independent of portal/pointer mechanics.
vi.mock('../components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: { value: string; onValueChange: (value: string) => void; children: ReactNode }) => <select aria-label="year" value={value} onChange={e => onValueChange(e.target.value)}>{children}</select>,
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectItem: ({ children, value }: { children: ReactNode; value: string }) => <option value={value}>{children}</option>,
  SelectTrigger: () => null,
  SelectValue: () => null,
}));

beforeEach(() => {
  vi.clearAllMocks(); resetDocumentUrlCacheForTests(); resetGalleryPrefetchCachesForTests();
  vi.stubGlobal('fetch', vi.fn());
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const galleryResult = (name: string) => ({ photos: [{ key: name }], count: 1, year: '2026' });

describe('fresh metadata and response ownership', () => {
  it('rechecks a newly replaced document on focus inside the cache window', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { headers: { 'X-Original-Filename': 'old.pdf', 'X-Uploaded-At': 'old' } }))
      .mockResolvedValueOnce(new Response(null, { headers: { 'X-Original-Filename': 'new.pdf', 'X-Uploaded-At': 'new' } }));
    const { result } = renderHook(() => useDocumentUrl('extraitRevue'));
    await waitFor(() => expect(result.current.originalFilename).toBe('old.pdf'));
    act(() => { window.dispatchEvent(new Event('focus')); });
    await waitFor(() => expect(result.current.originalFilename).toBe('new.pdf'));
    expect(result.current.url).toContain('v=new');
  });
  it('revalidates concours on focus without accepting the browser HTTP cache', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({ reglements: [{ title: 'old' }] }))
      .mockResolvedValueOnce(Response.json({ reglements: [{ title: 'new' }] }));
    const { result } = renderHook(() => useConcours());
    await waitFor(() => expect(result.current.data?.reglements[0].title).toBe('old'));
    act(() => { window.dispatchEvent(new Event('focus')); });
    await waitFor(() => expect(result.current.data?.reglements[0].title).toBe('new'));
    expect(fetch).toHaveBeenLastCalledWith('/api/concours?category=all', { cache: 'no-store' });
  });
  it('expires gallery metadata and fetches the current list', async () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(1000);
    vi.mocked(fetch).mockResolvedValueOnce(Response.json(galleryResult('old'))).mockResolvedValueOnce(Response.json(galleryResult('new')));
    expect((await fetchGalleryYear(2026))?.photos[0].key).toBe('old');
    now.mockReturnValue(62_000);
    expect(getCachedGalleryYear(2026)).toBeNull();
    expect((await fetchGalleryYear(2026))?.photos[0].key).toBe('new');
  });
  it('cannot restore an invalidated gallery cache with a late response', async () => {
    let release!: (response: Response) => void;
    vi.mocked(fetch).mockReturnValueOnce(new Promise<Response>(resolve => { release = resolve; })).mockResolvedValueOnce(Response.json(galleryResult('new')));
    const old = fetchGalleryYear(2026); invalidateGalleryYear(2026);
    expect((await fetchGalleryYear(2026))?.photos[0].key).toBe('new');
    release(Response.json(galleryResult('old'))); await old;
    expect(getCachedGalleryYear(2026)?.photos[0].key).toBe('new');
  });
  it('discards a previous year response after the selected year changes', async () => {
    let release!: (response: Awaited<ReturnType<typeof apiListPhotos>>) => void;
    vi.mocked(apiListPhotos).mockReturnValueOnce(new Promise(resolve => { release = resolve; }))
      .mockResolvedValue({ ok: true, data: [{ key: 'congres/2025/new.jpg', url: '/new.jpg', size: 1, lastModified: '' }] });
    render(<AdminPhotos />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '2025' } });
    await screen.findByAltText('congres/2025/new.jpg');
    await act(async () => { release({ ok: true, data: [{ key: 'congres/2026/old.jpg', url: '/old.jpg', size: 1, lastModified: '' }] }); });
    expect(screen.getByAltText('congres/2025/new.jpg')).toBeInTheDocument();
    expect(screen.queryByAltText('congres/2026/old.jpg')).not.toBeInTheDocument();
  });
});
