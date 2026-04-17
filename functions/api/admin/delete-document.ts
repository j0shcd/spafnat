import type { Env } from '../../env';
import { jsonResponse, parseJsonBodyWithLimit } from '../../lib/helpers';
import { DOCUMENTS } from '../../../src/config/documents';

const MAX_DELETE_DOCUMENT_BODY_BYTES = 4 * 1024; // 4 KB
const REVUE_DOCUMENT_FILENAME = 'extrait_revue.pdf';
const REVUE_COVER_FILENAME = 'extrait_revue_cover.jpg';

const ALLOWED_DOCUMENT_FILENAMES = new Set(
  Object.values(DOCUMENTS)
    .map((document) => document.path.split('/').pop())
    .filter((filename): filename is string => Boolean(filename))
);

/**
 * POST /api/admin/delete-document
 * Delete a document from R2 storage
 * Expects: { key: "bulletin_adhesion.pdf" } (full filename)
 * Deletes: documents/bulletin_adhesion.pdf
 *
 * Protected by admin middleware
 */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    // Parse request body
    const parsed = await parseJsonBodyWithLimit<unknown>(
      request,
      MAX_DELETE_DOCUMENT_BODY_BYTES,
      'Corps de requête invalide'
    );
    if (!parsed.ok) {
      console.error('Delete document: invalid JSON body');
      return parsed.response;
    }
    const body = parsed.data;

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
    if (!ALLOWED_DOCUMENT_FILENAMES.has(key)) {
      console.error('Delete document: invalid document filename');
      return jsonResponse(
        { error: 'Une erreur technique s\'est produite. Veuillez contacter joshua@cohendumani.com' },
        400
      );
    }

    // Construct R2 key (key is already the full filename)
    const r2Key = `documents/${key}`;

    // Check if file exists
    const existing = await env.SPAF_MEDIA.head(r2Key);
    if (!existing) {
      return jsonResponse({ error: 'Document non trouvé' }, 404);
    }

    // Delete from R2
    await env.SPAF_MEDIA.delete(r2Key);

    // Keep revue cover in sync with the primary PDF lifecycle.
    if (key === REVUE_DOCUMENT_FILENAME) {
      await env.SPAF_MEDIA.delete(`documents/${REVUE_COVER_FILENAME}`);
    }

    return jsonResponse({ success: true, deletedKey: r2Key });
  } catch (error) {
    console.error('Delete document error:', error);
    return jsonResponse(
      { error: 'Erreur lors de la suppression. Veuillez réessayer ou contacter joshua@cohendumani.com' },
      500
    );
  }
};
