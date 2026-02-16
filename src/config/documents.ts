/**
 * Centralized Document Configuration
 *
 * Single source of truth for all downloadable PDFs on the SPAF website.
 * All pages import from here to ensure consistency.
 *
 * In Phase 3, these paths will be checked against R2 first with local fallback.
 */

export interface Document {
  path: string;
  label: string;
  available?: boolean; // If false, button shows "Bientôt disponible" and is disabled
}

export const DOCUMENTS = {
  // Membership & General Documents
  bulletinAdhesion: {
    path: "/documents/bulletin_adhesion.pdf",
    label: "Bulletin d'adhésion",
    available: true,
  },

  formulaireConfidentialite: {
    path: "/documents/formulaire_confidentialite.pdf",
    label: "Formulaire de confidentialité",
    available: false, // To be provided
  },

  // Congrès (Congress)
  inscriptionCongres: {
    path: "/documents/inscription_congres.pdf",
    label: "Inscription Congrès",
    available: false, // To be provided
  },

  // Revue (Magazine)
  extraitRevue: {
    path: "/documents/extrait_revue.pdf",
    label: "Extrait de la Revue",
    available: false, // To be provided
  },

  // Index page documents (miscellaneous downloads)
  appelPoetes: {
    path: "/documents/appel_poetes.pdf",
    label: "Appel à poètes",
    available: true, 
  },

  haikuNadineNajman: {
    path: "/documents/haiku_nadine_najman.pdf",
    label: "Haïku de Nadine Najman",
    available: true, 
  },
} as const;

/**
 * Helper function to get a document by key
 */
export function getDocument(key: keyof typeof DOCUMENTS): Document {
  return DOCUMENTS[key];
}

/**
 * Helper function to get all available documents
 */
export function getAvailableDocuments(): Document[] {
  return Object.values(DOCUMENTS).filter(doc => doc.available);
}

/**
 * Helper function to get all documents (including unavailable ones)
 */
export function getAllDocuments(): Document[] {
  return Object.values(DOCUMENTS);
}
