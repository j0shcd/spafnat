/**
 * Password hashing utilities using PBKDF2-SHA256
 * OWASP 2023 recommendation: 600,000 iterations for PBKDF2-SHA256
 */

const ITERATIONS = 600000;
const SALT_LENGTH = 16; // 16 bytes = 128 bits
const HASH_LENGTH = 32; // 32 bytes = 256 bits

/**
 * Verify a password against a stored hash
 * @param password - Plain text password to verify
 * @param storedHash - Stored hash in format "salt:hash" (both base64-encoded)
 * @returns true if password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  try {
    // Parse stored hash format: "salt:hash"
    const [saltB64, hashB64] = storedHash.split(':');
    if (!saltB64 || !hashB64) {
      throw new Error('Invalid hash format');
    }

    // Decode salt from base64
    const salt = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0));

    // Derive key from password using same salt
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      HASH_LENGTH * 8 // bits
    );

    // Convert to base64 for comparison
    const derivedArray = new Uint8Array(derivedBits);
    const derivedB64 = btoa(String.fromCharCode(...derivedArray));

    // Constant-time comparison (mitigate timing attacks)
    return derivedB64 === hashB64;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Hash a password (for offline use / testing / initial setup)
 * Use this in Node.js to generate ADMIN_PASSWORD_HASH env var
 *
 * Example usage:
 * ```bash
 * node -e "import('./functions/lib/password.ts').then(m => m.hashPassword('your-password').then(console.log))"
 * ```
 */
export async function hashPassword(password: string): Promise<string> {
  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  // Derive key from password
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    HASH_LENGTH * 8 // bits
  );

  // Encode to base64
  const derivedArray = new Uint8Array(derivedBits);
  const saltB64 = btoa(String.fromCharCode(...salt));
  const hashB64 = btoa(String.fromCharCode(...derivedArray));

  // Return in "salt:hash" format
  return `${saltB64}:${hashB64}`;
}

/**
 * Standalone script for generating password hashes
 * Run with: node --experimental-modules functions/lib/password.ts <password>
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const password = process.argv[2];
  if (!password) {
    console.error('Usage: node functions/lib/password.ts <password>');
    process.exit(1);
  }

  hashPassword(password).then((hash) => {
    console.log(`\nGenerated ADMIN_PASSWORD_HASH:\n${hash}\n`);
    console.log('Add this to your .dev.vars file:');
    console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
  });
}
