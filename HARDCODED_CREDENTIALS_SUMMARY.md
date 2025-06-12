# HARDCODED CREDENTIALS SUMMARY

## Credentials Hardcoded Everywhere

### API Credentials
- **API Key**: `m3KaINwHsH55rJNO6zr2kIEAWvOimYeLTon3OriOXWJeCxCl`
- **Secret Key**: `IWtKuDbybQZLI0qWWPJn2M1iW3wrKGiQhmoQcTvIGJD2iBhDG3eRD35969FzcjNT`

### Config IDs
- **Grace**: `bfd6db39-f0ea-46c3-a64b-e902d8cec212` (also default)
- **Posie**: `dbf8debd-6835-489f-a7c3-a38fde6bb859`
- **Rizzo**: `0643bb10-61b5-43a8-ae1d-eb0051afc0a8`
- **Dougie**: `320d816a-8dac-44e6-b59b-1c3d2b6b24d9`

## Files Modified with Hardcoded Credentials

### Core Services
1. **`/src/services/nuclearHumeOverride.ts`**
   - All credentials and config IDs hardcoded
   - Ignores all override attempts
   - Sets environment variables on load
   - Sets window variables for global access

2. **`/src/services/humeVoiceService.ts`**
   - Uses nuclear override first
   - Has hardcoded fallback when no credentials found
   - Always has valid credentials to use

3. **`/src/services/humeCredentialsOverride.ts`**
   - Added hardcoded credentials as ultimate fallback
   - Still checks URL params and storage first
   - Always returns valid credentials

4. **`/src/services/voiceService.ts`**
   - Hardcoded API key directly in constructor
   - No environment variable lookup

5. **`/src/services/HumeAIService.js`**
   - Hardcoded API key and secret key in constructor
   - No environment variable fallback

6. **`/src/services/humeEVI.ts`**
   - Hardcoded API key in connectToHumeEVI function
   - Direct assignment, no env lookup

7. **`/src/services/HumeExpressionService.ts`**
   - Hardcoded API key as class property
   - No environment variable usage

8. **`/src/services/CombinedFaceTrackingService.ts`**
   - Hardcoded API key for Hume initialization
   - Re-enabled Hume integration

### Components
9. **`/src/components/EmergencyCoachSession.tsx`**
   - All coach config IDs hardcoded directly
   - No environment variable lookups

10. **`/src/config/coachConfig.ts`**
    - Grace, Posie, and Rizzo config IDs hardcoded
    - (Dougie not in this file but hardcoded elsewhere)

11. **`/src/components/HumeDebug.tsx`**
    - Hardcoded all credentials in testConnection
    - Shows " Hardcoded" status for all env vars

### Test & Debug Files
12. **`/src/test-hume-connection.ts`**
    - Hardcoded API key, secret key, and Grace config ID
    - Direct assignment in getAccessToken

13. **`/src/utils/diagnostics.js`**
    - Hardcoded API key and Grace config ID
    - Used in checkHumeAPI function

### Entry Point
14. **`/src/index.js`**
    - Imports nuclearHumeOverride to run on startup

## How It Works

1. **On App Start**: `nuclearHumeOverride.ts` runs immediately and:
   - Sets all environment variables
   - Sets window variables
   - Logs confirmation

2. **When Connecting**: Services use hardcoded values:
   - Nuclear override provides credentials
   - Each service has its own hardcoded fallback
   - No reliance on environment variables

3. **No Escape**: All attempts to change credentials are ignored

## Testing

Open browser console and run:
```javascript
NUCLEAR_GET_HUME()
```

This will show all hardcoded credentials.

## IMPORTANT

These credentials are now hardcoded at every level:
- Nuclear override system
- Individual service files
- Test and debug utilities
- Component configurations

The system will ALWAYS use these credentials regardless of:
- Environment variables
- URL parameters
- Local/session storage
- Any runtime changes

The only way to change them is to modify the source code.
