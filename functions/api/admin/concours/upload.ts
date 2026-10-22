import { putNewR2Object } from '../../../lib/r2';
import type { Env } from '../../../env';
import { jsonResponse, parseMultipartBodyWithLimit } from '../../../lib/helpers';
import {
  validateFile,
  sanitizeFilename,
  isFileLike,
} from '../../../lib/file-validation';
import type { ConcoursItem, ConcoursCategory } from '../../../../src/config/concours';
import {
  getConcoursKVKey,
  getConcoursR2Prefix,
  deriveTitleFromFilename,
  isConcoursCategory,
} from '../../../../src/config/concours';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * POST /api/admin/concours/upload
 * Upload a concours PDF to R2 and append to KV array
 * Requires multipart/form-data with:
 *  - file: PDF to upload
 *  - category: "reglements" | "palmares-poetique" | "palmares-artistique"
 *
 * Protected by admin middleware
 */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const parsed = await parseMultipartBodyWithLimit(request, MAX_FILE_SIZE + 64 * 1024);
    if (!parsed.ok) return parsed.response;
    const formData = parsed.data;

    // 3. Extract fields
    const fileEntry = formData.get('file');
    const file = isFileLike(fileEntry) ? fileEntry : null;
    const category = formData.get('category');

    if (!file || !category) {
      console.error('Upload validation failed:', { hasFile: !!file, category });
      return jsonResponse(
        { error: 'Une erreur technique s\'est produite. Veuillez contacter joshua@cohendumani.com' },
        400
      );
    }

    // Validate category
    if (!isConcoursCategory(category)) {
      console.error('Invalid concours category:', category);
      return jsonResponse(
        { error: 'Une erreur technique s\'est produite. Veuillez contacter joshua@cohendumani.com' },
        400
      );
    }

    // 4. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return jsonResponse(
        { error: `Fichier trop volumineux (max ${MAX_FILE_SIZE / (1024 * 1024)} MB)` },
        413
      );
    }

    // 5. Validate file (MIME type + magic bytes) - only PDF allowed for concours
    if (file.type !== 'application/pdf') {
      return jsonResponse({ error: 'Seuls les fichiers PDF sont autorisés' }, 400);
    }

    const validation = await validateFile(file, MAX_FILE_SIZE);
    if (!validation.valid) {
      return jsonResponse({ error: validation.error }, 400);
    }

    // 6. Determine R2 key
    const sanitized = sanitizeFilename(file.name, false);
    const r2Prefix = getConcoursR2Prefix(category as ConcoursCategory);
    let r2Key = `${r2Prefix}${sanitized}`;


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
    r2Key = await putNewR2Object(env.SPAF_MEDIA, r2Key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        originalFilename: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    console.log('R2 upload successful:', r2Key);

    // 8. Create concours item
    const title = deriveTitleFromFilename(file.name);
    const item: ConcoursItem = {
      r2Key,
      title,
      originalFilename: file.name,
      uploadedAt: new Date().toISOString(),
      size: file.size,
    };

    // 9. Append to KV array
    const kvKey = getConcoursKVKey(category as ConcoursCategory);
    const existingData = await env.SPAF_KV.get(kvKey, 'json');
    const items = (existingData as ConcoursItem[]) || [];
    items.push(item);

    await env.SPAF_KV.put(kvKey, JSON.stringify(items));

    console.log('KV update successful:', kvKey, items.length, 'items');

    return jsonResponse({
      success: true,
      item,
    });
  } catch (error) {
    console.error('Concours upload error:', error);
    return jsonResponse(
      { error: 'Erreur lors du téléversement. Veuillez réessayer ou contacter joshua@cohendumani.com' },
      500
    );
  }
};
