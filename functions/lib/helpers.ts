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

/**
 * Validate request origin
 * Allows localhost (dev) and *.pages.dev (preview) initially
 * TODO: Tighten to spafnat.com only after custom domain is active
 */
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

    // Allow Cloudflare Pages preview deployments
    if (hostname.endsWith('.pages.dev')) return true;

    // TODO: Once custom domain is active, tighten to only spafnat.com
    // if (hostname === 'spafnat.com' || hostname === 'www.spafnat.com') return true;

    return false;
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
