# spafnat

Website for the Société des Poètes et Artistes de France (SPAF), founded in 1958.
Live: [spafnat.com](https://spafnat.com). Content belongs to SPAF.

## Constraints and architecture

No operating budget. The administration must work for a non-technical team.
Keep Cloudflare Pages, KV and private R2 storage; no paid service or storage
migration is authorized. All public and administrative content is in French.

- React 18, React Router, TypeScript, Vite, Tailwind 3 and shadcn/ui.
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

Use Node 22 or newer and npm 10 or newer. `npm ci` installs the pinned lockfile.
On an iCloud-synced machine, install outside the synced tree and move the finished
`node_modules` into place if conflict copies appear. Do not delete Git index
conflict copies as part of dependency repair.

```sh
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

Document and concours hooks revalidate on focus. Gallery metadata expires after
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
| Security | Dependency audit reports 34 affected package entries, including two critical development-tool entries. | Updated compatible packages and removed unused Lovable instrumentation/typography. Runtime audit now reports zero; full audit retains seven build-chain entries below. |
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
- **Build dependencies:** full npm audit retains five high entries through
  Tailwind 3's `braces` chain and two moderate entries through its parser chain.
  The [braces advisory has no patch](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
  The [parser's upstream advisory](https://github.com/postcss/postcss-selector-parser/security/advisories/GHSA-rj75-hqrm-r3gf)
  lists installed 6.1.5 as patched, while npm's combined range still flags it.
  These process repository-controlled build patterns, not public form content.
  Do not run builds over untrusted source/patterns or use `npm audit fix --force`;
  a Tailwind 4 migration requires separate scope and visual verification.
- **Deployment evidence:** production bindings, permissions, secrets, billing,
  remote archive contents, deployed revision and deployed headers were not audited.
  No production data, mail, accounts or infrastructure were changed. The existing
  SPA `_redirects` rule is ignored by current Wrangler as redundant/looping; local
  Pages automatic SPA fallback still served `/congres` and `/admin/login` correctly.

### Verification and next step

305 tests passed in 20 files, including 122 new regression/contract assertions.
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

Next bounded step: review and release these local changes through the existing
Cloudflare process when authorized, then verify the deployed revision, headers,
admin file replacement/deletion and preview/production separation. Storage changes
remain out of scope. The HEIC decoder spike remains a separate unimplemented plan
in [the task list](project-notes/TODO.md). See [maintenance guidance](user_guides/MAINTENANCE.md)
for the administrator's operational instructions.
