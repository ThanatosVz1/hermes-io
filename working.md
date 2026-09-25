# Hermes.io — Working Plan & Progress Tracker

## 📋 Project Context

**Project:** Hermes.io — AI-Powered Learning Roadmap Generator  
**Stack:** Node.js (pure HTTP, no framework) + Vanilla JS frontend + Supabase PostgreSQL  
**Deployed:** Vercel (serverless)  
**Local Path:** `d:\WP mini Project\hermes-io-main\hermes-io-main\`  
**Root Issue:** Roadmap generation was failing on Vercel because:
1. Vercel filesystem is **read-only** — all `writeJSON()` calls to `data/` silently fail (sessions, roadmaps, users never persist between invocations)
2. The Python ML engine (`spawn()` to `hermes_engine.py`) **cannot run on Vercel** — no Python runtime
3. **Supabase code existed but was never wired** into auth/CRUD routes — everything still used local JSON files

---

## ✅ Completed Tasks

### 1. Root Cause Analysis
- [x] Analysed full `server.js` (3230 lines) — identified local-file-only DB pattern
- [x] Confirmed Python ML engine failure path on Vercel (falls back to offline/AI correctly)
- [x] Confirmed `data/` directory writes fail silently on Vercel (read-only FS)
- [x] Confirmed `supabaseRequest()` existed but was only called in `/api/supabase/sync` — NOT used for actual auth or roadmap CRUD

### 2. Vercel Routing Fix (`vercel.json`)
- [x] Fixed `vercel.json` routing:
  - API routes: all `/api/*` → `server.js`
  - Static files: `/css/*`, `/js/*`, `*.html/css/js` → `public/`
  - SPA fallback: everything else → `server.js`

### 3. Serverless Data Directory Fix (`server.js` PATCH 1)
- [x] Added `IS_SERVERLESS` detection via `process.env.VERCEL`
- [x] `DATA_DIR` now uses `/tmp/hermes_data` on Vercel, `data/` locally
- [x] `CONFIG_FILE` set to `null` on serverless (config comes from env vars only)
- [x] Wrapped `mkdirSync` in `try/catch` to avoid crashes

### 4. Null-safe File I/O (`server.js` PATCH 2)
- [x] `readJSON(null, ...)` now returns `defaultValue` safely
- [x] `writeJSON(null, ...)` now returns `false` safely (no crash)
- [x] `writeJSON` creates parent directories if missing

### 5. `getSupabaseConfig` Fix (`server.js` PATCH 3)
- [x] Handles `CONFIG_FILE === null` on serverless
- [x] Prefers `process.env.SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` over local config

### 6. Supabase-Backed Database Layer (`server.js` PATCH 4)
- [x] Injected `db*` async functions after `supabaseRequest()`:
  - `dbGetUserByEmail()`, `dbGetUserById()`, `dbCreateUser()`
  - `dbGetSession()`, `dbCreateSession()`, `dbDeleteSession()`
  - `dbGetRoadmaps()`, `dbGetRoadmapById()`, `dbSaveRoadmap()`, `dbUpdateRoadmap()`, `dbDeleteRoadmap()`
  - `dbClaimGuestRoadmaps()`
  - All functions: **Supabase-first → local file fallback**

### 7. Frontend Generation Fix (`app.js`)
- [x] `this.currentRoadmap = generated` cached before `navigateTo()` in wizard finish
- [x] `openRoadmapById()` checks `this.currentRoadmap.id === id` before fetching again
- [x] Personalize template flow also caches generated roadmap
- [x] Duplicate guest roadmap push prevented

### 8. New Supabase Schema (`supabase_schema.sql`)
- [x] Full production schema with 6 tables: `users`, `sessions`, `roadmaps`, `quiz_results`, `bookmarks`, `app_config`
- [x] Auto `updated_at` triggers, RLS policies, performance indexes
- [x] Pre-seeded demo users (Thanatos / Cronus) + `usr_guest` identity

---

## 🔄 Pending Tasks

### HIGH PRIORITY (required for Vercel to work)

- [x] **Wire `db*` into auth routes** — ALL DONE ✅
  - `POST /api/auth/signup` → `dbGetUserByEmail` + `dbCreateUser`
  - `POST /api/auth/login` → `dbGetUserByEmail`
  - `GET /api/auth/me` → via async `getAuthUser`
  - `POST /api/auth/logout` → `dbDeleteSession`
  - `POST /api/auth/claim-guest-roadmaps` → `dbClaimGuestRoadmaps`

- [x] **Wire `db*` into session middleware** — `getAuthUser()` is now `async`; uses `dbGetSession()` + `dbGetUserById()`
- [x] **Wire `db*` into `createSession()`** — now `async`; uses `dbCreateSession()`
- [x] **Wire `db*` into roadmap CRUD** — ALL DONE ✅
  - `GET /api/roadmaps` → `dbGetRoadmaps`
  - `POST /api/roadmaps` → `dbSaveRoadmap`
  - `GET /api/roadmaps/:id` → `dbGetRoadmapById`
  - `PUT /api/roadmaps/:id` → `dbUpdateRoadmap`
  - `DELETE /api/roadmaps/:id` → `dbDeleteRoadmap`
- [x] **Wire `db*` into `/api/generate`** — all 3 save sites (ML/AI/offline) now call `await dbSaveRoadmap(finalRoadmap)`
- [x] **`package.json` engines field** — Added `"engines": { "node": ">=18" }`

### 9. Secret Overseer Admin Terminal (`/admin` and `/api/admin/*`)
- [x] Secured by credentials: `cronus.xz@void.vz` / `Thanatos.Vz`
- [x] Standalone admin console at `public/admin.html` following original Hermes design system:
  - Plus Jakarta Sans, JetBrains Mono, Phosphor icons, dark & light theme toggle
  - Live platform telemetry KPIs: Learners, Roadmaps, Global Mastery %, Exam Scores
  - User search & multi-criteria filtering
  - User cards displaying procedurally generated star & planet avatars
  - Interactive transit to specific user: roadmaps list with milestone tree explorer, exam/quiz score history, and raw telemetry inspection
- [x] Backend Admin API endpoints:
  - `POST /api/admin/login`, `GET /api/admin/me`, `POST /api/admin/logout`
  - `GET /api/admin/users`, `GET /api/admin/users/:id`, `GET /api/admin/roadmaps/:id`
  - `POST /api/quiz/results`, `GET /api/quiz/results`

### 10. Procedural Celestial Star & Planet Avatars
- [x] Created `public/js/celestial-avatars.js` (usable in browser and Node.js)
- [x] 10 distinct cosmic planetary types (ringed gas giants, oceanic worlds, solar stars, icy worlds, etc.)
- [x] Generates crisp, deterministic SVG avatars from email/seed with starlight, craters, moons, and rings
- [x] Integrated into user badges, profile displays, and admin user directory

### 11. AI Roadmap Generation Dribbble GIF Loading Screen
- [x] Integrated `https://cdn.dribbble.com/userupload/42153336/file/original-47d79aeef2b6c2f3d94914d2ecfda559.gif`
- [x] Embedded in `wizard-step-section-5` of `index.html`
- [x] Added `showRoadmapGeneratingOverlay()` with rotating status texts and guaranteed minimum 2-second duration
- [x] Applied to both onboarding wizard generation and template personalization flows

---

## 🔄 Verified Endpoints (100% Pass)
- Login / session creation (`/api/auth/login`)
- Current user info (`/api/auth/me`)
- Roadmap generation (`/api/generate`)
- Roadmap CRUD (`/api/roadmaps/:id`)
- Secret Admin Authentication (`/api/admin/login` with `cronus.xz@void.vz` / `Thanatos.Vz`)
- Admin Telemetry Directory (`/api/admin/users`)
- User Transit Dossier (`/api/admin/users/:id`)
- Exam & Quiz Telemetry Recording (`/api/quiz/results`)


---

## 🔧 Key Technical Details

### Supabase Column Mapping (local JSON → Supabase)
| Local JSON field | Supabase column |
|---|---|
| `user.passwordHash` | `users.password_hash` |
| `user.createdAt` | `users.created_at` |
| `roadmap.userId` | `roadmaps.user_id` |
| `roadmap.targetRole` | `roadmaps.target_role` |
| `roadmap.skillLevel` | `roadmaps.skill_level` |
| `roadmap.totalHours` | `roadmaps.total_hours` |
| `session.userId` | `sessions.user_id` |
| `session.expiresAt` | `sessions.expires_at` |

### Required Vercel Environment Variables
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GEMINI_API_KEY=AIza... (optional)
AI_PROVIDER=gemini    (optional, defaults to "offline")
```

### Operation Fallback Chain
```
→ supabaseRequest() succeeds → use Supabase data
→ supabaseRequest() returns null → fallback to readJSON(localFile)
→ Write also mirrors to local file for dev consistency
```

---

## 📁 Files Modified So Far

| File | Status | Changes |
|---|---|---|
| `server.js` | ✅ Patched (PATCH 1–4) | Serverless dir, null-safe I/O, Supabase config, DB layer |
| `public/js/app.js` | ✅ Patched | Cache `currentRoadmap`, fix `openRoadmapById` |
| `vercel.json` | ✅ Fixed | API + static + SPA routing |
| `supabase_schema.sql` | ✅ Complete | 6 tables, triggers, RLS, seed data |
| `server.js` auth routes | ⏳ Pending | Wire `db*` functions |
| `server.js` roadmap routes | ⏳ Pending | Wire `db*` functions |
| `package.json` | ⏳ Pending | Add engines field |
| `README.md` | ⏳ Pending | Env vars docs |

---

## 🚀 Deployment Checklist (Vercel)

1. [ ] Complete all pending `server.js` route wirings  
2. [ ] Run `supabase_schema.sql` in Supabase SQL Editor  
3. [ ] Set env vars in Vercel Dashboard  
4. [ ] Push to GitHub → Vercel auto-deploys  
5. [ ] Verify `/api/health` returns `{status:"ok"}`  
6. [ ] Verify demo login: `thanatos@hermes.io` / `thanatos123`  
7. [ ] Verify roadmap generation persists across page reloads
