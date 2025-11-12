# Finding Supabase Keys

## Quick Guide: Where to Find All Supabase Keys

### Step 1: Go to Your Supabase Project

1. Open https://supabase.com
2. Click on your project (e.g., "smart-pantry-system")

### Step 2: Navigate to API Settings

1. Click on **Settings** (gear icon) in the left sidebar
2. Click on **API** under Settings

### Step 3: Copy Your Keys

You'll see a section called **Project API keys**. You need THREE keys:

#### 1. Project URL
```
Location: At the top under "Project URL"
Example: https://abcdefghijk.supabase.co

Use for:
- SUPABASE_URL (backend)
- NEXT_PUBLIC_SUPABASE_URL (frontend)
```

#### 2. anon public (Public Key)
```
Location: Under "Project API keys" → "anon public"
Click "Copy" or click the key to reveal it

Starts with: eyJ...
This is SAFE to expose publicly

Use for:
- SUPABASE_ANON_KEY (backend)
- NEXT_PUBLIC_SUPABASE_ANON_KEY (frontend)
```

#### 3. service_role (Secret Key) ⚠️ MOST IMPORTANT
```
Location: Under "Project API keys" → "service_role"
Click "Reveal" then "Copy"

Starts with: eyJ...
⚠️ THIS IS SECRET - NEVER EXPOSE PUBLICLY

Use for:
- SUPABASE_SERVICE_KEY (backend ONLY)
```

## Visual Guide

In your Supabase dashboard, it looks like this:

```
Settings → API

Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Project URL
┌─────────────────────────────────────────┐
│ https://abcdefghijk.supabase.co        │ [Copy]
└─────────────────────────────────────────┘

Project API keys
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

anon public
This key is safe to use in a browser
┌─────────────────────────────────────────┐
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVC... │ [Copy]
└─────────────────────────────────────────┘

service_role
This key has the ability to bypass Row Level Security
⚠️ Never expose publicly
┌─────────────────────────────────────────┐
│ ••••••••••••••••••••••••••••••••••••    │ [Reveal] [Copy]
└─────────────────────────────────────────┘
```

## Why You Need service_role Key

The `service_role` key is required for the **backend** because:

1. **Bypasses Row Level Security (RLS)** - Backend needs admin access
2. **User Registration** - Create new users in the database
3. **Order Management** - Full CRUD operations without restrictions
4. **Admin Operations** - Access all data for analytics

Without it, your backend **will not work** properly because:
- ❌ User registration will fail
- ❌ Orders won't be created
- ❌ Admin endpoints will be blocked by RLS
- ❌ Database operations will fail

## Environment Variable Mapping

### Backend (.env)
```env
SUPABASE_URL=https://abcdefghijk.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...your_anon_key...
SUPABASE_SERVICE_KEY=eyJhbGc...your_service_key...  # ← THIS ONE!
JWT_SECRET_KEY=your_generated_secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
ENVIRONMENT=development
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your_anon_key...
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your_unsplash_key
```

Notice: Frontend does NOT use service_role key!

## Security Notes

### ⚠️ CRITICAL: service_role Key Security

The `service_role` key is **extremely sensitive** because:
- It bypasses ALL security rules
- It has full admin access to your database
- If leaked, anyone can read/write/delete ALL your data

**NEVER:**
- ❌ Commit it to GitHub
- ❌ Share it publicly
- ❌ Use it in frontend code
- ❌ Expose it in logs
- ❌ Send it in emails

**ALWAYS:**
- ✅ Keep it in `.env` files only
- ✅ Add `.env` to `.gitignore`
- ✅ Use GitHub Secrets for CI/CD
- ✅ Use Railway/Vercel environment variables for production
- ✅ Rotate it if compromised

## If You Can't Find service_role Key

If you don't see the `service_role` key:

1. **Reveal Hidden Keys**: Click the "Reveal" button
2. **Check Permissions**: Make sure you're the project owner
3. **Project Settings**: It should be under Settings → API

If it's truly missing (extremely rare):
1. Contact Supabase support
2. Or create a new project (free tier allows multiple projects)

## Testing Your Keys

### Test Backend Connection
```bash
cd backend
python -c "
from database import get_db
db = get_db()
result = db.table('users').select('*').limit(1).execute()
print('✅ Connection successful!' if result else '❌ Connection failed')
"
```

### Test Frontend Connection
```bash
cd frontend
node -e "
const { createClient } = require('@supabase/supabase-js');
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
client.from('menu_items').select('*').limit(1).then(r => console.log('✅ Connected!'));
"
```

## Quick Checklist

Backend needs:
- [ ] SUPABASE_URL
- [ ] SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_KEY ← **Don't skip this!**
- [ ] JWT_SECRET_KEY
- [ ] DATABASE_URL

Frontend needs:
- [ ] NEXT_PUBLIC_API_URL
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] NEXT_PUBLIC_UNSPLASH_ACCESS_KEY (optional)

## Need More Help?

Check these resources:
- [Supabase API Keys Documentation](https://supabase.com/docs/guides/api/api-keys)
- [Environment Variables Guide](../docs/SETUP_GUIDE.md)
- [Security Best Practices](../.github/SECURITY.md)
