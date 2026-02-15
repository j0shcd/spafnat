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
- [x] Fallback to 179175 if KV key missing (no manual seeding needed)

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
- [x] Create comprehensive security test suite (30+ tests)
- [x] Add specific error messages from backend validation
- [x] Add character limits to form placeholders
- [x] Document honeypot testing procedures
- [x] Create TESTING.md guide
- [x] All 63 tests passing (security + smoke tests)

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

## Phase 3: Admin Panel + Photo Gallery Backend (~5-8 days)

- [ ] Create Cloudflare R2 bucket `spaf-media`
- [ ] Create `functions/api/auth/login.ts` (JWT, bcrypt, rate limit)
- [ ] Create `functions/api/auth/middleware.ts` (JWT validation)
- [ ] Create `functions/api/admin/upload.ts` (multipart, validation, R2)
- [ ] Create `functions/api/admin/files.ts` (list by category)
- [ ] Create `functions/api/admin/delete.ts` (remove from R2)
- [ ] Create `functions/api/media/[...path].ts` (public serving with cache)
- [ ] Build admin UI at `/admin` (login, file browser, upload, delete)
- [ ] Connect Congres gallery to R2
- [ ] Update document config to check R2 first, local fallback
- [ ] Write French guide for president (1-page printed)

## Phase 4: Polish (Deferrable)

- [ ] Add JSON-LD structured data
- [ ] Create `sitemap.xml`
- [ ] Add proper cache headers
- [ ] Set up Cloudflare Web Analytics
- [ ] Accessibility audit (headings, contrast, keyboard nav)
- [ ] Expand concours section with per-region downloads

## Validation Checklist (Before Each Deployment)

- [x] `npm run typecheck` — no TS errors ✅
- [x] `npm run lint` — 0 errors, 7 warnings (fast refresh in shadcn components) ✅
- [x] `npm run test:run` — all 63 tests pass (28 smoke tests + 35 security tests) ✅
- [x] `npm run build` — builds successfully ✅
- [ ] Manual review: open each page, check content, click all buttons/links
- [ ] For Cloudflare features: test with `npx wrangler pages dev dist`

## Production Deployment Checklist

### Step 1: Cloudflare Dashboard Setup (One-Time)
- [ ] **Create KV Namespace**:
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
  - [ ] Counter appears on homepage (not "0", starts at ~179,175)
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
