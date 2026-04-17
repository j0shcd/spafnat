import type { Env } from '../../env';
import { jsonResponse } from '../../lib/helpers';
import {
  validateFile,
  sanitizeFilename,
  isValidPhotoYear,
  type FileLike,
} from '../../lib/file-validation';
import { DOCUMENTS } from '../../../src/config/documents';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_COVER_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const REVUE_DOCUMENT_FILENAME = 'extrait_revue.pdf';
const REVUE_COVER_FILENAME = 'extrait_revue_cover.jpg';
const ALLOWED_DOCUMENT_FILENAMES = new Set(
  Object.values(DOCUMENTS)
    .map((document) => document.path.split('/').pop())
    .filter((filename): filename is string => Boolean(filename))
);

function isFileLike(value: unknown): value is FileLike {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<FileLike>;
  return (
    typeof candidate.name === 'string' &&
    typeof candidate.type === 'string' &&
    typeof candidate.size === 'number' &&
    typeof candidate.slice === 'function' &&
    typeof candidate.arrayBuffer === 'function'
  );
}

/**
 * POST /api/admin/upload
 * Upload file to R2 storage
 * Requires multipart/form-data with:
 *  - file: File to upload
 *  - type: "document" or "photo"
 *  - key: Document key (for documents) or year (for photos)
 *
 * Protected by admin middleware
 */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    // 1. Check Content-Length header (early reject, but don't trust it)
    const contentLength = request.headers.get('Content-Length');
    if (contentLength && parseInt(contentLength, 10) > MAX_FILE_SIZE) {
      return jsonResponse(
        { error: `Fichier trop volumineux (max ${MAX_FILE_SIZE / (1024 * 1024)} MB)` },
        413
      );
    }

    // 2. Parse multipart form data
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return jsonResponse({ error: 'Échec du parsing du formulaire' }, 400);
    }

    // 3. Extract fields
    const fileEntry = formData.get('file');
    const typeEntry = formData.get('type');
    const keyEntry = formData.get('key');
    const coverEntry = formData.get('cover');
    const file = isFileLike(fileEntry) ? fileEntry : null;
    const type = typeof typeEntry === 'string' ? typeEntry : null;
    const key = typeof keyEntry === 'string' ? keyEntry : null;
    const cover = isFileLike(coverEntry) ? coverEntry : null;

    if (!file || !type || !key) {
      console.error('Upload validation failed:', { hasFile: !!file, type, key });
      return jsonResponse(
        { error: 'Une erreur technique s\'est produite. Veuillez contacter joshua@cohendumani.com' },
        400
      );
    }

    if (type !== 'document' && type !== 'photo') {
      console.error('Invalid upload type:', type);
      return jsonResponse(
        { error: 'Une erreur technique s\'est produite. Veuillez contacter joshua@cohendumani.com' },
        400
      );
    }

    if (cover && type !== 'document') {
      return jsonResponse({ error: 'Paramètre de couverture non autorisé' }, 400);
    }

    // 4. Validate file size (actual file, not header)
    if (file.size > MAX_FILE_SIZE) {
      return jsonResponse(
        { error: `Fichier trop volumineux (max ${MAX_FILE_SIZE / (1024 * 1024)} MB)` },
        413
      );
    }

    // 5. Validate file (MIME type + extension + magic bytes)
    const validation = await validateFile(file, MAX_FILE_SIZE);
    if (!validation.valid) {
      return jsonResponse({ error: validation.error }, 400);
    }

    // 6. Determine R2 key based on type
    let r2Key: string;

    if (type === 'document') {
      if (!ALLOWED_DOCUMENT_FILENAMES.has(key)) {
        console.error('Invalid document filename:', key);
        return jsonResponse(
          { error: 'Une erreur technique s\'est produite. Veuillez contacter joshua@cohendumani.com' },
          400
        );
      }

      // Documents: documents/{filename} (key is already the full filename)
      r2Key = `documents/${key}`;

      if (cover && key !== REVUE_DOCUMENT_FILENAME) {
        return jsonResponse(
          { error: 'Image de couverture non autorisée pour ce document' },
          400
        );
      }

      if (cover) {
        if (!cover.type.startsWith('image/')) {
          return jsonResponse({ error: 'Type de couverture invalide (image attendue)' }, 400);
        }

        const coverValidation = await validateFile(cover, MAX_COVER_FILE_SIZE);
        if (!coverValidation.valid) {
          return jsonResponse({ error: coverValidation.error }, 400);
        }
      }
    } else {
      // Photos: congres/{year}/{sanitized-filename}
      const year = key; // For photos, key is the year
      if (!isValidPhotoYear(year)) {
        console.error('Invalid photo year:', year);
        return jsonResponse(
          { error: 'Une erreur technique s\'est produite. Veuillez contacter joshua@cohendumani.com' },
          400
        );
      }

      const sanitized = sanitizeFilename(file.name, false);
      r2Key = `congres/${year}/${sanitized}`;

      // Check for collision and add timestamp if needed
      const existing = await env.SPAF_MEDIA.head(r2Key);
      if (existing) {
        const timestampedName = sanitizeFilename(file.name, true);
        r2Key = `congres/${year}/${timestampedName}`;
      }
    }

    // 7. Upload to R2
    console.log('Uploading to R2:', { r2Key, size: file.size, type: file.type });

    if (!env.SPAF_MEDIA) {
      console.error('SPAF_MEDIA binding not found!');
      return jsonResponse(
        { error: 'Configuration serveur incorrecte. Veuillez contacter joshua@cohendumani.com' },
        500
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const uploadedAt = new Date().toISOString();

    await env.SPAF_MEDIA.put(r2Key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        originalFilename: file.name,
        uploadedAt,
      },
    });

    console.log('R2 upload successful:', r2Key);

    if (type === 'document' && key === REVUE_DOCUMENT_FILENAME && cover) {
      const coverBuffer = await cover.arrayBuffer();
      const coverKey = `documents/${REVUE_COVER_FILENAME}`;

      await env.SPAF_MEDIA.put(coverKey, coverBuffer, {
        httpMetadata: {
          contentType: cover.type,
        },
        customMetadata: {
          originalFilename: cover.name,
          uploadedAt,
          sourcePdfFilename: file.name,
        },
      });

      console.log('R2 cover upload successful:', coverKey);
    }

    return jsonResponse({
      success: true,
      r2Key,
      url: `/api/media/${r2Key}`,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return jsonResponse(
      { error: 'Erreur lors du téléversement. Veuillez réessayer ou contacter joshua@cohendumani.com' },
      500
    );
  }
};
