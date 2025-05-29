type MessageHandler = (message: any) => void;
type ErrorHandler = (error: any) => void;
type CloseHandler = (event: CloseEvent) => void;

interface HumeServiceOptions {
  apiKey: string;
  onMessage?: MessageHandler;
  onError?: ErrorHandler;
  onClose?: CloseHandler;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export class HumeService {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts: number;
  private reconnectDelay: number;
  private currentAttempt = 0;
  private _isConnected = false;
  private messageQueue: any[] = [];
  
  private readonly apiKey: string;
  private readonly url = 'wss://api.hume.ai/v0/stream';
  
  private readonly onMessage: MessageHandler;
  private readonly onError: ErrorHandler;
  private readonly onClose: CloseHandler;
  
  constructor({
    apiKey,
    onMessage = () => {},
    onError = (error) => console.error('Hume WebSocket error:', error),
    onClose = () => {},
    reconnectAttempts = 5,
    reconnectDelay = 3000,
  }: HumeServiceOptions) {
    if (!apiKey) {
      throw new Error('Hume API key is required');
    }
    
    this.apiKey = apiKey;
    this.onMessage = onMessage;
    this.onError = onError;
    this.onClose = onClose;
    this.reconnectAttempts = Math.max(0, reconnectAttempts);
    this.reconnectDelay = Math.max(1000, reconnectDelay);
    
    this.connect();
  }
  
  /**
   * Connect to the Hume WebSocket API
   */
  public connect(): void {
    if (this.ws) {
      this.close();
    }
    
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      
    } catch (error) {
      this.handleError(error);
      this.attemptReconnect();
    }
  }
  
  /**
   * Close the WebSocket connection
   */
  public close(): void {
    this.clearReconnectTimer();
    
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close();
      }
      
      this.ws = null;
    }
    
    this._isConnected = false;
  }
  
  /**
   * Send a message through the WebSocket
   */
  public async sendMessage(text: string): Promise<void> {
    if (!text?.trim()) {
      throw new Error('Message text cannot be empty');
    }
    
    const message = {
      type: 'chat',
      data: {
        text,
        config: {
          // Configure Hume models as needed
          language: 'en-US',
          temperature: 0.7,
          max_tokens: 150,
        }
      }
    };
    
    return this.send(JSON.stringify(message));
  }
  
  /**
   * Send audio data for processing
   */
  public async sendAudio(audioData: ArrayBuffer): Promise<void> {
    if (!audioData || audioData.byteLength === 0) {
      throw new Error('Audio data cannot be empty');
    }
    
    const message = {
      type: 'audio',
      data: {
        audio: arrayBufferToBase64(audioData),
        config: {
          // Audio processing configuration
          sample_rate: 16000,
          encoding: 'pcm_s16le',
          channels: 1,
        }
      }
    };
    
    return this.send(JSON.stringify(message));
  }
  
  /**
   * Check if the WebSocket is connected
   */
  public get isConnected(): boolean {
    return this._isConnected && this.ws?.readyState === WebSocket.OPEN;
  }
  
  /**
   * Clear the reconnect timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
  
  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.currentAttempt >= this.reconnectAttempts) {
      this.onError(new Error(`Max reconnection attempts (${this.reconnectAttempts}) reached`));
      return;
    }
    
    this.currentAttempt++;
    const delay = this.reconnectDelay * Math.pow(2, this.currentAttempt - 1);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
    
    console.log(`Attempting to reconnect (${this.currentAttempt}/${this.reconnectAttempts})...`);
  }
  
  /**
   * Send data through the WebSocket
   */
  private async send(data: string | ArrayBuffer): Promise<void> {
    if (!this.isConnected) {
      // Queue the message if not connected
      this.messageQueue.push(data);
      
      // Try to reconnect if not already attempting to
      if (!this.reconnectTimer && this.currentAttempt < this.reconnectAttempts) {
        this.attemptReconnect();
      }
      
      throw new Error('Not connected to Hume API');
    }
    
    try {
      await this.ws?.send(data);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }
  
  /**
   * Process queued messages
   */
  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift();
      try {
        this.ws?.send(message);
      } catch (error) {
        console.error('Error sending queued message:', error);
        // Re-queue the failed message
        this.messageQueue.unshift(message);
        break;
      }
    }
  }
  
  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    this._isConnected = true;
    this.currentAttempt = 0;
    
    // Authenticate with the API key
    this.ws?.send(JSON.stringify({
      type: 'auth',
      data: {
        api_key: this.apiKey
      }
    }));
    
    console.log('Connected to Hume API');
    
    // Process any queued messages
    this.processMessageQueue();
  }
  
  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      this.onMessage(message);
    } catch (error) {
      console.error('Error parsing message:', error, event.data);
      this.onError(new Error('Failed to parse message'));
    }
  }
  
  /**
   * Handle WebSocket errors
   */
  private handleError(event: Event | unknown): void {
    if (event instanceof Event) {
      this.onError(event);
    } else if (event instanceof Error) {
      this.onError(event);
    } else {
      this.onError(new Error('An unknown error occurred'));
    }
  }
  
  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    this._isConnected = false;
    
    // Clean up
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      this.ws = null;
    }
    
    // Notify listeners
    this.onClose(event);
    
    // Attempt to reconnect if this wasn't a clean close
    if (event.code !== 1000 && this.currentAttempt < this.reconnectAttempts) {
      this.attemptReconnect();
    }
  }
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return btoa(binary);
}
