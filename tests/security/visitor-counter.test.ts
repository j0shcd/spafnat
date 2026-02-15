/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Env } from '../../functions/env';

// Import the handlers to test
import { onRequestGet, onRequestPost } from '../../functions/api/visit';

/**
 * Security Test Suite for Visitor Counter API
 *
 * Focus: Deduplication, data integrity, error handling
 */

describe('Visitor Counter Security Tests', () => {
  const mockEnv: Env = {
    SPAF_KV: {
      get: vi.fn(),
      put: vi.fn(),
    } as any,
    RESEND_API_KEY: 'test_key',
    CONTACT_RECIPIENT: 'test@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Deduplication', () => {
    it('should count same IP+UserAgent only once per day', async () => {
      // Arrange: Counter starts at 100, no previous visit
      (mockEnv.SPAF_KV.get as any).mockImplementation(async (key: string) => {
        if (key === 'counter:visitors') return '100';
        if (key.startsWith('rate:visit:')) return null; // No previous visit
        return null;
      });

      const request = new Request('http://localhost/api/visit', {
        method: 'POST',
        headers: {
          'CF-Connecting-IP': '1.2.3.4',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
      });

      // Act: First visit increments
      const response1 = await onRequestPost({ request, env: mockEnv } as any);
      const data1 = await response1.json();

      expect(response1.status).toBe(200);
      expect(data1.count).toBe(101);
      expect(data1.incremented).toBe(true);

      // Arrange: Second request with same IP+UA
      (mockEnv.SPAF_KV.get as any).mockImplementation(async (key: string) => {
        if (key === 'counter:visitors') return '101';
        if (key.startsWith('rate:visit:')) return '1'; // Already visited today
        return null;
      });

      // Act: Second visit doesn't increment
      const response2 = await onRequestPost({ request, env: mockEnv } as any);
      const data2 = await response2.json();

      expect(response2.status).toBe(200);
      expect(data2.count).toBe(101); // No increment
      expect(data2.incremented).toBe(false);
    });

    it('should count different User-Agents from same IP separately', async () => {
      // Arrange: Counter starts at 100
      (mockEnv.SPAF_KV.get as any).mockImplementation(async (key: string) => {
        if (key === 'counter:visitors') return '100';
        return null; // No previous visits
      });

      // Act: Visit from laptop
      const laptopRequest = new Request('http://localhost/api/visit', {
        method: 'POST',
        headers: {
          'CF-Connecting-IP': '1.2.3.4',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
        },
      });

      const response1 = await onRequestPost({ request: laptopRequest, env: mockEnv } as any);
      const data1 = await response1.json();

      expect(data1.count).toBe(101);
      expect(data1.incremented).toBe(true);

      // Arrange: Update counter after first increment
      (mockEnv.SPAF_KV.get as any).mockImplementation(async (key: string) => {
        if (key === 'counter:visitors') return '101';
        return null; // Different UA = different hash = no dedup
      });

      // Act: Visit from phone (same IP, different User-Agent)
      const phoneRequest = new Request('http://localhost/api/visit', {
        method: 'POST',
        headers: {
          'CF-Connecting-IP': '1.2.3.4',
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        },
      });

      const response2 = await onRequestPost({ request: phoneRequest, env: mockEnv } as any);
      const data2 = await response2.json();

      expect(data2.count).toBe(102); // Incremented (different UA)
      expect(data2.incremented).toBe(true);
    });
  });

  describe('Data Integrity', () => {
    it('should initialize counter to INITIAL_COUNT when KV is empty', async () => {
      // Arrange: No existing counter in KV
      (mockEnv.SPAF_KV.get as any).mockResolvedValue(null);

      // Act: GET request to read counter
      const response = await onRequestGet({ env: mockEnv } as any);
      const data = await response.json();

      // Expected: Returns INITIAL_COUNT (184161 as of Feb 14, 2026)
      expect(response.status).toBe(200);
      expect(data.count).toBe(184161);
    });

    it('should handle non-numeric values in KV gracefully', async () => {
      // Arrange: Corrupted data in KV
      (mockEnv.SPAF_KV.get as any).mockImplementation(async (key: string) => {
        if (key === 'counter:visitors') return 'not-a-number';
        return null;
      });

      // Act: GET request
      const response = await onRequestGet({ env: mockEnv } as any);
      const data = await response.json();

      // Expected: parseInt('not-a-number') returns NaN, which JSON.stringify converts to null
      expect(response.status).toBe(200);
      expect(data.count).toBe(null); // NaN serializes as null in JSON
    });

    it('should persist increments to KV storage', async () => {
      // Arrange: Counter at 100, no previous visit
      (mockEnv.SPAF_KV.get as any).mockImplementation(async (key: string) => {
        if (key === 'counter:visitors') return '100';
        return null;
      });

      const request = new Request('http://localhost/api/visit', {
        method: 'POST',
        headers: {
          'CF-Connecting-IP': '1.2.3.4',
          'User-Agent': 'Mozilla/5.0',
        },
      });

      // Act: Increment
      await onRequestPost({ request, env: mockEnv } as any);

      // Expected: KV.put called with '101'
      expect(mockEnv.SPAF_KV.put).toHaveBeenCalledWith('counter:visitors', '101');
    });
  });

  describe('KV Storage Failures', () => {
    it('should handle KV read failures gracefully', async () => {
      // Arrange: KV.get throws error
      (mockEnv.SPAF_KV.get as any).mockRejectedValue(new Error('KV Read Error'));

      // Act: GET request
      const response = await onRequestGet({ env: mockEnv } as any);

      // Expected: Should return 500 with error message
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to read count');
    });

    it('should handle KV write failures gracefully', async () => {
      // Arrange: KV.put throws error
      (mockEnv.SPAF_KV.get as any).mockImplementation(async (key: string) => {
        if (key === 'counter:visitors') return '100';
        return null;
      });
      (mockEnv.SPAF_KV.put as any).mockRejectedValue(new Error('KV Write Error'));

      const request = new Request('http://localhost/api/visit', {
        method: 'POST',
        headers: {
          'CF-Connecting-IP': '1.2.3.4',
          'User-Agent': 'Mozilla/5.0',
        },
      });

      // Act: POST request
      const response = await onRequestPost({ request, env: mockEnv } as any);

      // Expected: Should return 500
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to increment count');
    });
  });

  describe('Response Format', () => {
    it('should always return valid JSON with correct Content-Type', async () => {
      // Arrange: Counter exists
      (mockEnv.SPAF_KV.get as any).mockResolvedValue('100');

      // Act: GET request
      const response = await onRequestGet({ env: mockEnv } as any);

      // Expected: Content-Type: application/json
      expect(response.headers.get('Content-Type')).toBe('application/json');

      // Expected: Valid JSON body with { count: number }
      const data = await response.json();
      expect(data).toHaveProperty('count');
      expect(typeof data.count).toBe('number');
    });

    it('should never expose internal errors to client', async () => {
      // Arrange: Simulate internal error
      (mockEnv.SPAF_KV.get as any).mockRejectedValue(new Error('Internal database connection failed with credentials xyz'));

      // Act: GET request
      const response = await onRequestGet({ env: mockEnv } as any);
      const data = await response.json();

      // Expected: Generic error message only
      expect(data.error).toBe('Failed to read count');
      expect(JSON.stringify(data)).not.toContain('credentials');
      expect(JSON.stringify(data)).not.toContain('database');
    });
  });
});
