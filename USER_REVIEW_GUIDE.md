[Ver003.000]

# User Review Guide
## Libre-X-eSport 4NJZ4 TENET Platform v2.1

**Date:** 2026-03-16  
**Version:** 2.1.0  
**Purpose:** Guide for user acceptance testing

---

## Quick Start

### 1. Access the Platform
```
Production: https://your-domain.com
Local: http://localhost:3000
```

### 2. Test Credentials
Create a test account or use OAuth login with:
- Discord
- Google
- GitHub

---

## Feature Testing Guide

### SATOR Analytics Hub
**URL:** `/sator`

**Test Scenarios:**
1. **Player Search**
   - Search for any player name
   - Verify results display
   - Check player cards render

2. **RAR Calculator**
   - Select player
   - View RAR score breakdown
   - Check volatility indicators
   - Verify investment grade

3. **Performance Metrics**
   - View SimRating
   - Check historical trends
   - Verify data accuracy

**Expected Result:** All analytics load < 2 seconds, charts render correctly

---

### TENET UI Components
**URL:** `/tenet` (component showcase)

**Test Scenarios:**
1. **Primitives**
   - Click all button variants
   - Test form inputs
   - Verify checkbox/switch states

2. **Composite Components**
   - Open/close modals
   - Test accordion expand/collapse
   - Switch between tabs
   - Test dropdown menus

3. **Layout System**
   - Resize browser window
   - Verify responsive behavior
   - Check grid alignment

**Expected Result:** All components respond to interaction, no console errors

---

### Betting Engine
**URL:** `/matches` → Select match → Betting panel

**Test Scenarios:**
1. **View Odds**
   - Check match odds display
   - Verify format toggle (decimal/american/fractional)
   - Check odds history graph

2. **Place Bet** (if enabled)
   - Select outcome
   - Enter amount
   - Verify odds calculation
   - Submit bet

3. **Leaderboard**
   - View top bettors
   - Check pagination
   - Verify sorting

**Expected Result:** Odds update in real-time, calculations accurate

---

### WebSocket Gateway
**Test Method:** Open browser dev tools → Network → WS

**Test Scenarios:**
1. **Connection**
   - Load any page with real-time data
   - Verify WebSocket connects (status 101)
   - Check heartbeat messages (every 30s)

2. **Subscribe to Channel**
   - Navigate to match page
   - Verify subscribe message sent
   - Check data updates received

3. **Reconnection**
   - Disconnect network briefly
   - Verify auto-reconnect
   - Check subscription restored

**Expected Result:** WebSocket stable, messages received, auto-recovers

---

### OAuth Authentication
**URL:** `/login`

**Test Scenarios:**
1. **Discord Login**
   - Click "Login with Discord"
   - Authorize application
   - Verify redirect back
   - Check user profile populated

2. **Google Login**
   - Click "Login with Google"
   - Select account
   - Verify login success

3. **GitHub Login**
   - Click "Login with GitHub"
   - Authorize application
   - Verify login success

**Expected Result:** OAuth flow completes, user data saved, session established

---

### 2FA Setup
**URL:** `/settings/security`

**Test Scenarios:**
1. **Enable 2FA**
   - Click "Enable 2FA"
   - Scan QR code with authenticator app
   - Enter verification code
   - Verify success message

2. **Backup Codes**
   - Save backup codes
   - Verify codes displayed

3. **Login with 2FA**
   - Log out
   - Log in with credentials
   - Enter TOTP code
   - Verify access granted

4. **Disable 2FA**
   - Enter current TOTP
   - Click "Disable 2FA"
   - Verify disabled

**Expected Result:** 2FA enables/disables correctly, codes work

---

### Push Notifications
**URL:** `/settings/notifications`

**Test Scenarios:**
1. **Enable Notifications**
   - Click "Enable Notifications"
   - Allow browser permission
   - Verify subscription saved

2. **Test Notification**
   - Click "Send Test"
   - Verify notification received

3. **Preferences**
   - Toggle categories on/off
   - Save preferences
   - Verify settings persist

**Expected Result:** Browser notifications work, preferences saved

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| OAuth fails | Redirect URI mismatch | Check OAuth app settings |
| 2FA errors | Clock drift | Sync device time |
| WebSocket drops | Proxy timeout | Check nginx/Apache config |
| Notifications fail | Permission denied | Check browser settings |
| Slow loading | Cold start | Wait 30s, refresh |

---

## Feedback Template

```
Feature: [Name]
Test Date: [Date]
Tester: [Name]

Test Result: [Pass/Fail]
Issues Found:
- [Issue 1]
- [Issue 2]

Suggestions:
- [Suggestion 1]

Performance Notes:
- Load time: [X seconds]
- Any lag: [Yes/No]

Overall Rating: [1-5 stars]
```

---

## Sign-off Criteria

| Feature | Minimum Tests | Sign-off |
|---------|---------------|----------|
| SATOR Analytics | 3 scenarios | ⬜ |
| TENET UI | 5 components | ⬜ |
| Betting | 2 scenarios | ⬜ |
| WebSocket | 3 tests | ⬜ |
| OAuth | 2 providers | ⬜ |
| 2FA | Full flow | ⬜ |
| Push Notifications | Enable + test | ⬜ |

**All boxes must be checked for production approval.**

---

*This guide ensures comprehensive user acceptance testing.*
