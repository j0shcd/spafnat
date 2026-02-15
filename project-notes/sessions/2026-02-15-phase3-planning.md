# Phase 3 Planning: Admin Panel & File Management — 2026-02-15

## Context

Phase 1 (foundation) and Phase 2 (visitor counter + contact form APIs) are complete and validated. Phase 3 adds an admin panel so the SPAF president (~70 years old, non-technical) can manage files (PDFs, congress photos) independently without developer intervention.

## Objectives

1. **Authentication system** — Simple single-admin login with JWT sessions
2. **R2 file storage** — Cloudflare R2 bucket for PDFs and photos
3. **Admin UI** — Elderly-user-friendly interface for file management
4. **Gallery integration** — Connect Congres page photo gallery to R2
5. **Document migration** — Serve documents from R2 with local fallback

## Scope & Estimates

**Total effort**: 5-8 days (broken into 3 sub-phases)
- **Phase 3a**: Auth + backend APIs (~2-3 days)
- **Phase 3b**: Admin UI (~2-3 days)
- **Phase 3c**: Gallery + document integration (~1-2 days)

**Deliverables**: 27 new files, 9 modified, 1 deleted (~900-1200 LOC)

## Key User Decisions

### 1. Sub-phasing Strategy
- **Decision**: Break into 3a/3b/3c with testing checkpoints between each
- **Rationale**: Easier to review, catch issues early, commit atomic changes
- **Alternative rejected**: One continuous 5-8 day implementation (higher risk of bugs)

### 2. Congress Photo Processing
- **Decision**: Serve original uploaded images (no thumbnail generation)
- **Rationale**: Simpler implementation, president uploads reasonably-sized photos
- **Alternative rejected**: Auto-thumbnail generation (requires image processing in Workers, adds complexity)

### 3. Admin Password Setup
- **Decision**: Store bcrypt hash as `ADMIN_PASSWORD_HASH` env var in Cloudflare Dashboard
- **Rationale**: Simple, secure, easy to rotate without code changes
- **Alternatives rejected**:
  - KV with setup endpoint (adds attack surface)
  - CLI script (requires CLI access for password changes)

### 4. File Size Limits
- **Decision**: 5 MB maximum upload size
- **Rationale**: Adequate for PDFs and standard photos, within Workers free tier limits
- **Alternatives rejected**:
  - 10 MB (better for high-res photos but may need paid Workers plan)
  - 25 MB (requires paid plan for request body size)

## Architecture Decisions

### Auth System Design

**JWT with Server-Side Revocation**:
- Use `jose` library (edge-native, Web Crypto API, zero Node.js deps)
- 24-hour token expiration
- Store session token in KV as `session:{jti}` with 24h TTL (enables logout/revocation)
- Rate limiting on login: 5 attempts per 15 minutes per IP (progressive backoff)
- Single admin account, password verified with `bcryptjs` (pure JS bcrypt for Workers)

**Why JWT over sessions?**
- Cloudflare Pages Functions don't have shared session storage
- localStorage + Authorization header is standard for SPAs
- Server-side session tracking via KV gives us revocation capability

**Why bcryptjs over other hashing?**
- Workers don't support native bcrypt (Node.js crypto module unavailable)
- `bcryptjs` is pure JavaScript, well-maintained, industry standard
- Single-admin use case = max 5 bcrypt operations per 15 min (well within Workers CPU limits)

### R2 Storage Structure

```
documents/{document-key}.pdf       # Maps to src/config/documents.ts keys
congres/{year}/{filename}          # Congress photos organized by year
```

**Why this structure?**
- Clean mapping: `documents.ts` keys → R2 keys (bulletinAdhesion → documents/bulletinAdhesion.pdf)
- Natural organization: Photos grouped by congress year (2010-2026)
- Simple admin UI: Two categories (Documents, Congress Photos)
- No nested complexity: Max 2 levels deep

**R2 Privacy Model**:
- Bucket is private (no public access)
- Files served ONLY through `/api/media/{path}` public endpoint
- No directory listing (rejects empty paths and trailing slashes)
- Path traversal blocked (reject `..` in paths)

### Middleware Pattern for Auth

Cloudflare Pages Functions support `_middleware.ts` files that run before handlers in that directory:

```
functions/
  api/
    admin/
      _middleware.ts      # Protects all /api/admin/* routes
      upload.ts           # No auth code needed (middleware handles it)
      files.ts
      delete.ts
```

The middleware verifies JWT + checks KV session, attaches auth claims to `context.data.auth`, then calls `next()`. If auth fails, returns 401 before the handler runs.

**Benefits**:
- DRY (no repeated auth logic in every handler)
- Clear separation of concerns
- Standard Cloudflare Pages pattern

### Frontend Auth State Management

**React Context + localStorage**:
- `AuthContext` provides `{ token, isAuthenticated, login, logout }`
- Token stored in localStorage (acceptable for single-admin site)
- On mount: verify stored token via `GET /api/auth/verify`
- On 401 response: auto-logout and show login form
- No httpOnly cookies (Pages Functions don't share session with SPA)

**Admin Routes Outside Public Layout**:
- Current `AppRoutes.tsx` wraps everything in `<Layout>` (Header + Footer)
- Admin routes need their own `AdminLayout` (simple top bar, no public nav)
- Restructure: public routes in `<Layout>`, admin routes in `<AdminLayout>`

### File Upload Validation (Defense in Depth)

**Three validation layers**:

1. **Client-side**: File input `accept` attribute (`.pdf` for documents, `image/*` for photos)
2. **MIME type check**: Validate `file.type` matches allowlist
3. **Magic bytes verification**: Read first bytes of file, verify matches MIME type

**Magic bytes signatures**:
```typescript
PDF:  %PDF (0x25 0x50 0x44 0x46)
JPEG: 0xFF 0xD8 0xFF
PNG:  0x89 0x50 0x4E 0x47
WebP: RIFF...WEBP (0x52 0x49 0x46 0x46)
```

**Why magic bytes?**
- Prevents uploading malware disguised as PDF (`.exe` renamed to `.pdf`)
- MIME type can be spoofed easily
- Industry best practice for file upload security

### Public vs Protected Endpoints

**Protected** (require JWT in Authorization header):
- `/api/admin/upload` — file upload
- `/api/admin/files` — list files
- `/api/admin/delete` — delete files

**Public** (no auth):
- `/api/auth/login` — login endpoint
- `/api/media/{path}` — serve files from R2 (read-only, no directory listing)
- `/api/gallery?year=` — list congress photos for public gallery

**Why separate gallery endpoint?**
- Admin files endpoint requires auth
- Public Congres page needs to fetch photo list without auth
- Clean separation: gallery.ts for public read, admin/files.ts for admin management

## UX Design for Elderly User

### Accessibility Priorities

1. **Large text**: Minimum 16px body, 18px+ for labels
2. **High contrast**: SPAF dark brown on cream background (existing palette)
3. **Big touch targets**: Minimum 44px for buttons/controls
4. **Clear French labels**: No technical jargon ("Ajouter" not "Upload", "Supprimer" not "Delete")
5. **Confirmation dialogs**: Before any destructive action (delete files)
6. **Visible feedback**: Toast messages for success/error, upload progress bars
7. **Simple workflows**: No multi-step wizards, linear operations
8. **Status indicators**: Green/red badges for "En ligne" vs "Manquant" documents

### Admin UI Structure

**Simple two-section dashboard**:
- **Documents** card: 8 document slots, upload/replace/delete per slot, status badges
- **Photos du Congrès** card: Year selector, photo grid, batch upload, delete

**Minimalist layout**:
- Top bar: SPAF logo + "Administration" + logout button
- No sidebar navigation (only 2 sections, keep it simple)
- Reuse existing shadcn-ui components (Card, Button, Dialog, Badge, etc.)
- No custom styling beyond SPAF color scheme

## Technical Implementation Details

### Dependencies (3 new packages)

```json
{
  "jose": "^5.x",              // JWT for edge runtimes
  "bcryptjs": "^2.x",          // Password hashing in Workers
  "@types/bcryptjs": "^2.x"    // TypeScript types (dev)
}
```

**No additional frontend dependencies** — shadcn-ui components cover all UI needs.

### Environment Variables (3 new)

| Variable | Purpose | Example |
|----------|---------|---------|
| `JWT_SECRET` | JWT signing key | Generate with `openssl rand -base64 32` |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of admin password | Generate with `bcryptjs.hashSync(password, 10)` |
| `SPAF_MEDIA` | R2 bucket binding | Bucket name: `spaf-media` |

### Code Reuse: Shared Helpers

**Problem**: `getClientIP` and `isValidOrigin` duplicated between `visit.ts` and `contact.ts`.

**Solution**: Extract into `functions/lib/helpers.ts` before Phase 3a:
- `getClientIP(request: Request): string`
- `isValidOrigin(origin: string | null): boolean`
- `escapeHtml(text: string): string`
- `jsonResponse(data: unknown, status: number): Response` (new DRY helper)

**Benefits**:
- Avoid triple-duplication when auth endpoints need same helpers
- Single source of truth for security utilities
- Easier to test in isolation

### Media Endpoint Cache Strategy

**Cache headers**:
```http
Cache-Control: public, max-age=86400
X-Content-Type-Options: nosniff
Content-Disposition: inline
```

**Rationale**:
- 1-day cache (photos/PDFs change rarely)
- `public` allows CDN caching
- `nosniff` prevents MIME type confusion attacks
- `inline` lets browser display (not force download)

**Cloudflare caching behavior**:
- R2 responses are automatically cached at edge
- 1-day TTL balances freshness vs cache hit rate
- On file update: admin deletes old + uploads new (new filename = cache bust)

## File Inventory

### Phase 3a: Auth + Backend APIs (16 files)

**New backend files (11)**:
- `functions/lib/helpers.ts` — Shared utilities
- `functions/lib/file-validation.ts` — MIME + magic bytes
- `functions/api/auth/login.ts` — JWT login
- `functions/api/auth/logout.ts` — Revoke session
- `functions/api/auth/verify.ts` — Token validation
- `functions/api/admin/_middleware.ts` — Auth middleware
- `functions/api/admin/upload.ts` — File upload
- `functions/api/admin/files.ts` — List files
- `functions/api/admin/delete.ts` — Delete files
- `functions/api/media/[[path]].ts` — Public media serving
- `functions/api/gallery.ts` — Public gallery listing

**Modified (3)**:
- `functions/env.d.ts` — Add new env vars
- `functions/api/visit.ts` — Use shared helpers
- `functions/api/contact.ts` — Use shared helpers

**New tests (3)**:
- `tests/security/auth.test.ts` — Auth security
- `tests/security/upload.test.ts` — Upload validation
- `tests/security/media.test.ts` — Media serving

### Phase 3b: Admin UI (10 files)

**New frontend files (9)**:
- `src/contexts/AuthContext.tsx` — Auth state
- `src/hooks/useAdminApi.ts` — Authenticated fetch
- `src/components/admin/ProtectedRoute.tsx` — Route guard
- `src/components/admin/AdminLayout.tsx` — Admin layout
- `src/pages/admin/AdminLogin.tsx` — Login page
- `src/pages/admin/AdminDashboard.tsx` — Dashboard
- `src/pages/admin/AdminDocuments.tsx` — Document management
- `src/pages/admin/AdminPhotos.tsx` — Photo management
- `src/test/admin/admin-pages.test.tsx` — Admin smoke tests

**Modified (1)**:
- `src/AppRoutes.tsx` — Add /admin routes

### Phase 3c: Integration (7 files)

**New (2)**:
- `src/hooks/useDocumentUrl.ts` — R2 URL resolution
- `src/test/gallery.test.tsx` — Gallery tests

**Modified (5)**:
- `src/config/documents.ts` — Add `r2Key` field
- `src/pages/Congres.tsx` — Connect to R2 photos
- `src/pages/Index.tsx` — R2 document URLs
- `src/pages/Concours.tsx` — R2 document URLs
- `src/pages/Revue.tsx` — R2 document URLs

**Deleted (1)**:
- `src/tests/security.test.ts` — Failing integration tests (superseded)

**Total**: 27 new, 9 modified, 1 deleted

## Security Considerations

### Rate Limiting Strategy

**Login endpoint** (5 attempts / 15 min):
- KV key: `rate:login:{ip}`
- Progressive backoff: After 5 failures, block for 15 minutes
- Store: `{ attempts: number, firstAttempt: timestamp }`
- Same pattern as contact form rate limiting (proven in Phase 2)

**Why 5 attempts?**
- Balances security vs usability (president may mistype password)
- With bcrypt (expensive), 5 attempts still protects against brute force
- 15-minute lockout is annoying enough to deter attackers

### Path Traversal Prevention

**Media endpoint validation**:
```typescript
// Reject empty paths
if (!path || path === '') return 404;

// Reject directory listing
if (path.endsWith('/')) return 404;

// Reject path traversal
if (path.includes('..')) return 404;
```

**Why this matters**:
- Without checks, `/api/media/../functions/env.d.ts` could leak code
- Empty path could list all R2 keys
- Directory listing reveals file structure

### Session Revocation Model

**Problem**: JWT tokens can't be invalidated once issued (stateless by design).

**Solution**: Store session ID in KV with same TTL as JWT expiration:
- JWT payload includes `jti: uuid` (unique session ID)
- On login: store `session:{jti}` in KV with 24h TTL
- Middleware checks: JWT valid AND session exists in KV
- On logout: delete `session:{jti}` from KV (immediate revocation)

**Benefits**:
- Logout works immediately (critical for security)
- Can revoke sessions server-side if needed
- Still get JWT benefits (stateless auth, no DB lookups per request)

## Key Tradeoffs & Rationale

### Tradeoff: localStorage vs httpOnly Cookies

**Chosen**: localStorage for JWT token
**Rejected**: httpOnly cookies

**Rationale**:
- Cloudflare Pages Functions don't share session state with SPA
- localStorage + Authorization header is standard SPA pattern
- Single-admin site with rate-limited login = acceptable XSS risk
- httpOnly cookies would require complex SSR or proxy setup

**Risk mitigation**: CSP headers in Phase 3 will prevent inline script execution.

### Tradeoff: bcryptjs Performance

**Chosen**: bcryptjs (pure JS bcrypt)
**Rejected**: SHA-256 with salt (faster but weaker)

**Rationale**:
- bcrypt is industry standard for password hashing (designed to be slow)
- Single-admin + rate limiting = max 5 bcrypt ops per 15 min
- ~100ms per bcrypt operation is acceptable for login (user won't notice)
- Workers allow 30sec wall time (plenty of headroom)

**If performance becomes an issue**: Could pre-hash on client with SHA-256, then bcrypt on server (double-hashing). But this is premature optimization.

### Tradeoff: R2 Listing Pagination

**Chosen**: No pagination (assume <1000 files per category)
**Rejected**: Cursor-based pagination with `R2Bucket.list({ cursor })`

**Rationale**:
- R2 list returns max 1000 objects per call
- Poetry association unlikely to exceed 1000 PDFs or 1000 photos per year
- If ever needed: pagination is 1-line addition (`cursor: result.cursor`)

**Future-proofing**: Admin UI shows file count. If approaching 1000, revisit pagination.

### Tradeoff: Document URL Resolution

**Chosen**: Try R2 first, fall back to local path
**Rejected**: Migrate all files to R2, delete local copies

**Rationale**:
- Gradual migration path (president uploads when ready)
- Local files serve as backup if R2 has issues
- `useDocumentUrl` hook abstracts the fallback logic (clean separation)
- No breaking changes if R2 endpoint is down

**Implementation**: Hook does HEAD `/api/media/{r2Key}` on first render, caches result, falls back to local path on 404.

### Tradeoff: Admin UI Complexity

**Chosen**: Simple two-section dashboard (Documents, Photos)
**Rejected**: Full CMS with categories, tags, search, permissions, etc.

**Rationale**:
- User is a 70-year-old poet, not a content manager
- Only 8 document types + congress photos (small scope)
- More features = more confusion for non-technical user
- Can always add features later if needed

**Design principle**: Optimize for the 90% use case (upload/replace/delete a file).

## Potential Challenges & Mitigations

### Challenge 1: JWT Expiration UX

**Problem**: Token expires after 24h. If admin leaves tab open overnight, next action fails with 401.

**Mitigation**:
- `useAdminApi` hook catches 401, auto-logs out, shows login form
- Optional enhancement: Show toast warning 5 min before expiry (nice-to-have)
- Admin simply logs in again (acceptable for occasional use)

**Alternative rejected**: Sliding expiration (auto-refresh tokens) — adds complexity, unnecessary for single-admin site with infrequent logins.

### Challenge 2: Concurrent Photo Uploads

**Problem**: Admin uploads 10 photos at once. How to show progress?

**Mitigation**:
- Upload photos sequentially (not in parallel) to avoid rate limiting ourselves
- Show progress: "Uploading 3/10 photos..." with per-file progress bar
- On failure: Show which files succeeded, which failed
- Allow retry for failed files

**Alternative rejected**: Parallel uploads with Promise.all — risks overwhelming Workers, harder to show progress.

### Challenge 3: Vitest Environment for Backend Tests

**Problem**: Backend tests import Cloudflare Workers types, but Vitest uses jsdom environment.

**Current state**: Existing `tests/security/visitor-counter.test.ts` already works.

**Mitigation** (if issues arise):
- Add `// @vitest-environment node` comment to backend test files
- Or create separate `vitest.backend.config.ts` with `environment: 'node'`

**Likely not needed**: Existing Phase 2 tests use mocked KV/fetch without issues.

### Challenge 4: Magic Bytes for WebP

**Problem**: WebP has complex header (RIFF container + WEBP signature at offset 8).

**Mitigation**:
```typescript
// Check RIFF at bytes 0-3
const isRIFF = bytes[0] === 0x52 && bytes[1] === 0x49 && ...;

// Check WEBP at bytes 8-11
const isWEBP = bytes[8] === 0x57 && bytes[9] === 0x45 && ...;

return isRIFF && isWEBP;
```

**Fallback**: If WebP validation is complex, only allow JPEG/PNG initially. Add WebP support in Phase 4 if needed.

## Loose Ends & Open Questions

### Resolved During Planning

✅ **Thumbnail generation?** → No, serve originals
✅ **Admin password setup?** → Env var with bcrypt hash
✅ **File size limits?** → 5 MB
✅ **Sub-phasing?** → Yes, 3a/3b/3c with checkpoints

### Still Open (Minor)

1. **Session duration warning?**
   - Should we show a toast 5 min before token expiry?
   - Decision: Nice-to-have, defer to Phase 4 if user requests it

2. **WebP support complexity?**
   - Magic bytes check is more complex than JPEG/PNG
   - Decision: Implement if straightforward, otherwise defer to Phase 4

3. **Admin password rotation process?**
   - How does president change password after initial setup?
   - Decision: Document manual process (re-run bcrypt hash, update env var in Dashboard). No UI needed for single-admin site.

4. **R2 bucket lifecycle policies?**
   - Should deleted files be soft-deleted (moved to trash folder)?
   - Decision: Not needed. Delete is permanent. Confirmation dialog prevents accidents.

5. **French user guide format?**
   - Should it be PDF, Markdown, printed page?
   - Decision: Simple 1-page PDF, printed and kept near president's computer. Create in Phase 3c.

### Known Limitations (Acceptable)

1. **No multi-admin support**: Single password, no user management
2. **No file versioning**: Replace operation overwrites old file
3. **No audit logs**: No tracking of who uploaded/deleted what (single user = no need)
4. **No search/filter in admin UI**: Only 8 docs + years 2010-2026 (small enough to browse)
5. **No image compression**: President must upload reasonably-sized photos

## Pre-Phase 3 Cleanup

Before starting Phase 3a implementation:

1. **Delete failing integration tests**:
   - Remove `src/tests/security.test.ts` (28 tests, all failing)
   - Superseded by `tests/security/visitor-counter.test.ts` + `contact-form.test.ts`

2. **Create .dev.vars.example**:
   ```bash
   # Phase 2
   RESEND_API_KEY=re_...
   CONTACT_RECIPIENT=joshua@cohendumani.com

   # Phase 3 (add when implementing)
   JWT_SECRET=your-secret-here
   ADMIN_PASSWORD_HASH=$2a$10$...
   ```

3. **Extract shared helpers**:
   - Create `functions/lib/helpers.ts`
   - Refactor `contact.ts` and `visit.ts` to import from helpers
   - Commit: "refactor: extract shared helpers for DRY backend code"

## Testing Strategy

### Phase 3a: Backend Security Tests

**New test files** (follow existing pattern in `tests/security/`):
- `auth.test.ts`: Login rate limiting, JWT generation, token verification, revoked sessions
- `upload.test.ts`: File size limits, MIME validation, magic bytes, path traversal in filenames
- `media.test.ts`: Directory listing blocked, path traversal blocked, cache headers

**Test coverage targets**: Same as Phase 2 (comprehensive security, ~90% coverage of attack vectors)

### Phase 3b: Admin UI Smoke Tests

**New test file**:
- `src/test/admin/admin-pages.test.tsx`: Login renders, dashboard renders, protected route blocks unauthenticated

**Test approach**: Lightweight smoke tests (not full E2E). Just verify components render without crashing.

### Phase 3c: Integration Tests

**New test file**:
- `src/test/gallery.test.tsx`: Gallery fetches from API, shows loading state, handles empty state

**Updated tests**: Verify existing page tests still pass with R2 document URL changes.

## Deployment Checklist (Phase 3)

### Cloudflare Dashboard Setup (Manual, One-Time)

1. **Create R2 bucket**:
   - Go to R2 > Create bucket
   - Name: `spaf-media`
   - Location: Automatic (closest to users)

2. **Add environment variables** (Settings > Environment variables):
   - `JWT_SECRET` → Generate with `openssl rand -base64 32`
   - `ADMIN_PASSWORD_HASH` → Generate locally with Node REPL:
     ```javascript
     const bcrypt = require('bcryptjs');
     console.log(bcrypt.hashSync('your-password-here', 10));
     ```

3. **Add R2 binding** (Settings > Functions > R2 bucket bindings):
   - Variable name: `SPAF_MEDIA`
   - R2 bucket: `spaf-media`

### Local Development Setup

**Update wrangler.toml** (add R2 binding for local dev):
```toml
[[r2_buckets]]
binding = "SPAF_MEDIA"
bucket_name = "spaf-media"
preview_bucket_name = "spaf-media-preview"  # Optional: separate bucket for testing
```

**Test locally**:
```bash
npx wrangler pages dev dist --kv SPAF_KV --r2 SPAF_MEDIA
```

### Validation Before Production

After Phase 3c complete:
```bash
npm run typecheck && npm run lint && npm run test:run && npm run build
```

Manual end-to-end test:
1. Navigate to `/admin`, login with admin password
2. Upload a document (PDF), verify appears in R2
3. Access via `/api/media/documents/{key}.pdf`
4. Upload congress photos for a year
5. Navigate to `/congres`, select year, verify photos appear
6. Delete a file, verify removed from R2
7. Logout, verify can't access admin endpoints

## Success Criteria

### Phase 3a Complete When:
- ✅ All new backend endpoints implemented and tested
- ✅ Security tests passing (auth, upload, media)
- ✅ Manual test: Login works, file upload works, media serving works
- ✅ TypeScript, ESLint, tests, build all clean

### Phase 3b Complete When:
- ✅ Admin UI accessible at `/admin`
- ✅ Can login, see dashboard, upload/delete files
- ✅ Large fonts, clear labels, confirmation dialogs
- ✅ All validation passes, smoke tests pass

### Phase 3c Complete When:
- ✅ Congres gallery shows R2 photos
- ✅ Document downloads work from R2 with local fallback
- ✅ No regressions in existing pages
- ✅ French user guide written (1-page PDF)
- ✅ All validation passes

## Next Steps After Phase 3

**Immediate post-Phase 3**:
- User tests admin panel end-to-end in preview deployment
- User uploads real documents + congress photos
- User reviews French guide for clarity

**Before production (custom domain)**:
- Add CSP headers to `public/_headers` (Phase 2 deferred item)
- Tighten origin validation to `spafnat.com` only
- Switch Resend sender from `onboarding@resend.dev` to `contact@spafnat.com`
- Switch recipient to `plecordier@free.fr`

**Phase 4 (Polish, deferrable)**:
- JSON-LD structured data
- sitemap.xml
- Cloudflare Web Analytics
- Accessibility audit
- Session expiry warning toast (if requested)
- WebP support (if needed)

## Lessons Learned (Anticipated)

1. **Planning saves time**: Detailed upfront design prevents mid-implementation blockers
2. **Sub-phasing reduces risk**: Small commits with tests catch issues early
3. **Elderly user design is different**: Large text + simple workflows trump feature richness
4. **R2 + Workers is powerful**: Serverless file storage without managing servers
5. **Security requires layers**: Auth + validation + rate limiting + magic bytes = defense in depth

## References

- Plan file: `.claude/plans/dazzling-napping-raccoon.md`
- TODO.md: Updated with Phase 3 checklist
- Phase 2 session: `2026-02-15-phase2-security-testing.md`
- CLAUDE.md: Admin panel requirements (lines 50-62)
