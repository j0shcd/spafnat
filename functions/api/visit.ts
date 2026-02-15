import type { Env } from '../env';

const COUNTER_KEY = 'counter:visitors';
const INITIAL_COUNT = 184161; // Starting point for visitor count, pulled over from previous website (feb 14 2026)

// IP resolution fallback chain for local dev and production
function getClientIP(request: Request): string {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'localhost'
  );
}

// Hash IP + today's date for privacy (no raw IPs stored)
async function hashIPWithDate(ip: string): Promise<string> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const data = new TextEncoder().encode(`${ip}:${today}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const countStr = await env.SPAF_KV.get(COUNTER_KEY);
    const count = countStr ? parseInt(countStr, 10) : INITIAL_COUNT;

    return new Response(JSON.stringify({ count }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error reading visitor count:', error);
    return new Response(JSON.stringify({ error: 'Failed to read count' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const ip = getClientIP(request);
    const hash = await hashIPWithDate(ip);
    const dedupKey = `rate:visit:${hash}`;

    // Check if this IP has already been counted today
    const alreadyCounted = await env.SPAF_KV.get(dedupKey);

    if (alreadyCounted) {
      // Already counted today, return current count without incrementing
      const countStr = await env.SPAF_KV.get(COUNTER_KEY);
      const count = countStr ? parseInt(countStr, 10) : INITIAL_COUNT;

      return new Response(JSON.stringify({ count, incremented: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Not counted today — increment counter
    const currentCountStr = await env.SPAF_KV.get(COUNTER_KEY);
    const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : INITIAL_COUNT;
    const newCount = currentCount + 1;

    // Update counter and set deduplication key with 24h TTL
    await Promise.all([
      env.SPAF_KV.put(COUNTER_KEY, newCount.toString()),
      env.SPAF_KV.put(dedupKey, '1', { expirationTtl: 86400 }), // 24 hours
    ]);

    return new Response(JSON.stringify({ count: newCount, incremented: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error incrementing visitor count:', error);
    return new Response(JSON.stringify({ error: 'Failed to increment count' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
