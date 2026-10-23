import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import type { Plugin } from 'vite';

const MODULE_ID = 'virtual:spaf-qpdf-core';
const RESOLVED_ID = `\0${MODULE_ID}`;
const ENGINE_HASHES = {
  'qpdf-core.js': '0ead3c7e15498a0af4a59008952d9e59cee847733b612eb3b25da6957ee05138',
  'qpdf-core.wasm': '07ced6845a714be265c4e6c5a9515e1746cc71c7f193f357b912b9f74c53b50d',
} as const;

/** These hashes identify the reviewed qpdf 12.4.2 build, not just its wrapper. */
export function verifyQpdfEngine(javascript: Uint8Array, wasm: Uint8Array): void {
  for (const [name, bytes] of [['qpdf-core.js', javascript], ['qpdf-core.wasm', wasm]] as const) {
    if (createHash('sha256').update(bytes).digest('hex') !== ENGINE_HASHES[name]) {
      throw new Error(`Unreviewed PDF engine asset: ${name}`);
    }
  }
}

export function qpdfCorePlugin(emitNotices = true): Plugin {
  const root = dirname(createRequire(import.meta.url).resolve('@wasm-zoo/qpdf/manifest.json'));
  function verifiedSource(): string {
    const javascript = readFileSync(join(root, 'qpdf-core.js'));
    verifyQpdfEngine(javascript, readFileSync(join(root, 'qpdf-core.wasm')));
    // The package ships a classic-script factory. Export it statically for our
    // existing module worker, without eval, Blob workers or the browser wrapper.
    return `${javascript.toString('utf8')}\nexport default createQpdfCore;\n`;
  }
  return {
    name: 'spaf-qpdf-core',
    resolveId: id => id === MODULE_ID ? RESOLVED_ID : undefined,
    load: id => id === RESOLVED_ID ? verifiedSource() : undefined,
    generateBundle() {
      if (!emitNotices) return;
      verifiedSource();
      const files = ['LICENSE', 'LICENSE.wasm-zoo.txt', 'BUILDINFO.txt', 'manifest.json', 'provenance.json', 'sbom.cdx.json',
        ...readdirSync(join(root, 'LICENSES')).map(name => `LICENSES/${name}`)];
      for (const name of files) {
        this.emitFile({ type: 'asset', fileName: `pdf-engine/${name}`, source: readFileSync(join(root, name)) });
      }
    },
  };
}
