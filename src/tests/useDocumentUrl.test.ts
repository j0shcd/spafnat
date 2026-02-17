import { describe, expect, it } from 'vitest';
import { parseMediaHeadMetadata } from '@/hooks/useDocumentUrl';

describe('parseMediaHeadMetadata', () => {
  it('decodes UTF-8 filenames from encoded header', () => {
    const headers = new Headers({
      'X-Original-Filename-Encoded': encodeURIComponent('appel à poètes.pdf'),
      'X-Uploaded-At': '2026-02-17T10:00:00.000Z',
    });

    const metadata = parseMediaHeadMetadata(headers);
    expect(metadata.originalFilename).toBe('appel à poètes.pdf');
    expect(metadata.versionToken).toBe('2026-02-17T10:00:00.000Z');
  });

  it('falls back to plain header when encoded value is missing', () => {
    const headers = new Headers({
      'X-Original-Filename': 'extrait_revue.pdf',
    });

    const metadata = parseMediaHeadMetadata(headers);
    expect(metadata.originalFilename).toBe('extrait_revue.pdf');
    expect(metadata.versionToken).toBeNull();
  });
});
