# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Website for the **Société des Poètes et Artistes de France (SPAF)**, a French poetry and arts association founded in 1958. All user-facing content is in French. Built with the Lovable platform.

## Commands

```bash
npm i            # install dependencies
npm run dev      # dev server on port 8080
npm run build    # production build
npm run lint     # ESLint
```

Test framework: Vitest + React Testing Library (configured in Phase 1).

## Architecture

- **Stack**: Vite + React 18 + TypeScript + TailwindCSS + shadcn-ui + React Router
- **Path alias**: `@` maps to `./src` (configured in vite.config.ts and tsconfig)
- **Layout**: `src/components/Layout.tsx` wraps all routes with `Header` + `Footer`
- **Routing**: `src/App.tsx` — all routes defined here under `<Layout>`. Add custom routes above the catch-all `*` route.
- **Pages**: `src/pages/` — Index, Historique, Congres, Revue, Delegations, NotFound
- **UI components**: `src/components/ui/` — shadcn-ui primitives (do not edit directly; managed via shadcn CLI)
- **Styling**: CSS variables for the SPAF design system defined in `src/index.css` (`:root` block). Custom colors include `artistic-yellow`, `artistic-orange`, `artistic-warm-orange` and brown/red tones for primary/secondary/accent.
- **Fonts**: Crimson Text (serif headings via `font-serif-title`) and Inter (sans body text via `font-sans`), loaded from Google Fonts in `index.html`

## Hosting & Deployment

- **Migration**: From spafnat.com (10€/month) to Cloudflare Pages (free tier)
- **Deployment**: Static site with Cloudflare Pages Functions for backend features (Phase 2+)
- **Storage**: No traditional database — using Cloudflare KV (counters/sessions) and R2 (file storage) in later phases
- **SPA Routing**: `public/_redirects` configures fallback to index.html for client-side routing

## Key Conventions

### Document Management
- **Centralized config**: All downloadable PDFs defined once in `src/config/documents.ts`
- **Static files**: PDFs live in `public/documents/` (not bundled as assets)
- **Future**: In Phase 3, documents will be served from Cloudflare R2 with local fallback

### Content
- **Language**: All user-facing content must be in French
- **Primary contact**: plecordier@free.fr (president's email)
- **Test email**: jcohendumani7@gmail.com for development/testing only

### Admin Panel (Phase 3)
- **Approach**: Custom minimal panel, NOT Decap CMS (GitHub OAuth too complex for non-technical president)
- **Authentication**: Single admin account with JWT sessions in KV
- **File upload**: Via R2 with validation (MIME type + magic bytes)

## Security Priorities

- **CSP headers**: Restrict script/style/img sources via `public/_headers`
- **Rate limiting**: All write endpoints and login attempts (via KV with TTL)
- **Input validation**: Sanitize all user-provided strings
- **R2 privacy**: Bucket is private; files served only through authenticated proxy or public media endpoint
- **No directory listing**: Public media endpoint doesn't expose file structure

## Validation Workflow

Before any commit or deployment:
```bash
npm run typecheck && npm run lint && npm run test:run && npm run build
```

All four must pass clean.
