import { describe, it, expect, vi } from 'vitest';
import { verifyPassword, hashPassword } from '../../functions/lib/password';
import { isLocalRequest, onRequestPost as loginHandler } from '../../functions/api/auth/login';

type LoginHandlerContext = Parameters<typeof loginHandler>[0];

/**
 * Phase 3a Auth Tests
 * Tests for authentication system (PBKDF2, JWT, rate limiting)
 */

describe('Password Hashing (PBKDF2)', () => {
  it('should hash and verify password correctly', async () => {
    const password = 'test-password-123';
    const hash = await hashPassword(password);

    // Hash should be in "salt:hash" format
    expect(hash).toContain(':');
    const parts = hash.split(':');
    expect(parts).toHaveLength(2);

    // Verify correct password
    const valid = await verifyPassword(password, hash);
    expect(valid).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const password = 'correct-password';
    const hash = await hashPassword(password);

    const valid = await verifyPassword('wrong-password', hash);
    expect(valid).toBe(false);
  });

  it('should generate different salts for same password', async () => {
    const password = 'same-password';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    // Hashes should be different (different salts)
    expect(hash1).not.toBe(hash2);

    // But both should verify the same password
    expect(await verifyPassword(password, hash1)).toBe(true);
    expect(await verifyPassword(password, hash2)).toBe(true);
  });

  it('should handle invalid hash format gracefully', async () => {
    const valid = await verifyPassword('password', 'invalid-hash-format');
    expect(valid).toBe(false);
  });

  it('should handle empty password', async () => {
    const hash = await hashPassword('');
    const valid = await verifyPassword('', hash);
    expect(valid).toBe(true);
  });
});

describe('Login Rate Limit Environment Detection', () => {
  it('treats localhost URL as local development', () => {
    expect(isLocalRequest('http://localhost:8788/api/auth/login')).toBe(true);
    expect(isLocalRequest('http://127.0.0.1:8788/api/auth/login')).toBe(true);
  });

  it('does not trust spoofed Origin-like values in production URLs', () => {
    expect(isLocalRequest('https://spafnat.pages.dev/api/auth/login')).toBe(false);
    expect(isLocalRequest('https://spafnat.com/api/auth/login')).toBe(false);
  });
});

describe('Login Endpoint Security', () => {
  it('enforces production rate limits even when Origin header looks local', async () => {
    const passwordHash = await hashPassword('admin123');
    const env = {
      JWT_SECRET: 'test-secret',
      ADMIN_PASSWORD_HASH: passwordHash,
      SPAF_KV: {
        get: vi.fn().mockResolvedValue('5'),
        put: vi.fn(),
        delete: vi.fn(),
      },
    };

    const request = new Request('https://spafnat.pages.dev/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:8080',
        'CF-Connecting-IP': '203.0.113.1',
      },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });

    const response = await loginHandler({ request, env } as unknown as LoginHandlerContext);
    expect(response.status).toBe(429);
  });

  it('keeps localhost workflow usable without rate-limit lockout', async () => {
    const passwordHash = await hashPassword('admin123');
    const env = {
      JWT_SECRET: 'test-secret',
      ADMIN_PASSWORD_HASH: passwordHash,
      SPAF_KV: {
        get: vi.fn().mockResolvedValue('5'),
        put: vi.fn(),
        delete: vi.fn(),
      },
    };

    const request = new Request('http://localhost:8788/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '127.0.0.1',
      },
      body: JSON.stringify({ username: 'admin', password: 'wrong-password' }),
    });

    const response = await loginHandler({ request, env } as unknown as LoginHandlerContext);
    expect(response.status).toBe(401);
    expect(env.SPAF_KV.get).not.toHaveBeenCalled();
    expect(env.SPAF_KV.put).not.toHaveBeenCalled();
  });
});

/**
 * NOTE: Full integration tests for login/logout/verify endpoints
 * require live server with wrangler dev. These unit tests cover
 * the password hashing logic and login rate-limit behavior.
 *
 * For integration testing:
 * 1. Run: npx wrangler pages dev dist --kv SPAF_KV --r2 SPAF_MEDIA
 * 2. POST /api/auth/login with { username: "admin", password: "..." }
 * 3. Use returned token to test protected /api/admin/* routes
 * 4. POST /api/auth/logout to revoke session
 * 5. Verify token no longer works after logout
 */
