import type { Env } from '../../../env';
import { jsonResponse } from '../../../lib/helpers';
import type { ConcoursItem, ConcoursCategory } from '../../../../src/config/concours';
import { getConcoursKVKey, CONCOURS_CATEGORIES } from '../../../../src/config/concours';

/**
 * POST /api/admin/concours/delete
 * Delete a concours item from R2 and remove from KV array
 * Expects: { category: string, r2Key: string }
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
      console.error('Delete concours: invalid JSON');
      return jsonResponse(
        { error: 'Une erreur technique s\'est produite. Veuillez contacter joshua@cohendumani.com' },
        400
      );
    }

    if (typeof body !== 'object' || body === null) {
      console.error('Delete concours: body is not an object');
      return jsonResponse(
        { error: 'Une erreur technique s\'est produite. Veuillez contacter joshua@cohendumani.com' },
        400
      );
    }

    const requestBody = body as Record<string, unknown>;

    // Validate fields
    if (!requestBody.category || typeof requestBody.category !== 'string') {
      console.error('Delete concours: missing or invalid category');
      return jsonResponse(
        { error: 'Une erreur technique s\'est produite. Veuillez contacter joshua@cohendumani.com' },
        400
      );
    }

    if (!requestBody.r2Key || typeof requestBody.r2Key !== 'string') {
      console.error('Delete concours: missing or invalid r2Key');
      return jsonResponse(
        { error: 'Une erreur technique s\'est produite. Veuillez contacter joshua@cohendumani.com' },
        400
      );
    }

    const category = requestBody.category;
    const r2Key = requestBody.r2Key;

    // Validate category
    if (!(category in CONCOURS_CATEGORIES)) {
      console.error('Delete concours: invalid category:', category);
      return jsonResponse(
        { error: 'Une erreur technique s\'est produite. Veuillez contacter joshua@cohendumani.com' },
        400
      );
    }

    // 1. Delete from R2 (ignore if not found)
    try {
      await env.SPAF_MEDIA.delete(r2Key);
      console.log('R2 delete successful:', r2Key);
    } catch (error) {
      console.warn('R2 delete failed (file may not exist):', r2Key, error);
    }

    // 2. Remove from KV array
    const kvKey = getConcoursKVKey(category as ConcoursCategory);
    const existingData = await env.SPAF_KV.get(kvKey, 'json');
    const items = (existingData as ConcoursItem[]) || [];

    const updatedItems = items.filter(item => item.r2Key !== r2Key);

    if (updatedItems.length === items.length) {
      console.warn('Item not found in KV array:', r2Key);
      return jsonResponse({ error: 'Document non trouvé' }, 404);
    }

    await env.SPAF_KV.put(kvKey, JSON.stringify(updatedItems));

    console.log('KV update successful:', kvKey, updatedItems.length, 'items');

    return jsonResponse({ success: true, deletedKey: r2Key });
  } catch (error) {
    console.error('Delete concours error:', error);
    return jsonResponse(
      { error: 'Erreur lors de la suppression. Veuillez réessayer ou contacter joshua@cohendumani.com' },
      500
    );
  }
};
