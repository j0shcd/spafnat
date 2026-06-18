import type { Env } from '../env';
import { jsonResponse } from '../lib/helpers';
import { loadDelegations } from '../lib/delegations';

const DELEGATIONS_CACHE_HEADERS = {
  'Cache-Control': 'no-store',
};

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const delegations = await loadDelegations(env);
    return jsonResponse({ delegations }, 200, DELEGATIONS_CACHE_HEADERS);
  } catch (error) {
    console.error('Delegations fetch error:', error);
    return jsonResponse(
      { error: 'Erreur lors de la récupération des délégations' },
      500
    );
  }
};
