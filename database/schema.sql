-- Smart Pantry Order Management System - Database Schema
-- PostgreSQL/Supabase Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_location ON orders(location);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);

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
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

-- RLS Policies for orders table
CREATE POLICY "Users can view their own orders" ON orders
    FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Pantry and admin can view all orders" ON orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id::text = auth.uid()::text
            AND role IN ('pantry', 'admin')
        )
    );

CREATE POLICY "Users can create orders" ON orders
    FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Pantry can update order status" ON orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id::text = auth.uid()::text
            AND role IN ('pantry', 'admin')
        )
    );

-- RLS Policies for menu_items table
CREATE POLICY "Anyone can view menu items" ON menu_items
    FOR SELECT USING (true);

CREATE POLICY "Only admins can modify menu items" ON menu_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

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

-- Create sample users (passwords should be hashed in application)
-- Note: These are examples. In production, use the API to create users with proper password hashing
-- Default password for all: "password123" (hashed with bcrypt)
INSERT INTO users (username, password_hash, role) VALUES
    ('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEAB7K', 'admin'),
    ('pantry1', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEAB7K', 'pantry'),
    ('user1', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEAB7K', 'user')
ON CONFLICT (username) DO NOTHING;
