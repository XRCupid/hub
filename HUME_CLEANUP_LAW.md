# 🚨 HUME CLEANUP LAW - MANDATORY FOR ALL COMPONENTS 🚨

## THE LAW: FLUSH THE TOILET!

**EVERY component that uses humeVoiceService MUST have cleanup. NO EXCEPTIONS.**

This is not optional. This is not a suggestion. This is THE LAW.

## The Standard Cleanup Pattern

```typescript
// CRITICAL: Clean up WebSocket connection on unmount - FLUSH THE TOILET!
useEffect(() => {
  return () => {
    console.log('[ComponentName] Cleaning up on unmount');
    if (isConnected) {
      humeVoiceService.disconnect();
    }
    // Clean up audio analysis
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    // Clean up face tracking if applicable
    if (ml5FaceMeshServiceRef.current) {
      // ml5FaceMeshServiceRef.current.stop(); // if method exists
    }
  };
}, []); // Empty deps array is CRITICAL
```

## Components Currently Compliant ✅

1. **CoachSession.tsx** - ✅ Has cleanup
2. **CoachRizzoSession.tsx** - ✅ Has cleanup
3. **CoachPosieSession.tsx** - ✅ Has cleanup
4. **NPCDateCall.tsx** - ✅ Has cleanup
5. **PracticeDate.tsx** - ✅ Has cleanup (just added)
6. **EnhancedCoachSession.tsx** - ✅ Has cleanup (already had it)
7. **HumeCoachCall.tsx** - ✅ Has cleanup (already had it)
8. **HumeConnectionTest.tsx** - ✅ Has cleanup (just added)
9. **HumeDebug.tsx** - ✅ Has cleanup (just added)
10. **QuickDebug.tsx** - ✅ Has cleanup (just added)
11. **AudienceAnalyticsDashboard.tsx** - ✅ Has cleanup (just added)

## ALL COMPONENTS NOW COMPLIANT ✅

Every component that imports humeVoiceService now has proper cleanup!

## Why This Matters

- Hume has **strict connection limits**
- Leaked connections **lock out the account**
- The user has **promised Hume** this won't happen
- This is a **trust issue** with a partner company

## The Golden Rule

**If you import humeVoiceService, you MUST add cleanup.**

Think of it like using a toilet:
1. You use it (connect to Hume)
2. You flush it (disconnect on unmount)
3. You wash your hands (clean up resources)

## Verification Checklist

For EVERY component using Hume:
- [ ] Has cleanup useEffect with empty deps []
- [ ] Calls humeVoiceService.disconnect() on unmount
- [ ] Cleans up audio contexts
- [ ] Cleans up animation frames
- [ ] Logs cleanup for debugging

## Remember

**NO HUME WITHOUT CLEANUP. PERIOD.**
