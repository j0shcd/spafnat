# Session: 2026-02-14 — Initial Planning

## Context

SPAF website migration from spafnat.com (paid hosting) to Cloudflare Pages (free). Site partially built with Lovable, needs content fixes, new pages, and admin panel for the non-technical president (~70 years old).

## Key Decisions

### Hosting Strategy
- **Platform**: Cloudflare Pages (free tier)
- **Backend**: Pages Functions (serverless)
- **Storage**: KV for counters/sessions, R2 for file storage
- **No traditional database**

### Document Management
- Centralized config file (`src/config/documents.ts`) as single source of truth
- Static PDFs in `public/documents/` for Phase 1
- Migration to R2 with local fallback in Phase 3

### Admin Panel Approach
- **NOT using Decap CMS** — GitHub OAuth too complex for elderly non-technical user
- Custom minimal panel with simple file upload interface
- Single admin account with bcrypt password + JWT sessions
- Printed one-page French guide for president

### Security
- CSP headers via `public/_headers`
- Rate limiting on all write endpoints (KV with TTL)
- Input validation and sanitization
- R2 bucket private with authenticated proxy
- File upload validation: MIME type + magic bytes

### Development Practices
- All content in French
- Test email for development: jcohendumani7@gmail.com
- Validation before commits: `npm run typecheck && npm run lint && npm run test:run && npm run build`

## Plan Overview

### Phase 0: Project Setup
- Update CLAUDE.md with architectural decisions
- Create project-notes/ directory structure
- Establish validation workflow

### Phase 1: Content Fixes + New Pages (launch blocker)
- Fix metadata (lang="fr", og:image)
- Create centralized document config
- New Concours page
- Rework Congres page (remove palmarès, add gallery)
- Update Index (documents section, fix contact form, remove phone/counter)
- Fix Revue, Delegations, Historique pages
- Rework Footer (restructure layout, add confidentiality link)
- Add SPA routing config
- Set up Vitest + smoke tests

### Phase 2: Contact Form Backend + Live Counter (~2 days post-launch)
- Cloudflare Pages Functions for contact form
- Visitor counter with KV (IP hashing for daily uniqueness)
- Security headers

### Phase 3: Admin Panel + Photo Gallery Backend (~5-8 days)
- R2 bucket for media storage
- JWT authentication
- File management API
- Admin UI at /admin
- Connect frontend to R2

### Phase 4: Polish (deferrable)
- SEO (JSON-LD, sitemap)
- Cloudflare Web Analytics
- Accessibility audit
- Expanded concours section

## Content Corrections Identified

### Revue Page
- Issue number: 264 (consistent)
- Typos: BZNOIT→BENOIT, A1MADE→AMADE, Tistan→Tristan, FERDINAN→FERDINAND
- Add missing € symbol

### Delegations Page
- Remove duplicate Occitanie entry (Pierre Rousseau)
- Keep only Richard Maggiore for Occitanie
- Fix "Occitane" spelling
- Remove shuffled email data

### Historique Page
- Remove duplicate 2014 transition paragraph

### Index Page
- Remove hardcoded phone number
- Remove hardcoded visitor counter (184,064)
- Change Concours card to navigation link
- Add "Documents à télécharger" section
- Fix contact form (mailto link instead of fake toast)

### Congres Page
- Move palmarès content to new Concours page
- Reorder: event card at top, gallery below
- Add registration download button
- Gallery redesign: year selector (2010-2026), grid, lightbox modal

## Visitor Counter Decision
- Deferred to Phase 2
- Will use IP hashing + date to prevent double-counting
- Seeded with 184,064 (current value)
- Fallback: hide stat entirely if API fails (never show 0)

## Gallery Years
- 2010–2026 (17 years of congresses)
- Simple layout with placeholder state for Phase 1
- Iteration after real photos uploaded via admin panel in Phase 3

## Next Steps
1. Complete Phase 0 (setup)
2. Systematically implement Phase 1 tasks
3. Validate with full test suite before Phase 2
