import { describe, it, expect } from 'vitest';
import {
  isPublicMediaR2Key,
  isSafeMediaPath,
  getMediaCacheControl,
} from '../../functions/api/media/[[path]]';

describe('Media Endpoint Key Guardrails', () => {
  it('allows only explicitly public prefixes', () => {
    expect(isPublicMediaR2Key('documents/bulletin_adhesion.pdf')).toBe(true);
    expect(isPublicMediaR2Key('congres/2024/photo.jpg')).toBe(true);
    expect(isPublicMediaR2Key('concours/reglements/reglement-2026.pdf')).toBe(true);
    expect(isPublicMediaR2Key('private/backups/admin.zip')).toBe(false);
    expect(isPublicMediaR2Key('session/secret-token.txt')).toBe(false);
  });

  it('rejects unsafe path traversal segments', () => {
    expect(isSafeMediaPath(['documents', '..', 'passwd'])).toBe(false);
    expect(isSafeMediaPath(['documents', '', 'file.pdf'])).toBe(false);
    expect(isSafeMediaPath(['documents', '.', 'file.pdf'])).toBe(false);
    expect(isSafeMediaPath(['documents', 'folder\\file.pdf'])).toBe(false);
  });

  it('accepts safe paths for expected content', () => {
    expect(isSafeMediaPath(['documents', 'bulletin_adhesion.pdf'])).toBe(true);
    expect(isSafeMediaPath(['congres', '2024', 'photo.jpg'])).toBe(true);
    expect(isSafeMediaPath(['concours', 'palmares-poetique', 'palmares-2025.pdf'])).toBe(true);
  });

  it('disables long-lived caching for mutable PDF keys', () => {
    expect(getMediaCacheControl('documents/extrait_revue.pdf')).toBe('no-cache, no-store, must-revalidate');
    expect(getMediaCacheControl('concours/reglements/reglement-2026.pdf')).toBe('no-cache, no-store, must-revalidate');
  });

  it('keeps caching for static-like media assets', () => {
    expect(getMediaCacheControl('congres/2024/photo-1.jpg')).toBe('public, max-age=86400');
  });
});
