import type { Env } from '../../env';
import { SignJWT } from 'jose';
import { verifyPassword } from '../../lib/password';
import { getClientIP, jsonResponse } from '../../lib/helpers';

const ADMIN_USERNAME = 'admin'; // Single admin account

/**
 * POST /api/auth/login
 * Authenticates admin user with username + password
 * Returns JWT token valid for 24h
 * Rate limited: 5 attempts per 15 minutes per IP (skipped for localhost)
 */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // 1. Check if localhost (skip rate limiting for local dev)
  const origin = request.headers.get('origin') || '';
  const isLocalDev = origin.includes('localhost') || origin.includes('127.0.0.1');

  // 2. Rate limiting — 5 attempts per 15 minutes (production only)
  const ip = getClientIP(request);
  const rateLimitKey = `rate:login:${ip}`;
  let attemptCount = 0;

  if (!isLocalDev) {
    const attempts = await env.SPAF_KV.get(rateLimitKey);
    attemptCount = attempts ? parseInt(attempts, 10) : 0;

    if (attemptCount >= 5) {
      return jsonResponse(
        { error: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.' },
        429
      );
    }
  }

  // 3. Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Corps de requête invalide' }, 400);
  }

  if (typeof body !== 'object' || body === null) {
    return jsonResponse({ error: 'Corps de requête invalide' }, 400);
  }

  const requestBody = body as Record<string, unknown>;

  // 4. Validate input
  if (
    !requestBody.username ||
    typeof requestBody.username !== 'string' ||
    !requestBody.password ||
    typeof requestBody.password !== 'string'
  ) {
    return jsonResponse({ error: 'Nom d\'utilisateur et mot de passe requis' }, 400);
  }

  const { username, password } = requestBody as { username: string; password: string };

  // 5. Verify username
  if (username !== ADMIN_USERNAME) {
    // Increment rate limit counter (production only)
    if (!isLocalDev) {
      await env.SPAF_KV.put(rateLimitKey, (attemptCount + 1).toString(), {
        expirationTtl: 900, // 15 minutes
      });
    }

    return jsonResponse({ error: 'Identifiants invalides' }, 401);
  }

  // 6. Verify password using PBKDF2
  const passwordValid = await verifyPassword(password, env.ADMIN_PASSWORD_HASH);

  if (!passwordValid) {
    // Increment rate limit counter (production only)
    if (!isLocalDev) {
      await env.SPAF_KV.put(rateLimitKey, (attemptCount + 1).toString(), {
        expirationTtl: 900, // 15 minutes
      });
    }

    return jsonResponse({ error: 'Identifiants invalides' }, 401);
  }

  // 7. Generate JWT with jti (session ID)
  const jti = crypto.randomUUID();
  const secret = new TextEncoder().encode(env.JWT_SECRET);

  const token = await new SignJWT({ username })
    .setProtectedHeader({ alg: 'HS256' })
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);

  // 8. Store session in KV for revocation support
  await env.SPAF_KV.put(`session:${jti}`, '1', { expirationTtl: 86400 }); // 24 hours

  // 9. Clear rate limit on successful login (production only)
  if (!isLocalDev) {
    await env.SPAF_KV.delete(rateLimitKey);
  }

  return jsonResponse({ token });
};
