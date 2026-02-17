/**
 * File validation utilities for upload security
 * Validates MIME types and magic bytes (file headers) to prevent malicious uploads
 */

/**
 * Allowed file types with their MIME types and magic byte signatures
 */
const ALLOWED_FILE_TYPES = {
  'application/pdf': {
    extensions: ['.pdf'],
    magicBytes: [
      [0x25, 0x50, 0x44, 0x46], // %PDF
    ],
  },
  'image/jpeg': {
    extensions: ['.jpg', '.jpeg'],
    magicBytes: [
      [0xff, 0xd8, 0xff], // JPEG
    ],
  },
  'image/png': {
    extensions: ['.png'],
    magicBytes: [
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], // PNG signature
    ],
  },
  'image/webp': {
    extensions: ['.webp'],
    magicBytes: [
      // WEBP: "RIFF" followed by size, then "WEBP"
      // We check for "RIFF" at position 0 and "WEBP" at position 8
      [0x52, 0x49, 0x46, 0x46], // RIFF (check separately for WEBP at offset 8)
    ],
  },
};

const MIN_PHOTO_YEAR = 2010;

export interface FileLike {
  name: string;
  size: number;
  type: string;
  slice: (start?: number, end?: number) => Blob;
  arrayBuffer: () => Promise<ArrayBuffer>;
}

/**
 * Validate photo year format and bounds
 */
export function isValidPhotoYear(
  year: string,
  maxYear = new Date().getFullYear()
): boolean {
  if (!/^\d{4}$/.test(year)) return false;
  const parsed = Number.parseInt(year, 10);
  return parsed >= MIN_PHOTO_YEAR && parsed <= maxYear;
}

/**
 * Basic path segment safety check
 */
export function hasUnsafePathSegments(pathSegments: string[]): boolean {
  return pathSegments.some((segment) => {
    return (
      segment === '' ||
      segment === '.' ||
      segment === '..' ||
      segment.includes('\\') ||
      segment.includes('\0')
    );
  });
}

/**
 * Validate file MIME type against allowlist
 */
export function isValidMimeType(mimeType: string): boolean {
  return mimeType in ALLOWED_FILE_TYPES;
}

/**
 * Validate file magic bytes (file header) to prevent disguised files
 * @param fileBuffer - First 12 bytes of file (enough for all supported types)
 * @param mimeType - Claimed MIME type from Content-Type header
 * @returns true if magic bytes match claimed type
 */
export function validateMagicBytes(
  fileBuffer: Uint8Array,
  mimeType: string
): boolean {
  const allowedType = ALLOWED_FILE_TYPES[mimeType as keyof typeof ALLOWED_FILE_TYPES];
  if (!allowedType) return false;

  // Special case for WebP: check "RIFF" at 0 and "WEBP" at 8
  if (mimeType === 'image/webp') {
    const riffMatch =
      fileBuffer[0] === 0x52 &&
      fileBuffer[1] === 0x49 &&
      fileBuffer[2] === 0x46 &&
      fileBuffer[3] === 0x46;

    const webpMatch =
      fileBuffer[8] === 0x57 &&
      fileBuffer[9] === 0x45 &&
      fileBuffer[10] === 0x42 &&
      fileBuffer[11] === 0x50;

    return riffMatch && webpMatch;
  }

  // Check if any magic byte signature matches
  return allowedType.magicBytes.some((signature) => {
    return signature.every((byte, index) => fileBuffer[index] === byte);
  });
}

/**
 * Sanitize filename for safe storage
 * - Lowercase
 * - Replace spaces with hyphens
 * - Remove non-alphanumeric (except hyphens and dots)
 * - Truncate to 100 characters
 * - Prepend timestamp if needed to avoid collisions
 */
export function sanitizeFilename(filename: string, addTimestamp = false): string {
  // Extract extension
  const lastDot = filename.lastIndexOf('.');
  const name = lastDot > 0 ? filename.substring(0, lastDot) : filename;
  const ext = lastDot > 0 ? filename.substring(lastDot) : '';

  // Sanitize name
  let sanitized = name
    .toLowerCase()
    .replace(/\s+/g, '-') // spaces to hyphens
    .replace(/[^a-z0-9-]/g, '') // remove non-alphanumeric (keep hyphens)
    .substring(0, 100); // truncate

  // Add timestamp if requested (for collision avoidance)
  if (addTimestamp) {
    const timestamp = Date.now();
    sanitized = `${timestamp}-${sanitized}`;
  }

  return sanitized + ext;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot > 0 ? filename.substring(lastDot) : '';
}

/**
 * Validate that file extension matches MIME type
 */
export function validateExtension(filename: string, mimeType: string): boolean {
  const ext = getFileExtension(filename).toLowerCase();
  const allowedType = ALLOWED_FILE_TYPES[mimeType as keyof typeof ALLOWED_FILE_TYPES];
  if (!allowedType) return false;

  return allowedType.extensions.includes(ext);
}

/**
 * Read first N bytes from a File/Blob
 */
export async function readFileHeader(file: FileLike, bytes = 12): Promise<Uint8Array> {
  const slice = file.slice(0, bytes);
  const arrayBuffer = await slice.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Complete file validation (MIME + extension + magic bytes)
 * @param file - File object to validate
 * @param maxSizeBytes - Maximum allowed file size in bytes
 * @returns { valid: true } or { valid: false, error: string }
 */
export async function validateFile(
  file: FileLike,
  maxSizeBytes: number
): Promise<{ valid: true } | { valid: false; error: string }> {
  // 1. Check file size
  if (file.size > maxSizeBytes) {
    const maxMB = (maxSizeBytes / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `Fichier trop volumineux (max ${maxMB} MB)` };
  }

  // 2. Check MIME type
  if (!isValidMimeType(file.type)) {
    return {
      valid: false,
      error: 'Type de fichier non autorisé (PDF, JPEG, PNG, WebP uniquement)',
    };
  }

  // 3. Check extension matches MIME type
  if (!validateExtension(file.name, file.type)) {
    return { valid: false, error: 'Extension de fichier incompatible avec le type' };
  }

  // 4. Check magic bytes
  const header = await readFileHeader(file);
  if (!validateMagicBytes(header, file.type)) {
    return { valid: false, error: 'Fichier corrompu ou déguisé détecté' };
  }

  return { valid: true };
}
