import type { Env } from '../../env';

/**
 * Shared logic for checking if file exists in R2
 */
async function checkFileExists(env: Env, params: Record<string, unknown>): Promise<Response> {
  try {
    // 1. Get path from params
    const pathSegments = (params.path as string[]) || [];

    // 2. Path traversal protection
    if (pathSegments.some((segment) => segment === '..' || segment === '')) {
      return new Response('Chemin invalide', { status: 400 });
    }

    const r2Key = pathSegments.join('/');

    if (!r2Key) {
      return new Response('Chemin requis', { status: 400 });
    }

    // 3. Check if file exists in R2 using head()
    const object = await env.SPAF_MEDIA.head(r2Key);

    if (!object) {
      return new Response('Fichier non trouvé', { status: 404 });
    }

    // 4. Determine content type
    const contentType =
      object.httpMetadata?.contentType ||
      (r2Key.endsWith('.pdf')
        ? 'application/pdf'
        : r2Key.endsWith('.jpg') || r2Key.endsWith('.jpeg')
          ? 'image/jpeg'
          : r2Key.endsWith('.png')
            ? 'image/png'
            : r2Key.endsWith('.webp')
              ? 'image/webp'
              : 'application/octet-stream');

    // 5. Get original filename from metadata
    const originalFilename = object.customMetadata?.originalFilename || '';

    return new Response(null, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': object.size.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate', // No cache for availability checks
        'X-Content-Type-Options': 'nosniff',
        'X-Original-Filename': originalFilename,
        'Access-Control-Expose-Headers': 'X-Original-Filename',
      },
    });
  } catch (error) {
    console.error('Media check error:', error);
    return new Response('Erreur interne', { status: 500 });
  }
}

/**
 * HEAD /api/media/{path}
 * Checks if a file exists in R2 storage (used by frontend to check availability)
 * Public endpoint (no auth required)
 */
export const onRequestHead: PagesFunction<Env> = async ({ env, params }) => {
  return checkFileExists(env, params);
};

/**
 * GET /api/media/{path}
 * Serves files from R2 storage
 * Public endpoint (no auth required)
 * Includes cache headers and path traversal protection
 */
export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  try {
    // 1. Get path from params
    const pathSegments = (params.path as string[]) || [];

    // 2. Path traversal protection
    if (pathSegments.some((segment) => segment === '..' || segment === '')) {
      return new Response('Chemin invalide', { status: 400 });
    }

    const r2Key = pathSegments.join('/');

    if (!r2Key) {
      return new Response('Chemin requis', { status: 400 });
    }

    // 3. Fetch file from R2
    const object = await env.SPAF_MEDIA.get(r2Key);

    if (!object) {
      return new Response('Fichier non trouvé', { status: 404 });
    }

    // 4. Determine content type
    const contentType =
      object.httpMetadata?.contentType ||
      (r2Key.endsWith('.pdf')
        ? 'application/pdf'
        : r2Key.endsWith('.jpg') || r2Key.endsWith('.jpeg')
          ? 'image/jpeg'
          : r2Key.endsWith('.png')
            ? 'image/png'
            : r2Key.endsWith('.webp')
              ? 'image/webp'
              : 'application/octet-stream');

    // 5. Get original filename from metadata
    const originalFilename = object.customMetadata?.originalFilename || '';

    // 6. Return file with cache headers
    return new Response(object.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // 1 day
        'X-Content-Type-Options': 'nosniff',
        'X-Original-Filename': originalFilename,
        'Access-Control-Expose-Headers': 'X-Original-Filename',
      },
    });
  } catch (error) {
    console.error('Media serving error:', error);
    return new Response('Erreur interne', { status: 500 });
  }
};
