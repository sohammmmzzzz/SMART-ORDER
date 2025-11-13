# Local PostgreSQL Setup Guide

This guide will help you set up the Smart Pantry Order Management System with a local PostgreSQL database.

## Prerequisites

- **PostgreSQL 12+** installed on your machine
- **Python 3.11+** for the migration script
- **Node.js 18+** for the frontend

## Step 1: Install PostgreSQL

### macOS (using Homebrew)
```bash
brew install postgresql@15
brew services start postgresql@15
```

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Windows
Download and install from: https://www.postgresql.org/download/windows/

Or use WSL2 with Ubuntu instructions above.

### Verify Installation
```bash
psql --version
# Should show: psql (PostgreSQL) 15.x or higher
```

## Step 2: Configure PostgreSQL

### Set PostgreSQL Password (if needed)
```bash
# Switch to postgres user
sudo -u postgres psql

# In psql prompt:
ALTER USER postgres WITH PASSWORD 'postgres';
\q
```

### Allow Local Connections
Edit `pg_hba.conf`:

```bash
# Find the file
sudo find / -name pg_hba.conf 2>/dev/null

# Common locations:
# macOS: /opt/homebrew/var/postgresql@15/pg_hba.conf
# Linux: /etc/postgresql/15/main/pg_hba.conf
```

Ensure these lines exist:
```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                trust
host    all             postgres        127.0.0.1/32            md5
host    all             postgres        ::1/128                 md5
```

Restart PostgreSQL after changes:
```bash
# macOS
brew services restart postgresql@15

# Linux
sudo systemctl restart postgresql
```

## Step 3: Run Database Migration

### Option A: Using SQL Script (Recommended)

```bash
cd database

# Run the migration
psql -U postgres -f migration.sql

# You should see:
# ✅ Database setup completed successfully!
```

### Option B: Using Python Script

1. **Install psycopg2:**
```bash
pip install psycopg2-binary
```

2. **Update database credentials** in `migrate.py` (lines 11-14):
```python
DB_NAME = "smart_pantry_db"
DB_USER = "postgres"
DB_PASSWORD = "postgres"  # Your PostgreSQL password
DB_HOST = "localhost"
DB_PORT = "5432"
```

3. **Run the migration:**
```bash
cd database
python migrate.py
```

You should see:
```
🚀 Smart Pantry Database Migration
====================================================
🔨 Creating database...
✓ Created database: smart_pantry_db
🔧 Creating extensions...
✓ Created uuid-ossp extension
📋 Creating ENUM types...
✓ Created user_role and order_status enums
📊 Creating tables...
✓ Created users table
✓ Created menu_items table
✓ Created orders table
🔍 Creating indexes...
✓ Created all indexes
⚡ Creating triggers...
✓ Created update triggers
🌱 Seeding initial data...
✓ Inserted 7 menu items
✓ Inserted 3 default users

🔍 Verifying installation...
✓ Users table: 3 records
✓ Menu items table: 7 records
✓ Orders table: 0 records

====================================================
✅ Migration completed successfully!
====================================================
```

## Step 4: Verify Database Setup

### Connect to PostgreSQL
```bash
psql -U postgres -d smart_pantry_db
```

### Check Tables
```sql
\dt

-- Should show:
--  Schema |    Name     | Type  |  Owner
-- --------+-------------+-------+----------
--  public | menu_items  | table | postgres
--  public | orders      | table | postgres
--  public | users       | table | postgres
```

### Check Data
```sql
-- View users
SELECT username, role FROM users;

-- View menu items
SELECT category, name FROM menu_items;

-- Exit
\q
```

## Step 5: Configure Backend

### Create `.env` file:
```bash
cd backend
cp .env.example .env
```

### Edit `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smart_pantry_db
JWT_SECRET_KEY=<generate_this>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
ENVIRONMENT=development
```

### Generate JWT Secret:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the output and paste it as `JWT_SECRET_KEY` in your `.env` file.

### Install Dependencies:
```bash
pip install -r requirements.txt
```

### Test Backend:
```bash
uvicorn main:app --reload
```

Visit http://localhost:8000 - you should see:
```json
{
  "message": "Smart Pantry Order Management System API",
  "version": "1.0.0",
  "docs": "/docs",
  "status": "running"
}
```

## Step 6: Configure Frontend

### Create `.env.local` file:
```bash
cd frontend
cp .env.example .env.local
```

### Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your_unsplash_key
```

### Install Dependencies:
```bash
npm install
```

### Test Frontend:
```bash
npm run dev
```

Visit http://localhost:3000 - you should see the login page!

## Step 7: Test the Application

### Test Accounts

| Username | Password | Role |
|----------|----------|------|
| admin | password123 | Admin |
| pantry1 | password123 | Pantry |
| user1 | password123 | User |

### Test Flow

1. **Login as user1**:
   - Select location
   - Browse menu
   - Place an order

2. **Login as pantry1** (new browser/incognito):
   - View pending orders
   - Mark order as complete

3. **Login as admin** (new browser/incognito):
   - View analytics dashboard
   - See order statistics

## Troubleshooting

### Error: "connection refused"
```bash
# Check if PostgreSQL is running
pg_isready

# If not running, start it:
# macOS:
brew services start postgresql@15

# Linux:
sudo systemctl start postgresql
```

### Error: "authentication failed"
```bash
# Reset postgres password
sudo -u postgres psql
ALTER USER postgres WITH PASSWORD 'postgres';
\q

# Update DATABASE_URL in backend/.env
```

### Error: "database does not exist"
```bash
# Re-run migration
cd database
psql -U postgres -f migration.sql
```

### Error: "role 'postgres' does not exist"
```bash
# Create postgres user
createuser -s postgres
```

### Error: "psycopg2" module not found
```bash
pip install psycopg2-binary
```

### Backend can't connect to database
1. Check DATABASE_URL format in `.env`
2. Verify PostgreSQL is running: `pg_isready`
3. Test connection manually:
   ```bash
   psql -U postgres -d smart_pantry_db -c "SELECT 1;"
   ```

### Frontend shows "Network Error"
1. Ensure backend is running on port 8000
2. Check NEXT_PUBLIC_API_URL in `.env.local`
3. Check browser console for CORS errors

## Database Management

### View Logs
```bash
# macOS (Homebrew)
tail -f /opt/homebrew/var/log/postgresql@15.log

# Linux
sudo journalctl -u postgresql -f
```

### Backup Database
```bash
pg_dump -U postgres smart_pantry_db > backup.sql
```

### Restore Database
```bash
psql -U postgres -d smart_pantry_db < backup.sql
```

### Reset Database (caution!)
```bash
dropdb -U postgres smart_pantry_db
cd database
psql -U postgres -f migration.sql
```

## Real-time Updates

Since we're not using Supabase Realtime, the app uses **polling** to check for updates:

- **Pantry Dashboard**: Polls every 5 seconds for new orders
- **Admin Dashboard**: Polls every 10 minutes for analytics

This provides a good balance between responsiveness and server load.

## Production Considerations

### Security
1. Change default user passwords
2. Use strong JWT secret
3. Enable SSL for PostgreSQL
4. Configure firewall rules
5. Use environment-specific credentials

### Performance
1. Add connection pooling (already configured)
2. Create additional indexes as needed
3. Monitor slow queries
4. Set up regular backups
5. Configure PostgreSQL for your workload

### Monitoring
1. Enable PostgreSQL logging
2. Monitor connection count
3. Track query performance
4. Set up alerts for errors
5. Regular health checks

## Next Steps

Once your local setup is working:

1. **Development**: Start building features!
2. **Testing**: Write tests for your endpoints
3. **Deployment**: Use the deployment guide for production
4. **Scaling**: Consider PostgreSQL replication for high availability

## Useful Commands

```bash
# Connect to database
psql -U postgres -d smart_pantry_db

# List databases
psql -U postgres -c "\l"

# List tables
psql -U postgres -d smart_pantry_db -c "\dt"

# View table structure
psql -U postgres -d smart_pantry_db -c "\d users"

# Count records
psql -U postgres -d smart_pantry_db -c "SELECT COUNT(*) FROM orders;"

# View recent orders
psql -U postgres -d smart_pantry_db -c "SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;"
```

## Support

For issues:
1. Check the troubleshooting section above
2. Review PostgreSQL logs
3. Check backend logs (FastAPI)
4. Check browser console (Frontend)
5. Open an issue on GitHub

---

**Happy Coding! 🚀**
