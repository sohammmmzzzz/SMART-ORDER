#!/usr/bin/env python3
"""
Database Migration Script for Smart Pantry Order Management System
This script creates the database, tables, and seeds initial data using Python
"""

import sys
import hashlib
import secrets
import base64
import psycopg2
from psycopg2 import sql
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Database configuration
DB_NAME = "smart_pantry_db"
DB_USER = "postgres"
DB_PASSWORD = "postgres"  # Change this to your PostgreSQL password
DB_HOST = "localhost"
DB_PORT = "5432"


def get_password_hash(password: str) -> str:
    """
    Generate password hash using PBKDF2-HMAC-SHA256

    Returns hash in format: algorithm$iterations$salt$hash
    """
    # Generate a random salt
    salt = secrets.token_bytes(32)

    # Number of iterations (100,000 is recommended minimum)
    iterations = 100000

    # Hash the password
    hash_bytes = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt,
        iterations
    )

    # Encode to base64 for storage
    salt_b64 = base64.b64encode(salt).decode('utf-8')
    hash_b64 = base64.b64encode(hash_bytes).decode('utf-8')

    # Return in storable format
    return f'pbkdf2_sha256${iterations}${salt_b64}${hash_b64}'


def connect_to_postgres():
    """Connect to PostgreSQL server (postgres database)"""
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        return conn
    except Exception as e:
        print(f"❌ Error connecting to PostgreSQL: {e}")
        sys.exit(1)


def connect_to_app_db():
    """Connect to application database"""
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        return conn
    except Exception as e:
        print(f"❌ Error connecting to database: {e}")
        sys.exit(1)


def create_database():
    """Create the application database"""
    print("🔨 Creating database...")
    conn = connect_to_postgres()
    cursor = conn.cursor()

    try:
        # Drop database if exists
        cursor.execute(f"DROP DATABASE IF EXISTS {DB_NAME};")
        print(f"  ✓ Dropped existing database (if any)")

        # Create database
        cursor.execute(f"CREATE DATABASE {DB_NAME};")
        print(f"  ✓ Created database: {DB_NAME}")

    except Exception as e:
        print(f"❌ Error creating database: {e}")
        sys.exit(1)
    finally:
        cursor.close()
        conn.close()


def create_extensions():
    """Create required PostgreSQL extensions"""
    print("🔧 Creating extensions...")
    conn = connect_to_app_db()
    cursor = conn.cursor()

    try:
        cursor.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        conn.commit()
        print("  ✓ Created uuid-ossp extension")
    except Exception as e:
        print(f"❌ Error creating extensions: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()


def create_enums():
    """Create ENUM types"""
    print("📋 Creating ENUM types...")
    conn = connect_to_app_db()
    cursor = conn.cursor()

    try:
        # User role enum
        cursor.execute("""
            DO $$ BEGIN
                CREATE TYPE user_role AS ENUM ('user', 'pantry', 'admin');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """)

        # Order status enum
        cursor.execute("""
            DO $$ BEGIN
                CREATE TYPE order_status AS ENUM ('pending', 'preparing', 'completed', 'cancelled');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """)

        conn.commit()
        print("  ✓ Created user_role and order_status enums")
    except Exception as e:
        print(f"❌ Error creating enums: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()


def create_tables():
    """Create database tables"""
    print("📊 Creating tables...")
    conn = connect_to_app_db()
    cursor = conn.cursor()

    try:
        # Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                username VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role user_role NOT NULL DEFAULT 'user',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)
        print("  ✓ Created users table")

        # Menu items table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS menu_items (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                category VARCHAR(100) NOT NULL,
                name VARCHAR(255) NOT NULL,
                available BOOLEAN DEFAULT true,
                image_url VARCHAR(500),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)
        print("  ✓ Created menu_items table")

        # Orders table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                items JSONB NOT NULL,
                location VARCHAR(255) NOT NULL,
                status order_status NOT NULL DEFAULT 'pending',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                completed_at TIMESTAMP WITH TIME ZONE,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)
        print("  ✓ Created orders table")

        conn.commit()
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()


def create_indexes():
    """Create database indexes"""
    print("🔍 Creating indexes...")
    conn = connect_to_app_db()
    cursor = conn.cursor()

    try:
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_orders_location ON orders(location);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);")

        conn.commit()
        print("  ✓ Created all indexes")
    except Exception as e:
        print(f"❌ Error creating indexes: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()


def create_triggers():
    """Create database triggers"""
    print("⚡ Creating triggers...")
    conn = connect_to_app_db()
    cursor = conn.cursor()

    try:
        # Create trigger function
        cursor.execute("""
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        """)

        # Create triggers for each table
        cursor.execute("""
            DROP TRIGGER IF EXISTS update_users_updated_at ON users;
            CREATE TRIGGER update_users_updated_at
                BEFORE UPDATE ON users
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        """)

        cursor.execute("""
            DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
            CREATE TRIGGER update_orders_updated_at
                BEFORE UPDATE ON orders
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        """)

        cursor.execute("""
            DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
            CREATE TRIGGER update_menu_items_updated_at
                BEFORE UPDATE ON menu_items
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        """)

        conn.commit()
        print("  ✓ Created update triggers")
    except Exception as e:
        print(f"❌ Error creating triggers: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()


def seed_data():
    """Insert initial data"""
    print("🌱 Seeding initial data...")
    conn = connect_to_app_db()
    cursor = conn.cursor()

    try:
        # Insert menu items
        menu_items = [
            ('TEAS', 'Ginger Tea', True, 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400'),
            ('TEAS', 'Green Tea', True, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400'),
            ('TEAS', 'Masala Tea', True, 'https://images.unsplash.com/photo-1597318163218-1df6aa03e580?w=400'),
            ('COFFEE', 'Cappuccino', True, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400'),
            ('COFFEE', 'Latte', True, 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=400'),
            ('COFFEE', 'Espresso', True, 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400'),
            ('COFFEE', 'Black Coffee', True, 'https://images.unsplash.com/photo-1505778276668-26b3ff7af103?w=400'),
        ]

        for item in menu_items:
            cursor.execute("""
                INSERT INTO menu_items (category, name, available, image_url)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT DO NOTHING;
            """, item)

        print(f"  ✓ Inserted {len(menu_items)} menu items")

        # Insert default users
        # Generate password hash for "password123" using PBKDF2
        password_hash = get_password_hash("password123")

        users = [
            ('admin', password_hash, 'admin'),
            ('pantry1', password_hash, 'pantry'),
            ('user1', password_hash, 'user'),
        ]

        for user in users:
            cursor.execute("""
                INSERT INTO users (username, password_hash, role)
                VALUES (%s, %s, %s)
                ON CONFLICT (username) DO NOTHING;
            """, user)

        print(f"  ✓ Inserted {len(users)} default users")

        conn.commit()
    except Exception as e:
        print(f"❌ Error seeding data: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()


def verify_installation():
    """Verify the database setup"""
    print("\n🔍 Verifying installation...")
    conn = connect_to_app_db()
    cursor = conn.cursor()

    try:
        # Count records in each table
        cursor.execute("SELECT COUNT(*) FROM users;")
        user_count = cursor.fetchone()[0]
        print(f"  ✓ Users table: {user_count} records")

        cursor.execute("SELECT COUNT(*) FROM menu_items;")
        menu_count = cursor.fetchone()[0]
        print(f"  ✓ Menu items table: {menu_count} records")

        cursor.execute("SELECT COUNT(*) FROM orders;")
        order_count = cursor.fetchone()[0]
        print(f"  ✓ Orders table: {order_count} records")

    except Exception as e:
        print(f"❌ Error verifying installation: {e}")
    finally:
        cursor.close()
        conn.close()


def main():
    """Main migration function"""
    print("=" * 60)
    print("🚀 Smart Pantry Database Migration")
    print("=" * 60)
    print()

    # Run migration steps
    create_database()
    create_extensions()
    create_enums()
    create_tables()
    create_indexes()
    create_triggers()
    seed_data()
    verify_installation()

    print()
    print("=" * 60)
    print("✅ Migration completed successfully!")
    print("=" * 60)
    print()
    print(f"📊 Database: {DB_NAME}")
    print(f"🔗 Connection: postgresql://{DB_USER}:****@{DB_HOST}:{DB_PORT}/{DB_NAME}")
    print()
    print("👥 Default users:")
    print("   • admin / password123 (Admin)")
    print("   • pantry1 / password123 (Pantry)")
    print("   • user1 / password123 (User)")
    print()
    print("⚠️  IMPORTANT: Change default passwords in production!")
    print()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Migration cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Migration failed: {e}")
        sys.exit(1)
