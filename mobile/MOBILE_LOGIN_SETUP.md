# Mobile App – Supabase Login

The mobile app uses **Supabase Auth** (same as the web app). Use the same username and password you use on the web.

## 1. Configure Supabase

Copy `env.example` to `.env` and add your Supabase credentials (same as `frontend/.env.local`):

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these from: **Supabase Dashboard → Settings → API**

## 2. Login

- **Username**: Same as web (e.g. `admin` → `admin@obstacles.local`)
- **Password**: Same as web

## 3. No backend or Wi‑Fi setup needed

The mobile app talks directly to Supabase. You don't need:
- The backend running
- Your computer's IP
- Same Wi‑Fi network

## 4. Restart Expo after changing `.env`

```powershell
cd mobile
npx expo start
```

Then reload the app (shake device → Reload).
