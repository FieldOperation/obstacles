# ✅ Quick Start Checklist

Follow these steps in order:

## Step 1: Add Supabase Anon Key ⏳

1. Open `frontend/.env.local`
2. Get your anon key from: **Supabase Dashboard → Settings → API → anon/public key**
3. Replace `YOUR_ANON_KEY_HERE` with your actual key
4. Save the file

**Status:** ⏳ Waiting for you to add the key

---

## Step 2: Run Database Migration ⏳

1. Go to **Supabase Dashboard → SQL Editor**
2. Click **New Query**
3. Open `SUPABASE_MIGRATION.sql` file (I created it for you)
4. Copy ALL the SQL code
5. Paste into Supabase SQL Editor
6. Click **Run** (or press F5)

**This creates:**
- ✅ All tables with correct structure
- ✅ Indexes for performance
- ✅ Row Level Security (RLS) enabled
- ✅ All security policies
- ✅ Auto-sync between auth.users and users table

**Status:** ⏳ Waiting for you to run the migration

---

## Step 3: Create Storage Buckets ⏳

1. Go to **Supabase Dashboard → Storage**
2. Click **New Bucket**

**Create `cases` bucket:**
- Name: `cases`
- Public: ✅ Yes
- File size limit: `10485760` (10MB)
- Allowed MIME types: `image/jpeg,image/png,image/gif,image/webp`

3. Click **Create Bucket**

**Create `logos` bucket:**
- Name: `logos`
- Public: ✅ Yes
- File size limit: `5242880` (5MB)
- Allowed MIME types: `image/jpeg,image/png,image/gif`

4. Click **Create Bucket**

**Status:** ⏳ Waiting for you to create buckets

---

## Step 4: Set Storage Policies ⏳

After creating buckets, set policies:

1. Go to **Storage → cases → Policies**
2. Click **New Policy**
3. Use **For full customization** option
4. Paste this SQL:

```sql
-- Policy 1: Authenticated users can upload
CREATE POLICY "Authenticated users can upload to cases"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cases');

-- Policy 2: Public can read
CREATE POLICY "Public can read cases"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'cases');
```

5. Repeat for `logos` bucket (admin-only upload, public read)

**Status:** ⏳ Waiting for you to set policies

---

## Step 5: Test the System ✅

Once steps 1-4 are done:

1. **Start the frontend:**
   ```bash
   cd frontend
   npm install  # If you haven't already
   npm run dev
   ```

2. **Create a test user in Supabase:**
   - Go to **Supabase Dashboard → Authentication → Users**
   - Click **Add User** → **Create new user**
   - Email: `admin@test.com`
   - Password: `test123456`
   - Auto Confirm User: ✅ Yes
   - Click **Create User**

3. **Update user role in database:**
   - Go to **Supabase Dashboard → Table Editor → users**
   - Find your user
   - Set `role` to `ADMIN`
   - Save

4. **Try logging in:**
   - Go to `http://localhost:3000`
   - Login with `admin@test.com` / `test123456`

**Status:** ⏳ Waiting for you to test

---

## What I've Already Done ✅

- ✅ Removed mobile app
- ✅ Cleaned up documentation
- ✅ Set up Supabase client
- ✅ Converted authentication to Supabase Auth
- ✅ Converted real-time to Supabase Realtime
- ✅ Created Supabase service layer
- ✅ Updated Cases page to use Supabase
- ✅ Removed Vite proxy
- ✅ Created migration SQL script
- ✅ Created storage setup guide

---

## Next Steps After Testing

Once you confirm steps 1-4 are done and testing works, I'll:
1. Update remaining pages (Dashboard, CreateCase, etc.)
2. Fix any data structure issues
3. Help you migrate existing users
4. Finalize everything

**Tell me when you've completed steps 1-4, and we'll continue!** 🚀
