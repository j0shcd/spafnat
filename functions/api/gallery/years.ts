/**
 * GET /api/gallery/years
 *
 * Returns a list of years that have congress photos in R2.
 * Used by Congres page to dynamically show only years with photos.
 *
 * Response: { years: number[] }
 * Example: { years: [2024, 2023, 2020, 2019] }
 */

import type { Env } from '../../env';
import { jsonResponse } from '../../lib/helpers';
import { enforceIpRateLimit } from '../../lib/rate-limit';

const GALLERY_YEARS_RATE_LIMIT = 120;
const GALLERY_YEARS_RATE_WINDOW_SECONDS = 60;

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const rateLimited = await enforceIpRateLimit({
      request,
      env,
      scope: 'gallery:years',
      limit: GALLERY_YEARS_RATE_LIMIT,
      windowSeconds: GALLERY_YEARS_RATE_WINDOW_SECONDS,
    });
    if (rateLimited) {
      return rateLimited;
    }

    const { SPAF_MEDIA } = env;

    // List all objects in the congres/ prefix
    const listed = await SPAF_MEDIA.list({
      prefix: 'congres/',
      delimiter: '/',
    });

    // Extract unique years from the delimitedPrefixes
    // delimitedPrefixes will be like: ['congres/2024/', 'congres/2023/', ...]
    const years: number[] = [];

    if (listed.delimitedPrefixes) {
      for (const prefix of listed.delimitedPrefixes) {
        // Extract year from 'congres/YYYY/'
        const match = prefix.match(/congres\/(\d{4})\//);
        if (match) {
          const year = parseInt(match[1], 10);
          years.push(year);
        }
      }
    }

    // Sort years in descending order (newest first)
    years.sort((a, b) => b - a);

    return jsonResponse({ years }, 200);
  } catch (error) {
    console.error('Error fetching gallery years:', error);
    return jsonResponse(
      {
        error: 'Erreur lors du chargement des années. Veuillez réessayer.',
      },
      500
    );
  }
};
