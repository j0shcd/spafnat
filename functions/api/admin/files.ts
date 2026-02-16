import type { Env } from '../../env';
import { jsonResponse } from '../../lib/helpers';

/**
 * GET /api/admin/files?type=documents
 * GET /api/admin/files?type=photos&year=2024
 *
 * List files from R2 storage
 * Protected by admin middleware
 */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const year = url.searchParams.get('year');

    if (!type) {
      return jsonResponse({ error: 'Paramètre "type" requis' }, 400);
    }

    let prefix: string;

    if (type === 'documents') {
      prefix = 'documents/';
    } else if (type === 'photos') {
      if (!year) {
        return jsonResponse({ error: 'Paramètre "year" requis pour les photos' }, 400);
      }
      prefix = `congres/${year}/`;
    } else {
      return jsonResponse({ error: 'Type invalide (documents ou photos)' }, 400);
    }

    // List objects with prefix
    const listed = await env.SPAF_MEDIA.list({ prefix });

    const files = listed.objects.map((obj) => ({
      key: obj.key,
      size: obj.size,
      lastModified: obj.uploaded.toISOString(),
      url: `/api/media/${obj.key}`,
    }));

    return jsonResponse({ files, count: files.length });
  } catch (error) {
    console.error('Files listing error:', error);
    return jsonResponse({ error: 'Échec du listage des fichiers' }, 500);
  }
};
