# spafnat

Website for the Société des Poètes et Artistes de France (SPAF), founded in 1958.
Live: [spafnat.com](https://spafnat.com). Content belongs to SPAF.

## Constraints and architecture

No operating budget. The administration must work for a non-technical team.
Keep Cloudflare Pages, KV and private R2 storage; no paid service or storage
migration is authorized. All public and administrative content is in French.

- React 19, React Router, TypeScript, Vite 8, Tailwind 4 and shadcn/ui.
- Browser minimum: Safari 16.4, Chrome 111 or Firefox 128 (approved for Tailwind 4).
- `src/AppRoutes.tsx` owns routes; `src/components/Layout.tsx` wraps public pages.
- `functions/api/` contains Cloudflare Pages Functions, using Web Crypto rather
  than Node APIs. `functions/env.d.ts` defines the bindings.
- KV stores sessions, best-effort limits, visitor estimates, concours category
  arrays and delegations. R2 stores PDFs, generated revue covers and congress photos.
- `src/config/documents.ts`, `concours.ts` and `delegations.ts` own shared content
  contracts. Runtime document availability comes from R2, without static fallback.
- `/api/media/*` permits only the public `documents/`, `concours/` and `congres/`
  prefixes. Administrative writes require a signed JWT and a retained KV session.
- Contact mail uses Resend. The recipient and credentials are deployment secrets.

| API | Purpose |
| --- | --- |
| `/api/gallery`, `/api/gallery/years` | Public congress archive |
| `/api/concours`, `/api/delegations` | Public managed content |
| `/api/contact`, `/api/visit` | Contact form and approximate visitor counter |
| `/api/media/*` | Public reads from permitted R2 prefixes |
| `/api/auth/*` | Login, verification and logout |
| `/api/admin/*` | Authenticated content management |

## Development and verification

Use Node 24 LTS, at least 24.22.1, and npm 10 or newer; `.nvmrc` and
`.node-version` pin the reviewed security baseline. `npm ci --ignore-scripts` installs the pinned lockfile
without package lifecycle scripts. `.npmrc` enforces supported engines and disables
dependency lifecycle scripts by default. The manifest also permits Node 26.12.1
or later within Node 26; unreviewed future majors are excluded.
On an iCloud-synced machine, install outside the synced tree and move the finished
`node_modules` into place if conflict copies appear. Do not delete Git index
conflict copies as part of dependency repair.

```sh
npm ci --ignore-scripts
npm run check                  # all five checks below; at most eight lint warnings
npm run audit:deps             # full tree, including build tools; fails on any advisory
npm run dev                    # frontend at localhost:8080
npm run preflight              # Cloudflare compatibility
npm run typecheck              # strict frontend, Vite config and Functions
npm run lint
npm run test:run
npm run build
npx wrangler pages dev dist --kv SPAF_KV --r2 SPAF_MEDIA
```

Vite alone does not serve the API. The Cloudflare command uses local storage;
use a separate `--persist-to` directory for isolated tests. Never exercise the
contact form's successful send path against production as a routine check.

All five verification commands must pass before committing. Lint currently has
eight existing Fast Refresh warnings. The main bundle still triggers Vite's
500 kB warning; reducing it is separate performance work.

Configure Production and Preview bindings/secrets separately in the Cloudflare
Dashboard. `wrangler.toml` contains local-development settings, not proof of
production configuration. Keep `.dev.vars` untracked. Set `ALLOWED_ORIGINS`
explicitly per deployment; production should use
`https://spafnat.com,https://www.spafnat.com`.

## Storage and security boundaries

JSON bodies are limited while streaming. Multipart bodies have a bounded total
allowance that includes framing and the optional cover; each main file remains
limited to 5 MiB and each cover to 2 MiB. Documents and concours accept PDFs;
photos accept JPEG/PNG/WebP. MIME, extension and magic bytes must agree.

Revue covers carry the source PDF's unique upload version. GET and HEAD refuse
mismatched or legacy unversioned covers, allowing the existing PDF-rendering
fallback. A new PDF removes its old cover first; failed cover generation or
storage cannot silently reuse the previous issue's image. Normal replacement
uploads create versioned covers. Existing PDFs need no migration.

Public concours reads fetch the three canonical category keys in parallel.
The retired `concours:all` KV key is ignored and can be left in place. Public
reads never rebuild or write it. Failed R2 deletions preserve concours metadata
for retry; missing R2 objects can be deleted again safely.

All R2 listing endpoints follow cursors through `functions/lib/r2.ts` and request
custom metadata directly where needed. New photo/concours objects use conditional R2 writes
with a unique-name retry, so concurrent identical filenames cannot overwrite each other.
Listings fail visibly above 10,000 objects,
50 pages or a stalled cursor; they never return a silent partial archive.

`functions/api/_middleware.ts` applies security headers to every API response,
including errors. Auth/admin responses additionally use `Cache-Control: no-store`.
Static pages retain `public/_headers`; the contract test compares the policies
and discovers all API routes. Generated Worker routes include only `/api/*`, so
this middleware does not turn static page visits into Function invocations.
Cloudflare documents that [_headers does not cover Function responses](https://developers.cloudflare.com/pages/configuration/headers/).

All admin API requests bypass the browser HTTP cache, including public list URLs
used after uploads/deletions. Document and concours hooks revalidate on focus.
Gallery metadata expires after
one minute and local photo mutations invalidate the affected year's cache.
Late requests cannot restore invalidated cache entries or overwrite a different
selected year. Public gallery HTTP/CDN caching still allows bounded staleness;
local invalidation does not promise immediate cross-device updates.

## Maintainability and security audit, 22 October 2026

Scope: the entire checkout, not only recent changes. Three independent read-only
review agents applied Thermo-Nuclear, Ponytail and Matt Pocock reviews. The Matt
review used project documentation as its spec, with separate Standards and Spec
reviewers. The owner explicitly rejected a storage/platform migration because
zero operating cost remains a hard constraint.

### Confirmed findings and disposition

| Severity | Baseline failure | Result |
| --- | --- | --- |
| P1 | Parallel login/contact requests bypass KV read-then-write limits. Ten parallel login attempts left a count of one; ten contact requests could all send. | **Retained limitation**; no atomic distributed limit is claimed. See below. |
| P1 | A late public concours read restores an obsolete aggregate indefinitely. | Fixed by deleting the persistent derived-cache mechanism and invalidation code. |
| P1 | JSON guard buffers an unlimited streamed body before checking its size. | Fixed with a shared byte-bounded reader that cancels on overflow. |
| P2 | A valid image can overwrite a PDF document slot; a PDF can enter the photo gallery. | Fixed at the upload destination boundary, before any storage write. |
| P2 | Multipart framing and optional covers make permitted 5 MiB files fail. | Fixed with separate request and per-file limits in both upload handlers. |
| P2 | Failed R2 deletion returns success, removes the listing and leaves a public orphan. | Fixed: storage failure returns an error and retains metadata. |
| P2 | Replacing a revue can display the old issue's cover. | Fixed: remove old derivatives and enforce the unique PDF/cover version relationship on GET and HEAD. |
| P2 | Whole-array concours/delegation saves overwrite concurrent changes. | **Retained limitation** of the selected KV design. |
| P2 | Concurrent uploads with the same filename can overwrite each other between the existence check and write. | Fixed with conditional R2 creation and one unique-name retry, verified against the local R2 runtime. |
| P2 | First-page-only R2 listings hide later files; admin listing also performs one HEAD per file. | Fixed with bounded cursor traversal and included custom metadata. |
| P2 | A late photo request replaces the list for a different selected year. | Fixed with year and request identity checks. |
| P2 | Gallery metadata remains cached for the entire tab lifetime. | Fixed with expiry and mutation invalidation, including protection against late cache restoration. |
| P2 | Document and concours focus handlers retain stale state for five minutes. | Fixed: focus bypasses recent caches; concours bypasses HTTP cache too. |
| P2 | Object-prototype names such as `constructor` pass concours category checks. | Fixed with one shared own-property category validator at every endpoint. |
| P2 | API responses lack the static security-header policy. | Fixed centrally, with a discovered-route contract test and no-store auth/admin responses. |
| P2 | Default contact policy trusts unrelated `*.pages.dev` origins and excludes the actual production domain. | Fixed: defaults permit SPAF domains and its own previews. Explicit allowlists still take priority; Origin is not bot authentication. |
| Security | Dependency audit reports 34 affected package entries, including two critical development-tool entries. | Compatible updates removed most entries; the 23 October migration below removes the remaining seven. The full audit now reports zero. |
| Maintainability | Domain models are independently declared in multiple consumers; normal typecheck does not inspect frontend source. | Reused canonical models and made the normal check compile strict frontend source, Vite configuration and Functions. |

### Matt Pocock: Standards

One baseline finding: AGENTS.md requires throttling on all writes, but the admin
middleware checks authentication/session only. Authenticated write quotas remain
missing. Adding per-file KV writes also consumes the shared free allowance and
would still not provide atomic enforcement. This is unresolved, not a Standards
pass. Normal 180-photo batches must remain possible.

### Matt Pocock: Spec

Four baseline findings, all fixed: document focus refresh, concours focus refresh,
failed concours deletion losing retry access, and permanent stale aggregate data.
The spec sources were the maintained task list's availability, deletion and
canonical-order contracts. Worst baseline Spec issue: false successful deletion.

Standards: **1 retained finding**. Spec: **4 findings fixed**.

### Risks retained under the zero-cost constraint

- **KV concurrency:** login/contact limits are best effort. Concurrent edits can
  lose changes; session revocation can take time to propagate; the visitor count
  is approximate and can lose increments. Use one admin tab and wait for each mutation to finish;
  that is an operating precaution, not a server guarantee. No in-process lock is
  presented as a distributed fix. [Cloudflare's KV consistency contract](https://developers.cloudflare.com/kv/concepts/how-kv-works/)
  and [concurrent-write warning](https://developers.cloudflare.com/kv/api/write-key-value-pairs/)
  explain these boundaries.
- **Admin quotas:** the documented all-writes throttling target is not met. A valid
  admin token can generate repeated storage operations. No additional account
  rules were installed, and their availability/entitlements were not verified.
- **Build dependencies:** the seven remaining Tailwind 3 audit entries were
  removed in the approved Tailwind 4 migration on 23 October. The full audit,
  including development tools, now reports zero advisories. See the current
  maintenance status below; the older verification snapshots are historical.
- **Deployment evidence:** production bindings, permissions, secrets, billing,
  remote archive contents, deployed revision and deployed headers were not audited.
  No production data, mail, accounts or infrastructure were changed. The existing
  SPA `_redirects` rule is ignored by current Wrangler as redundant/looping; local
  Pages automatic SPA fallback still served `/congres` and `/admin/login` correctly.

### Verification and next step

The separate security-audit verification passed 305 tests in 20 files, including 122 new regression/contract assertions.
Reintroducing the baseline defects produced 120 failures across the three added
suites; all fixes were then restored. Independent follow-up reviewers found no
new substantive blockers. Strict typechecks, lint (zero errors/eight existing
warnings), preflight, frontend build and Pages Functions compilation passed.
An isolated local Cloudflare run checked ten HTTP responses: unauthorized admin
and verification, rejected contact origin, oversized login, blocked private media,
public lists, inherited category rejection and two SPA routes. Headers and status
codes matched expectations. A separate live local R2 check preserved both payloads
from simultaneous identical filenames. No successful email send or production write ran.

Tests own the durable evidence: `src/tests/audit-boundaries.test.ts`,
`audit-freshness.test.tsx`, `api-security-contract.test.ts`, existing routing/admin
suites and the lockfile. Temporary logs are supplementary and are not needed to
restart the work.

The combined release includes those four security commits and the photo/PDF
compression and printable-guide changes. All 338 tests, strict typechecks,
preflight and build pass; lint retains the same eight warnings. The API policy
now matches the static WebAssembly permission required by PDF compression;
the existing policy contract failed 96 cases before that correction. Three
independent GPT-6.1 Sol reviewers at medium effort found no new integration
findings across Thermo-Nuclear, Ponytail and Matt Pocock Standards/Spec.
Ten isolated local Cloudflare API checks passed, covering streamed request limits,
destination validation, full-size multipart uploads, cover replacement, filename
collisions and canonical concours reads. A browser run through those handlers
reduced a 7,814,566-byte PDF to 3,044,935 bytes with text, form, link, bookmark and
linked cover preserved; a 55,323,807-byte photo became a 3,476,141-byte JPEG,
and a small photo remained unchanged. The production dependency audit reports
zero advisories; at that snapshot the full audit retained seven build-chain
entries, since resolved by the dependency maintenance pass below.

Next bounded step: release local `main` through the existing Cloudflare process
when authorized, then verify the deployed revision, headers, admin file
replacement/deletion and preview/production separation. No push or deployment
was performed. Storage changes remain out of scope. HEIC support was declined;
no decoder dependency or implementation remains. See [the task list](project-notes/TODO.md)
for release status and [maintenance guidance](user_guides/MAINTENANCE.md) for
operational instructions.

## Dependency maintenance — 23 October 2026

**Implemented locally; not pushed or deployed.** Direct dependencies are pinned to
current stable releases checked against npm. React 19, Tailwind 4, Vite 8, ESLint 10,
Vitest 5 and PDF.js 6 replace their older major versions. The Tailwind migration
retains the existing design, with desktop/mobile browser checks. Two intentional
version constraints remain: TypeScript 6.0.3 satisfies typescript-eslint's current
`<6.1` peer range; `@types/node` 24 follows the Node 24 runtime rather than Node 26.
Recheck both constraints during updates; do not force incompatible versions.

PDF reduction now uses **qpdf 12.4.2**, from pinned `@wasm-zoo/qpdf@0.1.1`.
A build-time bridge imports the raw engine into our disposable worker; the package's
browser SDK is not used. Reviewed JavaScript and WASM hashes are verified by
`scripts/qpdf-vite-plugin.ts`; an unexpected change fails the build. The browser
loads only static, self-hosted assets after confirmation, with no Blob worker,
JavaScript eval, paid service or added CSP permission. Notices, engine build
information, provenance and SBOM ship under `/pdf-engine/`. The lazy worker/WASM
assets total about 2.24 MB before transfer compression. The 50 MiB input, 30-second
deadline and 4 MiB output bounds remain; the new engine copies input into its
filesystem. Its 512 MiB WASM memory maximum is not a total browser memory guarantee.
Older mobile-device peak memory remains unverified.

Verification: a clean install, all five checks, the full dependency audit and
Cloudflare Functions compilation pass. There are 354 passing tests. Regression
checks reject tampered engine assets, clean up failed PDF.js loads, and enforce
fresh admin lists; deliberately restoring each defect made its tests fail.
A local Cloudflare browser run under the production CSP compressed the large PDF
fixture to 3,044,935 bytes, preserved text/form/link/bookmark and generated its
matching cover. Cancel, signed, encrypted, corrupt and unreducible cases sent no
upload. The concours list refreshed immediately after a real local upload. A 48 MP photo
became a 3,476,141-byte JPEG; small photo/PDF fixtures stayed byte-for-byte unchanged.
No production data or credentials were used. Eight existing Fast Refresh
lint warnings and the main JavaScript bundle warning (about 753 kB) remain;
these are development/performance warnings, not dependency advisories. The hooks
linter's `set-state-in-effect` rule is explicitly deferred for the existing
fetch/subscription effects; its other recommended checks run.

### Update and security pipeline

- `.github/workflows/quality.yml` runs clean installation, all checks and Functions
  compilation for pull requests and `main`. Its dependency job runs daily at
  06:17 UTC, on PRs/pushes and manually. It audits the entire lockfile, including
  development/optional/peer packages, without installing or executing dependency
  code. Registry/network errors fail the job. CI resolves the latest Node 24.
- The same job checks the official Node release feed against `.nvmrc` and fails
  when a newer Node 24 security release exists. npm advisories do not cover Node's
  bundled runtime libraries. Review each new security baseline, then update both
  runtime pins, manifest/lockfile engines and this guide; verify the runtime used
  by the developer machine and Cloudflare build separately.
- `.github/workflows/codeql.yml` runs extended JavaScript/TypeScript security
  analysis for pull requests, `main` and weekly. Actions use full commit pins,
  limited permissions and no deployment secrets. Dependabot checks npm and Actions
  updates weekly, with a three-day cooldown for ordinary npm releases and coupled
  major upgrade groups. No automatic merging is configured.

GitHub's native [Dependabot alerts](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-alerts)
and [npm malware alerts](https://docs.github.com/en/code-security/concepts/supply-chain-security/malware-alerts)
complement the daily audit, subject to repository settings and advisory coverage.
They are not proof that an installed machine is clean. SHA-pinned Actions need
upstream advisory review as well: Dependabot vulnerability alerts do not currently
cover Actions pinned only by SHA. Keep the SHA pins rather than weakening them.
[Scheduled workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)
can be delayed and are disabled after 60 days of inactivity in a public repository.
Native alerts remain the independent advisory-triggered layer. Check the Actions
page at least monthly and after a quiet period; re-enable dormant schedules.

Use standard GitHub-hosted Linux runners for this public repository; these are
[free for public repositories](https://docs.github.com/en/actions/concepts/billing-and-usage).
No extra vendor, Cloudflare workload or repository write token is added. Renovate
would duplicate the updater and add another app; OSV is useful as an independent
audit cross-check; Scorecard assesses repository practices rather than package
exposure. Keep the existing GitHub/npm setup. For each update, review release notes,
run `npm run check` and `npm run audit:deps`, and exercise affected flows locally.
Engine upgrades also require provenance/notices, hash-pin review and real PDF
protection fixtures. Never suppress advisories or run `npm audit fix --force`.

### Vulnerability review — 27 October 2026

Scope: dependency baseline `4a847af`, all locked npm production/build/test/optional
packages, workflow actions and the Node runtime; recent upstream advisories from
29 September through 27 October, plus older relevant supply-chain incidents.
This is a dependency/exposure assessment, not a penetration test or host forensics.

- Live npm audit: **zero advisories**, including build tools (532 package nodes in
  npm's summary). Independent OSV query: **zero flagged versions** across all 528
  unique locked npm name/version pairs. Both are time-limited database results.
- **Node runtime fixed:** at audit start this machine reported 24.16.0, before the
  [21 October security release](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases).
  The [24.22.1 fixes](https://nodejs.org/en/blog/release/v24.22.1) include DNS NUL
  truncation (CVE-2026-105482), TLS validation (CVE-2026-105483, CVE-2026-106069,
  CVE-2026-106072), Brotli memory corruption/RCE (CVE-2026-111497), HTTP response
  confusion (CVE-2026-105481), snapshot randomness (CVE-2026-106074) and permission
  checks (CVE-2026-106073), plus bundled library/root-certificate updates. These
  concern developer/build tooling here: production Functions run on Cloudflare
  Workers, not a Node server. No exploit or compromise was demonstrated. Runtime
  floors/pins are raised to 24.22.1 (or 26.12.1 on Node 26). After approval,
  `volta install node@24.22.1` updated the global default; `node --version` and
  `volta which node` confirm it. Cloudflare's build runtime remains unverified.
- **Undici already fixed:** Wrangler 4.153.0 in `4a847af` resolves the tooling
  chain to Undici 7.30.1 and 8.12.3, meeting the
  [15 October patched versions](https://github.com/nodejs/undici/releases/tag/v8.12.2).
  No application import of Undici was found; the separate Node-bundled copy still
  requires the runtime upgrade above.
- **Vite already fixed:** 8.3.5 is beyond the affected 8.3.0–8.3.2 range in the
  [6 October advisories](https://github.com/vitejs/vite/security/advisories).
  The 21 October v6-only query bypass affects 6.4.4, which is absent. These are
  development-server issues; the production site serves built assets.
- React 19.3.1/Router 7.18.4 and PDF.js 6.4.299 have no matched current advisory.
  This app uses client-side React, without `react-server-dom-*`, SSR or RSC
  handlers; the [RSC vulnerability family](https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components)
  has no installed target. PDF.js exceeds the
  [6.2.108 security fix](https://github.com/mozilla/pdf.js/security/advisories/GHSA-hq66-cqwq-w95j).
- **Known poisoned package versions absent:** compared the installed lockfile to
  the [Keyv/cacheable incident's published versions](https://www.aikido.dev/blog/keyv-and-friends-compromised-in-npm-supply-chain-attack).
  Present versions are keyv 5.6.0, flat-cache 6.1.23, file-entry-cache 11.1.5,
  cacheable 2.5.0, @cacheable/memory 2.2.0 and @cacheable/utils 2.5.0; none equal
  the reported poisoned versions. No unnecessary library upgrade was made solely
  to claim a change. Lockfile/advisory checks cannot exclude historical exposure,
  unknown malware or credentials stolen outside this checkout.
- **Vitest already fixed:** @vitest/ui and @vitest/mocker are 5.0.5. This
  includes the 21 October fixes for development-server file disclosure
  ([CVE-2026-112948](https://github.com/vitest-dev/vitest/security/advisories/GHSA-p458-7748-mcp3)),
  mock-registration injection (CVE-2026-112949) and Windows traversal
  (CVE-2026-112950). None require a further update of this lockfile.
- **Embedded zlib unresolved:** qpdf's reviewed WASM engine declares zlib 1.3.2,
  within the affected range for **CVE-2026-85091**, a nonblocking gzip-writer
  overflow. The [upstream fix](https://github.com/madler/zlib/commit/df84af25dc)
  postdates zlib 1.3.2; the declared
  [Emscripten 6.0.8 port](https://github.com/emscripten-core/emscripten/blob/6.0.8/tools/ports/zlib.py)
  uses that release without an indicated backport. The reviewed PDF worker uses
  fixed MEMFS paths and qpdf's
  [deflate/inflate pipeline](https://raw.githubusercontent.com/qpdf/qpdf/v12.4.2/libqpdf/Pl_Flate.cc),
  rather than nonblocking gzip-file writes. The vulnerable path was not observed;
  exploitability is not demonstrated, and binary exclusion/patch status is not
  proven. Do not label this engine CVE-free because npm audit passes. Next fix:
  obtain a reproducible engine build with the upstream zlib patch (or reliable
  link/call evidence excluding the vulnerable functions), review provenance and
  licenses, update verified hashes, and rerun real compression/protected/corrupt
  PDF fixtures under the production CSP. Do not edit installed WASM bytes or
  bypass the hash guard. No reviewed replacement was available in this pass.
- **Native inventory caveat:** the wrapper remains @wasm-zoo/qpdf 0.1.1/qpdf
  12.4.2 with zlib 1.3.2 and IJG libjpeg 9f, using native crypto without OpenSSL.
  Its SBOM incorrectly gives libjpeg's version as 6.0.8 (the Emscripten version);
  BUILDINFO/source metadata says 9f. Use the reviewed native inventory until the
  upstream SBOM is corrected. No specific new applicable libjpeg 9f or qpdf CVE
  was found in the primary sources reviewed; this is not a clean-bill guarantee.

**Public deployment evidence:** read-only requests to spafnat.com returned 200;
the deployed main JavaScript, CSS and `/pdf-engine/BUILDINFO.txt` matched the clean
local build byte-for-byte by SHA-256. The embedded zlib finding therefore also
applies to the publicly shipped engine inventory. This does not establish the
production Functions revision, Cloudflare settings or runtime account configuration.

**Remote evidence, checked 27 October:** the repository is public. The baseline
was `4a847af`; the owner then authorized publishing security commit `8246089`.
Both security workflows are active. On that exact commit,
[Quality](https://github.com/j0shcd/spafnat/actions/runs/40520509521) passed both
`Code and tests` and `Dependency security`, and
[CodeQL](https://github.com/j0shcd/spafnat/actions/runs/40520509928) passed. The daily
06:17 UTC dependency/Node scan is published on the default branch; its first
scheduled invocation and notification delivery have not yet been observed.
The unauthenticated API rate limit was respected; the completed run summaries were
verified through the public Actions page. The weekly dependency run
[failed on 26 October](https://github.com/j0shcd/spafnat/actions/runs/40327528245)
before the Wrangler fix; the subsequent
[Quality run passed](https://github.com/j0shcd/spafnat/actions/runs/40362000332), as did
[CodeQL](https://github.com/j0shcd/spafnat/actions/runs/40362000394). This supersedes
older notes that the pipeline was unpublished. A successful CodeQL run proves
analysis/upload execution, not an empty alert list. Dependency graph, native alert
settings, security-update enablement and notification delivery require account
access and remain unverified. Open Dependabot PRs for TypeScript 7 and @types/node
26 are ordinary major updates, not evidence of unpatched CVEs; keep the documented
compatibility holds until reviewed.

**Active local follow-up:** the existing daily 09:00 security-monitor automation
was updated in place to include SPAF's npm/runtime/Actions and embedded native
libraries, the zlib finding, SBOM caveat and failed/dormant cloud monitoring. It
reports meaningful changes and required action, without repeating unchanged
findings. The existing cross-project/Homebrew work and schedule were preserved.
It requires the computer on and app running for local-file work, per the
[scheduled-task documentation](https://learn.chatgpt.com/docs/automations?surface=app);
it complements the independent GitHub cloud checks. Notification delivery and its
next unattended run remain to be observed.

**Verification:** clean temporary installation with lifecycle scripts disabled;
preflight, strict typechecks, lint (eight existing warnings), all 354 tests,
production build and Cloudflare Functions compilation passed. Registry signature
verification passed for all 423 installed packages; 213 also had verified
attestations. Signatures attest origin/integrity, not absence of malicious code.
After the initial checks on the existing runtime, the official Node 24.22.1
archive was downloaded and verified against its official SHA-256 before execution.
A second clean install (without an engine override) and all five checks passed on
Node 24.22.1/npm 11.19.1. The global Volta default was then upgraded to Node
24.22.1, with the existing npm 12.2.0 default retained. The actual workflow guard
also passed against the live Node release feed and seven fixture cases
(current/stale/new security release, invalid pin, empty feed, HTTP failure and
inconsistent runtime pins). Removing its stale-version guard made the regression
fail. An npm install fixture rejected Node 24.16.0; restoring the old engine range
made the same rejection assertion fail. The live lockfile-only audit passed.
No tracked application tests were changed for this configuration-only work.

**Tool-specific runtime follow-up:** `volta list --default` still shows installed
Codex 0.161.0 and pnpm 11.5.1 attached to Node 24.16.0. Updating Volta's default does
not rebind those installed tools. They are outside SPAF's npm build/test process;
their separate runtimes remain an open host-tooling item. Rebind/reinstall the same
tool versions under a patched runtime and verify each launcher before claiming
that all local Node consumers are patched. Their versions and pins were not changed.

**Remaining plan:** observe the first daily invocation and verify a controlled
failure notification. In repository
Settings → Code security, verify Dependency graph, Dependabot alerts (including
malware) and security updates. Set personal security/workflow notifications and
verify delivery; scheduled failure notifications depend on the schedule actor's
[notification settings](https://docs.github.com/en/actions/concepts/workflows-and-actions/notifications-for-workflow-runs).
`main` is currently **unprotected** according to the public branch API. Require
`Code and tests`, `Dependency security` and CodeQL results before merges; verify
Cloudflare's independent deployment gate/build Node version before treating these
checks as release blockers. Retained KV/admin-quota limitations above are unchanged.
No production compromise assessment, Cloudflare deployment verification,
repository-security/account setting change or email send is claimed by this audit.
The approved push may trigger the existing Cloudflare deployment independently.
The audit/publication outcome is recorded here and in the task list.
