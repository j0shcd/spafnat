export type Gender = 'F' | 'M';

export interface Delegation {
  id: string;
  region: string;
  delegate: string;
  gender: Gender;
  address: string;
  website?: string;
}

export type DelegationInput = Partial<Delegation>;

type ValidationSuccess = {
  ok: true;
  delegation: DelegationInput;
};

type ValidationFailure = {
  ok: false;
  errors: string[];
};

export type DelegationValidationResult = ValidationSuccess | ValidationFailure;

const MAX_ID_LENGTH = 100;
const MAX_REGION_LENGTH = 120;
const MAX_DELEGATE_LENGTH = 120;
const MAX_ADDRESS_LENGTH = 300;
const MAX_WEBSITE_LENGTH = 200;

export const DEFAULT_DELEGATIONS: Delegation[] = [
  {
    id: 'auvergne-rhone-alpes',
    region: 'Auvergne-Rhône-Alpes',
    delegate: 'Gael Schmidt',
    gender: 'M',
    address: '64 route de la vieille églises, 74410 Saint-Jorioz',
  },
  {
    id: 'bourgogne-franche-comte',
    region: 'Bourgogne-Franche-Comté',
    delegate: 'Michel Potier',
    gender: 'M',
    address: '33 rue de Compostelle, Villiers-le-Sec, 58210 Varzy',
  },
  {
    id: 'bretagne',
    region: 'Bretagne',
    delegate: 'Loriane Dréan',
    gender: 'F',
    address: '31 Hent Toull Moger, 29000 Quimper',
  },
  {
    id: 'grand-est',
    region: 'Grand Est',
    delegate: 'Armand Bemer',
    gender: 'M',
    address: '12 rue Haut des Ambes, 57530 Bazoncourt',
  },
  {
    id: 'ile-de-france',
    region: 'Île-de-France',
    delegate: 'Magali Breton',
    gender: 'F',
    address: '4 rue du château, 89140 Evry',
  },
  {
    id: 'martinique-guadeloupe',
    region: 'Martinique - Guadeloupe',
    delegate: 'Arlette Millon',
    gender: 'F',
    address: 'Quartier Lamberton, 97215 Rivière Salée',
  },
  {
    id: 'mascareignes',
    region: 'Mascareignes',
    delegate: 'Thierry Bertil',
    gender: 'M',
    address: '312 rue Raphaël Douyere Bois-court, 97418 Plaine des Cafres',
  },
  {
    id: 'normandie',
    region: 'Normandie',
    delegate: 'Philippe Pauthonier',
    gender: 'M',
    address: '13 rue de la Mailleray, Rés. de France Imm. Roussillon, 76600 Le Havre',
  },
  {
    id: 'nouvelle-aquitaine',
    region: 'Nouvelle Aquitaine',
    delegate: 'Christian Littée',
    gender: 'M',
    address: '13 rue des Carmes appt. 14 allée du bon pasteur, 86000 Poitiers',
  },
  {
    id: 'occitanie',
    region: 'Occitanie',
    delegate: 'Richard Maggiore',
    gender: 'M',
    address: '9 rue Desmazels Appt 7, 82200 Moissac',
    website: 'https://spafoccitanie.eklablog.com',
  },
  {
    id: 'provence-alpes-cote-d-azur',
    region: "Provence-Alpes-Côte d'Azur",
    delegate: 'Natalie Lauro',
    gender: 'F',
    address: "64 Avenue du 3 septembre, La Lézardière Bat G, 06320 Cap d'ail",
  },
];

export function getDelegationsKVKey(): string {
  return 'delegations:all';
}

export function sortDelegations(delegations: Delegation[]): Delegation[] {
  return [...delegations].sort((a, b) =>
    a.region.localeCompare(b.region, 'fr', { sensitivity: 'base' })
  );
}

function validateLength(value: string, maxLength: number, label: string, errors: string[]) {
  if (value.length > maxLength) {
    errors.push(`${label} ne doit pas dépasser ${maxLength} caractères`);
  }
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeRequiredString(
  value: unknown,
  label: string,
  maxLength: number,
  errors: string[]
): string {
  if (typeof value !== 'string') {
    errors.push(`${label} est obligatoire`);
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    errors.push(`${label} est obligatoire`);
    return '';
  }

  validateLength(trimmed, maxLength, label, errors);
  return trimmed;
}

function normalizeWebsite(value: unknown, errors: string[]): string | undefined {
  const website = normalizeOptionalString(value);
  if (!website) return undefined;

  const hasProtocol = /^[a-z][a-z0-9+.-]*:/i.test(website);
  const websiteWithProtocol = hasProtocol
    ? website
    : `https://${website}`;

  validateLength(websiteWithProtocol, MAX_WEBSITE_LENGTH, 'Le site web', errors);

  try {
    const url = new URL(websiteWithProtocol);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      errors.push('Le site web doit commencer par http:// ou https://');
    }
  } catch {
    errors.push('Le site web doit être une URL valide');
  }

  return websiteWithProtocol;
}

export function normalizeAndValidateDelegation(input: unknown): DelegationValidationResult {
  const errors: string[] = [];

  if (!input || typeof input !== 'object') {
    return { ok: false, errors: ['Les informations de la délégation sont invalides'] };
  }

  const payload = input as Record<string, unknown>;
  const id = normalizeOptionalString(payload.id);
  if (id) {
    validateLength(id, MAX_ID_LENGTH, "L'identifiant", errors);
  }

  const region = normalizeRequiredString(payload.region, 'La région', MAX_REGION_LENGTH, errors);
  const delegate = normalizeRequiredString(payload.delegate, 'Le nom du délégué', MAX_DELEGATE_LENGTH, errors);
  const address = normalizeRequiredString(payload.address, "L'adresse", MAX_ADDRESS_LENGTH, errors);
  const website = normalizeWebsite(payload.website, errors);

  const gender = payload.gender;
  if (gender !== 'F' && gender !== 'M') {
    errors.push('Le titre doit être Délégué ou Déléguée');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    delegation: {
      ...(id ? { id } : {}),
      region,
      delegate,
      gender: gender as Gender,
      address,
      ...(website ? { website } : {}),
    },
  };
}
