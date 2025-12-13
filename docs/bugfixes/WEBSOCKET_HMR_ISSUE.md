# WebSocket HMR Issue - Quick Reference

## 🐛 The Issue

When using HTTPS with Vite's `basicSsl()` plugin, you may see this error in the browser console:

```
WebSocket connection to 'ws://localhost:5173/' failed
[vite] failed to connect to websocket
```

## ✅ Is This Critical?

**NO!** This is a known issue with Vite + HTTPS + self-signed certificates. Your app works perfectly fine.

### What Still Works:
- ✅ App loads and runs normally
- ✅ All features work (camera, submissions, login, etc.)
- ✅ ngrok tunnel works fine
- ✅ Production deployment unaffected

### What Doesn't Work:
- ❌ Hot Module Replacement (HMR) - auto-refresh on code changes
- ℹ️ You need to manually refresh the browser after code changes

## 🔧 Workarounds

### Option 1: Just Live With It (Recommended)
- Ignore the error in console
- Manually refresh browser after code changes (`Cmd+R` or `Ctrl+R`)
- Fastest for quick testing

### Option 2: Use HTTP for Development
- Disable `basicSsl()` in `vite.config.ts`
- Use `http://localhost:5173/` instead of `https://`
- **Problem:** Camera API won't work (requires HTTPS)
- **Solution:** Test camera features via ngrok

### Option 3: Accept Certificate in Browser
1. Open https://localhost:5173/ in browser
2. Click "Advanced" on the certificate warning
3. Click "Proceed to localhost (unsafe)"
4. **Then** the WebSocket *should* work
5. Repeat in incognito/private mode if needed

### Option 4: Use ngrok for Everything
- Always access via ngrok URL (has valid SSL)
- WebSocket works perfectly
- HMR works
- **Problem:** Slower due to tunnel latency

## 🎯 Recommended Setup

**For local development:**
```bash
# Terminal 1: Dev server
cd /Users/kaangecu/Desktop/personal/urban-rally
npm run dev

# Terminal 2: ngrok (for mobile testing)
ngrok http https://localhost:5173
```

**Access the app:**
- Desktop testing: https://localhost:5173/ (ignore WebSocket error, manual refresh)
- Mobile testing: https://[your-ngrok-url] (HMR works, camera works)

## 📝 Why This Happens

1. Vite's HMR uses WebSocket for live reload
2. When page is HTTPS, WebSocket needs to be WSS (secure)
3. Self-signed certificates aren't trusted by default
4. Browser blocks the WebSocket connection
5. Vite shows error, but app still works

## 🚀 Production

This issue **only affects development**. In production:
- ✅ No HMR needed
- ✅ Valid SSL certificate (Firebase Hosting, Vercel, etc.)
- ✅ No WebSocket errors
- ✅ Everything works perfectly

## 🔗 References

- Vite HMR Docs: https://vite.dev/config/server-options.html#server-hmr
- GitHub Issue: https://github.com/vitejs/vite/issues/2820
- Stack Overflow: https://stackoverflow.com/questions/69420135

---

**TL;DR:** The error is annoying but harmless. Just manually refresh your browser after code changes during local development. Use ngrok for mobile testing where HMR actually works.
