# GitHub Actions Deployment Setup

This guide will help you deploy your Smart Pantry Order Management System automatically using GitHub Actions.

## ⚠️ IMPORTANT SECURITY NOTE

**NEVER commit `.env` files to Git!** They contain sensitive credentials. If you've already committed them:

```bash
# Remove .env files from git (but keep them locally)
git rm --cached backend/.env
git rm --cached frontend/.env.local

# Add to .gitignore (already done)
echo "backend/.env" >> .gitignore
echo "frontend/.env.local" >> .gitignore

# Commit the removal
git commit -m "Remove .env files from version control"
git push
```

Instead, use GitHub Secrets to store sensitive data.

---

## 🚀 Deployment Options

We've created workflows for:

1. **Backend**: Deploy to Railway (free tier available)
2. **Frontend**: Deploy to Vercel (free tier with best Next.js support)
3. **Full Stack**: Deploy both together

---

## 📋 Step-by-Step Setup

### Step 1: Set Up Railway (Backend)

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Empty Project"
   - Name it: `smart-pantry-backend`

3. **Get Railway Token**
   - Go to https://railway.app/account/tokens
   - Click "Create Token"
   - Name it: `GitHub Actions`
   - Copy the token (save it - you'll need it!)

4. **Configure Railway Project**
   - In your Railway project, click "Variables"
   - Add all your backend environment variables:
     ```
     SUPABASE_URL=your_supabase_url
     SUPABASE_ANON_KEY=your_anon_key
     SUPABASE_SERVICE_KEY=your_service_key
     JWT_SECRET_KEY=your_jwt_secret
     JWT_ALGORITHM=HS256
     ACCESS_TOKEN_EXPIRE_MINUTES=1440
     DATABASE_URL=your_database_url
     ENVIRONMENT=production
     ```

5. **Configure Start Command**
   - In Railway project settings, set:
   - **Root Directory**: `backend`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Build Command**: `pip install -r requirements.txt`

### Step 2: Set Up Vercel (Frontend)

1. **Create Vercel Account**
   - Go to https://vercel.com
   - Sign up with GitHub

2. **Import Frontend Project**
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Set **Root Directory**: `frontend`
   - Framework Preset: Next.js (auto-detected)
   - Don't deploy yet!

3. **Add Environment Variables in Vercel**
   - In project settings → Environment Variables
   - Add these variables:
     ```
     NEXT_PUBLIC_API_URL=your_railway_backend_url
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your_unsplash_key
     ```
   - **Important**: Use your Railway backend URL (e.g., `https://smart-pantry-backend-production.up.railway.app`)

4. **Get Vercel Credentials**

   **Get Vercel Token:**
   - Go to https://vercel.com/account/tokens
   - Create a new token named "GitHub Actions"
   - Copy the token

   **Get Organization ID:**
   ```bash
   npm i -g vercel
   cd frontend
   vercel login
   vercel link
   # This creates .vercel/project.json
   cat .vercel/project.json
   ```
   - Copy `orgId` and `projectId`

### Step 3: Configure GitHub Secrets

1. **Go to Your GitHub Repository**
   - Navigate to: `Settings` → `Secrets and variables` → `Actions`

2. **Add Repository Secrets**
   Click "New repository secret" and add each of these:

   **For Railway (Backend):**
   - Name: `RAILWAY_TOKEN`
   - Value: Your Railway token from Step 1

   **For Vercel (Frontend):**
   - Name: `VERCEL_TOKEN`
   - Value: Your Vercel token

   - Name: `VERCEL_ORG_ID`
   - Value: Your Vercel organization ID

   - Name: `VERCEL_PROJECT_ID`
   - Value: Your Vercel project ID

3. **Verify Secrets Added**
   You should have 4 secrets:
   - `RAILWAY_TOKEN`
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

### Step 4: Test Deployment

1. **Push to Trigger Deployment**
   ```bash
   git add .
   git commit -m "Add GitHub Actions deployment"
   git push
   ```

2. **Monitor Deployment**
   - Go to your GitHub repository
   - Click "Actions" tab
   - Watch the workflow run
   - Green checkmark = success!

3. **Get Your URLs**
   - **Backend**: Check Railway dashboard for URL
   - **Frontend**: Check Vercel dashboard for URL

---

## 🔧 GitHub Actions Workflows

We've created three workflows:

### 1. `deploy-backend.yml`
- Triggers: Push to backend folder or manual
- Deploys only backend to Railway

### 2. `deploy-frontend.yml`
- Triggers: Push to frontend folder or manual
- Deploys only frontend to Vercel

### 3. `deploy-full-stack.yml`
- Triggers: Push to any branch or manual
- Deploys both backend and frontend sequentially

---

## 🎯 Manual Deployment

You can manually trigger deployments:

1. Go to GitHub → Actions
2. Select a workflow
3. Click "Run workflow"
4. Choose branch
5. Click "Run workflow"

---

## 🔍 Troubleshooting

### Backend Deployment Fails

**Error: "railway: command not found"**
- Wait a few seconds, Railway CLI installs during workflow

**Error: "Invalid token"**
- Check `RAILWAY_TOKEN` secret is correct
- Generate a new token in Railway

**Error: "Module not found"**
- Check `requirements.txt` has all dependencies
- Verify start command in Railway

### Frontend Deployment Fails

**Error: "Invalid token"**
- Check all three Vercel secrets are set correctly
- Regenerate token if needed

**Error: "Project not linked"**
- Run `vercel link` locally first
- Or import project manually in Vercel dashboard

**Error: "Build failed"**
- Check environment variables in Vercel
- Ensure `NEXT_PUBLIC_API_URL` points to Railway backend

### General Issues

**Secrets Not Working:**
- Ensure secret names match exactly (case-sensitive)
- Re-add secrets if in doubt

**Workflow Not Triggering:**
- Check branch name in workflow file
- Make sure you pushed to the correct branch

**Backend/Frontend Can't Communicate:**
- Update CORS settings in `backend/main.py` with frontend URL
- Add Railway backend URL to frontend's `NEXT_PUBLIC_API_URL`

---

## 🔐 Environment Variables Reference

### Backend (Railway)
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_KEY=eyJxxx...
JWT_SECRET_KEY=generate_with_secrets.token_urlsafe(32)
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DATABASE_URL=postgresql://postgres:xxx@xxx.supabase.co:5432/postgres
ENVIRONMENT=production
```

### Frontend (Vercel)
```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=xxx
```

### GitHub Secrets
```
RAILWAY_TOKEN=xxx
VERCEL_TOKEN=xxx
VERCEL_ORG_ID=xxx
VERCEL_PROJECT_ID=xxx
```

---

## 🎨 Alternative Deployment Options

### Other Backend Platforms

**Heroku:**
```yaml
- name: Deploy to Heroku
  uses: akhileshns/heroku-deploy@v3.12.14
  with:
    heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
    heroku_app_name: "smart-pantry-backend"
    heroku_email: "your-email@example.com"
    appdir: "backend"
```

**DigitalOcean App Platform:**
- Connect GitHub repo in DO dashboard
- Set root directory to `backend`
- Add environment variables
- Deploy

### Other Frontend Platforms

**Netlify:**
```yaml
- name: Deploy to Netlify
  uses: nwtgck/actions-netlify@v2.0
  with:
    publish-dir: './frontend/.next'
    production-deploy: true
  env:
    NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
    NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

**AWS Amplify:**
- Connect GitHub in Amplify Console
- Set root to `frontend`
- Add environment variables
- Deploy

---

## 📊 Monitoring Deployments

### View Deployment History
- **GitHub**: Actions tab shows all deployments
- **Railway**: Dashboard shows deployment logs
- **Vercel**: Dashboard shows deployment history

### Check Application Health
```bash
# Backend health check
curl https://your-backend.railway.app/health

# Frontend check
curl https://your-frontend.vercel.app
```

### View Logs
- **Railway**: Click on deployment → View Logs
- **Vercel**: Click on deployment → Function Logs
- **GitHub Actions**: Click on workflow run → View logs

---

## 🚨 Important Notes

1. **Free Tier Limits**
   - Railway: $5 free credit/month (enough for small apps)
   - Vercel: Unlimited hobby projects, bandwidth limits apply
   - Monitor usage to avoid unexpected charges

2. **Database Considerations**
   - Supabase free tier: 500MB database, 2GB bandwidth
   - Consider upgrading for production use

3. **CORS Configuration**
   - Update `backend/main.py` with your Vercel URL
   - Add to `allow_origins` list

4. **Environment Updates**
   - Backend: Update in Railway dashboard
   - Frontend: Update in Vercel dashboard
   - Secrets: Update in GitHub Settings

5. **Rollback Procedure**
   - Railway: Click deployment → Rollback
   - Vercel: Click deployment → Promote to Production
   - GitHub: Revert commit and push

---

## ✅ Post-Deployment Checklist

- [ ] Backend deployed successfully
- [ ] Frontend deployed successfully
- [ ] Can login to application
- [ ] User can place orders
- [ ] Pantry receives orders
- [ ] Admin sees analytics
- [ ] Real-time updates work
- [ ] All environment variables set
- [ ] CORS configured correctly
- [ ] Database connection working
- [ ] No `.env` files in Git
- [ ] All secrets configured in GitHub

---

## 🎉 Success!

Once everything is set up:

1. Every push to your branch triggers automatic deployment
2. Backend deploys to Railway
3. Frontend deploys to Vercel
4. Changes go live automatically!

Your application URLs:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend.railway.app`
- **API Docs**: `https://your-backend.railway.app/docs`

---

## 📞 Support

If you encounter issues:

1. Check workflow logs in GitHub Actions
2. Check deployment logs in Railway/Vercel
3. Verify all secrets are set correctly
4. Ensure environment variables match
5. Check CORS configuration

For platform-specific help:
- Railway: https://docs.railway.app
- Vercel: https://vercel.com/docs
- GitHub Actions: https://docs.github.com/actions
