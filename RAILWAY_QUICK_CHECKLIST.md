# Railway Deployment - Quick Checklist

Use this checklist while deploying. Check off each step as you complete it.

## Pre-Deployment

- [ ] Generated JWT secret (32+ characters) - Save it!
- [ ] Have Supabase connection string ready
- [ ] Code pushed to GitHub
- [ ] Railway account created

## Railway Setup

- [ ] Created new project in Railway
- [ ] Connected GitHub repository
- [ ] Set Root Directory to `backend`
- [ ] Verified Build Command: `npm run build`
- [ ] Verified Start Command: `npm start`

## Environment Variables (Add all 9)

- [ ] `DATABASE_URL` = Your Supabase connection string
- [ ] `JWT_SECRET` = Your generated secret (32+ chars)
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `3001`
- [ ] `JWT_EXPIRES_IN` = `7d`
- [ ] `CORS_ORIGIN` = Your HostGator domain (or `http://localhost:3000`)
- [ ] `FRONTEND_URL` = Same as CORS_ORIGIN
- [ ] `UPLOAD_DIR` = `./uploads`
- [ ] `MAX_FILE_SIZE` = `10485760`

## Deployment

- [ ] Deployment started
- [ ] Deployment completed successfully
- [ ] Got Railway URL (e.g., `https://your-app.railway.app`)
- [ ] Added `API_BASE_URL` variable with Railway URL
- [ ] Tested health endpoint: `/health` returns OK
- [ ] Tested API endpoint: `/api/auth/login` returns error (that's OK!)

## Post-Deployment

- [ ] Backend URL saved: `___________________________`
- [ ] Ready to deploy frontend to HostGator
- [ ] Frontend will use: `VITE_API_BASE_URL=https://your-app.railway.app/api`

## Troubleshooting

If deployment fails:
- [ ] Checked logs in Railway
- [ ] Verified all 9 environment variables are set
- [ ] Verified JWT_SECRET is 32+ characters
- [ ] Verified Root Directory is `backend`
- [ ] Verified DATABASE_URL is correct

---

**Your Railway URL**: _________________________________

**Next Step**: Deploy frontend to HostGator (see DEPLOY_WITH_SUPABASE.md)
