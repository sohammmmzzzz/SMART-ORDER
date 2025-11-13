-- Disable Row Level Security for local PostgreSQL
-- RLS is a Supabase feature that doesn't work with local PostgreSQL
-- since auth.uid() function doesn't exist

-- Disable RLS on all tables
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

-- Verify orders table is working
SELECT 'Orders table is now accessible without RLS' as status;
SELECT COUNT(*) as order_count FROM orders;
