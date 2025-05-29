/**
 * Mock Hume EVI data for testing the BlendshapeCompositor integration
 * Simulates the exact data flow: Hume audio + prosody + timeline
 */

import { BlendShapeMap } from '../types/blendshapes';

// Mock Hume prosody emotions (what you get from Hume EVI)
export const mockHumeProsodyData = [
  {
    name: 'joy',
    score: 0.9,
    timestamp: 0.0
  },
  {
    name: 'surprise', 
    score: 0.8,
    timestamp: 0.5
  },
  {
    name: 'contentment',
    score: 0.7,
    timestamp: 1.0
  },
  {
    name: 'excitement',
    score: 0.85,
    timestamp: 1.5
  }
];

// Additional emotion test sets for variety
export const mockEmotionSets = {
  happy: [
    { name: 'joy', score: 0.95, timestamp: 0.0 },
    { name: 'excitement', score: 0.8, timestamp: 0.0 },
    { name: 'amusement', score: 0.7, timestamp: 0.0 }
  ],
  sad: [
    { name: 'sadness', score: 0.9, timestamp: 0.0 },
    { name: 'calm', score: 0.3, timestamp: 0.0 }
  ],
  angry: [
    { name: 'anger', score: 0.95, timestamp: 0.0 },
    { name: 'contempt', score: 0.6, timestamp: 0.0 }
  ],
  surprised: [
    { name: 'surprise', score: 0.95, timestamp: 0.0 },
    { name: 'excitement', score: 0.4, timestamp: 0.0 }
  ],
  scared: [
    { name: 'fear', score: 0.9, timestamp: 0.0 },
    { name: 'surprise', score: 0.5, timestamp: 0.0 }
  ],
  disgusted: [
    { name: 'disgust', score: 0.9, timestamp: 0.0 },
    { name: 'contempt', score: 0.4, timestamp: 0.0 }
  ],
  confused: [
    { name: 'confusion', score: 0.8, timestamp: 0.0 },
    { name: 'concentration', score: 0.6, timestamp: 0.0 }
  ],
  content: [
    { name: 'contentment', score: 0.8, timestamp: 0.0 },
    { name: 'calm', score: 0.9, timestamp: 0.0 }
  ]
};

// Mock Hume timeline data (phonemes/visemes with timing)
export const mockHumeTimeline = [
  { type: 'phoneme', value: 'sil', time: 0.0, duration: 0.1 },
  { type: 'phoneme', value: 'h', time: 0.1, duration: 0.1 },
  { type: 'phoneme', value: 'eh', time: 0.2, duration: 0.15 },
  { type: 'phoneme', value: 'l', time: 0.35, duration: 0.1 },
  { type: 'phoneme', value: 'ow', time: 0.45, duration: 0.2 },
  { type: 'phoneme', value: 'sil', time: 0.65, duration: 0.1 },
  { type: 'phoneme', value: 'w', time: 0.75, duration: 0.1 },
  { type: 'phoneme', value: 'er', time: 0.85, duration: 0.15 },
  { type: 'phoneme', value: 'l', time: 1.0, duration: 0.1 },
  { type: 'phoneme', value: 'd', time: 1.1, duration: 0.1 },
  { type: 'phoneme', value: 'sil', time: 1.2, duration: 0.3 }
];

// Mock audio blob (silent audio for testing)
export function createMockAudioBlob(durationSeconds: number = 2.0): Blob {
  // Create a minimal WAV file with silence
  const sampleRate = 44100;
  const numSamples = sampleRate * durationSeconds;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);
  
  // Silent audio data (all zeros)
  for (let i = 0; i < numSamples; i++) {
    view.setInt16(44 + i * 2, 0, true);
  }
  
  return new Blob([buffer], { type: 'audio/wav' });
}

// Mock Hume message that would come through useVoice()
export const mockHumeMessages = [
  {
    type: 'user_message',
    id: 'msg_001',
    message: {
      role: 'user',
      content: 'Hello world'
    },
    timestamp: Date.now()
  },
  {
    type: 'assistant_message', 
    id: 'msg_002',
    message: {
      role: 'assistant',
      content: 'Hello! How are you doing today?',
      prosody: mockHumeProsodyData,
      timeline: mockHumeTimeline
    },
    timestamp: Date.now() + 1000
  },
  {
    type: 'audio_output',
    id: 'audio_001',
    audioBlob: createMockAudioBlob(2.0),
    prosody: mockHumeProsodyData,
    timeline: mockHumeTimeline,
    timestamp: Date.now() + 2000
  }
];

// Function to simulate the Hume EVI message flow
export class MockHumeEVI {
  private messageIndex = 0;
  private onMessage?: (message: any) => void;
  private interval?: NodeJS.Timeout;

  constructor(onMessage: (message: any) => void) {
    this.onMessage = onMessage;
  }

  start() {
    console.log('🎭 Starting Mock Hume EVI simulation...');
    
    this.interval = setInterval(() => {
      if (this.messageIndex >= mockHumeMessages.length) {
        this.stop();
        return;
      }

      const message = mockHumeMessages[this.messageIndex];
      console.log(`🎭 Mock Hume sending message:`, message.type);
      
      if (this.onMessage) {
        this.onMessage(message);
      }
      
      this.messageIndex++;
    }, 3000); // Send a message every 3 seconds
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
    console.log('🎭 Mock Hume EVI simulation stopped');
  }

  // Simulate speaking a specific phrase
  speak(text: string, emotion: string = 'joy') {
    const prosody = mockHumeProsodyData.map(p => 
      p.name === emotion ? { ...p, score: 0.9 } : { ...p, score: 0.1 }
    );

    const message = {
      type: 'audio_output',
      id: `audio_${Date.now()}`,
      audioBlob: createMockAudioBlob(2.0),
      prosody: prosody,
      timeline: mockHumeTimeline,
      timestamp: Date.now()
    };

    console.log(`🎭 Mock Hume speaking: "${text}" with emotion: ${emotion}`);
    
    if (this.onMessage) {
      this.onMessage(message);
    }
  }
}

// Export for browser console testing
(window as any).mockHumeEVI = {
  MockHumeEVI,
  mockHumeMessages,
  mockHumeProsodyData,
  mockHumeTimeline,
  createMockAudioBlob
};
