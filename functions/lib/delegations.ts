import type { Env } from '../env';
import {
  DEFAULT_DELEGATIONS,
  getDelegationsKVKey,
  sortDelegations,
  type Delegation,
} from '../../src/config/delegations';

export async function loadDelegations(env: Env): Promise<Delegation[]> {
  const data = await env.SPAF_KV.get(getDelegationsKVKey(), 'json');

  if (data === null) {
    return sortDelegations(DEFAULT_DELEGATIONS);
  }

  if (!Array.isArray(data)) {
    console.warn('Delegations KV value is malformed; falling back to defaults');
    return sortDelegations(DEFAULT_DELEGATIONS);
  }

  return sortDelegations(data as Delegation[]);
}

export async function saveDelegations(env: Env, delegations: Delegation[]): Promise<Delegation[]> {
  const sortedDelegations = sortDelegations(delegations);
  await env.SPAF_KV.put(getDelegationsKVKey(), JSON.stringify(sortedDelegations));
  return sortedDelegations;
}
