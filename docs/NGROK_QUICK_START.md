# ngrok Setup - Quick Start for Tonight

## ⚡ Quick Setup (2 minutes)

### Step 1: Sign Up for ngrok (Free)

1. Go to: https://dashboard.ngrok.com/signup
2. Sign up with Google/GitHub or email (free account)
3. You'll be redirected to the dashboard

### Step 2: Get Your Authtoken

1. Go to: https://dashboard.ngrok.com/get-started/your-authtoken
2. Copy your authtoken (looks like: `2a...bunch...of...characters`)
3. Run this command in terminal:

```bash
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

### Step 3: Start ngrok

```bash
ngrok http 5174
```

You'll see output like:

```
ngrok

Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.33.1
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc-123-def.ngrok-free.app -> https://localhost:5174

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

### Step 4: Share Your URL

**Copy the HTTPS forwarding URL** (e.g., `https://abc-123-def.ngrok-free.app`)

Share this with your group via WhatsApp/Telegram!

---

## 🎯 What You'll See

### ngrok Terminal Output:
```
Forwarding    https://abc-123-def.ngrok-free.app -> https://localhost:5174
```

The **first URL** (`https://abc-123-def.ngrok-free.app`) is what you share with others.

---

## 📱 Using on Your Phone

1. **Open the ngrok URL** on your phone browser
2. **You might see a warning page** from ngrok (free tier):
   - Click "Visit Site" button
   - This is normal for free accounts
3. **Your app will load!**
4. Login with team code: `BERLIN2025` or `CHASE2025`

---

## 🎨 For Tonight's Demo

### Option A: Show ESN Berlin Theme
```
URL: https://your-ngrok-url.ngrok-free.app
Code: BERLIN2025
Theme: Professional light theme
Tasks: 15 tasks, 895 points
```

### Option B: Show Cyberpunk Theme
```
URL: https://your-ngrok-url.ngrok-free.app
Code: CHASE2025
Theme: Dark cyberpunk theme with neon effects
Tasks: 8 tasks, 550 points
```

---

## 🔧 Commands Summary

```bash
# 1. Add your authtoken (one-time setup)
ngrok config add-authtoken YOUR_TOKEN_HERE

# 2. Start ngrok tunnel
ngrok http 5174

# 3. Keep this terminal open while testing!
# Press Ctrl+C to stop when done
```

---

## ✨ Pro Tips

### 1. Keep Both Terminals Open
- **Terminal 1:** `npm run dev` (dev server)
- **Terminal 2:** `ngrok http 5174` (tunnel)

### 2. ngrok Web Interface
While ngrok is running, visit: http://127.0.0.1:4040

You can see:
- All HTTP requests in real-time
- Request/response details
- Replay requests
- Inspect traffic

### 3. Share the Link
```
Hey! Check out the app:
https://abc-123-def.ngrok-free.app

Team codes to try:
- BERLIN2025 (light theme)
- CHASE2025 (cyberpunk theme)

Features to test:
📸 Photo capture
🎥 Video recording
🗺️ Map view
✅ Real-time task completion
```

### 4. Test First!
Before going out:
1. Open ngrok URL on your phone
2. Click through ngrok warning
3. Login with team code
4. Test camera permission
5. Take a test photo
6. Make sure everything works!

---

## 🚨 Troubleshooting

### "authentication failed"
**Solution:** Add your authtoken first
```bash
ngrok config add-authtoken YOUR_TOKEN
```

### "ERR_NGROK_108: Tunnel not found"
**Solution:** Free tier URLs change each time
- Stop ngrok (Ctrl+C)
- Start again: `ngrok http 5174`
- Share new URL

### "ngrok warning page" on phone
**Solution:** This is normal for free tier
- Click "Visit Site" button
- Bookmark the URL to skip warning next time

### Dev server stopped
**Solution:** 
```bash
# In Terminal 1
cd /Users/kaangecu/Desktop/personal/urban-rally
npm run dev
```

### Port 5174 not found
**Solution:** Make sure dev server is running first!
```bash
# Check dev server terminal - should show:
# ➜  Local:   https://localhost:5174/
```

---

## 🎉 You're Ready!

Once you see:
```
Forwarding    https://xxx.ngrok-free.app -> https://localhost:5174
```

You're good to go! Share that URL with your group and start testing! 🚀

---

## ⏱️ Free Tier Limits

- **Connections:** Unlimited
- **Duration:** 2 hours max per tunnel
- **Bandwidth:** 1GB/month (plenty for tonight)
- **Warning page:** Shows before your app (can click through)

If tunnel disconnects after 2 hours, just restart ngrok!

---

## 🌟 After Tonight

If you want to use ngrok regularly:

**Free features:**
- Random URLs each time
- 2-hour session limit
- 1 simultaneous tunnel
- ngrok warning page

**Paid ($8/month):**
- Custom subdomain (e.g., `urbanrally.ngrok.app`)
- No warning page
- Longer sessions
- Multiple tunnels

For tonight, **free tier is perfect!** ✨
