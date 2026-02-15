import type { Env } from '../env';
import { getClientIP, jsonResponse } from '../lib/helpers';

const COUNTER_KEY = 'counter:visitors';
const INITIAL_COUNT = 184161; // Starting point for visitor count, pulled over from previous website (feb 14 2026)

// Hash IP + User-Agent + today's date for privacy (no raw IPs stored)
// Different devices on same network have different User-Agents, so they're counted separately
async function hashVisitorWithDate(ip: string, userAgent: string): Promise<string> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const data = new TextEncoder().encode(`${ip}:${userAgent}:${today}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const countStr = await env.SPAF_KV.get(COUNTER_KEY);
    const count = countStr ? parseInt(countStr, 10) : INITIAL_COUNT;

    return jsonResponse({ count });
  } catch (error) {
    console.error('Error reading visitor count:', error);
    return jsonResponse({ error: 'Failed to read count' }, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const ip = getClientIP(request);
    const userAgent = request.headers.get('User-Agent') || '';
    const hash = await hashVisitorWithDate(ip, userAgent);
    const dedupKey = `rate:visit:${hash}`;

    // Check if this IP has already been counted today
    const alreadyCounted = await env.SPAF_KV.get(dedupKey);

    if (alreadyCounted) {
      // Already counted today, return current count without incrementing
      const countStr = await env.SPAF_KV.get(COUNTER_KEY);
      const count = countStr ? parseInt(countStr, 10) : INITIAL_COUNT;

      return jsonResponse({ count, incremented: false });
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

    return jsonResponse({ count: newCount, incremented: true });
  } catch (error) {
    console.error('Error incrementing visitor count:', error);
    return jsonResponse({ error: 'Failed to increment count' }, 500);
  }
};
