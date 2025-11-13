#!/usr/bin/env python3
"""
Initialize SQLite database for Smart Pantry Order System
Creates all tables, indexes, and populates with sample data
"""

import sqlite3
import sys
import os
import hashlib
import base64
import secrets
from datetime import datetime

# Add backend to path so we can import from it
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'backend', 'smart_pantry.db')

def get_password_hash(password: str) -> str:
    """Generate password hash using PBKDF2-HMAC-SHA256"""
    salt = secrets.token_bytes(32)
    iterations = 100000

    hash_bytes = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt,
        iterations
    )

    salt_b64 = base64.b64encode(salt).decode('utf-8')
    hash_b64 = base64.b64encode(hash_bytes).decode('utf-8')

    return f'pbkdf2_sha256${iterations}${salt_b64}${hash_b64}'

def init_database():
    """Initialize the database"""

    # Remove existing database
    if os.path.exists(DB_PATH):
        print(f"🗑️  Removing existing database: {DB_PATH}")
        os.remove(DB_PATH)

    print(f"🗄️  Creating new SQLite database: {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Users table
        print("📋 Creating users table...")
        cursor.execute("""
            CREATE TABLE users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('user', 'pantry', 'admin')) DEFAULT 'user',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("CREATE INDEX idx_users_username ON users(username)")

        # Menu Items table
        print("📋 Creating menu_items table...")
        cursor.execute("""
            CREATE TABLE menu_items (
                id TEXT PRIMARY KEY,
                category TEXT NOT NULL,
                name TEXT NOT NULL,
                available INTEGER DEFAULT 1,
                image_url TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("CREATE INDEX idx_menu_items_category ON menu_items(category)")

        # Orders table
        print("📋 Creating orders table...")
        cursor.execute("""
            CREATE TABLE orders (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                items TEXT NOT NULL,
                location TEXT NOT NULL,
                status TEXT NOT NULL CHECK(status IN ('pending', 'preparing', 'completed', 'cancelled')) DEFAULT 'pending',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                completed_at TEXT,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)

        cursor.execute("CREATE INDEX idx_orders_user_id ON orders(user_id)")
        cursor.execute("CREATE INDEX idx_orders_status ON orders(status)")
        cursor.execute("CREATE INDEX idx_orders_created_at ON orders(created_at DESC)")
        cursor.execute("CREATE INDEX idx_orders_location ON orders(location)")

        # Create triggers for updated_at
        print("📋 Creating triggers...")

        cursor.execute("""
            CREATE TRIGGER update_users_updated_at
            AFTER UPDATE ON users
            BEGIN
                UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
            END
        """)

        cursor.execute("""
            CREATE TRIGGER update_orders_updated_at
            AFTER UPDATE ON orders
            BEGIN
                UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
            END
        """)

        cursor.execute("""
            CREATE TRIGGER update_menu_items_updated_at
            AFTER UPDATE ON menu_items
            BEGIN
                UPDATE menu_items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
            END
        """)

        # Insert sample menu items
        print("🍽️  Adding sample menu items...")

        import uuid
        menu_items = [
            # Teas
            ('TEAS', 'Ginger Tea', 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400'),
            ('TEAS', 'Green Tea', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400'),
            ('TEAS', 'Masala Tea', 'https://images.unsplash.com/photo-1597318163218-1df6aa03e580?w=400'),

            # Coffee
            ('COFFEE', 'Cappuccino', 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400'),
            ('COFFEE', 'Latte', 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=400'),
            ('COFFEE', 'Espresso', 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400'),
            ('COFFEE', 'Black Coffee', 'https://images.unsplash.com/photo-1505778276668-26b3ff7af103?w=400'),
        ]

        for category, name, image_url in menu_items:
            cursor.execute("""
                INSERT INTO menu_items (id, category, name, available, image_url)
                VALUES (?, ?, ?, 1, ?)
            """, (str(uuid.uuid4()), category, name, image_url))

        # Insert sample users
        print("👥 Creating sample users...")

        password_hash = get_password_hash("password123")

        users = [
            (str(uuid.uuid4()), 'admin', password_hash, 'admin'),
            (str(uuid.uuid4()), 'pantry1', password_hash, 'pantry'),
            (str(uuid.uuid4()), 'user1', password_hash, 'user'),
        ]

        for user_id, username, pwd_hash, role in users:
            cursor.execute("""
                INSERT INTO users (id, username, password_hash, role)
                VALUES (?, ?, ?, ?)
            """, (user_id, username, pwd_hash, role))

        conn.commit()

        # Verify
        print("\n✅ Database created successfully!")
        print("\n📊 Database Statistics:")

        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        print(f"   Users: {user_count}")

        cursor.execute("SELECT COUNT(*) FROM menu_items")
        menu_count = cursor.fetchone()[0]
        print(f"   Menu Items: {menu_count}")

        cursor.execute("SELECT COUNT(*) FROM orders")
        order_count = cursor.fetchone()[0]
        print(f"   Orders: {order_count}")

        print("\n🔐 Sample User Credentials:")
        print("   Username: admin    | Password: password123 | Role: Admin")
        print("   Username: pantry1  | Password: password123 | Role: Pantry")
        print("   Username: user1    | Password: password123 | Role: User")

        print(f"\n💾 Database file: {DB_PATH}")
        print("\n🚀 Ready to run the backend!")
        print("   cd backend && python main.py")

    except Exception as e:
        print(f"\n❌ Error creating database: {e}")
        conn.rollback()
        sys.exit(1)
    finally:
        conn.close()

if __name__ == "__main__":
    print("=" * 70)
    print("  Smart Pantry Order System - SQLite Database Initialization")
    print("=" * 70)
    print()
    init_database()
