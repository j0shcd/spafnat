import type { Env } from '../env';
import { jsonResponse } from '../lib/helpers';
import type { ConcoursItem, ConcoursCategory } from '../../src/config/concours';
import {
  getConcoursKVKey,
  getConcoursAllKVKey,
  CONCOURS_CATEGORIES,
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

function parseAggregateData(data: unknown): Record<ConcoursCategory, ConcoursItem[]> | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const parsed = createEmptyConcoursResults();
  const payload = data as Partial<Record<ConcoursCategory, unknown>>;

  for (const category of CONCOURS_CATEGORY_LIST) {
    const categoryItems = payload[category];
    parsed[category] = Array.isArray(categoryItems) ? (categoryItems as ConcoursItem[]) : [];
  }

  return parsed;
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
      const aggregateKey = getConcoursAllKVKey();
      const aggregateData = await env.SPAF_KV.get(aggregateKey, 'json');
      const parsedAggregate = parseAggregateData(aggregateData);

      if (parsedAggregate) {
        return jsonResponse(parsedAggregate, 200, CONCOURS_CACHE_HEADERS);
      }

      const results = createEmptyConcoursResults();

      // Aggregate miss: rebuild from category keys, then cache.
      await Promise.all(
        CONCOURS_CATEGORY_LIST.map(async (cat) => {
          const kvKey = getConcoursKVKey(cat);
          const data = await env.SPAF_KV.get(kvKey, 'json');
          results[cat] = (data as ConcoursItem[]) || [];
        })
      );

      env.SPAF_KV.put(aggregateKey, JSON.stringify(results)).catch((error) => {
        console.warn('Concours aggregate cache write failed:', error);
      });

      return jsonResponse(results, 200, CONCOURS_CACHE_HEADERS);
    }

    // Validate single category
    if (!(category in CONCOURS_CATEGORIES)) {
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
