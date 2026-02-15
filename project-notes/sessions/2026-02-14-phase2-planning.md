# Phase 2 Planning Session — 2026-02-14

## Context

Phase 1 (static site cleanup) complete and validated. Site being deployed to Cloudflare Pages. Phase 2 adds backend functionality via Cloudflare Pages Functions.

## Objectives

1. **Working contact form** with email delivery via Resend API
2. **Live visitor counter** with IP deduplication
3. **Security headers** (non-CSP initially, CSP deferred)

## Key Decisions

### Email Service: Resend
- **Why**: Free tier (100/day, 3000/month), simple fetch API, no dependencies
- **Alternative considered**: SendGrid (more complex setup, overkill for needs)
- **Testing**: Use `onboarding@resend.dev` sender until domain verified
- **Production**: Switch to `noreply@spafnat.com` after domain verification

### Storage: Single KV Namespace
- **Namespace**: `SPAF_KV` with key prefixes
  - `counter:visitors` — total visitor count
  - `rate:visit:{hash}` — 24h TTL deduplication keys
  - `rate:contact:{ip}` — 5min TTL rate limit keys
- **Why single namespace**: Simpler configuration, clear prefix structure
- **Alternative considered**: Multiple namespaces (unnecessary complexity)

### Counter Accuracy: KV (Eventual Consistency)
- **Accepted tradeoff**: Rare double-counts acceptable for low-traffic poetry site
- **Alternative rejected**: Durable Objects (requires separate Worker class, extra bindings, overkill)
- **Privacy**: SHA-256 hash of IP+date, no raw IPs stored
- **Deduplication**: 24h TTL on dedup keys (same IP can count again next day)

### Security Headers: CSP Deferred
- **Phase 2**: Ship non-CSP headers only (X-Frame-Options, X-Content-Type-Options, etc.)
- **Why defer CSP**: Need to observe third-party needs in production first
- **CSP compatibility**: X-Frame-Options and CSP `frame-ancestors` can coexist (X-Frame-Options is fallback for older browsers)

### wrangler.toml: Gitignored
- **Why**: Contains environment-specific config (namespace IDs, etc.)
- **Local dev**: Use `npx wrangler pages dev dist --kv SPAF_KV` (no need for wrangler.toml)
- **Production**: Bindings configured in Cloudflare Dashboard

### Origin Validation: Loose Initially
- **Phase 2**: Allow missing Origin, `*.pages.dev`, `localhost:*`
- **Why**: Some clients omit Origin header, need to test in preview environments
- **Production TODO**: Tighten to `spafnat.com` only once custom domain active

### Rate Limiting Strategy
- **Contact form**: 1 submission per IP per 5 minutes (300s TTL in KV)
- **Visitor counter**: 1 count per IP per 24 hours (86400s TTL in KV)
- **IP resolution**: CF-Connecting-IP → x-forwarded-for → "localhost" (fallback chain)

### Form Spam Protection
- **Honeypot field**: Hidden `website` field (absolute positioned, opacity-0, -z-10, aria-hidden, tabIndex=-1)
- **Behavior**: If honeypot filled, return fake success (200) without sending email (don't tip off bots)

## Implementation Plan

### Files to Create
1. `public/_headers` — Security headers
2. `wrangler.toml` — Local dev config (gitignored)
3. `functions/env.d.ts` — Shared Env type
4. `functions/tsconfig.json` — Workers types config
5. `functions/api/visit.ts` — Visitor counter API
6. `functions/api/contact.ts` — Contact form API

### Files to Modify
1. `.gitignore` — Add `.wrangler/` and `wrangler.toml`
2. `package.json` — Add `@cloudflare/workers-types` and `wrangler` devDeps
3. `src/pages/Index.tsx` — Live counter + controlled form + honeypot

### TODOs After Implementation (Pre-Production)
- [ ] Add CSP header once in production and third-party needs are known
- [ ] Tighten Origin allowlist to `spafnat.com` only
- [ ] Verify `spafnat.com` domain in Resend, switch sender to `noreply@spafnat.com`
- [ ] Switch `CONTACT_RECIPIENT` env var from `jcohendumani7@gmail.com` to `plecordier@free.fr`

## Cloudflare Dashboard Actions (User)

### 1. Create KV Namespace
- Workers & Pages > KV > Create namespace
- Name: `SPAF_KV`
- Copy namespace ID

### 2. Bind KV to Pages Project
- Workers & Pages > your Pages project > Settings > Bindings
- Add > KV namespace
- Variable name: `SPAF_KV`
- Select: `SPAF_KV` namespace

### 3. Resend Setup
- Create account at resend.com
- Create API key (name: `spafnat`)
- Copy `re_...` key

### 4. Add Environment Variables to Pages
- Workers & Pages > your Pages project > Settings > Environment variables
- Add:
  - `RESEND_API_KEY` = `re_...` (encrypted)
  - `CONTACT_RECIPIENT` = `jcohendumani7@gmail.com` (switch to `plecordier@free.fr` for production)

### 5. Domain Verification (Later, for Production)
- Verify `spafnat.com` in Resend dashboard
- Add DNS records to Cloudflare DNS
- Switch sender from `onboarding@resend.dev` to `noreply@spafnat.com`

## Verification Steps

```bash
# 1. Typecheck + lint + tests
npm run typecheck && npm run lint && npm run test:run

# 2. Build
npm run build

# 3. Local integration test with Wrangler
npx wrangler pages dev dist --kv SPAF_KV

# Then in browser at http://localhost:8788:
# - Visitor counter should appear with count (179176 on first visit)
# - Refreshing should NOT increment again (same IP+date dedup)
# - Contact form should submit and show success/error toast
# - Submitting contact form twice within 5 min should show rate limit error
# - Check Network tab: security headers present on responses
```

## Notes

- Counter starts at 179175 (hardcoded fallback), creates KV key on first real visit
- No manual counter seeding needed in KV
- IP hashing ensures privacy (SHA-256 of IP+date, 24h TTL)
- Rate limiting prevents abuse without blocking legitimate users
- Honeypot is invisible to humans, traps bots
- Security headers apply only on Cloudflare Pages (deployed) and `wrangler pages dev`, not `npm run dev`
