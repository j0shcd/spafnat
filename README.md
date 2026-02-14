# SPAF Website

Website for the [Société des Poètes et Artistes de France](http://www.spafnat.com), a French poetry and arts association founded in 1958.

## What is this?

Started as a Lovable-generated project, then extensively refactored and enhanced manually. It's a static site for a 60+ year old poetry organization that needed to move from expensive hosting to something sustainable (Cloudflare Pages).

All content is in French because, well, it's a French poetry society.

## Stack

- React 18 + TypeScript + Vite
- TailwindCSS + shadcn-ui
- Vitest + React Testing Library
- Deployed on Cloudflare Pages

## Development

**Requirements:**
- Node.js 22.x LTS (matches Cloudflare Pages default)
- Use `nvm use` to automatically switch to the correct Node version

```bash
npm install        # install dependencies
npm run dev        # dev server (port 8080)
npm run build      # production build
npm run lint       # ESLint
npm run test:run   # run tests
```

**Validation before commits:**
```bash
npm run typecheck && npm run lint && npm run test:run && npm run build
```

## Architecture Highlights

- Centralized config for documents and contact info 
- SPA routing with fallback (`public/_redirects`)
- Custom fonts (Crimson Text + Inter) and color system
- Static PDF hosting in `public/documents/`
- Path alias `@` → `./src`

## Project Structure

```
src/
├── pages/          # Route components
├── components/     # Reusable components
│   └── ui/        # shadcn-ui primitives (CLI-managed)
├── config/         # Centralized config (documents, contact)
└── App.tsx         # Router setup
```

## License

Built for SPAF. Not open source in the traditional sense, but public for portfolio/reference purposes.
