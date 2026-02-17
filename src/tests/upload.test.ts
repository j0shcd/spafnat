import { describe, it, expect } from 'vitest';
import {
  isValidMimeType,
  validateMagicBytes,
  sanitizeFilename,
  validateExtension,
  getFileExtension,
  isValidPhotoYear,
  hasUnsafePathSegments,
} from '../../functions/lib/file-validation';

/**
 * Phase 3a Upload & File Validation Tests
 * Tests for MIME type checking, magic bytes validation, filename sanitization
 */

describe('MIME Type Validation', () => {
  it('should allow PDF files', () => {
    expect(isValidMimeType('application/pdf')).toBe(true);
  });

  it('should allow JPEG files', () => {
    expect(isValidMimeType('image/jpeg')).toBe(true);
  });

  it('should allow PNG files', () => {
    expect(isValidMimeType('image/png')).toBe(true);
  });

  it('should allow WebP files', () => {
    expect(isValidMimeType('image/webp')).toBe(true);
  });

  it('should reject executable files', () => {
    expect(isValidMimeType('application/x-executable')).toBe(false);
  });

  it('should reject arbitrary MIME types', () => {
    expect(isValidMimeType('text/html')).toBe(false);
    expect(isValidMimeType('application/javascript')).toBe(false);
  });
});

describe('Magic Bytes Validation', () => {
  it('should validate PDF magic bytes (%PDF)', () => {
    const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]); // %PDF-1.7
    expect(validateMagicBytes(pdfHeader, 'application/pdf')).toBe(true);
  });

  it('should validate JPEG magic bytes (FF D8 FF)', () => {
    const jpegHeader = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(validateMagicBytes(jpegHeader, 'image/jpeg')).toBe(true);
  });

  it('should validate PNG magic bytes', () => {
    const pngHeader = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ]);
    expect(validateMagicBytes(pngHeader, 'image/png')).toBe(true);
  });

  it('should validate WebP magic bytes (RIFF + WEBP)', () => {
    const webpHeader = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x00, 0x00, 0x00, 0x00, // size
      0x57, 0x45, 0x42, 0x50, // WEBP
    ]);
    expect(validateMagicBytes(webpHeader, 'image/webp')).toBe(true);
  });

  it('should reject mismatched magic bytes (PDF header, JPEG MIME)', () => {
    const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    expect(validateMagicBytes(pdfHeader, 'image/jpeg')).toBe(false);
  });

  it('should reject disguised executable as PDF', () => {
    const exeHeader = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]); // MZ header
    expect(validateMagicBytes(exeHeader, 'application/pdf')).toBe(false);
  });

  it('should reject invalid WebP (missing WEBP at offset 8)', () => {
    const invalidWebp = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, // Not WEBP
    ]);
    expect(validateMagicBytes(invalidWebp, 'image/webp')).toBe(false);
  });
});

describe('Filename Sanitization', () => {
  it('should lowercase filename', () => {
    expect(sanitizeFilename('MyFile.PDF')).toBe('myfile.PDF');
  });

  it('should replace spaces with hyphens', () => {
    expect(sanitizeFilename('My File Name.jpg')).toBe('my-file-name.jpg');
  });

  it('should remove special characters', () => {
    expect(sanitizeFilename('file@#$%name!.png')).toBe('filename.png');
  });

  it('should preserve hyphens but remove dots from name', () => {
    // Dots are only kept for the extension
    expect(sanitizeFilename('file-name.test.pdf')).toBe('file-nametest.pdf');
  });

  it('should truncate long filenames', () => {
    const longName = 'a'.repeat(200) + '.pdf';
    const sanitized = sanitizeFilename(longName);
    expect(sanitized.length).toBeLessThanOrEqual(104); // 100 chars + .pdf
  });

  it('should add timestamp when requested', () => {
    const sanitized = sanitizeFilename('file.jpg', true);
    expect(sanitized).toMatch(/^\d+-file\.jpg$/);
  });

  it('should handle filename without extension', () => {
    expect(sanitizeFilename('filename')).toBe('filename');
  });
});

describe('File Extension Validation', () => {
  it('should extract .pdf extension', () => {
    expect(getFileExtension('document.pdf')).toBe('.pdf');
  });

  it('should extract .jpg extension', () => {
    expect(getFileExtension('photo.jpg')).toBe('.jpg');
  });

  it('should handle multiple dots', () => {
    expect(getFileExtension('file.name.with.dots.png')).toBe('.png');
  });

  it('should return empty string for no extension', () => {
    expect(getFileExtension('filename')).toBe('');
  });

  it('should validate PDF extension matches MIME type', () => {
    expect(validateExtension('file.pdf', 'application/pdf')).toBe(true);
  });

  it('should validate JPEG extension matches MIME type', () => {
    expect(validateExtension('photo.jpg', 'image/jpeg')).toBe(true);
    expect(validateExtension('photo.jpeg', 'image/jpeg')).toBe(true);
  });

  it('should reject mismatched extension and MIME type', () => {
    expect(validateExtension('file.pdf', 'image/jpeg')).toBe(false);
    expect(validateExtension('photo.jpg', 'application/pdf')).toBe(false);
  });

  it('should be case-insensitive for extension matching', () => {
    expect(validateExtension('FILE.PDF', 'application/pdf')).toBe(true);
    expect(validateExtension('PHOTO.JPG', 'image/jpeg')).toBe(true);
  });
});

describe('Photo Year Validation', () => {
  it('should accept valid year format in allowed range', () => {
    expect(isValidPhotoYear('2010', 2026)).toBe(true);
    expect(isValidPhotoYear('2026', 2026)).toBe(true);
  });

  it('should reject out-of-range years', () => {
    expect(isValidPhotoYear('2009', 2026)).toBe(false);
    expect(isValidPhotoYear('2027', 2026)).toBe(false);
  });

  it('should reject invalid format', () => {
    expect(isValidPhotoYear('24', 2026)).toBe(false);
    expect(isValidPhotoYear('20ab', 2026)).toBe(false);
  });
});

describe('Path Segment Safety Validation', () => {
  it('should reject traversal and unsafe segments', () => {
    expect(hasUnsafePathSegments(['congres', '..', 'photo.jpg'])).toBe(true);
    expect(hasUnsafePathSegments(['congres', '', 'photo.jpg'])).toBe(true);
    expect(hasUnsafePathSegments(['congres', 'folder\\photo.jpg'])).toBe(true);
  });

  it('should allow safe path segments', () => {
    expect(hasUnsafePathSegments(['congres', '2024', 'photo.jpg'])).toBe(false);
  });
});

/**
 * NOTE: Full file upload validation tests with actual File objects
 * require browser environment or Node.js File polyfill.
 *
 * For integration testing:
 * 1. Create test files: PDF, JPEG, PNG, WebP, and disguised .exe
 * 2. Upload via /api/admin/upload with valid JWT
 * 3. Verify:
 *    - Correct files are accepted (200 OK)
 *    - Oversized files rejected (413)
 *    - Wrong MIME types rejected (400)
 *    - Disguised files rejected (400, magic bytes mismatch)
 *    - Files appear in R2 after upload
 * 4. Test file listing via /api/admin/files
 * 5. Test file deletion via /api/admin/delete-document or delete-photo
 */
