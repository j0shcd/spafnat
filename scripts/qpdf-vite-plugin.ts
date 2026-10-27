import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import type { Plugin } from 'vite';

const MODULE_ID = 'virtual:spaf-qpdf-core';
const RESOLVED_ID = `\0${MODULE_ID}`;
const ENGINE_HASHES = {
  'qpdf-core.js': '0ead3c7e15498a0af4a59008952d9e59cee847733b612eb3b25da6957ee05138',
  'qpdf-core.wasm': 'c15716e69adfa3d3aab74e30c95b5aa5fac69ecd45dc1103efad5fd13b8de176',
} as const;

type EngineManifest = {
  upstream?: { version?: string };
  nativeDependencies?: { zlib?: { patch?: string }; libjpeg?: { version?: string } };
  files?: Record<string, { sha256?: string }>;
};
type BuildReceipt = { inputs?: Record<string, string> };

export function verifyQpdfBuild(manifest: EngineManifest, receipt: BuildReceipt): void {
  const patch = 'df84af25dc1942490e1d1c899a07619152a46148';
  if (manifest?.upstream?.version !== '12.4.2' ||
    manifest?.nativeDependencies?.zlib?.patch !== patch ||
    manifest?.nativeDependencies?.libjpeg?.version !== '9f' ||
    Object.entries(ENGINE_HASHES).some(([name, hash]) => manifest?.files?.[name]?.sha256 !== hash) ||
    receipt?.inputs?.ZLIB_PATCH_COMMIT !== patch ||
    receipt?.inputs?.ZLIB_PATCH_SHA256 !== '110ff14375733173d8aa54574473424fbd7dfe4b81f1ca34a759c6fe14b15b14') {
    throw new Error('Unreviewed PDF engine build inputs');
  }
}

/** Hashes bind the reviewed zlib-patched qpdf build to the runtime assets. */
export function verifyQpdfEngine(javascript: Uint8Array, wasm: Uint8Array): void {
  for (const [name, bytes] of [['qpdf-core.js', javascript], ['qpdf-core.wasm', wasm]] as const) {
    if (createHash('sha256').update(bytes).digest('hex') !== ENGINE_HASHES[name]) {
      throw new Error(`Unreviewed PDF engine asset: ${name}`);
    }
  }
}

export function qpdfCorePlugin(emitNotices = true): Plugin {
  const root = dirname(createRequire(import.meta.url).resolve('@spaf/qpdf-engine/manifest.json'));
  function verifiedSource(): string {
    verifyQpdfBuild(
      JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8')),
      JSON.parse(readFileSync(join(root, 'provenance.json'), 'utf8')),
    );
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
      const files = ['LICENSE', 'BUILDINFO.txt', 'manifest.json', 'provenance.json', 'sbom.cdx.json', 'zlib-security.patch',
        ...readdirSync(join(root, 'LICENSES')).map(name => `LICENSES/${name}`)];
      for (const name of files) {
        this.emitFile({ type: 'asset', fileName: `pdf-engine/${name}`, source: readFileSync(join(root, name)) });
      }
    },
  };
}
