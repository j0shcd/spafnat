# SPAF Website — Task List

**NOTE**: Taking a gradual approach - keeping Phase 2+ features (counter, contact form) as placeholders even though they're not fully functional yet. Always ask before modifying components.

## Phase 0: Project Setup ✅

- [x] Update CLAUDE.md with architectural decisions
- [x] Create project-notes/ directory structure
- [x] Document initial planning session

## Phase 1: Content Fixes + New Pages ✅

### 1.0 Centralized Document Config ✅
- [x] Create `src/config/documents.ts`
- [x] Define all document types (bulletin, palmarès, revue, etc.)
- [x] Move `bulletin_adhesion_2026.pdf` from `src/assets/` to `public/documents/`
- [x] Add "Nos documents" standalone section to Index page
- [x] Upload and configure Appel à poètes PDF
- [x] Upload and configure Haïku de Nadine Najman PDF

### 1.0.1 Centralized Contact Config ✅
- [x] Create `src/config/contact.ts` with CONTACT_EMAIL constant
- [x] Update Index.tsx to use CONTACT_EMAIL
- [x] Update Delegations.tsx to use CONTACT_EMAIL
- [x] Update Footer.tsx to use CONTACT_EMAIL

### 1.1 `index.html` Fixes ✅
- [x] Change `lang="en"` to `lang="fr"`
- [x] Move `spaf-rollup.jpg` to `public/`
- [x] Fix `og:image` to `/spaf-rollup.jpg`
- [x] Remove lovable.dev placeholder URLs from Twitter meta tags

### 1.2 New Concours Page ✅
- [x] Create `src/pages/Concours.tsx`
- [x] Add sections: Palmarès Poétique, Palmarès Artistique
- [x] Add download buttons (disabled "Bientôt disponible" state)
- [x] Add `/concours` route in `src/App.tsx`

### 1.3 Congres Page Rework ✅
- [x] Remove all palmarès content
- [x] Move "Prochain événement" card to top of page
- [x] Add registration download button in event card
- [x] Design photo gallery UI (year selector 2010-2026, grid, lightbox)
- [x] Add placeholder state for photos ("Photos à venir")

### 1.4 Index Page Updates ✅
- [x] Add "Documents à télécharger" section below activity cards
- [x] Change Concours card from download button to navigation link
- [x] Remove phone number code
- [x] Remove hardcoded visitor counter (replaced with live API counter in Phase 2)
- [x] Replace fake toast with working contact form (implemented in Phase 2)

### 1.5 Revue Page Fixes ✅
- [x] Fix issue number to 264 consistently
- [x] Fix typos: BZNOIT→BENOIT, A1MADE→AMADE, Tistan→Tristan, FOMBEUR→FOMBEURE, FERDINAN→FERDINAND
- [x] Wire "Télécharger l'extrait" button to document config
- [x] Add missing `€` on price line

### 1.6 Delegations Page Fixes ✅
- [x] Remove Pierre Rousseau Occitanie entry
- [x] Keep only Richard Maggiore for Occitanie (fix "Occitane" spelling)
- [x] Remove shuffled email data
- [x] Remove unused `Phone`/`Mail` imports
- [x] Fix "Devenir délégué·e" button styling (outline variant with proper text colors)

### 1.7 Historique Page Fix ✅
- [x] Remove duplicate paragraph about 2014 transition

### 1.8 Footer Rework ✅
- [x] Restructure layout (2 sections: Siège social, À propos)
- [x] Make À propos prominent
- [x] Add `mailto:` link for president's email
- [x] Add "Formulaire de confidentialité" download link
- [x] Remove unused `Phone` import

### 1.9 SPA Routing ✅
- [x] Create `public/_redirects` with `/* /index.html 200`

### 1.10 Validation Infrastructure & Cleanup ✅
- [x] Install Vitest + React Testing Library
- [x] Configure Vitest in `vite.config.ts`
- [x] Add `test` and `test:run` scripts to `package.json`
- [x] Add `typecheck` script to `package.json`
- [x] Write smoke tests for each page (renders without crashing)
- [x] Fix ESLint errors in shadcn components (empty interfaces, require() imports)
- [x] Fix pre-existing test failures:
  - [x] Separated routes into AppRoutes.tsx to fix Router nesting
  - [x] Fixed multiple element matches (use getAllByText instead of getByText)
  - [x] Fixed NotFound test to expect "Site en construction" instead of "404"
  - [x] Fixed Index page test to look for "Nos documents" instead of "Documents à télécharger"
- [x] All 28 tests passing (3 test files, 0 failures)

## Phase 2: Contact Form Backend + Live Counter + Security Headers ✅

### 2.0 Dev Tooling & Security Headers ✅
- [x] Install `wrangler` + `@cloudflare/workers-types` as devDeps
- [x] Create `wrangler.toml` (gitignored, no secrets — local dev uses `--kv` flag)
- [x] Create `functions/env.d.ts` (shared Env type) + `functions/tsconfig.json`
- [x] Add `.wrangler/` and `wrangler.toml` to `.gitignore`
- [x] Create `public/_headers` — non-CSP security headers only (CSP deferred, see TODOs)

### 2.1 Visitor Counter Backend ✅
- [x] Create `functions/api/visit.ts` — GET (read count) + POST (deduplicate & increment)
- [x] IP fallback chain: CF-Connecting-IP → x-forwarded-for → "localhost"
- [x] SHA-256 hash IP+date for privacy, 24h TTL dedup keys in KV
- [x] Fallback to 184161 if KV key missing (no manual seeding needed)

### 2.2 Live Visitor Counter Frontend ✅
- [x] Replace hardcoded "179'175" in Index.tsx with live count from API
- [x] Hide counter card entirely on API failure (never show 0)

### 2.3 Contact Form Backend ✅
- [x] Create `functions/api/contact.ts` — validation, honeypot, rate limiting, Resend email
- [x] Origin check: allow missing, *.pages.dev, localhost (tighten later — see TODOs)
- [x] Rate limit: 1 submission per IP per 5 min (KV with 300s TTL)
- [x] Email via Resend API (onboarding@resend.dev for testing, noreply@spafnat.com after domain verification)
- [x] reply_to set to sender's email so president can reply directly

### 2.4 Contact Form Frontend ✅
- [x] Convert uncontrolled form to controlled state
- [x] Add hidden honeypot field
- [x] POST JSON to /api/contact, show success/error toasts
- [x] Disable button + "Envoi en cours..." during submission

### 2.5 Security Testing & Documentation ✅
- [x] Create comprehensive security test suite
- [x] Add specific error messages from backend validation
- [x] Add character limits to form placeholders
- [x] Document honeypot testing procedures
- [x] Create TESTING.md guide
- [x] All 52 tests passing (28 smoke + 24 security unit tests)

### Phase 2 TODOs (post-implementation, pre-production)
- [ ] Add CSP to `public/_headers` once third-party needs are known
- [ ] Tighten Origin allowlist to spafnat.com only once custom domain is active
- [x] Verify spafnat.com domain in Resend, switch from onboarding@resend.dev
- [ ] Switch CONTACT_RECIPIENT env var to plecordier@free.fr

### Phase 2 Decisions Log
- **Email service**: Resend (free tier 100/day, simple fetch API, no deps)
- **Storage**: Single KV namespace `SPAF_KV` with key prefixes (rate:, counter:)
- **Counter accuracy**: KV (eventual consistency) — rare double-counts acceptable for low-traffic site. Durable Objects rejected (extra complexity, separate Worker class needed).
- **CSP**: Deferred — non-CSP headers ship now, CSP added once in prod and third-party needs clear
- **wrangler.toml**: Gitignored (contains environment-specific config)

## Phase 3: Admin Panel + File Management ✅ (Completed 2026-02-16)

**Status**: Phase 3a Complete ✅ (2026-02-15). Phase 3b Complete ✅ (2026-02-16). Phase 3c Complete ✅ (2026-02-16).

**Scope**: Enable non-technical president (~70 years old) to manage PDFs and congress photos independently via simple admin panel. Uses Cloudflare R2 for file storage, JWT auth for single admin, and elderly-user-friendly UI.

**Broken into 3 sub-phases**: 3a (auth + backend APIs) ✅, 3b (admin UI) ✅, 3c (gallery + document integration) ✅

**Total time**: 2 days (2026-02-15 to 2026-02-16)

### Pre-Phase 3 Cleanup ✅
- [x] Delete `src/tests/security.test.ts` (28 failing integration tests, superseded by `tests/security/`)
- [x] Create `.dev.vars.example` template with Phase 2 + Phase 3 env vars
- [x] Extract shared helpers: Create `functions/lib/helpers.ts` with `getClientIP`, `isValidOrigin`, `escapeHtml`, `jsonResponse`
- [x] Refactor `functions/api/contact.ts` and `functions/api/visit.ts` to use shared helpers
- [x] **Commit**: `chore: pre-phase3 cleanup - extract shared helpers and remove obsolete tests`

### Phase 3a: Auth + Backend APIs ✅ (Completed 2026-02-15)

**Dependencies**:
- [x] Install `jose` (JWT for edge runtimes)
- [x] Install `tsx` (TypeScript script runner for password hash generation)
- [x] **Note**: Used PBKDF2 (native Web Crypto API) instead of bcryptjs — no external dependency, OWASP 2023 compliant

**Backend files**:
- [x] Modify `functions/env.d.ts` — Add `JWT_SECRET`, `ADMIN_PASSWORD_HASH`, `SPAF_MEDIA: R2Bucket`
- [x] Create `functions/lib/password.ts` — PBKDF2 password hashing (600k iterations)
- [x] Create `functions/lib/file-validation.ts` — MIME type + magic bytes validation (PDF, JPEG, PNG, WebP)
- [x] Create `functions/api/auth/login.ts` — JWT login with PBKDF2, rate limiting (5 attempts/15min)
- [x] Create `functions/api/auth/logout.ts` — Revoke session from KV
- [x] Create `functions/api/auth/verify.ts` — Token validation endpoint
- [x] Create `functions/api/admin/_middleware.ts` — JWT validation middleware for all `/api/admin/*` routes
- [x] Create `functions/api/admin/upload.ts` — Multipart upload, 5MB max, MIME+magic bytes validation, R2 put
- [x] Create `functions/api/admin/files.ts` — List R2 files (`?type=documents` or `?type=photos&year=2024`)
- [x] Create `functions/api/admin/delete-document.ts` — Delete document from R2
- [x] Create `functions/api/admin/delete-photo.ts` — Delete photo from R2
- [x] Create `functions/api/media/[[path]].ts` — Public file serving, cache headers, path traversal protection
- [x] Create `functions/api/gallery.ts` — Public endpoint to list congress photos (no auth)
- [x] Update `public/_headers` — Add CSP header
- [x] Update `wrangler.toml` — Add R2 bucket binding

**Scripts**:
- [x] Create `scripts/generate-password-hash.ts` — Standalone script for generating ADMIN_PASSWORD_HASH

**Tests**:
- [x] Create `src/tests/auth.test.ts` — PBKDF2 hashing, login rate limiting, JWT sessions (9 tests)
- [x] Create `src/tests/upload.test.ts` — File validation, MIME, magic bytes, sanitization (28 tests)
- [x] Create `src/tests/media.test.ts` — Path traversal, cache headers, content-type (14 tests)

**Verification**:
- [x] `npm run typecheck && npm run lint && npm run test:run && npm run build` all pass clean (103 tests)
- [x] Manual test with `npx wrangler pages dev dist --kv SPAF_KV --r2 SPAF_MEDIA` — server starts successfully ✅

**Commits**:
- [x] `feat: implement Phase 3a - auth and file management backend APIs` (20 files, +1354 LOC)
- [x] `fix: move password hash script to avoid Workers runtime error with process` (separated script from runtime code)

**Session Notes**: `project-notes/sessions/2026-02-15-phase3a-implementation.md`

### Phase 3b: Admin UI ✅ (Completed 2026-02-16)

**Frontend files**:
- [x] Create `src/contexts/AuthContext.tsx` — Auth state management (token, login, logout, isAuthenticated)
- [x] Create `src/lib/admin-api.ts` — Authenticated fetch wrapper, auto-logout on 401
- [x] Create `src/hooks/useDocumentUrl.ts` — Document URL resolution (R2 first, local fallback) — created but not yet integrated (Phase 3c)
- [x] Create `src/components/admin/RequireAuth.tsx` — Route guard (redirects to login if not authenticated)
- [x] Create `src/components/admin/AdminLayout.tsx` — Sidebar navigation, top bar, "Retour au site" button
- [x] Create `src/pages/admin/AdminLogin.tsx` — Password-only login form
- [x] Create `src/pages/admin/AdminDashboard.tsx` — Simplified to redirect to /admin/documents
- [x] Create `src/pages/admin/AdminDocuments.tsx` — 8 document slots, upload/replace/delete, status badges, original filename display
- [x] Create `src/pages/admin/AdminPhotos.tsx` — Year selector (2010-2026), photo grid, multi-file upload, batch delete with confirmation
- [x] Modify `src/App.tsx` — Add `/admin/*` routes outside Layout wrapper (use AdminLayout instead)

**Tests**:
- [x] Create `src/test/admin.test.tsx` — Smoke tests (login renders, dashboard redirects, documents/photos pages render)

**UX checklist** (elderly user):
- [x] Large fonts (16px+ body, 18px+ labels)
- [x] High contrast (SPAF brown on cream)
- [x] Big touch targets (44px+ buttons)
- [x] Clear French labels (no jargon)
- [x] Confirmation dialogs before delete (single + batch)
- [x] Green/red badges for document status
- [x] Toast messages for success/error
- [x] Upload progress indicators (multi-file)

**Bug Fixes (2026-02-16)**:
- [x] Fixed API endpoint path mismatches (/api/auth/ vs /api/admin/)
- [x] Fixed field name mismatches (upload/delete APIs)
- [x] Fixed data structure unwrapping (files/photos arrays)
- [x] Improved error messages for non-technical user
- [x] Fixed R2 binding validation and debug logging
- [x] Fixed document key handling (filename vs camelCase)
- [x] Fixed delete endpoint .pdf duplication

**Polish (2026-02-16 PM)**:
- [x] Removed year assumptions from document config (bulletin_adhesion_2026.pdf → bulletin_adhesion.pdf, extrait_revue_264.pdf → extrait_revue.pdf)
- [x] Added original filename display (R2 head() calls for customMetadata)
- [x] Fixed logout behavior ("Retour au site" now logs out and navigates to public homepage)
- [x] Extended photo gallery years to 2010-2026 (was 2020-2026)
- [x] Localhost rate limit bypass for login (dev convenience)
- [x] Dashboard simplified to redirect to documents

**Verification**:
- [x] `npm run typecheck && npm run lint && npm run test:run && npm run build` all pass clean ✅
- [x] Manual test: Navigate to `/admin`, login, upload document, upload photos, delete file, logout ✅
- [x] Tested in production preview deployment ✅

**Commits**:
- [x] `fix: skip login rate limiting for localhost development`
- [x] `refactor: simplify admin dashboard to redirect to documents`
- [x] `fix: remove year assumptions from document config`
- [x] `fix: display original filename in admin document cards`
- [x] `fix: logout and navigate to main site from admin panel`
- [x] `fix: extend photo gallery years back to 2010`

### Phase 3c: Gallery + Document Integration ✅ (Completed 2026-02-16)

**Files created**:
- [x] Create `functions/api/gallery/years.ts` — Returns list of years with congress photos (used for year selector)

**Files modified**:
- [x] ~~Modify `src/config/documents.ts`~~ — Not needed (hook extracts filename from existing `path` field)
- [x] Modify `src/pages/Congres.tsx` — Fetch photos from `/api/gallery?year=`, display from `/api/media/`, integrate `useDocumentUrl` for inscription button
- [x] Modify `src/pages/Index.tsx` — Use R2-aware document URLs for 3 documents (bulletinAdhesion, appelPoetes, haikuNadineNajman)
- [x] Modify `src/pages/Concours.tsx` — Use R2-aware document URLs for 2 documents (palmaresPoetique, palmaresArtistique)
- [x] Modify `src/pages/Revue.tsx` — Use R2-aware document URL for extraitRevue
- [x] Modify `src/components/Footer.tsx` — Use R2-aware document URL for formulaireConfidentialite

**Tests**:
- [x] Create `src/tests/gallery.test.tsx` — Gallery fetches from API, shows loading state, handles empty state, renders photo grid (4 tests)
- [x] Verify existing page tests still pass with R2 document URL changes (120 tests passing)

**Bug Fixes & Polish (2026-02-16 Evening)**:
- [x] Fixed document availability checking — buttons now correctly reflect R2 state
  - [x] Added `onRequestHead` handler to media endpoint (was only GET, HEAD failed)
  - [x] Changed Footer.tsx to use `useDocumentUrl` hook instead of hardcoded `available` field
  - [x] Added cache-busting to HEAD requests (`?_=${Date.now()}` + `cache: 'no-store'`)
  - [x] Added window focus listener to re-check availability after navigating back from admin
- [x] Fixed photo gallery dialog layout shifts
  - [x] Set fixed 70vh height container for images
  - [x] Added min-width to navigation buttons for stable positioning
- [x] Removed trophy/award icons from Concours page (cleaner design)
- [x] Changed Concours download buttons to primary red brand color
- [x] Updated test expectations for new section titles ("Grands Prix de Poésie" / "Grands Prix Artistiques")

**Documentation**:
- [ ] Write French user guide (1-page PDF) — Login, upload/delete files, troubleshooting (Phase 4)

**Verification**:
- [x] `npm run preflight` — All Cloudflare compatibility checks passed ✅
- [x] `npm run typecheck` — No type errors ✅
- [x] `npm run lint` — 0 errors, 8 warnings (fast refresh in shadcn components) ✅
- [x] `npm run test:run` — All 120 tests passing ✅
- [x] `npm run build` — Production build successful ✅
- [x] Manual: Congres page shows photos from R2 for years with photos ✅
- [x] Manual: Congres page shows "Photos a venir" for years without photos ✅
- [x] Manual: Document downloads work from R2, buttons grey out when deleted ✅
- [x] Manual: No regressions in existing pages (visitor counter, contact form) ✅

**Commits**:
- [x] `fix: Phase 3c complete - document availability, photo gallery polish, and cache fixes`

### Phase 3 Cloudflare Dashboard Setup ✅

- [x] **Create R2 buckets**: `spaf-media` (production) and `spaf-media-preview` (preview)
- [x] **Add env vars** (Settings > Environment variables):
  - `JWT_SECRET` — Generated with `openssl rand -base64 32` ✅
  - `ADMIN_PASSWORD_HASH` — Generated with `npx tsx scripts/generate-password-hash.ts` ✅
- [x] **Add R2 bindings** (Settings > Functions > R2 bucket bindings):
  - Production: Variable name `SPAF_MEDIA` → R2 bucket `spaf-media` ✅
  - Preview: Variable name `SPAF_MEDIA` → R2 bucket `spaf-media-preview` ✅
- [x] **Add KV binding**: `SPAF_KV` namespace configured for both Production and Preview ✅

### Phase 3 Key Decisions

- **Auth**: JWT with jose (edge-native), PBKDF2 for password hashing (100k iterations), 24h token expiration, KV session storage for revocation
- **R2 structure**: `documents/{filename}` (year-agnostic) and `congres/{year}/{filename}` (organized by year)
- **R2 metadata**: Upload stores `originalFilename` in customMetadata (requires `head()` to fetch, not available in `list()`)
- **File limits**: 5 MB max upload size (within Workers free tier)
- **Thumbnails**: No — serve original photos only (president uploads reasonably-sized images)
- **Admin password**: Stored as PBKDF2 hash in `ADMIN_PASSWORD_HASH` env var (rotated manually in Dashboard)
- **Public vs protected**: Media endpoint public (read-only, no directory listing), admin endpoints protected (JWT required)
- **Elderly UX**: Large fonts, simplified dashboard (redirect to documents), confirmation dialogs, green/red status badges, original filename display
- **Photo years**: 2010-currentYear (auto-expands each January), Phase 4 enhancement for manual year creation
- **Year-agnostic design**: Document config uses generic filenames (no hardcoded years/issue numbers) for rotating documents
- **Logout flexibility**: AuthContext logout() accepts optional redirectTo parameter for flexible navigation

## Phase 4: Concours Collections, Revue Rework, Delegations Content ✅ (Completed 2026-02-17)

**Status**: Complete except Admin Tutorial (deferred to Phase 5)

**Scope**: Enable dynamic concours document management (variable-length collections), add PDF cover rendering to Revue page, and add missing Delegations content.

**Total time**: 1 day (2026-02-17)

### Phase 4a: Concours Backend ✅
**Files created**:
- [x] Create `src/config/concours.ts` — Category types, ConcoursItem interface, helper functions (deriveTitleFromFilename, getConcoursKVKey, getConcoursR2Prefix)
- [x] Create `functions/api/concours.ts` — Public GET endpoint (`?category=all` or specific category)
- [x] Create `functions/api/admin/concours/upload.ts` — Multipart upload to R2, append to KV array, auto-title derivation, filename collision handling
- [x] Create `functions/api/admin/concours/delete.ts` — Delete from R2 + remove from KV array
- [x] Create `functions/api/admin/concours/reorder.ts` — Swap items up/down in KV array

**Files modified**:
- [x] Modify `src/lib/admin-api.ts` — Add `apiListConcours`, `apiUploadConcours`, `apiDeleteConcours`, `apiReorderConcours`

**Data structure**:
- KV key: `concours:{category}` → JSON array of `{ r2Key, title, originalFilename, uploadedAt, size }`
- R2 key: `concours/{category}/{sanitized-filename}`
- Array order = display order (KV is source of truth)

**Verification**:
- [x] `npm run typecheck && npm run lint && npm run test:run && npm run build` all pass clean ✅
- [x] Manual test: `npx wrangler pages dev dist --kv SPAF_KV --r2 SPAF_MEDIA`, then `curl /api/concours?category=all` ✅

**Commits**:
- [x] `feat: add concours collection backend (KV + R2 endpoints)`

### Phase 4b: Concours Admin UI ✅
**Files created**:
- [x] Create `src/pages/admin/AdminConcours.tsx` — 3-tab interface (Règlements, Palmarès Poétique, Palmarès Artistique)
  - Upload PDF button (top of each tab)
  - Ordered list with View/Up/Down/Delete buttons
  - Duplicate file detection with user-friendly toast
  - Large touch targets (44px+), French labels, AlertDialog confirmation

**Files modified**:
- [x] Modify `src/AppRoutes.tsx` — Add AdminConcours route under admin layout
- [x] Modify `src/components/admin/AdminLayout.tsx` — Add "Concours" to sidebar with Award icon

**UX features**:
- [x] Duplicate detection: blocks uploads with same filename (case-insensitive), shows toast with actionable message
- [x] Up/down arrows disabled at boundaries (not drag-drop for elderly user)
- [x] File size display + original filename display
- [x] Toast feedback for all operations (upload/delete/reorder)

**Verification**:
- [x] Manual test: Login to `/admin/concours`, upload/delete/reorder PDFs across all 3 tabs ✅

**Commits**:
- [x] `feat: add admin concours management page`

### Phase 4c: Concours Public UI ✅
**Files created**:
- [x] Create `src/hooks/useConcours.ts` — Fetch hook with window focus re-fetching

**Files modified**:
- [x] Rewrite `src/pages/Concours.tsx` — Dynamic display from `/api/concours?category=all`
  - Règlements: all visible (active competitions)
  - Palmarès Poétique/Artistique: latest prominent + collapsible "Palmarès précédents"
  - All palmares buttons use primary red color (bg-primary hover:bg-primary/90)
  - Empty state: "Bientôt disponible"
- [x] Modify `src/config/documents.ts` — Remove palmaresPoetique and palmaresArtistique (migrated to dynamic system)

**Tests**:
- [x] Modify `src/test/pages.test.tsx` — Add fetch mock for concours API (beforeEach/afterEach), change Concours test to async
- [x] Modify `src/test/routing.test.tsx` — Add fetch mock, change Concours test to async
- [x] Modify `src/test/documents.test.ts` — Update expected document count to 6 (was 8)
- [x] Modify `src/test/admin.test.tsx` — Update expected upload button count to 6 (was 8)

**Verification**:
- [x] Manual test: Visit `/concours`, verify documents display with download links, test collapsible sections ✅

**Commits**:
- [x] `feat: rework public Concours page for dynamic collections`

### Phase 4d: Revue Rework ✅
**Dependencies**:
- [x] Install `pdfjs-dist` (~300KB)

**Files created**:
- [x] Create `src/components/PdfCover.tsx` — Renders PDF first page to canvas using pdfjs-dist
  - Worker source configured via `import.meta.url`
  - Gradient fallback while loading or on error

**Files modified**:
- [x] Modify `functions/api/media/[[path]].ts` — Add `X-Original-Filename` header from R2 customMetadata, add to `Access-Control-Expose-Headers`
- [x] Modify `src/hooks/useDocumentUrl.ts` — Return `originalFilename` from HEAD response header
- [x] Modify `src/pages/Revue.tsx` — Replace gradient with `<PdfCover>`, dynamic title from originalFilename, add "Notre Histoire" section
- [x] Modify `vite.config.ts` — Add `pdfjs-dist` to `optimizeDeps.include`

**Tests**:
- [x] Modify `src/test/setup.ts` — Mock pdfjs-dist to prevent test loading failures
- [x] Fix Revue tests for dynamic content (multiple "Notre Revue" texts, dynamic title)

**Verification**:
- [x] Manual test: Upload PDF as extrait_revue via admin, visit `/revue`, verify cover renders and title updates ✅

**Commits**:
- [x] `feat: add PDF cover rendering and dynamic Revue title`

### Phase 4e: Delegations Content ✅
**Files modified**:
- [x] Modify `src/pages/Delegations.tsx` — Add 2 info cards:
  - Payment instructions: "Le montant de l'abonnement et celui de la cotisation sont à verser au délégué par chèque libellé à son nom."
  - Treasurer contact: "Délégations sans responsables : Envoyez directement à la trésorière votre cotisation — Mme LECORDIER Flore, 11 rue Juliette Récamier, 69130 ÉCULLY"

**Verification**:
- [x] Manual test: Visit `/delegations`, verify new cards display correctly ✅

**Commits**:
- [x] `content: add delegation payment info and treasurer contact`

### Phase 4f: Admin Tutorial ⏸️ DEFERRED
- [ ] Create `src/pages/admin/AdminTutorial.tsx` — Static JSX page with sections: Connexion, Gestion documents/concours/photos, Résolution problèmes
- [ ] Add route and sidebar link
- **Note**: Deferred to Phase 5 per user request

### Phase 4 Final Polish ✅
**Improvements**:
- [x] Add duplicate file detection in AdminConcours (case-insensitive filename check, user-friendly toast)
- [x] Change palmares button colors to primary red (all palmares buttons, not just latest)
- [x] Add "Notre Histoire" section to Revue page (historical text about magazine founding in 1958)

**Tests**:
- [x] Create `src/test/concours.test.ts` — Test config helpers (deriveTitleFromFilename, getConcoursKVKey, getConcoursR2Prefix) — 9 tests
- [x] All 140 tests passing (includes Phase 4 regressions + post-Phase 4 media/cache fixes)

**Verification**:
- [x] `npm run preflight` — All Cloudflare compatibility checks passed ✅
- [x] `npm run typecheck` — No type errors ✅
- [x] `npm run lint` — 0 errors ✅
- [x] `npm run test:run` — All 140 tests passing ✅
- [x] `npm run build` — Production build successful ✅

**Commits**:
- [x] `test: add concours configuration tests`
- [x] `feat: add duplicate file detection, palmares colors, and Revue history`

### Phase 4 Key Decisions
- **KV for collections**: Chosen over fixed documents.ts entries — enables variable-length lists
- **Client-side PDF rendering**: pdfjs-dist chosen over server-side (no Workers image processing, avoids R2 thumbnails)
- **Bundle size tradeoff**: ~300KB for pdfjs-dist acceptable for feature value
- **Duplicate detection**: Client-side check before upload (not error-level, actionable guidance)
- **Up/down reordering**: Arrows instead of drag-drop (easier for elderly user)
- **Category=all endpoint**: Single request fetches all categories (reduces latency)
- **useConcours window focus**: Auto re-fetch after admin changes (real-time updates)

### Phase 4g: Post-Phase 4 Media Consistency + Filename Encoding Fix ✅ (2026-02-17)

**Issue reported**:
- [x] Replacing `extrait_revue.pdf` could show stale preview and stale downloaded file until multiple refreshes/navigation events
- [x] `originalFilename` metadata with accents displayed as mojibake (`appel aÌ poeÌtes`)
- [x] Repeated `HEAD /api/media/documents/formulaire_confidentialite.pdf 404` log entries caused concern

**Root causes**:
- [x] `GET /api/media/*` used long-lived cache (`public, max-age=86400`) even for mutable document PDF keys
- [x] Replaced files kept the same R2 key, so stale responses could persist in browser/CDN cache
- [x] Raw UTF-8 metadata in `X-Original-Filename` header is not reliably decoded by all clients

**Fix implemented**:
- [x] Add `X-Original-Filename-Encoded` (URL-encoded UTF-8) and `X-Uploaded-At` headers in media endpoint
- [x] Parse/decode encoded filename in `useDocumentUrl`
- [x] Build versioned URLs (`?v=<uploadedAt>`) for document links so replacements bust cache immediately
- [x] Disable long-lived cache for mutable PDFs under `documents/` and `concours/`; keep image caching for congress photos
- [x] Confirm `HEAD ... formulaire_confidentialite.pdf 404` is expected availability probing from footer hook when file is missing

**Files updated**:
- [x] `functions/api/media/[[path]].ts`
- [x] `src/hooks/useDocumentUrl.ts`
- [x] `src/tests/admin-endpoints.test.ts`
- [x] `src/tests/media.test.ts`
- [x] `src/tests/useDocumentUrl.test.ts` (new)

**Verification**:
- [x] `npm run typecheck` ✅
- [x] `npm run test:run` ✅ (13 files / 140 tests)
- [x] `npm run build` ✅

**Session Note**:
- [x] `project-notes/sessions/2026-02-17-media-cache-and-filename-fix.md`

## Phase 5: Polish & Production Readiness (Deferrable)

- [ ] Add JSON-LD structured data
- [ ] Create `sitemap.xml`
- [ ] Add proper cache headers (beyond Phase 2 security headers)
- [ ] Set up Cloudflare Web Analytics
- [ ] Accessibility audit (headings, contrast, keyboard nav)
- [ ] Admin tutorial page (deferred from Phase 4f)

## Validation Checklist (Before Each Deployment)

- [x] `npm run preflight` — All Cloudflare compatibility checks pass ✅
- [x] `npm run typecheck` — no TS errors ✅
- [x] `npm run lint` — 0 errors, 8 warnings (fast refresh in shadcn components) ✅
- [x] `npm run test:run` — all 140 tests pass ✅ (updated from 129 after media/cache + encoding regressions)
- [x] `npm run build` — builds successfully ✅
- [x] Manual review: open each page, check content, click all buttons/links ✅
- [x] For Cloudflare features: test with `npx wrangler pages dev dist --kv SPAF_KV --r2 SPAF_MEDIA` ✅

## Production Deployment Checklist

### Step 1: Cloudflare Dashboard Setup (One-Time)
- [x] **Create KV Namespace**:
  - Go to Workers & Pages > KV
  - Click "Create namespace"
  - Name: `SPAF_KV`
  - Note the namespace ID for reference

- [ ] **Bind KV to Pages Project**:
  - Go to Workers & Pages > [your project] > Settings > Functions > KV namespace bindings
  - Variable name: `SPAF_KV`
  - KV namespace: Select `SPAF_KV`
  - Click "Save"

- [ ] **Add Environment Variables**:
  - Go to Workers & Pages > [your project] > Settings > Environment variables
  - Add the following (Production environment):
    - `RESEND_API_KEY` = `re_...` (get from resend.com dashboard)
    - `CONTACT_RECIPIENT` = `jcohendumani7@gmail.com` (testing) or `plecordier@free.fr` (production)
  - Click "Save"

### Step 2: Test in Preview Deployment
- [ ] Push code to GitHub (triggers automatic preview deployment)
- [ ] Wait for deployment to complete
- [ ] Visit the preview URL (*.pages.dev)
- [ ] Test visitor counter:
  - [ ] Counter appears on homepage (not "0", starts at 184,161)
  - [ ] Refresh page — counter should NOT increment (24h deduplication)
  - [ ] Use different device/IP — counter SHOULD increment
- [ ] Test contact form:
  - [ ] Fill out form normally → should see success message
  - [ ] Check email inbox (CONTACT_RECIPIENT) → should receive email
  - [ ] Submit again immediately → should see rate limit error ("Trop de soumissions")
  - [ ] Wait 5 minutes, submit again → should succeed
- [ ] Test honeypot (DevTools console):
  - [ ] `document.querySelector('input[name="website"]').value = 'bot'`
  - [ ] Submit form → should show success but NOT send email
- [ ] Check all pages still work (navigation, downloads, etc.)

### Step 3: Custom Domain Setup (spafnat.com)
- [ ] **Add Custom Domain to Cloudflare Pages**:
  - Go to Workers & Pages > [your project] > Custom domains
  - Click "Set up a custom domain"
  - Enter: `spafnat.com`
  - Cloudflare will automatically configure DNS (if domain is on Cloudflare)
  - Wait for SSL certificate to provision (~5-10 minutes)

- [ ] **Verify Domain in Resend**:
  - Go to resend.com > Domains
  - Click "Add Domain"
  - Enter: `spafnat.com`
  - Add the provided DNS records to Cloudflare DNS:
    - TXT record for domain verification
    - TXT record for DKIM
    - MX record (if you want to receive email, optional)
  - Wait for verification (usually instant)
  - Status should show "Verified" ✅

- [ ] **Update Environment Variables for Production**:
  - Go to Workers & Pages > [your project] > Settings > Environment variables
  - Update `CONTACT_RECIPIENT` to `plecordier@free.fr`
  - Click "Save and deploy"

- [ ] **Update Contact Form Origin Validation**:
  - Use env var `ALLOWED_ORIGINS` in Cloudflare Dashboard
  - Set to production domains only: `https://spafnat.com,https://www.spafnat.com`
  - Keep `*.spafnat.pages.dev` only in preview/local environments

- [ ] **Switch Email Sender in Code**:
  - Edit `functions/api/contact.ts`
  - Change sender from `'onboarding@resend.dev'` to `'contact@spafnat.com'`
  - Commit and push to trigger new deployment

### Step 4: Final Production Tests
- [ ] Visit https://spafnat.com (custom domain)
- [ ] Test visitor counter (same tests as Step 2)
- [ ] Test contact form:
  - [ ] Submit form with your personal email
  - [ ] Check president's inbox (plecordier@free.fr) — should receive email
  - [ ] Email should show sender as `contact@spafnat.com`
  - [ ] Reply button should use submitter's email (reply-to)
- [ ] Test honeypot again
- [ ] Click through all pages, verify all links/downloads work
- [ ] Check mobile responsiveness (phone/tablet)
- [ ] Check in different browsers (Chrome, Firefox, Safari)

### Step 5: Monitor & Verify
- [ ] **Monitor Cloudflare Analytics**:
  - Go to Workers & Pages > [your project] > Analytics
  - Verify requests are coming in
  - Check for any errors in Function logs

- [ ] **Monitor Resend Dashboard**:
  - Go to resend.com > Logs
  - Verify emails are being delivered
  - Check delivery rate (should be 100% for verified domain)

- [ ] **Set Up Alerts** (optional but recommended):
  - Cloudflare: Set up email alerts for function errors
  - Resend: Set up alerts for bounced emails or delivery failures

### Step 6: Documentation for President
- [ ] Create simple 1-page guide in French explaining:
  - How to check if emails are coming in
  - Who to contact if emails stop working (you)
  - How to check visitor count
  - Phase 3 preview (admin panel for managing files)

### Rollback Plan (If Something Goes Wrong)
If the production deployment has issues:
1. Go to Workers & Pages > [your project] > Deployments
2. Find the previous working deployment
3. Click "..." menu > "Rollback to this deployment"
4. Investigate the issue in preview deployment before redeploying

### Notes
- Preview deployments (`*.pages.dev`) and production (`spafnat.com`) share the same KV namespace — counter will continue from same number
- Rate limiting is per-IP, not per-domain — testing in preview won't consume production rate limit quota
- First deployment may take 5-10 minutes for DNS propagation (custom domain)
- HTTPS is automatic via Cloudflare (free SSL certificate)
- Emails from `contact@spafnat.com` will have better deliverability than `onboarding@resend.dev`
