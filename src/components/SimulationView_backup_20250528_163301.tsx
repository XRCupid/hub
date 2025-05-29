import process from 'process';
import React, { useCallback, useEffect, useMemo, useRef, useState, useContext, useImperativeHandle } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, Timestamp, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
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

import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import firebase from 'firebase/app';
import 'firebase/firestore';
import ReadyPlayerMeAvatar from './ReadyPlayerMeAvatar';
import EmotionDrivenAvatar, { type Emotion } from './EmotionDrivenAvatar';
import { prosodyToBlendshapes } from '../utils/prosodyToBlendshapes';

import { ARKitBlendshapeNamesList, type BlendShapeMap, type BlendshapeKey } from '../types/blendshapes';
import { useHumeEmotionStream } from '../hooks/useHumeEmotionStream';
import { initializeAzureSdk, synthesizeSpeechWithVisemes as untypedSynthesizeSpeechWithVisemes, VisemeEvent } from '../services/VisemeService';
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

const FRAME_RATE_HZ = 50; // Azure viseme animation frame rate
const FRAME_DURATION_MS = 1000 / FRAME_RATE_HZ;
const BLENDSHAPE_AMPLIFICATION_FACTOR = 1.5; // Adjusted for more natural amplification

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
  time: number; // in ms, relative to the start of the audio
  shapes: Record<string, number>; // ARKit blendshape values
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
interface SimulationViewState {
  isMicOn: boolean;
  isCameraOn: boolean;
  isSoundOn: boolean;
  isChatOpen: boolean;
  messages: ChatMessage[];
  inputValue: string;
  isSpeaking: boolean;
  isAzureAudioActive: boolean; // New: Tracks if Azure audio is playing
  currentHumeEmotions: Emotion[]; // Stores the full array of emotions from Hume
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
  currentProsodyBlendshapes: Partial<BlendShapeMap>;
}

interface SimulationViewProps {
  simulationId?: string; 
  avatarModelUrl: string; 
  // Add any other props that SimulationView might pass down
}

// Define types for props passed from SimulationView (parent) to SimulationViewInternal
// Placeholder types are used; replace with actual types from useVoice or Hume SDK if available
interface SimulationViewInternalPassedProps {
  // Props related to useVoice() have been moved into SimulationViewInternal,
  // as useVoice() must be called by a descendant of VoiceProvider.
  humeConfigId?: string; // Retained as SimulationViewInternal uses it for non-voice logic (e.g., fetching simulation data)
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
>((props, ref) => {
  // --- State and Refs ---
  const [state, setState] = useState<SimulationViewState>(() => ({
    isMicOn: false,
    isCameraOn: true,
    isSoundOn: true,
    isChatOpen: false,
    messages: [],
    inputValue: '',
    isSpeaking: false,
    isAzureAudioActive: false,
    currentHumeEmotions: [],
    statusMessage: 'Initializing...',
    humeVoiceName: 'KARL',
    azureVoiceName: 'en-US-AvaNeural',
    currentVisemeShapes: {},
    manualBlendshapes: {},
    simulationId: props.simulationId, // Initialize from props
    simulationData: null,
    error: null,
    isSending: false,
    avatarUrl: props.avatarModelUrl || '/bro.glb',
    isCameraEnabled: true,
    isMicMuted: false,
    showChat: true,
    currentProsodyBlendshapes: {},
  }));
  // Call useVoice() here, within the VoiceProvider's context provided by the parent SimulationView
  const {
    messages: humeMessages,
    sendUserInput: sendUserInputToVoice,
    readyState: voiceReadyState,
    isPlaying: isHumeVoicePlaying,
    disconnect: disconnectVoice,
    connect: connectVoice,
    status, // For logging or UI status display if needed
  } = useVoice();

  const avatarGroupRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const azureAudioRef = useRef<HTMLAudioElement>(null);

  // useEffect to fetch simulation data based on state.simulationId
  useEffect(() => {
    if (state.simulationId) {
      console.log(`[SimulationViewInternal] useEffect: state.simulationId is: ${state.simulationId}. Fetching data.`);
      const fetchSimulationData = async () => {
        const db = getFirestore();
        const simDocRef = doc(db, 'simulations', state.simulationId!);
        try {
          const docSnap = await getDoc(simDocRef);
          if (docSnap.exists()) {
            const fetchedData = docSnap.data() as Simulation;
            console.log('[SimulationViewInternal] Fetched simulation data:', fetchedData);
            setState(prev => ({
              ...prev,
              simulationData: fetchedData,
              // Optionally set avatarUrl from simulationData if it exists and should override default
              avatarUrl: fetchedData.avatarUrl || prev.avatarUrl,
              error: null,
            }));
          } else {
            console.error("[SimulationViewInternal] No such simulation document! ID:", state.simulationId);
            setState(prev => ({ ...prev, error: 'Simulation not found.', simulationData: null }));
          }
        } catch (err) {
          console.error("[SimulationViewInternal] Error fetching simulation document:", err);
          setState(prev => ({ ...prev, error: 'Failed to fetch simulation data.', simulationData: null }));
        }
      };
      fetchSimulationData();
    } else {
      console.log('[SimulationViewInternal] useEffect: state.simulationId is undefined. Clearing simulation data.');
      // No need to set error here if it's an expected state (e.g. no ID provided initially)
      setState(prev => ({ ...prev, simulationData: null, avatarUrl: props.avatarModelUrl || '/bro.glb' })); // Reset avatarUrl to default if no simId
    }
  }, [state.simulationId, props.avatarModelUrl]); // Depend on state.simulationId and props.avatarModelUrl for default

  // --- Handlers and helpers ---
  const handleAvatarErrorCb = useCallback((err: any) => {
    setState(prev => ({ ...prev, error: 'Avatar error: ' + (err?.message || err) }));
  }, []);
  const handleAvatarLoadCb = useCallback(() => {
    /* Optionally set state or fire analytics */
  }, []);
  const generateAndAnimateVisemesFromText = useCallback((text: string, voice: string) => {
    // Placeholder: implement viseme generation logic
    setState(prev => ({ ...prev, statusMessage: `Viseme test triggered for "${text}"` }));
  }, []);
  const handleSendMessage = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Placeholder: implement send message logic
    setState(prev => ({ ...prev, statusMessage: 'Message sent!' }));
  }, []);
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, inputValue: e.target.value }));
  }, []);
  const toggleChat = useCallback(() => {
    setState(prev => ({ ...prev, showChat: !prev.showChat }));
  }, []);
  const toggleMic = useCallback(() => {
    setState(prev => ({ ...prev, isMicMuted: !prev.isMicMuted }));
  }, []);
  const toggleSound = useCallback(() => {
    setState(prev => ({ ...prev, isSoundOn: !prev.isSoundOn }));
  }, []);
  const forceStopAllAudio = useCallback(() => {
    setState(prev => ({ ...prev, isSpeaking: false, isAzureAudioActive: false }));
  }, []);
  const handleAzureAudioEnded = useCallback(() => {
    setState(prev => ({ ...prev, isAzureAudioActive: false }));
  }, []);
  const handleAzureAudioError = useCallback(() => {
    setState(prev => ({ ...prev, error: 'Azure audio error' }));
  }, []);

  // --- Derived values ---
  const derivedIsSpeaking = state.isSpeaking || state.isAzureAudioActive || isHumeVoicePlaying;

  // --- Render ---
  console.log('Rendering avatar with URL:', state.avatarUrl);
  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100%', position: 'relative' }}>
      {/* Avatar and controls */}
      <EmotionDrivenAvatar
        key={state.avatarUrl}
        ref={avatarGroupRef}
        avatarUrl={state.avatarUrl}
        isSpeaking={derivedIsSpeaking}
        detectedEmotions={state.currentHumeEmotions}
        visemeData={state.currentVisemeShapes}
        directBlendshapes={state.currentProsodyBlendshapes}
        cameraEnabled={state.isCameraEnabled}
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
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                wordWrap: 'break-word',
                fontSize: '0.95em'
              }}>
                {msg.text}
                {msg.emotion && <em style={{ fontSize: '0.8em', display: 'block', opacity: 0.7, marginTop: '4px' }}>({msg.emotion})</em>}
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
              placeholder="Type your message..."
              value={state.inputValue}
              onChange={handleInputChange}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', outline: 'none', marginRight: '8px', background: '#343a40', color: 'white' }}
            />
            <button type="submit" style={{ ...buttonStyle, background: '#007bff', margin: 0 }}>
              <FaPaperPlane />
            </button>
          </form>
        </div>
      )}
      {/* Toggle Chat Button */}
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
          onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          Chat
        </button>
      )}
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
        <button onClick={toggleMic} style={buttonStyle} title={state.isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}>
          {state.isMicMuted ? <FaMicrophoneSlash /> : <FaMicrophone />} {state.isMicMuted ? 'Mic Off' : 'Mic On'}
        </button>
        <button onClick={toggleSound} style={buttonStyle} title={state.isSoundOn ? 'Mute Sound' : 'Unmute Sound'}>
          {state.isSoundOn ? <FaVolumeUp /> : <FaVolumeMute />} {state.isSoundOn ? 'Sound On' : 'Sound Off'}
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

  const humeConfigId = '9c6f9d9b-1699-41bb-b335-9925bba5d6d9'; // Temporarily hardcoded for testing

  // The useVoice() hook and related logs have been moved to SimulationViewInternal.
  // This is because useVoice() must be called by a component that is a descendant of VoiceProvider.

  const handleVoiceOpen = useCallback(() => {
    console.log('[Hume EVI] Connection opened via VoiceProvider.');
  }, []);

  const voiceAuth = useMemo(() => ({
    type: 'apiKey' as const,
    value: humeApiKey,
  }), [humeApiKey]);

  const handleVoiceMessage = useCallback((message: JSONMessage) => {
    const messageType = message.type;
    // Update based on Hume EVI messages from local useVoice() hook
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
          avatarModelUrl={props.avatarModelUrl}
          simulationId={props.simulationId} // Restore simulationId prop
          // Props from the outer useVoice() call are removed.
          // SimulationViewInternal will now call useVoice() itself.
          humeConfigId={humeConfigId} // Pass the configId down, if still needed by SimulationViewInternal for non-voice logic
        />
    </VoiceProvider>
    </>
  );
};


