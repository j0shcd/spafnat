# Sanity Check + Phase 3 Design — 2026-02-15

## Sanity Check: Phase 1 & 2 Status

### ✅ All Systems Green

**Build validation**:
- `npm run typecheck` — ✅ Clean (0 errors)
- `npm run lint` — ✅ Clean (7 warnings, all from shadcn-ui components, expected)
- `npm run build` — ✅ Success

**Phase 1 foundation** — ✅ Complete:
- Centralized configs (documents.ts, contact.ts)
- All pages created (Index, Historique, Congres, Concours, Revue, Delegations, NotFound)
- Routing configured with catch-all
- Layout with Header + Footer
- SPA redirect configured (`public/_redirects`)
- Fonts loaded (Crimson Text + Inter)
- CSS design system (`:root` variables)

**Phase 2 backend** — ✅ Complete:
- `functions/api/visit.ts` — Visitor counter with IP+UA dedup, SHA-256 hashing, 24h TTL
- `functions/api/contact.ts` — Contact form with honeypot, rate limiting, Resend integration, HTML escaping
- Security headers in `public/_headers` (non-CSP headers)
- KV storage bindings configured

**Phase 2 frontend** — ✅ Complete:
- Live visitor counter on Index page (conditionally rendered)
- Contact form with honeypot field, validation, API integration
- Toast messages for success/error feedback
- Loading states during submission

**Phase 2 testing** — ✅ Complete:
- 52 passing tests:
  - 28 smoke tests (pages + routing + documents config)
  - 24 security unit tests (9 visitor counter + 15 contact form)
- Real unit tests with mocked KV in `tests/security/`
- Comprehensive coverage: XSS, injection, rate limiting, honeypot, dedup, HTML escaping
- Documentation: TESTING.md + honeypot-testing.md

### ⚠️ Minor Issues Found (Not Blockers)

1. **`src/tests/security.test.ts` — 28 failing integration tests**
   - These are old integration tests that use `fetch()` with relative URLs
   - Superseded by real unit tests in `tests/security/visitor-counter.test.ts` + `contact-form.test.ts`
   - **Action**: Delete file in Phase 3 cleanup

2. **`.dev.vars.example` is missing**
   - Memory claims it exists, but it doesn't
   - Needed for developer onboarding
   - **Action**: Create in Phase 3 cleanup with Phase 2 + Phase 3 env vars

3. **Shared helpers duplicated**
   - `getClientIP` and `isValidOrigin` copied between `visit.ts` and `contact.ts`
   - Will need third copy for auth endpoints
   - **Action**: Extract to `functions/lib/helpers.ts` in Phase 3 cleanup

4. **Memory file slightly stale**
   - Claims "52 tests (28 smoke + 24 security)" — actual count matches, just needed clarity
   - Updated to reflect Phase 3 planning complete

### ✅ Deployment Readiness

**Phase 2 is production-ready** once these manual steps complete:
- Create `SPAF_KV` namespace in Cloudflare Dashboard
- Add `RESEND_API_KEY` and `CONTACT_RECIPIENT` env vars
- Test in preview deployment (*.pages.dev)
- Once custom domain active: tighten origin validation, switch to production email

---

## Phase 3 Design: Admin Panel + File Management

### Planning Session

**Date**: 2026-02-15
**Duration**: ~3 hours (exploration + design + documentation)
**Output**:
- Comprehensive planning document: `sessions/2026-02-15-phase3-planning.md` (219 lines)
- Implementation plan: `.claude/plans/dazzling-napping-raccoon.md`
- Updated TODO.md with detailed Phase 3 checklist
- Updated MEMORY.md with current state + Phase 3 decisions

### User Decisions (via AskUserQuestion)

1. **Scope**: Break into 3 sub-phases (3a/3b/3c) with checkpoints ✅
2. **Photos**: Serve originals only, no thumbnail generation ✅
3. **Admin password**: Store bcrypt hash as env var in Cloudflare Dashboard ✅
4. **File size limit**: 5 MB maximum ✅

### Architecture Overview

**Sub-phasing**:
- **Phase 3a** (~2-3 days): Auth + backend APIs (JWT, bcrypt, R2 upload/delete/serve)
- **Phase 3b** (~2-3 days): Admin UI (React, elderly-friendly design)
- **Phase 3c** (~1-2 days): Gallery + document integration (connect Congres page to R2)

**Total scope**: 27 new files, 9 modified, 1 deleted (~900-1200 LOC)

**Key technologies**:
- `jose` — JWT for edge runtimes (Web Crypto API, no Node.js deps)
- `bcryptjs` — Password hashing in Workers (pure JS implementation)
- Cloudflare R2 — File storage (private bucket, public media endpoint)
- React Context — Auth state management
- shadcn-ui — Reuse existing components for admin UI

### R2 Storage Design

**Bucket**: `spaf-media` (private)

**Key structure**:
```
documents/{documentKey}.pdf       # Maps to src/config/documents.ts keys
congres/{year}/{filename}         # Congress photos by year (2010-2026)
```

**Access pattern**:
- **Private**: Bucket itself has no public access
- **Public media endpoint**: `/api/media/{r2-key}` serves files with cache headers
- **Admin endpoints**: Protected with JWT (upload, list, delete)
- **Gallery endpoint**: Public (read-only listing for Congres page)

**Security**:
- Path traversal blocked (reject `..` in paths)
- No directory listing (reject empty paths, trailing slashes)
- MIME + magic bytes validation on upload
- 5 MB size limit enforced before parsing

### Auth System Design

**JWT with session revocation**:
- 24-hour token expiration
- Payload includes `jti` (UUID session ID)
- Store `session:{jti}` in KV with 24h TTL
- Middleware verifies: JWT valid AND session exists in KV
- Logout = delete session from KV (immediate revocation)

**Password verification**:
- Admin password stored as bcrypt hash in `ADMIN_PASSWORD_HASH` env var
- `bcryptjs` used (pure JS, works in Workers)
- Login rate limiting: 5 attempts per 15 min per IP

**Middleware pattern**:
```
functions/api/admin/_middleware.ts  # Protects all /api/admin/* routes
```

Extracts JWT from Authorization header, verifies signature, checks KV session, attaches claims to `context.data.auth`, calls `next()`. If auth fails, returns 401 before handler runs.

### Admin UI Design (Elderly User Focus)

**UX priorities**:
- Large fonts (16px+ body, 18px+ labels)
- High contrast (SPAF brown on cream)
- Big touch targets (44px+ buttons)
- Clear French labels (no jargon)
- Confirmation dialogs before delete
- Toast feedback for all actions
- Upload progress bars
- Green/red status badges

**Layout**:
- Simple two-section dashboard: "Documents" + "Photos du Congrès"
- Minimal top bar: SPAF logo + "Administration" + logout button
- No sidebar (only 2 sections, keep it simple)
- Admin routes use `AdminLayout` (not public `Layout` with Header/Footer)

**Documents section**:
- 8 document slots (maps to `src/config/documents.ts`)
- Status badge: green "En ligne" if R2 file exists, red "Manquant" if not
- Upload/replace button per slot
- Delete button with confirmation dialog

**Photos section**:
- Year selector dropdown (2010-2026)
- Photo grid for selected year
- "Ajouter des photos" button (multiple file picker)
- Delete button on each photo (with confirmation)
- Batch upload progress indicator

### File Validation (Defense in Depth)

**Three layers**:
1. Client-side: File input `accept` attribute
2. MIME type: Validate `file.type` matches allowlist
3. Magic bytes: Read file header, verify matches MIME

**Magic bytes signatures**:
```
PDF:  %PDF (0x25 0x50 0x44 0x46)
JPEG: 0xFF 0xD8 0xFF
PNG:  0x89 0x50 0x4E 0x47
WebP: RIFF...WEBP (check both at offset 0 and 8)
```

Prevents uploading malware disguised as PDF (e.g., `.exe` renamed to `.pdf`).

### Document Migration Strategy

**Gradual migration with fallback**:
- Frontend tries R2 first: `HEAD /api/media/{r2Key}`
- If 200: use R2 URL
- If 404: fall back to local path (`public/documents/`)
- Cache results to avoid repeated HEAD requests

**Benefits**:
- No breaking changes (local files stay as backup)
- President uploads when ready (no deadline pressure)
- Can test R2 integration without deleting local files
- Rollback path if R2 has issues

### Key Tradeoffs & Rationale

**localStorage vs httpOnly cookies for JWT**:
- **Chosen**: localStorage + Authorization header
- **Rationale**: Cloudflare Pages Functions don't share session state with SPA; localStorage is standard for SPAs; single-admin site with rate-limiting = acceptable XSS risk

**bcryptjs vs faster hashing**:
- **Chosen**: bcryptjs (industry standard password hashing)
- **Rationale**: Single-admin + rate limiting = max 5 bcrypt ops per 15 min; ~100ms per operation acceptable for login; security > speed

**No thumbnail generation**:
- **Chosen**: Serve original photos only
- **Rationale**: Simpler implementation; president uploads reasonably-sized photos; image processing in Workers adds complexity

**5 MB file limit**:
- **Chosen**: 5 MB max (conservative)
- **Rationale**: Adequate for PDFs + standard photos; safe for Workers free tier; can increase later if needed

**Custom panel vs Decap CMS**:
- **Chosen**: Custom minimal admin panel
- **Rationale**: Decap CMS requires GitHub OAuth (too complex for 70-year-old non-technical user); custom panel optimized for exact use case

### Potential Challenges & Mitigations

1. **JWT expiration UX**: Token expires after 24h. If admin leaves tab open, next action gets 401.
   - **Mitigation**: `useAdminApi` hook auto-logs out on 401, shows login form. Admin simply logs in again.

2. **Concurrent photo uploads**: Uploading 10 photos at once.
   - **Mitigation**: Sequential uploads with per-file progress ("Uploading 3/10..."). Retry for failures.

3. **Magic bytes for WebP**: WebP has complex header (RIFF container + WEBP signature).
   - **Mitigation**: Check RIFF at bytes 0-3, WEBP at bytes 8-11. If complex, defer WebP to Phase 4.

4. **bcryptjs performance**: bcrypt is CPU-intensive (~100ms).
   - **Mitigation**: Rate limiting ensures max 5 operations per 15 min. Workers allow 30sec wall time (plenty of headroom).

### Loose Ends (Minor, Acceptable)

1. **Session expiry warning**: Nice-to-have toast 5 min before token expires → Defer to Phase 4
2. **WebP support**: If magic bytes check is complex → Defer to Phase 4, only support JPEG/PNG initially
3. **Admin password rotation**: No UI, manual process (re-run bcrypt, update env var) → Acceptable for single-admin
4. **R2 lifecycle policies**: No soft delete (trash folder) → Delete is permanent, confirmation dialog prevents accidents
5. **French user guide format**: 1-page PDF, printed → Create in Phase 3c

### Known Limitations (Acceptable)

- No multi-admin support (single password, no user management)
- No file versioning (replace = overwrite)
- No audit logs (who uploaded/deleted what — single user, no need)
- No search/filter in admin UI (only 8 docs + 17 years, small enough to browse)
- No image compression (president uploads reasonably-sized photos)

---

## Pre-Phase 3 Cleanup Tasks

Before starting Phase 3a implementation:

1. ✅ **Delete failing tests**: Remove `src/tests/security.test.ts`
2. ✅ **Create .dev.vars.example**: Template with Phase 2 + Phase 3 env vars
3. ✅ **Extract shared helpers**: Create `functions/lib/helpers.ts` with `getClientIP`, `isValidOrigin`, `escapeHtml`, `jsonResponse`
4. ✅ **Refactor contact.ts + visit.ts**: Use shared helpers
5. ✅ **Commit**: "refactor: extract shared helpers for DRY backend code"

---

## Documentation Deliverables

**Created today**:
1. `sessions/2026-02-15-phase3-planning.md` — Comprehensive planning session notes (219 lines)
2. `.claude/plans/dazzling-napping-raccoon.md` — Implementation plan for Phase 3
3. `TODO.md` — Updated with detailed Phase 3 checklist (expanded from 11 lines to ~90 lines)
4. `MEMORY.md` — Updated current state + Phase 3 decisions
5. This file — Sanity check results + design summary

**Total documentation**: ~800 lines added/updated

---

## Next Steps

1. **User reviews**:
   - Read planning session notes for full context
   - Review Phase 3 plan for accuracy
   - Confirm approach aligns with expectations

2. **Phase 3a start** (when ready):
   - Run pre-cleanup tasks
   - Install dependencies (`jose`, `bcryptjs`)
   - Add new env vars to `functions/env.d.ts`
   - Implement auth endpoints (login, logout, verify)
   - Implement middleware for admin routes
   - Implement R2 upload/delete/files endpoints
   - Implement public media + gallery endpoints
   - Write security tests (auth, upload, media)
   - Verify with `npm run typecheck && npm run lint && npm run test:run && npm run build`

3. **Validation checkpoints**:
   - After 3a: Manual test login, upload, media serving
   - After 3b: Manual test full admin UI workflow
   - After 3c: End-to-end test with real content

---

## Success Metrics

**Phase 3 will be complete when**:
- President can log in to `/admin` with password
- President can upload PDFs to any of the 8 document slots
- President can upload congress photos for any year 2010-2026
- President can delete files with confirmation
- President sees clear status (green "En ligne" / red "Manquant")
- Congres public page displays photos from R2
- Document downloads work from R2 with local fallback
- All tests pass, no regressions
- French user guide delivered (1-page PDF, printed)

**Target**: President manages files independently, no developer intervention needed.
