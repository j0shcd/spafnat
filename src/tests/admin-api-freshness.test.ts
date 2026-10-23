import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiListConcours, apiListDelegations, apiListDocuments, apiListPhotos } from '../lib/admin-api';

beforeEach(() => {
  localStorage.setItem('spaf_admin_token', 'fixture-token');
  vi.stubGlobal('fetch', vi.fn());
});
afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe('admin list freshness at the request boundary', () => {
  it.each([
    ['documents', () => apiListDocuments(), { files: [], count: 0 }],
    ['photos', () => apiListPhotos('2026'), { photos: [], count: 0, year: '2026' }],
    ['concours', () => apiListConcours('all'), { reglements: [], resultats: [], palmares: [] }],
    ['delegations', () => apiListDelegations(), { delegations: [] }],
  ] as const)('bypasses cached %s metadata on every read', async (_name, read, body) => {
    vi.mocked(fetch).mockImplementation(async () => Response.json(body));
    expect((await read()).ok).toBe(true);
    expect((await read()).ok).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(2);
    for (const [, options] of vi.mocked(fetch).mock.calls) {
      expect(options?.cache).toBe('no-store');
      expect(new Headers(options?.headers).get('Authorization')).toBe('Bearer fixture-token');
    }
  });
});
