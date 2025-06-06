// Audio utilities to replace Hume dependencies

export type MimeType = 
  | "audio/webm"
  | "audio/webm;codecs=opus" 
  | "audio/mp4"
  | "audio/mpeg"
  | "audio/wav"
  | "audio/ogg"
  | "audio/ogg;codecs=opus";

export function getBrowserSupportedMimeType(): MimeType {
  const mimeTypes: MimeType[] = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/mp4",
    "audio/mpeg",
    "audio/wav"
  ];

  // Check which MIME type is supported by the browser
  for (const mimeType of mimeTypes) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }

  // Default fallback
  return "audio/webm";
}

export function base64ToBlob(base64: string, type: string = 'audio/wav'): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type });
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to convert blob to base64 string.'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
