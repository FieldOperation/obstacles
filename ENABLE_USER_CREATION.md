# ✅ Enable User Creation from Web Page

## Step 1: Create Admin User (One-Time Setup)

### Option A: Using SQL (Recommended)

1. **First, create the auth user in Supabase Dashboard:**
   - Go to **Supabase Dashboard** → **Authentication** → **Users**
   - Click **Add User** → **Create new user**
   - Email: `admin@example.com` (or your email)
   - Password: `YourSecurePassword123!`
   - **Auto Confirm User**: ✅ **Yes** (important!)
   - Click **Create User**
   - **Copy the User ID (UUID)** shown

2. **Then run the SQL query:**
   - Go to **Supabase Dashboard** → **SQL Editor**
   - Open `CREATE_ADMIN_USER.sql` file
   - Use **Option 3** (recommended) - it auto-finds the user by email
   - Replace `'admin@example.com'` with your actual admin email
   - Click **Run**

### Option B: Using SQL Auto-Detection

Run this in **Supabase SQL Editor**:

```sql
-- This will automatically create an admin user for the first auth user
DO $$
DECLARE
  auth_user_id UUID;
  auth_user_email TEXT;
BEGIN
  -- Find the first auth user that doesn't have a users table record
  SELECT au.id, au.email INTO auth_user_id, auth_user_email
  FROM auth.users au
  LEFT JOIN users u ON u.id = au.id
  WHERE u.id IS NULL
  ORDER BY au.created_at
  LIMIT 1;

  -- If found, create the user record as ADMIN
  IF auth_user_id IS NOT NULL THEN
    INSERT INTO users (id, email, name, role, zone_id, created_at, updated_at)
    VALUES (
      auth_user_id,
      auth_user_email,
      COALESCE(SPLIT_PART(auth_user_email, '@', 1), 'Admin User'),
      'ADMIN',
      NULL,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET role = 'ADMIN', updated_at = NOW();
    
    RAISE NOTICE '✅ Created admin user: % (%)', auth_user_email, auth_user_id;
  ELSE
    RAISE NOTICE '⚠️ No auth users found without user records';
  END IF;
END $$;
```

---

## Step 2: Disable Email Confirmation (Optional but Recommended)

For admin-created users to login immediately without email confirmation:

1. Go to **Supabase Dashboard** → **Authentication** → **Settings**
2. Scroll to **Email Auth**
3. Find **"Enable email confirmations"**
4. **Uncheck** this option (or set to **OFF**)
5. Click **Save**

**Note:** This allows admin-created users to login immediately. If you want email confirmation, users will need to click the confirmation link before logging in.

---

## Step 3: Test Admin Login

1. Go to your login page
2. Use the admin credentials you created:
   - Email: `admin@example.com` (or your email)
   - Password: `YourSecurePassword123!` (or your password)
3. You should be able to login successfully

---

## Step 4: Create Users from Web Page

Now that you're logged in as admin:

1. Go to **Users** page in your app
2. Click **New User** button
3. Fill in:
   - Name: `John Doe`
   - Email: `john@example.com`
   - Password: `password123` (minimum 6 characters)
   - Role: `WORKER` (or `ADMIN`, `OTHERS`)
   - Zone: (optional, if role is WORKER)
4. Click **Create**

**The user will be created and can login immediately** (if email confirmation is disabled).

---

## Important Notes

### Email Confirmation

- **If enabled:** Users receive a confirmation email and must click the link before logging in
- **If disabled:** Users can login immediately after creation

### User Creation Process

When an admin creates a user:
1. Supabase Auth user is created (via `signUp`)
2. User record is created in `users` table (via trigger or explicit insert)
3. Role and zone are set as specified
4. User can login (if email confirmation is disabled)

### Password Requirements

- Minimum 6 characters (Supabase default)
- No special requirements by default
- You can enforce stronger passwords in Supabase Dashboard → Authentication → Settings

---

## Troubleshooting

### Issue: "User already exists"
**Solution:** The email is already registered. Use a different email or delete the existing user first.

### Issue: "Email not confirmed"
**Solution:** 
- Option 1: Disable email confirmation (see Step 2)
- Option 2: Go to Supabase Dashboard → Authentication → Users → Find user → Click "Confirm Email"

### Issue: "User created but can't login"
**Solution:** 
- Check if email confirmation is required
- Verify the user record exists in `users` table
- Check the user's role is set correctly

### Issue: "Permission denied"
**Solution:** 
- Make sure you're logged in as ADMIN
- Check RLS policies allow user creation
- Verify the trigger `on_auth_user_created` exists

---

## Verify Everything Works

Run this SQL to check your admin user:

```sql
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  au.email_confirmed_at,
  au.created_at as auth_created_at
FROM users u
JOIN auth.users au ON au.id = u.id
WHERE u.role = 'ADMIN'
ORDER BY u.created_at DESC;
```

You should see your admin user with `email_confirmed_at` set (if you enabled auto-confirm).

---

## Next Steps

1. ✅ Create admin user (Step 1)
2. ✅ Disable email confirmation (Step 2 - optional)
3. ✅ Test admin login (Step 3)
4. ✅ Create users from web page (Step 4)

**You're all set!** Admins can now create users directly from the web interface. 🎉
