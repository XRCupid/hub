# NPC Conversation Setup - Source of Truth

## Overview
This document provides the authoritative setup guide for implementing NPC conversations with Hume-powered avatars in the XRCupid application. The implementation pattern described here has been proven to work without audio skipping, double voices, or other playback issues.

## Core Components

### 1. DougieSpeedDateV3 - Reference Implementation
**Location**: `/src/components/DougieSpeedDateV3.tsx`

This component serves as the reference implementation for NPC conversations with the following key features:
- Smooth audio playback without skipping
- Proper lip sync with avatar animations
- User emotion tracking and transcript integration
- Chemistry report generation
- Picture-in-Picture (PiP) user video

### 2. Audio Implementation Pattern (CRITICAL)

The audio system MUST follow the coach session pattern to avoid issues:

```typescript
// Audio Queue System
const audioQueueRef = useRef<Blob[]>([]);
const isPlayingRef = useRef(false);

// Audio Element (NOT AudioContext.decodeAudioData)
const audioPlayerRef = useRef<HTMLAudioElement>(new Audio());

// Queue audio blobs instead of immediate playback
const playAudio = async (audioBlob: Blob) => {
  console.log('[NPC] Audio received:', audioBlob.size);
  setIsSpeaking(true);
  setAnimationName('talking');
  audioQueueRef.current.push(audioBlob);
  if (!isPlayingRef.current) {
    playNextAudioFromQueue();
  }
};

// Sequential playback function
const playNextAudioFromQueue = () => {
  if (audioQueueRef.current.length === 0) {
    isPlayingRef.current = false;
    setIsSpeaking(false);
    setAnimationName('idle');
    return;
  }
  
  isPlayingRef.current = true;
  const audioBlob = audioQueueRef.current.shift()!;
  const audioUrl = URL.createObjectURL(audioBlob);
  audioPlayerRef.current.src = audioUrl;
  
  // MediaElementSource for lip sync
  if (!audioSourceCreatedRef.current) {
    const source = audioContext.createMediaElementSource(audioPlayerRef.current);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    audioSourceCreatedRef.current = true;
  }
  
  audioPlayerRef.current.play();
  
  audioPlayerRef.current.onended = () => {
    URL.revokeObjectURL(audioUrl);
    isPlayingRef.current = false;
    setTimeout(() => playNextAudioFromQueue(), 100);
  };
};
```

### 3. Audio Blocking (REQUIRED)

Prevent Hume SDK from playing its own audio stream:

```typescript
// In component useEffect
const blockHumeAudio = () => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLAudioElement) {
          node.muted = true;
          node.volume = 0;
          node.pause();
          
          // Prevent unmuting
          Object.defineProperty(node, 'muted', {
            get: () => true,
            set: () => true
          });
        }
      });
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Re-apply blocking every 500ms
  const interval = setInterval(() => {
    document.querySelectorAll('audio').forEach(audio => {
      if (audio !== audioPlayerRef.current) {
        audio.muted = true;
        audio.volume = 0;
      }
    });
  }, 500);
};
```

### 4. Lip Sync Implementation

Use requestAnimationFrame for smooth updates:

```typescript
useEffect(() => {
  if (!isSpeaking || !analyserRef.current) {
    setAudioData(new Uint8Array());
    return;
  }

  const analyser = analyserRef.current;
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  let animationId: number;

  const updateAudioData = () => {
    analyser.getByteFrequencyData(dataArray);
    setAudioData(new Uint8Array(dataArray));
    animationId = requestAnimationFrame(updateAudioData);
  };

  updateAudioData();

  return () => {
    cancelAnimationFrame(animationId);
    setAudioData(new Uint8Array());
  };
}, [isSpeaking]);
```

### 5. Voice Service Setup

```typescript
const voiceService = new HybridVoiceService();

// Audio callback
voiceService.onAudio((audioBlob: Blob) => {
  if (audioBlob && audioBlob.size > 0) {
    playAudio(audioBlob); // Queue it, don't play directly!
  }
});

// Emotion callback
voiceService.onEmotion((emotions: Array<{name: string, score: number}>) => {
  // Convert to avatar blendshapes
  const blendshapes = mapEmotionsToBlendshapes(emotions);
  setEmotionalBlendshapes(blendshapes);
});

// Connect with Hume config
await voiceService.connect(NPC_CONFIG.humeConfigId);
```

### 6. Face Tracking for User Emotions

User facial emotions are captured directly from the camera using CombinedFaceTrackingService:

```typescript
// Import the service
import { CombinedFaceTrackingService } from '../services/CombinedFaceTrackingService';

// Create refs
const faceTrackingServiceRef = useRef<CombinedFaceTrackingService | null>(null);
const faceVideoRef = useRef<HTMLVideoElement | null>(null);

// Initialize when camera is ready
useEffect(() => {
  if (!cameraStream) return;
  
  const initFaceTracking = async () => {
    faceTrackingServiceRef.current = new CombinedFaceTrackingService();
    await faceTrackingServiceRef.current.initialize();
    
    if (faceVideoRef.current) {
      faceVideoRef.current.srcObject = cameraStream;
      await faceVideoRef.current.play();
      await faceTrackingServiceRef.current.startTracking(faceVideoRef.current);
    }
    
    // Poll for expressions
    const pollExpressions = setInterval(() => {
      if (faceTrackingServiceRef.current) {
        const expressions = faceTrackingServiceRef.current.getExpressions();
        setUserBlendshapes(expressions);
      }
    }, 100);
  };
  
  initFaceTracking();
}, [cameraStream]);

// Convert blendshapes to emotions
const mapBlendshapesToEmotions = (blendshapes) => {
  const emotions = [];
  
  // Joy detection
  const smileScore = (blendshapes['mouthSmileLeft'] + blendshapes['mouthSmileRight']) / 2;
  if (smileScore > 0.3) emotions.push({ name: 'joy', score: smileScore });
  
  // Surprise detection
  const surpriseScore = Math.max(blendshapes['browInnerUp'], blendshapes['eyeWideLeft']);
  if (surpriseScore > 0.4) emotions.push({ name: 'surprise', score: surpriseScore });
  
  return emotions;
};
```

### 7. Transcript Integration

Both user and NPC emotions are captured in transcript segments:

```typescript
// User message with facial emotions
const userSegment: TranscriptSegment = {
  timestamp: Date.now(),
  speaker: 'user',
  text: message,
  emotions: [],
  prosodyEmotions: undefined,
  facialEmotions: userEmotions.length > 0 ? [...userEmotions] : undefined
};

// Assistant message with emotions
const assistantSegment: TranscriptSegment = {
  timestamp: Date.now(),
  speaker: 'assistant',
  text: message,
  emotions: [],
  prosodyEmotions: undefined,
  facialEmotions: dougieEmotions.length > 0 ? [...dougieEmotions] : undefined
};
```

### 8. NPC Configuration

Each NPC should have:

```typescript
interface NPCConfig {
  id: string;
  name: string;
  avatarUrl: string; // GLB file path
  humeConfigId: string; // Hume voice config
  systemPrompt: string;
  personality: NPCPersonality;
  animations: {
    idle: string;
    talking: string;
  };
}
```

## Key Principles

1. **NEVER use AudioContext.decodeAudioData** - This allows multiple audio streams
2. **ALWAYS queue audio blobs** - Prevents overlapping/skipping
3. **Use HTMLAudioElement** - SDK can't interfere with controlled elements
4. **Block external audio aggressively** - Prevent SDK from creating audio elements
5. **Sequential playback only** - Each audio must finish before next starts
6. **RequestAnimationFrame for lip sync** - Smooth visual updates

## Common Issues and Solutions

### Issue: Double/Triple Voices
**Cause**: Hume SDK playing its own audio
**Solution**: Implement aggressive audio blocking (see section 3)

### Issue: Audio Skipping/Cutting Off
**Cause**: Playing audio immediately instead of queuing
**Solution**: Use queue system with sequential playback

### Issue: Choppy Lip Sync
**Cause**: Using setInterval instead of requestAnimationFrame
**Solution**: Use requestAnimationFrame for smooth updates

### Issue: No Audio
**Cause**: AudioContext not resumed or audio element not set up
**Solution**: Resume AudioContext on user interaction, check element setup

## Testing Checklist

- [ ] Single voice playback (no doubling)
- [ ] Smooth audio without skipping
- [ ] Lip sync matches speech
- [ ] Emotions display on avatar face
- [ ] Audio completes full sentences
- [ ] No console errors about audio
- [ ] Chemistry report generates properly
- [ ] User video (PiP) works if enabled

## Example NPCs

1. **Dougie** - Creative Director
   - Avatar: `/avatars/Douglas.glb`
   - Voice: Friendly, humorous
   - Topics: VR/AR, design, food

2. **Haseeb** - Tech Entrepreneur
   - Avatar: `/avatars/Haseeb.glb`
   - Voice: Analytical, driven
   - Topics: Tech, fitness, startups

3. **Mindy** - Fashion Influencer
   - Avatar: `/avatars/Mindy.glb`
   - Voice: Bubbly, confident
   - Topics: Fashion, travel, lifestyle

## Chemistry Report Features

## References

- Working Implementation: `/src/components/DougieSpeedDateV3.tsx`
- Coach Pattern: `/src/components/CoachSession.tsx`
- NPC Personalities: `/src/config/NPCPersonalities.ts`
- Avatar Files: `/public/avatars/`

---

Last Updated: June 2024
Maintained by: XRCupid Engineering Team
