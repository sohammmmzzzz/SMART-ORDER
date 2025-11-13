-- PostgreSQL Migration Script for Smart Pantry Order Management System
-- Run this script to create the database, tables, and seed initial data

-- ============================================
-- DATABASE CREATION
-- ============================================

-- Connect to postgres database first
\c postgres

-- Drop database if exists (use with caution!)
DROP DATABASE IF EXISTS smart_pantry_db;

-- Create database
CREATE DATABASE smart_pantry_db;

-- Connect to the new database
\c smart_pantry_db

-- ============================================
-- EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'pantry', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'preparing', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- TABLES
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu Items table
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    available BOOLEAN DEFAULT true,
    image_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
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

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_location ON orders(location);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);

-- ============================================
-- TRIGGERS
-- ============================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
CREATE TRIGGER update_menu_items_updated_at
    BEFORE UPDATE ON menu_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA
-- ============================================

-- Insert sample menu items
INSERT INTO menu_items (category, name, available, image_url) VALUES
    -- Teas
    ('TEAS', 'Ginger Tea', true, 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400'),
    ('TEAS', 'Green Tea', true, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400'),
    ('TEAS', 'Masala Tea', true, 'https://images.unsplash.com/photo-1597318163218-1df6aa03e580?w=400'),

    -- Coffee
    ('COFFEE', 'Cappuccino', true, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400'),
    ('COFFEE', 'Latte', true, 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=400'),
    ('COFFEE', 'Espresso', true, 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400'),
    ('COFFEE', 'Black Coffee', true, 'https://images.unsplash.com/photo-1505778276668-26b3ff7af103?w=400')
ON CONFLICT DO NOTHING;

-- Insert sample users
-- IMPORTANT: This SQL file uses old bcrypt hashes for backward compatibility.
-- For NEW installations, please use migrate.py instead which generates proper PBKDF2 hashes.
-- Default password for all: "password123"
--
-- Note: These bcrypt hashes will NOT work with the new PBKDF2 authentication.
-- If you run this SQL script, you'll need to manually update passwords or use migrate.py.
INSERT INTO users (username, password_hash, role) VALUES
    ('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEAB7K', 'admin'),
    ('pantry1', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEAB7K', 'pantry'),
    ('user1', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEAB7K', 'user')
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================

-- Show created tables
\dt

-- Show table counts
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'menu_items', COUNT(*) FROM menu_items
UNION ALL
SELECT 'orders', COUNT(*) FROM orders;

-- Display success message
\echo '✅ Database setup completed successfully!'
\echo ''
\echo 'Database: smart_pantry_db'
\echo 'Tables: users, menu_items, orders'
\echo ''
\echo 'Default users created:'
\echo '  - admin / password123 (Admin)'
\echo '  - pantry1 / password123 (Pantry)'
\echo '  - user1 / password123 (User)'
\echo ''
\echo '⚠️  IMPORTANT: Change default passwords in production!'
