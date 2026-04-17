import type { Env } from '../env';
import { getClientIP, jsonResponse } from '../lib/helpers';

const COUNTER_KEY = 'counter:visitors';
const INITIAL_COUNT = 184161; // Starting point for visitor count, pulled over from previous website (feb 14 2026)
const DAILY_ESTIMATE_KEY_PREFIX = 'counter:visitors:daily-estimate:';
const SAMPLING_BUCKET_COUNT = 10_000;
const DAILY_ESTIMATE_KEY_TTL_SECONDS = 172800;
const KNOWN_BOT_UA_PATTERN =
  /\b(bot|crawler|spider|crawling|slurp|bingpreview|mediapartners-google|facebookexternalhit|facebot|twitterbot|slackbot|linkedinbot|discordbot|telegrambot|whatsapp|applebot|yandex|baiduspider|duckduckbot|semrushbot|ahrefsbot|mj12bot|petalbot)\b/i;

function isKnownBotRequest(request: Request): boolean {
  const verifiedBotHeader = request.headers.get('cf-verified-bot');
  if (verifiedBotHeader && verifiedBotHeader.toLowerCase() === 'true') {
    return true;
  }

  const userAgent = request.headers.get('User-Agent') || '';
  return KNOWN_BOT_UA_PATTERN.test(userAgent);
}

interface SamplingConfig {
  rate: number;
  weight: number;
}

function getCurrentUtcDateKey(): string {
  return new Date().toISOString().split('T')[0];
}

function getDailyEstimateKey(dateKey: string): string {
  return `${DAILY_ESTIMATE_KEY_PREFIX}${dateKey}`;
}

function parsePositiveInt(value: string | null): number {
  if (!value) return 0;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

/**
 * Adaptive visitor sampling tiers.
 * Exact counting up to 300/day, then increasingly aggressive sampling.
 */
function getSamplingConfig(dailyEstimate: number): SamplingConfig {
  if (dailyEstimate < 300) {
    return { rate: 1, weight: 1 };
  }

  if (dailyEstimate < 600) {
    return { rate: 0.25, weight: 4 };
  }

  if (dailyEstimate < 1000) {
    return { rate: 0.1, weight: 10 };
  }

  return { rate: 0.05, weight: 20 };
}

function getHashBucket(hashHex: string): number {
  const prefix = hashHex.slice(0, 8);
  const parsed = Number.parseInt(prefix, 16);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return parsed % SAMPLING_BUCKET_COUNT;
}

function isSampledVisitor(hashHex: string, rate: number): boolean {
  if (rate >= 1) {
    return true;
  }

  const threshold = Math.floor(rate * SAMPLING_BUCKET_COUNT);
  return getHashBucket(hashHex) < threshold;
}

// Hash IP + today's date for privacy (no raw IPs stored)
async function hashVisitorWithDate(ip: string): Promise<string> {
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

    return jsonResponse({ count });
  } catch (error) {
    console.error('Error reading visitor count:', error);
    return jsonResponse({ error: 'Failed to read count' }, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const dateKey = getCurrentUtcDateKey();
    const dailyEstimateKey = getDailyEstimateKey(dateKey);

    if (isKnownBotRequest(request)) {
      const countStr = await env.SPAF_KV.get(COUNTER_KEY);
      const count = countStr ? parseInt(countStr, 10) : INITIAL_COUNT;

      return jsonResponse({ count, incremented: false });
    }

    const ip = getClientIP(request);
    const hash = await hashVisitorWithDate(ip);
    const dailyEstimateStr = await env.SPAF_KV.get(dailyEstimateKey);
    const dailyEstimate = parsePositiveInt(dailyEstimateStr);
    const sampling = getSamplingConfig(dailyEstimate);

    if (!isSampledVisitor(hash, sampling.rate)) {
      const countStr = await env.SPAF_KV.get(COUNTER_KEY);
      const count = countStr ? parseInt(countStr, 10) : INITIAL_COUNT;
      return jsonResponse({
        count,
        incremented: false,
        estimated: true,
      });
    }

    const dedupKey = `rate:visit:${hash}`;

    // Check if this IP has already been counted today
    const alreadyCounted = await env.SPAF_KV.get(dedupKey);

    if (alreadyCounted) {
      // Already counted today, return current count without incrementing
      const countStr = await env.SPAF_KV.get(COUNTER_KEY);
      const count = countStr ? parseInt(countStr, 10) : INITIAL_COUNT;

      return jsonResponse({
        count,
        incremented: false,
        estimated: sampling.rate < 1,
      });
    }

    // Not counted today — increment counter (weighted when sampling is active)
    const currentCountStr = await env.SPAF_KV.get(COUNTER_KEY);
    const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : INITIAL_COUNT;
    const incrementBy = sampling.weight;
    const newCount = currentCount + incrementBy;
    const newDailyEstimate = dailyEstimate + incrementBy;

    // Update cumulative counter, daily estimate, and deduplication key
    await Promise.all([
      env.SPAF_KV.put(COUNTER_KEY, newCount.toString()),
      env.SPAF_KV.put(dedupKey, '1', { expirationTtl: 86400 }), // 24 hours
      env.SPAF_KV.put(dailyEstimateKey, newDailyEstimate.toString(), {
        expirationTtl: DAILY_ESTIMATE_KEY_TTL_SECONDS,
      }),
    ]);

    return jsonResponse({
      count: newCount,
      incremented: true,
      estimated: sampling.rate < 1,
      sampleRate: sampling.rate,
      incrementBy,
    });
  } catch (error) {
    console.error('Error incrementing visitor count:', error);
    return jsonResponse({ error: 'Failed to increment count' }, 500);
  }
};
