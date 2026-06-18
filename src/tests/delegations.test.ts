import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  DEFAULT_DELEGATIONS,
  getDelegationsKVKey,
  normalizeAndValidateDelegation,
  sortDelegations,
  type Delegation,
} from '../config/delegations';
import { onRequestGet as getDelegationsHandler } from '../../functions/api/delegations';
import { onRequestPost as saveDelegationHandler } from '../../functions/api/admin/delegations/save';
import { onRequestPost as deleteDelegationHandler } from '../../functions/api/admin/delegations/delete';

type GetDelegationsContext = Parameters<typeof getDelegationsHandler>[0];
type SaveDelegationContext = Parameters<typeof saveDelegationHandler>[0];
type DeleteDelegationContext = Parameters<typeof deleteDelegationHandler>[0];

function createRequest(body: unknown): Request {
  return new Request('http://localhost/api/admin/delegations/save', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function createEnv(initialValue: unknown = null) {
  let storedValue = initialValue;

  return {
    env: {
      SPAF_KV: {
        get: vi.fn().mockImplementation(async () => storedValue),
        put: vi.fn().mockImplementation(async (_key: string, value: string) => {
          storedValue = JSON.parse(value);
        }),
      },
    },
    getStoredValue: () => storedValue,
  };
}

async function readJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

describe('Delegations configuration', () => {
  it('ships the 11 current delegations with stable unique ids', () => {
    expect(DEFAULT_DELEGATIONS).toHaveLength(11);

    const ids = DEFAULT_DELEGATIONS.map((delegation) => delegation.id);
    expect(new Set(ids).size).toBe(DEFAULT_DELEGATIONS.length);
    expect(ids).toContain('bretagne');
    expect(ids).toContain('occitanie');
  });

  it('sorts by region using French locale order', () => {
    const sorted = sortDelegations([
      { id: 'occitanie', region: 'Occitanie', delegate: 'A', gender: 'M', address: 'A' },
      { id: 'ile', region: 'Île-de-France', delegate: 'A', gender: 'F', address: 'A' },
      { id: 'bretagne', region: 'Bretagne', delegate: 'A', gender: 'F', address: 'A' },
    ]);

    expect(sorted.map((delegation) => delegation.region)).toEqual([
      'Bretagne',
      'Île-de-France',
      'Occitanie',
    ]);
  });

  it('normalizes whitespace and empty website values', () => {
    const result = normalizeAndValidateDelegation({
      region: ' Bretagne ',
      delegate: ' Loriane Dréan ',
      gender: 'F',
      address: ' 31 Hent Toull Moger ',
      website: '   ',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.delegation).toEqual({
        region: 'Bretagne',
        delegate: 'Loriane Dréan',
        gender: 'F',
        address: '31 Hent Toull Moger',
      });
    }
  });

  it('adds https to website domains without a protocol', () => {
    const result = normalizeAndValidateDelegation({
      region: 'Occitanie',
      delegate: 'Richard Maggiore',
      gender: 'M',
      address: 'Moissac',
      website: ' spafoccitanie.eklablog.com ',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.delegation.website).toBe('https://spafoccitanie.eklablog.com');
    }
  });

  it('rejects missing fields, invalid gender, and invalid website URLs', () => {
    const result = normalizeAndValidateDelegation({
      region: '',
      delegate: '',
      gender: 'X',
      address: '',
      website: 'javascript:alert(1)',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual(
        expect.arrayContaining([
          'La région est obligatoire',
          'Le nom du délégué est obligatoire',
          "L'adresse est obligatoire",
          'Le titre doit être Délégué ou Déléguée',
          'Le site web doit commencer par http:// ou https://',
        ])
      );
    }
  });
});

describe('Delegations endpoints', () => {
  beforeEach(() => {
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => 'generated-id'),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns defaults when KV is missing', async () => {
    const { env } = createEnv(null);
    const response = await getDelegationsHandler({ env } as unknown as GetDelegationsContext);
    const data = await readJson(response);

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect((data.delegations as Delegation[])).toHaveLength(11);
  });

  it('keeps an intentionally saved empty list empty', async () => {
    const { env } = createEnv([]);
    const response = await getDelegationsHandler({ env } as unknown as GetDelegationsContext);
    const data = await readJson(response);

    expect(response.status).toBe(200);
    expect(data.delegations).toEqual([]);
  });

  it('falls back to defaults when KV is malformed', async () => {
    const { env } = createEnv({ unexpected: true });
    const response = await getDelegationsHandler({ env } as unknown as GetDelegationsContext);
    const data = await readJson(response);

    expect(response.status).toBe(200);
    expect((data.delegations as Delegation[])).toHaveLength(11);
  });

  it('creates a new delegation without an id and persists the canonical sorted list', async () => {
    const existing: Delegation[] = [
      { id: 'occitanie', region: 'Occitanie', delegate: 'Richard', gender: 'M', address: 'Moissac' },
    ];
    const { env, getStoredValue } = createEnv(existing);

    const response = await saveDelegationHandler({
      request: createRequest({
        region: 'Bretagne',
        delegate: 'Loriane',
        gender: 'F',
        address: 'Quimper',
      }),
      env,
    } as unknown as SaveDelegationContext);
    const data = await readJson(response);

    expect(response.status).toBe(200);
    expect(env.SPAF_KV.put).toHaveBeenCalledWith(getDelegationsKVKey(), expect.any(String));
    expect((data.delegations as Delegation[]).map((delegation) => delegation.region)).toEqual([
      'Bretagne',
      'Occitanie',
    ]);
    expect((getStoredValue() as Delegation[])[0].id).toBe('generated-id');
  });

  it('updates an existing delegation without creating duplicates', async () => {
    const existing: Delegation[] = [
      { id: 'bretagne', region: 'Bretagne', delegate: 'Ancien nom', gender: 'F', address: 'Quimper' },
      { id: 'occitanie', region: 'Occitanie', delegate: 'Richard', gender: 'M', address: 'Moissac' },
    ];
    const { env } = createEnv(existing);

    const response = await saveDelegationHandler({
      request: createRequest({
        id: 'bretagne',
        region: 'Bretagne',
        delegate: 'Nouveau nom',
        gender: 'F',
        address: 'Nouvelle adresse',
      }),
      env,
    } as unknown as SaveDelegationContext);
    const data = await readJson(response);
    const delegations = data.delegations as Delegation[];

    expect(response.status).toBe(200);
    expect(delegations).toHaveLength(2);
    expect(delegations.filter((delegation) => delegation.id === 'bretagne')).toHaveLength(1);
    expect(delegations.find((delegation) => delegation.id === 'bretagne')?.delegate).toBe('Nouveau nom');
  });

  it('returns 404 for an unknown non-empty id instead of creating a duplicate', async () => {
    const { env } = createEnv([
      { id: 'bretagne', region: 'Bretagne', delegate: 'Loriane', gender: 'F', address: 'Quimper' },
    ]);

    const response = await saveDelegationHandler({
      request: createRequest({
        id: 'missing-id',
        region: 'Bretagne',
        delegate: 'Loriane',
        gender: 'F',
        address: 'Quimper',
      }),
      env,
    } as unknown as SaveDelegationContext);

    expect(response.status).toBe(404);
    expect(env.SPAF_KV.put).not.toHaveBeenCalled();
  });

  it('rejects invalid save payloads without writing to KV', async () => {
    const { env } = createEnv([]);

    const response = await saveDelegationHandler({
      request: createRequest({
        region: '',
        delegate: '',
        gender: 'F',
        address: '',
      }),
      env,
    } as unknown as SaveDelegationContext);
    const data = await readJson(response);

    expect(response.status).toBe(400);
    expect(data.details).toEqual(expect.arrayContaining(['La région est obligatoire']));
    expect(env.SPAF_KV.put).not.toHaveBeenCalled();
  });

  it('deletes a delegation and returns the canonical list', async () => {
    const { env } = createEnv([
      { id: 'bretagne', region: 'Bretagne', delegate: 'Loriane', gender: 'F', address: 'Quimper' },
      { id: 'occitanie', region: 'Occitanie', delegate: 'Richard', gender: 'M', address: 'Moissac' },
    ]);

    const response = await deleteDelegationHandler({
      request: createRequest({ id: 'bretagne' }),
      env,
    } as unknown as DeleteDelegationContext);
    const data = await readJson(response);

    expect(response.status).toBe(200);
    expect((data.delegations as Delegation[]).map((delegation) => delegation.id)).toEqual(['occitanie']);
  });

  it('persists an intentionally empty list after deleting the final delegation', async () => {
    const { env, getStoredValue } = createEnv([
      { id: 'bretagne', region: 'Bretagne', delegate: 'Loriane', gender: 'F', address: 'Quimper' },
    ]);

    const response = await deleteDelegationHandler({
      request: createRequest({ id: 'bretagne' }),
      env,
    } as unknown as DeleteDelegationContext);

    expect(response.status).toBe(200);
    expect(getStoredValue()).toEqual([]);
  });

  it('returns 404 when deleting an unknown id', async () => {
    const { env } = createEnv([]);

    const response = await deleteDelegationHandler({
      request: createRequest({ id: 'missing-id' }),
      env,
    } as unknown as DeleteDelegationContext);

    expect(response.status).toBe(404);
    expect(env.SPAF_KV.put).not.toHaveBeenCalled();
  });
});
