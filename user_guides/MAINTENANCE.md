# SPAF Website - Developer Maintenance Guide

**Last Updated:** February 17, 2026
**Current Version:** Phase 4 Complete 

---

## 🎯 Project Overview

The **Société des Poètes et Artistes de France (SPAF)** website is a bilingual (French primary) platform for a poetry and arts association founded in 1958. This site serves 700+ members across France and overseas territories.

### Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **UI:** shadcn-ui (Radix UI) + TailwindCSS
- **Deployment:** Cloudflare Pages (static site + edge functions)
- **Storage:** Cloudflare KV (key-value) + R2 (object storage)
- **Authentication:** JWT (jose library) with PBKDF2 password hashing
- **Testing:** Vitest + React Testing Library

### What Makes This Special

- **Edge-native backend:** All APIs run on Cloudflare Workers (serverless edge functions)
- **No traditional database:** Uses KV for sessions/counters, R2 for files (to stay on Cloudflare free tier)
- **User-friendly admin panel:** Large touch targets, French UI, simple workflows
- **Progressive enhancement:** R2 files with local fallbacks

---

## 🚀 Quick Start

### Prerequisites

```bash
node >= 22.0.0 (do not use v.25, it is not stable with Cloudflare)
npm >= 10.0.0
```

### First-Time Setup

```bash
# 1. Install dependencies
npm install

# 2. Install git hooks (runs preflight checks before commits)
bash scripts/setup-hooks.sh

# 3. Set up environment variables
cp .dev.vars.example .dev.vars

# 4. Generate JWT secret
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .dev.vars

# 5. Generate admin password hash (password: admin123)
npx tsx scripts/generate-password-hash.ts admin123
# Copy the output and add to .dev.vars manually:
# ADMIN_PASSWORD_HASH=<paste-hash-here>

# 6. Add your Resend API key from https://resend.com/api-keys
# Edit .dev.vars and set RESEND_API_KEY=re_...

# 7. Run basic dev server (frontend only, no backend features)
npm run dev
# Visit http://localhost:8080
```

---

## 🔧 Development Workflows

### Option 1: Frontend Development Only

**Use when:** Working on UI, styling, or pages that don't need backend APIs

```bash
npm run dev
```

- Runs on `http://localhost:8080`
- No KV/R2 storage, no backend functions
- Fast hot reload for UI changes

---

### Option 2: Full Stack Development (KV + R2 + Functions)

**Use when:** Testing admin panel, file uploads, contact form, visitor counter

```bash
# Step 1: Build the frontend
npm run build

# Step 2: Run Wrangler dev server with KV and R2 bindings
npx wrangler pages dev dist --kv SPAF_KV --r2 SPAF_MEDIA
```

**What is Wrangler?**
- Cloudflare's CLI tool for developing/deploying Workers and Pages
- Simulates the production edge runtime locally
- Provides local KV and R2 storage for testing

**Important Notes:**
- You must rebuild (`npm run build`) after every code change
- KV and R2 data is stored locally in `.wrangler/` (gitignored)
- Local bindings are ephemeral (cleared when you restart)
- Test credentials: **username:** `admin` | **password:** `admin123`

**Faster iteration:** Use `npm run build:dev` for faster dev builds (skips minification)

---

### Validation Loop (Run Before Every Commit)

```bash
npm run preflight    # Cloudflare compatibility checks
npm run typecheck    # TypeScript validation
npm run typecheck:strict  # Stricter app-only TypeScript checks
npm run lint         # ESLint (expect 8 shadcn warnings - safe to ignore)
npm run test:run     # All tests (currently 134 passing)
npm run build        # Production build
```

**Pre-commit Hook:** If you ran `bash scripts/setup-hooks.sh`, `preflight` runs automatically before commits.

**Bypass hook (not recommended):**
```bash
git commit --no-verify
```

---

## ☁️ Cloudflare Concepts & Setup

### What is Cloudflare Pages?

A JAMstack platform that serves static sites globally via CDN + serverless edge functions.

**Key Features:**
- Automatic deployments from GitHub
- Preview deployments for every branch
- Global CDN (sub-50ms latency worldwide)
- Free tier: Unlimited bandwidth, 20k requests/day, 100 custom domains

**How Our Site Works:**
1. Static frontend (React SPA) served from CDN
2. API routes in `functions/api/` run as edge functions (Cloudflare Workers)
3. All requests hit the edge (no origin server)

---

### What is KV (Key-Value Storage)?

A global, eventually-consistent key-value store optimized for high reads, infrequent writes.

**What We Use It For:**
- **Session management:** JWT token revocation (`session:{jti}`)
- **Rate limiting:** Login attempts, contact form submissions (`rate:login:{ip}`, `rate:contact:{ip}`)
- **Visitor counter:** Daily unique visitor count (`visitor:count`)
- **Visit deduplication:** Daily IP+UserAgent hashes (`rate:visit:{hash}`)
- **Concours collections:** Ordered lists of competition documents (`concours:reglements`, `concours:palmares-poetique`, `concours:palmares-artistique`)

**Characteristics:**
- **Eventually consistent** (rare double-counts possible in visitor counter)
- **TTL support** (auto-expiring keys for rate limits)
- **Low latency** (<1ms at edge)

**KV Namespace:**
- Production: `SPAF_KV` (configured in Cloudflare Dashboard)
- Local dev: `SPAF_KV` (simulated by Wrangler)

---

### What is R2 (Object Storage)?

S3-compatible object storage with zero egress fees.

**What We Use It For:**
- **Documents:** PDFs (bulletin d'adhésion, règlements, palmarès, revue extracts)
- **Photos:** Congress photos organized by year (2010-2026)
- **Concours files:** Competition PDFs in 3 categories

**R2 Key Structure:**
```
documents/{filename}                    # e.g., documents/bulletin_adhesion.pdf
congres/{year}/{filename}               # e.g., congres/2024/photo1.jpg
concours/{category}/{filename}          # e.g., concours/reglements/normandie_2026.pdf
```

**Metadata Storage:**
- Every file has `customMetadata`: `originalFilename`, `uploadedAt`
- **Important:** R2 `list()` does NOT include customMetadata
- To get metadata, call `head()` for each file (see `functions/api/admin/files.ts`)

**R2 Buckets:**
- Production: `spaf-media`
- Preview: `spaf-media-preview`
- Local dev: `SPAF_MEDIA` (simulated by Wrangler in `.wrangler/state/v3/r2/`)

**Privacy:**
- Buckets are private (not publicly accessible)
- Files served via `/api/media/{path}` endpoint (proxy pattern)
- 1-day browser cache for performance

---

### Cloudflare Dashboard Configuration

**Location:** [Cloudflare Dashboard](https://dash.cloudflare.com) → Workers & Pages → spafnat

#### Environment Variables (Production)

Set under **Settings > Environment Variables > Production**:

| Variable               | Purpose                        | How to Generate                                      |
|------------------------|--------------------------------|-----------------------------------------------------|
| `JWT_SECRET`           | JWT signing key                | `openssl rand -base64 32`                          |
| `ADMIN_PASSWORD_HASH`  | Admin password (PBKDF2)        | `npx tsx scripts/generate-password-hash.ts <pass>` |
| `RESEND_API_KEY`       | Email sending (contact form)   | Get from https://resend.com/api-keys               |
| `CONTACT_RECIPIENT`    | Contact form destination email | `plecordier@free.fr` (production)                  |
| `ALLOWED_ORIGINS`      | Allowed origins for contact API/CORS checks | Comma-separated list (e.g. `https://spafnat.com,https://www.spafnat.com`) |

**Important:** Preview environment has separate variables (allows testing with different passwords/emails)

#### Bindings (Production & Preview)

Set under **Settings > Functions > KV namespace bindings**:

| Binding Name  | Type | Production Namespace   | Preview Namespace       |
|---------------|------|------------------------|-------------------------|
| `SPAF_KV`     | KV   | `SPAF_KV` (create new) | `SPAF_KV` (same or new) |

Set under **Settings > Functions > R2 bucket bindings**:

| Binding Name  | Type | Production Bucket | Preview Bucket         |
|---------------|------|-------------------|------------------------|
| `SPAF_MEDIA`  | R2   | `spaf-media`      | `spaf-media-preview`   |

**Critical Note:** `wrangler.toml` only affects local dev. Production/Preview bindings MUST be set in Dashboard.

---

## 🔐 Environment Variables Reference

### Local Development (`.dev.vars`)

```bash
# Contact Form & Visitor Counter
RESEND_API_KEY=re_xxxxx
CONTACT_RECIPIENT=joshua@cohendumani.com  # Test email
ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080

# Admin Panel
JWT_SECRET=base64-encoded-secret-here
ADMIN_PASSWORD_HASH=salt:hash
```

### Production (Cloudflare Dashboard)

```bash
# Contact Form & Visitor Counter
RESEND_API_KEY=re_xxxxx
CONTACT_RECIPIENT=plecordier@free.fr  # Production email
ALLOWED_ORIGINS=https://spafnat.com,https://www.spafnat.com

# Admin Panel
JWT_SECRET=base64-encoded-secret-here
ADMIN_PASSWORD_HASH=salt:hash
```

---

## 📋 Common Tasks

### Reset Admin Password

```bash
# 1. Generate new hash
npx tsx scripts/generate-password-hash.ts newpassword123

# 2. Update environment
# Local: Add to .dev.vars
echo "ADMIN_PASSWORD_HASH=<new-hash>" >> .dev.vars

# Production: Update in Cloudflare Dashboard
# Settings > Environment Variables > Production > Edit ADMIN_PASSWORD_HASH
```

---

### Upload Documents/Photos via Admin Panel

1. **Login:** Visit `/admin` with credentials (admin/admin123 in dev)
2. **Documents:**
   - Navigate to "Documents" tab
   - Click "Téléverser" on the document card
   - Select PDF (max 5MB)
   - File replaces existing document at that key
3. **Photos:**
   - Navigate to "Photos" tab
   - Select year from dropdown
   - Click "Téléverser des photos"
   - Select multiple images (JPEG/PNG/WebP, max 5MB each)
4. **Concours:**
   - Navigate to "Concours" tab
   - Choose category (Règlements, Palmarès Poétique, Palmarès Artistique)
   - Upload PDF
   - Reorder with up/down arrows
   - Delete with confirmation dialog

**File Validation:**
- MIME type check (client-side)
- Magic bytes verification (server-side, prevents file type spoofing)
- Max size: 5MB per file

---

### Deploy to Production

```bash
# 1. Validate everything passes
npm run preflight && npm run typecheck && npm run lint && npm run test:run && npm run build

# 2. Commit changes
git add .
git commit -m "feat: your changes"

# 3. Push to main (triggers auto-deployment)
git push origin main

# 4. Monitor deployment
# Visit: https://dash.cloudflare.com → spafnat → Deployments
```

**Deployment Flow:**
- GitHub push triggers Cloudflare build
- Build runs `npm run build`
- Static files deployed to global CDN
- Edge functions deployed to all regions
- Rollback available in Dashboard if needed

**Preview Deployments:**
- Every non-main branch gets a preview URL
- Example: `feature/xyz` → `abc123.spafnat.pages.dev`
- Uses Preview environment variables and bindings

---

### Debug KV Issues

```bash
# List all keys in local KV
npx wrangler kv:key list --binding SPAF_KV --local

# Get specific key value
npx wrangler kv:key get "concours:reglements" --binding SPAF_KV --local

# Delete key
npx wrangler kv:key delete "session:xyz" --binding SPAF_KV --local
```

**Production KV:**
```bash
# Remove --local flag and use namespace ID from Dashboard
npx wrangler kv:key list --namespace-id <id>
```

---

### Debug R2 Issues

```bash
# List files in local R2
npx wrangler r2 object list SPAF_MEDIA --local

# Download file
npx wrangler r2 object get SPAF_MEDIA/documents/bulletin_adhesion.pdf --local --file ./debug.pdf

# Delete file
npx wrangler r2 object delete SPAF_MEDIA/documents/old_file.pdf --local
```

**Production R2:**
```bash
# Remove --local flag
npx wrangler r2 object list spaf-media
```

---

### Migrate Documents from Local to R2

**Scenario:** You have PDFs in `public/documents/` that need to move to R2.

**Option 1: Via Admin Panel (Recommended)**
1. Login to `/admin`
2. Upload each document via UI
3. Verify download works on public pages
4. Delete from `public/documents/` after confirming

**Option 2: Via Wrangler CLI**
```bash
# Upload single file
npx wrangler r2 object put spaf-media/documents/bulletin_adhesion.pdf --file public/documents/bulletin_adhesion.pdf

# Add metadata manually (not automated yet)
# Use admin panel to re-upload if you need metadata
```

**Document Fallback System:**
- Frontend tries R2 first (HEAD request to `/api/media/{key}`)
- If 404, falls back to local file in `public/documents/`
- Allows gradual migration without breaking links

---

## 🏗️ Project Architecture

### Phased Development Timeline

#### Phase 1: Foundation (Complete ✅)
- Centralized configs (`src/config/`)
- All pages created (Index, Historique, Congres, Revue, Delegations, Concours)
- Test infrastructure (Vitest + RTL)
- ESLint + TypeScript setup

#### Phase 2: Public Features (Complete ✅)
- **Visitor counter:** Daily unique visitors with IP+UA deduplication
- **Contact form:** Honeypot, rate limiting, email via Resend
- **Security headers:** CSP, CORS, rate limiting
- **Testing baseline:** Smoke + security coverage established and expanded over time

#### Phase 3: Admin Panel + File Management (Complete ✅)
- **3a - Backend:** Auth, JWT sessions, R2 upload/download, KV session tracking
- **3b - Admin UI:** Login, dashboard, document manager, photo manager
- **3c - Frontend Integration:** R2-aware document URLs, photo gallery, cache-busting
- **3d - Security hardening:** Path validation, document key allowlists, stricter JWT verification

#### Phase 4: Dynamic Content (Complete ✅)
- **4a - Concours Backend:** KV-based collections for 3 competition categories
- **4b - Admin Concours UI:** Upload, reorder, delete PDFs
- **4c - Public Concours UI:** Dynamic display with collapsible sections
- **4d - Revue Rework:** PDF cover rendering (pdfjs-dist), dynamic titles
- **4e - Delegations Content:** Payment instructions, treasurer contact

**Current Status:** Production-ready (134 tests passing)

---

### Directory Structure

```
spafnat/
├── functions/               # Cloudflare Pages Functions (serverless)
│   ├── api/
│   │   ├── admin/          # Protected admin endpoints (JWT auth)
│   │   │   ├── _middleware.ts     # Auth guard for /api/admin/*
│   │   │   ├── concours/
│   │   │   │   ├── upload.ts      # Upload concours PDF
│   │   │   │   ├── delete.ts      # Delete concours PDF
│   │   │   │   └── reorder.ts     # Reorder concours items
│   │   │   ├── files.ts           # List documents/photos
│   │   │   ├── upload.ts          # Upload documents/photos
│   │   │   ├── delete-document.ts
│   │   │   └── delete-photo.ts
│   │   ├── auth/           # Authentication endpoints
│   │   │   ├── login.ts    # POST /api/auth/login
│   │   │   ├── logout.ts   # POST /api/auth/logout
│   │   │   └── verify.ts   # POST /api/auth/verify
│   │   ├── contact.ts      # POST /api/contact (public)
│   │   ├── concours.ts     # GET /api/concours (public)
│   │   ├── gallery.ts      # GET /api/gallery?year=2024 (public)
│   │   ├── media/[[path]].ts  # GET /api/media/{path} (R2 proxy)
│   │   └── visitor-count.ts   # GET /api/visitor-count (public)
│   └── lib/                # Shared backend utilities
│       ├── file-validation.ts  # MIME + magic bytes checks
│       ├── helpers.ts          # jsonResponse, getClientIP, escapeHtml
│       ├── password.ts         # PBKDF2 hashing/verification
│       └── rate-limit.ts       # KV-based rate limiting
├── src/
│   ├── components/
│   │   ├── admin/          # Admin panel components
│   │   │   ├── AdminLayout.tsx    # Admin sidebar + navigation
│   │   │   └── RequireAuth.tsx    # Route guard
│   │   ├── ui/             # shadcn-ui primitives (DO NOT EDIT)
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   ├── Layout.tsx      # Public page wrapper
│   │   └── PdfCover.tsx    # PDF first-page renderer (pdfjs-dist)
│   ├── config/             # Centralized configuration
│   │   ├── concours.ts     # Competition categories
│   │   ├── contact.ts      # Contact info constants
│   │   └── documents.ts    # Downloadable PDFs metadata
│   ├── contexts/
│   │   └── AuthContext.tsx # JWT token management
│   ├── hooks/
│   │   ├── useConcours.ts      # Fetch concours collections
│   │   ├── useDocumentUrl.ts   # R2-aware document URLs
│   │   └── use-toast.ts        # Toast notifications
│   ├── lib/
│   │   ├── admin-api.ts    # Admin API client functions
│   │   └── utils.ts        # cn() utility
│   ├── pages/
│   │   ├── admin/          # Admin panel pages
│   │   │   ├── AdminConcours.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AdminDocuments.tsx
│   │   │   ├── AdminLogin.tsx
│   │   │   └── AdminPhotos.tsx
│   │   ├── Concours.tsx    # Competitions page
│   │   ├── Congres.tsx     # Congress page (photo gallery)
│   │   ├── Delegations.tsx # Regional delegates
│   │   ├── Historique.tsx  # History page
│   │   ├── Index.tsx       # Homepage
│   │   ├── NotFound.tsx    # 404 page
│   │   └── Revue.tsx       # Magazine page
│   ├── App.tsx             # React app root
│   ├── AppRoutes.tsx       # Route definitions
│   └── index.css           # Tailwind + CSS variables
├── public/
│   ├── _headers            # Cloudflare security headers (CSP, CORS)
│   ├── _redirects          # SPA routing fallback
│   └── documents/          # Local PDF fallback (legacy)
├── scripts/
│   ├── generate-password-hash.ts  # PBKDF2 hash generator
│   ├── preflight-check.ts         # Cloudflare compatibility validator
│   └── setup-hooks.sh             # Install git pre-commit hook
├── tests/
│   ├── setup.ts            # Vitest configuration
│   └── [feature].test.tsx  # Test files
├── .dev.vars               # Local environment variables (gitignored)
├── .dev.vars.example       # Environment template
├── wrangler.toml           # Cloudflare Pages config (local dev only)
└── package.json            # Dependencies + scripts
```

---

### Key Concepts

#### Document Management System

**Config-Driven Metadata:**
- All documents defined in `src/config/documents.ts`
- Single source of truth for titles, descriptions, keys
- Keys must match R2 paths exactly (e.g., `bulletin_adhesion.pdf`)

**Year-Agnostic Naming:**
- ✅ `bulletin_adhesion.pdf` (generic, updated periodically)
- ❌ `bulletin_adhesion_2026.pdf` (gets outdated)
- Reason: Documents rotate regularly, hardcoded dates become stale

**R2 + Local Fallback:**
1. Frontend calls `useDocumentUrl('bulletinAdhesion')`
2. Hook sends HEAD request to `/api/media/documents/bulletin_adhesion.pdf`
3. If 200: Returns R2 URL
4. If 404: Returns local fallback `/documents/bulletin_adhesion.pdf`

**Original Filename Display:**
- R2 stores `originalFilename` in `customMetadata`
- Admin can see what they uploaded (e.g., "bulletin_fevrier_2027.pdf")
- **Important:** `list()` doesn't include metadata, must call `head()` per file

---

#### Concours (Competitions) System

**Variable-Length Collections:**
- Unlike fixed documents, concours has dynamic ordered lists
- KV stores: `concours:{category}` → JSON array
- Array order = display order on public page

**Categories:**
- `reglements` (Règlements) - Competition rules
- `palmares-poetique` (Palmarès Poétique) - Poetry contest results
- `palmares-artistique` (Palmarès Artistique) - Artistic contest results

**Data Structure:**
```typescript
type ConcoursItem = {
  r2Key: string;           // "concours/reglements/normandie_2026.pdf"
  title: string;           // "Normandie 2026" (auto-derived from filename)
  originalFilename: string; // "Concours Normandie 2026.pdf"
  uploadedAt: string;      // ISO timestamp
  size: number;            // Bytes
};
```

**Title Auto-Derivation:**
- Filename: `"Concours Normandie 2026.pdf"` → Title: `"Concours Normandie 2026"`
- Removes extension, uses rest as title
- No manual title input (simpler for elderly user)

**Duplicate Detection:**
- Client-side check before upload (case-insensitive filename match)
- If duplicate found, shows actionable toast: "Rename file or delete old one"
- Not an error-level block, just user guidance

---

#### Photo Gallery System

**Year-Based Organization:**
- R2 keys: `congres/{year}/{filename}` (e.g., `congres/2024/photo1.jpg`)
- Years: 2010-current year (auto-expands each January)
- Admin selects year from dropdown before upload

**Gallery Endpoints:**
- `GET /api/gallery/years` → Returns `{ years: [2024, 2023, ...] }`
- `GET /api/gallery?year=2024` → Returns photos for that year

**Frontend Integration:**
- `Congres.tsx` fetches photos via `useConcours` hook
- Grid display with lightbox (Dialog)
- Stable layout: 70vh container, min-width buttons (prevents jumping)

---

#### Authentication & Sessions

**JWT-Based Auth:**
- Library: `jose` (edge-compatible, uses Web Crypto API)
- Algorithm: HS256 (symmetric signing)
- Expiry: 24 hours
- Payload: `{ sub: 'admin', jti: '<uuid>', iat, exp }`

**Session Tracking:**
- JTI (JWT ID) stored in KV: `session:{jti}` with 24h TTL
- Enables logout (deletes KV entry = revokes token)
- Stateless JWT alone can't be revoked

**Password Storage:**
- Algorithm: PBKDF2-SHA256
- Iterations: 100,000 (Cloudflare Workers max limit)
- Format: `salt:hash` (both base64-encoded)
- **Why not bcrypt?** Workers runtime doesn't support bcrypt, PBKDF2 is Web Crypto API standard

**Login Flow:**
1. User submits username + password
2. Server verifies password with PBKDF2
3. Server generates JWT with unique JTI
4. Server stores `session:{jti}` in KV
5. Client stores JWT in localStorage
6. Client includes JWT in Authorization header for admin requests

**Logout Flow:**
1. Client sends JWT to `/api/auth/logout`
2. Server deletes `session:{jti}` from KV
3. Client clears localStorage
4. Future requests with that JWT fail verification

---

#### Rate Limiting

**Implementation:**
- KV-based with TTL (keys auto-expire)
- IP-based (extracted from `CF-Connecting-IP` header)

**Limits:**
- **Login:** 5 attempts per 15 minutes per IP (`rate:login:{ip}`)
- **Contact form:** 1 submission per 5 minutes per IP (`rate:contact:{ip}`)
- **Visitor counter:** 1 count per 24 hours per IP+UserAgent hash (`rate:visit:{hash}`)

**Localhost Bypass:**
- Login rate limiting skipped for `127.0.0.1` (dev convenience)
- Production rate limits still enforced

---

## 🧪 Testing

### Test Framework

- **Runner:** Vitest
- **UI Testing:** React Testing Library
- **Mocking:** vi.mock() for KV/R2/fetch

### Test Categories

```bash
src/test/                     # UI smoke and routing tests
src/tests/                    # Feature + API integration tests
tests/security/               # Security-focused endpoint tests
```

**Total:** 12 test files, 134 tests passing

### Run Tests

```bash
npm run test          # Watch mode
npm run test:run      # Run once (for CI)
npm run test:ui       # Vitest UI (browser-based)
```

### Writing Tests

**KV Mock Example:**
```typescript
const mockKV = {
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

const env = { SPAF_KV: mockKV };
```

**R2 Mock Example:**
```typescript
const mockR2 = {
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
  head: vi.fn(),
};

const env = { SPAF_MEDIA: mockR2 };
```

---

## ⚠️ Quirks & Gotchas

### Cloudflare Workers Constraints

#### PBKDF2 Iteration Limit
- **Issue:** Workers runtime limits PBKDF2 to 100k iterations
- **Impact:** OWASP recommends 600k, but we can't use that
- **Workaround:** None, 100k is maximum on this platform
- **File:** `functions/lib/password.ts`

#### R2 Bindings Must Be Configured in Dashboard
- **Issue:** `wrangler.toml` only affects local dev, not production
- **Impact:** Uploads work locally but fail in production if bindings missing
- **Solution:** Always configure in Cloudflare Dashboard under Settings > Functions > R2 bucket bindings
- **Symptom:** `env.SPAF_MEDIA is undefined` in production logs

#### R2 list() Doesn't Include customMetadata
- **Issue:** Metadata like `originalFilename` not returned by `list()`
- **Impact:** Must call `head()` for each file to fetch metadata
- **File:** `functions/api/admin/files.ts` (see loop calling `head()` per file)
- **Performance:** Acceptable for small file counts (<100 files)

#### No Node.js APIs
- **Issue:** Workers runtime is V8 isolate, not Node.js
- **Impact:** Can't use `fs`, `path`, `crypto` (Node.js), `process.argv`, etc.
- **Solution:** Use Web APIs (`crypto.subtle`, `fetch`, `FormData`)
- **Validator:** `scripts/preflight-check.ts` catches these before deployment

---

### Frontend Quirks

#### Document Key Structure Must Match Exactly
- **Issue:** Config uses camelCase keys (`bulletinAdhesion`) but R2 expects filenames
- **Impact:** Admin panel was uploading to wrong R2 paths
- **Solution:** `AdminDocuments.tsx` extracts filename from config path and passes to API
- **Commit:** `fix: correct document key handling for R2 uploads`

#### Cache-Busting for Document Availability
- **Issue:** Browser caches HEAD responses, buttons stay enabled after deletion
- **Solutions Applied:**
  1. Server sends `no-cache, no-store, must-revalidate` headers
  2. Client adds timestamp to URL (`?_=${Date.now()}`)
  3. Client uses `cache: 'no-store'` in fetch options
  4. Window focus listener re-checks availability
- **File:** `src/hooks/useDocumentUrl.ts`

#### PDF Mock in Tests
- **Issue:** pdfjs-dist is 300KB and causes test failures
- **Solution:** Mock it in `tests/setup.ts`:
```typescript
vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn(),
  GlobalWorkerOptions: { workerSrc: '' },
}));
```

---

### Backend Quirks

#### Origin Validation
- **Issue:** Need to allow localhost + *.pages.dev for dev/preview
- **Impact:** Can't tighten to `spafnat.com` only until custom domain active
- **File:** `functions/lib/helpers.ts` → `isValidOrigin()`
- **TODO:** Tighten after domain configured

#### Email Sender Domain
- **Current:** `onboarding@resend.dev` (Resend default)
- **Production Ready:** Switch to `contact@spafnat.com` (domain verified)
- **File:** `functions/api/contact.ts`
- **Environment Variable:** None (hardcoded in code, consider moving to env)

#### Visitor Counter Seeding
- **Issue:** KV is empty on first deploy, counter starts at 0
- **Solution:** Seeds to 184,161 if KV empty (Feb 14, 2026 value from old site)
- **File:** `functions/api/visitor-count.ts`

---

## 🚧 Future Work Areas

### Phase 5: Polish & Missing Features

#### Revue Historical Extracts
- **Goal:** List previous revue issues on Revue page
- **Approach:** New endpoint `GET /api/revue` listing all files in `documents/revue/`
- **UI:** Collapsible section "Numéros précédents" below current issue

#### Délégation Artistique
- **Contact:** Bruno TOFFANO (not yet added)
- **Location:** Artistic delegation section (separate from regional)

#### Production Domain Migration
- **Tasks:**
  - [ ] Configure custom domain `spafnat.com` in Cloudflare Dashboard
  - [x] Add env-based origin allowlist (`ALLOWED_ORIGINS`) in contact/API validation
  - [ ] Set `ALLOWED_ORIGINS` to production domain(s) only after cutover (`https://spafnat.com`, `https://www.spafnat.com`)
  - [ ] Switch email sender to `contact@spafnat.com`
  - [ ] Switch contact recipient to `plecordier@free.fr` - both cloudflare env var and code var (visible on website)
  - [ ] Test all features on production domain
  - [ ] Add CSP to `public/_headers` once third-party needs are known

#### R2 Monitoring & Alerts
- **Setup billing alerts:** $1, $5, $10 thresholds
- **Monitor usage:** Dashboard → Analytics → R2
- **Expected:** ~50MB storage, ~100 writes/month, ~5k reads/month (well within free tier)

#### Performance Optimizations
- **Image optimization:** Compress congress photos before upload (admin-side tool?)
- **PDF optimization:** Compress large PDFs (admin warning if >5MB?)
- **Bundle size:** Currently ~1MB due to pdfjs-dist, consider lazy loading

#### Accessibility Improvements
- **Keyboard navigation:** Test admin panel with tab-only navigation
- **Screen reader:** ARIA labels on admin buttons
- **Color contrast:** Verify WCAG AA compliance

---

## 🆘 Troubleshooting

### "env.SPAF_KV is undefined" in Production

**Cause:** KV namespace not bound in Cloudflare Dashboard
**Fix:** Dashboard → spafnat → Settings → Functions → KV namespace bindings → Add `SPAF_KV`

---

### "env.SPAF_MEDIA is undefined" in Production

**Cause:** R2 bucket not bound in Cloudflare Dashboard
**Fix:** Dashboard → spafnat → Settings → Functions → R2 bucket bindings → Add `SPAF_MEDIA` → `spaf-media`

---

### Admin Login Returns "Invalid credentials" (but password is correct)

**Cause 1:** `ADMIN_PASSWORD_HASH` not set in environment
**Fix:** Generate hash with `npx tsx scripts/generate-password-hash.ts <password>`, add to `.dev.vars` or Dashboard

**Cause 2:** JWT_SECRET not set
**Fix:** Generate with `echo "JWT_SECRET=$(openssl rand -base64 32)" >> .dev.vars`, add to Dashboard

**Cause 3:** Rate limited (5 attempts per 15 min)
**Fix:** Wait 15 minutes or clear KV: `npx wrangler kv:key delete "rate:login:YOUR_IP" --binding SPAF_KV --local`

---

### File Upload Returns 200 but File Not in R2

**Cause:** R2 binding not configured (silently fails in some Workers versions)
**Fix:** Check Dashboard → Settings → Functions → R2 bucket bindings
**Debug:** Check Cloudflare logs for R2 errors (Dashboard → Logs → Real-time Logs)

---

### Document Button Shows "Non disponible" After Uploading

**Cause 1:** Cache not cleared
**Fix:** Hook should auto-refresh on window focus, try navigating away and back

**Cause 2:** File uploaded to wrong R2 key (key mismatch)
**Fix:** Check R2 bucket: `npx wrangler r2 object list spaf-media`
**Expected:** `documents/{filename}` exactly matching `documents.ts` config

**Cause 3:** HEAD request failing (media endpoint issue)
**Fix:** Test manually: `curl -I https://your-site.pages.dev/api/media/documents/{key}`

---

### Tests Fail with "Cannot find module 'pdfjs-dist'"

**Cause:** Mock not set up correctly
**Fix:** Ensure `tests/setup.ts` includes:
```typescript
vi.mock('pdfjs-dist', () => ({ ... }));
```

---

### Build Fails with "process is not defined"

**Cause:** Node.js API used in frontend code
**Fix:** Run `npm run preflight` to identify offending imports, replace with Web APIs

---

### Wrangler Dev Crashes with "Worker exceeded CPU time limit"

**Cause:** Infinite loop or heavy computation in edge function
**Fix:** Check recent code changes in `functions/`, add logging, reduce iterations

---

## 📞 Support Contacts

- **Project Lead:** Joshua Cohen-Dumani (jcohendumani7@gmail.com)
- **Site Owner:** Flore Lecordier (plecordier@free.fr)
- **Cloudflare Docs:** https://developers.cloudflare.com/pages/
- **Wrangler Docs:** https://developers.cloudflare.com/workers/wrangler/

---

## 📚 Additional Resources

- **CLAUDE.md:** Project-specific AI assistant instructions
- **MEMORY.md:** AI assistant memory (bug history, decisions)
- **TODO.md:** Task tracking and phase breakdown
- **Session Notes:** `project-notes/sessions/` (detailed implementation logs)

---

**Happy Developing! 🚀**
