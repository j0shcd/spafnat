/**
 * Concours Configuration
 *
 * Defines the three categories of concours documents and their metadata.
 * Each category is stored as an ordered list in KV.
 */

export type ConcoursCategory = 'reglements' | 'palmares-poetique' | 'palmares-artistique';

export interface ConcoursItem {
  r2Key: string;          // R2 storage key (e.g., "concours/reglements/normandie-2026.pdf")
  title: string;          // Display title (auto-derived from filename)
  originalFilename: string; // Original uploaded filename
  uploadedAt: string;     // ISO timestamp
  size: number;           // File size in bytes
}

export const CONCOURS_CATEGORIES: Record<ConcoursCategory, {
  label: string;
  description: string;
}> = {
  'reglements': {
    label: 'Règlements',
    description: 'Règlements des concours en cours',
  },
  'palmares-poetique': {
    label: 'Palmarès Poétique',
    description: 'Palmarès des concours de poésie',
  },
  'palmares-artistique': {
    label: 'Palmarès Artistique',
    description: 'Palmarès des concours artistiques',
  },
} as const;

/**
 * Derive title from filename
 * Example: "Concours Normandie 2026.pdf" → "Concours Normandie 2026"
 */
export function deriveTitleFromFilename(filename: string): string {
  // Remove extension
  const title = filename.replace(/\.[^.]+$/, '');
  return title;
}

/**
 * Get KV key for a concours category
 */
export function getConcoursKVKey(category: ConcoursCategory): string {
  return `concours:${category}`;
}

/**
 * Get R2 key prefix for a concours category
 */
export function getConcoursR2Prefix(category: ConcoursCategory): string {
  return `concours/${category}/`;
}
