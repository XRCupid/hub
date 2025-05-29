import { BlendshapeKey, EMOTION_TO_BLENDSHAPE } from '../utils/blendshapes';

export interface HumeMessage {
  type: string;
  data?: any;
  error?: string;
}

export interface EmotionData {
  emotions: Array<{
    name: string;
    score: number;
  }>;
}

export interface PhonemeData {
  phoneme: string;
  start: number;
  end: number;
}

export class HumeService {
  private ws: WebSocket | null = null;
  private messageQueue: any[] = [];
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  
  constructor(
    private apiKey: string,
    private onMessage: (message: HumeMessage) => void,
    private onError?: (error: Event) => void,
    private onClose?: (event: CloseEvent) => void
  ) {}

  connect() {
    if (this.ws) {
      this.ws.close();
    }

    const wsUrl = `wss://api.hume.ai/v0/stream/models?apiKey=${this.apiKey}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('Connected to Hume AI WebSocket');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.processMessageQueue();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleIncomingMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (this.onError) {
        this.onError(error);
      }
      this.attemptReconnect();
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket connection closed', event);
      this.isConnected = false;
      if (this.onClose) {
        this.onClose(event);
      }
      if (!event.wasClean) {
        this.attemptReconnect();
      }
    };
  }


  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  private processMessageQueue() {
    if (!this.isConnected || !this.ws) return;
    
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.ws.send(JSON.stringify(message));
    }
  }

  private handleIncomingMessage(data: any) {
    if (!data) return;

    // Handle different types of messages from Hume
    if (data.type === 'error') {
      console.error('Hume AI error:', data.error);
      this.onMessage({ type: 'error', error: data.error });
      return;
    }

    // Handle emotion data
    if (data.face?.predictions?.[0]?.emotions) {
      const emotions = data.face.predictions[0].emotions;
      this.onMessage({
        type: 'emotion_data',
        data: { emotions }
      });
    }

    // Handle phoneme data if available
    if (data.phonemes) {
      this.onMessage({
        type: 'phoneme_data',
        data: { phonemes: data.phonemes }
      });
    }
  }

  sendAudioData(audioData: ArrayBuffer) {
    const message = {
      data: arrayBufferToBase64(audioData),
      models: {
        face: {}
      }
    };

    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageQueue = [];
    this.isConnected = false;
  }
}

// Helper function to convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
