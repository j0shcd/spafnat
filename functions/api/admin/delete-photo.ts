import type { Env } from '../../env';
import { jsonResponse } from '../../lib/helpers';

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
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Corps de requête invalide' }, 400);
    }

    if (typeof body !== 'object' || body === null) {
      return jsonResponse({ error: 'Corps de requête invalide' }, 400);
    }

    const requestBody = body as Record<string, unknown>;

    // Validate key
    if (!requestBody.key || typeof requestBody.key !== 'string') {
      return jsonResponse({ error: 'Clé de photo requise' }, 400);
    }

    const key = requestBody.key;

    // Validate key format (must start with "congres/")
    if (!key.startsWith('congres/')) {
      return jsonResponse({ error: 'Clé de photo invalide (doit commencer par congres/)' }, 400);
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
    return jsonResponse({ error: 'Échec de la suppression' }, 500);
  }
};
