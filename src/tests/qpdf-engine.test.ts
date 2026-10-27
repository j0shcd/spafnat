// @vitest-environment node
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createContext, runInContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { verifyQpdfBuild, verifyQpdfEngine } from '../../scripts/qpdf-vite-plugin';

const root = dirname(createRequire(import.meta.url).resolve('@spaf/qpdf-engine/manifest.json'));
const javascript = readFileSync(join(root, 'qpdf-core.js'));
const wasm = readFileSync(join(root, 'qpdf-core.wasm'));
const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
const receipt = JSON.parse(readFileSync(join(root, 'provenance.json'), 'utf8'));

describe('reviewed PDF engine identity', () => {
  it.each([
    ['6.0.8', 'aeb67926e7de656da38bc807d83050af93578758', 0],
    ['6.0.7', 'aeb67926e7de656da38bc807d83050af93578758', 1],
    ['6.0.8', 'unreviewed', 1],
  ])('checks the real build-recipe SDK gate for %s/%s', (version, commit, status) => {
    const recipe = readFileSync(resolve('scripts/build-pdf-engine.sh'), 'utf8');
    const gate = recipe.match(/^verify_sdk\(\) \{[\s\S]*?^\}/m)?.[0];
    expect(gate).toBeDefined();
    const result = spawnSync('/bin/bash', ['-c', `set -eu
      sdk_commit=aeb67926e7de656da38bc807d83050af93578758
      emcc() { if [[ "$1" == -dumpversion ]]; then echo "$TEST_SDK_VERSION"; else echo "$TEST_SDK_COMMIT"; fi; }
      ${gate}
      verify_sdk
      `], { env: { PATH: '/usr/bin:/bin', TEST_SDK_VERSION: version, TEST_SDK_COMMIT: commit } });
    expect(result.status).toBe(status);
  });

  it('accepts the reviewed JavaScript and WASM distribution', () => {
    expect(() => verifyQpdfBuild(manifest, receipt)).not.toThrow();
    expect(() => verifyQpdfEngine(javascript, wasm)).not.toThrow();
  });

  it('rejects an unpatched native dependency even when the wrapper version matches', () => {
    const unpatched = structuredClone(manifest);
    delete unpatched.nativeDependencies.zlib.patch;
    expect(() => verifyQpdfBuild(unpatched, receipt)).toThrow('Unreviewed PDF engine build inputs');
  });

  it('rejects an incorrect patch receipt or codec inventory', () => {
    const wrongReceipt = structuredClone(receipt);
    wrongReceipt.inputs.ZLIB_PATCH_SHA256 = 'unreviewed';
    expect(() => verifyQpdfBuild(manifest, wrongReceipt)).toThrow('Unreviewed PDF engine build inputs');
    const wrongCodec = structuredClone(manifest);
    wrongCodec.nativeDependencies.libjpeg.version = '6.0.8';
    expect(() => verifyQpdfBuild(wrongCodec, receipt)).toThrow('Unreviewed PDF engine build inputs');
  });

  it('ships matching patch evidence and native SBOM versions', () => {
    const sbom = JSON.parse(readFileSync(join(root, 'sbom.cdx.json'), 'utf8'));
    expect(sbom.components).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'libjpeg', version: '9f' }),
      expect.objectContaining({ name: 'zlib', version: `1.3.2+${receipt.inputs.ZLIB_PATCH_COMMIT}` }),
    ]));
    expect(createHash('sha256').update(readFileSync(join(root, 'zlib-security.patch'))).digest('hex'))
      .toBe(receipt.inputs.ZLIB_PATCH_SHA256);
    const wrongHashes = structuredClone(manifest);
    wrongHashes.files['qpdf-core.wasm'].sha256 = 'unreviewed';
    expect(() => verifyQpdfBuild(wrongHashes, receipt)).toThrow('Unreviewed PDF engine build inputs');
  });

  it('runs the distributed engine and verifies its upstream version', async () => {
    verifyQpdfEngine(javascript, wasm);
    const stdout: string[] = [];
    const context = createContext({
      window: {}, WebAssembly, Uint8Array, Int8Array, Uint16Array, Int16Array,
      Uint32Array, Int32Array, Float32Array, Float64Array, BigInt64Array,
      BigUint64Array, ArrayBuffer, TextDecoder, TextEncoder, URL, performance,
      crypto: globalThis.crypto, setTimeout, clearTimeout,
      console: { log: () => {}, error: () => {} },
    });
    runInContext(javascript.toString('utf8'), context, { timeout: 1000 });
    const core = await context.createQpdfCore({
      wasmBinary: new Uint8Array(wasm), noInitialRun: true, noExitRuntime: true,
      print: (line: string) => stdout.push(line), printErr: () => {},
    });
    expect(core.callMain(['--version'])).toBe(0);
    expect(stdout.join('\n')).toMatch(/version 12\.4\.2(?:\n|$)/);
  });

  it.each(['JavaScript', 'WASM'])('blocks an unreviewed %s change before bundling', asset => {
    const changed = new Uint8Array(asset === 'JavaScript' ? javascript : wasm);
    changed[0] ^= 1;
    expect(() => verifyQpdfEngine(
      asset === 'JavaScript' ? changed : javascript,
      asset === 'WASM' ? changed : wasm,
    )).toThrow('Unreviewed PDF engine asset');
  });
});
