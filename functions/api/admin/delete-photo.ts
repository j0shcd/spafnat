import type { Env } from '../../env';
import { jsonResponse, parseJsonBodyWithLimit } from '../../lib/helpers';
import { hasUnsafePathSegments, isValidPhotoYear } from '../../lib/file-validation';

const MAX_DELETE_PHOTO_BODY_BYTES = 4 * 1024; // 4 KB

/**
 * POST /api/admin/delete-photo
 * Delete a photo from R2 storage
 * Expects: { key: "congres/2024/photo.jpg" }
 *
 * Protected by admin middleware
 */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    // Parse request body
    const parsed = await parseJsonBodyWithLimit<unknown>(
      request,
      MAX_DELETE_PHOTO_BODY_BYTES,
      'Corps de requête invalide'
    );
    if (!parsed.ok) {
      console.error('Delete photo: invalid JSON body');
      return parsed.response;
    }
    const body = parsed.data;

    if (typeof body !== 'object' || body === null) {
      console.error('Delete photo: body is not an object');
      return jsonResponse(
        { error: 'Une erreur technique s\'est produite. Veuillez contacter joshua@cohendumani.com' },
        400
      );
    }

    const requestBody = body as Record<string, unknown>;

    // Validate key
    if (!requestBody.key || typeof requestBody.key !== 'string') {
      console.error('Delete photo: missing or invalid key');
      return jsonResponse(
        { error: 'Une erreur technique s\'est produite. Veuillez contacter joshua@cohendumani.com' },
        400
      );
    }

    const key = requestBody.key;

    const segments = key.split('/');
    if (hasUnsafePathSegments(segments)) {
      console.error('Delete photo: unsafe key path:', key);
      return jsonResponse(
        { error: 'Une erreur technique s\'est produite. Veuillez contacter joshua@cohendumani.com' },
        400
      );
    }

    // Validate key format congres/{year}/{filename}
    if (segments.length !== 3 || segments[0] !== 'congres' || !isValidPhotoYear(segments[1])) {
      console.error('Delete photo: invalid key format:', key);
      return jsonResponse(
        { error: 'Une erreur technique s\'est produite. Veuillez contacter joshua@cohendumani.com' },
        400
      );
    }

    // Check if file exists
    const existing = await env.SPAF_MEDIA.head(key);
    if (!existing) {
      return jsonResponse({ error: 'Photo non trouvée' }, 404);
    }

    // Delete from R2
    await env.SPAF_MEDIA.delete(key);

    return jsonResponse({ success: true, deletedKey: key });
  } catch (error) {
    console.error('Delete photo error:', error);
    return jsonResponse(
      { error: 'Erreur lors de la suppression. Veuillez réessayer ou contacter joshua@cohendumani.com' },
      500
    );
  }
};
