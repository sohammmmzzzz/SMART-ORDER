# Complete Setup Guide

This guide will walk you through setting up the Smart Pantry Order Management System from scratch.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Running the Application](#running-the-application)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.11+ ([Download](https://www.python.org/))
- **Git** ([Download](https://git-scm.com/))

### Required Accounts

- **Supabase** account ([Sign up](https://supabase.com))
- **Unsplash** API key ([Get key](https://unsplash.com/developers))

### Verify Installation

```bash
node --version  # Should be 18+
python --version  # Should be 3.11+
git --version
```

## Database Setup

### Step 1: Create Supabase Project

1. Go to https://supabase.com and sign in
2. Click **"New Project"**
3. Fill in the details:
   - **Name**: smart-pantry-system
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to you
4. Click **"Create new project"**
5. Wait 2-3 minutes for initialization

### Step 2: Run Database Schema

1. In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New Query"**
3. Open the file `database/schema.sql` from this repository
4. Copy all contents and paste into the SQL editor
5. Click **"Run"** (or press Ctrl+Enter)
6. You should see "Success. No rows returned"

### Step 3: Verify Tables

1. Click **"Table Editor"** in the left sidebar
2. You should see three tables:
   - users
   - orders
   - menu_items
3. Click on each table to verify they have data

### Step 4: Get API Credentials

1. Click **"Settings"** (gear icon) in the left sidebar
2. Click **"API"**
3. You'll need these values (keep them secret!):
   - **Project URL** (starts with https://)
   - **anon public** key (under "Project API keys")
   - **service_role** key (under "Project API keys")

### Step 5: Enable Realtime

1. Click **"Database"** in the left sidebar
2. Click **"Replication"**
3. Find the `orders` table
4. Toggle the switch to **ON** for Realtime
5. Click **"Enable"**

## Backend Setup

### Step 1: Navigate to Backend Directory

```bash
cd backend
```

### Step 2: Create Virtual Environment

**On macOS/Linux:**
```bash
python -m venv venv
source venv/bin/activate
```

**On Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

You should see `(venv)` in your terminal prompt.

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

This will install all required Python packages.

### Step 4: Configure Environment Variables

1. Copy the example env file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` in your text editor

3. Fill in your actual values:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_KEY=your_service_key_here
   JWT_SECRET_KEY=generate_this_below
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
   ENVIRONMENT=development
   ```

4. Generate JWT secret:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```
   Copy the output and paste as JWT_SECRET_KEY

### Step 5: Test Backend

```bash
uvicorn main:app --reload
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

Test it by opening http://localhost:8000 in your browser. You should see:
```json
{
  "message": "Smart Pantry Order Management System API",
  "version": "1.0.0",
  "docs": "/docs",
  "status": "running"
}
```

Visit http://localhost:8000/docs to see the API documentation.

## Frontend Setup

### Step 1: Navigate to Frontend Directory

Open a **new terminal window** (keep backend running) and:

```bash
cd frontend
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required Node packages (may take 2-3 minutes).

### Step 3: Configure Environment Variables

1. Copy the example env file:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` in your text editor

3. Fill in your actual values:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your_unsplash_key_here
   ```

### Step 4: Get Unsplash API Key (Optional)

1. Go to https://unsplash.com/developers
2. Click **"New Application"**
3. Accept the terms
4. Fill in application name and description
5. Copy your **Access Key**
6. Paste it in `.env.local`

Note: The app will work without Unsplash, but background images won't load.

### Step 5: Test Frontend

```bash
npm run dev
```

You should see:
```
▲ Next.js 14.2.15
- Local:        http://localhost:3000
- Ready in 2.3s
```

## Running the Application

### Both Terminals Should Be Running:

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Access the Application

Open your browser and go to: http://localhost:3000

You should see the login page!

## Testing

### Test Accounts

Use these pre-configured accounts:

| Username | Password | Role | Dashboard |
|----------|----------|------|-----------|
| admin | password123 | admin | Full analytics and management |
| pantry1 | password123 | pantry | View and complete orders |
| user1 | password123 | user | Place orders |

### Test Flow

1. **Login as User (user1/password123)**
   - You'll be redirected to `/user`
   - Select a location (e.g., "Conference 1")
   - Browse menu items
   - Click items to add to cart
   - Click "Place Order"
   - Confirm order (5-second countdown)
   - Watch preparation timer (15 minutes, but you can cancel for testing)

2. **Login as Pantry (pantry1/password123)**
   - Open in a new incognito/private window
   - You'll be redirected to `/pantry`
   - You should see the order you just placed
   - Navigate between orders with arrows
   - Click "Mark as Complete"
   - Order should disappear

3. **Login as Admin (admin/password123)**
   - Open in another incognito/private window
   - You'll be redirected to `/admin`
   - View analytics charts
   - See location distribution
   - Filter orders by location/status
   - Check hourly order distribution

### Test Real-time Updates

1. Keep pantry dashboard open
2. In another window, login as user and place an order
3. Pantry dashboard should automatically update with new order
4. No page refresh needed!

## Troubleshooting

### Backend Issues

**Error: `ModuleNotFoundError: No module named 'fastapi'`**
- Solution: Activate virtual environment and install dependencies
  ```bash
  source venv/bin/activate  # or venv\Scripts\activate on Windows
  pip install -r requirements.txt
  ```

**Error: `Could not validate credentials`**
- Solution: Check your .env file has correct Supabase credentials
- Verify JWT_SECRET_KEY is set

**Error: Connection refused to database**
- Solution: Check DATABASE_URL format
- Ensure Supabase project is active
- Verify database password is correct

### Frontend Issues

**Error: `npm command not found`**
- Solution: Install Node.js from https://nodejs.org/

**Error: `Cannot connect to API`**
- Solution: Ensure backend is running on port 8000
- Check NEXT_PUBLIC_API_URL in .env.local
- Verify no firewall blocking port 8000

**Error: Real-time updates not working**
- Solution: Check NEXT_PUBLIC_SUPABASE_URL and key in .env.local
- Verify Realtime is enabled for orders table in Supabase
- Check browser console for WebSocket errors

**Images not loading**
- Solution: Add Unsplash API key to .env.local
- Or use placeholder images by updating menu_items

### General Issues

**Port already in use**
- Backend (8000):
  ```bash
  # Find and kill process on port 8000
  # On macOS/Linux:
  lsof -ti:8000 | xargs kill -9
  # On Windows:
  netstat -ano | findstr :8000
  taskkill /PID [PID_NUMBER] /F
  ```

- Frontend (3000):
  ```bash
  # Use a different port
  npm run dev -- -p 3001
  ```

**CORS errors**
- Solution: Check backend CORS settings in main.py
- Ensure frontend URL is in allowed origins

**Database schema errors**
- Solution: Re-run schema.sql in Supabase SQL Editor
- Or manually create tables following schema

## Next Steps

Once everything is working:

1. **Customize the app**
   - Add more menu items in Supabase
   - Modify locations in frontend code
   - Adjust preparation time

2. **Create real users**
   - Change default passwords
   - Create accounts via API or Supabase dashboard

3. **Deploy to production**
   - Follow `docs/DEPLOYMENT.md`
   - Set up on Vercel, Railway, etc.

4. **Add features**
   - Order notifications
   - Email confirmations
   - Order modifications
   - Rating system

## Getting Help

If you're stuck:

1. Check error messages carefully
2. Review this guide step-by-step
3. Check browser console (F12)
4. Check backend logs in terminal
5. Verify all environment variables
6. Try with fresh database

## Quick Reference

### Start Development

```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
uvicorn main:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Stop Development

Press `Ctrl+C` in both terminals

### Reset Database

1. Go to Supabase SQL Editor
2. Run:
   ```sql
   DROP TABLE IF EXISTS orders CASCADE;
   DROP TABLE IF EXISTS users CASCADE;
   DROP TABLE IF EXISTS menu_items CASCADE;
   ```
3. Re-run schema.sql

### Environment Files

- Backend: `backend/.env`
- Frontend: `frontend/.env.local`
- Never commit these files!

## Success Checklist

- [ ] Supabase project created
- [ ] Database schema loaded
- [ ] Backend running without errors
- [ ] Frontend running without errors
- [ ] Can login as all three roles
- [ ] User can place orders
- [ ] Pantry receives orders
- [ ] Admin sees analytics
- [ ] Real-time updates work

If all checkboxes are checked, you're ready to go! 🎉
