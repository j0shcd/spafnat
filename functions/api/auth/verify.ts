import type { Env } from '../../env';
import { jwtVerify } from 'jose';
import { jsonResponse } from '../../lib/helpers';

/**
 * GET /api/auth/verify
 * Verifies JWT token validity
 * Checks both JWT signature/expiry and KV session existence
 * Returns { valid: true } if token is valid and session exists
 */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  // 1. Extract token from Authorization header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ valid: false, error: 'Token manquant' }, 401);
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  // 2. Verify JWT signature and expiration
  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });

    // 3. Check if session exists in KV (not revoked)
    const jti = payload.jti;
    if (!jti || typeof jti !== 'string') {
      return jsonResponse({ valid: false, error: 'Token invalide' }, 401);
    }

    const sessionExists = await env.SPAF_KV.get(`session:${jti}`);
    if (!sessionExists) {
      return jsonResponse({ valid: false, error: 'Session révoquée' }, 401);
    }

    return jsonResponse({ valid: true, username: payload.username });
  } catch (error) {
    console.error('Verification error:', error);
    return jsonResponse({ valid: false, error: 'Token invalide ou expiré' }, 401);
  }
};
