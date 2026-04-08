# Next steps after migration

You’ve completed the database migration and users RLS fix. Do these in order.

---

## 1. Create storage buckets (Supabase Dashboard)

1. Open **Supabase Dashboard → Storage**.
2. Click **New bucket**.

**Bucket: `cases`**
- Name: `cases`
- Public: **Yes**
- File size limit: `10485760` (10 MB)
- Allowed MIME types: `image/jpeg,image/png,image/gif,image/webp`  
- Create bucket.

**Bucket: `logos`**
- Name: `logos`
- Public: **Yes**
- File size limit: `5242880` (5 MB)
- Allowed MIME types: `image/jpeg,image/png,image/gif`  
- Create bucket.

---

## 2. Add storage policies (Supabase SQL Editor)

Run this in **SQL Editor → New query**:

```sql
-- Cases bucket: authenticated upload, public read
DROP POLICY IF EXISTS "Authenticated users can upload to cases" ON storage.objects;
DROP POLICY IF EXISTS "Public can read cases" ON storage.objects;
CREATE POLICY "Authenticated users can upload to cases"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'cases');
CREATE POLICY "Public can read cases"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'cases');

-- Logos bucket: authenticated upload (admin only via app), public read
DROP POLICY IF EXISTS "Authenticated users can upload to logos" ON storage.objects;
DROP POLICY IF EXISTS "Public can read logos" ON storage.objects;
CREATE POLICY "Authenticated users can upload to logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'logos');
CREATE POLICY "Public can read logos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'logos');
```

---

## 3. Create your first admin user

**A. Create the auth user**

1. **Supabase Dashboard → Authentication → Users**
2. **Add user** → **Create new user**
3. Enter email and a strong password
4. Turn **Auto Confirm User** **On**
5. **Create user**
6. Copy the user’s **UUID** (User ID)

**B. Give that user ADMIN in the app**

In **SQL Editor**, run one of these:

**Option A – You have the user UUID:**  
Replace `USER_ID_FROM_AUTH` and the email, then run:

```sql
INSERT INTO users (id, email, name, role, zone_id, created_at, updated_at)
VALUES (
  'USER_ID_FROM_AUTH',
  'your-admin@example.com',
  'System Administrator',
  'ADMIN',
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email, name = EXCLUDED.name, role = 'ADMIN', updated_at = NOW();
```

**Option B – You already created the auth user:**  
Replace `your-admin@example.com` with that user’s email, then run:

```sql
DO $$
DECLARE
  auth_user_id UUID;
  auth_user_email TEXT;
BEGIN
  SELECT id, email INTO auth_user_id, auth_user_email
  FROM auth.users
  WHERE email = 'your-admin@example.com'
  LIMIT 1;

  IF auth_user_id IS NOT NULL THEN
    INSERT INTO users (id, email, name, role, zone_id, created_at, updated_at)
    VALUES (auth_user_id, auth_user_email, 'System Administrator', 'ADMIN', NULL, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET role = 'ADMIN', updated_at = NOW();
    RAISE NOTICE 'Admin created: %', auth_user_email;
  ELSE
    RAISE NOTICE 'Create the auth user first in Authentication → Users';
  END IF;
END $$;
```

(More variants are in `CREATE_ADMIN_USER.sql`.)

---

## 4. Set frontend environment variables

**Local development**

1. In the project: `frontend/.env.local` (create from `frontend/.env.example` if needed).
2. Set:
   - `VITE_SUPABASE_URL` = your project URL (Supabase → Settings → API)
   - `VITE_SUPABASE_ANON_KEY` = your anon/public key

**Production**

- On your host (Vercel, Netlify, etc.), set the same variables so the production build uses your real Supabase project.

---

## 5. Test the app

```bash
cd frontend
npm install
npm run dev
```

Open the app (e.g. http://localhost:5173), log in with the admin user you created, and check:

- Dashboard loads
- You can create/edit cases and upload photos
- Settings (logos) work if you use them

---

## 6. (Optional) Production build and deploy

```bash
cd frontend
npm run build
```

Deploy the contents of `frontend/dist` to your static host and ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in the host’s environment.
