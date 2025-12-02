# 📱 Mobile Testing Guide for UrbanRally

This guide walks you through testing UrbanRally on your mobile device (iOS or Android).

---

## ⚠️ Prerequisites

### 1. **Upgrade Node.js (REQUIRED)**

Your current Node.js version is **20.8.1**, but Vite 7.x requires **Node.js 20.19+ or 22.12+**.

**Option A: Using Homebrew (macOS)**
```bash
# Update Homebrew
brew update

# Upgrade Node.js to latest LTS
brew upgrade node

# Verify version
node --version  # Should be 22.x or 20.19+
```

**Option B: Using nvm (Node Version Manager)**
```bash
# Install nvm if you don't have it
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal, then:
nvm install 22
nvm use 22
nvm alias default 22

# Verify
node --version
```

**Option C: Download from nodejs.org**
- Visit: https://nodejs.org/
- Download the **LTS version** (22.x)
- Install and restart your terminal

---

## 🚀 Step 1: Start Dev Server with Network Access

Once Node.js is upgraded, start the dev server with the `--host` flag to allow network connections:

```bash
cd /Users/kaangecu/Desktop/personal/urban-rally
npm run dev -- --host
```

You should see output like:

```
  VITE v7.2.4  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.100:5173/
  ➜  press h + enter to show help
```

**📝 Note the Network URL** - this is what you'll use on your phone.

---

## 📲 Step 2: Connect Your Mobile Device

### Requirements:
- ✅ Your phone and Mac must be on the **same WiFi network**
- ✅ Firewall on Mac should allow local network connections

### Get Your Mac's IP Address:

**Method 1: From Vite output**
- Look for the "Network:" URL in the terminal (e.g., `http://192.168.1.100:5173/`)

**Method 2: System Preferences**
```bash
# Quick command to get your IP
ipconfig getifaddr en0  # For WiFi
# or
ipconfig getifaddr en1  # For Ethernet
```

**Method 3: System Settings**
- Open **System Settings** → **Network**
- Click your WiFi connection
- Your IP address is shown (e.g., 192.168.1.100)

---

## 📱 Step 3: Open on Your Phone

### iOS (iPhone/iPad):
1. Open **Safari** (recommended for best compatibility)
2. Type in the address bar: `http://YOUR_MAC_IP:5173`
   - Example: `http://192.168.1.100:5173`
3. Press **Go**

### Android:
1. Open **Chrome** (recommended)
2. Type in the address bar: `http://YOUR_MAC_IP:5173`
   - Example: `http://192.168.1.100:5173`
3. Press **Go**

---

## 🎥 Step 4: Test Camera & GPS Features

### Camera Permission Testing:

1. **Open a Photo Task**
   - Login with code: `BERLIN2025`
   - Tap on a PHOTO task (e.g., "Brandenburg Gate")
   - Tap "Start Task"

2. **Grant Permissions**
   - Browser will ask: "Allow camera access?"
   - Tap **Allow**
   - Camera should show live preview

3. **Test Capture**
   - Tap "Take Photo"
   - Review captured image
   - Tap "Use Photo" to upload

### Video Permission Testing:

1. **Open a Video Task**
   - Find a VIDEO task
   - Tap "Start Task"

2. **Grant Permissions**
   - Browser asks: "Allow camera and microphone?"
   - Tap **Allow**

3. **Test Recording**
   - Tap "Start Recording"
   - Record for 5-10 seconds
   - Tap "Stop Recording"
   - Preview video
   - Tap "Use Video" to upload

### GPS Testing:

1. **Open a GPS Task**
   - Find a GPS task (has location pin icon)
   - Tap "Start Task"

2. **Grant Location Permission**
   - Browser asks: "Allow location access?"
   - Tap **Allow**

3. **Check Distance**
   - Should show your distance from task location
   - If too far: warning message appears
   - If close: "Take Photo at Location" button enabled

---

## 🧪 Complete Testing Checklist

### Authentication
- [ ] Login screen loads correctly
- [ ] Can enter team code `BERLIN2025`
- [ ] Login succeeds
- [ ] Redirects to task list

### Task List
- [ ] All tasks load
- [ ] Task cards display correctly
- [ ] Filter buttons work (All/Available/Completed)
- [ ] Sort dropdown works
- [ ] Tap task opens detail modal

### Task Detail Modal
- [ ] Task image loads
- [ ] Description readable
- [ ] Points displayed
- [ ] Requirements shown
- [ ] "Start Task" button visible
- [ ] Close button works

### Photo Capture
- [ ] Camera opens full-screen
- [ ] Live preview shows
- [ ] Camera toggle button works (front/back)
- [ ] "Take Photo" button responsive
- [ ] Captured image displays correctly
- [ ] Retake button works
- [ ] Confirm triggers upload
- [ ] Progress bar animates
- [ ] Success message shows
- [ ] Score updates

### Video Capture
- [ ] Camera + mic permission requested
- [ ] Live preview shows
- [ ] "Start Recording" button works
- [ ] Recording indicator animates (red dot)
- [ ] Timer counts up (0:00 / 0:30)
- [ ] "Stop Recording" button works
- [ ] Auto-stops at 30 seconds
- [ ] Video preview plays
- [ ] Retake button works
- [ ] Confirm triggers upload
- [ ] Progress bar shows
- [ ] Success message displays

### Quiz Submission
- [ ] Question displays in modal
- [ ] Textarea works (keyboard appears)
- [ ] Character counter updates
- [ ] Submit disabled when empty
- [ ] Submit enabled when valid
- [ ] Submission processes
- [ ] Success message shows

### GPS Verification
- [ ] Location permission requested
- [ ] User location acquired
- [ ] Distance calculated
- [ ] Warning shows if too far
- [ ] Submit disabled when out of range
- [ ] Submit enabled when in range

### Map View
- [ ] Toggle to map view
- [ ] Map tiles load
- [ ] Task markers visible
- [ ] User location marker shows (blue dot)
- [ ] Tap marker shows task name
- [ ] Tap marker opens detail

### General UI
- [ ] Touch targets large enough (min 44px)
- [ ] No horizontal scrolling
- [ ] Fonts readable on small screen
- [ ] Colors/contrast good
- [ ] Buttons respond to touch
- [ ] No layout shifts
- [ ] Smooth scrolling

### Performance
- [ ] App loads quickly
- [ ] Transitions smooth (60fps)
- [ ] Images load fast
- [ ] No lag when typing
- [ ] Camera preview smooth
- [ ] Upload doesn't freeze UI

---

## 🐛 Common Issues & Solutions

### Issue: "Can't connect to http://192.168.1.100:5173"

**Solutions:**
1. **Check same WiFi:** Both devices on same network?
2. **Check IP address:** Run `ipconfig getifaddr en0` again
3. **Check firewall:**
   ```bash
   # Temporarily disable firewall (testing only)
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off
   
   # Re-enable after testing
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on
   ```
4. **Restart dev server:** Kill and restart with `--host` flag

### Issue: Camera doesn't work

**Solutions:**
- **iOS:** Must use **Safari** (Chrome/Firefox have limited camera support)
- **Android:** Chrome works best
- **HTTPS required:** Some browsers require HTTPS for camera
  - Solution: Use ngrok (see below) or test with USB debugging

### Issue: GPS not accurate

**Solutions:**
- Go outdoors (GPS doesn't work well indoors)
- Wait 10-30 seconds for GPS to stabilize
- Enable "High Accuracy" in phone settings
- Ensure browser has location permission

### Issue: Uploads fail

**Solutions:**
- Check internet connection
- Check Firebase console for errors
- Look at browser console (mobile debugging)
- Reduce file size (compression may fail on low-end phones)

---

## 🔒 Using HTTPS (For Camera on iOS)

Some browsers require HTTPS for camera access. Use **ngrok** to create a secure tunnel:

### Setup ngrok:

1. **Install ngrok:**
   ```bash
   brew install ngrok
   ```

2. **Start dev server:**
   ```bash
   npm run dev
   ```

3. **In another terminal, create tunnel:**
   ```bash
   ngrok http 5173
   ```

4. **Use the HTTPS URL from ngrok:**
   ```
   Forwarding: https://abc123.ngrok.io -> http://localhost:5173
   ```

5. **Open on phone:**
   - Use the `https://abc123.ngrok.io` URL
   - Camera will work on all browsers

---

## 🔍 Remote Debugging

### iOS Safari Debugging:

1. **Enable on iPhone:**
   - Settings → Safari → Advanced → Web Inspector: **ON**

2. **Connect to Mac:**
   - Connect iPhone via USB
   - Open Safari on Mac
   - Develop menu → [Your iPhone] → [localhost:5173]
   - Web Inspector opens with console, network, etc.

### Android Chrome Debugging:

1. **Enable on Android:**
   - Settings → About phone → Tap "Build number" 7 times
   - Developer options → USB debugging: **ON**

2. **Connect to Mac:**
   - Connect Android via USB
   - Open Chrome on Mac
   - Go to `chrome://inspect`
   - Click "Inspect" under your device
   - DevTools opens with full debugging

---

## 📊 Testing Workflow

### Quick Test (5 minutes):
1. ✅ Login
2. ✅ View task list
3. ✅ Open one task detail
4. ✅ Take one photo
5. ✅ Check score updated

### Full Test (20 minutes):
1. ✅ Login with test account
2. ✅ Browse all tasks
3. ✅ Complete one photo task
4. ✅ Complete one video task
5. ✅ Complete one quiz task
6. ✅ Complete one GPS task (go outside)
7. ✅ Check map view
8. ✅ View leaderboard (when implemented)
9. ✅ Logout and login again
10. ✅ Verify completed tasks show checkmarks

### Performance Test:
1. ✅ Record video of scrolling task list (should be 60fps)
2. ✅ Test on 3G/4G (not WiFi)
3. ✅ Test with airplane mode (should show offline message)
4. ✅ Test large photo upload (4-5MB)
5. ✅ Test with low battery mode enabled

---

## 📝 Reporting Issues

When you find a bug, note:

1. **Device:** iPhone 14 Pro / Samsung Galaxy S21 / etc.
2. **OS Version:** iOS 17.2 / Android 14 / etc.
3. **Browser:** Safari / Chrome / etc.
4. **Issue:** What went wrong?
5. **Steps to reproduce:**
   - Step 1...
   - Step 2...
   - Expected: ...
   - Actual: ...
6. **Screenshots/video:** If possible
7. **Console errors:** From remote debugging

---

## 🎯 Next Steps After Mobile Testing

Once mobile testing is complete:

1. **Fix camera issues** (if any)
2. **Optimize image compression** for mobile
3. **Add offline support** (Service Worker)
4. **Add to Home Screen** prompt (PWA)
5. **Test on multiple devices:**
   - Old iPhone (e.g., iPhone 8)
   - Budget Android (e.g., Samsung A-series)
   - Tablet (iPad, Android tablet)

---

## 🚀 Quick Start Commands

```bash
# 1. Upgrade Node.js (if needed)
brew upgrade node

# 2. Start dev server with network access
cd /Users/kaangecu/Desktop/personal/urban-rally
npm run dev -- --host

# 3. Get your IP address
ipconfig getifaddr en0

# 4. On phone, open:
# http://YOUR_IP:5173
# Example: http://192.168.1.100:5173

# 5. Login with:
# Team Code: BERLIN2025
```

---

## 📞 Support

**Issues with setup?**
- Check Node.js version: `node --version` (should be 20.19+ or 22.x)
- Check WiFi connection on both devices
- Check firewall settings
- Try ngrok for HTTPS

**Camera/GPS not working?**
- Use Safari on iOS
- Use Chrome on Android
- Grant permissions when prompted
- Test outdoors for GPS

**Uploads failing?**
- Check Firebase console
- Check network connection
- Check browser console for errors
- Try smaller files first

---

**Ready to test!** 📱✨

First step: **Upgrade Node.js**, then run `npm run dev -- --host` and open the Network URL on your phone!
