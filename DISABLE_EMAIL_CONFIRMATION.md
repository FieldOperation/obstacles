# Fix "Email rate limit exceeded" when creating users

Supabase sends a confirmation email for each new signup when **Confirm email** is enabled. That triggers a **rate limit (429)** if you create several users in a short time.

Since you use **username + password only** (no real email), you should disable confirmation so that:

- No emails are sent → no rate limit
- New users can log in immediately with username + password

## Steps (one-time)

1. Open **Supabase Dashboard** → your project.
2. Go to **Authentication** → **Providers** (or **Authentication** → **Settings**).
3. Click **Email**.
4. Turn **off** **“Confirm email”** (or “Enable email confirmations”).
5. Save.

After this, creating users from the app will not send emails and will not hit the rate limit.
