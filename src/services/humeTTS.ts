// Hume TTS REST API integration for real-time avatar speech (fallback to REST if WebSocket fails)
// Usage: import { speakWithHumeTTS } from './humeTTS';

const HUME_TTS_URL = 'https://api.hume.ai/v0/tts/json';

export async function speakWithHumeTTS({
  text,
  description = '',
  voice = '',
  speed = 1.0,
  trailing_silence = 0.0,
  output_format = 'wav',
  apiKey
}: {
  text: string;
  description?: string;
  voice?: string;
  speed?: number;
  trailing_silence?: number;
  output_format?: 'wav' | 'mp3';
  apiKey: string;
}) {
  const body = {
    utterances: [
      {
        text,
        ...(description ? { description } : {}),
        ...(voice ? { voice } : {}),
        ...(speed !== 1.0 ? { speed } : {}),
        ...(trailing_silence ? { trailing_silence } : {})
      }
    ],
    output_format
  };
  const res = await fetch(HUME_TTS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': apiKey
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Hume TTS error: ${res.status} ${err}`);
  }
  const data = await res.json();
  // The response should include a URL or base64 audio data
  // You may need to adapt this if Hume returns a file or a URL
  const audioUrl = data.audio?.url || data.audio_url || data.url || '';
  if (!audioUrl) throw new Error('No audio URL in Hume TTS response');
  return audioUrl;
}

// Utility to play the audio (wav or mp3)
export async function playAudioUrl(url: string) {
  const audio = new Audio(url);
  await audio.play();
  return audio;
}
