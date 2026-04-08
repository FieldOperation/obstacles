# Host Obstacles CMS at obstacles.net on HostGator (Baby plan)

Use **obstacles.net** as an addon domain. Your current site stays untouched.

---

## Step 1: Point obstacles.net to HostGator

- If **obstacles.net is not registered yet**: Register it (HostGator Domains or any registrar) and set its **nameservers** to HostGator’s (e.g. `ns1.hostgator.com`, `ns2.hostgator.com` — check your HostGator welcome email or Domains section).
- If **obstacles.net is already registered elsewhere**: In your domain registrar’s DNS settings, set the **A record** for `obstacles.net` (and optionally `www.obstacles.net`) to your HostGator **shared IP** (find it in cPanel or HostGator “Account Info”).

Wait for DNS to propagate (up to 24–48 hours, often much less).

---

## Step 2: Add obstacles.net as an addon domain (cPanel)

1. Log in to **HostGator cPanel**.
2. Open **Domains** → **Addon Domains** (or “Addon Domain”).
3. **New Domain Name:** `obstacles.net`
4. **Subdomain / FTP:** usually auto-fills (e.g. `obstacles.net`). Leave as is.
5. **Document Root:** use the suggested folder, e.g. `obstacles.net` (full path will be something like `public_html/obstacles.net`). This is the **only** folder that will serve obstacles.net — your main site stays in `public_html` or its own folder.
6. Click **Add Domain**.

Your main site’s URL and files are not changed.

---

## Step 3: Build the app with production env

HostGator doesn’t provide env vars at runtime for static files, so Supabase URL and key must be baked into the build.

1. In the project, open **`frontend/.env.production`**.
2. Set (replace with your real values from Supabase → Settings → API):

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

3. From the repo root:

```bash
cd frontend
npm run build
```

The built files will be in **`frontend/dist/`**.

---

## Step 4: Upload files to the addon domain folder

1. In cPanel, open **File Manager**.
2. Go to the **document root** of obstacles.net (e.g. `public_html/obstacles.net` or whatever you set in Step 2). Do **not** upload into your main site’s root.
3. Upload the **contents** of `frontend/dist/` into that folder:
   - So that folder contains `index.html` and an `assets/` folder (and any other files from `dist`).
   - You can upload the contents as a zip and extract in File Manager, or use FTP with the same structure.

---

## Step 5: SPA routing (.htaccess)

So that routes like `/login`, `/dashboard`, etc. work and refresh correctly:

1. In the **same** folder (obstacles.net document root), create or edit **`.htaccess`**.
2. Put this inside:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

3. Save. Now all requests that aren’t real files or directories are sent to `index.html` (React Router handles the rest).

---

## Step 6: Test

- Open **https://obstacles.net** (or http). You should see the app.
- Log in with your admin user and test creating a case and uploading a photo.

---

## Summary

| Item | Where |
|------|--------|
| Main site | Unchanged (e.g. `public_html` or its own domain folder) |
| Obstacles app | Only in obstacles.net’s document root (e.g. `public_html/obstacles.net`) |
| Build env | `frontend/.env.production` (Supabase URL + anon key) |
| Upload | Contents of `frontend/dist/` + `.htaccess` in that folder |

Using a different URL (obstacles.net) and a separate folder means your existing site is not affected.
