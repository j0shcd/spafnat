// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { verifyPassword } from '../../functions/lib/password';

const script = ['--import=tsx/esm', 'scripts/generate-password-hash.ts'];
const dummyPassword = 'local-fixture-password-37!';
function run(args: string[] = [], input = '') {
  return spawnSync(process.execPath, [...script, ...args], {
    input, encoding: 'utf8', timeout: 10_000,
  });
}

describe('offline password helper', () => {
  it('hashes stdin without printing the plaintext', async () => {
    const result = run([], dummyPassword + '\n');
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).not.toContain(dummyPassword);
    const hash = result.stdout.trim().replace(/^ADMIN_PASSWORD_HASH=/, '');
    expect(await verifyPassword(dummyPassword, hash)).toBe(true);
  });
  it('rejects argv passwords without echoing them', () => {
    const result = run([dummyPassword]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('saisie masquée');
    expect(result.stdout + result.stderr).not.toContain(dummyPassword);
  });
  it.each(['', 'admin123', 'a'.repeat(1025)])('refuses empty, weak or oversized stdin', password => {
    const result = run([], password);
    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
  });
});
