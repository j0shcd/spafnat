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

### 1.4 Index Page Updates
- [x] Add "Documents à télécharger" section below activity cards
- [x] Change Concours card from download button to navigation link
- [x] Remove phone number code
- [ ] Remove hardcoded visitor counter (deferred to Phase 2)
- [ ] Replace fake toast with `mailto:plecordier@free.fr` link (deferred to Phase 2)

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

### 1.10 Validation Infrastructure & Cleanup
- [x] Install Vitest + React Testing Library
- [x] Configure Vitest in `vite.config.ts`
- [x] Add `test` and `test:run` scripts to `package.json`
- [x] Add `typecheck` script to `package.json`
- [x] Write smoke tests for each page (renders without crashing)
- [x] Fix ESLint errors in shadcn components (empty interfaces, require() imports)
- [ ] Fix pre-existing test failures:
  - [ ] Multiple element matches (use getAllByText instead of getByText)
  - [ ] NotFound test expects "404" but page shows "Site en construction"
  - [ ] Routing tests have Router nesting errors (test setup issue)
- [ ] Verify full validation flow: `typecheck && lint && test:run && build`

## Phase 2: Contact Form Backend + Live Counter (Post-Launch)

- [ ] Create `functions/api/contact.ts` (validation, rate limit, email)
- [ ] Add honeypot + Origin header check
- [ ] Update Index.tsx form to POST to `/api/contact`
- [ ] Create `functions/api/visit.ts` (IP hashing, KV counter)
- [ ] Add visitor counter to Index page (with fallback on failure)
- [ ] Create `public/_headers` with security headers (CSP, etc.)

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

- [ ] `npm run typecheck` — no TS errors
- [ ] `npm run lint` — no lint errors
- [ ] `npm run test:run` — all tests pass
- [ ] `npm run build` — builds successfully
- [ ] Manual review: open each page, check content, click all buttons/links
- [ ] For Cloudflare features: test with `npx wrangler pages dev dist`
