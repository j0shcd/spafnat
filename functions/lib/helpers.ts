/**
 * Shared helper utilities for Cloudflare Pages Functions
 */

/**
 * Get client IP address with fallback chain
 * Cloudflare provides CF-Connecting-IP, fallback to x-forwarded-for for local dev
 */
export function getClientIP(request: Request): string {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'localhost'
  );
}

export function isLocalRequestUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

function normalizeOrigin(origin: string): string | null {
  try {
    return new URL(origin).origin.toLowerCase();
  } catch {
    return null;
  }
}

function parseAllowedOrigins(allowedOrigins: string): string[] {
  return allowedOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

function matchesAllowedOrigin(origin: string, allowedOrigin: string): boolean {
  const normalizedAllowed = allowedOrigin.toLowerCase();
  const normalizedOrigin = normalizeOrigin(origin);
  if (!normalizedOrigin) return false;

  // Entry format: "*.spafnat.com" (subdomains only)
  if (normalizedAllowed.startsWith('*.')) {
    try {
      const hostname = new URL(normalizedOrigin).hostname;
      const suffix = normalizedAllowed.slice(1); // ".spafnat.com"
      return hostname.endsWith(suffix) && hostname !== suffix.slice(1);
    } catch {
      return false;
    }
  }

  // Entry format: full origin (https://spafnat.com)
  if (normalizedAllowed.includes('://')) {
    const allowedFullOrigin = normalizeOrigin(normalizedAllowed);
    return allowedFullOrigin !== null && normalizedOrigin === allowedFullOrigin;
  }

  // Entry format: bare hostname (spafnat.com)
  try {
    const hostname = new URL(normalizedOrigin).hostname;
    return hostname === normalizedAllowed;
  } catch {
    return false;
  }
}

/** Validate contact origins; ALLOWED_ORIGINS can restrict preview and production separately. */
export function isValidOrigin(origin: string | null, allowedOrigins?: string): boolean {
  if (!origin) return true; // Some clients omit Origin header

  // If explicit allowlist is configured, enforce it strictly.
  if (allowedOrigins && allowedOrigins.trim().length > 0) {
    const configuredOrigins = parseAllowedOrigins(allowedOrigins);
    if (configuredOrigins.length === 0) return false;

    return configuredOrigins.some((entry) => matchesAllowedOrigin(origin, entry));
  }

  try {
    const url = new URL(origin);
    const hostname = url.hostname;

    // Allow localhost for development
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;

    if (url.protocol !== 'https:') return false;
    return hostname === 'spafnat.com' || hostname === 'www.spafnat.com' ||
      hostname === 'spafnat.pages.dev' || hostname.endsWith('.spafnat.pages.dev');
  } catch {
    return false;
  }
}

/**
 * HTML escape to prevent XSS in email body and other contexts
 */
export function escapeHtml(text: string): string {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => escapeMap[char]);
}

/**
 * Create standardized JSON response
 */
export function jsonResponse(
  data: unknown,
  status = 200,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

type JsonBodyParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: Response };

/**
 * Parse JSON payload with a defensive size guard.
 */
export async function parseJsonBodyWithLimit<T = Record<string, unknown>>(
  request: Request,
  maxBytes: number,
  invalidBodyMessage = 'Corps de requête invalide'
): Promise<JsonBodyParseResult<T>> {
  const body = await readBodyWithLimit(request, maxBytes);
  if (!body.ok) return body;
  try {
    return { ok: true, data: JSON.parse(new TextDecoder().decode(body.data)) as T };
  } catch {
    return { ok: false, response: jsonResponse({ error: invalidBodyMessage }, 400) };
  }
}

/** Bound bytes while reading, even when Content-Length is absent or dishonest. */
export async function readBodyWithLimit(
  request: Request,
  maxBytes: number
): Promise<JsonBodyParseResult<ArrayBuffer>> {
  const tooLarge = () => ({
    ok: false as const,
    response: jsonResponse({ error: 'Corps de requête trop volumineux' }, 413),
  });
  const declaredSize = Number(request.headers.get('Content-Length'));
  if (declaredSize > maxBytes) return tooLarge();
  if (!request.body) {
    return { ok: false, response: jsonResponse({ error: 'Corps de requête invalide' }, 400) };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        void reader.cancel().catch(() => {});
        return tooLarge();
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return { ok: true, data: bytes.buffer };
  } catch {
    return { ok: false, response: jsonResponse({ error: 'Corps de requête invalide' }, 400) };
  } finally {
    reader.releaseLock();
  }
}

export async function parseMultipartBodyWithLimit(
  request: Request,
  maxBytes: number
): Promise<JsonBodyParseResult<FormData>> {
  const body = await readBodyWithLimit(request, maxBytes);
  if (!body.ok) return body;
  try {
    const response = new Response(body.data, { headers: request.headers });
    return { ok: true, data: await response.formData() };
  } catch {
    return { ok: false, response: jsonResponse({ error: 'Échec du parsing du formulaire' }, 400) };
  }
}
