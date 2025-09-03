export interface CallReport {
  id: string;
  roomId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  participants: string[];
  transcripts: TranscriptEntry[];
  trackingData: {
    eyeContact: number[];
    posture: number[];
    emotions: string[];
    speechMetrics: {
      rate: number[];
      pitch: number[];
      volume: number[];
    };
  };
}

export interface TranscriptEntry {
  timestamp: Date;
  speaker: string;
  text: string;
  confidence?: number;
}
