import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createContext, runInContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { verifyQpdfEngine } from '../../scripts/qpdf-vite-plugin';

const root = dirname(createRequire(import.meta.url).resolve('@wasm-zoo/qpdf/manifest.json'));
const javascript = readFileSync(join(root, 'qpdf-core.js'));
const wasm = readFileSync(join(root, 'qpdf-core.wasm'));

describe('reviewed PDF engine identity', () => {
  it('accepts the reviewed JavaScript and WASM distribution', () => {
    expect(() => verifyQpdfEngine(javascript, wasm)).not.toThrow();
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
