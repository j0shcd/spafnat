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
const BUILD_INPUTS = {
  SDK_COMMIT: 'aeb67926e7de656da38bc807d83050af93578758',
  SDK_IMAGE_DIGEST: 'f174124ff798a3ead1abef247d9a849c270b642d552fea500a42565ff210f765',
  QPDF_SOURCE_SHA256: '8a58af5b6141319287c1883bec8bd1bd545b7567b7fc5e6ce5d25a1c85f36397',
  ZLIB_SOURCE_SHA512: '16fea4df307a68cf0035858abe2fd550250618a97590e202037acd18a666f57afc10f8836cbbd472d54a0e76539d0e558cb26f059d53de52ff90634bbf4f47d4',
  LIBJPEG_SOURCE_SHA512: '7f733d79cf176c690dcf127352f9aa7ec48000455944f286faae606cdeada6f6865b4a3f9f01bda8947b5b1089bb3e52d2b56879b6e871279ec5cbd1829304dc',
  ZLIB_PATCH_COMMIT: 'df84af25dc1942490e1d1c899a07619152a46148',
  ZLIB_PATCH_SHA256: '110ff14375733173d8aa54574473424fbd7dfe4b81f1ca34a759c6fe14b15b14',
} as const;

type EngineManifest = {
  upstream?: { version?: string };
  nativeDependencies?: { zlib?: { version?: string; patch?: string }; libjpeg?: { version?: string } };
  files?: Record<string, { sha256?: string }>;
};
type BuildReceipt = { inputs?: Record<string, string> };

export function verifyQpdfBuild(manifest: EngineManifest, receipt: BuildReceipt): void {
  if (manifest?.upstream?.version !== '12.4.2' ||
    manifest?.nativeDependencies?.zlib?.version !== '1.3.2' ||
    manifest?.nativeDependencies?.zlib?.patch !== BUILD_INPUTS.ZLIB_PATCH_COMMIT ||
    manifest?.nativeDependencies?.libjpeg?.version !== '9f' ||
    Object.entries(ENGINE_HASHES).some(([name, hash]) => manifest?.files?.[name]?.sha256 !== hash) ||
    Object.entries(BUILD_INPUTS).some(([name, value]) => receipt?.inputs?.[name] !== value)) {
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
