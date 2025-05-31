// Voice service that supports multiple providers as fallbacks
// Priority: Hume AI -> OpenAI TTS -> ElevenLabs

interface VoiceConfig {
  provider: 'hume' | 'openai' | 'elevenlabs';
  voice: string;
  emotion?: string;
  speed?: number;
}

// Coach voice configurations
export const coachVoices = {
  grace: {
    hume: { voice: 'sophisticated_female', emotion: 'warm_confident' },
    openai: { voice: 'nova', speed: 0.95 }, // Nova is a warm, friendly voice
    elevenlabs: { voice: 'charlotte', style: 'sophisticated' }
  },
  posie: {
    hume: { voice: 'gentle_female', emotion: 'calm_nurturing' },
    openai: { voice: 'shimmer', speed: 0.9 }, // Shimmer is soft and expressive
    elevenlabs: { voice: 'lily', style: 'gentle' }
  },
  rizzo: {
    hume: { voice: 'confident_female', emotion: 'playful_bold' },
    openai: { voice: 'alloy', speed: 1.05 }, // Alloy is more energetic
    elevenlabs: { voice: 'nicole', style: 'confident' }
  }
};

class VoiceService {
  private openaiApiKey?: string;
  private elevenLabsApiKey?: string;
  private humeApiKey?: string;
  private currentProvider: 'hume' | 'openai' | 'elevenlabs' = 'openai';

  constructor() {
    // Load API keys from environment
    this.openaiApiKey = process.env.REACT_APP_OPENAI_API_KEY;
    this.elevenLabsApiKey = process.env.REACT_APP_ELEVENLABS_API_KEY;
    this.humeApiKey = process.env.REACT_APP_HUME_API_KEY;

    // Determine available provider
    if (this.humeApiKey) {
      this.currentProvider = 'hume';
    } else if (this.openaiApiKey) {
      this.currentProvider = 'openai';
    } else if (this.elevenLabsApiKey) {
      this.currentProvider = 'elevenlabs';
    }
  }

  async speak(text: string, coach: 'grace' | 'posie' | 'rizzo'): Promise<void> {
    const voiceConfig = coachVoices[coach][this.currentProvider];

    switch (this.currentProvider) {
      case 'openai':
        return this.speakWithOpenAI(text, voiceConfig);
      case 'elevenlabs':
        return this.speakWithElevenLabs(text, coach, voiceConfig);
      case 'hume':
        return this.speakWithHume(text, voiceConfig);
      default:
        console.warn('No voice provider available, using browser TTS');
        return this.speakWithBrowserTTS(text);
    }
  }

  private async speakWithOpenAI(text: string, config: any): Promise<void> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: config.voice,
          speed: config.speed || 1.0
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI TTS failed: ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      await audio.play();
      
      // Cleanup
      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(audioUrl);
      });
    } catch (error) {
      console.error('OpenAI TTS error:', error);
      // Fallback to browser TTS
      return this.speakWithBrowserTTS(text);
    }
  }

  private async speakWithElevenLabs(text: string, coach: string, config: any): Promise<void> {
    if (!this.elevenLabsApiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    // ElevenLabs implementation
    // This would require voice IDs from your ElevenLabs account
    console.log('ElevenLabs TTS would speak:', text, 'with voice:', config.voice);
    
    // For now, fallback to browser TTS
    return this.speakWithBrowserTTS(text);
  }

  private async speakWithHume(text: string, config: any): Promise<void> {
    if (!this.humeApiKey) {
      throw new Error('Hume API key not configured');
    }

    // Hume implementation would go here
    console.log('Hume AI would speak:', text, 'with config:', config);
    
    // For now, fallback to browser TTS
    return this.speakWithBrowserTTS(text);
  }

  private speakWithBrowserTTS(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Browser TTS not supported'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 1.0;

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(event);

      window.speechSynthesis.speak(utterance);
    });
  }

  // Get conversation responses from OpenAI
  async getCoachResponse(
    coach: 'grace' | 'posie' | 'rizzo',
    userInput: string,
    context: string
  ): Promise<string> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const coachPersonalities = {
      grace: "You are Grace, a sophisticated dating coach who speaks with warmth and elegance. You share wisdom through personal anecdotes from gallery openings, wine tastings, and cultural events. You guide users to discover insights themselves through gentle, probing questions.",
      posie: "You are Posie, an embodiment-focused dating coach who emphasizes body awareness and intuitive wisdom. You guide users to connect with their physical sensations and trust their embodied knowing. You speak in a calm, nurturing way with movement metaphors.",
      rizzo: "You are Rizzo, a bold and confident dating coach who uses humor and directness. You're playful, slightly provocative, and help users build authentic confidence. You use modern slang appropriately and encourage users to be unapologetically themselves."
    };

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: coachPersonalities[coach] + " Keep responses conversational and under 150 words."
            },
            {
              role: 'user',
              content: `Context: ${context}\n\nUser says: ${userInput}`
            }
          ],
          temperature: 0.8,
          max_tokens: 200
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }

  // Check which provider is available
  getAvailableProvider(): string {
    return this.currentProvider;
  }

  // Set API keys dynamically
  setApiKey(provider: 'openai' | 'elevenlabs' | 'hume', key: string) {
    switch (provider) {
      case 'openai':
        this.openaiApiKey = key;
        if (!this.humeApiKey) this.currentProvider = 'openai';
        break;
      case 'elevenlabs':
        this.elevenLabsApiKey = key;
        if (!this.humeApiKey && !this.openaiApiKey) this.currentProvider = 'elevenlabs';
        break;
      case 'hume':
        this.humeApiKey = key;
        this.currentProvider = 'hume';
        break;
    }
  }
}

export const voiceService = new VoiceService();
