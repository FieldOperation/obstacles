# Production Readiness Report — Obstacles CMS

**Date:** February 10, 2026  
**Scope:** Full system analysis (Supabase-only frontend)

---

## 1. Executive Summary

| Area              | Status   | Notes |
|-------------------|----------|--------|
| **Build**         | ✅ Ready | `npm run build` passes (TypeScript + Vite) |
| **Architecture**  | ✅ OK    | Supabase-only; no Node backend required for runtime |
| **Auth & session**| ⚠️ Conditional | Works; RLS on `users` can cause profile timeout (fallback to ADMIN exists) |
| **Data & RLS**    | ⚠️ Action needed | Ensure `FIX_RLS_COMPLETE.sql` applied; verify policies per table |
| **Storage**       | ⏳ Checklist | Buckets `cases` + `logos` and policies must be set in Supabase |
| **Env & secrets** | ⚠️ Action needed | Production env vars; remove/secure `JWT Secret.txt` |
| **Deploy**        | ✅ Ready | Static build (`frontend/dist`) deployable to any static host |

**Verdict:** **Not fully production-ready without completing the items below.** Main gaps: RLS stability for user profile load, production env configuration, and optional cleanup (backend removal, logging, chunk size).

---

## 2. Architecture Overview

- **Frontend:** React 18 + Vite + TypeScript, React Query, React Router, Supabase JS client.
- **Backend:** None at runtime. All API calls go to **Supabase** (Auth, Postgres, Realtime, Storage).
- **Legacy:** `frontend/src/config/api.ts` and `frontend/src/services/api.ts` remain but are only used for the old backend; **Layout and Dashboard now use Supabase services** (settingsService, casesService). Backend folder still present; safe to remove for a Supabase-only deploy.

---

## 3. Fixes Applied in This Analysis

- **Layout:** Switched from `api.get('/settings')` to `settingsService.get()` (Supabase).
- **Dashboard:** Export uses `casesService.getAll()` instead of `api.get('/cases')`; added Road filter; fixed optional chaining for `stats`.
- **Settings service:** Aligned with DB columns `contractor_logo` and `owner_logo` (was `contractor_logo_url` / `owner_logo_url`).
- **Roads page:** `roadsService.create/update` now receive `zoneId` (not `zone_id`) to match the service interface.
- **CreateCase:** Form submits `latitude`/`longitude` as numbers; added `photoLatitude`/`photoLongitude` to `CaseFormData`.
- **SocketContext:** Removed unused `payload` parameter to satisfy TS.
- **Settings page:** Removed unused `supabase` import.
- **supabaseService:** Removed unused variables; fixed dashboard `road.zones` typing; corrected settings DB column names and return shape.

---

## 4. Pre-Production Checklist

### 4.1 Environment (required for production)

- [ ] **Production env file** (e.g. `frontend/.env.production` or host env):
  - `VITE_SUPABASE_URL` = your Supabase project URL  
  - `VITE_SUPABASE_ANON_KEY` = your Supabase anon/public key  
- [ ] No backend URL needed; `VITE_API_BASE_URL` is unused for the current Supabase-only flow.
- [ ] **Security:** Do not commit `.env.local` or real keys. Remove or secure `JWT Secret.txt` (legacy backend); it is not used by the frontend.

### 4.2 Supabase project

- [ ] **Migration:** `SUPABASE_MIGRATION.sql` has been run (tables, indexes, RLS enabled).
- [ ] **Users table RLS:** Run `FIX_RLS_COMPLETE.sql` so that:
  - Only one simple SELECT policy remains: `id = auth.uid()` for own profile.
  - No policy on `users` does a subquery on `users` (avoids recursion/timeouts).
- [ ] **Other tables:** Confirm RLS policies for `cases`, `zones`, `roads`, `developers`, `photos`, `notifications`, `system_settings` match your security model (see migration script).
- [ ] **Storage:** Create buckets `cases` and `logos` with size/MIME limits as in `QUICK_START_CHECKLIST.md`; add the suggested storage policies (e.g. authenticated upload, public read for cases; restrict logos as desired).

### 4.3 Build and deploy

- [ ] From repo root: `cd frontend && npm ci && npm run build`.
- [ ] Deploy contents of `frontend/dist` to your static host (e.g. HostGator, Netlify, Vercel).
- [ ] Set production env vars in the host (if not baked into build) so that `VITE_SUPABASE_*` are available at build time if you inject them then.

---

## 5. Known Issues and Recommendations

### 5.1 User profile load (RLS)

- **Issue:** If RLS on `users` is recursive or too strict, the profile query can time out; the app falls back to a minimal user with ADMIN role so login and navigation still work.
- **Action:** Apply `FIX_RLS_COMPLETE.sql` and verify in Supabase SQL Editor that:
  - Only one SELECT policy exists on `users`: `USING (id = auth.uid())`.
  - No other policies on `users` reference `users` again.

### 5.2 Hardcoded fallback URL

- **File:** `frontend/src/lib/supabase.ts`  
- **Issue:** `supabaseUrl` falls back to `'https://uarbweqbrdcqtvmyzmvb.supabase.co'` if `VITE_SUPABASE_URL` is missing.
- **Recommendation:** For production, do not rely on fallback; ensure `VITE_SUPABASE_URL` is set so the correct project is always used.

### 5.3 Console logging

- **Issue:** Auth and services use many `console.log` / `console.warn` / `console.error` calls (useful for debugging, noisy in production).
- **Recommendation:** Wrap in a small logger that no-ops or sends to a service only when `import.meta.env.DEV` is true, or strip with a build step.

### 5.4 Bundle size

- **Issue:** Vite reports a chunk &gt; 500 kB after minification.
- **Recommendation:** Consider code-splitting (e.g. `React.lazy` for Dashboard, Settings, Users) and/or `manualChunks` in `vite.config.ts` to reduce initial load.

### 5.5 Backend and legacy API code

- **Issue:** `backend/` folder and `frontend/src/config/api.ts` + `frontend/src/services/api.ts` are unused in the current Supabase-only flow.
- **Recommendation:** If you do not plan to run the Node backend again, remove the `backend` folder and (optionally) the legacy API usage in the frontend to avoid confusion.

### 5.6 Dashboard filters

- **Note:** Dashboard stats and export both respect the Road filter; `dashboardService.getStats` already applies `roadId` when provided.

---

## 6. Deployment Steps (summary)

1. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for production.
2. Run `SUPABASE_MIGRATION.sql` and `FIX_RLS_COMPLETE.sql` in Supabase; create storage buckets and policies.
3. Build: `cd frontend && npm ci && npm run build`.
4. Upload `frontend/dist` to your static host; configure SPA routing (e.g. redirect all routes to `index.html`) if required.
5. Create at least one user in Supabase Auth and a matching row in `users` (e.g. via `CREATE_ADMIN_USER.sql` or Dashboard).
6. Optionally: remove backend, reduce console logging, and add code-splitting as above.

---

## 7. File Reference

| Purpose              | File / path |
|----------------------|-------------|
| Main migration       | `SUPABASE_MIGRATION.sql` |
| Users RLS fix         | `FIX_RLS_COMPLETE.sql` |
| Create admin user     | `CREATE_ADMIN_USER.sql` |
| Setup checklist      | `QUICK_START_CHECKLIST.md` |
| Production build     | `frontend/` → `npm run build` → `frontend/dist/` |

---

**Report generated as part of full system analysis for production readiness.**
