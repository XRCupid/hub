# NPC Implementation Quick Reference

## 🎯 Audio Setup (Copy This Pattern!)

```typescript
// 1. REFS (Add these to your component)
const audioPlayerRef = useRef<HTMLAudioElement>(new Audio());
const audioQueueRef = useRef<Blob[]>([]);
const isPlayingRef = useRef(false);
const audioContextRef = useRef<AudioContext | null>(null);
const analyserRef = useRef<AnalyserNode | null>(null);
const audioSourceCreatedRef = useRef<boolean>(false);

// 2. AUDIO HANDLER (Replace your playAudio with this)
const playAudio = async (audioBlob: Blob) => {
  console.log('[NPC] Audio received:', audioBlob.size);
  setIsSpeaking(true);
  setAnimationName('talking');
  audioQueueRef.current.push(audioBlob);
  if (!isPlayingRef.current) {
    playNextAudioFromQueue();
  }
};

// 3. QUEUE PLAYER (Add this function)
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
  
  // Setup analyzer on first play only
  if (!audioSourceCreatedRef.current) {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const analyser = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaElementSource(audioPlayerRef.current);
      source.connect(analyser);
      analyser.connect(audioContextRef.current.destination);
      analyserRef.current = analyser;
      audioSourceCreatedRef.current = true;
    } catch (error) {
      console.error('[NPC] Audio setup error:', error);
    }
  }
  
  audioPlayerRef.current.play()
    .then(() => {
      setIsSpeaking(true);
      setAnimationName('talking');
    })
    .catch(e => {
      console.error('[NPC] Play error:', e);
      isPlayingRef.current = false;
      setTimeout(() => playNextAudioFromQueue(), 100);
    });
  
  audioPlayerRef.current.onended = () => {
    URL.revokeObjectURL(audioUrl);
    isPlayingRef.current = false;
    setIsSpeaking(false);
    setAnimationName('idle');
    setTimeout(() => playNextAudioFromQueue(), 100);
  };
};

// 4. VOICE SERVICE SETUP
voiceService.onAudio((audioBlob: Blob) => {
  if (audioBlob && audioBlob.size > 0) {
    playAudio(audioBlob); // Just queue it!
  }
});
```

## ⚠️ Common Mistakes to Avoid

1. ❌ **DON'T** use `AudioContext.decodeAudioData`
2. ❌ **DON'T** play audio immediately in onAudio callback
3. ❌ **DON'T** create multiple AudioContexts
4. ❌ **DON'T** use setInterval for lip sync

## ✅ Must-Have Features

1. ✅ Audio queue system
2. ✅ HTMLAudioElement for playback
3. ✅ Audio blocking for Hume SDK
4. ✅ Sequential playback with onended
5. ✅ RequestAnimationFrame for lip sync

## 🚀 Quick Start

1. Copy the audio setup code above
2. Add audio blocking in your useEffect
3. Use DougieSpeedDateV3 as reference
4. Test with console logs to verify queue behavior

## 📝 Debugging Tips

- Check console for "Audio received" logs
- Verify queue length in playNextAudioFromQueue
- Ensure only one audio plays at a time
- Look for "Audio ended, playing next" logs

---
See full documentation: `/docs/NPC_CONVERSATION_SETUP.md`
