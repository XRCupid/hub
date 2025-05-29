export interface ChatMessage {
  sender: 'user' | 'avatar';
  text: string;
  timestamp: number;
  role?: 'user' | 'assistant';
  content?: string;
}

export interface UseVoiceReturn {
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  transcript: string;
}

export interface UseAvatarReturn {
  isSpeaking: boolean;
  currentPhoneme: string | null;
  blendShapes: Record<string, number>;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  setIsSpeaking: (isSpeaking: boolean) => void;
  setCurrentPhoneme: (phoneme: string | null) => void;
  setBlendShapes: (blendShapes: Record<string, number>) => void;
}
