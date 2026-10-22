// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { onRequest } from '../../functions/api/_middleware';
import { SECURITY_HEADERS } from '../../functions/lib/security-headers';
import { isValidOrigin } from '../../functions/lib/helpers';

const routes = Object.keys(import.meta.glob('../../functions/api/**/*.ts')).filter(path => !path.endsWith('_middleware.ts'));
const expectedHeaders = Object.fromEntries(readFileSync(resolve('public/_headers'), 'utf8').split('\n').filter(line => /^\s+\S+:/.test(line)).map(line => {
  const colon = line.indexOf(':'); return [line.slice(0, colon).trim(), line.slice(colon + 1).trim()];
}));

describe('API security response contract', () => {
  it('keeps the static and dynamic security policies identical', () => {
    expect(SECURITY_HEADERS).toEqual(expectedHeaders);
  });
  for (const route of routes) {
    const path = route.replace('../../functions', '').replace(/\.ts$/, '').replace('[[path]]', 'documents/test.pdf');
    it.each([200, 401, 403, 404, 500])(`secures ${path} response %s`, async status => {
      const response = await onRequest({ request: new Request(`https://spafnat.com${path}`), next: vi.fn().mockResolvedValue(new Response('sentinel', { status, headers: { 'X-Sentinel': 'preserved' } })) } as unknown as Parameters<typeof onRequest>[0]);
      expect(response.status).toBe(status); expect(await response.text()).toBe('sentinel');
      for (const [name, value] of Object.entries(expectedHeaders)) expect(response.headers.get(name)).toBe(value);
      expect(response.headers.get('X-Sentinel')).toBe('preserved');
      if (/^\/api\/(admin|auth)\//.test(path)) expect(response.headers.get('Cache-Control')).toBe('no-store');
    });
  }
  it('secures exceptions as generic failures without exposing exception details', async () => {
    const response = await onRequest({ request: new Request('https://spafnat.com/api/contact'), next: vi.fn().mockRejectedValue(new Error('PRIVATE_SENTINEL')) } as unknown as Parameters<typeof onRequest>[0]);
    expect(response.status).toBe(500); expect(await response.text()).not.toContain('PRIVATE_SENTINEL');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });
  it('permits this website and its previews, while rejecting unrelated Pages origins', () => {
    for (const origin of ['https://spafnat.com', 'https://www.spafnat.com', 'https://abc.spafnat.pages.dev']) expect(isValidOrigin(origin)).toBe(true);
    for (const origin of ['https://attacker.pages.dev', 'https://spafnat.com.attacker.dev', 'http://spafnat.com']) expect(isValidOrigin(origin)).toBe(false);
  });
});
