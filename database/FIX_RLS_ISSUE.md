# Fix for Orders Not Showing Up

## Problem
Orders created by users are not appearing in the pantry or admin dashboards.

## Root Cause
Row Level Security (RLS) is enabled on your Supabase database. RLS policies use `auth.uid()` which only works with Supabase's built-in authentication. Since we're using JWT-based authentication in the application, the RLS policies are blocking all database operations.

## Solution: Disable RLS

You have **two options**:

---

### Option 1: Disable RLS via Supabase Dashboard (RECOMMENDED)

1. Go to your Supabase Dashboard: https://app.supabase.com/project/uywfinwvdatmbmatdsjb

2. Click on **SQL Editor** in the left sidebar

3. Copy and paste this SQL script:

```sql
-- Disable Row Level Security
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;

-- Drop all RLS policies
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Pantry and admin can view all orders" ON orders;
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Pantry can update order status" ON orders;
DROP POLICY IF EXISTS "Anyone can view menu items" ON menu_items;
DROP POLICY IF EXISTS "Only admins can modify menu items" ON menu_items;

-- Verify the fix
SELECT 'RLS disabled successfully!' as status;
SELECT COUNT(*) as total_orders FROM orders;
```

4. Click **RUN** button

5. You should see "RLS disabled successfully!" message

6. Restart your backend server if it's running

---

### Option 2: Run Python Script (If you have network access)

```bash
cd /home/user/SMART-ORDER
python3 database/disable_rls_supabase.py
```

---

## After Disabling RLS

1. **Restart your backend server:**
   ```bash
   cd backend
   python main.py
   ```

2. **Test the order flow:**
   - Login as a user
   - Place an order
   - Login as pantry staff
   - Check if the order appears

3. **Orders should now:**
   - Be successfully created by users
   - Appear in pantry dashboard for processing
   - Show up in admin dashboard analytics

---

## Why This Happened

The previous setup used Supabase's authentication (`auth.uid()`), but the migration to local JWT-based auth didn't remove the RLS policies. Since there's no `auth.uid()` in our JWT setup, all database operations were being blocked by RLS.

## Security Note

Since we disabled RLS, make sure your application-level authentication (JWT tokens) is properly implemented to restrict access. The backend code already handles this:
- Users can only see their own orders
- Pantry/Admin can see all orders
- Authentication is required for all endpoints

---

## Alternative: Switch to Fully Local PostgreSQL

If you want to use a truly local PostgreSQL database instead of Supabase:

1. Run the setup script:
   ```bash
   cd /home/user/SMART-ORDER
   ./database/setup_local_db.sh
   ```

2. Update `backend/.env`:
   ```env
   DATABASE_URL=postgresql://postgres:password123@localhost:5432/smart_pantry
   ```

3. Run the migration:
   ```bash
   cd backend
   python database/migrate.py
   ```
