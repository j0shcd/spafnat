import type { Env } from '../../env';
import { jwtVerify } from 'jose';
import { jsonResponse } from '../../lib/helpers';

/**
 * Middleware for /api/admin/* routes
 * Verifies JWT token and KV session before allowing access
 */
export const onRequest: PagesFunction<Env> = async ({ request, env, next }) => {
  // 1. Extract token from Authorization header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Authentification requise' }, 401);
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  // 2. Verify JWT signature and expiration
  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });

    // 3. Check if session exists in KV (not revoked)
    const jti = payload.jti;
    if (!jti || typeof jti !== 'string') {
      return jsonResponse({ error: 'Token invalide' }, 401);
    }

    const sessionExists = await env.SPAF_KV.get(`session:${jti}`);
    if (!sessionExists) {
      return jsonResponse({ error: 'Session expirée ou révoquée' }, 401);
    }

    // 4. Token valid — proceed to route handler
    return next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return jsonResponse({ error: 'Token invalide ou expiré' }, 401);
  }
};
