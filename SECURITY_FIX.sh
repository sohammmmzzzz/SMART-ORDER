#!/bin/bash
# Emergency script to remove .env files from git

echo "🚨 REMOVING .env FILES FROM GIT..."

# Remove from current commit
git rm --cached backend/.env 2>/dev/null || true
git rm --cached frontend/.env.local 2>/dev/null || true

# Ensure they're in .gitignore
echo "" >> .gitignore
echo "# Environment variables (NEVER commit these!)" >> .gitignore
echo "backend/.env" >> .gitignore
echo "frontend/.env.local" >> .gitignore
echo "**/.env" >> .gitignore
echo "**/.env.local" >> .gitignore

echo "✅ .env files removed from git"
echo "⚠️  Now run these commands:"
echo ""
echo "git add .gitignore"
echo "git commit -m 'security: Remove .env files from version control'"
echo "git push origin claude/smart-pantry-order-system-011CV4ewkp1ByEQJ1jtyvRbs"
echo ""
echo "⚠️  THEN IMMEDIATELY:"
echo "1. Change your database password in Supabase"
echo "2. Regenerate your Supabase keys"
echo "3. Generate a new JWT secret"
