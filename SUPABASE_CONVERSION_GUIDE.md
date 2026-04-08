# Supabase-Only Conversion Guide

## ✅ What Has Been Completed

### 1. Mobile App Removed
- ✅ Removed `mobile/` folder
- ✅ Removed mobile references from `package.json`
- ✅ Updated workspace configuration

### 2. Documentation Cleaned
- ✅ Removed all deployment guides (Railway, HostGator, etc.)
- ✅ Removed troubleshooting guides
- ✅ Kept only essential README

### 3. Supabase Client Setup
- ✅ Installed `@supabase/supabase-js`
- ✅ Created `frontend/src/lib/supabase.ts` with Supabase client
- ✅ Added environment variable configuration

### 4. Authentication Converted
- ✅ Converted `AuthContext` to use Supabase Auth
- ✅ Removed JWT token management
- ✅ Uses Supabase session management
- ✅ Auto-refresh tokens enabled

### 5. Real-time Converted
- ✅ Converted `SocketContext` to `RealtimeProvider`
- ✅ Uses Supabase Realtime subscriptions
- ✅ Subscribes to cases and notifications changes
- ✅ Removed Socket.IO dependency

### 6. Service Layer Created
- ✅ Created `frontend/src/services/supabaseService.ts`
- ✅ Implemented services for:
  - Cases (CRUD + file uploads)
  - Zones, Roads, Developers
  - Users
  - Dashboard statistics

## ⚠️ What Still Needs to Be Done

### 1. Update All Pages to Use Supabase Service

Replace `api` calls with Supabase service calls in:
- [ ] `frontend/src/pages/Cases.tsx`
- [ ] `frontend/src/pages/CaseDetail.tsx`
- [ ] `frontend/src/pages/CreateCase.tsx`
- [ ] `frontend/src/pages/Dashboard.tsx`
- [ ] `frontend/src/pages/Users.tsx`
- [ ] `frontend/src/pages/Zones.tsx`
- [ ] `frontend/src/pages/Roads.tsx`
- [ ] `frontend/src/pages/Developers.tsx`
- [ ] `frontend/src/pages/Settings.tsx`

**Example conversion:**
```typescript
// OLD:
const response = await api.get('/cases');
const cases = response.data.cases;

// NEW:
import { casesService } from '../services/supabaseService';
const { cases } = await casesService.getAll(filters, page, limit);
```

### 2. Supabase Database Setup

#### A. Update Database Schema
Your Prisma schema uses snake_case in some places but camelCase in others. Supabase uses snake_case by default.

**Required changes:**
1. Rename columns to match Supabase conventions:
   - `zoneId` → `zone_id`
   - `roadId` → `road_id`
   - `developerId` → `developer_id`
   - `createdById` → `created_by_id`
   - `closedById` → `closed_by_id`
   - `closedAt` → `closed_at`
   - `closureNotes` → `closure_notes`
   - `createdAt` → `created_at`
   - `updatedAt` → `updated_at`
   - `plannedWork` → `planned_work`
   - `caseId` → `case_id`
   - `closureCaseId` → `closure_case_id`
   - `originalName` → `original_name`
   - `mimeType` → `mime_type`
   - `userId` → `user_id`

2. Run migrations in Supabase:
   ```sql
   -- Use Supabase SQL Editor to run migrations
   -- Or use Prisma migrate (but update schema first)
   ```

#### B. Set Up Row Level Security (RLS) Policies

**Critical for security!** Without RLS, anyone can access your data.

**Example RLS Policies:**

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE roads ENABLE ROW LEVEL SECURITY;
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Users: Can read own profile, admins can read all
CREATE POLICY "Users can read own profile"
ON users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can read all users"
ON users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

-- Cases: Complex role-based access
CREATE POLICY "Users can view cases based on role"
ON cases FOR SELECT
USING (
  -- Admin sees all
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
  OR
  -- Worker with zone sees cases in their zone
  (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'WORKER' AND zone_id IS NOT NULL
    )
    AND zone_id IN (
      SELECT zone_id FROM users WHERE id = auth.uid()
    )
  )
  OR
  -- Worker without zone sees own cases
  (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'WORKER' AND zone_id IS NULL
    )
    AND created_by_id = auth.uid()
  )
  OR
  -- Others role sees all (read-only)
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'OTHERS'
  )
);

-- Cases: Only workers and admins can create
CREATE POLICY "Workers and admins can create cases"
ON cases FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('WORKER', 'ADMIN')
  )
);

-- Cases: Can modify based on role
CREATE POLICY "Users can modify cases based on role"
ON cases FOR UPDATE
USING (
  -- Admin can modify any
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
  OR
  -- Worker can modify own cases or cases in their zone
  (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'WORKER'
    )
    AND (
      created_by_id = auth.uid()
      OR (
        zone_id IN (
          SELECT zone_id FROM users WHERE id = auth.uid() AND zone_id IS NOT NULL
        )
      )
    )
  )
);

-- Similar policies needed for:
-- - Zones (admin only)
-- - Roads (admin only)
-- - Developers (admin only)
-- - Photos (based on case access)
-- - Notifications (own notifications)
-- - System Settings (admin only)
```

### 3. Supabase Storage Setup

#### A. Create Storage Buckets

In Supabase Dashboard → Storage:

1. **Create `cases` bucket:**
   - Public: Yes (or use signed URLs)
   - File size limit: 10MB
   - Allowed MIME types: `image/jpeg, image/png, image/gif, image/webp`

2. **Create `logos` bucket:**
   - Public: Yes
   - File size limit: 5MB
   - Allowed MIME types: `image/jpeg, image/png, image/gif`

#### B. Set Storage Policies

```sql
-- Cases bucket: Authenticated users can upload
CREATE POLICY "Authenticated users can upload to cases"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cases');

-- Cases bucket: Public read access
CREATE POLICY "Public can read cases"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'cases');

-- Logos bucket: Only admins can upload
CREATE POLICY "Admins can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

-- Logos bucket: Public read access
CREATE POLICY "Public can read logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'logos');
```

### 4. Environment Variables

Create `frontend/.env.local`:

```env
VITE_SUPABASE_URL=https://uarbweqbrdcqtvmyzmvb.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_SUPABASE_STORAGE_BUCKET_CASES=cases
VITE_SUPABASE_STORAGE_BUCKET_LOGOS=logos
```

**Get your anon key from:**
Supabase Dashboard → Settings → API → anon/public key

### 5. User Migration

**Important:** Your existing users have passwords hashed with bcrypt, but Supabase Auth uses a different system.

**Options:**

**Option A: Migrate Users (Recommended)**
1. Export users from current database
2. Use Supabase Admin API to create users
3. Set temporary passwords
4. Users reset passwords on first login

**Option B: Fresh Start**
1. Delete existing users
2. Create new users through Supabase Auth
3. Use Supabase's built-in user management

**Option C: Custom Auth (Not Recommended)**
- Keep custom password hashing
- Use Supabase only for database/storage
- More complex, less secure

### 6. Remove Backend Dependencies

After conversion is complete:
- [ ] Remove `socket.io-client` from `package.json`
- [ ] Remove `axios` from `package.json` (if not used elsewhere)
- [ ] Remove `backend/` folder
- [ ] Update `vite.config.ts` to remove proxy configuration
- [ ] Remove `frontend/src/config/api.ts` (no longer needed)
- [ ] Remove `frontend/src/services/api.ts` (replaced by supabaseService)

### 7. Update Vite Config

Remove the proxy configuration:

```typescript
// frontend/vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Remove proxy section
  },
});
```

## 📋 Migration Checklist

### Database
- [ ] Update column names to snake_case
- [ ] Run migrations in Supabase
- [ ] Enable RLS on all tables
- [ ] Create RLS policies for all tables
- [ ] Test policies with different user roles

### Storage
- [ ] Create `cases` storage bucket
- [ ] Create `logos` storage bucket
- [ ] Set storage policies
- [ ] Test file uploads
- [ ] Test file access

### Frontend
- [ ] Update all pages to use Supabase service
- [ ] Remove axios/api imports
- [ ] Update file upload components
- [ ] Test all CRUD operations
- [ ] Test authentication flow
- [ ] Test real-time updates

### Environment
- [ ] Set up `.env.local` with Supabase keys
- [ ] Update `.env.production` for build
- [ ] Remove backend environment variables

### Cleanup
- [ ] Remove backend folder
- [ ] Remove unused dependencies
- [ ] Update README
- [ ] Test production build

## 🚀 Quick Start After Conversion

1. **Set up Supabase:**
   ```bash
   # Get your Supabase URL and anon key from dashboard
   # Add to frontend/.env.local
   ```

2. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

3. **Run migrations:**
   - Use Supabase SQL Editor to run schema migrations
   - Set up RLS policies
   - Create storage buckets

4. **Start development:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   # Upload dist/ folder to any static hosting
   ```

## ⚠️ Important Notes

1. **RLS Policies are Critical:** Without proper RLS, your data is exposed!

2. **User Migration:** Plan how to migrate existing users and passwords.

3. **File Storage:** Existing uploaded files need to be migrated to Supabase Storage.

4. **Testing:** Thoroughly test all features, especially:
   - Role-based access control
   - File uploads
   - Real-time updates
   - Dashboard statistics

5. **Performance:** Dashboard statistics now run in the browser. For large datasets, consider:
   - Database functions for aggregations
   - Supabase Edge Functions
   - Caching strategies

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)
- [Realtime Guide](https://supabase.com/docs/guides/realtime)
