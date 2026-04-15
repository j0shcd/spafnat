import { getClientIP, isLocalRequestUrl, jsonResponse } from './helpers';

interface EnvWithKV {
  SPAF_KV: KVNamespace;
}

interface IpRateLimitOptions {
  request: Request;
  env: EnvWithKV;
  scope: string;
  limit: number;
  windowSeconds: number;
  skipLocalhost?: boolean;
  errorMessage?: string;
}

/**
 * Basic IP rate limiting using KV.
 * This is a best-effort baseline to reduce app-layer abuse pressure.
 */
export async function enforceIpRateLimit(options: IpRateLimitOptions): Promise<Response | null> {
  const {
    request,
    env,
    scope,
    limit,
    windowSeconds,
    skipLocalhost = true,
    errorMessage = 'Trop de requêtes. Veuillez réessayer dans quelques instants.',
  } = options;

  if (skipLocalhost && isLocalRequestUrl(request.url)) {
    return null;
  }

  const ip = getClientIP(request);
  const rateLimitKey = `ratelimit:${scope}:${ip}`;

  const current = await env.SPAF_KV.get(rateLimitKey);
  const parsedCount = current ? Number.parseInt(current, 10) : 0;
  const requestCount = Number.isFinite(parsedCount) && parsedCount > 0 ? parsedCount : 0;

  if (requestCount >= limit) {
    return jsonResponse(
      { error: errorMessage },
      429,
      {
        'Retry-After': windowSeconds.toString(),
      }
    );
  }

  await env.SPAF_KV.put(rateLimitKey, (requestCount + 1).toString(), {
    expirationTtl: windowSeconds,
  });

  return null;
}
