import { useEffect, useRef, useState } from "react";
import lipsync from "lipsync"; // You must run: npm install lipsync

// Usage: useLipsync(audioUrl, onPhoneme)
export function useLipsync(audioUrl, onPhoneme) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!audioUrl) return;
    let cancel = false;

    async function processAudio() {
      // Fetch audio as ArrayBuffer
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();

      // Use lipsync.js to get phoneme timings
      const lipsyncData = await lipsync(arrayBuffer);

      // Play audio and animate
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      setIsPlaying(true);

      audio.play();

      // Animate blendshapes in sync
      let frame = 0;
      function animate() {
        if (cancel || !lipsyncData || !audioRef.current) return;
        const currentTime = audio.currentTime;
        // Find the current phoneme
        const currentPhoneme = lipsyncData.find(
          (d) => currentTime >= d.start && currentTime < d.end
        );
        if (currentPhoneme && onPhoneme) onPhoneme(currentPhoneme.phoneme);
        if (!audio.paused && !audio.ended) {
          frame = requestAnimationFrame(animate);
        } else {
          setIsPlaying(false);
        }
      }
      animate();

      return () => {
        cancel = true;
        if (frame) cancelAnimationFrame(frame);
        if (audioRef.current) audioRef.current.pause();
      };
    }

    processAudio();

    return () => {
      cancel = true;
      if (audioRef.current) audioRef.current.pause();
    };
  }, [audioUrl, onPhoneme]);

  return { isPlaying, audioRef };
}
