# 🔧 Troubleshooting Login Issues

## Error: "Invalid login credentials" (400)

This error means the user doesn't exist in **Supabase Auth** or the password is incorrect.

### ✅ Solution: Create a User in Supabase

**Step 1: Create User in Supabase Auth**

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click **Add User** → **Create new user**
3. Fill in:
   - **Email**: `admin@test.com` (or any email)
   - **Password**: `test123456` (or any password)
   - **Auto Confirm User**: ✅ **Yes** (important!)
4. Click **Create User**

**Step 2: Create User Record in Database**

After creating the auth user, you need to create a record in the `users` table:

1. Go to **Supabase Dashboard** → **Table Editor** → **users**
2. Click **Insert row**
3. Fill in:
   - **id**: Copy the user ID from Authentication → Users (the UUID)
   - **email**: Same email you used (`admin@test.com`)
   - **name**: `Admin User` (or any name)
   - **role**: `ADMIN` (or `WORKER`, `OTHERS`)
   - **zone_id**: Leave empty (or select a zone if role is WORKER)
4. Click **Save**

**Step 3: Try Logging In**

Now try logging in with:
- Email: `admin@test.com`
- Password: `test123456`

---

## Alternative: Use SQL to Create User

If you prefer SQL, run this in **Supabase SQL Editor**:

```sql
-- First, create the auth user (you still need to do this via Dashboard)
-- Then run this to create the user record:

-- Replace these values:
-- - 'USER_ID_FROM_AUTH' with the actual user ID from auth.users
-- - 'user@example.com' with the actual email
-- - 'User Name' with the actual name
-- - 'ADMIN' with the desired role (ADMIN, WORKER, or OTHERS)

INSERT INTO users (id, email, name, role, zone_id)
VALUES (
  'USER_ID_FROM_AUTH',  -- Get this from auth.users table
  'user@example.com',
  'User Name',
  'ADMIN',
  NULL  -- or a zone_id if role is WORKER
);
```

---

## Quick Test: Check if User Exists

**Check Auth Users:**
1. Supabase Dashboard → Authentication → Users
2. Look for your email address
3. If it doesn't exist, create it (see Step 1 above)

**Check Database Users:**
1. Supabase Dashboard → Table Editor → users
2. Look for your user ID
3. If it doesn't exist, create it (see Step 2 above)

---

## Common Issues

### Issue 1: "User not found in users table"
**Solution:** The user exists in auth but not in the `users` table. Create the record (Step 2 above).

### Issue 2: "Email not confirmed"
**Solution:** Make sure **Auto Confirm User** is checked when creating the user in Supabase Dashboard.

### Issue 3: "Invalid anon key"
**Solution:** Check your `.env.local` file has the correct `VITE_SUPABASE_ANON_KEY` from Supabase Dashboard → Settings → API.

### Issue 4: "Network error"
**Solution:** 
- Check your internet connection
- Verify Supabase URL is correct in `.env.local`
- Check browser console for CORS errors

---

## Verify Your Setup

1. **Check `.env.local` exists:**
   ```bash
   cd frontend
   cat .env.local
   ```
   Should show:
   ```
   VITE_SUPABASE_URL=https://uarbweqbrdcqtvmyzmvb.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   ```

2. **Check Supabase connection:**
   - Open browser console (F12)
   - Look for any Supabase connection errors
   - Check Network tab for failed requests

3. **Check user exists:**
   - Supabase Dashboard → Authentication → Users
   - Should see your user email

---

## Still Having Issues?

1. **Check browser console** for detailed error messages
2. **Check Supabase Dashboard → Logs** for server-side errors
3. **Verify RLS policies** are set correctly (see `SUPABASE_MIGRATION.sql`)
4. **Try creating a fresh user** with a simple email/password

---

## Quick Fix Script

If you want to quickly create a test admin user, run this in Supabase SQL Editor:

```sql
-- This assumes you've already created the auth user
-- Replace 'YOUR_AUTH_USER_ID' with the actual UUID from auth.users

DO $$
DECLARE
  auth_user_id UUID;
BEGIN
  -- Get the first auth user (or specify the email)
  SELECT id INTO auth_user_id 
  FROM auth.users 
  WHERE email = 'admin@test.com' 
  LIMIT 1;

  -- Create user record if it doesn't exist
  INSERT INTO users (id, email, name, role, zone_id)
  VALUES (
    auth_user_id,
    'admin@test.com',
    'Admin User',
    'ADMIN',
    NULL
  )
  ON CONFLICT (id) DO NOTHING;
END $$;
```

---

**Need more help?** Check the browser console and Supabase Dashboard logs for detailed error messages.
