/**
 * Standalone script for generating PBKDF2 password hashes
 * This uses Node.js to generate the hash for ADMIN_PASSWORD_HASH env var
 *
 * Usage: node --import tsx/esm scripts/generate-password-hash.ts <password>
 * Or with tsx: npx tsx scripts/generate-password-hash.ts <password>
 */

import { hashPassword } from '../functions/lib/password';

async function main() {
  const password = process.argv[2];

  if (!password) {
    console.error('Usage: npx tsx scripts/generate-password-hash.ts <password>');
    console.error('   or: node --import tsx/esm scripts/generate-password-hash.ts <password>');
    process.exit(1);
  }

  console.log('\nGenerating PBKDF2 password hash...');
  console.log('(600,000 iterations, this may take a few seconds)\n');

  const hash = await hashPassword(password);

  console.log('Generated ADMIN_PASSWORD_HASH:');
  console.log(hash);
  console.log('\nAdd this to your .dev.vars file:');
  console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
}

main().catch((error) => {
  console.error('Error generating hash:', error);
  process.exit(1);
});
