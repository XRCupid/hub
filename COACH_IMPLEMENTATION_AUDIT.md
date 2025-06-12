# Coach Implementation Audit Report

## Current Status (As of 2025-06-10)

### ✅ CoachSession.tsx (/coach-call)
- **WebSocket Cleanup**: ✅ IMPLEMENTED
- **Manual Connect UI**: ✅ Has "Connect to Hume AI" button
- **User PiP**: ✅ Uses UserAvatarPiP component
- **Audio/Mouth Sync**: ✅ Implemented with audioData tracking
- **Coach Avatar**: ✅ PresenceAvatar in main view with venue background

### ⚠️ CoachRizzoSession.tsx (/coach-rizzo)
- **WebSocket Cleanup**: ✅ JUST ADDED (needs testing)
- **Manual Connect UI**: ❌ MISSING - No connect button!
- **User PiP**: ✅ Has pip-avatar div
- **Audio/Mouth Sync**: ❓ UNCLEAR - Needs verification
- **Coach Avatar**: ✅ Has PresenceAvatar

### ⚠️ CoachPosieSession.tsx (/coach-posie)
- **WebSocket Cleanup**: ✅ JUST ADDED (needs testing)
- **Manual Connect UI**: ❌ MISSING - No connect button!
- **User PiP**: ✅ Has pip-avatar div
- **Audio/Mouth Sync**: ❓ UNCLEAR - Needs verification
- **Coach Avatar**: ✅ Has PresenceAvatar

## Critical Issues Found:

1. **Rizzo & Posie are missing Connect buttons** - They comment out auto-connect but don't provide manual UI
2. **Audio sync unclear** - Need to verify audioData is properly connected
3. **Lint errors** - ML5FaceMeshService.stop() method doesn't exist

## Required Fixes:

### 1. Add Connect Button to Rizzo & Posie
Both need the same UI pattern as CoachSession:
```tsx
{!humeConnected ? (
  <button className="connect-button" onClick={handleConnect}>
    Connect to Hume AI
  </button>
) : (
  <button className="disconnect-button" onClick={handleDisconnect}>
    Disconnect
  </button>
)}
```

### 2. Implement handleConnect/handleDisconnect
```tsx
const handleConnect = async () => {
  await humeVoiceService.connect(RIZZO_CONFIG_ID);
  setHumeConnected(true);
};

const handleDisconnect = () => {
  humeVoiceService.disconnect();
  setHumeConnected(false);
};
```

### 3. Fix ML5FaceMeshService cleanup
Change from `stop()` to proper cleanup method or remove if not needed

### 4. Verify Audio Data Connection
Ensure audioData is properly passed to PresenceAvatar for mouth sync

## Summary:
- CoachSession is the GOLD STANDARD - working properly
- Rizzo and Posie need connect UI and verification
- All three now have cleanup (but Rizzo/Posie need testing)
- PiP implementation is consistent across all three
