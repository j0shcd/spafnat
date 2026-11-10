import { it, expect } from 'vitest';
import { getAllDocuments } from '../config/documents';

it('all document paths start with /documents/', () => {
  const allDocs = getAllDocuments();

  allDocs.forEach((doc) => {
    expect(doc.path).toMatch(/^\/documents\/.+\.pdf$/);
  });
});
