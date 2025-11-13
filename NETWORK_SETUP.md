# Network Setup Guide - Smart Pantry Order System

This guide explains how to run the Smart Pantry application on your local network so other devices can access it.

## Prerequisites

1. Find your computer's network IP address:
   - **Linux/Mac**: Run `ifconfig` or `ip addr` and look for your local IP (usually starts with 192.168.x.x or 10.x.x.x)
   - **Windows**: Run `ipconfig` and look for IPv4 Address

Example: `192.168.1.100`

## Backend Setup (Already Configured)

The backend is already configured to accept network connections!

### Current Configuration:
- **Host**: `0.0.0.0` (accepts connections from any IP)
- **Port**: `8000`
- **CORS**: Allows all origins (`*`)

### How to Run:
```bash
cd backend
python3 main.py
```

The backend will be accessible at:
- **Local**: http://localhost:8000
- **Network**: http://YOUR_IP:8000 (e.g., http://192.168.1.100:8000)

## Frontend Setup

### Step 1: Update Environment Variable

Edit `frontend/.env.local` and replace `YOUR_NETWORK_IP` with your actual network IP:

```bash
# Before:
NEXT_PUBLIC_API_URL=http://localhost:8000

# After (example with IP 192.168.1.100):
NEXT_PUBLIC_API_URL=http://192.168.1.100:8000
```

### Step 2: Run Frontend on Network

Use the network script to allow access from other devices:

```bash
cd frontend
npm run dev:network
```

This runs Next.js on `0.0.0.0:3000`, making it accessible to all devices on your network.

## Accessing the Application

### From the Host Computer:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000

### From Other Devices on the Network:
- **Frontend**: http://YOUR_IP:3000 (e.g., http://192.168.1.100:3000)
- **Backend API**: http://YOUR_IP:8000 (e.g., http://192.168.1.100:8000)

## Quick Start Commands

### Option 1: Local Development Only
```bash
# Terminal 1 - Backend
cd backend
python3 main.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Access at: http://localhost:3000

### Option 2: Network Access (Recommended)
```bash
# Terminal 1 - Backend (already supports network)
cd backend
python3 main.py

# Terminal 2 - Frontend
cd frontend
# First, update NEXT_PUBLIC_API_URL in .env.local to your network IP
npm run dev:network
```

Access from any device at: http://YOUR_IP:3000

## Example Configuration

If your network IP is `192.168.1.100`:

1. **Update `.env.local`**:
   ```
   NEXT_PUBLIC_API_URL=http://192.168.1.100:8000
   ```

2. **Start backend**:
   ```bash
   cd backend
   python3 main.py
   ```

3. **Start frontend**:
   ```bash
   cd frontend
   npm run dev:network
   ```

4. **Access from any device on your network**:
   - Open browser to: http://192.168.1.100:3000
   - Login as user1/password123

## Firewall Configuration

If other devices can't connect, you may need to allow the ports through your firewall:

### Linux (ufw):
```bash
sudo ufw allow 3000/tcp
sudo ufw allow 8000/tcp
```

### Windows Firewall:
1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Add inbound rules for ports 3000 and 8000

### macOS:
```bash
# Allow Next.js
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /path/to/node

# Or temporarily disable firewall for testing
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off
```

## Troubleshooting

### Issue: Can't connect from other devices

**Solution 1**: Verify your IP address
```bash
# Linux/Mac
hostname -I
# or
ifconfig | grep "inet "
```

**Solution 2**: Check if ports are listening on 0.0.0.0
```bash
# Linux/Mac
netstat -an | grep -E '3000|8000'
# Should show: 0.0.0.0:3000 and 0.0.0.0:8000
```

**Solution 3**: Verify firewall is not blocking
```bash
# Temporarily test by disabling firewall
# Then re-enable and add proper rules
```

### Issue: CORS errors from other devices

This should already be fixed with `allow_origins=["*"]` in backend/main.py, but if you still see issues:

1. Verify `frontend/.env.local` has the correct network IP
2. Restart the frontend after changing `.env.local`
3. Clear browser cache on the device

### Issue: Frontend shows "Failed to fetch"

1. Check backend is running: http://YOUR_IP:8000/health
2. Verify NEXT_PUBLIC_API_URL in .env.local matches your backend IP
3. Restart frontend after changing environment variables

## Production Deployment

For production deployment:

### Backend:
```bash
cd backend
python3 main.py
# Or use production WSGI server like gunicorn
```

### Frontend:
```bash
cd frontend
npm run build
npm run start:network
```

This builds an optimized production bundle and serves it on the network.

## Available NPM Scripts

- `npm run dev` - Local development (localhost only)
- `npm run dev:network` - Network development (accessible from network)
- `npm run build` - Build for production
- `npm run start` - Start production server (localhost only)
- `npm run start:network` - Start production server (accessible from network)

## Security Notes

⚠️ **Important**: The current configuration allows all origins for development convenience.

For production:
1. Update `allow_origins` in `backend/main.py` to specific domains
2. Use HTTPS (TLS/SSL certificates)
3. Set up proper authentication secrets
4. Use environment variables for sensitive data
5. Enable rate limiting
6. Set up proper database backups

---

**Need Help?**
- Check backend logs in terminal
- Check frontend logs in browser console (F12)
- Verify network connectivity with `ping YOUR_IP`
