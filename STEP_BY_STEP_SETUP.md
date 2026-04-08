# 🚀 Step-by-Step Setup Guide

Let's get your system ready step by step!

## ✅ Step 1: Get Your Supabase Anon Key

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (uarbweqbrdcqtvmyzmvb)
3. Go to **Settings** → **API**
4. Copy the **anon/public** key
5. Open `frontend/.env.local` (I just created it)
6. Replace `YOUR_ANON_KEY_HERE` with your actual anon key

**Example:**
```env
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ✅ Step 2: Run Database Migration in Supabase

1. Go to Supabase Dashboard → **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `SUPABASE_MIGRATION.sql` (I just created it)
4. Paste into the SQL Editor
5. Click **Run** (or press F5)

**This will:**
- ✅ Create all tables with correct column names (snake_case)
- ✅ Create indexes for performance
- ✅ Enable Row Level Security (RLS)
- ✅ Create all security policies
- ✅ Set up auto-sync between auth.users and users table

**⚠️ Important:** If you already have tables, the script uses `CREATE TABLE IF NOT EXISTS`, so it won't break existing data. But you may need to adjust column names if they're different.

---

## ✅ Step 3: Create Storage Buckets

1. Go to Supabase Dashboard → **Storage**
2. Click **New Bucket**

**Create `cases` bucket:**
- Name: `cases`
- Public bucket: ✅ **Yes** (or use signed URLs)
- File size limit: `10485760` (10MB)
- Allowed MIME types: `image/jpeg,image/png,image/gif,image/webp`

3. Click **Create Bucket**

**Create `logos` bucket:**
- Name: `logos`
- Public bucket: ✅ **Yes**
- File size limit: `5242880` (5MB)
- Allowed MIME types: `image/jpeg,image/png,image/gif`

4. Click **Create Bucket**

**Set Storage Policies:**

Go to **Storage** → **Policies** for each bucket:

**For `cases` bucket:**
```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload to cases"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cases');

-- Allow public read access
CREATE POLICY "Public can read cases"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'cases');
```

**For `logos` bucket:**
```sql
-- Only admins can upload logos
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

-- Public can read logos
CREATE POLICY "Public can read logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'logos');
```

---

## ✅ Step 4: Remove Vite Proxy (No Longer Needed)

I'll update `frontend/vite.config.ts` to remove the backend proxy since we're using Supabase directly.

---

## ✅ Step 5: Update Pages to Use Supabase Service

I'll update all your pages to use the new Supabase service instead of the old API.

**Pages to update:**
- Cases.tsx
- CaseDetail.tsx
- CreateCase.tsx
- Dashboard.tsx
- Users.tsx
- Zones.tsx
- Roads.tsx
- Developers.tsx
- Settings.tsx

---

## ✅ Step 6: Test Everything

1. Start the frontend: `cd frontend && npm run dev`
2. Try to log in (you'll need to create a user first in Supabase Auth)
3. Test creating a case
4. Test uploading photos
5. Test dashboard

---

## 🎯 Let's Start!

**First, tell me:**
1. ✅ Have you added your Supabase anon key to `.env.local`?
2. ✅ Have you run the SQL migration in Supabase?
3. ✅ Have you created the storage buckets?

Once you confirm these, I'll help you with the next steps!
