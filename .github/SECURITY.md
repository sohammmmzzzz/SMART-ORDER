# Security Policy

## ⚠️ Important Security Notice

This project contains sensitive configuration files that should NEVER be committed to version control.

## Protected Files

The following files contain sensitive credentials and should NEVER be in Git:

- `backend/.env`
- `frontend/.env.local`
- `*.pem`
- `*.key`
- `credentials.json`

These files are already in `.gitignore` and should remain there.

## If You've Accidentally Committed Secrets

If you've accidentally committed `.env` files or secrets:

### 1. Remove from Git (Keep Local Copy)
```bash
# Remove from Git but keep locally
git rm --cached backend/.env
git rm --cached frontend/.env.local

# Commit the removal
git commit -m "Remove sensitive files from version control"
git push
```

### 2. Rotate All Credentials
If secrets were pushed to a public repository, you MUST rotate:
- Supabase keys (generate new ones)
- JWT secret (generate a new one)
- Unsplash API key (regenerate if needed)
- Any other API keys or secrets

### 3. Remove from Git History (Optional but Recommended)
```bash
# Install git-filter-repo
pip install git-filter-repo

# Remove file from entire history
git filter-repo --path backend/.env --invert-paths
git filter-repo --path frontend/.env.local --invert-paths

# Force push (WARNING: This rewrites history)
git push --force --all
```

## Proper Secret Management

### Development
- Use `.env` files locally (in `.gitignore`)
- Never share `.env` files directly
- Use environment variable templates (`.env.example`)

### Production
- Use GitHub Secrets for CI/CD
- Use platform-specific environment variables:
  - Railway: Variables tab
  - Vercel: Environment Variables
  - Heroku: Config Vars

## Required Secrets

### Backend
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_KEY` - Supabase service role key (HIGHLY SENSITIVE)
- `JWT_SECRET_KEY` - JWT signing key (generate with `secrets.token_urlsafe(32)`)
- `DATABASE_URL` - PostgreSQL connection string

### Frontend
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY` - Unsplash API key (optional)

## Security Best Practices

1. **Never hardcode credentials** in source code
2. **Use environment variables** for all sensitive data
3. **Rotate secrets regularly** (every 90 days recommended)
4. **Use different credentials** for development and production
5. **Enable 2FA** on all service accounts (GitHub, Supabase, etc.)
6. **Monitor access logs** for suspicious activity
7. **Use HTTPS only** in production
8. **Keep dependencies updated** to patch security vulnerabilities

## Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email the maintainer directly
3. Provide detailed information about the vulnerability
4. Wait for a response before public disclosure

## Security Checklist

- [ ] `.env` files are in `.gitignore`
- [ ] No secrets in Git history
- [ ] GitHub Secrets configured
- [ ] Production uses different secrets than development
- [ ] All secrets are rotated regularly
- [ ] HTTPS enforced in production
- [ ] CORS properly configured
- [ ] Database has Row Level Security enabled
- [ ] Rate limiting enabled on API
- [ ] Authentication tokens expire appropriately
- [ ] Password hashing uses bcrypt
- [ ] Input validation on all endpoints

## Additional Resources

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/auth-helpers/security)
