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

### 1.1 `index.html` Fixes
- [ ] Change `lang="en"` to `lang="fr"`
- [ ] Move `spaf-rollup.jpg` to `public/`
- [ ] Fix `og:image` to `/spaf-rollup.jpg`

### 1.2 New Concours Page
- [ ] Create `src/pages/Concours.tsx`
- [ ] Add sections: Palmarès Poétique, Palmarès Artistique
- [ ] Add download buttons (disabled "Bientôt disponible" state)
- [ ] Add `/concours` route in `src/App.tsx`

### 1.3 Congres Page Rework
- [ ] Remove all palmarès content
- [ ] Move "Prochain événement" card to top of page
- [ ] Add registration download button in event card
- [ ] Design photo gallery UI (year selector 2010-2026, grid, lightbox)
- [ ] Add placeholder state for photos ("Photos à venir")

### 1.4 Index Page Updates
- [ ] Add "Documents à télécharger" section below activity cards
- [ ] Replace fake toast with `mailto:plecordier@free.fr` link
- [ ] Change Concours card from download button to navigation link
- [ ] Remove phone number code
- [ ] Remove hardcoded visitor counter

### 1.5 Revue Page Fixes
- [ ] Fix issue number to 264 consistently
- [ ] Fix typos: BZNOIT→BENOIT, A1MADE→AMADE, Tistan→Tristan, FOMBEUR→FOMBEURE, FERDINAN→FERDINAND
- [ ] Wire "Télécharger l'extrait" button to document config
- [ ] Add missing `€` on price line

### 1.6 Delegations Page Fixes
- [ ] Remove Pierre Rousseau Occitanie entry
- [ ] Keep only Richard Maggiore for Occitanie (fix "Occitane" spelling)
- [ ] Remove shuffled email data
- [ ] Remove unused `Phone`/`Mail` imports

### 1.7 Historique Page Fix
- [ ] Remove duplicate paragraph about 2014 transition

### 1.8 Footer Rework
- [ ] Restructure layout (3 sections: À propos, Contact, Siège social)
- [ ] Make À propos and Contact prominent
- [ ] Make Siège social subdued (smaller/lighter text)
- [ ] Add `mailto:` link for president's email
- [ ] Add "Formulaire de confidentialité" download link
- [ ] Remove unused `Phone` import

### 1.9 SPA Routing
- [ ] Create `public/_redirects` with `/* /index.html 200`

### 1.10 Validation Infrastructure
- [ ] Install Vitest + React Testing Library
- [ ] Configure Vitest in `vite.config.ts`
- [ ] Add `test` and `test:run` scripts to `package.json`
- [ ] Add `typecheck` script to `package.json`
- [ ] Write smoke tests for each page (renders without crashing)
- [ ] Test document config paths are valid
- [ ] Test all routes in App.tsx render
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
