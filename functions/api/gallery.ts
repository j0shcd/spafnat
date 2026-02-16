import type { Env } from '../env';
import { jsonResponse } from '../lib/helpers';

/**
 * GET /api/gallery?year=2024
 * Lists congress photos for a given year
 * Public endpoint (no auth required)
 * Returns photo metadata with URLs
 */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const year = url.searchParams.get('year');

    if (!year) {
      return jsonResponse({ error: 'Paramètre "year" requis' }, 400);
    }

    // Validate year format (4 digits)
    if (!/^\d{4}$/.test(year)) {
      return jsonResponse({ error: 'Année invalide (format: YYYY)' }, 400);
    }

    // List photos from R2 with prefix congres/{year}/
    const prefix = `congres/${year}/`;
    const listed = await env.SPAF_MEDIA.list({ prefix });

    // Map to photo objects with metadata
    const photos = listed.objects.map((obj) => {
      // Extract filename from key (last segment)
      const parts = obj.key.split('/');
      const filename = parts[parts.length - 1];

      return {
        key: obj.key,
        filename,
        url: `/api/media/${obj.key}`,
        lastModified: obj.uploaded.toISOString(),
        size: obj.size,
      };
    });

    // Sort by lastModified (newest first)
    photos.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

    return jsonResponse({ photos, count: photos.length, year });
  } catch (error) {
    console.error('Gallery error:', error);
    return jsonResponse({ error: 'Échec du chargement de la galerie' }, 500);
  }
};
