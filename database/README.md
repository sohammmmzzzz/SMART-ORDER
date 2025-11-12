# Database Configuration Guide

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details:
   - Name: smart-pantry-order-system
   - Database Password: (create a strong password)
   - Region: (choose closest to you)

### 2. Run the Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the contents of `schema.sql`
4. Click **Run**

### 3. Get Your Credentials

From the Supabase dashboard, go to **Settings** > **API**:

- **URL**: Copy the "Project URL"
- **Anon Key**: Copy the "anon public" key
- **Service Role Key**: Copy the "service_role" key (keep this secret!)

### 4. Enable Realtime

1. Go to **Database** > **Replication**
2. Enable replication for the `orders` table
3. This allows real-time subscriptions

### 5. Configure Environment Variables

**Backend (.env):**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key
JWT_SECRET_KEY=your_random_secret_key_generate_this
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your_unsplash_access_key
```

### 6. Generate JWT Secret

Run this in your terminal:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 7. Get Unsplash API Key

1. Go to [unsplash.com/developers](https://unsplash.com/developers)
2. Create a new application
3. Copy your "Access Key"

## Default Users

After running the schema, these test users are available:

| Username | Password | Role |
|----------|----------|------|
| admin | password123 | admin |
| pantry1 | password123 | pantry |
| user1 | password123 | user |

**⚠️ IMPORTANT:** Change these passwords in production!

## Database Schema Overview

### Tables

1. **users** - User accounts with role-based access
2. **orders** - Order records with status tracking
3. **menu_items** - Available food/beverage items

### Enums

- **user_role**: user, pantry, admin
- **order_status**: pending, preparing, completed, cancelled

### Key Features

- UUID primary keys
- Row Level Security (RLS) policies
- Automatic timestamp updates
- Indexed columns for performance
- Realtime subscriptions enabled

## Troubleshooting

### Can't connect to database
- Check your DATABASE_URL format
- Ensure your IP is allowed in Supabase dashboard (Settings > Database > Connection Pooling)

### RLS policies blocking queries
- Make sure you're authenticated
- Verify user role matches the policy requirements

### Realtime not working
- Ensure replication is enabled for the tables
- Check that your anon key is correct
