import type { Env } from '../../../env';
import { jsonResponse, parseJsonBodyWithLimit } from '../../../lib/helpers';
import { loadDelegations, saveDelegations } from '../../../lib/delegations';

const MAX_DELETE_DELEGATION_BODY_BYTES = 8 * 1024;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const parsed = await parseJsonBodyWithLimit<unknown>(
      request,
      MAX_DELETE_DELEGATION_BODY_BYTES,
      'Corps de requête invalide'
    );
    if (!parsed.ok) {
      return parsed.response;
    }

    const body = parsed.data;
    if (!body || typeof body !== 'object' || typeof (body as Record<string, unknown>).id !== 'string') {
      return jsonResponse({ error: 'Identifiant de délégation invalide' }, 400);
    }

    const id = ((body as Record<string, unknown>).id as string).trim();
    if (!id) {
      return jsonResponse({ error: 'Identifiant de délégation invalide' }, 400);
    }

    const currentDelegations = await loadDelegations(env);
    const updatedDelegations = currentDelegations.filter((delegation) => delegation.id !== id);

    if (updatedDelegations.length === currentDelegations.length) {
      return jsonResponse({ error: 'Délégation non trouvée' }, 404);
    }

    const delegations = await saveDelegations(env, updatedDelegations);
    return jsonResponse({ success: true, delegations });
  } catch (error) {
    console.error('Delete delegation error:', error);
    return jsonResponse(
      { error: 'Erreur lors de la suppression. Veuillez réessayer ou contacter joshua@cohendumani.com' },
      500
    );
  }
};
