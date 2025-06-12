# XRCupid Conference Deployment Checklist

## 🚨 CRITICAL SECURITY FIXES COMPLETED:
- ✅ Removed API key input form from VideoChat.js (users will NEVER be asked for API keys)
- ✅ Removed hardcoded API keys from humeVoiceService.ts
- ✅ HumeApiKeyInput component exists but is not used anywhere
- ✅ AvatarManager component exists but is not routed

## 📋 PRE-DEPLOYMENT CHECKLIST:

### 1. ⚠️ HUME API CONFIGURATION (CRITICAL!)
**For GitHub Pages Deployment:**
```bash
# Option A: Use GitHub Secrets (Recommended)
# 1. Go to your repo Settings > Secrets and variables > Actions
# 2. Add these secrets:
REACT_APP_HUME_API_KEY=your_actual_api_key
REACT_APP_HUME_SECRET_KEY=your_actual_secret_key
REACT_APP_HUME_CONFIG_ID=your_default_config_id
REACT_APP_HUME_CONFIG_ID_GRACE=your_grace_config_id
REACT_APP_HUME_CONFIG_ID_POSIE=your_posie_config_id
REACT_APP_HUME_CONFIG_ID_RIZZO=your_rizzo_config_id

# Option B: Create .env.production file (Less secure)
# Create /Users/douglasgoldstein/XRCupid_Clone/hub/.env.production with above values
```

### 2. 🔥 FIREBASE CONFIGURATION
**Current Status:** Using mock Firebase service
**For Production:** Need to uncomment real Firebase in firebaseConfig.ts
```javascript
// In src/firebaseConfig.ts, set:
export const isRealFirebase = true; // Change from false to true
```

### 3. 📱 QR CODE & ROOM SYSTEM
**Status:** ✅ Working with mock Firebase
**Routes:**
- Host: `/conference` or `/conference-host`
- Mobile: `/conference-mobile`
- Audience: `/conference-audience`

### 4. 🎭 AVATAR SELECTION FOR AUDIENCE VIEW
**Status:** ⚠️ Missing dropdown for PiP avatar selection
**TODO:** Add avatar selection dropdowns in ConferenceBoothDemo

### 5. 🗣️ CONVERSATION TOOLKIT
**Status:** ⚠️ Component exists but not linked
**Fix:** Update navigation from `/sample-lessons` to `/conversation-toolkit`

### 6. 🔤 FONT READABILITY
**Status:** ⚠️ Cards use hard-to-read risograph font
**Location:** `/src/styles/risograph-design-system.css`

## 🚀 DEPLOYMENT STEPS:

1. **Set Environment Variables:**
   ```bash
   # For local testing before deployment:
   cp .env.example .env.production
   # Edit .env.production with your actual API keys
   ```

2. **Test Locally with Production Build:**
   ```bash
   npm run build
   serve -s build
   ```

3. **Deploy to GitHub Pages:**
   ```bash
   npm run deploy
   ```

4. **Verify Deployment:**
   - Check https://xrcupid.love
   - Test conference demo flows
   - Ensure NO API key prompts appear
   - Verify Hume voice connections work

## 🔍 CRITICAL VERIFICATION:
- [ ] Hume services connect without asking for API keys
- [ ] Conference booth QR code generation works
- [ ] Avatar tracking and emotions display properly
- [ ] No console errors about missing credentials
- [ ] Firebase connections work (if using real Firebase)

## ⚡ QUICK FIXES NEEDED:
1. Font readability on cards
2. Avatar selection dropdowns for audience view
3. Conversation toolkit navigation link
4. Firebase real connection (if needed)

## 📞 EMERGENCY CONTACTS:
- Hume API issues: billing@hume.ai
- Firebase issues: Check Firebase console
- Deployment issues: GitHub Pages settings
