export interface WebSocketMessage {
  type: string;
  data?: any;
}

export interface WebSocketEvent {
  type: 'open' | 'message' | 'error' | 'close' | 'reconnect_failed';
  data?: any;
  error?: Error;
  code?: number;
  reason?: string;
  attempts?: number;
}

export interface HumeEmotionData {
  predictions: Array<{
    emotions: {
      happy: number;
      sad: number;
      angry: number;
      surprise: number;
      neutral: number;
    };
  }>;
  emotions: {
    happy: number;
    sad: number;
    angry: number;
    surprise: number;
    neutral: number;
  };
  happy: number;
  sad: number;
  angry: number;
  surprise: number;
  neutral: number;
}
