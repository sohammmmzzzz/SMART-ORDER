# 🚨 Emergency Credential Rotation Guide

Your credentials were exposed in GitHub. Follow these steps IMMEDIATELY to secure your application.

## What Was Exposed

The following information was publicly visible in your GitHub repository:

- ✅ Supabase Project URL: `https://uywfinwvdatmbmatdsjb.supabase.co`
- ✅ Supabase Anon Key
- ✅ Database Password: `Guddi#2019`
- ✅ Database connection string with username and password

## ⚠️ Why This Is Serious

Anyone who saw your GitHub repo could:
- Access your Supabase database
- Read all your data (users, orders, etc.)
- Modify or delete data
- Create fake users
- Potentially access other services using the same password

---

## 🔧 STEP-BY-STEP FIX (Do This NOW)

### Step 1: Change Your Supabase Database Password

1. **Go to Supabase Dashboard**: https://supabase.com
2. Click on your project: `uywfinwvdatmbmatdsjb`
3. Click **Settings** → **Database**
4. Scroll down to **Database Password**
5. Click **Generate new password**
6. **SAVE THE NEW PASSWORD** securely (use a password manager!)
7. Click **Update**

### Step 2: Get Your MISSING Keys

Now let's get the keys you need (including the service_role key):

1. In Supabase, go to **Settings** → **API**
2. You'll see this page:

```
Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Project URL
┌─────────────────────────────────────────┐
│ https://uywfinwvdatmbmatdsjb.supabase.co│ [Copy]
└─────────────────────────────────────────┘

Project API keys
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

anon public (This key is safe to use in a browser)
┌─────────────────────────────────────────┐
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVC...  │ [Copy]
└─────────────────────────────────────────┘

service_role ⚠️ Never expose publicly
This key has the ability to bypass Row Level Security
┌─────────────────────────────────────────┐
│ ••••••••••••••••••••••••••••••••••••    │ [Reveal] [Copy]
└─────────────────────────────────────────┘
```

3. **Click "Reveal"** next to `service_role`
4. **Copy ALL THREE** values:
   - Project URL
   - anon public key
   - service_role key (this is what you're missing!)

### Step 3: Generate a JWT Secret

Run this command in your terminal:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the output - this is your JWT secret.

### Step 4: Create Your LOCAL .env Files

**Backend (.env):**

Create `backend/.env` on your LOCAL machine (NOT in git):

```bash
cd backend
cat > .env << 'EOF'
SUPABASE_URL=https://uywfinwvdatmbmatdsjb.supabase.co
SUPABASE_ANON_KEY=[paste your NEW anon key here]
SUPABASE_SERVICE_KEY=[paste your service_role key here - this is what you were missing!]
JWT_SECRET_KEY=[paste your generated JWT secret here]
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DATABASE_URL=postgresql://postgres:[your NEW password]@db.uywfinwvdatmbmatdsjb.supabase.co:5432/postgres
ENVIRONMENT=development
EOF
```

**Frontend (.env.local):**

Create `frontend/.env.local` on your LOCAL machine:

```bash
cd frontend
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://uywfinwvdatmbmatdsjb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[paste your NEW anon key here]
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=[optional - your Unsplash key]
EOF
```

### Step 5: Update GitHub Secrets (for CI/CD)

Go to your GitHub repository: **Settings** → **Secrets and variables** → **Actions**

Update/Add these secrets with your NEW values:

1. `RAILWAY_TOKEN` - (Keep existing if you haven't created Railway yet)
2. `VERCEL_TOKEN` - (Keep existing if you haven't created Vercel yet)
3. `VERCEL_ORG_ID` - (Keep existing)
4. `VERCEL_PROJECT_ID` - (Keep existing)

When you set up Railway and Vercel, add your NEW credentials there too!

---

## ✅ Verification Checklist

Before running your app, verify:

### Backend `.env` File Check:
```bash
cd backend
cat .env
```

Should show:
- [ ] `SUPABASE_URL` = starts with https://
- [ ] `SUPABASE_ANON_KEY` = starts with eyJ and is ~200+ characters
- [ ] `SUPABASE_SERVICE_KEY` = starts with eyJ and is ~200+ characters (NOT "your_service_role_key")
- [ ] `JWT_SECRET_KEY` = random string (NOT "your_jwt_secret_generate...")
- [ ] `DATABASE_URL` = has your NEW password (NOT "Guddi#2019")

### Frontend `.env.local` File Check:
```bash
cd frontend
cat .env.local
```

Should show:
- [ ] `NEXT_PUBLIC_API_URL` = http://localhost:8000
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = starts with https://
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = starts with eyJ

### Git Security Check:
```bash
git ls-files | grep "\.env"
```

Should show: **NOTHING** (or just .env.example files)

If you see `backend/.env` or `frontend/.env.local`, you did something wrong!

---

## 🧪 Test Your Setup

### Test Backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Visit: http://localhost:8000/health

Should see:
```json
{
  "status": "healthy",
  "environment": "development"
}
```

### Test Frontend:
```bash
cd frontend
npm install
npm run dev
```

Visit: http://localhost:3000

Should see: Login page!

### Test Database Connection:
```bash
cd backend
python -c "
from database import get_db
db = get_db()
result = db.table('users').select('*').limit(1).execute()
print('✅ Database connected!' if result.data else '❌ Connection failed')
"
```

Should see: `✅ Database connected!`

---

## 🔒 Security Best Practices Going Forward

### DO:
- ✅ Keep `.env` files LOCAL ONLY
- ✅ Use `.env.example` files as templates
- ✅ Use GitHub Secrets for CI/CD
- ✅ Use different passwords for dev/production
- ✅ Rotate credentials every 90 days
- ✅ Use a password manager
- ✅ Enable 2FA on all accounts

### DON'T:
- ❌ NEVER commit `.env` files to git
- ❌ NEVER share credentials in emails/chat
- ❌ NEVER use the same password twice
- ❌ NEVER expose service_role keys
- ❌ NEVER hardcode credentials in code

---

## 📞 If You Need Help

If something isn't working:

1. Check that ALL credentials are updated
2. Verify `.env` files are NOT in git: `git ls-files | grep .env`
3. Restart your terminal/IDE
4. Clear any cached credentials
5. Double-check for typos in your .env files

---

## 🎯 Summary

**What you had before:**
```env
SUPABASE_SERVICE_KEY=your_service_role_key  ← PLACEHOLDER - Won't work!
JWT_SECRET_KEY=your_jwt_secret...  ← PLACEHOLDER - Won't work!
DATABASE_URL=...Guddi#2019...  ← EXPOSED PASSWORD!
```

**What you need now:**
```env
SUPABASE_SERVICE_KEY=eyJhbGciOi...real_200+_char_key...  ← REAL KEY!
JWT_SECRET_KEY=abc123xyz789...  ← GENERATED SECRET!
DATABASE_URL=...your_NEW_password...  ← NEW PASSWORD!
```

---

## ✅ Final Check

Run this command to make sure everything is ready:

```bash
# Check backend .env exists locally
test -f backend/.env && echo "✅ Backend .env exists" || echo "❌ Create backend/.env"

# Check frontend .env exists locally
test -f frontend/.env.local && echo "✅ Frontend .env.local exists" || echo "❌ Create frontend/.env.local"

# Check .env is NOT in git
! git ls-files | grep -E "backend/.env$|frontend/.env.local$" && echo "✅ .env files NOT in git" || echo "❌ .env files still in git!"

# Check .gitignore has .env
grep -q "\.env" .gitignore && echo "✅ .env in .gitignore" || echo "❌ Add .env to .gitignore"
```

All should show ✅!

---

**Once you complete ALL steps above, your app will be secure and working!** 🎉
