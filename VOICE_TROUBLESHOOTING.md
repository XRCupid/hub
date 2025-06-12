# Voice Configuration Troubleshooting Guide

## Current Setup
- Grace Config ID: `bfd6db39-f0ea-46c3-a64b-e902d8cec212`
- Posie Config ID: `dbf8debd-6835-489f-a7c3-a38fde6bb859`
- Rizzo Config ID: `0643bb10-61b5-43a8-ae1d-eb0051afc0a8`

## Troubleshooting Steps

### 1. Verify Environment Variables Are Loaded
After updating `.env`, you MUST restart the app:
```bash
# Stop the current server (Ctrl+C)
# Start it again
npm start
```

### 2. Check Console Logs
When you click "Connect to Hume AI", look for:
```
[CoachSession] Connecting with: {
  coachName: "Grace",
  configId: "bfd6db39-f0ea-46c3-a64b-e902d8cec212",
  ...
}
```

### 3. Verify Hume EVI Configuration
Go to https://platform.hume.ai/ and check each config:

1. **Voice Settings** - Each config should have:
   - Different voice selections
   - Appropriate speaking rate/pitch
   - Language model settings

2. **System Prompt** - Each config should include:
   - The character personality
   - Speaking style instructions
   - For Rizzo, use the content from `/src/config/RizzoSystemPrompt.txt`

### 4. Common Issues

**Issue: All coaches sound the same**
- Cause: Config IDs not loading from environment
- Fix: Restart the app after updating `.env`

**Issue: Voice doesn't match personality**
- Cause: Hume EVI config not set up properly
- Fix: Update the voice settings in Hume platform for each config ID

**Issue: System prompt not affecting voice**
- Cause: System prompts in Hume configs might override the one sent from app
- Fix: Update the system prompt in each Hume config on the platform

### 5. Testing Voice Differences
To verify each coach has a different voice:
1. Test Grace - Should sound sophisticated, measured
2. Test Posie - Should sound warm, empathetic
3. Test Rizzo - Should sound energetic, confident

### 6. Debug Output
The app now logs which config ID is being used. Check browser console for:
- Config ID being sent
- Environment variables loaded
- Connection success/failure

## Next Steps
1. Restart your development server
2. Clear browser cache (Cmd+Shift+R)
3. Test each coach and check console logs
4. Verify config IDs match what's in Hume platform
