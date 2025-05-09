export class SpeechDetector {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private microphone: MediaStreamAudioSourceNode | null = null;

  constructor() {
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
  }

  async startListening(onSpeechDetected: (intensity: number) => void) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const detectSpeech = () => {
        this.analyser.getByteFrequencyData(dataArray);
        
        // Calculate speech intensity
        const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
        const normalizedIntensity = average / 255;

        if (normalizedIntensity > 0.1) {  // Threshold for speech detection
          onSpeechDetected(normalizedIntensity);
        }

        requestAnimationFrame(detectSpeech);
      };

      detectSpeech();
    } catch (error) {
      console.error('Speech detection error:', error);
    }
  }

  // Emotion approximation based on speech characteristics
  approximateEmotion(speechData: { intensity: number, pitch: number }): string {
    const { intensity, pitch } = speechData;

    if (intensity > 0.8 && pitch > 0.7) return 'excited';
    if (intensity < 0.3 && pitch < 0.4) return 'sad';
    if (intensity > 0.5 && pitch > 0.5) return 'happy';
    if (intensity < 0.4 && pitch > 0.6) return 'nervous';

    return 'neutral';
  }
}
