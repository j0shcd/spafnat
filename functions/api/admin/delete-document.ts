import type { Env } from '../../env';
import { jsonResponse } from '../../lib/helpers';

/**
 * POST /api/admin/delete-document
 * Delete a document from R2 storage
 * Expects: { key: "bulletinAdhesion" }
 * Deletes: documents/bulletinAdhesion.pdf
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
      return jsonResponse({ error: 'Clé de document requise' }, 400);
    }

    const key = requestBody.key;

    // Construct R2 key (assume .pdf extension for documents)
    const r2Key = `documents/${key}.pdf`;

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
    return jsonResponse({ error: 'Échec de la suppression' }, 500);
  }
};
