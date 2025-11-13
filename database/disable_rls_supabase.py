#!/usr/bin/env python3
"""
Disable Row Level Security on Supabase database tables
This allows direct PostgreSQL connections to work without RLS policies
"""

import psycopg2
import os
import sys

# Database URL from environment
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:Guddi#2019@db.uywfinwvdatmbmatdsjb.supabase.co:5432/postgres')

def disable_rls():
    """Disable RLS on all tables"""
    try:
        print("🔌 Connecting to database...")
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        print("🔓 Disabling Row Level Security...")

        # Disable RLS on tables
        cur.execute("ALTER TABLE users DISABLE ROW LEVEL SECURITY;")
        cur.execute("ALTER TABLE orders DISABLE ROW LEVEL SECURITY;")
        cur.execute("ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;")

        print("🗑️  Dropping RLS policies...")

        # Drop all RLS policies
        policies = [
            ("users", "Users can view their own data"),
            ("users", "Admins can view all users"),
            ("orders", "Users can view their own orders"),
            ("orders", "Pantry and admin can view all orders"),
            ("orders", "Users can create orders"),
            ("orders", "Pantry can update order status"),
            ("menu_items", "Anyone can view menu items"),
            ("menu_items", "Only admins can modify menu items"),
        ]

        for table, policy in policies:
            try:
                cur.execute(f'DROP POLICY IF EXISTS "{policy}" ON {table};')
            except Exception as e:
                print(f"⚠️  Could not drop policy '{policy}' on {table}: {e}")

        conn.commit()

        print("✅ RLS disabled successfully!")
        print("\n📊 Checking tables...")

        # Check table counts
        cur.execute("SELECT COUNT(*) FROM users;")
        users_count = cur.fetchone()[0]
        print(f"   Users: {users_count}")

        cur.execute("SELECT COUNT(*) FROM menu_items;")
        menu_count = cur.fetchone()[0]
        print(f"   Menu Items: {menu_count}")

        cur.execute("SELECT COUNT(*) FROM orders;")
        orders_count = cur.fetchone()[0]
        print(f"   Orders: {orders_count}")

        cur.close()
        conn.close()

        print("\n✨ Database is now ready for use!")
        print("   Orders should now be created and displayed correctly.")

    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        print(f"   Error code: {e.pgcode}")
        print(f"   Error message: {e.pgerror}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("=" * 60)
    print("  Disable RLS on Supabase Database")
    print("=" * 60)
    print()
    disable_rls()
