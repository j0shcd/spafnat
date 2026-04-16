export interface GalleryPhoto {
  key: string;
  filename: string;
  url: string;
  lastModified: string;
  size: number;
}

interface GalleryYearResponse {
  photos: GalleryPhoto[];
  count: number;
  year: string;
}

const galleryYearCache = new Map<number, GalleryYearResponse>();
const inFlightGalleryRequests = new Map<number, Promise<GalleryYearResponse | null>>();
const prefetchedImageUrls = new Set<string>();

export function getCachedGalleryYear(year: number): GalleryYearResponse | null {
  return galleryYearCache.get(year) ?? null;
}

export async function fetchGalleryYear(year: number): Promise<GalleryYearResponse | null> {
  const cached = galleryYearCache.get(year);
  if (cached) {
    return cached;
  }

  const inFlight = inFlightGalleryRequests.get(year);
  if (inFlight) {
    return inFlight;
  }

  const request = (async () => {
    try {
      const response = await fetch(`/api/gallery?year=${year}`);
      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as GalleryYearResponse;
      const normalized: GalleryYearResponse = {
        photos: Array.isArray(data.photos) ? data.photos : [],
        count: Number.isFinite(data.count) ? data.count : (Array.isArray(data.photos) ? data.photos.length : 0),
        year: data.year || String(year),
      };

      galleryYearCache.set(year, normalized);
      return normalized;
    } catch {
      return null;
    }
  })();

  inFlightGalleryRequests.set(year, request);

  try {
    return await request;
  } finally {
    inFlightGalleryRequests.delete(year);
  }
}

export function prefetchGalleryYear(year: number): void {
  void fetchGalleryYear(year).then((data) => {
    if (!data?.photos?.length) {
      return;
    }
    prefetchGalleryImages(data.photos.map((photo) => photo.url), 6, 2);
  });
}

export function prefetchGalleryImage(url: string): void {
  if (!url || prefetchedImageUrls.has(url) || typeof window === 'undefined') {
    return;
  }

  prefetchedImageUrls.add(url);
  const image = new Image();
  image.decoding = 'async';
  (image as HTMLImageElement & { fetchPriority?: 'low' | 'high' | 'auto' }).fetchPriority = 'low';
  image.src = url;
}

export function prefetchGalleryImages(urls: string[], limit = 6, concurrency = 2): void {
  if (typeof window === 'undefined') {
    return;
  }

  const pendingUrls = urls.filter((url) => url && !prefetchedImageUrls.has(url)).slice(0, limit);
  if (pendingUrls.length === 0) {
    return;
  }

  let nextIndex = 0;
  let active = 0;

  const queueNext = () => {
    while (active < concurrency && nextIndex < pendingUrls.length) {
      const url = pendingUrls[nextIndex];
      nextIndex += 1;
      active += 1;
      prefetchedImageUrls.add(url);

      const image = new Image();
      image.decoding = 'async';
      (image as HTMLImageElement & { fetchPriority?: 'low' | 'high' | 'auto' }).fetchPriority = 'low';
      image.onload = () => {
        active -= 1;
        queueNext();
      };
      image.onerror = () => {
        active -= 1;
        queueNext();
      };
      image.src = url;
    }
  };

  queueNext();
}

export function resetGalleryPrefetchCachesForTests(): void {
  galleryYearCache.clear();
  inFlightGalleryRequests.clear();
  prefetchedImageUrls.clear();
}
