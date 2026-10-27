#!/usr/bin/env bash
# Run only in the digest-pinned SDK container from pdf-engine.yml.
# Produces a review artifact, never installs, publishes or deploys it.
set -euo pipefail

sdk_commit=aeb67926e7de656da38bc807d83050af93578758
image_digest=f174124ff798a3ead1abef247d9a849c270b642d552fea500a42565ff210f765
patch_commit=df84af25dc1942490e1d1c899a07619152a46148
patch_digest=110ff14375733173d8aa54574473424fbd7dfe4b81f1ca34a759c6fe14b15b14
qpdf_digest=8a58af5b6141319287c1883bec8bd1bd545b7567b7fc5e6ce5d25a1c85f36397
zlib_digest=16fea4df307a68cf0035858abe2fd550250618a97590e202037acd18a666f57afc10f8836cbbd472d54a0e76539d0e558cb26f059d53de52ff90634bbf4f47d4
jpeg_digest=7f733d79cf176c690dcf127352f9aa7ec48000455944f286faae606cdeada6f6865b4a3f9f01bda8947b5b1089bb3e52d2b56879b6e871279ec5cbd1829304dc

[[ -f /.dockerenv ]] || { echo 'Use the pinned SDK container; no host installation is supported' >&2; exit 1; }
[[ "$(emcc -dumpversion)" == 6.0.8 ]] && emcc --version | grep -Fq "$sdk_commit"
[[ -d /out && ! -L /out ]] || { echo '/out must be a new mounted output directory' >&2; exit 1; }
[[ -z "$(find /out -mindepth 1 -maxdepth 1 -print -quit)" ]] || { echo 'Refusing to overwrite existing output' >&2; exit 1; }
work="$(mktemp -d /tmp/spaf-qpdf.XXXXXXXX)"
trap 'rm -rf "$work"' EXIT
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y --no-install-recommends ca-certificates curl cmake make patch python3

fetch() { curl --fail --location --silent --show-error --max-time 180 "$1" -o "$2"; }
verify() { printf '%s  %s\n' "$2" "$1" | sha256sum --check --status; }
unpack() { mkdir "$2"; tar -xzf "$1" --strip-components=1 -C "$2"; }
fetch https://github.com/qpdf/qpdf/releases/download/v12.4.2/qpdf-12.4.2.tar.gz "$work/qpdf.tar.gz"
verify "$work/qpdf.tar.gz" "$qpdf_digest"
fetch https://github.com/madler/zlib/archive/refs/tags/v1.3.2.tar.gz "$work/zlib.tar.gz"
printf '%s  %s\n' "$zlib_digest" "$work/zlib.tar.gz" | sha512sum --check --status
fetch "https://github.com/madler/zlib/commit/$patch_commit.patch" "$work/zlib.patch"
verify "$work/zlib.patch" "$patch_digest"
fetch https://storage.googleapis.com/webassembly/emscripten-ports/jpegsrc.v9f.tar.gz "$work/jpeg.tar.gz"
printf '%s  %s\n' "$jpeg_digest" "$work/jpeg.tar.gz" | sha512sum --check --status
unpack "$work/qpdf.tar.gz" "$work/qpdf"
unpack "$work/zlib.tar.gz" "$work/zlib"
unpack "$work/jpeg.tar.gz" "$work/jpeg"
patch --directory="$work/zlib" --strip=1 --fuzz=0 --dry-run < "$work/zlib.patch"
patch --directory="$work/zlib" --strip=1 --fuzz=0 < "$work/zlib.patch"
grep -Fq 'state->strm.avail_in = 0;' "$work/zlib/gzwrite.c"
grep -Fq 'state->strm.next_in = state->in;' "$work/zlib/gzwrite.c"

# Compile our verified patched zlib directly. Do not use the SDK's unpatched port.
(
  cd "$work/zlib"
  export CFLAGS='-O2 -fwasm-exceptions'
  emconfigure ./configure --static
  emmake make -j2 libz.a
)
jpeg_recipe=/emsdk/upstream/emscripten/tools/ports/libjpeg.py
grep -Fq "VERSION = '9f'" "$jpeg_recipe"
grep -Fq "HASH = '$jpeg_digest'" "$jpeg_recipe"
embuilder build libjpeg
sysroot="$(em-config CACHE)/sysroot"
libdir="$sysroot/lib/wasm32-emscripten"
mkdir "$work/evidence"
link_flags="-O2 -fwasm-exceptions -sDYNAMIC_EXECUTION=0 -sMODULARIZE=1 -sEXPORT_NAME=createQpdfCore -sENVIRONMENT=web,worker -sALLOW_MEMORY_GROWTH=1 -sINITIAL_MEMORY=33554432 -sMAXIMUM_MEMORY=536870912 -sSTACK_SIZE=2097152 -sINVOKE_RUN=0 -sEXIT_RUNTIME=0 -sFORCE_FILESYSTEM=1 -sINCOMING_MODULE_JS_API=wasmBinary,locateFile,print,printErr,thisProgram -sEXPORTED_RUNTIME_METHODS=FS,callMain -Wl,-Map=$work/evidence/qpdf-link.map -Wl,--why-extract=$work/evidence/qpdf-extractions.txt"
emcmake cmake -S "$work/qpdf" -B "$work/build" \
  -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=OFF -DBUILD_STATIC_LIBS=ON \
  -DBUILD_DOC=OFF -DINSTALL_EXAMPLES=OFF -DINSTALL_PKGCONFIG=OFF -DINSTALL_CMAKE_PACKAGE=OFF \
  -DUSE_IMPLICIT_CRYPTO=OFF -DREQUIRE_CRYPTO_NATIVE=ON -DPKG_CONFIG_EXECUTABLE=/usr/bin/false \
  -DZLIB_H_PATH="$work/zlib" -DZLIB_LIB_PATH="$work/zlib/libz.a" \
  -DLIBJPEG_H_PATH="$sysroot/include" -DLIBJPEG_LIB_PATH="$libdir/libjpeg.a" \
  '-DCMAKE_C_FLAGS=-O2 -fwasm-exceptions' '-DCMAKE_CXX_FLAGS=-O2 -fwasm-exceptions' \
  "-DCMAKE_EXE_LINKER_FLAGS=$link_flags"
grep -Fq "$work/zlib/libz.a" "$work/build/CMakeCache.txt"
cmake --build "$work/build" --target qpdf -j2

pkg="$work/package"
mkdir -p "$pkg/LICENSES"
cp "$work/build/qpdf/qpdf.js" "$pkg/qpdf-core.js"
cp "$work/build/qpdf/qpdf.wasm" "$pkg/qpdf-core.wasm"
cp "$work/qpdf/LICENSE.txt" "$pkg/LICENSES/QPDF-LICENSE.txt"
cp "$work/qpdf/NOTICE.md" "$pkg/LICENSES/QPDF-NOTICE.md"
cp "$work/zlib/LICENSE" "$pkg/LICENSES/zlib-LICENSE.txt"
cp "$work/jpeg/README" "$pkg/LICENSES/libjpeg-README.txt"
cp /emsdk/upstream/emscripten/LICENSE "$pkg/LICENSES/Emscripten-LICENSE.txt"
cp "$work/zlib.patch" "$pkg/zlib-security.patch"
printf 'qpdf 12.4.2: Apache-2.0; zlib: Zlib; IJG libjpeg 9f and Emscripten notices in LICENSES/\n' > "$pkg/LICENSE"
export SPAF_PDF_PACKAGE="$pkg" SPAF_PDF_EVIDENCE="$work/evidence" SDK_COMMIT="$sdk_commit" SDK_IMAGE_DIGEST="$image_digest" ZLIB_PATCH_COMMIT="$patch_commit" ZLIB_PATCH_SHA256="$patch_digest" QPDF_SOURCE_SHA256="$qpdf_digest" ZLIB_SOURCE_SHA512="$zlib_digest" LIBJPEG_SOURCE_SHA512="$jpeg_digest"
python3 - <<'PY'
import os,json,hashlib,pathlib
p=pathlib.Path(os.environ['SPAF_PDF_PACKAGE'])
dump=lambda name,value:(p/name).write_text(json.dumps(value,indent=2)+'\n')
sha=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()
dump('package.json',{'name':'@spaf/qpdf-engine','version':'12.4.2-spaf.1','type':'module','license':'SEE LICENSE IN LICENSE','exports':{'./manifest.json':'./manifest.json','./qpdf-core.wasm':'./qpdf-core.wasm'}})
inputs={name:os.environ[name] for name in ['SDK_COMMIT','SDK_IMAGE_DIGEST','ZLIB_PATCH_COMMIT','ZLIB_PATCH_SHA256','QPDF_SOURCE_SHA256','ZLIB_SOURCE_SHA512','LIBJPEG_SOURCE_SHA512']}
dump('provenance.json',{'recipe':'scripts/build-pdf-engine.sh','repository':'https://github.com/j0shcd/spafnat','commit':os.environ.get('BUILD_COMMIT'),'run':os.environ.get('BUILD_RUN_URL'),'inputs':inputs,'note':'Build receipt; not a signed SLSA attestation'})
dump('manifest.json',{'schemaVersion':1,'upstream':{'name':'qpdf','version':'12.4.2'},'nativeDependencies':{'zlib':{'version':'1.3.2','patch':inputs['ZLIB_PATCH_COMMIT']},'libjpeg':{'version':'9f'}},'files':{name:{'sha256':sha(p/name),'bytes':(p/name).stat().st_size} for name in ['qpdf-core.js','qpdf-core.wasm']}})
dump('sbom.cdx.json',{'bomFormat':'CycloneDX','specVersion':'1.6','version':1,'components':[{'type':'library','name':name,'version':version} for name,version in [('qpdf','12.4.2'),('zlib','1.3.2+df84af25dc1942490e1d1c899a07619152a46148'),('libjpeg','9f')]]})
(p/'BUILDINFO.txt').write_text('SPAF reviewed PDF engine\nQPDF version: 12.4.2\nEmscripten version: 6.0.8\nzlib version: 1.3.2 + CVE-2026-85091 fix '+inputs['ZLIB_PATCH_COMMIT']+'\nlibjpeg version: 9f\nNative crypto; no OpenSSL; single-threaded MEMFS worker\n32 MiB initial / 512 MiB maximum WASM memory; no dynamic code execution\nSee provenance.json for verified source and patch digests.\n')
PY
tar -czf "$work/evidence/spaf-qpdf-engine.tgz" -C "$work" package
# Publish only newly owned paths, with a manifest before any artifact file.
python3 - <<'PY'
import os,json,hashlib,pathlib,shutil
src=pathlib.Path(os.environ['SPAF_PDF_EVIDENCE']);dst=pathlib.Path('/out')
files=list(src.iterdir())
manifest={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
with (dst/'ownership.json').open('x') as f:json.dump({'owner':'spaf-pdf-engine-build','files':manifest},f,indent=2)
for p in files:
 with (dst/p.name).open('xb') as target,p.open('rb') as source:shutil.copyfileobj(source,target)
print(json.dumps(manifest,indent=2))
PY
