import type { Env } from '../env';
import { getClientIP, jsonResponse } from '../lib/helpers';
import { enforceIpRateLimit } from '../lib/rate-limit';

const COUNTER_KEY = 'counter:visitors';
const INITIAL_COUNT = 184161; // Starting point for visitor count, pulled over from previous website (feb 14 2026)
const VISIT_GET_RATE_LIMIT = 120;
const VISIT_POST_RATE_LIMIT = 30;
const VISIT_RATE_WINDOW_SECONDS = 60;

// Hash IP + today's date for privacy (no raw IPs stored)
async function hashVisitorWithDate(ip: string): Promise<string> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const data = new TextEncoder().encode(`${ip}:${today}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const rateLimited = await enforceIpRateLimit({
      request,
      env,
      scope: 'visit:get',
      limit: VISIT_GET_RATE_LIMIT,
      windowSeconds: VISIT_RATE_WINDOW_SECONDS,
    });
    if (rateLimited) {
      return rateLimited;
    }

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
    const rateLimited = await enforceIpRateLimit({
      request,
      env,
      scope: 'visit:post',
      limit: VISIT_POST_RATE_LIMIT,
      windowSeconds: VISIT_RATE_WINDOW_SECONDS,
    });
    if (rateLimited) {
      return rateLimited;
    }

    const ip = getClientIP(request);
    const hash = await hashVisitorWithDate(ip);
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
