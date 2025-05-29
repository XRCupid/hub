import { useState, useCallback, useEffect, useRef } from 'react';
import { PHONEME_TO_BLENDSHAPE } from '@/utils/blendshapes';

type Phoneme = keyof typeof PHONEME_TO_BLENDSHAPE;
type PhonemeHandler = (phoneme: Phoneme | null) => void;

interface UseVoiceOptions {
  onPhonemeChange?: PhonemeHandler;
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

interface UseVoiceReturn {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  currentPhoneme: Phoneme | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
  speak: (text: string) => Promise<void>;
  stopSpeaking: () => void;
  error: string | null;
}

/**
 * Custom hook for voice recognition and synthesis with phoneme tracking
 */
export function useVoice({
  onPhonemeChange,
  language = 'en-US',
  continuous = true,
  interimResults = true,
}: UseVoiceOptions = {}): UseVoiceReturn {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [currentPhoneme, setCurrentPhoneme] = useState<Phoneme | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const phonemeTimerRef = useRef<number | null>(null);
  
  // Track if the component is mounted
  const isMounted = useRef(true);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      stopListening();
      stopSpeaking();
    };
  }, []);

  // Initialize speech recognition
  const initRecognition = useCallback((): SpeechRecognition | null => {
    if (typeof window === 'undefined') return null;
    
    const SpeechRecognition = window.SpeechRecognition || 
                             (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser');
      return null;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;
    
    recognition.onstart = () => {
      if (isMounted.current) {
        setIsListening(true);
      }
    };
    
    recognition.onend = () => {
      if (isMounted.current) {
        setIsListening(false);
      }
    };
    
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
      
      if (isMounted.current) {
        setTranscript(finalTranscript || interimTranscript);
      }
    };
    
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      if (isMounted.current) {
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      }
    };
    
    return recognition;
  }, [continuous, interimResults, language]);
  
  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthesisRef.current = window.speechSynthesis;
    }
    
    return () => {
      if (synthesisRef.current?.speaking) {
        synthesisRef.current.cancel();
      }
    };
  }, []);

  // Handle phoneme changes
  const handlePhoneme = useCallback((phoneme: Phoneme | null) => {
    if (isMounted.current) {
      setCurrentPhoneme(phoneme);
      
      // Notify parent component of phoneme change
      if (onPhonemeChange) {
        onPhonemeChange(phoneme);
      }
      
      // Reset phoneme after a short delay if not already changed
      if (phonemeTimerRef.current) {
        window.clearTimeout(phonemeTimerRef.current);
      }
      
      if (phoneme) {
        phonemeTimerRef.current = window.setTimeout(() => {
          if (isMounted.current) {
            setCurrentPhoneme(null);
            if (onPhonemeChange) {
              onPhonemeChange(null);
            }
          }
        }, 100); // Short delay to show the phoneme
      }
    }
  }, [onPhonemeChange]);

  // Start listening for speech
  const startListening = useCallback(async () => {
    try {
      if (!recognitionRef.current) {
        recognitionRef.current = initRecognition();
      }
      
      if (recognitionRef.current) {
        setError(null);
        recognitionRef.current.start();
      }
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setError('Failed to start speech recognition');
    }
  }, [initRecognition]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  // Speak text with phoneme tracking
  const speak = useCallback(async (text: string) => {
    if (!synthesisRef.current) {
      setError('Speech synthesis not available');
      return;
    }
    
    // Stop any ongoing speech
    if (synthesisRef.current.speaking) {
      synthesisRef.current.cancel();
    }
    
    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    
    // Set up events
    utterance.onstart = () => {
      if (isMounted.current) {
        setIsSpeaking(true);
      }
    };
    
    utterance.onend = () => {
      if (isMounted.current) {
        setIsSpeaking(false);
        handlePhoneme(null);
      }
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      if (isMounted.current) {
        setError('Error during speech synthesis');
        setIsSpeaking(false);
        handlePhoneme(null);
      }
    };
    
    // Simulate phonemes (simplified - in a real app, you'd use WebVTT or similar)
    let wordIndex = 0;
    const words = text.split(/\s+/);
    
    const speakNextWord = () => {
      if (wordIndex >= words.length) return;
      
      const word = words[wordIndex];
      // Simple phoneme mapping (this is a simplification)
      const firstChar = word[0]?.toLowerCase() || '';
      let phoneme: Phoneme | null = null;
      
      // Map first character to a phoneme (simplified)
      if ('aeiou'.includes(firstChar)) {
        phoneme = 'aa';
      } else if ('bfpv'.includes(firstChar)) {
        phoneme = 'PP';
      } else if ('dt'.includes(firstChar)) {
        phoneme = 'DD';
      } else if ('sz'.includes(firstChar)) {
        phoneme = 'SS';
      } else if (firstChar === 'm') {
        phoneme = 'MM';
      } else if (firstChar === 'n') {
        phoneme = 'nn';
      }
      
      if (phoneme) {
        handlePhoneme(phoneme);
      }
      
      wordIndex++;
      
      if (wordIndex < words.length) {
        // Schedule next word
        setTimeout(speakNextWord, Math.max(100, word.length * 50)); // Adjust timing as needed
      }
    };
    
    // Start speaking
    synthesisRef.current.speak(utterance);
    speakNextWord();
    
  }, [handlePhoneme]);
  
  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      if (isMounted.current) {
        setIsSpeaking(false);
        handlePhoneme(null);
      }
    }
  }, [handlePhoneme]);

  return {
    isListening,
    isSpeaking,
    transcript,
    currentPhoneme,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    error,
  };
}
