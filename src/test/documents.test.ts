import { describe, it, expect } from 'vitest';
import { DOCUMENTS, getAllDocuments } from '../config/documents';

describe('Document Configuration', () => {
  it('has all required document entries', () => {
    expect(DOCUMENTS.bulletinAdhesion).toBeDefined();
    expect(DOCUMENTS.formulaireConfidentialite).toBeDefined();
    expect(DOCUMENTS.inscriptionCongres).toBeDefined();
    expect(DOCUMENTS.extraitRevue).toBeDefined();
    expect(DOCUMENTS.appelPoetes).toBeDefined();
    expect(DOCUMENTS.haikuNadineNajman).toBeDefined();
  });

  it('all documents have required properties', () => {
    const allDocs = getAllDocuments();

    allDocs.forEach((doc) => {
      expect(doc).toHaveProperty('path');
      expect(doc).toHaveProperty('label');
      expect(doc.path).toBeTruthy();
      expect(doc.label).toBeTruthy();
      expect(typeof doc.path).toBe('string');
      expect(typeof doc.label).toBe('string');
    });
  });

  it('all document paths start with /documents/', () => {
    const allDocs = getAllDocuments();

    allDocs.forEach((doc) => {
      expect(doc.path).toMatch(/^\/documents\/.+\.pdf$/);
    });
  });

  it('available property is boolean when present', () => {
    const allDocs = getAllDocuments();

    allDocs.forEach((doc) => {
      if ('available' in doc) {
        expect(typeof doc.available).toBe('boolean');
      }
    });
  });

  it('bulletin d\'adhésion is marked as available', () => {
    expect(DOCUMENTS.bulletinAdhesion.available).toBe(true);
  });
});
