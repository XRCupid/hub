// Voice service that supports multiple providers as fallbacks
// Priority: Hume AI -> OpenAI TTS -> ElevenLabs

interface VoiceConfig {
  provider: 'hume' | 'openai' | 'elevenlabs';
  voice: string;
  emotion?: string;
  speed?: number;
  model?: string;
}

// Coach voice configurations
export const coachVoices = {
  grace: {
    hume: { voice: 'sophisticated_female', emotion: 'warm_confident' },
    openai: { voice: 'nova', speed: 0.95, model: 'tts-1-hd' }, // Nova is a warm, friendly voice
    elevenlabs: { 
      voiceId: '21m00Tcm4TlvDq8ikWAM',  // Rachel - mature, warm
      modelId: 'eleven_multilingual_v2',
      stability: 0.5, 
      similarity: 0.8,
      style: 0.3,
      useSpeakerBoost: true
    }
  },
  posie: {
    hume: { voice: 'gentle_female', emotion: 'calm_nurturing' },
    openai: { voice: 'shimmer', speed: 0.9, model: 'tts-1-hd' }, // Shimmer is soft and expressive
    elevenlabs: { 
      voiceId: 'AZnzlk1XvdvUeBnXmlld',  // Domi - soft, nurturing
      modelId: 'eleven_multilingual_v2',
      stability: 0.7, 
      similarity: 0.7,
      style: 0.2,
      useSpeakerBoost: true
    }
  },
  rizzo: {
    hume: { voice: 'confident_female', emotion: 'playful_bold' },
    openai: { voice: 'alloy', speed: 1.05, model: 'tts-1-hd' }, // Alloy is more energetic
    elevenlabs: { 
      voiceId: 'EXAVITQu4vr4xnSDxMaL',  // Bella - energetic, confident
      modelId: 'eleven_multilingual_v2',
      stability: 0.3, 
      similarity: 0.9,
      style: 0.5,
      useSpeakerBoost: true
    }
  }
};

type VoiceProvider = 'hume' | 'openai' | 'elevenlabs' | 'browser';

class VoiceService {
  private providers: Set<VoiceProvider> = new Set();
  private preferredProvider: VoiceProvider | null = null;
  private openaiApiKey?: string;
  private elevenLabsApiKey?: string;
  private humeApiKey?: string;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Load API keys from environment
    this.openaiApiKey = process.env.REACT_APP_OPENAI_API_KEY;
    this.elevenLabsApiKey = process.env.REACT_APP_ELEVENLABS_API_KEY;
    this.humeApiKey = process.env.REACT_APP_HUME_API_KEY;

    // Determine available providers
    if (this.humeApiKey) {
      this.providers.add('hume');
    }
    if (this.openaiApiKey) {
      this.providers.add('openai');
    }
    if (this.elevenLabsApiKey) {
      this.providers.add('elevenlabs');
    }
    this.providers.add('browser');
  }

  async speak(text: string, coach: 'grace' | 'posie' | 'rizzo'): Promise<HTMLAudioElement | null> {
    const provider = this.getAvailableProvider();
    
    switch (provider) {
      case 'hume':
        // Hume AI would handle its own audio
        console.log('Hume AI TTS not implemented yet');
        return null;
        
      case 'openai':
        return await this.speakWithOpenAI(text, coach);
        
      case 'elevenlabs':
        return await this.speakWithElevenLabs(text, coach);
        
      case 'browser':
        return await this.speakWithBrowser(text);
        
      default:
        console.error('No TTS provider available');
        return null;
    }
  }
  
  private async speakWithOpenAI(text: string, coach: string): Promise<HTMLAudioElement | null> {
    const apiKey = this.openaiApiKey || process.env.REACT_APP_OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OpenAI API key not set');
      return null;
    }
    
    try {
      const voiceConfig = coachVoices[coach as keyof typeof coachVoices].openai;
      
      // Add natural pauses and emphasis to text
      const processedText = this.addNaturalSpeechPatterns(text, coach);
      
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: voiceConfig.model || 'tts-1-hd',  // Use HD model
          input: processedText,
          voice: voiceConfig.voice,
          speed: voiceConfig.speed || 1.0
        })
      });
      
      if (!response.ok) {
        throw new Error(`OpenAI TTS failed: ${response.statusText}`);
      }
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // Add subtle audio processing
      if ('AudioContext' in window) {
        const audioContext = new AudioContext();
        const source = audioContext.createMediaElementSource(audio);
        
        // Add warmth with subtle compression
        const compressor = audioContext.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-50, audioContext.currentTime);
        compressor.knee.setValueAtTime(40, audioContext.currentTime);
        compressor.ratio.setValueAtTime(12, audioContext.currentTime);
        compressor.attack.setValueAtTime(0, audioContext.currentTime);
        compressor.release.setValueAtTime(0.25, audioContext.currentTime);
        
        // Add presence with subtle high-frequency boost
        const highShelf = audioContext.createBiquadFilter();
        highShelf.type = 'highshelf';
        highShelf.frequency.setValueAtTime(3000, audioContext.currentTime);
        highShelf.gain.setValueAtTime(2, audioContext.currentTime);
        
        // Connect the audio graph
        source.connect(compressor);
        compressor.connect(highShelf);
        highShelf.connect(audioContext.destination);
      }
      
      // Play and return the audio element
      await audio.play();
      return audio;
    } catch (error) {
      console.error('OpenAI TTS error:', error);
      return null;
    }
  }
  
  private addNaturalSpeechPatterns(text: string, coach: string): string {
    // Add natural pauses and emphasis based on coach personality
    let processed = text;
    
    switch (coach) {
      case 'grace':
        // Add elegant pauses and emphasis
        processed = processed
          .replace(/\. /g, '... ')  // Longer pauses between sentences
          .replace(/, /g, '.. ')    // Medium pauses at commas
          .replace(/darling/gi, '*darling*')  // Emphasis on endearments
          .replace(/wonderful/gi, '*wonderful*');
        break;
        
      case 'posie':
        // Add contemplative pauses
        processed = processed
          .replace(/\. /g, '.... ')  // Even longer pauses for reflection
          .replace(/feel/gi, '*feel*')  // Emphasis on feeling words
          .replace(/breathe/gi, '... *breathe* ...')
          .replace(/\?/g, '?...');  // Pause after questions
        break;
        
      case 'rizzo':
        // Add energetic emphasis
        processed = processed
          .replace(/!/g, '!!')  // Extra excitement
          .replace(/hot stuff/gi, '*hot stuff*')
          .replace(/amazing/gi, '*AMAZING*')
          .replace(/\. /g, '! ');  // Turn periods into excitement
        break;
    }
    
    return processed;
  }
  
  private async speakWithElevenLabs(text: string, coach: string): Promise<HTMLAudioElement | null> {
    const apiKey = this.elevenLabsApiKey || process.env.REACT_APP_ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.log('ElevenLabs API key not set, falling back to OpenAI');
      return this.speakWithOpenAI(text, coach);
    }
    
    try {
      const voiceConfig = coachVoices[coach as keyof typeof coachVoices].elevenlabs;
      
      // Add natural speech patterns
      const processedText = this.addNaturalSpeechPatterns(text, coach);
      
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceConfig.voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: processedText,
          model_id: voiceConfig.modelId,
          voice_settings: {
            stability: voiceConfig.stability,
            similarity_boost: voiceConfig.similarity,
            style: voiceConfig.style || 0,
            use_speaker_boost: voiceConfig.useSpeakerBoost || true
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`ElevenLabs TTS failed: ${response.statusText}`);
      }
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // Apply same audio processing as OpenAI
      if ('AudioContext' in window) {
        const audioContext = new AudioContext();
        const source = audioContext.createMediaElementSource(audio);
        
        // Add warmth with subtle compression
        const compressor = audioContext.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-50, audioContext.currentTime);
        compressor.knee.setValueAtTime(40, audioContext.currentTime);
        compressor.ratio.setValueAtTime(12, audioContext.currentTime);
        compressor.attack.setValueAtTime(0, audioContext.currentTime);
        compressor.release.setValueAtTime(0.25, audioContext.currentTime);
        
        // Add presence with subtle high-frequency boost
        const highShelf = audioContext.createBiquadFilter();
        highShelf.type = 'highshelf';
        highShelf.frequency.setValueAtTime(3000, audioContext.currentTime);
        highShelf.gain.setValueAtTime(2, audioContext.currentTime);
        
        // Connect the audio graph
        source.connect(compressor);
        compressor.connect(highShelf);
        highShelf.connect(audioContext.destination);
      }
      
      // Play and return the audio element
      await audio.play();
      return audio;
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      // Fallback to OpenAI
      return this.speakWithOpenAI(text, coach);
    }
  }
  
  private async speakWithBrowser(text: string): Promise<HTMLAudioElement | null> {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onend = () => resolve(null);
      utterance.onerror = () => resolve(null);
      
      window.speechSynthesis.speak(utterance);
    });
  }

  setPreferredProvider(provider: VoiceProvider | null): void {
    if (provider && this.providers.has(provider)) {
      this.preferredProvider = provider;
      console.log(`Voice provider preference set to: ${provider}`);
    } else if (provider === null) {
      this.preferredProvider = null;
      console.log('Voice provider preference cleared');
    } else {
      console.warn(`Provider ${provider} not available`);
    }
  }

  getAvailableProvider(): VoiceProvider | null {
    // Use preferred provider if set and available
    if (this.preferredProvider && this.providers.has(this.preferredProvider)) {
      return this.preferredProvider;
    }
    
    // Otherwise use priority order
    const priority: VoiceProvider[] = ['elevenlabs', 'openai', 'hume', 'browser'];
    
    for (const provider of priority) {
      if (this.providers.has(provider)) {
        return provider;
      }
    }
    
    return null;
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

  // Set API keys dynamically
  setApiKey(provider: 'openai' | 'elevenlabs' | 'hume', key: string) {
    switch (provider) {
      case 'openai':
        this.openaiApiKey = key;
        if (!this.humeApiKey) this.providers.add('openai');
        break;
      case 'elevenlabs':
        this.elevenLabsApiKey = key;
        if (!this.humeApiKey && !this.openaiApiKey) this.providers.add('elevenlabs');
        break;
      case 'hume':
        this.humeApiKey = key;
        this.providers.add('hume');
        break;
    }
  }
}

export const voiceService = new VoiceService();
