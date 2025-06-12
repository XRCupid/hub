# 🚨 EMERGENCY HUME CREDENTIALS OVERRIDE GUIDE

## For Conference Demo - Multiple Ways to Override Credentials

### Method 1: Quick Setup Page (EASIEST)
1. Go to: https://xrcupid.github.io/hub/hume-quick-setup
2. Enter your Hume API key and secret key
3. Click "Save & Go to Coach Grace"
4. Credentials will be saved in browser storage

### Method 2: Direct URL with Credentials
Use this URL format (replace with your actual credentials):
```
https://xrcupid.github.io/hub/coach-call/grace?hume_api=YOUR_API_KEY&hume_secret=YOUR_SECRET_KEY&hume_config=3910aba0-b518-440a-a4a2-0ad1772aec57
```

### Method 3: Browser Console (On Any Page)
1. Open browser console (F12)
2. Run this command:
```javascript
window.humeCredentials.set(
  "your_api_key_here",
  "your_secret_key_here",
  "3910aba0-b518-440a-a4a2-0ad1772aec57"
);
```
3. Refresh the page

### Method 4: Emergency Form (Appears Automatically)
- If no credentials are detected, an emergency form will appear in the bottom-right corner
- Enter credentials there and click "Save Credentials"
- Page will offer to reload automatically

## Important Notes

1. **Credentials persist in browser storage** - Once set, they survive page refreshes
2. **Each device needs setup** - Credentials are stored per browser/device
3. **Grace's Config ID**: `3910aba0-b518-440a-a4a2-0ad1772aec57`
4. **To clear stored credentials**: Run `window.humeCredentials.clear()` in console

## Debug Pages

- Environment Check: https://xrcupid.github.io/hub/env-check
- Hume Connection Debug: https://xrcupid.github.io/hub/hume-debug
- Quick Setup: https://xrcupid.github.io/hub/hume-quick-setup

## For Conference Setup

1. Before the conference, go to the demo device
2. Use Method 1 (Quick Setup Page) to save credentials
3. Test with Coach Grace: https://xrcupid.github.io/hub/coach-call/grace
4. Credentials will remain saved for all demos

## Troubleshooting

If coach still doesn't appear after setting credentials:
1. Check browser console for errors
2. Try the Hume Connection Debug page
3. Ensure the config ID matches your Hume account
4. Clear cache and try again

## Security Note

These override methods are for emergency/demo use. For production:
- Use proper environment variables
- Deploy with GitHub Secrets
- Never expose credentials in URLs for production use
