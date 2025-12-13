# HTTPS Setup for Local Development

## Problem
Modern browsers require HTTPS for accessing camera and microphone. When testing on mobile devices via local IP (e.g., `http://10.6.242.3:5174`), the browser blocks camera access because the connection is not secure.

## Why HTTPS is Required

### Works (Localhost Exception):
- ✅ `http://localhost:5174` - Browser trusts localhost
- ✅ `http://127.0.0.1:5174` - Browser trusts loopback address

### Blocked (Network Access):
- ❌ `http://10.6.242.3:5174` - Not secure, not localhost
- ❌ Camera/microphone APIs are disabled for security

## Solutions

### Option 1: Vite with Self-Signed Certificate (Current Setup)

**Setup:**
```bash
npm install --save-dev @vitejs/plugin-basic-ssl
```

**Configuration:** (Already applied in `vite.config.ts`)
```typescript
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    https: true,
    host: true,
  }
})
```

**Usage:**
```bash
npm run dev
```

**Access URLs:**
- Desktop: `https://localhost:5173`
- Mobile: `https://10.6.242.3:5173` (or your actual IP)

**Important:** You'll see a browser warning about self-signed certificate:
- **Safari (macOS):** Click "Show Details" → "visit this website"
- **Safari (iOS):** Tap "Show Details" → "visit this website" 
- **Chrome:** Click "Advanced" → "Proceed to localhost (unsafe)"

This is normal for self-signed certificates. The connection is still encrypted.

**Pros:**
- ✅ Works on local network
- ✅ No external dependencies
- ✅ Fast setup
- ✅ Free

**Cons:**
- ⚠️ Browser security warnings (must accept once per device)
- ⚠️ Different certificate each time Vite restarts
- ⚠️ Not suitable for production

---

### Option 2: mkcert (Trusted Local Certificates)

For a better experience without security warnings:

**Setup:**
```bash
# Install mkcert
brew install mkcert

# Install local CA
mkcert -install

# Create certificate for your local network
mkcert localhost 127.0.0.1 ::1 10.6.242.3
```

This creates:
- `localhost+3.pem` (certificate)
- `localhost+3-key.pem` (private key)

**Update `vite.config.ts`:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync('./localhost+3-key.pem'),
      cert: fs.readFileSync('./localhost+3.pem'),
    },
    host: true,
  }
})
```

**Pros:**
- ✅ No browser warnings
- ✅ Trusted by your system
- ✅ Stable certificate (doesn't change)
- ✅ Professional setup

**Cons:**
- ❌ Requires mkcert installation
- ❌ Manual certificate management
- ❌ Need to install CA on each mobile device for full trust

---

### Option 3: ngrok (HTTPS Tunnel)

**Setup:**
```bash
# Install ngrok
brew install ngrok

# Run your dev server
npm run dev

# In another terminal, create tunnel
ngrok http 5173
```

**Output:**
```
Forwarding  https://abc123.ngrok.io -> http://localhost:5173
```

Use `https://abc123.ngrok.io` on any device.

**Pros:**
- ✅ Real HTTPS certificate (no warnings)
- ✅ Works from anywhere (not just local network)
- ✅ Easy to share with teammates
- ✅ No certificate management

**Cons:**
- ❌ URL changes each restart (free tier)
- ❌ Requires internet connection
- ❌ Slight latency from tunnel

---

## Current Recommendation

We've set up **Option 1 (Vite + basicSsl)** as the default because:
- ✅ Works immediately with `npm run dev`
- ✅ No extra tools required
- ✅ Good for quick mobile testing

For production-level local testing, consider **Option 2 (mkcert)**.

For sharing with external testers, use **Option 3 (ngrok)**.

## Testing Camera Access

After enabling HTTPS, verify camera access:

1. **Desktop:**
   - Navigate to `https://localhost:5173`
   - Accept security warning (if using self-signed)
   - Login with CHASE2025 or BERLIN2025
   - Click a PHOTO task → "Start Task"
   - Click "Enable Camera"
   - ✅ Should prompt for camera permission

2. **Mobile (same network):**
   - Find your local IP: `ifconfig | grep inet` (look for 192.168.x.x or 10.x.x.x)
   - Navigate to `https://YOUR_IP:5173` (e.g., `https://10.6.242.3:5173`)
   - Accept security warning
   - Test camera access
   - ✅ Should work!

## Troubleshooting

### "Your connection is not private" Warning
- **Expected:** This is normal for self-signed certificates
- **Solution:** Click "Advanced" → "Proceed" (Chrome) or "Show Details" → "visit" (Safari)

### Camera still blocked after HTTPS
- Check browser console for errors
- Verify URL starts with `https://` (not `http://`)
- Try hard refresh: Cmd+Shift+R (macOS) or Ctrl+Shift+R (Windows)
- Clear browser cache and reload

### iOS Safari won't accept certificate
- Go to Settings → General → About → Certificate Trust Settings
- Enable trust for the certificate (if using mkcert)

### Port already in use
- Vite HTTPS uses default port 5173
- Check if another process is using the port: `lsof -i :5173`
- Kill process: `kill -9 <PID>`

## Security Notes

⚠️ **Self-signed certificates are for development only!**

- Never use in production
- Don't commit certificate files to git
- Each developer should generate their own certificates

For production deployment, use a proper SSL certificate from:
- Let's Encrypt (free)
- Your hosting provider (Firebase, Vercel, Netlify provide HTTPS automatically)
- Commercial SSL provider

## References

- [MDN: MediaDevices.getUserMedia() - Secure contexts](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#security)
- [Vite: HTTPS configuration](https://vitejs.dev/config/server-options.html#server-https)
- [mkcert GitHub](https://github.com/FiloSottile/mkcert)
