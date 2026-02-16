import type { Env } from '../../../env';
import { jsonResponse } from '../../../lib/helpers';
import type { ConcoursItem, ConcoursCategory } from '../../../../src/config/concours';
import { getConcoursKVKey, CONCOURS_CATEGORIES } from '../../../../src/config/concours';

/**
 * POST /api/admin/concours/reorder
 * Reorder items in a concours category
 * Expects: { category: string, r2Key: string, direction: "up" | "down" }
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
      console.error('Reorder concours: invalid JSON');
      return jsonResponse(
        { error: 'Une erreur technique s\'est produite. Veuillez contacter joshua@cohendumani.com' },
        400
      );
    }

    if (typeof body !== 'object' || body === null) {
      console.error('Reorder concours: body is not an object');
      return jsonResponse(
        { error: 'Une erreur technique s\'est produite. Veuillez contacter joshua@cohendumani.com' },
        400
      );
    }

    const requestBody = body as Record<string, unknown>;

    // Validate fields
    if (!requestBody.category || typeof requestBody.category !== 'string') {
      console.error('Reorder concours: missing or invalid category');
      return jsonResponse(
        { error: 'Une erreur technique s\'est produite. Veuillez contacter joshua@cohendumani.com' },
        400
      );
    }

    if (!requestBody.r2Key || typeof requestBody.r2Key !== 'string') {
      console.error('Reorder concours: missing or invalid r2Key');
      return jsonResponse(
        { error: 'Une erreur technique s\'est produite. Veuillez contacter joshua@cohendumani.com' },
        400
      );
    }

    if (!requestBody.direction || (requestBody.direction !== 'up' && requestBody.direction !== 'down')) {
      console.error('Reorder concours: missing or invalid direction');
      return jsonResponse(
        { error: 'Une erreur technique s\'est produite. Veuillez contacter joshua@cohendumani.com' },
        400
      );
    }

    const category = requestBody.category;
    const r2Key = requestBody.r2Key;
    const direction = requestBody.direction;

    // Validate category
    if (!(category in CONCOURS_CATEGORIES)) {
      console.error('Reorder concours: invalid category:', category);
      return jsonResponse(
        { error: 'Une erreur technique s\'est produite. Veuillez contacter joshua@cohendumani.com' },
        400
      );
    }

    // Fetch current items
    const kvKey = getConcoursKVKey(category as ConcoursCategory);
    const existingData = await env.SPAF_KV.get(kvKey, 'json');
    const items = (existingData as ConcoursItem[]) || [];

    // Find item index
    const index = items.findIndex(item => item.r2Key === r2Key);

    if (index === -1) {
      return jsonResponse({ error: 'Document non trouvé' }, 404);
    }

    // Calculate new index
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    // Check bounds
    if (newIndex < 0 || newIndex >= items.length) {
      return jsonResponse({ error: 'Impossible de déplacer dans cette direction' }, 400);
    }

    // Swap items
    [items[index], items[newIndex]] = [items[newIndex], items[index]];

    // Save updated array
    await env.SPAF_KV.put(kvKey, JSON.stringify(items));

    console.log('Reorder successful:', kvKey, 'moved', r2Key, direction);

    return jsonResponse({ success: true, items });
  } catch (error) {
    console.error('Reorder concours error:', error);
    return jsonResponse(
      { error: 'Erreur lors du réordonnancement. Veuillez réessayer ou contacter joshua@cohendumani.com' },
      500
    );
  }
};
