// /Users/douglasgoldstein/XRCupid_Clone/hub/src/services/VisemeService.ts
import process from 'process';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';

// Type definitions for the data structures
export interface BlendshapeFrame {
  frameIndex: number; // Absolute frame index, sorted
  shapes: number[];   // Array of 55 blendshape values
  audioOffset: number; // In milliseconds, from the start of the audio, corresponding to this frame or start of this animation chunk
}

export interface StandardViseme {
  visemeID: number;
  audioOffset: number; // In milliseconds, from the start of the audio
}

export interface VisemeData {
  standardVisemes: StandardViseme[];
  blendShapeFrames: BlendshapeFrame[];
}

export interface VisemeServiceResult {
  audioData: ArrayBuffer;
  visemeData: VisemeData;
  audioDurationMs?: number; // Added to store audio duration in milliseconds
}

// Keep VisemeEvent for the raw SDK event if needed, or remove if fully superseded
// TypeScript interfaces and enums remain the same
// ... existing VisemeEvent, etc.

// Mappings for Hume EVI to Azure Viseme Conversion

// Based on Hume's likely SAPI-like output (e.g., 'AA', 'AE', 'SIL')
// and Azure's IPA-based viseme table.
const HUME_SAPI_TO_IPA: Record<string, string | null> = {
    'AA': 'ɑ',  // father
    'AE': 'æ',  // cat
    'AH': 'ʌ',  // but
    'AO': 'ɔ',  // dog
    'AW': 'aʊ', // cow
    'AY': 'aɪ', // say
    'B':  'b',
    'CH': 'tʃ',
    'D':  'd',
    'DH': 'ð',
    'EH': 'ɛ',  // bed
    'ER': 'ɝ',  // her
    'EY': 'eɪ', // they (diphthong, special handling for viseme ID)
    'F':  'f',
    'G':  'g',
    'HH': 'h',
    'IH': 'ɪ',  // sit
    'IY': 'i',  // see
    'JH': 'dʒ',
    'K':  'k',
    'L':  'l',
    'M':  'm',
    'N':  'n',
    'NG': 'ŋ',  // sing
    'OW': 'oʊ', // go (diphthong, special handling for viseme ID)
    'OY': 'ɔɪ', // boy
    'P':  'p',
    'R':  'ɹ',  // red
    'S':  's',
    'SH': 'ʃ',
    'T':  't',
    'TH': 'θ',  // thin
    'UH': 'ʊ',  // book
    'UW': 'u',  // blue
    'V':  'v',
    'W':  'w',
    'Y':  'j',  // yes
    'Z':  'z',
    'ZH': 'ʒ',
    'SIL': 'silence', // Hume 'sil'
    'PAU': 'silence', // Hume 'pau'
    'AX': 'ə', // Schwa, common SAPI phoneme
    // Add any other SAPI phonemes Hume might output
};

// Based on Azure's Viseme ID to IPA mapping table
const IPA_TO_AZURE_VISEME_ID_MAP: Array<{ ipaSymbols: string[], id: number }> = [
    { ipaSymbols: ['silence'], id: 0 }, // Special case for silence
    { ipaSymbols: ['æ', 'ə', 'ʌ'], id: 1 },
    { ipaSymbols: ['ɑ'], id: 2 },
    { ipaSymbols: ['ɔ'], id: 3 },
    { ipaSymbols: ['ɛ', 'ʊ'], id: 4 },
    { ipaSymbols: ['ɝ'], id: 5 },
    { ipaSymbols: ['j', 'i', 'ɪ'], id: 6 },
    { ipaSymbols: ['w', 'u'], id: 7 },
    { ipaSymbols: ['o'], id: 8 },
    { ipaSymbols: ['aʊ'], id: 9 },
    { ipaSymbols: ['ɔɪ'], id: 10 },
    { ipaSymbols: ['aɪ'], id: 11 },
    { ipaSymbols: ['h'], id: 12 },
    { ipaSymbols: ['ɹ'], id: 13 },
    { ipaSymbols: ['l'], id: 14 },
    { ipaSymbols: ['s', 'z'], id: 15 },
    { ipaSymbols: ['ʃ', 'tʃ', 'dʒ', 'ʒ'], id: 16 },
    { ipaSymbols: ['ð'], id: 17 },
    { ipaSymbols: ['f', 'v'], id: 18 },
    { ipaSymbols: ['d', 't', 'n', 'θ'], id: 19 },
    { ipaSymbols: ['k', 'g', 'ŋ'], id: 20 },
    { ipaSymbols: ['p', 'b', 'm'], id: 21 },
];

function getAzureVisemeIdFromIpa(ipaSymbol: string | null): number {
    if (ipaSymbol === null) { // Indicates an unmapped Hume SAPI phoneme
        console.warn(`[VisemeConversion] Received unmapped Hume SAPI phoneme, defaulting to Viseme 0 (silence).`);
        return 0;
    }
    if (ipaSymbol === 'silence') return 0;

    for (const entry of IPA_TO_AZURE_VISEME_ID_MAP) {
        if (entry.ipaSymbols.includes(ipaSymbol)) {
            return entry.id;
        }
    }

    // Fallback for specific diphthongs not directly in Azure's simple IPA list for a single viseme ID
    if (ipaSymbol === 'eɪ') return 4; // For SAPI 'EY' -> IPA 'eɪ'. Map to viseme for 'ɛ' (ID 4) or 'ɪ' (ID 6). Chosen 4.
    if (ipaSymbol === 'oʊ') return 8; // For SAPI 'OW' -> IPA 'oʊ'. Map to viseme for 'o' (ID 8). Good match.

    console.warn(`[VisemeConversion] Unmapped IPA symbol: '${ipaSymbol}', defaulting to Viseme 0 (silence).`);
    return 0; // Default to silence for unmapped IPA symbols
}

export interface HumeTimelineEvent {
    time: number; // in seconds
    phoneme: string; // SAPI-like phoneme string (e.g., 'AA', 'P', 'SIL')
}

export interface ConvertedHumeVisemes {
    visemeEvents: VisemeEvent[];
    audioDurationMs: number;
}

/**
 * Converts a Hume EVI timeline to Azure-compatible VisemeEvents.
 * @param humeTimeline An array of HumeTimelineEvent objects.
 * @param audioDurationSeconds The total duration of the Hume audio in seconds.
 * @returns An object containing an array of VisemeEvents and the audio duration in milliseconds.
 */
export function convertHumeTimelineToAzureVisemes(
    humeTimeline: HumeTimelineEvent[],
    audioDurationSeconds: number
): ConvertedHumeVisemes {
    const visemeEvents: VisemeEvent[] = [];
    const audioDurationMs = Math.round(audioDurationSeconds * 1000);

    if (!humeTimeline || humeTimeline.length === 0) {
        console.warn('[VisemeConversion] Hume timeline is empty. Returning empty viseme events.');
        return { visemeEvents, audioDurationMs };
    }

    humeTimeline.forEach((humeEvent, index) => {
        const humePhonemeKey = humeEvent.phoneme.toUpperCase(); // Normalize to uppercase for map lookup
        const ipaSymbol = HUME_SAPI_TO_IPA[humePhonemeKey] !== undefined 
                            ? HUME_SAPI_TO_IPA[humePhonemeKey]
                            : null; // null if not found
        
        const visemeId = getAzureVisemeIdFromIpa(ipaSymbol);
        const audioOffsetTicks = Math.round(humeEvent.time * 10_000_000); // Convert seconds to 100-nanosecond ticks

        visemeEvents.push({
            audioOffset: audioOffsetTicks,
            visemeId: visemeId,
            isLastViseme: index === humeTimeline.length - 1,
        });
    });

    // Ensure visemes are sorted by audioOffset, though Hume timeline should already be sorted.
    visemeEvents.sort((a, b) => a.audioOffset - b.audioOffset);
    
    // It's possible the last viseme from Hume doesn't extend to the full audio duration.
    // The animation might need a final 'silence' viseme at the actual audio end if not covered.
    // For now, we rely on the provided audioDurationMs for animation timing.

    console.log('[VisemeConversion] Converted Hume timeline to Azure visemes:', visemeEvents);
    console.log('[VisemeConversion] Audio duration (ms):', audioDurationMs);

    return { visemeEvents, audioDurationMs };
}

export interface VisemeEvent {
    audioOffset: number; // In ticks (100 nanoseconds)
    visemeId: number;
    isLastViseme?: boolean; // Optional: true if this is the last viseme in the sequence
    animation?: string; // JSON string with blend shapes and frame index for SSML
  }

let speechConfig: SpeechSDK.SpeechConfig | undefined;

export const initializeAzureSdk = (): void => {
  console.log('[VisemeService.ts initializeAzureSdk] Called');
  const speechKey = process.env.REACT_APP_AZURE_SPEECH_KEY;
  const speechRegion = process.env.REACT_APP_AZURE_SPEECH_REGION;

  if (!speechKey || !speechRegion) {
    console.error('[VisemeService.ts] Azure Speech Key or Region not configured.');
    // Consider throwing an error to make initialization failure more explicit
    // throw new Error('Azure Speech Key or Region not configured.');
    return;
  }
  // speechConfig is created on demand in synthesizeSpeechWithVisemes
  console.log('[VisemeService.ts] Azure SDK credentials check passed.');
};

export const synthesizeSpeechWithVisemes = async (
  // CASCADE_DEBUG_V6
  text: string,
  voiceName: string = 'en-US-JennyNeural' // Default voice
): Promise<VisemeServiceResult> => {
  console.log(`[VisemeService.ts synthesizeSpeechWithVisemes ENTRY_V6] Text: "${text}", Voice: "${voiceName}", Timestamp: ${Date.now()}`); // CASCADE_DEBUG_V6
  return new Promise((resolve, reject) => {
    console.log(`[VisemeService.ts synthesizeSpeechWithVisemes PROMISE_CONSTRUCTOR_V6] Text: "${text}", Timestamp: ${Date.now()}`); // CASCADE_DEBUG_V6
    // Removed duplicated V4 log and Promise constructor here
    const speechKey = process.env.REACT_APP_AZURE_SPEECH_KEY;
    const speechRegion = process.env.REACT_APP_AZURE_SPEECH_REGION;

    if (!speechKey || !speechRegion) {
      console.error('[VisemeService.ts] Azure Speech Key or Region not found.');
      console.log(`[VisemeService.ts REJECT_V6_NO_KEY_REGION] Text: "${text}", Timestamp: ${Date.now()}`); // CASCADE_DEBUG_V6
      reject(new Error('Azure Speech Key or Region not configured.'));
      return;
    }

    try {
      speechConfig = SpeechSDK.SpeechConfig.fromSubscription(speechKey, speechRegion);
      console.log('[VisemeService.ts synthesizeSpeechWithVisemes] SpeechConfig created:', speechConfig);
      speechConfig.speechSynthesisOutputFormat = SpeechSDK.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;
      // speechConfig.speechSynthesisVoiceName = voiceName; // Set by SSML

      const ssml = `
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-US">
          <voice name="${voiceName}">
            <mstts:viseme type="FacialExpression"/>
            ${text}
          </voice>
        </speak>`;

      let synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, null);
      console.log('[VisemeService.ts synthesizeSpeechWithVisemes] Synthesizer created. SSML to be used:', ssml);

      let collectedVisemeData: VisemeData = { standardVisemes: [], blendShapeFrames: [] };
      let promiseHandled = false;

      const cleanup = () => {
        if (synthesizer) {
          try {
            synthesizer.close();
          } catch (closeError) {
            console.error('[VisemeService.ts cleanup] Error closing synthesizer:', closeError);
          }
          synthesizer = null as any; // Allow reassignment to null
        }
      };

      synthesizer.visemeReceived = (s, e: SpeechSDK.SpeechSynthesisVisemeEventArgs) => {
        console.log(`[VisemeService.ts visemeReceived] FIRING! Offset: ${e.audioOffset / 10000}ms, VisemeId: ${e.visemeId}`);
        if (e.animation && e.animation.trim() !== '') {
          console.log(`[VisemeService.ts visemeReceived] Animation length: ${e.animation.length}`);
          console.log(`[VisemeService.ts visemeReceived] Animation (first 100 chars): ${e.animation.substring(0, 100)}`);
        // Note: There was a nested 'if (e.animation && e.animation.trim() !== '')' here which might be redundant.
        // Keeping the outer one for now.
          try {
            const animationData = JSON.parse(e.animation);
            if (animationData.BlendShapes && animationData.FrameIndex !== undefined) {
              const baseFrameIndex = animationData.FrameIndex;
              animationData.BlendShapes.forEach((shapeFrame: number[], frameIdxInChunk: number) => {
                collectedVisemeData.blendShapeFrames.push({
                  frameIndex: baseFrameIndex + frameIdxInChunk,
                  shapes: shapeFrame,
                  audioOffset: (e.audioOffset / 10000) + (frameIdxInChunk * (1000 / (animationData.FrameRate || 60))),
                });
              });
            } else {
              collectedVisemeData.standardVisemes.push({
                visemeID: e.visemeId,
                audioOffset: e.audioOffset / 10000,
              });
            }
          } catch (error) {
            console.error('[VisemeService.ts visemeReceived] Error parsing animation JSON:', error, 'Animation string (on error):', e.animation);
            collectedVisemeData.standardVisemes.push({
              visemeID: e.visemeId,
              audioOffset: e.audioOffset / 10000,
            });
          }
        } else {
          console.log(`[VisemeService.ts visemeReceived] Animation is EMPTY or UNDEFINED.`);
          collectedVisemeData.standardVisemes.push({
            visemeID: e.visemeId,
            audioOffset: e.audioOffset / 10000
          });
        }
      };

      synthesizer.speakSsmlAsync(
        ssml,
        result => {
          if (promiseHandled) {
            cleanup(); return;
          }
          promiseHandled = true;
          if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
            collectedVisemeData.blendShapeFrames.sort((a, b) => a.frameIndex - b.frameIndex);
            collectedVisemeData.standardVisemes.sort((a,b) => a.audioOffset - b.audioOffset);
            console.log('[VisemeService V6] Raw result.audioDuration:', result.audioDuration);
            const audioDurationMs = result.audioDuration / 10000; // Azure returns duration in 100-nanosecond units (ticks)
            console.log(`[VisemeService.ts speakSsmlAsync COMPLETED] Audio Duration: ${result.audioDuration} (100ns units) = ${audioDurationMs}ms`);
            console.log(`[VisemeService.ts RESOLVE_V6_SUCCESS] Text: "${text}", audioDurationMs: ${audioDurationMs}, Timestamp: ${Date.now()}`); // CASCADE_DEBUG_V6
            resolve({ audioData: result.audioData, visemeData: collectedVisemeData, audioDurationMs: audioDurationMs });
          } else if (result.reason === SpeechSDK.ResultReason.Canceled) {
            const cancellation = SpeechSDK.CancellationDetails.fromResult(result);
            const reasonText = cancellation.reason !== undefined ? SpeechSDK.CancellationReason[cancellation.reason] : 'UnknownReason';
            console.error(`[VisemeService.ts speakSsmlAsync CANCELED] Reason: ${reasonText}, Details: ${cancellation.errorDetails}, ErrorCode: ${cancellation.ErrorCode}`);
            console.log(`[VisemeService.ts REJECT_V6_CANCELED] Text: "${text}", Reason: ${reasonText}, Timestamp: ${Date.now()}`); // CASCADE_DEBUG_V6
            reject(`Synthesis Canceled: ${reasonText}. Details: ${cancellation.errorDetails}. ErrorCode: ${cancellation.ErrorCode}`);
          } else {
            console.error(`[VisemeService.ts speakSsmlAsync FAILED] Reason: ${result.reason}, Details: ${result.errorDetails}`);
            console.log(`[VisemeService.ts REJECT_V6_FAILED_RESULT] Text: "${text}", Reason: ${result.reason}, Timestamp: ${Date.now()}`); // CASCADE_DEBUG_V6
            reject(new Error(`Synthesis failed: ${result.errorDetails || 'Unknown error'}`));
          }
          cleanup();
        },
        error => {
          if (promiseHandled) {
            cleanup(); return;
          }
          promiseHandled = true;
          console.log(`[VisemeService.ts REJECT_V6_ERROR_CALLBACK] Text: "${text}", Error: ${error}, Timestamp: ${Date.now()}`); // CASCADE_DEBUG_V6
          reject(error);
          cleanup();
        }
      );
    } catch (error) {
      console.error('[VisemeService.ts] Error initializing or starting synthesis:', error);
      console.log(`[VisemeService.ts REJECT_V6_OUTER_CATCH] Text: "${text}", Error: ${error}, Timestamp: ${Date.now()}`); // CASCADE_DEBUG_V6
      reject(error);
    }
  });
};

