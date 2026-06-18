import type { Env } from '../../../env';
import { jsonResponse, parseJsonBodyWithLimit } from '../../../lib/helpers';
import { loadDelegations, saveDelegations } from '../../../lib/delegations';
import {
  normalizeAndValidateDelegation,
  type Delegation,
} from '../../../../src/config/delegations';

const MAX_SAVE_DELEGATION_BODY_BYTES = 8 * 1024;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const parsed = await parseJsonBodyWithLimit<unknown>(
      request,
      MAX_SAVE_DELEGATION_BODY_BYTES,
      'Corps de requête invalide'
    );
    if (!parsed.ok) {
      return parsed.response;
    }

    const validation = normalizeAndValidateDelegation(parsed.data);
    if (!validation.ok) {
      return jsonResponse(
        { error: 'Veuillez corriger les informations de la délégation', details: validation.errors },
        400
      );
    }

    const currentDelegations = await loadDelegations(env);
    const incoming = validation.delegation;
    const isCreate = !incoming.id;

    let updatedDelegation: Delegation;
    let updatedDelegations: Delegation[];

    if (isCreate) {
      updatedDelegation = {
        id: crypto.randomUUID(),
        region: incoming.region || '',
        delegate: incoming.delegate || '',
        gender: incoming.gender || 'M',
        address: incoming.address || '',
        ...(incoming.website ? { website: incoming.website } : {}),
      };
      updatedDelegations = [...currentDelegations, updatedDelegation];
    } else {
      const existingIndex = currentDelegations.findIndex((item) => item.id === incoming.id);
      if (existingIndex === -1) {
        return jsonResponse({ error: 'Délégation non trouvée' }, 404);
      }

      updatedDelegation = incoming as Delegation;
      updatedDelegations = currentDelegations.map((item) =>
        item.id === updatedDelegation.id ? updatedDelegation : item
      );
    }

    const delegations = await saveDelegations(env, updatedDelegations);
    return jsonResponse({ success: true, delegation: updatedDelegation, delegations });
  } catch (error) {
    console.error('Save delegation error:', error);
    return jsonResponse(
      { error: 'Erreur lors de l’enregistrement. Veuillez réessayer ou contacter joshua@cohendumani.com' },
      500
    );
  }
};
