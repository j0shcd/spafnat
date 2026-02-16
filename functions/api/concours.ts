import type { Env } from '../env';
import { jsonResponse } from '../lib/helpers';
import type { ConcoursItem, ConcoursCategory } from '../../src/config/concours';
import { getConcoursKVKey, CONCOURS_CATEGORIES } from '../../src/config/concours';

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
      const results: Record<ConcoursCategory, ConcoursItem[]> = {
        'reglements': [],
        'palmares-poetique': [],
        'palmares-artistique': [],
      };

      // Fetch all three categories in parallel
      const categories: ConcoursCategory[] = ['reglements', 'palmares-poetique', 'palmares-artistique'];

      await Promise.all(
        categories.map(async (cat) => {
          const kvKey = getConcoursKVKey(cat);
          const data = await env.SPAF_KV.get(kvKey, 'json');
          results[cat] = (data as ConcoursItem[]) || [];
        })
      );

      return jsonResponse(results);
    }

    // Validate single category
    if (!(category in CONCOURS_CATEGORIES)) {
      return jsonResponse({ error: 'Catégorie invalide' }, 400);
    }

    // Fetch single category
    const kvKey = getConcoursKVKey(category as ConcoursCategory);
    const data = await env.SPAF_KV.get(kvKey, 'json');
    const items = (data as ConcoursItem[]) || [];

    return jsonResponse({ items });
  } catch (error) {
    console.error('Concours fetch error:', error);
    return jsonResponse(
      { error: 'Erreur lors de la récupération des documents' },
      500
    );
  }
};
