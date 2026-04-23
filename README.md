# spafnat

Production website for the Societe des Poetes et Artistes de France (SPAF),
founded in 1958.

Live: https://spafnat.com

Constraints: no hosting budget, non-technical admin team, large photo archive
(annual congress galleries), historical PDF documents. Built as a static SPA
with co-located serverless functions on Cloudflare's free tier.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Deployment | Cloudflare Pages |
| Storage | Cloudflare R2 (photos, PDFs) |
| API | Cloudflare Pages Functions |
| Email | Resend |

## Architecture

No separate backend. API endpoints run as Cloudflare Pages Functions,
co-located with the frontend build.

**functions/api/**

| Endpoint | Purpose |
|---|---|
| gallery.ts | Serves congress photos from R2 by year with CDN cache headers |
| contact.ts | Contact form with rate limiting (KV), honeypot, origin check, HTML escaping |
| concours.ts | Poetry competition entries |
| visit.ts | Visit counter |

Storage:
- R2 — photo archives keyed by congres/{year}/
- KV — rate limit state (1 submission / IP / 5 min)

## Development

```bash
npm install
npm run dev          # localhost:8080
npm run test         # Vitest + React Testing Library
npm run build
```
Pre-commit: type-check -> lint -> test -> build.

Local Cloudflare bindings:
npx wrangler pages dev dist --kv SPAF_KV --r2 SPAF_MEDIA

---
Public for portfolio/reference. Content belongs to SPAF.

---
