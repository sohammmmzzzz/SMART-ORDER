# Deployment Guide

This guide covers deploying the Smart Pantry Order Management System to production.

## Prerequisites

- Supabase account and project
- Domain name (optional)
- Platform account (Vercel, Railway, AWS, etc.)

## Database Setup (Supabase)

### 1. Create Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Choose organization and fill in details:
   - Name: smart-pantry-order-system
   - Database Password: (generate a strong password)
   - Region: (choose closest to your users)
4. Wait for project initialization (2-3 minutes)

### 2. Run Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy contents from `/database/schema.sql`
4. Click **Run**
5. Verify all tables are created in **Table Editor**

### 3. Enable Realtime

1. Go to **Database** > **Replication**
2. Find the `orders` table
3. Toggle **Realtime** to ON
4. This enables live updates for the pantry dashboard

### 4. Get API Credentials

Go to **Settings** > **API**:
- Copy **Project URL** (SUPABASE_URL)
- Copy **anon public** key (SUPABASE_ANON_KEY)
- Copy **service_role** key (SUPABASE_SERVICE_KEY) - Keep this SECRET!

## Backend Deployment

### Option 1: Railway

1. **Install Railway CLI**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login and Initialize**
   ```bash
   railway login
   cd backend
   railway init
   ```

3. **Set Environment Variables**
   ```bash
   railway variables set SUPABASE_URL=your_url
   railway variables set SUPABASE_ANON_KEY=your_anon_key
   railway variables set SUPABASE_SERVICE_KEY=your_service_key
   railway variables set JWT_SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))")
   railway variables set JWT_ALGORITHM=HS256
   railway variables set ACCESS_TOKEN_EXPIRE_MINUTES=1440
   railway variables set DATABASE_URL=your_database_url
   railway variables set ENVIRONMENT=production
   ```

4. **Deploy**
   ```bash
   railway up
   ```

5. **Get your backend URL**
   ```bash
   railway domain
   ```

### Option 2: Heroku

1. **Create Heroku App**
   ```bash
   heroku create smart-pantry-api
   ```

2. **Set Environment Variables**
   ```bash
   heroku config:set SUPABASE_URL=your_url
   heroku config:set SUPABASE_ANON_KEY=your_anon_key
   heroku config:set SUPABASE_SERVICE_KEY=your_service_key
   heroku config:set JWT_SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))")
   heroku config:set JWT_ALGORITHM=HS256
   heroku config:set DATABASE_URL=your_database_url
   heroku config:set ENVIRONMENT=production
   ```

3. **Create Procfile**
   ```bash
   echo "web: uvicorn main:app --host 0.0.0.0 --port \$PORT" > Procfile
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

### Option 3: DigitalOcean App Platform

1. Create a new app in DigitalOcean
2. Connect your GitHub repository
3. Select the `backend` folder as source directory
4. Add environment variables in the UI
5. Set build command: `pip install -r requirements.txt`
6. Set run command: `uvicorn main:app --host 0.0.0.0 --port 8080`
7. Deploy

## Frontend Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI** (optional)
   ```bash
   npm i -g vercel
   ```

2. **Deploy via GitHub** (easiest)
   - Push code to GitHub
   - Go to https://vercel.com
   - Click "New Project"
   - Import your repository
   - Select `frontend` as root directory
   - Add environment variables:
     - `NEXT_PUBLIC_API_URL` = your backend URL
     - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key
     - `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY` = your Unsplash key
   - Click "Deploy"

3. **Deploy via CLI**
   ```bash
   cd frontend
   vercel
   # Follow prompts
   vercel --prod
   ```

### Option 2: Netlify

1. **Create netlify.toml**
   ```toml
   [build]
     command = "npm run build"
     publish = ".next"

   [[plugins]]
     package = "@netlify/plugin-nextjs"
   ```

2. **Deploy**
   - Push to GitHub
   - Connect repository in Netlify
   - Set root directory to `frontend`
   - Add environment variables
   - Deploy

### Option 3: AWS Amplify

1. Go to AWS Amplify Console
2. Connect repository
3. Select `frontend` as root
4. Configure build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```
5. Add environment variables
6. Deploy

## Post-Deployment

### 1. Update CORS Settings

In `backend/main.py`, update CORS origins:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend-domain.vercel.app",
        "https://your-custom-domain.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 2. Test All Features

- [ ] Login with all three roles
- [ ] User can place orders
- [ ] Pantry receives orders in real-time
- [ ] Admin can view analytics
- [ ] Real-time updates work
- [ ] Images load correctly

### 3. Create Initial Users

You can use the pre-seeded users from the schema, or create new ones via the API:

```bash
curl -X POST https://your-api-url/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "securepassword",
    "role": "user"
  }'
```

### 4. Set Up Custom Domain (Optional)

**Vercel:**
1. Go to Project Settings > Domains
2. Add your custom domain
3. Follow DNS configuration instructions

**Railway:**
```bash
railway domain your-domain.com
```

### 5. Set Up SSL/HTTPS

Most platforms (Vercel, Netlify, Railway) provide automatic SSL certificates.

For custom setups:
1. Get SSL certificate (Let's Encrypt)
2. Configure your web server
3. Force HTTPS redirects

## Monitoring

### Backend Monitoring

Add error tracking (optional):
```bash
pip install sentry-sdk
```

In `main.py`:
```python
import sentry_sdk

sentry_sdk.init(
    dsn="your-sentry-dsn",
    traces_sample_rate=1.0,
)
```

### Frontend Monitoring

Vercel provides built-in analytics. For custom monitoring:

1. Add Vercel Analytics:
   ```bash
   npm install @vercel/analytics
   ```

2. In `app/layout.tsx`:
   ```tsx
   import { Analytics } from '@vercel/analytics/react'

   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           {children}
           <Analytics />
         </body>
       </html>
     )
   }
   ```

## Security Checklist

- [ ] Change default user passwords
- [ ] Set strong JWT secret
- [ ] Enable rate limiting on API
- [ ] Configure CORS properly
- [ ] Use HTTPS only
- [ ] Secure environment variables
- [ ] Enable Supabase RLS policies
- [ ] Set up database backups
- [ ] Monitor for suspicious activity

## Performance Optimization

### Backend
- Use connection pooling
- Enable caching for menu items
- Implement rate limiting
- Monitor API response times

### Frontend
- Enable Next.js image optimization
- Use CDN for static assets
- Implement proper caching headers
- Monitor Core Web Vitals

## Backup Strategy

### Database Backups

Supabase provides automatic backups. To manually backup:

1. Go to **Database** > **Backups**
2. Click "Create Backup"
3. Download backup for local storage

### Code Backups

- Keep code in GitHub
- Tag releases
- Maintain changelog

## Scaling

### When to Scale

Monitor these metrics:
- Response time > 500ms
- CPU usage > 70%
- Memory usage > 80%
- Error rate > 1%

### How to Scale

**Vertical Scaling:**
- Upgrade server tier in Railway/Heroku
- Increase database resources in Supabase

**Horizontal Scaling:**
- Deploy multiple backend instances
- Use load balancer
- Implement Redis for caching

## Troubleshooting

### Backend not accessible
- Check deployment logs
- Verify environment variables
- Test with curl or Postman
- Check firewall/security groups

### Frontend not loading
- Check build logs
- Verify API URL is correct
- Check browser console for errors
- Test API connection

### Database connection issues
- Verify DATABASE_URL format
- Check IP allowlist in Supabase
- Test connection with psql

### Real-time not working
- Ensure Realtime is enabled
- Check Supabase anon key
- Verify WebSocket connection
- Check browser compatibility

## Support

For issues:
1. Check logs (Railway, Vercel, Supabase)
2. Review error messages
3. Consult platform documentation
4. Open GitHub issue

## Cost Estimates

**Free Tier Suitable For:**
- Development
- Small teams (<10 users)
- Low traffic (<1000 orders/month)

**Estimated Production Costs:**
- Supabase Pro: $25/month
- Railway/Heroku: $7-20/month
- Vercel Pro: $20/month (optional)
- Total: ~$52-65/month

**Free Alternatives:**
- Supabase Free: 500MB database, 2GB bandwidth
- Railway Free: $5 credit/month
- Vercel Free: Unlimited hobby projects

## Maintenance

### Regular Tasks
- Review logs weekly
- Update dependencies monthly
- Backup database weekly
- Monitor performance metrics
- Review security updates

### Updates
```bash
# Backend
pip install --upgrade -r requirements.txt

# Frontend
npm update
npm audit fix
```

## Rollback Procedure

If deployment fails:

**Vercel:**
1. Go to Deployments
2. Find last working deployment
3. Click "Promote to Production"

**Railway:**
```bash
railway rollback
```

**Database:**
1. Go to Supabase Backups
2. Restore previous backup
3. Re-run migrations if needed
