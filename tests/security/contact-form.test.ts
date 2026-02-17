/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Env } from '../../functions/env';

// Import the handler to test
import { onRequestPost } from '../../functions/api/contact';

/**
 * Security Test Suite for Contact Form API
 *
 * Focus: Security vulnerabilities, rate limiting, input validation
 * These tests verify protection against common attack vectors
 */

describe('Contact Form Security Tests', () => {
  // Mock environment for isolated testing
  const mockEnv: Env = {
    SPAF_KV: {
      get: vi.fn(),
      put: vi.fn(),
    } as any,
    RESEND_API_KEY: 'test_api_key',
    CONTACT_RECIPIENT: 'joshua@cohendumani.com',
  };

  // Mock fetch globally
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    delete mockEnv.ALLOWED_ORIGINS;

    // Mock successful Resend API response by default
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'mock-email-id' }),
      text: async () => 'OK',
    } as Response);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('Honeypot Protection', () => {
    it('should silently reject submissions with honeypot field filled', async () => {
      // Arrange: Bot fills the hidden "website" field
      const botPayload = {
        name: 'Bot Name',
        email: 'bot@malicious.com',
        subject: 'Spam Subject',
        message: 'Spam message',
        website: 'https://spam-link.com', // Honeypot filled = bot
      };

      // No rate limit
      (mockEnv.SPAF_KV.get as any).mockResolvedValue(null);

      const request = new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:8080',
        },
        body: JSON.stringify(botPayload),
      });

      // Act: Submit form with honeypot filled
      const response = await onRequestPost({ request, env: mockEnv } as any);
      const data = await response.json();

      // Assert: Should return fake success
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Assert: Should NOT call Resend API (no email sent)
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should process legitimate submissions with empty honeypot', async () => {
      // Arrange: Human user leaves honeypot empty
      const legitimatePayload = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Question',
        message: 'Valid message',
        website: '', // Honeypot empty = human
      };

      // No rate limit
      (mockEnv.SPAF_KV.get as any).mockResolvedValue(null);

      const request = new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:8080',
        },
        body: JSON.stringify(legitimatePayload),
      });

      // Act: Submit form
      const response = await onRequestPost({ request, env: mockEnv } as any);
      const data = await response.json();

      // Expected: Sends email via Resend
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('Rate Limiting', () => {
    it('should block rapid submissions from same IP', async () => {
      // Arrange: First submission succeeds
      const payload = {
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test',
        message: 'Message',
        website: '',
      };

      // No rate limit initially
      (mockEnv.SPAF_KV.get as any).mockResolvedValue(null);

      const request1 = new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:8080',
          'CF-Connecting-IP': '1.2.3.4',
        },
        body: JSON.stringify(payload),
      });

      // Act: First submission
      const response1 = await onRequestPost({ request: request1, env: mockEnv } as any);
      expect(response1.status).toBe(200);

      // Arrange: Second request with rate limit active
      (mockEnv.SPAF_KV.get as any).mockResolvedValue('1'); // Rate limit exists

      const request2 = new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:8080',
          'CF-Connecting-IP': '1.2.3.4',
        },
        body: JSON.stringify(payload),
      });

      // Act: Second submission (should be blocked)
      const response2 = await onRequestPost({ request: request2, env: mockEnv } as any);
      const data2 = await response2.json();

      // Assert: Second request should return 429
      expect(response2.status).toBe(429);
      expect(data2.error).toContain('5 minutes');
    });

    it('should enforce rate limit per IP, not globally', async () => {
      // Arrange: No rate limits
      (mockEnv.SPAF_KV.get as any).mockResolvedValue(null);

      const payload = {
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test',
        message: 'Message',
        website: '',
      };

      // Act: Submit from IP1
      const request1 = new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:8080',
          'CF-Connecting-IP': '1.2.3.4',
        },
        body: JSON.stringify(payload),
      });

      const response1 = await onRequestPost({ request: request1, env: mockEnv } as any);
      expect(response1.status).toBe(200);

      // Act: Submit from IP2 (different IP)
      const request2 = new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:8080',
          'CF-Connecting-IP': '5.6.7.8',
        },
        body: JSON.stringify(payload),
      });

      const response2 = await onRequestPost({ request: request2, env: mockEnv } as any);

      // Expected: Both should succeed (different IPs)
      expect(response2.status).toBe(200);
    });
  });

  describe('Input Validation & Sanitization', () => {
    beforeEach(() => {
      // No rate limit for validation tests
      (mockEnv.SPAF_KV.get as any).mockResolvedValue(null);
    });

    it('should reject names exceeding 200 characters', async () => {
      const payload = {
        name: 'A'.repeat(201), // 201 characters
        email: 'test@example.com',
        subject: 'Test',
        message: 'Message',
        website: '',
      };

      const request = new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:8080',
        },
        body: JSON.stringify(payload),
      });

      const response = await onRequestPost({ request, env: mockEnv } as any);
      const data = await response.json();

      // Expected: 400 error with specific message about name length
      expect(response.status).toBe(400);
      expect(data.details).toContainEqual('Le nom est trop long (max 200 caractères)');
    });

    it('should reject subjects exceeding 300 characters', async () => {
      const payload = {
        name: 'Test',
        email: 'test@example.com',
        subject: 'S'.repeat(301), // 301 characters
        message: 'Message',
        website: '',
      };

      const request = new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:8080',
        },
        body: JSON.stringify(payload),
      });

      const response = await onRequestPost({ request, env: mockEnv } as any);
      const data = await response.json();

      // Expected: 400 error about subject length
      expect(response.status).toBe(400);
      expect(data.details).toContainEqual('Le sujet est trop long (max 300 caractères)');
    });

    it('should reject messages exceeding 5000 characters', async () => {
      const payload = {
        name: 'Test',
        email: 'test@example.com',
        subject: 'Test',
        message: 'M'.repeat(5001), // 5001 characters
        website: '',
      };

      const request = new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:8080',
        },
        body: JSON.stringify(payload),
      });

      const response = await onRequestPost({ request, env: mockEnv } as any);
      const data = await response.json();

      // Expected: 400 error about message length
      expect(response.status).toBe(400);
      expect(data.details).toContainEqual('Le message est trop long (max 5000 caractères)');
    });

    it('should reject invalid email formats', async () => {
      const invalidEmails = [
        'not-an-email',
        '@example.com',
        'user@',
      ];

      for (const email of invalidEmails) {
        const payload = {
          name: 'Test',
          email,
          subject: 'Test',
          message: 'Message',
          website: '',
        };

        const request = new Request('http://localhost/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'http://localhost:8080',
          },
          body: JSON.stringify(payload),
        });

        const response = await onRequestPost({ request, env: mockEnv } as any);
        const data = await response.json();

        // Expected: 400 error about invalid email
        expect(response.status).toBe(400);
        expect(data.details).toContain('L\'adresse email est invalide');
      }
    });

    it('should handle XSS attempts by escaping HTML in email', async () => {
      // Arrange: XSS payload
      const xssPayload = '<script>alert("xss")</script>';
      const payload = {
        name: xssPayload,
        email: 'test@example.com',
        subject: xssPayload,
        message: xssPayload,
        website: '',
      };

      const request = new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:8080',
        },
        body: JSON.stringify(payload),
      });

      const response = await onRequestPost({ request, env: mockEnv } as any);

      // Expected: Should accept but escape HTML in email
      expect(response.status).toBe(200);

      // Check that fetch was called with escaped HTML
      const fetchCall = (global.fetch as any).mock.calls[0];
      const emailBody = JSON.parse(fetchCall[1].body);

      // The HTML should be escaped (no raw script tags)
      expect(emailBody.html).not.toContain('<script>');
      expect(emailBody.html).toContain('&lt;script&gt;');
    });

    it('should reject missing required fields', async () => {
      const incompletePayloads = [
        { email: 'test@example.com', subject: 'Test', message: 'Msg' }, // Missing name
        { name: 'Test', subject: 'Test', message: 'Msg' }, // Missing email
        { name: 'Test', email: 'test@example.com', message: 'Msg' }, // Missing subject
        { name: 'Test', email: 'test@example.com', subject: 'Test' }, // Missing message
      ];

      for (const payload of incompletePayloads) {
        const request = new Request('http://localhost/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'http://localhost:8080',
          },
          body: JSON.stringify(payload),
        });

        const response = await onRequestPost({ request, env: mockEnv } as any);

        // Expected: 400 error with specific missing field message
        expect(response.status).toBe(400);
      }
    });
  });

  describe('Origin Validation', () => {
    it('should accept requests from localhost (development)', async () => {
      const payload = {
        name: 'Test',
        email: 'test@example.com',
        subject: 'Test',
        message: 'Message',
        website: '',
      };

      (mockEnv.SPAF_KV.get as any).mockResolvedValue(null);

      const request = new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:8080',
        },
        body: JSON.stringify(payload),
      });

      const response = await onRequestPost({ request, env: mockEnv } as any);

      // Expected: Should accept
      expect(response.status).toBe(200);
    });

    it('should accept requests from Cloudflare Pages preview', async () => {
      const payload = {
        name: 'Test',
        email: 'test@example.com',
        subject: 'Test',
        message: 'Message',
        website: '',
      };

      (mockEnv.SPAF_KV.get as any).mockResolvedValue(null);

      const request = new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://abc123.spafnat.pages.dev',
        },
        body: JSON.stringify(payload),
      });

      const response = await onRequestPost({ request, env: mockEnv } as any);

      // Expected: Should accept
      expect(response.status).toBe(200);
    });

    it('should reject requests from unauthorized origins', async () => {
      const payload = {
        name: 'Test',
        email: 'test@example.com',
        subject: 'Test',
        message: 'Message',
        website: '',
      };

      const maliciousOrigins = [
        'https://evil.com',
        'https://spafnat.com.evil.com', // Subdomain attack
      ];

      for (const origin of maliciousOrigins) {
        const request = new Request('http://localhost/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': origin,
          },
          body: JSON.stringify(payload),
        });

        const response = await onRequestPost({ request, env: mockEnv } as any);

        // Expected: 403 Forbidden
        expect(response.status).toBe(403);
      }
    });

    it('should enforce explicit production allowlist when configured', async () => {
      mockEnv.ALLOWED_ORIGINS = 'https://spafnat.com,https://www.spafnat.com';
      (mockEnv.SPAF_KV.get as any).mockResolvedValue(null);

      const payload = {
        name: 'Test',
        email: 'test@example.com',
        subject: 'Test',
        message: 'Message',
        website: '',
      };

      const blockedRequest = new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://abc123.spafnat.pages.dev',
        },
        body: JSON.stringify(payload),
      });

      const blockedResponse = await onRequestPost({ request: blockedRequest, env: mockEnv } as any);
      expect(blockedResponse.status).toBe(403);

      const allowedRequest = new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://spafnat.com',
        },
        body: JSON.stringify(payload),
      });

      const allowedResponse = await onRequestPost({ request: allowedRequest, env: mockEnv } as any);
      expect(allowedResponse.status).toBe(200);
    });

    it('should support wildcard subdomain entries in allowlist', async () => {
      mockEnv.ALLOWED_ORIGINS = '*.spafnat.pages.dev';
      (mockEnv.SPAF_KV.get as any).mockResolvedValue(null);

      const payload = {
        name: 'Test',
        email: 'test@example.com',
        subject: 'Test',
        message: 'Message',
        website: '',
      };

      const request = new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://preview-123.spafnat.pages.dev',
        },
        body: JSON.stringify(payload),
      });

      const response = await onRequestPost({ request, env: mockEnv } as any);
      expect(response.status).toBe(200);
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const request = new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:8080',
        },
        body: 'this is not valid JSON{',
      });

      const response = await onRequestPost({ request, env: mockEnv } as any);

      // Expected: 400 error, not 500
      expect(response.status).toBe(400);
    });

    it('should handle Resend API failures gracefully', async () => {
      // Arrange: Resend API returns error
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      } as Response);

      const payload = {
        name: 'Test',
        email: 'test@example.com',
        subject: 'Test',
        message: 'Message',
        website: '',
      };

      (mockEnv.SPAF_KV.get as any).mockResolvedValue(null);

      const request = new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:8080',
        },
        body: JSON.stringify(payload),
      });

      const response = await onRequestPost({ request, env: mockEnv } as any);
      const data = await response.json();

      // Expected: Should return 500 to client with generic error
      expect(response.status).toBe(500);
      expect(data.error).toBe('Échec de l\'envoi du message. Veuillez réessayer.');
    });
  });
});
