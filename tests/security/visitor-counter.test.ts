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
    vi.mocked(mockEnv.SPAF_KV.put).mockReset().mockResolvedValue(undefined);
  });

  const createGetRequest = () =>
    new Request('http://localhost/api/visit', {
      method: 'GET',
    });

  async function hashIpForToday(ip: string): Promise<string> {
    const today = new Date().toISOString().split('T')[0];
    const data = new TextEncoder().encode(`${ip}:${today}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  async function findIpBySamplingRate(rate: number, shouldBeSampled: boolean): Promise<string> {
    const threshold = Math.floor(rate * 10_000);

    for (let i = 1; i <= 4096; i += 1) {
      const octet3 = Math.floor(i / 256) % 256;
      const octet4 = i % 256;
      const candidateIp = `10.20.${octet3}.${octet4}`;
      const hash = await hashIpForToday(candidateIp);
      const bucket = Number.parseInt(hash.slice(0, 8), 16) % 10_000;
      const sampled = bucket < threshold;

      if (sampled === shouldBeSampled) {
        return candidateIp;
      }
    }

    throw new Error(`Unable to find IP for sampling state=${shouldBeSampled}`);
  }

  describe('Deduplication', () => {
    it('persists one daily visit per IP even when its User-Agent changes', async () => {
      const values = new Map<string, string>([['counter:visitors', '100']]);
      vi.mocked(mockEnv.SPAF_KV.get).mockImplementation(async key => values.get(key) ?? null);
      vi.mocked(mockEnv.SPAF_KV.put).mockImplementation(async (key, value) => {
        values.set(key, value as string);
      });
      const visit = async (ip: string, userAgent: string) => {
        const response = await onRequestPost({
          request: new Request('http://localhost/api/visit', {
            method: 'POST', headers: { 'CF-Connecting-IP': ip, 'User-Agent': userAgent },
          }), env: mockEnv,
        } as Parameters<typeof onRequestPost>[0]);
        expect(response.status).toBe(200);
        return response.json();
      };

      expect(await visit('203.0.113.1', 'Mozilla/5.0 Chrome')).toMatchObject({ count: 101, incremented: true });
      expect(await visit('203.0.113.1', 'Mozilla/5.0 Safari')).toMatchObject({ count: 101, incremented: false });
      expect(await visit('203.0.113.2', 'Mozilla/5.0 Safari')).toMatchObject({ count: 102, incremented: true });
      expect(values.get('counter:visitors')).toBe('102');
    });

    it('should not count known bot user agents', async () => {
      (mockEnv.SPAF_KV.get as any).mockImplementation(async (key: string) => {
        if (key === 'counter:visitors') return '100';
        return null;
      });

      const botRequest = new Request('http://localhost/api/visit', {
        method: 'POST',
        headers: {
          'CF-Connecting-IP': '1.2.3.4',
          'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)',
        },
      });

      const response = await onRequestPost({ request: botRequest, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.count).toBe(100);
      expect(data.incremented).toBe(false);
      expect(mockEnv.SPAF_KV.put).not.toHaveBeenCalled();
    });
  });

  describe('Data Integrity', () => {
    it('should initialize counter to INITIAL_COUNT when KV is empty', async () => {
      // Arrange: No existing counter in KV
      (mockEnv.SPAF_KV.get as any).mockResolvedValue(null);

      // Act: GET request to read counter
      const response = await onRequestGet({ request: createGetRequest(), env: mockEnv } as any);
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
      const response = await onRequestGet({ request: createGetRequest(), env: mockEnv } as any);
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

    it('should apply weighted sampling above daily threshold when visitor is sampled', async () => {
      const sampledIp = await findIpBySamplingRate(0.25, true);

      (mockEnv.SPAF_KV.get as any).mockImplementation(async (key: string) => {
        if (key === 'counter:visitors') return '100';
        if (key.startsWith('counter:visitors:daily-estimate:')) return '350';
        if (key.startsWith('rate:visit:')) return null;
        return null;
      });

      const request = new Request('http://localhost/api/visit', {
        method: 'POST',
        headers: {
          'CF-Connecting-IP': sampledIp,
          'User-Agent': 'Mozilla/5.0',
        },
      });

      const response = await onRequestPost({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.count).toBe(104);
      expect(data.incremented).toBe(true);
      expect(data.estimated).toBe(true);
      expect(data.sampleRate).toBe(0.25);
      expect(data.incrementBy).toBe(4);
      expect(mockEnv.SPAF_KV.put).toHaveBeenCalledWith('counter:visitors', '104');
    });

    it('should skip increments above daily threshold when visitor is not sampled', async () => {
      const unsampledIp = await findIpBySamplingRate(0.25, false);

      (mockEnv.SPAF_KV.get as any).mockImplementation(async (key: string) => {
        if (key === 'counter:visitors') return '100';
        if (key.startsWith('counter:visitors:daily-estimate:')) return '350';
        if (key.startsWith('rate:visit:')) return null;
        return null;
      });

      const request = new Request('http://localhost/api/visit', {
        method: 'POST',
        headers: {
          'CF-Connecting-IP': unsampledIp,
          'User-Agent': 'Mozilla/5.0',
        },
      });

      const response = await onRequestPost({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.count).toBe(100);
      expect(data.incremented).toBe(false);
      expect(data.estimated).toBe(true);
      expect(mockEnv.SPAF_KV.put).not.toHaveBeenCalled();
    });
  });

  describe('KV Storage Failures', () => {
    it('should handle KV read failures gracefully', async () => {
      // Arrange: KV.get throws error
      (mockEnv.SPAF_KV.get as any).mockRejectedValue(new Error('KV Read Error'));

      // Act: GET request
      const response = await onRequestGet({ request: createGetRequest(), env: mockEnv } as any);

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
      const response = await onRequestGet({ request: createGetRequest(), env: mockEnv } as any);

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
      const response = await onRequestGet({ request: createGetRequest(), env: mockEnv } as any);
      const data = await response.json();

      // Expected: Generic error message only
      expect(data.error).toBe('Failed to read count');
      expect(JSON.stringify(data)).not.toContain('credentials');
      expect(JSON.stringify(data)).not.toContain('database');
    });
  });
});
