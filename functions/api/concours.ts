import type { Env } from '../env';
import { jsonResponse } from '../lib/helpers';
import type { ConcoursItem, ConcoursCategory } from '../../src/config/concours';
import {
  getConcoursKVKey,
  isConcoursCategory,
  CONCOURS_CATEGORY_LIST,
} from '../../src/config/concours';

const CONCOURS_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
};

function createEmptyConcoursResults(): Record<ConcoursCategory, ConcoursItem[]> {
  return {
    'reglements': [],
    'palmares-poetique': [],
    'palmares-artistique': [],
  };
}

/**
 * GET /api/concours?category={category}
 * Public endpoint to fetch concours items
 * - category=reglements|palmares-poetique|palmares-artistique (single category)
 * - category=all (all categories)
 */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');

    if (!category) {
      return jsonResponse({ error: 'Paramètre "category" requis' }, 400);
    }

    // Handle "all" category
    if (category === 'all') {
      const results = createEmptyConcoursResults();

      // Read only the canonical category keys; a derived KV cache can outlive edits.
      await Promise.all(
        CONCOURS_CATEGORY_LIST.map(async (cat) => {
          const kvKey = getConcoursKVKey(cat);
          const data = await env.SPAF_KV.get(kvKey, 'json');
          results[cat] = (data as ConcoursItem[]) || [];
        })
      );

      return jsonResponse(results, 200, CONCOURS_CACHE_HEADERS);
    }

    // Validate single category
    if (!isConcoursCategory(category)) {
      return jsonResponse({ error: 'Catégorie invalide' }, 400);
    }

    // Fetch single category
    const kvKey = getConcoursKVKey(category as ConcoursCategory);
    const data = await env.SPAF_KV.get(kvKey, 'json');
    const items = (data as ConcoursItem[]) || [];

    return jsonResponse({ items }, 200, CONCOURS_CACHE_HEADERS);
  } catch (error) {
    console.error('Concours fetch error:', error);
    return jsonResponse(
      { error: 'Erreur lors de la récupération des documents' },
      500
    );
  }
};
