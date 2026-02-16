import type { Env } from '../../env';
import { jsonResponse } from '../../lib/helpers';

/**
 * POST /api/admin/delete-document
 * Delete a document from R2 storage
 * Expects: { key: "bulletin_adhesion_2026.pdf" } (full filename)
 * Deletes: documents/bulletin_adhesion_2026.pdf
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
      console.error('Delete document: invalid JSON');
      return jsonResponse(
        { error: 'Une erreur technique s\'est produite. Veuillez contacter joshua@cohendumani.com' },
        400
      );
    }

    if (typeof body !== 'object' || body === null) {
      console.error('Delete document: body is not an object');
      return jsonResponse(
        { error: 'Une erreur technique s\'est produite. Veuillez contacter joshua@cohendumani.com' },
        400
      );
    }

    const requestBody = body as Record<string, unknown>;

    // Validate key
    if (!requestBody.key || typeof requestBody.key !== 'string') {
      console.error('Delete document: missing or invalid key');
      return jsonResponse(
        { error: 'Une erreur technique s\'est produite. Veuillez contacter joshua@cohendumani.com' },
        400
      );
    }

    const key = requestBody.key;

    // Construct R2 key (key is already the full filename)
    const r2Key = `documents/${key}`;

    // Check if file exists
    const existing = await env.SPAF_MEDIA.head(r2Key);
    if (!existing) {
      return jsonResponse({ error: 'Document non trouvé' }, 404);
    }

    // Delete from R2
    await env.SPAF_MEDIA.delete(r2Key);

    return jsonResponse({ success: true, deletedKey: r2Key });
  } catch (error) {
    console.error('Delete document error:', error);
    return jsonResponse(
      { error: 'Erreur lors de la suppression. Veuillez réessayer ou contacter joshua@cohendumani.com' },
      500
    );
  }
};
