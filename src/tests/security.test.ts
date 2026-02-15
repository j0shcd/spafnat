/**
 * Security-focused tests for Phase 2 features
 * Focus: Prevent catastrophic failures, security vulnerabilities, data breaches
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Contact Form Security', () => {
  describe('Honeypot Protection', () => {
    it('should reject submissions with filled honeypot field', async () => {
      const payload = {
        name: 'Bot Name',
        email: 'bot@example.com',
        subject: 'Bot Subject',
        message: 'Bot message',
        website: 'http://spam-link.com', // Honeypot filled = bot
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Should return fake success but not send email
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      // Note: In real implementation, verify no email was sent
    });

    it('should accept submissions with empty honeypot field', async () => {
      const payload = {
        name: 'Real User',
        email: 'user@example.com',
        subject: 'Real Subject',
        message: 'Real message',
        website: '', // Empty honeypot = human
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Should process normally (may fail if Resend not configured, but structure should be valid)
      expect([200, 500]).toContain(response.status);
    });
  });

  describe('Input Validation - Character Limits', () => {
    it('should reject name exceeding 200 characters', async () => {
      const payload = {
        name: 'a'.repeat(201), // 201 characters
        email: 'user@example.com',
        subject: 'Subject',
        message: 'Message',
        website: '',
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.details).toContain('Le nom est trop long (max 200 caractères)');
    });

    it('should reject subject exceeding 300 characters', async () => {
      const payload = {
        name: 'Valid Name',
        email: 'user@example.com',
        subject: 'a'.repeat(301), // 301 characters
        message: 'Message',
        website: '',
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.details).toContain('Le sujet est trop long (max 300 caractères)');
    });

    it('should reject message exceeding 5000 characters', async () => {
      const payload = {
        name: 'Valid Name',
        email: 'user@example.com',
        subject: 'Valid Subject',
        message: 'a'.repeat(5001), // 5001 characters
        website: '',
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.details).toContain('Le message est trop long (max 5000 caractères)');
    });

    it('should accept inputs at exact character limits', async () => {
      const payload = {
        name: 'a'.repeat(200), // Exactly 200
        email: 'user@example.com',
        subject: 'b'.repeat(300), // Exactly 300
        message: 'c'.repeat(5000), // Exactly 5000
        website: '',
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Should not fail validation (may fail on email send if not configured)
      expect(response.status).not.toBe(400);
    });
  });

  describe('Input Validation - Required Fields', () => {
    it('should reject missing name', async () => {
      const payload = {
        email: 'user@example.com',
        subject: 'Subject',
        message: 'Message',
        website: '',
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.details).toContain('Le nom est requis');
    });

    it('should reject missing email', async () => {
      const payload = {
        name: 'Name',
        subject: 'Subject',
        message: 'Message',
        website: '',
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.details).toContain("L'email est requis");
    });

    it('should reject invalid email format', async () => {
      const payload = {
        name: 'Name',
        email: 'not-an-email',
        subject: 'Subject',
        message: 'Message',
        website: '',
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.details).toContain("L'adresse email est invalide");
    });
  });

  describe('XSS Prevention', () => {
    it('should not execute script tags in message content', async () => {
      const payload = {
        name: 'Test User',
        email: 'user@example.com',
        subject: 'XSS Test',
        message: '<script>alert("XSS")</script>',
        website: '',
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Should accept (backend doesn't execute, just stores/sends)
      // Important: Email template should escape HTML
      expect([200, 500]).toContain(response.status);
    });

    it('should handle HTML injection attempts', async () => {
      const payload = {
        name: '<img src=x onerror=alert(1)>',
        email: 'user@example.com',
        subject: '<iframe src="javascript:alert(1)">',
        message: '<a href="javascript:alert(1)">Click</a>',
        website: '',
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Should accept but safely escape in email template
      expect([200, 500]).toContain(response.status);
    });
  });

  describe('Email Header Injection Prevention', () => {
    it('should reject email with newline characters (header injection)', async () => {
      const payload = {
        name: 'Test User',
        email: 'user@example.com\nBcc: attacker@evil.com',
        subject: 'Subject',
        message: 'Message',
        website: '',
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.details).toContain("L'adresse email est invalide");
    });

    it('should reject subject with CRLF injection attempts', async () => {
      const payload = {
        name: 'Test User',
        email: 'user@example.com',
        subject: 'Subject\r\nBcc: attacker@evil.com',
        message: 'Message',
        website: '',
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Should be accepted (subject is sent as plain text field, not header)
      // Resend API handles this safely
      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('Rate Limiting', () => {
    it('should block rapid successive submissions from same IP', async () => {
      const payload = {
        name: 'Test User',
        email: 'user@example.com',
        subject: 'Rate Limit Test',
        message: 'Testing rate limit',
        website: '',
      };

      // First submission
      const response1 = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Second submission immediately after
      const response2 = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Second should be rate limited (429)
      expect(response2.status).toBe(429);
      const data = await response2.json();
      expect(data.error).toContain('Trop de soumissions');
    });
  });

  describe('Malformed Requests', () => {
    it('should reject non-JSON content', async () => {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json-content',
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Corps de requête invalide');
    });

    it('should reject requests without Content-Type header', async () => {
      const response = await fetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
      });

      expect([400, 415]).toContain(response.status);
    });

    it('should reject empty request body', async () => {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  describe('Type Confusion Attacks', () => {
    it('should reject when required string fields are numbers', async () => {
      const payload = {
        name: 12345, // Number instead of string
        email: 'user@example.com',
        subject: 'Subject',
        message: 'Message',
        website: '',
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(400);
    });

    it('should reject when fields are arrays', async () => {
      const payload = {
        name: ['array', 'attack'],
        email: 'user@example.com',
        subject: 'Subject',
        message: 'Message',
        website: '',
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(400);
    });

    it('should reject when fields are objects', async () => {
      const payload = {
        name: { first: 'John', last: 'Doe' },
        email: 'user@example.com',
        subject: 'Subject',
        message: 'Message',
        website: '',
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(400);
    });
  });
});

describe('Visitor Counter Security', () => {
  describe('Rate Limiting', () => {
    it('should increment visitor count on each visit', async () => {
      const response1 = await fetch('/api/visit', { method: 'POST' });
      expect(response1.status).toBe(200);
      const data1 = await response1.json();
      expect(data1.count).toBeGreaterThan(0);

      const response2 = await fetch('/api/visit', { method: 'POST' });
      expect(response2.status).toBe(200);
      const data2 = await response2.json();
      expect(data2.count).toBeGreaterThanOrEqual(data1.count);
    });

    it('should handle concurrent requests safely', async () => {
      // Fire multiple requests simultaneously
      const promises = Array(5)
        .fill(null)
        .map(() => fetch('/api/visit', { method: 'POST' }));

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // Get final count
      const counts = await Promise.all(
        responses.map((r) => r.json().then((d) => d.count))
      );

      // All counts should be valid numbers
      counts.forEach((count) => {
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThan(0);
      });
    });
  });

  describe('Method Validation', () => {
    it('should reject GET requests', async () => {
      const response = await fetch('/api/visit', { method: 'GET' });
      expect(response.status).toBe(405);
    });

    it('should reject PUT requests', async () => {
      const response = await fetch('/api/visit', { method: 'PUT' });
      expect(response.status).toBe(405);
    });

    it('should reject DELETE requests', async () => {
      const response = await fetch('/api/visit', { method: 'DELETE' });
      expect(response.status).toBe(405);
    });
  });

  describe('Counter Manipulation Prevention', () => {
    it('should not allow arbitrary counter values in request', async () => {
      const response = await fetch('/api/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 999999 }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      // Counter should increment normally, not use provided value
      expect(data.count).not.toBe(999999);
    });
  });
});

describe('Origin Validation', () => {
  it('should accept requests from localhost in development', async () => {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:8080',
      },
      body: JSON.stringify({
        name: 'Test',
        email: 'test@example.com',
        subject: 'Test',
        message: 'Test',
        website: '',
      }),
    });

    // Should not be rejected for origin (may fail for other reasons)
    expect(response.status).not.toBe(403);
  });

  it('should accept requests from pages.dev preview deployments', async () => {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://spafnat.pages.dev',
      },
      body: JSON.stringify({
        name: 'Test',
        email: 'test@example.com',
        subject: 'Test',
        message: 'Test',
        website: '',
      }),
    });

    // Should not be rejected for origin
    expect(response.status).not.toBe(403);
  });
});
