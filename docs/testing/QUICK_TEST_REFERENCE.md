# Quick Testing Reference - Phase 1

## 🚀 Quick Start

### 1. Start Dev Server
```bash
cd /Users/kaangecu/Desktop/personal/urban-rally
npm run dev
```
**URL:** http://localhost:5173

### 2. Open Browser Console
- **Chrome/Edge:** F12 or Cmd+Option+I (Mac)
- **Firefox:** F12 or Cmd+Option+K (Mac)
- **Safari:** Cmd+Option+C (enable Developer menu first)

### 3. View Firebase Console
- **Firestore:** https://console.firebase.google.com/project/urban-rally-539bd/firestore
- **Functions Logs:** https://console.firebase.google.com/project/urban-rally-539bd/functions/logs?search=joinTeamSecure

---

## 🎯 Quick Tests

### Test 1: Normal Join ✅
1. Enter team code
2. Fill name (2-50 chars)
3. Accept consent
4. Click "Join Team"
5. **Check:** Dashboard appears

### Test 2: Team Full ❌
1. Use team at capacity
2. Try to join
3. **Check:** "Team is full" error

### Test 3: Duplicate Join ❌
1. Join team once
2. Try join another team (same event)
3. **Check:** "Already in team" error

---

## 🔍 What to Watch

### Browser Console (F12)
**Success:**
```
🔐 Calling joinTeamSecure Cloud Function...
✅ Successfully joined team [Name]
```

**Errors:**
```
Error joining team: [specific message]
```

### Firebase Console Logs
**Filter:** `joinTeamSecure`

**Success:**
```
INFO: Team join successful
```

**Errors:**
```
WARN: Team is full / User already in team / Team not found
```

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "Missing permissions" error | ✅ Expected! Rules working correctly |
| Cold start slow | ✅ Normal for first call (~500ms) |
| "Team not found" | Check team code is valid |
| "Already in team" | Clear localStorage or use different user |

---

## ✅ Success Checklist

- [ ] Team join completes successfully
- [ ] Error messages are user-friendly
- [ ] Session restores after page refresh
- [ ] Cloud Function logs show activity
- [ ] Firestore shows correct data in all 3 collections
- [ ] No permission errors for legitimate operations

---

## 📊 Performance Targets

- **Normal join:** < 200ms
- **Cold start:** < 2s
- **Error handling:** < 100ms

---

## 🔗 Quick Links

- **App:** http://localhost:5173
- **Firestore:** https://console.firebase.google.com/project/urban-rally-539bd/firestore/data/teams
- **Functions:** https://console.firebase.google.com/project/urban-rally-539bd/functions
- **Full Guide:** docs/testing/PHASE_1_TESTING_GUIDE.md
