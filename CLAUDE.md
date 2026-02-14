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

No test framework is configured.

## Architecture

- **Stack**: Vite + React 18 + TypeScript + TailwindCSS + shadcn-ui + React Router
- **Path alias**: `@` maps to `./src` (configured in vite.config.ts and tsconfig)
- **Layout**: `src/components/Layout.tsx` wraps all routes with `Header` + `Footer`
- **Routing**: `src/App.tsx` — all routes defined here under `<Layout>`. Add custom routes above the catch-all `*` route.
- **Pages**: `src/pages/` — Index, Historique, Congres, Revue, Delegations, NotFound
- **UI components**: `src/components/ui/` — shadcn-ui primitives (do not edit directly; managed via shadcn CLI)
- **Styling**: CSS variables for the SPAF design system defined in `src/index.css` (`:root` block). Custom colors include `artistic-yellow`, `artistic-orange`, `artistic-warm-orange` and brown/red tones for primary/secondary/accent.
- **Fonts**: Crimson Text (serif headings via `font-serif-title`) and Inter (sans body text via `font-sans`), loaded from Google Fonts in `index.html`
