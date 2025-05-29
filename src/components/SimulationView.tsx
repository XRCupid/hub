import process from 'process';
import React, { useCallback, useEffect, useMemo, useRef, useState, useContext, useImperativeHandle } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, Timestamp, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { prosodyToBlendshapes } from '../utils/prosodyToBlendshapes';
import * as Hume from 'hume';

import { v4 as uuidv4 } from 'uuid';
import { 
  FaMicrophone, 
  FaMicrophoneSlash, 
  FaVolumeUp, 
  FaVolumeMute, 
  FaPaperPlane, 
  FaTimes, 
  FaExpand, 
  FaCompress, 
  FaCommentDots, 
  FaCog, 
  FaPlay, 
  FaPause, 
  FaRedo, 
  FaStopCircle 
} from 'react-icons/fa';
import { IoMdSend } from 'react-icons/io';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Group, Vector3 } from 'three';
import * as THREE from 'three';
import { VoiceProvider, useVoice, VoiceReadyState, type JSONMessage, type ConnectionMessage } from '@humeai/voice-react'; // Assuming JSONMessage is exported
import { TestModeToggle } from './TestModeToggle';

import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import firebase from 'firebase/app';
import 'firebase/firestore';
import ReadyPlayerMeAvatar from './ReadyPlayerMeAvatar';
import EmotionDrivenAvatar, { type Emotion } from './EmotionDrivenAvatar';

import { ARKitBlendshapeNamesList, type BlendShapeMap, type BlendshapeKey } from '../types/blendshapes';
import { useHumeEmotionStream } from '../hooks/useHumeEmotionStream';
import { initializeAzureSdk, synthesizeSpeechWithVisemes as untypedSynthesizeSpeechWithVisemes, VisemeEvent, convertHumeTimelineToAzureVisemes, type HumeTimelineEvent, type ConvertedHumeVisemes } from '../services/VisemeService';
// import { saveChatMessageToFirebase } from '../firebase/firebaseServices'; 
// import { getTopEmotion } from '../utils/emotionMappings'; // emotionToBlendshapes removed, getTopEmotion also unused due to local definition
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk'; 


// Data structures from VisemeService.js
interface BlendshapeFrame {
  frameIndex: number; // Absolute frame index
  shapes: number[];   // Array of 55 blendshape values
  audioOffset: number; // In milliseconds, from the start of the audio
}

interface StandardViseme {
  visemeID: number;
  audioOffset: number; // In milliseconds, already converted by VisemeService
}

interface VisemeData {
  standardVisemes: StandardViseme[];
  blendShapeFrames: BlendshapeFrame[];
}

interface VisemeServiceResult {
  audioData: ArrayBuffer;
  visemeData: VisemeData;
}

// The old AzureViseme and AzureVisemeAnimation interfaces might be removable if no longer used
// For now, keeping them commented out or to be removed if prepareVisemeFrames fully transitions
/*
interface SpeakTextWithVisemesResult {
  audioData: ArrayBuffer; 
  visemes: AzureViseme[]; 
}
interface AzureVisemeAnimation {
  frameIndex: number;
  blendShapes: number[][];
}
interface AzureViseme {
  audioOffset: number; 
  visemeID: number;
  animation?: AzureVisemeAnimation | null; 
}
*/

// ARKit blendshape names corresponding to Azure's 55 blendshapes
const ARKIT_BLENDSHAPE_NAMES_AZURE = [
  "browDownLeft", "browDownRight", "browInnerUp", "browOuterUpLeft", "browOuterUpRight",
  "cheekPuff", "cheekSquintLeft", "cheekSquintRight", "eyeBlinkLeft", "eyeBlinkRight",
  "eyeLookDownLeft", "eyeLookDownRight", "eyeLookInLeft", "eyeLookInRight", "eyeLookOutLeft",
  "eyeLookOutRight", "eyeLookUpLeft", "eyeLookUpRight", "eyeSquintLeft", "eyeSquintRight",
  "eyeWideLeft", "eyeWideRight", "jawForward", "jawLeft", "jawOpen", "jawRight",
  "mouthClose", "mouthDimpleLeft", "mouthDimpleRight", "mouthFrownLeft", "mouthFrownRight",
  "mouthFunnel", "mouthLeft", "mouthLowerDownLeft", "mouthLowerDownRight", "mouthPressLeft",
  "mouthPressRight", "mouthPucker", "mouthRight", "mouthRollLower", "mouthRollUpper",
  "mouthShrugLower", "mouthShrugUpper", "mouthSmileLeft", "mouthSmileRight", "mouthStretchLeft",
  "mouthStretchRight", "mouthUpperUpLeft", "mouthUpperUpRight", "noseSneerLeft", "noseSneerRight",
  // Assuming the last 3 are for tongue, though Azure docs might need to be checked for exact mapping
  "tongueOut", "tongueUp", "tongueDown" // Placeholder if 55th is tongue related, adjust as needed
];

interface AnimationKeyframe {
  time: number; // in seconds
  shapes: Partial<BlendShapeMap>;
}

const FRAME_RATE_HZ = 50; // Azure viseme animation frame rate
const FRAME_DURATION_MS = 1000 / FRAME_RATE_HZ;
const BLENDSHAPE_AMPLIFICATION_FACTOR = 1.5; // Adjusted for more natural amplification

// Helper for initializing an empty BlendShapeMap
const initialEmptyBlendshapes: BlendShapeMap = ARKitBlendshapeNamesList.reduce((acc, shapeName) => {
  acc[shapeName] = 0;
  return acc;
}, {} as BlendShapeMap);

// Static Blendshape mapping for Azure Viseme IDs
const AZURE_VISEME_ID_TO_STATIC_BLENDSHAPES: Record<number, Partial<BlendShapeMap>> = {
  0: { jawOpen: 0, mouthClose: 1, mouthPucker: 0, mouthFunnel: 0, mouthSmileLeft: 0, mouthSmileRight: 0 }, // Silence
  1: { jawOpen: 0.2, mouthShrugUpper: 0.1 }, // æ, ə, ʌ (e.g., cat, but, about)
  2: { jawOpen: 0.6, mouthFunnel: 0.1 },     // ɑ (e.g., father)
  3: { jawOpen: 0.4, mouthFunnel: 0.3, mouthPucker: 0.2 }, // ɔ (e.g., dog, caught)
  4: { jawOpen: 0.3, mouthSmileLeft: 0.1, mouthSmileRight: 0.1 }, // ɛ, ʊ (e.g., bed, book)
  5: { jawOpen: 0.25, mouthShrugUpper: 0.2, tongueUp: 0.3 }, // ɝ (e.g., her)
  6: { jawOpen: 0.1, mouthSmileLeft: 0.4, mouthSmileRight: 0.4 }, // j, i, ɪ (e.g., yes, see, sit)
  7: { jawOpen: 0.15, mouthPucker: 0.6, mouthFunnel: 0.4 },// w, u (e.g., way, blue)
  8: { jawOpen: 0.3, mouthPucker: 0.5, mouthFunnel: 0.3 }, // o (e.g., go - o part of oʊ)
  9: { jawOpen: 0.5, mouthFunnel: 0.2, mouthPucker: 0.3 }, // aʊ (e.g., cow) - starts open, moves to pucker
  10: { jawOpen: 0.3, mouthFunnel: 0.2, mouthSmileLeft: 0.2 }, // ɔɪ (e.g., boy) - starts round, moves to smile
  11: { jawOpen: 0.5, mouthSmileLeft: 0.3, mouthSmileRight: 0.3 }, // aɪ (e.g., buy) - starts open, moves to smile
  12: { jawOpen: 0.1, mouthShrugUpper: 0.05 }, // h (slight breath)
  13: { jawOpen: 0.2, mouthPucker: 0.1, tongueUp: 0.4 }, // ɹ (e.g., red)
  14: { jawOpen: 0.25, tongueUp: 0.5, mouthSmileLeft: 0.1 }, // l (e.g., lay)
  15: { jawOpen: 0.05, mouthClose: 0.5, mouthSmileLeft: 0.2, mouthSmileRight: 0.2 }, // s, z (teeth close)
  16: { jawOpen: 0.15, mouthPucker: 0.4, mouthFunnel: 0.2 }, // ʃ, tʃ, dʒ, ʒ (e.g., shy, chin, joy, vision)
  17: { jawOpen: 0.1, tongueUp: 0.2, mouthLowerDownLeft: 0.1, mouthLowerDownRight: 0.1 }, // ð (e.g., they - tongue slightly visible)
  18: { jawOpen: 0.05, mouthLowerDownLeft: 0.3, mouthLowerDownRight: 0.3, mouthPressLeft: 0.2, mouthPressRight: 0.2 }, // f, v (upper teeth on lower lip)
  19: { jawOpen: 0.1, tongueUp: 0.6, mouthClose: 0.2 }, // d, t, n, θ (tongue tip to alveolar ridge or teeth)
  20: { jawOpen: 0.3, mouthShrugLower: 0.1, tongueUp: 0.2 }, // k, g, ŋ (back of tongue)
  21: { jawOpen: 0, mouthClose: 1, mouthPucker: 0.05 }, // p, b, m (lips together)
};

// Define default blendshapes for initialization
const defaultBlendShapes: BlendShapeMap = ARKitBlendshapeNamesList.reduce((acc: BlendShapeMap, key: BlendshapeKey) => {
  acc[key] = 0;
  return acc;
}, {} as BlendShapeMap);

// Define blendshapes for idle state, allowing autonomous blinking
const idleBlendShapes: Partial<BlendShapeMap> = ARKitBlendshapeNamesList.reduce((acc: Partial<BlendShapeMap>, key: BlendshapeKey) => {
  if (key !== 'eyeBlinkLeft' && key !== 'eyeBlinkRight') {
    // Initialize non-blink shapes to 0, consistent with defaultBlendShapes for those keys
    acc[key] = 0;
  }
  return acc;
}, {} as Partial<BlendShapeMap>);

// Processed animation keyframe structure
interface AnimationKeyframe {
  time: number; // in seconds, relative to the start of the audio
  shapes: Partial<BlendShapeMap>; // ARKit blendshape values
}

// Define ChatMessage structure
interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Timestamp | Date; // Allow both Firebase Timestamp and JS Date
  emotion?: string;
}

// Define Simulation data structure (placeholder, adjust as needed)
interface Simulation {
  id: string;
  name?: string;
  description?: string;
  avatarUrl?: string; // Assuming simulation might also define an avatar
  // Add other fields as necessary based on your Firestore structure
}

// Interface for methods exposed by SimulationViewInternal via ref
export interface SimulationViewInternalHandle {
  forceStopHumeSpeaking: () => void;
}

// State for the SimulationViewInternal component
// Helper function to get string name for VoiceReadyState
function getVoiceReadyStateName(state: VoiceReadyState): string {
  switch (state) {
    case VoiceReadyState.IDLE: return "IDLE";
    case VoiceReadyState.CONNECTING: return "CONNECTING";
    case VoiceReadyState.OPEN: return "OPEN";
    // case VoiceReadyState.CLOSING: return "CLOSING"; // Removed as 'CLOSING' might not be a valid enum member
    case VoiceReadyState.CLOSED: return "CLOSED";
    default:
      // This path might be reached if 'state' is a valid VoiceReadyState member not explicitly cased,
      // or an unexpected value. It could also be a state like 'CLOSING' if that enum member doesn't exist by that name.
      console.warn(`[getVoiceReadyStateName] Encountered unhandled or unknown state value: ${state}`);
      // const _exhaustiveCheck: never = state; // Ensures all enum cases are handled
      return `UNKNOWN_STATE_(${String(state)})`;
  }
}

interface SimulationViewState {
  isMicOn: boolean;
  isCameraOn: boolean;
  isSoundOn: boolean;
  isChatOpen: boolean;
  messages: ChatMessage[];
  inputValue: string;
  isSpeaking: boolean;
  isAzureAudioActive: boolean; // New: Tracks if Azure audio is playing
  isHumeAudioActive: boolean; // Tracks if Hume EVI audio is playing
  currentEmotion: string;
  statusMessage: string;
  humeSessionId?: string;
  humeAccessToken?: string;
  humeVoiceId?: string;
  humeVoiceName?: string;
  humeConfigId?: string;
  azureVoiceName?: string; 
  currentVisemeShapes: Partial<BlendShapeMap>; // Use Partial to allow omitting blink shapes for idle
  simulationId?: string; // Added to store the simulation ID from URL
  simulationData?: Simulation | null; // Added to store fetched simulation data
  error?: string | null; // Added for error handling
  isSending: boolean; // Tracks if a message is currently being sent via text input
  manualBlendshapes: Partial<BlendShapeMap>; // For direct blendshape control via sliders
  // Re-add properties that were removed but are used by UI
  avatarUrl: string;
  isCameraEnabled: boolean;
  isMicMuted: boolean;
  showChat: boolean;
  prosodyDrivenBlendshapes: BlendShapeMap; // For expressions from EVI voice prosody
}

interface SimulationViewProps {
  simulationId?: string; 
  avatarModelUrl: string; 
  // Add any other props that SimulationView might pass down
}

// Define types for props passed from SimulationView (parent) to SimulationViewInternal
// Placeholder types are used; replace with actual types from useVoice or Hume SDK if available
interface SimulationViewInternalPassedProps {
  humeMessages: (JSONMessage | ConnectionMessage)[]; // Ensured type
  sendUserInputToVoice: (input: string, type?: 'chat' | 'text_input') => void;
  voiceReadyState: VoiceReadyState;
  isHumeVoicePlaying: boolean;
  disconnectVoice: () => void;
  connectVoice: () => Promise<void>;
  // lastHumeVoiceMessage is removed as it's not provided by useVoice()
  humeConfigId?: string;
}

// Combined props for SimulationViewInternal
type SimulationViewInternalFullProps = SimulationViewProps & SimulationViewInternalPassedProps;

const ALL_TALK_ANIMATION_GLBS = [
  "/animations/M_Talking_Variations_001.glb",
  "/animations/M_Talking_Variations_002.glb",
  "/animations/M_Talking_Variations_003.glb",
  "/animations/M_Talking_Variations_004.glb",
  "/animations/M_Talking_Variations_005.glb",
  "/animations/M_Talking_Variations_006.glb",
  "/animations/M_Talking_Variations_007.glb",
  "/animations/M_Talking_Variations_008.glb",
  "/animations/M_Talking_Variations_009.glb",
  "/animations/M_Talking_Variations_010.glb",
  "/animations/talk.glb"
];

const ALL_IDLE_ANIMATION_GLBS = [
  "/animations/M_Standing_Idle_001.glb",
  "/animations/M_Standing_Idle_002.glb",
  "/animations/M_Standing_Idle_Variations_001.glb",
  "/animations/M_Standing_Idle_Variations_002.glb",
  "/animations/M_Standing_Idle_Variations_003.glb",
  "/animations/M_Standing_Idle_Variations_004.glb",
  "/animations/M_Standing_Idle_Variations_005.glb",
  "/animations/M_Standing_Idle_Variations_006.glb",
  "/animations/M_Standing_Idle_Variations_007.glb",
  "/animations/M_Standing_Idle_Variations_008.glb",
  "/animations/M_Standing_Idle_Variations_009.glb",
  "/animations/M_Standing_Idle_Variations_010.glb",
  "/animations/idle.glb"
];

const DEBOUNCE_DURATION = 250; // milliseconds

// Helper function for button styles (to avoid repetition)
const buttonStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.5)',
  border: '1px solid white',
  borderRadius: '5px',
  padding: '8px 12px',
  color: 'white',
  cursor: 'pointer',
  fontSize: '0.9em',
  margin: '5px',
};

const SimulationViewInternal = React.forwardRef<
  SimulationViewInternalHandle,
  SimulationViewInternalFullProps
>((props, ref): React.ReactElement | null => {
  const { 
    humeMessages, 
    sendUserInputToVoice, 
    voiceReadyState, 
    isHumeVoicePlaying, 
    disconnectVoice, 
    connectVoice, 
    humeConfigId 
  } = props;

  console.log(`[SimViewInternal FUNC_START] isHumeVoicePlaying from props: ${props.isHumeVoicePlaying}`);

  console.log('[SimViewInternal RENDER START] isHumeVoicePlaying from props:', props.isHumeVoicePlaying, 'voiceReadyState:', (typeof props.voiceReadyState === 'number' && VoiceReadyState[props.voiceReadyState]) ? VoiceReadyState[props.voiceReadyState] : String(props.voiceReadyState));

  const { currentUser } = useAuth(); 
  const { user, loading: userLoading, error: userError } = useUser(); 
  const navigate = useNavigate();
  const { simulationId } = useParams<{ simulationId: string }>();

  const initialState: SimulationViewState = {
    isMicOn: false,
    isCameraOn: true, // Default to camera being on conceptually
    isSoundOn: true,
    isChatOpen: false,
    messages: [],
    inputValue: '',
    isSpeaking: false,
    isAzureAudioActive: false,
    isHumeAudioActive: false, // To track Hume EVI audio state
    currentEmotion: 'neutral',
    statusMessage: 'Initializing...', 
    humeVoiceName: 'KARL',
    azureVoiceName: 'en-US-AvaNeural',
    currentVisemeShapes: idleBlendShapes, // Initialize with idle blendshapes to allow autonomous blinking
    manualBlendshapes: defaultBlendShapes, // Initialize manual blendshapes with defaults
    simulationData: null,
    error: null,
    isSending: false,
    // Initialize re-added properties
    avatarUrl: props.avatarModelUrl || user?.avatarUrl || '/bro.glb', // Ensure user is checked after loading
    isCameraEnabled: true, // UI toggle for camera view
    isMicMuted: false,     // UI toggle for mic input to Hume
    showChat: true,        // UI toggle for chat panel
    prosodyDrivenBlendshapes: initialEmptyBlendshapes, // Initialize with all shapes at 0
  };

  const [state, setState] = useState<SimulationViewState>(() => {
    const initial = {
      isMicOn: false,
      isCameraOn: true, // Default to camera being on conceptually
      isSoundOn: true,
      isChatOpen: false,
      messages: [],
      inputValue: '',
      isSpeaking: false,
      isAzureAudioActive: false, // New
      isHumeAudioActive: false, // Added missing property
      currentEmotion: 'neutral',
      statusMessage: 'Initializing...', 
      humeVoiceName: 'KARL',
      azureVoiceName: 'en-US-AvaNeural',
      currentVisemeShapes: idleBlendShapes, // Initialize with idle blendshapes to allow autonomous blinking
      manualBlendshapes: defaultBlendShapes, // Initialize manual blendshapes with defaults
      simulationData: null,
      error: null,
      isSending: false,
      avatarUrl: props.avatarModelUrl || user?.avatarUrl || '/bro.glb', // Ensure user is checked after loading
      isCameraEnabled: true, // UI toggle for camera view
      isMicMuted: false,     // UI toggle for mic input to Hume
      showChat: true,        // UI toggle for chat panel
      prosodyDrivenBlendshapes: initialEmptyBlendshapes, // Initialize with all shapes at 0
    };
    console.log(`[SimViewInternal INITIAL_STATE] Calculated initialState.avatarUrl: ${initial.avatarUrl}, Using props.avatarModelUrl: ${props.avatarModelUrl}, user?.avatarUrl: ${user?.avatarUrl}`);
    return initial;
  });

  // Refs
  const stateRef = useRef(state);

  // --- Hume Emotion Stream Integration ---
  const handleEmotionData = useCallback((emotion: { name: string; score: number }) => {
    // console.log('[SimView handleEmotionData] Received emotion:', emotion);
    setState(prev => ({ ...prev, currentEmotion: emotion.name.toLowerCase() }));
  }, [setState]);

  // TODO: API Key should ideally be passed via props or context, not directly accessed from process.env here.
  const humeApiKey = process.env.REACT_APP_HUME_API_KEY || process.env.NEXT_PUBLIC_HUME_API_KEY;

  const { 
    sendVideoFrame: sendEmotionVideoFrame, // Renamed to avoid conflict if another sendVideoFrame exists
    connectionState: humeEmotionStreamConnectionState, 
    lastError: humeEmotionStreamLastError 
  } = useHumeEmotionStream(
    humeApiKey,
    handleEmotionData,
    {
      isEmotionDetectionActive: !!humeApiKey && state.isCameraOn, // Only active if key and camera are on
      isVideoOn: state.isCameraOn, // Tied to the main camera state
    }
  );

  useEffect(() => {
    console.log('[SimView HumeEmotionStream] Connection State:', humeEmotionStreamConnectionState, 'Last Error:', humeEmotionStreamLastError);
    if (humeEmotionStreamLastError) {
      setState(prev => ({ ...prev, statusMessage: `Emotion Stream Error: ${humeEmotionStreamLastError}` }));
    }
  }, [humeEmotionStreamConnectionState, humeEmotionStreamLastError]);
  // --- End Hume Emotion Stream Integration ---

  const azureAudioRef = useRef<HTMLAudioElement | null>(null);
  const humeAudioRef = useRef<HTMLAudioElement | null>(null);
  const visemeFramesRef = useRef<AnimationKeyframe[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);
  const speakingDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedUserMessageReceivedAtRef = useRef<Date | null>(null);
  const lastProcessedAssistantMessageIdRef = useRef<string | null>(null);
  const isAzurePlayingRef = useRef<boolean>(false); // CASCADE: Restored for tracking Azure playback state 
  const audioBufferSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const isHumeVoicePlayingRef = useRef(props.isHumeVoicePlaying);

  // Effect to keep stateRef updated with the latest state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    // This log helps track the state.avatarUrl specifically when it's established or changes.
    // Note: user object might not be immediately available from useUser(), so initial user?.avatarUrl could be undefined.
    console.log(`[SimViewInternal AVATAR_URL_STATE] state.avatarUrl is now: ${state.avatarUrl}. Initial props.avatarModelUrl was: ${props.avatarModelUrl}. Current user?.avatarUrl: ${user?.avatarUrl}`);
  }, [state.avatarUrl, props.avatarModelUrl, user]); // Log when these key values change

  useEffect(() => {
    console.log(`[SimViewInternal MOUNT] Component did mount. Current props.avatarModelUrl: ${props.avatarModelUrl}, Current state.avatarUrl: ${state.avatarUrl}`);
    return () => {
      // stateRef.current can be used here to get the state at the time of unmount if direct state access is stale
      console.log(`[SimViewInternal UNMOUNT] Component will unmount. props.avatarModelUrl at unmount: ${props.avatarModelUrl}, state.avatarUrl at unmount: ${stateRef.current.avatarUrl}`);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array for mount/unmount effect

  const handleAvatarErrorCb = useCallback((error: Error) => {
    setState(prev => ({ ...prev, statusMessage: `Avatar Error: ${error.message}` }));
  }, []); // setState is stable, so empty deps or [setState] is fine.

  const handleAvatarLoadCb = useCallback(() => {
    setState(prev => ({ ...prev, statusMessage: 'Avatar Loaded' }));
  }, []); // setState is stable

  // Effect to keep isHumeVoicePlayingRef updated
  useEffect(() => {
    isHumeVoicePlayingRef.current = props.isHumeVoicePlaying;
    console.log(`[SimViewEffect isHumeVoicePlayingRef] Updated isHumeVoicePlayingRef.current to: ${isHumeVoicePlayingRef.current} (raw isHumeVoicePlaying: ${props.isHumeVoicePlaying})`);
  }, [props.isHumeVoicePlaying]);

  // Additional Refs
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const avatarGroupRef = useRef<THREE.Group | null>(null); // For direct avatar manipulation if needed
  const customSessionIdRef = useRef<string>(uuidv4()); // Generate a unique session ID for this component instance

  const getTopEmotion = (emotions: { name: string; score: number }[]): { name: string; score: number } | undefined => {
    if (!emotions || emotions.length === 0) return undefined;
    return emotions.reduce((prev, current) => (prev.score > current.score) ? prev : current);
  };

  const stopVisemeAnimation = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    // Reset to idle blendshapes (neutral face, allows autonomous blinking)
    setState(prev => ({ ...prev, currentVisemeShapes: idleBlendShapes, isSpeaking: false }));
    console.log('[SimView stopVisemeAnimation] Viseme animation stopped and blendshapes reset to idle (allowing autonomous blinks).');
  }, [setState, animationFrameIdRef, defaultBlendShapes]);

  const prepareVisemeFrames = useCallback((visemeData: VisemeData): AnimationKeyframe[] => {
    console.log('[SimView prepareVisemeFrames] Preparing viseme frames from data:', visemeData);
    if (!visemeData || !visemeData.blendShapeFrames || visemeData.blendShapeFrames.length === 0) {
      console.warn('[SimView prepareVisemeFrames] No blendshape data received from Azure.');
      return [];
    }

    const frames: AnimationKeyframe[] = visemeData.blendShapeFrames.map(frame => {
      const shapes: Record<string, number> = {};
      ARKitBlendshapeNamesList.forEach((name: BlendshapeKey, index: number) => {
        shapes[name] = frame.shapes[index]; // Assuming Azure provides 0-1 values directly
      });
      return {
        time: frame.audioOffset, // Already in seconds from VisemeService.js
        shapes: shapes,
      };
    });
    console.log(`[SimView prepareVisemeFrames] Prepared ${frames.length} keyframes.`);
    return frames;
  }, []);

  const humeVisemeEventsToAnimationKeyframes = useCallback((
    visemeEvents: VisemeEvent[], // From VisemeService's convertHumeTimelineToAzureVisemes
    audioDurationMs: number
  ): AnimationKeyframe[] => {
    console.log(`[SimView humeVisemeEventsToAnimationKeyframes] Called with ${visemeEvents.length} viseme events, duration: ${audioDurationMs}ms`);
    if (!visemeEvents || visemeEvents.length === 0) {
      if (audioDurationMs > 0) {
        // If there's audio but no visemes, create bookend silence frames
        console.log('[SimView humeVisemeEventsToAnimationKeyframes] No viseme events, creating silence bookends.');
        return [
          { time: 0, shapes: AZURE_VISEME_ID_TO_STATIC_BLENDSHAPES[0] || defaultBlendShapes },
          { time: audioDurationMs / 1000, shapes: AZURE_VISEME_ID_TO_STATIC_BLENDSHAPES[0] || defaultBlendShapes }, // time in seconds
        ];
      }
      console.log('[SimView humeVisemeEventsToAnimationKeyframes] No viseme events and no duration, returning empty keyframes.');
      return [];
    }

    const keyframes: AnimationKeyframe[] = visemeEvents.map(event => ({
      time: event.audioOffset / 10_000_000, // Convert 100ns ticks to seconds
      shapes: AZURE_VISEME_ID_TO_STATIC_BLENDSHAPES[event.visemeId] || defaultBlendShapes, // Fallback to default neutral shapes
    }));

    // Ensure the animation covers the full audio duration with a final silence/neutral pose
    const lastKeyframeTimeSeconds = keyframes.length > 0 ? keyframes[keyframes.length - 1].time : 0;
    const audioDurationSeconds = audioDurationMs / 1000;

    if (keyframes.length === 0 || lastKeyframeTimeSeconds < audioDurationSeconds) {
        // Add a start frame if empty, or ensure the last frame extends to audio duration
        if (keyframes.length === 0 && audioDurationSeconds > 0) {
            keyframes.push({ time: 0, shapes: AZURE_VISEME_ID_TO_STATIC_BLENDSHAPES[0] || defaultBlendShapes });
        }
        keyframes.push({
            time: audioDurationSeconds,
            shapes: AZURE_VISEME_ID_TO_STATIC_BLENDSHAPES[0] || defaultBlendShapes, // End with silence
        });
    }
    console.log(`[SimView humeVisemeEventsToAnimationKeyframes] Generated ${keyframes.length} keyframes.`);
    return keyframes;
  }, [defaultBlendShapes]);

  const animateVisemes = useCallback((startTime: number) => {
    const currentTime = (Date.now() - startTime) / 1000;
    const currentFrames = visemeFramesRef.current;

    if (!currentFrames || currentFrames.length === 0) {
      console.log('[SimView animateVisemes] No frames to animate or animation ended.');
      stopVisemeAnimation();
      return;
    }

    let activeFrame = null;
    for (let i = 0; i < currentFrames.length; i++) {
      if (currentTime >= currentFrames[i].time) {
        activeFrame = currentFrames[i];
      } else {
        break; 
      }
    }

    if (activeFrame) {
      setState(prev => ({ ...prev, currentVisemeShapes: activeFrame.shapes as BlendShapeMap }));
      console.log('[SimView animateVisemes] Updated state.currentVisemeShapes with:', activeFrame.shapes);
    }

    const lastFrameTime = currentFrames.length > 0 ? currentFrames[currentFrames.length - 1].time : 0;
    if (currentTime > lastFrameTime + 0.5 || (!activeFrame && currentTime > 0.1 && currentFrames.length > 0)) { 
      console.log('[SimView animateVisemes] Animation sequence likely complete or past last frame time.');
      stopVisemeAnimation();
      return;
    }
    
    animationFrameIdRef.current = requestAnimationFrame(() => animateVisemes(startTime));
  }, [setState, stopVisemeAnimation, visemeFramesRef, animationFrameIdRef]);

  const startVisemeAnimation = useCallback(() => {
    console.log('[SimView startVisemeAnimation] CALLED. Frame count:', visemeFramesRef.current.length);
    if (visemeFramesRef.current && visemeFramesRef.current.length > 0) {
      console.log('[SimView startVisemeAnimation] Starting viseme animation with frames:', visemeFramesRef.current);
      const startTime = Date.now();
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      animateVisemes(startTime);
    } else {
      console.log('[SimView startVisemeAnimation] No viseme frames to animate.');
      stopVisemeAnimation();
    }
  }, [animateVisemes, stopVisemeAnimation, animationFrameIdRef, visemeFramesRef]);

  const playHumeOutputWithVisemes = useCallback(async (audioUrl: string, timeline: HumeTimelineEvent[]) => {
    console.log('[SimView playHumeOutputWithVisemes] Called with audio URL and timeline.');
    setState(prev => ({ ...prev, isAzureAudioActive: false, isHumeAudioActive: true })); // Indicate Hume audio is now primary

    // Stop any ongoing Azure speech and animation
    if (azureAudioRef.current) {
      azureAudioRef.current.pause();
      azureAudioRef.current.src = ''; // Release resource
    }
    stopVisemeAnimation();

    if (!humeAudioRef.current) {
      humeAudioRef.current = new Audio();
      humeAudioRef.current.addEventListener('ended', () => {
        console.log('[SimView HumeAudio] Playback ended.');
        stopVisemeAnimation();
        setState(prev => ({ ...prev, isSpeaking: false, isHumeAudioActive: false }));
      });
      humeAudioRef.current.addEventListener('error', (e) => {
        console.error('[SimView HumeAudio] Audio playback error:', e);
        stopVisemeAnimation();
        setState(prev => ({ ...prev, isSpeaking: false, isHumeAudioActive: false }));
      });
    }

    humeAudioRef.current.src = audioUrl;
    humeAudioRef.current.load();

    try {
      await humeAudioRef.current.play();
      console.log('[SimView HumeAudio] Playback started.');
      setState(prev => ({ ...prev, isSpeaking: true }));

      // Once playback starts, audio duration should be available
      const audioDurationSeconds = humeAudioRef.current.duration;
      if (isNaN(audioDurationSeconds) || audioDurationSeconds === 0) {
        console.warn('[SimView playHumeOutputWithVisemes] Hume audio duration not available or zero after play. Visemes might be incorrect.');
        // Potentially fall back to a default or estimated duration if timeline is rich
        // For now, we'll proceed, but this could be an issue.
      }

      console.log(`[SimView playHumeOutputWithVisemes] Hume audio duration: ${audioDurationSeconds}s`);

      // Convert Hume timeline to Azure VisemeEvents (which are like standard visemes)
      const converted = convertHumeTimelineToAzureVisemes(timeline, audioDurationSeconds);
      
      // Convert these VisemeEvents to AnimationKeyframes for our animation system
      const keyframes = humeVisemeEventsToAnimationKeyframes(converted.visemeEvents, converted.audioDurationMs);

      if (keyframes && keyframes.length > 0) {
        visemeFramesRef.current = keyframes;
        startVisemeAnimation(); // This will use visemeFramesRef.current
      } else {
        console.log('[SimView playHumeOutputWithVisemes] No keyframes generated for Hume output. Lip sync will not occur.');
      }

    } catch (error) {
      console.error('[SimView playHumeOutputWithVisemes] Error playing Hume audio or processing visemes:', error);
      stopVisemeAnimation();
      setState(prev => ({ ...prev, isSpeaking: false, isHumeAudioActive: false }));
    }
  }, [stopVisemeAnimation, startVisemeAnimation, humeVisemeEventsToAnimationKeyframes, defaultBlendShapes, animateVisemes]); // Added animateVisemes to depsRef]);

  const handleHumeSpeakingStarted = useCallback((message?: ChatMessage) => {
    console.log('[SimView handleHumeSpeakingStarted] Called. Setting isSpeaking to true.');
    setState(prev => ({ ...prev, isSpeaking: true, statusMessage: 'Bot Speaking (Hume)...' }));
  }, [setState]);

  const handleHumeSpeakingStopped = useCallback(() => {
    console.log('[SimView handleHumeSpeakingStopped] Called.');
    if (!stateRef.current.isAzureAudioActive) {
      console.log('[SimView handleHumeSpeakingStopped] Azure audio not active. Stopping visemes and setting isSpeaking to false.');
      stopVisemeAnimation(); 
      setState((prev: SimulationViewState) => ({ ...prev, isSpeaking: false, statusMessage: 'Idle' }));
    } else {
      console.log('[SimView handleHumeSpeakingStopped] Azure audio is active, not stopping visemes or changing speaking state from here.');
    }
  }, [stopVisemeAnimation, setState, stateRef]);

  const handleAzureAudioEnded = useCallback(() => {
    console.log('[SimView handleAzureAudioEnded] CALLED.');
    console.log('[SimView handleAzureAudioEnded] Setting isAzurePlayingRef.current = false');
    isAzurePlayingRef.current = false;
    stopVisemeAnimation();
    setState(prev => ({ ...prev, isAzureAudioActive: false }));
    if (azureAudioRef.current && azureAudioRef.current.src.startsWith('blob:')) {
      URL.revokeObjectURL(azureAudioRef.current.src);
      azureAudioRef.current.src = ''; 
      azureAudioRef.current.srcObject = null;
      console.log('[SimView handleAzureAudioEnded] Revoked blob URL and reset azureAudioRef src.');
    }
  }, [stopVisemeAnimation, setState, azureAudioRef]);

  const handleAzureAudioError = useCallback((event: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    const audioElement = event.target as HTMLAudioElement;
    console.error('[SimView handleAzureAudioError] Azure audio playback error:', audioElement.error);
    stopVisemeAnimation();
    setState(prev => ({ ...prev, isAzureAudioActive: false, statusMessage: 'Error playing Azure audio.' }));
    if (azureAudioRef.current && azureAudioRef.current.src.startsWith('blob:')) {
      URL.revokeObjectURL(azureAudioRef.current.src);
      azureAudioRef.current.src = '';
      azureAudioRef.current.srcObject = null;
      console.log('[SimView handleAzureAudioError] Revoked blob URL and reset azureAudioRef src after error.');
    }
  }, [stopVisemeAnimation, setState, azureAudioRef]);

  // Test function (can be removed or kept for debugging)
  const generateAndAnimateVisemesFromText = useCallback(async (text: string, voiceName?: string) => {
    console.log(`[SimView generateAndAnimateVisemesFromText] Test function called with text: "${text}", voice: ${voiceName}`);
    if (!azureAudioRef.current) {
      console.error("[SimView generateAndAnimateVisemesFromText] azureAudioRef.current is null.");
      return;
    }
    try {
      setState(prev => ({ ...prev, statusMessage: 'Testing Visemes...', isSpeaking: true, isAzureAudioActive: true }));
      if (!azureAudioRef.current.paused) {
        azureAudioRef.current.pause();
        azureAudioRef.current.currentTime = 0;
      }
      const serviceResult = await untypedSynthesizeSpeechWithVisemes(text, voiceName || stateRef.current.azureVoiceName);

      // ===== DETAILED LOGGING START =====
      console.log('[SimView generateAndAnimateVisemesFromText] Full serviceResult from VisemeService:', JSON.stringify(serviceResult, null, 2));
      if (serviceResult?.visemeData?.blendShapeFrames && serviceResult.visemeData.blendShapeFrames.length > 0) {
        console.log('[SimView generateAndAnimateVisemesFromText] First 3 blendShapeFrames from serviceResult:');
        for (let i = 0; i < Math.min(3, serviceResult.visemeData.blendShapeFrames.length); i++) {
          console.log(`  Frame ${i}: audioOffset=${serviceResult.visemeData.blendShapeFrames[i].audioOffset}, shapes=${JSON.stringify(serviceResult.visemeData.blendShapeFrames[i].shapes?.slice(0,5))}...`);
        }
        const lastFrameIdx = serviceResult.visemeData.blendShapeFrames.length - 1;
        if (lastFrameIdx >= 0) {
            console.log(`  Last Frame ${lastFrameIdx}: audioOffset=${serviceResult.visemeData.blendShapeFrames[lastFrameIdx].audioOffset}, shapes=${JSON.stringify(serviceResult.visemeData.blendShapeFrames[lastFrameIdx].shapes?.slice(0,5))}...`);
        }
      } else {
        console.log('[SimView generateAndAnimateVisemesFromText] serviceResult.visemeData.blendShapeFrames is missing, empty, or not an array.');
      }
      if (serviceResult && 'audioDurationMs' in serviceResult) {
        console.log('[SimView generateAndAnimateVisemesFromText] serviceResult.audioDurationMs:', serviceResult.audioDurationMs);
      } else {
        console.log('[SimView generateAndAnimateVisemesFromText] serviceResult.audioDurationMs is not available.');
      }
      // ===== DETAILED LOGGING END =====

      if (serviceResult && serviceResult.audioData && serviceResult.visemeData) {
        const preparedFrames = prepareVisemeFrames(serviceResult.visemeData);
        if (preparedFrames && preparedFrames.length > 0) {
          visemeFramesRef.current = preparedFrames;
          startVisemeAnimation();
        } else {
          stopVisemeAnimation();
        }
        const audioBlob = new Blob([serviceResult.audioData], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        azureAudioRef.current.srcObject = null;
        azureAudioRef.current.src = audioUrl;
        azureAudioRef.current.play().catch(e => {
          console.error('[SimView generateAndAnimateVisemesFromText] Error playing test audio:', e);
          handleAzureAudioEnded();
        });
      } else {
        console.error('[SimView generateAndAnimateVisemesFromText] Failed to get audio/viseme data for test.');
        handleAzureAudioEnded();
      }
    } catch (error) {
      console.error('[SimView generateAndAnimateVisemesFromText] Error in test function:', error);
      handleAzureAudioEnded();
    }
  }, [untypedSynthesizeSpeechWithVisemes, prepareVisemeFrames, startVisemeAnimation, stopVisemeAnimation, handleAzureAudioEnded, setState, stateRef, azureAudioRef, visemeFramesRef]);

  const processAndPlayAzureSpeech = useCallback(async (text: string) => {
    console.log('[SimView processAndPlayAzureSpeech] CALLED. Text:', text);

  if (!azureAudioRef.current) {
    console.error("[SimView processAndPlayAzureSpeech] azureAudioRef.current is null. Cannot play Azure audio.");
    handleAzureAudioEnded(); // Call to clean up state
    return;
  }

  setState(prev => ({ ...prev, isSpeaking: true, isAzureAudioActive: true, statusMessage: 'Bot Speaking (Azure)...' }));

    if (azureAudioRef.current && !azureAudioRef.current.paused) {
      console.warn('[SimView processAndPlayAzureSpeech] Azure audio player (azureAudioRef) was active. Stopping existing playback.');
      azureAudioRef.current.pause();
      azureAudioRef.current.currentTime = 0;
    }

    try {
      console.log('[SimView processAndPlayAzureSpeech] Attempting to synthesize with voice:', state.azureVoiceName);
      const resolvedVoiceName = state.azureVoiceName;
      // Ensure untypedSynthesizeSpeechWithVisemes is the imported one, not the placeholder
      const serviceResult = await untypedSynthesizeSpeechWithVisemes(text, resolvedVoiceName);
      console.log('[SimView processAndPlayAzureSpeech] serviceResult (summary):', JSON.stringify(serviceResult ? { audioDataLength: serviceResult.audioData?.byteLength, blendShapeFramesLength: serviceResult.visemeData?.blendShapeFrames?.length, standardVisemesLength: serviceResult.visemeData?.standardVisemes?.length } : null));

      if (serviceResult && serviceResult.audioData && serviceResult.visemeData) {
        console.log('[SimView processAndPlayAzureSpeech] VisemeData received from Azure. BlendShapeFrames count:', serviceResult.visemeData.blendShapeFrames?.length, 'StandardVisemes count:', serviceResult.visemeData.standardVisemes?.length, '. Now calling prepareVisemeFrames.');
        const preparedFrames = prepareVisemeFrames(serviceResult.visemeData);
        console.log('[SimView processAndPlayAzureSpeech] preparedFrames:', preparedFrames); // CASCADE ADDED LOG
        if (preparedFrames && preparedFrames.length > 0) {
          visemeFramesRef.current = preparedFrames;
          console.log('[SimView processAndPlayAzureSpeech] visemeFramesRef.current SET. Length:', visemeFramesRef.current.length);
        } else {
          visemeFramesRef.current = [];
          console.log('[SimView processAndPlayAzureSpeech] preparedFrames EMPTY or invalid. visemeFramesRef.current set to empty array.');
        }
        const audioBlob = new Blob([serviceResult.audioData], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        azureAudioRef.current.srcObject = null;
        azureAudioRef.current.src = audioUrl;
        azureAudioRef.current.play().then(() => {
          console.log('[SimView processAndPlayAzureSpeech] Azure audio playback REALLY STARTED.');
          if (visemeFramesRef.current && visemeFramesRef.current.length > 0) {
            console.log('[SimView processAndPlayAzureSpeech] Calling startVisemeAnimation after audio play().then()');
            startVisemeAnimation();
          } else {
            console.log('[SimView processAndPlayAzureSpeech] No viseme frames to animate after audio play().then(), stopping animation.');
            stopVisemeAnimation(); // Ensure any prior animation is stopped
          }
        }).catch(e => {
          console.error('[SimView processAndPlayAzureSpeech] Error playing Azure audio:', e);
          handleAzureAudioEnded(); // Ensure state is cleaned up
        });
        console.log('[SimView processAndPlayAzureSpeech] Azure audio playback INITIATED. Setting isAzurePlayingRef.current = true');
        isAzurePlayingRef.current = true;
      } else {
        console.error('[SimView processAndPlayAzureSpeech] Failed to synthesize Azure speech or missing audio data. Result:', serviceResult);
        handleAzureAudioEnded(); // Ensure state is cleaned up
      }
    } catch (error) {
      console.error('[SimView processAndPlayAzureSpeech] Error during Azure TTS synthesis:', error);
      handleAzureAudioEnded(); // Ensure state is cleaned up
    }
  }, [untypedSynthesizeSpeechWithVisemes, azureAudioRef, handleHumeSpeakingStopped, prepareVisemeFrames, startVisemeAnimation, stopVisemeAnimation, isHumeVoicePlayingRef, handleAzureAudioEnded, visemeFramesRef]);

  // ... (rest of the code remains the same)

  useEffect(() => {
    if (props.humeMessages.length === 0) {
      return;
    }

    const currentMessage = props.humeMessages[props.humeMessages.length - 1];
    if (!currentMessage) return;

    // Deduplication logic
    if (currentMessage.type === 'user_message') {
      if (lastProcessedUserMessageReceivedAtRef.current && currentMessage.receivedAt <= lastProcessedUserMessageReceivedAtRef.current) {
        // console.log(`[SimView] User message at ${currentMessage.receivedAt} already processed or older. Skipping.`);
        return;
      }
    } else if (currentMessage.type === 'assistant_message' && currentMessage.id) {
      if (currentMessage.id === lastProcessedAssistantMessageIdRef.current) {
        // console.log(`[SimView] Assistant message ID ${currentMessage.id} already processed. Skipping.`);
        return;
      }
    }

    // Log assistant_message to check for face/viseme data, specifically if 'models' are present
    if (currentMessage.type === 'assistant_message' && currentMessage.models) {
      console.log('[Hume EVI Message Inspector] Assistant Message with Models:', JSON.stringify(currentMessage, null, 2));
    }

    switch (currentMessage.type) {
      case 'user_message': {
        if (!currentMessage.message || typeof currentMessage.message.content !== 'string' || currentMessage.message.role !== 'user') {
          console.warn('[SimView] User message content/role issue or type mismatch. Skipping. Full message:', JSON.stringify(currentMessage, null, 2));
          break;
        }
        console.log(`[SimView] user_message: Role: ${currentMessage.message.role}. User text:`, currentMessage.message.content);
        const newUserChatMessage: ChatMessage = {
          id: uuidv4(),
          text: currentMessage.message.content,
          sender: 'user',
          timestamp: currentMessage.receivedAt,
        };
        setState((prev: SimulationViewState) => ({ ...prev, messages: [...prev.messages, newUserChatMessage] }));
        lastProcessedUserMessageReceivedAtRef.current = currentMessage.receivedAt;
        break;
      }
      case 'assistant_message': {
        console.log('[SimView] ENTERING assistant_message case block. Message ID:', currentMessage.id);
        if (currentMessage.models?.prosody?.scores) {
          console.log('[SimView] DETECTED PROSODY SCORES:', JSON.stringify(currentMessage.models.prosody.scores, null, 2));
        } else {
          console.log('[SimView] Assistant Message, but NO prosody.scores. Models:', JSON.stringify(currentMessage.models, null, 2));
        }

        if (!currentMessage.message || typeof currentMessage.message.content !== 'string' || currentMessage.message.role !== 'assistant') {
          console.warn('[SimView] Assistant message content/role issue or type mismatch. Skipping. Full message:', JSON.stringify(currentMessage, null, 2));
          break;
        }
        console.log(`[SimView] assistant_message: Role: ${currentMessage.message.role}. Assistant text:`, currentMessage.message.content);
        const newAssistantChatMessage: ChatMessage = {
          id: currentMessage.id || uuidv4(),
          text: currentMessage.message.content,
          sender: 'bot', // Changed 'assistant' to 'bot'
          timestamp: currentMessage.receivedAt,
          // emotion: getTopEmotion(currentMessage.models?.prosody?.scores)
        };
        let newEmotions: Emotion[] = [{ name: 'neutral', score: 1 }]; // Default
        let emotionsSource = 'default (neutral)';

        // According to Hume EVI docs and previous logs, prosody scores are the primary source for general emotion.
        // The 'predictions' field under prosody or face might contain more detailed expression data if configured,
        // but 'scores' under 'prosody' is for overall emotional tone of speech.
        if (currentMessage.models?.prosody?.scores && Array.isArray(currentMessage.models.prosody.scores) && currentMessage.models.prosody.scores.length > 0) {
          // Ensure the scores match the Emotion type structure (name, score)
          const potentialEmotions = currentMessage.models.prosody.scores.filter(
            (s: any) => typeof s.name === 'string' && typeof s.score === 'number'
          );
          if (potentialEmotions.length > 0) {
            newEmotions = potentialEmotions;
            emotionsSource = 'prosody.scores';
          } else {
            console.warn('[SimView] Hume prosody.scores present but items do not match Emotion structure:', JSON.stringify(currentMessage.models.prosody.scores));
            emotionsSource = 'prosody.scores (invalid structure)';
          }
        } else {
          console.log('[SimView] No prosody.scores found in Hume message. Using default neutral emotion.');
        }
        console.log(`[SimView] Extracted emotions from Hume message (source: ${emotionsSource}):`, JSON.stringify(newEmotions));

        setState((prev: SimulationViewState) => {
          const prosodyScoresForBlendshapes = newEmotions.reduce((acc: Record<string, number>, emotion: any) => {
            acc[emotion.name] = emotion.score;
            return acc;
          }, {});
          
          console.log('[SimView assistant_message] newEmotions feeding into blendshapes:', JSON.stringify(newEmotions));
          console.log('[SimView assistant_message] prosodyScoresForBlendshapes for prosodyToBlendshapes:', JSON.stringify(prosodyScoresForBlendshapes));
          
          const newProsodyBlendshapes = prosodyToBlendshapes(prosodyScoresForBlendshapes);
          
          console.log(`[SimView assistant_message] newProsodyBlendshapes from prosodyToBlendshapes (count: ${Object.keys(newProsodyBlendshapes).length}):`, JSON.stringify(newProsodyBlendshapes));

          return {
            ...prev,
            messages: [...prev.messages, newAssistantChatMessage],
            currentDetectedEmotions: newEmotions, // newEmotions is from the outer scope, reflecting Hume's detected emotion
            isSpeaking: props.isHumeVoicePlaying,
            statusMessage: props.isHumeVoicePlaying ? 'Bot Speaking (Hume EVI)' : (prev.statusMessage.includes('Azure') ? prev.statusMessage : 'Bot Idle'),
            prosodyDrivenBlendshapes: newProsodyBlendshapes, // Use the dynamically calculated blendshapes
          };
        });

        if (currentMessage.message.content) {
          // console.log('[SimView] Assistant message content present. Azure viseme processing currently disabled for MVP.');
          // processAndPlayAzureSpeech(currentMessage.message.content); // MVP Strategy: Disabled Azure visemes
        }
        if (currentMessage.id) {
          lastProcessedAssistantMessageIdRef.current = currentMessage.id;
        }
        break;
      }
      case 'assistant_end': {
        console.log('[SimView] assistant_end message received:', currentMessage);
        // Perform any necessary cleanup or state changes for assistant ending speech.
        break;
      }
      case 'error': { // This is for WebSocketError
        console.error('[SimView] WebSocketError message received:', JSON.stringify(currentMessage, null, 2));
        setState((prev: SimulationViewState) => ({ ...prev, statusMessage: `Hume EVI Error: ${currentMessage.message}`}));
        break;
      }
      case 'chat_metadata': {
        console.log('[SimView] chat_metadata message received:', currentMessage);
        break;
      }
      case 'user_interruption': {
        console.log('[SimView] user_interruption message received:', currentMessage);
        if (azureAudioRef.current) {
          azureAudioRef.current.pause();
          azureAudioRef.current.src = '';
        }
        stopVisemeAnimation();
        setState((prev: SimulationViewState) => ({ ...prev, isSpeaking: false, isAzureAudioActive: false, statusMessage: 'User interrupted bot.' }));
        break;
      }
      case 'tool_call': {
        console.log('[SimView] tool_call message received:', currentMessage);
        break;
      }
      case 'tool_response': {
        console.log('[SimView] tool_response message received:', currentMessage);
        break;
      }
      case 'tool_error': {
        console.log('[SimView] tool_error message received:', currentMessage);
        break;
      }
      default: {
        // const _exhaustiveCheck: never = currentMessage; // For exhaustive type checking
        console.log('[SimView] Received unhandled or unexpected message type:', (currentMessage as any).type, 'Full message:', JSON.stringify(currentMessage, null, 2));
        break;
      }
    }
    // Cleanup function for this useEffect
    return () => {
      if (speakingDebounceTimerRef.current) {
        clearTimeout(speakingDebounceTimerRef.current);
        speakingDebounceTimerRef.current = null;
      }
    };
  }, [props.humeMessages, processAndPlayAzureSpeech, props.isHumeVoicePlaying]);

  // The useEffect that synchronized isSpeaking with props.isHumeVoicePlaying has been removed
  // to prevent 'Maximum update depth exceeded' error. 
  // isSpeaking and statusMessage will be derived or handled by Azure's lifecycle directly.

  // Effect to manage isSpeaking state based on Hume's voice activity
  useEffect(() => {
    if (props.isHumeVoicePlaying) {
      // Hume started speaking
      if (speakingDebounceTimerRef.current) {
        clearTimeout(speakingDebounceTimerRef.current);
        speakingDebounceTimerRef.current = null;
      }
      // Check if we are not already in 'isSpeaking' state from Hume to avoid redundant calls if handleHumeSpeakingStarted is complex
      // However, handleHumeSpeakingStarted itself should be idempotent or handle this.
      handleHumeSpeakingStarted(); 
    } else {
      // Hume stopped speaking
      // Only try to stop if we were previously speaking (stateRef.current.isSpeaking)
      // and Azure is not playing (isAzurePlayingRef.current is false, which is always the case in MVP strategy)
      if (stateRef.current.isSpeaking) { 
        if (speakingDebounceTimerRef.current) {
          clearTimeout(speakingDebounceTimerRef.current);
        }
        speakingDebounceTimerRef.current = setTimeout(() => {
          console.log('[SimView useEffect HumeVoicePlaying] Debounced: Hume stopped, calling handleHumeSpeakingStopped.');
          handleHumeSpeakingStopped();
        }, DEBOUNCE_DURATION);
      }
    }

    // Cleanup timer on component unmount or if dependencies change causing effect re-run before timer fires
    return () => {
      if (speakingDebounceTimerRef.current) {
        clearTimeout(speakingDebounceTimerRef.current);
        speakingDebounceTimerRef.current = null;
      }
    };
  }, [props.isHumeVoicePlaying, handleHumeSpeakingStarted, handleHumeSpeakingStopped, stateRef, speakingDebounceTimerRef]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, inputValue: event.target.value }));
  }, [setState]);

  const handleSendMessage = useCallback(async (event?: React.FormEvent<HTMLFormElement>) => {
    if (event) {
      event.preventDefault();
    }
    const text = stateRef.current.inputValue.trim();
    if (!text) return;

    const newUserMessage = {
      id: uuidv4(),
      text: text,
      sender: 'user' as const,
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, newUserMessage],
      inputText: '', 
    }));

    console.log('[SimView] Sending user message to Hume EVI:', text);
    if (props.sendUserInputToVoice) {
        props.sendUserInputToVoice(text); // Corrected: sendUserInput expects a string
    } else {
        console.warn('[SimView] sendUserInput is not available. Message not sent to Hume.');
    }
    
    // if (props.simulationId && currentUser?.uid) {
    //   try {
    //     await saveChatMessageToFirebase(props.simulationId, currentUser.uid, newUserMessage);
    //     console.log('[SimView] User message saved to Firebase.');
    //   } catch (error) {
    //     console.error('[SimView] Error saving user message to Firebase:', error);
    //   }
    // }
  }, [setState, props.sendUserInputToVoice, props.simulationId, currentUser, stateRef, customSessionIdRef /*, saveChatMessageToFirebase */]);

  const handleAvatarEmotionDetected = useCallback((emotionData: any) => {
    console.log('[SimView] Avatar Emotion Detected:', emotionData);
  }, []);

  const handleAvatarError = useCallback((error: Error) => { // Changed 'any' to 'Error'
    console.error("[SimView] Avatar Error:", error);
    // Log the full error object for more details
    console.error("[SimView] Full avatar error object:", error); 
    const errorMessage = error instanceof Error ? error.message : String(error);
    setState(prev => ({ ...prev, statusMessage: `Avatar error: ${errorMessage}` }));
  }, [setState]);

  const handleAvatarLoad = useCallback(() => {
    console.log('[SimView] Avatar Loaded successfully.');
    setState(prev => ({ ...prev, statusMessage: 'Avatar loaded.' }));
  }, [setState]);

  const toggleCamera = useCallback(() => {
    setState(prev => ({ ...prev, isCameraEnabled: !prev.isCameraEnabled })); // This was correct, assuming isCameraEnabled is in state
  }, [setState]);

  const toggleMic = useCallback(() => {
    setState((prev: SimulationViewState) => {
      console.log(`[SimView toggleMic] Clicked. Current voiceReadyState: ${getVoiceReadyStateName(props.voiceReadyState)}, current isMicMuted (before toggle): ${prev.isMicMuted}`);
      const newMicMutedState = !prev.isMicMuted;
      if (newMicMutedState) { // Mic is being muted
        console.log('[SimView toggleMic] Mic muted. Disconnecting Hume Voice.');
        props.disconnectVoice();
      } else { // Mic is being unmuted
        console.log(`[SimView toggleMic] Mic unmuted. Attempting to connect Hume Voice.`);
        console.log(`[SimView toggleMic] Current state values - humeAccessToken: ${stateRef.current.humeAccessToken ? 'SET' : 'NOT SET'}, humeConfigId: ${stateRef.current.humeConfigId || 'NOT SET (uses default from Provider)'}`);
        
        props.connectVoice()
          .then(() => {
            console.log('[SimView toggleMic] Hume Voice connect() promise resolved successfully.');
            // setState(s => ({...s, statusMessage: 'Mic active, connected to Hume.'})); // Status will be updated by readyState changes
          })
          .catch(error => {
            console.error('[SimView toggleMic] Error connecting Hume Voice:', error);
            setState((s: SimulationViewState) => ({...s, statusMessage: `Error connecting mic: ${(error as Error).message}`}));
          });
      }
      // Update mic state for UI and internal logic
      return { ...prev, isMicMuted: newMicMutedState, isMicOn: !newMicMutedState, statusMessage: newMicMutedState ? 'Mic muted.' : 'Mic unmuted, attempting connection...' };
    });
  }, [setState, props.connectVoice, props.disconnectVoice, stateRef, props.voiceReadyState]);

  const toggleChat = useCallback(() => {
    setState((prev: SimulationViewState) => ({ ...prev, showChat: !prev.showChat })); // This was correct, assuming showChat is in state
  }, [setState]);

  const toggleSound = useCallback(() => {
    setState((prev: SimulationViewState) => {
      const newIsSoundOn = !prev.isSoundOn;
      if (azureAudioRef.current) {
        azureAudioRef.current.muted = !newIsSoundOn;
      }
      return { ...prev, isSoundOn: newIsSoundOn, statusMessage: newIsSoundOn ? 'Sound unmuted.' : 'Sound muted.' };
    });
  }, [setState, azureAudioRef]);

  const forceStopAllAudio = useCallback(() => {
    console.log('[SimViewInternal] forceStopAllAudio called.');
    // Stop Azure TTS Audio & Visemes
    if (azureAudioRef.current && !azureAudioRef.current.paused) {
      azureAudioRef.current.pause();
      if (azureAudioRef.current.src && azureAudioRef.current.src.startsWith('blob:')) {
        URL.revokeObjectURL(azureAudioRef.current.src);
      }
      azureAudioRef.current.src = '';
    }
    stopVisemeAnimation(); // This also sets isSpeaking to false

    setState((prev: SimulationViewState) => ({
      ...prev,
      // isHumeVoicePlaying: false, // This state is more related to the Hume connection itself
      isAzureAudioActive: false,
      // isSpeaking is handled by stopVisemeAnimation
      statusMessage: 'Local audio and speech visualization stopped.',
    }));
    // If stopping the Hume connection itself is desired from this button,
    // SimulationViewInternal would need a prop callback from SimulationView to trigger voice.disconnect().
  }, [azureAudioRef, stopVisemeAnimation, setState]);

  useImperativeHandle(ref, () => ({
    forceStopHumeSpeaking: () => {
      console.log('[SimViewInternal forceStopHumeSpeaking] Imperatively called.');
      if (azureAudioRef.current && !azureAudioRef.current.paused) {
        azureAudioRef.current.pause();
        if (azureAudioRef.current.src && azureAudioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(azureAudioRef.current.src);
        }
        azureAudioRef.current.src = '';
        // Consider azureAudioRef.current.load(); if issues persist after src reset
      }
      stopVisemeAnimation(); // This resets blendshapes and sets isSpeaking to false
      setState((prevState: SimulationViewState) => ({
        ...prevState,
        // isSpeaking: false, // Handled by stopVisemeAnimation
        isAzureAudioActive: false,
        statusMessage: prevState.isAzureAudioActive ? 'Azure speech stopped via external call.' : 'Hume speech stop requested externally.',
      }));
      // Note: If Hume EVI has its own audio output that bypasses azureAudioRef (e.g. direct Web Audio API usage by useVoice),
      // additional logic might be needed here to stop that. The current implementation assumes
      // isHumeVoicePlaying reflects this and that the parent (SimulationView) handles disconnects/reconnects.
    }
  }), [azureAudioRef, stopVisemeAnimation, setState]);

  // --- Derived state logic for isSpeaking and statusMessage ---
  let derivedIsSpeaking = state.isSpeaking;
  let derivedStatusMessage = state.statusMessage;

  // Prioritize Azure's state if it's active
  if (state.isAzureAudioActive) {
    // Azure is active, its lifecycle methods (e.g., processAndPlayAzureSpeech) directly set state.isSpeaking and state.statusMessage.
    // So, derivedIsSpeaking and derivedStatusMessage are already correctly reflecting Azure's state from state.isSpeaking and state.statusMessage.
  } else if (props.isHumeVoicePlaying) {
    // Hume is playing, and Azure is NOT active.
    derivedIsSpeaking = true;
    derivedStatusMessage = 'Bot Speaking (Hume EVI)';
  } else {
    // Neither Hume nor Azure is actively playing/speaking.
    derivedIsSpeaking = false;
    derivedStatusMessage = 'Idle';
  }
  // --- End of derived state logic ---

  console.log('[SimViewInternal BEFORE RETURN] isHumeVoicePlaying:', props.isHumeVoicePlaying, 'Current state.isSpeaking:', state.isSpeaking, 'DerivedIsSpeaking:', derivedIsSpeaking, 'DerivedStatusMessage:', derivedStatusMessage);

  return (
    <div className="simulation-view" style={{ display: 'flex', height: '100vh', flexDirection: 'column', background: '#282c34' }}>
      {/* Header/Status Bar */}
      <div className="status-bar" style={{ padding: '10px', background: '#20232a', color: 'white', textAlign: 'center', fontSize: '0.9em', flexShrink: 0 }}>
        Status: {derivedStatusMessage} | Hume: {(typeof props.voiceReadyState === 'number' && VoiceReadyState[props.voiceReadyState]) ? VoiceReadyState[props.voiceReadyState] : String(props.voiceReadyState)} | Speaking: {derivedIsSpeaking ? "Yes" : "No"} | Hume Playing: {props.isHumeVoicePlaying ? "Yes" : "No"}
      </div>

      {/* Test Mode Toggle */}
      <TestModeToggle
        onMockMessage={(message) => {
          console.log('🧪 Mock message received:', message);
          // Simulate processing the mock message like a real Hume message
          if (message.prosody) {
            // Convert array format [{name, score, timestamp}] to Record<string, number>
            const prosodyRecord = message.prosody.reduce((acc: Record<string, number>, emotion: any) => {
              acc[emotion.name] = emotion.score;
              return acc;
            }, {});
            const prosodyBlendshapes = prosodyToBlendshapes(prosodyRecord);
            setState(prev => ({ ...prev, prosodyDrivenBlendshapes: prosodyBlendshapes }));
          }
          if (message.timeline) {
            // Simulate viseme processing
            const mockVisemes = { jawOpen: 0.4, mouthFunnel: 0.3 };
            setState(prev => ({ ...prev, currentVisemeShapes: mockVisemes }));
          }
          if (message.type === 'audio_output') {
            setState(prev => ({ ...prev, isSpeaking: true }));
            // Simulate audio ending after 2 seconds
            setTimeout(() => {
              setState(prev => ({ ...prev, isSpeaking: false, currentVisemeShapes: {} }));
            }, 2000);
          }
        }}
        onMockProsody={(emotions) => {
          console.log('🧪 Mock prosody received:', emotions);
          // Convert array format to Record format
          const prosodyRecord = emotions.reduce((acc: Record<string, number>, emotion: any) => {
            acc[emotion.name] = emotion.score;
            return acc;
          }, {});
          const prosodyBlendshapes = prosodyToBlendshapes(prosodyRecord);
          setState(prev => ({ ...prev, prosodyDrivenBlendshapes: prosodyBlendshapes }));
        }}
        onMockVisemes={(visemes) => {
          console.log('🧪 Mock visemes received:', visemes);
          setState(prev => ({ ...prev, currentVisemeShapes: visemes }));
        }}
      />

      {/* Main Content Area (Avatar + Chat) */}
      <div style={{ display: 'flex', flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Avatar Display Area */}
        <div className="avatar-container" style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', background: '#333740' }}>
          {(() => { console.log('[SimViewInternal RENDER] Passing DERIVED isSpeaking to EmotionDrivenAvatar:', derivedIsSpeaking); return null; })()}
          <EmotionDrivenAvatar
            directBlendshapes={{ ...state.manualBlendshapes, ...state.prosodyDrivenBlendshapes }} // Combine manual and prosody blendshapes
            key={state.avatarUrl} // Add stable key to prevent remounts
            ref={avatarGroupRef} // Pass the ref
            avatarUrl={state.avatarUrl} // Use state.avatarUrl
            isSpeaking={derivedIsSpeaking} // Pass DERIVED speaking state
            visemeData={state.currentVisemeShapes} // Attempting to use visemeData to resolve TS error
            currentEmotion={state.currentEmotion} // Pass current emotion
            idleShapes={idleBlendShapes} // Pass idle shapes for blinking/restingolve TS error
            detectedEmotions={state.currentEmotion ? [{ name: state.currentEmotion, score: 1.0 }] : []} // Pass current emotion
            cameraEnabled={state.isCameraEnabled} // Pass camera enabled state
            talkAnimationPaths={ALL_TALK_ANIMATION_GLBS} 
            idleAnimationPaths={ALL_IDLE_ANIMATION_GLBS} 
            onError={handleAvatarErrorCb}
            onLoad={handleAvatarLoadCb}
          />
          <button 
            onClick={() => generateAndAnimateVisemesFromText("Hello world, this is a test.", state.azureVoiceName || "en-US-JennyNeural")}
            style={{ ...buttonStyle, position: 'absolute', top: '10px', left: '10px', zIndex: 10 }}
          >
            Test Visemes
          </button>
        </div>

        {/* Chat UI Area */} 
        {state.showChat && (
          <div className="chat-ui" style={{
            width: '350px',
            minWidth: '300px',
            background: 'rgba(30, 33, 40, 0.95)',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            padding: '15px',
            borderLeft: '1px solid #4f5461',
            boxSizing: 'border-box',
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            zIndex: 5,
            transition: 'transform 0.3s ease-in-out',
            transform: 'translateX(0%)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexShrink: 0 }}>
              <h3 style={{ margin: 0, fontSize: '1.2em' }}>Conversation</h3>
              <button onClick={toggleChat} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1.5em', padding: '5px' }}>
                X
              </button>
            </div>
            <div className="messages-area" style={{ flexGrow: 1, overflowY: 'auto', marginBottom: '15px', paddingRight: '10px' }}>
              {state.messages.map((msg) => (
                <div key={msg.id} className={`message ${msg.sender}`} style={{
                  marginBottom: '12px',
                  padding: '10px 15px',
                  borderRadius: '18px',
                  maxWidth: '85%',
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  background: msg.sender === 'user' ? '#007bff' : '#495057',
                  color: 'white',
                  textAlign: msg.sender === 'user' ? 'right' : 'left',
                  marginLeft: msg.sender === 'bot' ? '0' : 'auto',
                  marginRight: msg.sender === 'user' ? '0' : 'auto',
                  wordWrap: 'break-word',
                  fontSize: '0.95em'
                }}>
                  {msg.text}
                  {msg.emotion && <em style={{fontSize: '0.8em', display: 'block', opacity: 0.7, marginTop: '4px'}}>({msg.emotion})</em>}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <audio
              ref={azureAudioRef}
              onEnded={handleAzureAudioEnded}
              onError={handleAzureAudioError}
              style={{ display: 'none' }}
            />
            <form onSubmit={handleSendMessage} style={{ display: 'flex', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #4f5461', flexShrink: 0 }}>
              <input
                type="text"
                value={state.inputValue}
                onChange={handleInputChange}
                placeholder="Type your message..."
                style={{
                  flexGrow: 1,
                  padding: '12px 18px',
                  border: '1px solid #555',
                  borderRadius: '25px',
                  marginRight: '10px',
                  outline: 'none',
                  color: '#e0e0e0',
                  background: '#3a3f47',
                  fontSize: '1em'
                }}
              />
              <button
                type="submit"
                disabled={!state.inputValue.trim()}
                style={{
                  background: state.inputValue.trim() ? '#007bff' : '#555',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: state.inputValue.trim() ? 'pointer' : 'not-allowed',
                  opacity: state.inputValue.trim() ? 1 : 0.6,
                  transition: 'background-color 0.2s ease'
                }}
              >
                &gt;
              </button>
            </form>
          </div>
        )}
        
        {!state.showChat && (
          <button
            onClick={toggleChat}
            style={{
              position: 'absolute',
              bottom: '30px',
              right: '30px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '60px',
              height: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              zIndex: 10,
              transition: 'transform 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Chat
          </button>
        )}
      </div>

      {/* Controls Bar at the bottom */}
      <div className="controls-bar" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '10px',
        background: '#20232a',
        flexShrink: 0,
        gap: '10px'
      }}>
        <button onClick={toggleMic} style={buttonStyle} title={state.isMicMuted ? "Unmute Microphone" : "Mute Microphone"}>
          {state.isMicMuted ? <FaMicrophoneSlash /> : <FaMicrophone />} {state.isMicMuted ? "Mic Off" : "Mic On"}
        </button>
        <button onClick={toggleSound} style={buttonStyle} title={state.isSoundOn ? "Mute Sound" : "Unmute Sound"}>
          {state.isSoundOn ? <FaVolumeUp /> : <FaVolumeMute />} {state.isSoundOn ? "Sound On" : "Sound Off"}
        </button>
        <button onClick={forceStopAllAudio} style={{...buttonStyle, background: '#dc3545'}} title="Force stop all audio and speech">
          <FaStopCircle /> Stop All Audio
        </button>
      </div>
    </div>
  );
});

export const SimulationView: React.FC<SimulationViewProps> = (props) => {
  const [humeAudioIndicatorMessage, setHumeAudioIndicatorMessage] = useState<string>('Hume Audio: Idle');
  const internalCompRef = useRef<SimulationViewInternalHandle>(null);
  const humeApiKey = React.useMemo(() => {
    const key = process.env.REACT_APP_HUME_API_KEY;
    if (!key) {
      console.error("CRITICAL: REACT_APP_HUME_API_KEY is not set. Hume EVI will not work.");
    }
    return key || '';
  }, []);

  const humeConfigId = process.env.REACT_APP_HUME_CONFIG_ID || '405fe2ff-0cf5-4ff9-abf9-fc09f4625ed8';

  const {
    messages: humeMessages,
    sendUserInput: sendUserInputToVoice,
    readyState: voiceReadyState,
    isPlaying: isHumeVoicePlaying,
    disconnect: disconnectVoice,
    connect: connectVoice,
    status,
  } = useVoice();

  console.log(
    '[SimulationView useVoice] isHumeVoicePlaying:', isHumeVoicePlaying, 
    'status:', status
  );

  const handleVoiceOpen = useCallback(() => {
    console.log('[Hume EVI] Connection opened via VoiceProvider.');
  }, []);

  const voiceAuth = useMemo(() => ({
    type: 'apiKey' as const,
    value: humeApiKey,
  }), [humeApiKey]);

  const handleVoiceMessage = useCallback((message: JSONMessage) => {
    const messageType = message.type;
    // Log the type of every message to give an overview without flooding with full objects
    console.log(`[Hume EVI] Message received - Type: ${messageType}`);

    switch (messageType) {
      case 'assistant_message':
        console.log('[Hume EVI] Assistant Message details:', message); // Log the full assistant_message object
        if (message.models) {
          const modelsAsAny = message.models as any; // Cast to any for easier access to dynamic model structure
          if (modelsAsAny.face && modelsAsAny.face.predictions) {
            // Log only if face predictions are present
            console.log('[Hume EVI] Face model predictions:', modelsAsAny.face.predictions);
          }
          // Optional: Log if models exist but face/predictions are missing for debugging model structure
          // else {
          //   console.log('[Hume EVI] message.models.face or .predictions not found. message.models structure:', message.models);
          // }
        }
        break;
      case 'user_interruption':
        console.log('[Hume EVI] User Interruption details:', message);
        break;
      case 'tool_call':
        console.log('[Hume EVI] Tool Call details:', message);
        break;
      case 'tool_response':
        console.log('[Hume EVI] Tool Response details:', message);
        break;
      case 'tool_error':
        console.error('[Hume EVI] Tool Error details:', message);
        break;
      // Add cases for other specific message types if they become important for debugging
      default:
        // For any other message types, only their type is logged by the initial console.log.
        // This significantly reduces noise from less critical or very frequent messages.
        // If deeper debugging for other types is needed, uncomment the line below:
        // console.log(`[Hume EVI] Other message type '${messageType}', content:`, message);
        break;
    }
  }, []);

  const handleVoiceClose = useCallback((e: any) => {
    console.log('[Hume EVI] Connection closed via VoiceProvider. Code:', e.code, 'Reason:', e.reason, 'WasClean:', e.wasClean);
    internalCompRef.current?.forceStopHumeSpeaking();
  }, []);

  const handleVoiceError = useCallback((error: any) => {
    let logMessage = `[Hume EVI] VoiceProvider error - Type: ${error.type}, Code: ${error.code}, Message: ${error.message}`;
    console.error(logMessage, error);
  }, []);

  if (!humeApiKey) {
     console.warn("[SimulationView] Hume API Key is not available. VoiceProvider will likely fail to connect.");
     // Optionally, render a message to the user or a disabled state for the component
     // return <div>Hume API Key is missing. Please configure REACT_APP_HUME_API_KEY in your environment.</div>;
  }

  console.log(`[SimulationView] Attempting to connect VoiceProvider with API Key: "${humeApiKey}" and Config ID: "${humeConfigId}"`);
  console.log(`[SimulationView] voiceAuth object being passed:`, voiceAuth);

  return (
    <>
      <div style={{ padding: '8px', backgroundColor: '#ff69b4', color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1em', zIndex: 9999, position: 'relative' }}>
        HUME AUDIO EVENT STATUS: {humeAudioIndicatorMessage}
      </div>
      <VoiceProvider
      onAudioStart={() => {
        console.log('[Hume EVI VoiceProvider] onAudioStart triggered');
        setHumeAudioIndicatorMessage('Hume Audio: STARTED');
      }}
      onAudioEnd={() => {
        console.log('[Hume EVI VoiceProvider] onAudioEnd triggered');
        setHumeAudioIndicatorMessage('Hume Audio: ENDED');
      }}
      auth={voiceAuth}
      configId={humeConfigId}
      debug={true}
      onOpen={handleVoiceOpen}
      onMessage={handleVoiceMessage}
      onClose={handleVoiceClose}
      onError={handleVoiceError}
    >
      <SimulationViewInternal
          ref={internalCompRef}
          simulationId={props.simulationId} // Pass down from parent props
          avatarModelUrl={props.avatarModelUrl} // Pass down from parent props
          humeMessages={humeMessages}
          sendUserInputToVoice={sendUserInputToVoice}
          voiceReadyState={voiceReadyState}
          isHumeVoicePlaying={isHumeVoicePlaying}
          disconnectVoice={disconnectVoice}
          connectVoice={connectVoice}
          // lastHumeVoiceMessage is removed as it's not provided by useVoice()
          humeConfigId={humeConfigId} // Ensure humeConfigId is available in this scope
        />
    </VoiceProvider>
    </>
  );
};
