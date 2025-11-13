#!/bin/bash

# Setup Local PostgreSQL Database for Smart Pantry Order System

set -e

echo "🗄️  Setting up local PostgreSQL database..."

# Database configuration
DB_NAME="smart_pantry"
DB_USER="postgres"
DB_PASSWORD="password123"
DB_HOST="localhost"
DB_PORT="5432"

echo "📦 Installing PostgreSQL if not present..."
# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL not found. Please install it first:"
    echo "Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    echo "Mac: brew install postgresql"
    exit 1
fi

echo "🚀 Starting PostgreSQL service..."
# Try different methods to start PostgreSQL
if command -v systemctl &> /dev/null; then
    sudo systemctl start postgresql || echo "Could not start with systemctl"
elif command -v service &> /dev/null; then
    sudo service postgresql start || echo "Could not start with service"
else
    pg_ctl -D /var/lib/postgresql/data start || echo "Could not start with pg_ctl"
fi

sleep 2

echo "🔧 Creating database and user..."
# Create database and user (run as postgres user)
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;" || true
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
sudo -u postgres psql -c "DROP USER IF EXISTS $DB_USER;" || true
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "ALTER DATABASE $DB_NAME OWNER TO $DB_USER;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

echo "📋 Creating schema..."
# Run schema creation
sudo -u postgres psql -d $DB_NAME -f "$(dirname "$0")/schema_local.sql"

echo "✅ Database setup complete!"
echo ""
echo "📝 Update your backend/.env file with:"
echo "DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""
echo "🔐 Run the migration script to create users:"
echo "cd backend && python database/migrate.py"
