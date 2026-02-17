import type { Env } from '../../env';
import { jwtVerify } from 'jose';
import { jsonResponse } from '../../lib/helpers';

/**
 * POST /api/auth/logout
 * Revokes JWT session by deleting session from KV
 * Requires valid JWT in Authorization header
 */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // 1. Extract token from Authorization header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Token manquant' }, 401);
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  // 2. Verify JWT
  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });

    // 3. Delete session from KV
    const jti = payload.jti;
    if (jti && typeof jti === 'string') {
      await env.SPAF_KV.delete(`session:${jti}`);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return jsonResponse({ error: 'Token invalide' }, 401);
  }
};
