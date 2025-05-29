import { useState, useRef, useEffect, useCallback } from 'react';
import { PHONEME_TO_BLENDSHAPE } from '../utils/blendshapes';


export const useVoice = (onPhonemeChange?: (phoneme: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [currentPhoneme, setCurrentPhoneme] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const phonemeTimerRef = useRef<number | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }


      setTranscript(finalTranscript || interimTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListening) {
        recognition.start();
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [isListening]);

  // Handle phoneme changes
  useEffect(() => {
    if (onPhonemeChange && currentPhoneme) {
      onPhonemeChange(currentPhoneme);
    }
  }, [currentPhoneme, onPhonemeChange]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (phonemeTimerRef.current) {
        window.clearTimeout(phonemeTimerRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthesisRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const speak = useCallback((text: string) => {
    return new Promise<void>((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        console.warn('Speech synthesis not supported in this browser');
        resolve();
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      synthesisRef.current = utterance;
      setIsSpeaking(true);

      // Simple phoneme simulation - in a real app, you'd get this from a TTS API
      const words = text.split(/\s+/);
      let wordIndex = 0;

      const speakNextWord = () => {
        if (wordIndex >= words.length) {
          setIsSpeaking(false);
          resolve();
          return;
        }

        const word = words[wordIndex];
        // Get the first letter as a simple phoneme simulation
        const firstLetter = word.charAt(0).toUpperCase();
        const phoneme = Object.keys(PHONEME_TO_BLENDSHAPE).find(p => p.startsWith(firstLetter)) || 'AA';
        
        setCurrentPhoneme(phoneme);
        
        // Simulate phoneme duration (simplified)
        const duration = Math.max(100, word.length * 50);
        
        phonemeTimerRef.current = window.setTimeout(() => {
          setCurrentPhoneme(null);
          wordIndex++;
          speakNextWord();
        }, duration);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setCurrentPhoneme(null);
        if (phonemeTimerRef.current) {
          window.clearTimeout(phonemeTimerRef.current);
        }
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
        setCurrentPhoneme(null);
        if (phonemeTimerRef.current) {
          window.clearTimeout(phonemeTimerRef.current);
        }
        resolve();
      };

      window.speechSynthesis.speak(utterance);
      speakNextWord();
    });
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setCurrentPhoneme(null);
      if (phonemeTimerRef.current) {
        window.clearTimeout(phonemeTimerRef.current);
      }
    }
  }, []);

  return {
    isListening,
    isSpeaking,
    transcript,
    currentPhoneme,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
};

export default useVoice;
