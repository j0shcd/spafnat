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
- [ ] Verify spafnat.com domain in Resend, switch from onboarding@resend.dev
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

## Phase 4: Polish (Deferrable)

- [ ] Add JSON-LD structured data
- [ ] Create `sitemap.xml`
- [ ] Add proper cache headers
- [ ] Set up Cloudflare Web Analytics
- [ ] Accessibility audit (headings, contrast, keyboard nav)
- [ ] Expand concours section with per-region downloads

## Validation Checklist (Before Each Deployment)

- [x] `npm run preflight` — All Cloudflare compatibility checks pass ✅
- [x] `npm run typecheck` — no TS errors ✅
- [x] `npm run lint` — 0 errors, 8 warnings (fast refresh in shadcn components) ✅
- [x] `npm run test:run` — all 120 tests pass ✅
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
  - Edit `functions/api/contact.ts`
  - Change allowlist from `['*.pages.dev', 'localhost']` to `['spafnat.com']`
  - Commit and push to trigger new deployment

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
