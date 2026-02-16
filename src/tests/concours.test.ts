/**
 * Concours Configuration Tests
 *
 * Tests for concours types and helpers
 */

import { describe, it, expect } from 'vitest';
import {
  CONCOURS_CATEGORIES,
  deriveTitleFromFilename,
  getConcoursKVKey,
  getConcoursR2Prefix,
  type ConcoursCategory,
} from '../config/concours';

describe('Concours Configuration', () => {
  describe('CONCOURS_CATEGORIES', () => {
    it('should have all three required categories', () => {
      expect(CONCOURS_CATEGORIES.reglements).toBeDefined();
      expect(CONCOURS_CATEGORIES['palmares-poetique']).toBeDefined();
      expect(CONCOURS_CATEGORIES['palmares-artistique']).toBeDefined();
    });

    it('should have French labels', () => {
      expect(CONCOURS_CATEGORIES.reglements.label).toBe('Règlements');
      expect(CONCOURS_CATEGORIES['palmares-poetique'].label).toBe('Palmarès Poétique');
      expect(CONCOURS_CATEGORIES['palmares-artistique'].label).toBe('Palmarès Artistique');
    });

    it('should have descriptions for each category', () => {
      Object.values(CONCOURS_CATEGORIES).forEach((cat) => {
        expect(cat.description).toBeTruthy();
        expect(typeof cat.description).toBe('string');
      });
    });
  });

  describe('deriveTitleFromFilename', () => {
    it('should remove PDF extension', () => {
      expect(deriveTitleFromFilename('Concours Normandie 2026.pdf')).toBe('Concours Normandie 2026');
    });

    it('should handle case-insensitive extensions', () => {
      expect(deriveTitleFromFilename('test.PDF')).toBe('test');
    });

    it('should preserve title without extension', () => {
      expect(deriveTitleFromFilename('No Extension')).toBe('No Extension');
    });
  });

  describe('getConcoursKVKey', () => {
    it('should generate correct KV keys', () => {
      expect(getConcoursKVKey('reglements')).toBe('concours:reglements');
      expect(getConcoursKVKey('palmares-poetique')).toBe('concours:palmares-poetique');
      expect(getConcoursKVKey('palmares-artistique')).toBe('concours:palmares-artistique');
    });
  });

  describe('getConcoursR2Prefix', () => {
    it('should generate correct R2 prefixes', () => {
      expect(getConcoursR2Prefix('reglements')).toBe('concours/reglements/');
      expect(getConcoursR2Prefix('palmares-poetique')).toBe('concours/palmares-poetique/');
      expect(getConcoursR2Prefix('palmares-artistique')).toBe('concours/palmares-artistique/');
    });

    it('should end with trailing slash', () => {
      const categories: ConcoursCategory[] = ['reglements', 'palmares-poetique', 'palmares-artistique'];
      categories.forEach((cat) => {
        const prefix = getConcoursR2Prefix(cat);
        expect(prefix.endsWith('/')).toBe(true);
      });
    });
  });
});
