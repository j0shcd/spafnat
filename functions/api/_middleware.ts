import type { Env } from '../env';
import { jsonResponse } from '../lib/helpers';
import { SECURITY_HEADERS } from '../lib/security-headers';

/** Covers every API route, including errors and responses from the admin auth middleware. */
export const onRequest: PagesFunction<Env> = async ({ request, next }) => {
  let response: Response;
  try {
    response = await next();
  } catch (error) {
    console.error('API request failed:', error);
    response = jsonResponse({ error: 'Erreur interne' }, 500);
  }
  const secured = new Response(response.body, response);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) secured.headers.set(name, value);
  const path = new URL(request.url).pathname;
  if (path.startsWith('/api/auth/') || path.startsWith('/api/admin/')) {
    secured.headers.set('Cache-Control', 'no-store');
  }
  return secured;
};
