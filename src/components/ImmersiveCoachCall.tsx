import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import FaceTracker from './FaceTracker'; // Fix FaceTracker import to use default export
import { ConversationAvatar } from './ConversationAvatar';
import { COACHES } from '../config/coachConfig';
import { voiceService } from '../services/voiceService';
import './ImmersiveCoachCall.css';

interface ImmersiveCoachCallProps {
  onEnd: () => void;
}

export const ImmersiveCoachCall: React.FC<ImmersiveCoachCallProps> = ({ onEnd }) => {
  const { coach = 'grace' } = useParams<{ coach: string }>();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [coachMessage, setCoachMessage] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [userVideoEnabled, setUserVideoEnabled] = useState(false);
  const [useAvatarMode, setUseAvatarMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [faceData, setFaceData] = useState<any>(null);
  const [sessionNotes, setSessionNotes] = useState<string[]>([]);
  const [showControls, setShowControls] = useState(true);
  const [conversationHistory, setConversationHistory] = useState<{ role: string; content: string }[]>([]);
  const [animationLoopStarted, setAnimationLoopStarted] = useState(false);
  const [currentAudioData, setCurrentAudioData] = useState<Uint8Array | undefined>(undefined);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [greetingInProgress, setGreetingInProgress] = useState(false);
  const [showCameraInstructions, setShowCameraInstructions] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);
  const voiceServiceRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioDataRef = useRef<Uint8Array | null>(null);
  const audioSourcesRef = useRef<Map<HTMLAudioElement, MediaElementAudioSourceNode>>(new Map());

  const config = COACHES[coach as keyof typeof COACHES];

  const toggleListening = () => {
    if (recognitionRef.current) {
      if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      } else {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (error) {
          console.log('Speech recognition already started');
          setIsListening(true);
        }
      }
    }
  };

  const toggleUserVideo = async () => {
    if (!userVideoEnabled) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setUserVideoEnabled(true);
      } catch (error) {
        console.error('Failed to start webcam:', error);
      }
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
        setUserVideoEnabled(false);
      }
    }
  };

  const getAvatarUrl = () => {
    return `/avatars/coach_${coach}.glb`;
  };

  const generateGreeting = () => {
    switch (coach) {
      case 'grace':
        return "Hello darling, I'm so delighted to connect with you today. How are you feeling about your dating journey?";
      case 'posie':
        return "Hey there! I'm really excited to chat with you today. Tell me, what's been on your mind about dating lately?";
      case 'rizzo':
        return "Well hello gorgeous! Ready to unleash that irresistible charm of yours? Let's talk about what's got you fired up!";
      default:
        return "Hello! I'm excited to work with you today. What would you like to explore?";
    }
  };

  const generateCoachResponse = async (userInput: string) => {
    // Use OpenAI to generate contextual responses
    const openaiApiKey = process.env.REACT_APP_OPENAI_API_KEY;

    if (!openaiApiKey) {
      console.error('OpenAI API key not configured');
      // Fallback to previous keyword-based system
      return generateFallbackResponse(userInput);
    }

    // Add user message to conversation history
    const updatedHistory = [...conversationHistory, { role: 'user', content: userInput }];

    // Create coach-specific system prompt
    const systemPrompt = getCoachSystemPrompt();

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            ...updatedHistory
          ],
          temperature: 0.8,
          max_tokens: 150
        })
      });

      if (!response.ok) {
        throw new Error('OpenAI API request failed');
      }

      const data = await response.json();
      const assistantMessage = data.choices[0].message.content;

      // Update conversation history
      setConversationHistory([...updatedHistory, { role: 'assistant', content: assistantMessage }]);

      return assistantMessage;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return generateFallbackResponse(userInput);
    }
  };

  const getCoachSystemPrompt = () => {
    const basePrompt = "You are a dating coach having a warm, supportive video call conversation. Keep responses conversational, natural, and under 2-3 sentences. Show genuine interest and ask follow-up questions. Never break character.";

    switch (coach) {
      case 'grace':
        return `${basePrompt} You are Grace, an elegant and sophisticated dating coach who specializes in charm, manners, and refined conversation. You speak with warmth and class, using endearing terms like "darling" naturally. Focus on helping clients develop their elegance, social graces, and magnetic charm. Your advice emphasizes quality over quantity, sophistication over flashiness.`;
      case 'posie':
        return `${basePrompt} You are Posie, an intuitive dating coach who specializes in body language, presence, and emotional connection. You're deeply empathetic and help clients tune into their physical presence and energy. You often reference how emotions show up in the body and guide clients to embody confidence. Your approach is gentle, insightful, and body-aware.`;
      case 'rizzo':
        return `${basePrompt} You are Rizzo, a bold and sassy dating coach who specializes in confidence, sex appeal, and owning your power. You're energetic, fun, and encouraging, using terms like "honey" and "babe" naturally. You help clients embrace their sexuality and charisma without shame. Your style is playful, empowering, and unapologetically confident.`;
      default:
        return basePrompt;
    }
  };

  const generateFallbackResponse = (userInput: string) => {
    // More dynamic and contextual responses based on user input
    const lowerInput = userInput.toLowerCase();

    // Check for keywords and generate appropriate responses
    if (lowerInput.includes('nervous') || lowerInput.includes('anxious') || lowerInput.includes('scared')) {
      switch (coach) {
        case 'grace':
          return "Oh darling, nerves are just excitement in disguise. Take a deep breath with me and remember - you are absolutely captivating exactly as you are.";
        case 'posie':
          return "I feel that energy in your body... What's really coming up for you right now?";
        case 'rizzo':
          return "Nervous? Honey, that's just your inner fire warming up! Channel that energy into your walk, your smile, your whole vibe. Nervousness is just excitement in disguise - let's unleash it!";
      }
    }

    if (lowerInput.includes('confidence') || lowerInput.includes('confident')) {
      switch (coach) {
        case 'grace':
          return "Confidence, my dear, is like a fine perfume - subtle yet unforgettable. It's in how you hold yourself, how you listen, how you smile. You already have it within you.";
        case 'posie':
          return "True confidence lives in your body. Stand tall, breathe deep, feel your feet on the ground. When you're rooted in yourself, confidence flows naturally.";
        case 'rizzo':
          return "YES! Confidence is your sexiest accessory, babe! It's that sparkle in your eye, that sway in your walk. Own every inch of who you are - that's when you become absolutely irresistible!";
      }
    }

    if (lowerInput.includes('rejection') || lowerInput.includes('rejected')) {
      switch (coach) {
        case 'grace':
          return "Rejection simply means you're one step closer to finding someone who appreciates your unique charm. It's never about you not being enough, darling.";
        case 'posie':
          return "When we face rejection, our body contracts... But what if we could stay open? Each 'no' is just redirecting you toward your perfect 'yes'.";
        case 'rizzo':
          return "Rejected? Their loss, honey! Seriously, anyone who can't see your fire isn't worth your matches. Next! You're too fabulous to waste time on people who don't get it.";
      }
    }

    if (lowerInput.includes('first date') || lowerInput.includes('date')) {
      switch (coach) {
        case 'grace':
          return "A first date is like a dance, darling. Lead with curiosity, follow with genuine interest, and let the conversation flow naturally. Most importantly, enjoy yourself!";
        case 'posie':
          return "Before your date, ground yourself. Feel your body, notice your breath. When you're present in your body, you'll naturally attract the right energy.";
        case 'rizzo':
          return "First date? Time to bring the heat! Wear something that makes YOU feel amazing, flirt like you mean it, and remember - you're not auditioning for them, they're auditioning for YOU!";
      }
    }

    // Default contextual responses if no keywords match
    const contextualResponses: { [key: string]: string[] } = {
      grace: [
        "Tell me more about that, darling. I sense there's something deeper here.",
        "How fascinating! And how does that make you feel in your romantic life?",
        "You have such interesting insights. Let's explore this further together.",
        "I love your perspective on this. What would your ideal scenario look like?"
      ],
      posie: [
        "I'm noticing something in your energy... What's really coming up for you right now?",
        "Let's sit with that feeling for a moment. Where do you feel it in your body?",
        "Beautiful share. How can we bring more of that awareness into your dating life?",
        "Yes, I feel that too. What would it look like to move through the world with that energy?"
      ],
      rizzo: [
        "Ooh, now we're getting somewhere! Tell me more, don't hold back!",
        "YES! I love that energy! How can we turn that up even more?",
        "Mmm-hmm, I see you! That energy is exactly what's going to make you magnetic. Keep going!"
      ]
    };

    const coachResponses = contextualResponses[coach as keyof typeof contextualResponses] || contextualResponses.grace;
    return coachResponses[Math.floor(Math.random() * coachResponses.length)];
  };

  const getCoachGreeting = () => {
    const greetings: { [key: string]: string } = {
      grace: "Hello darling, I'm so delighted to connect with you today. You look absolutely radiant! Tell me, what's been on your mind about your dating journey?",
      posie: "Hi beautiful soul! I can already feel your energy through the screen. Let's take a deep breath together... Now, what's alive for you in your dating life right now?",
      rizzo: "Well hello gorgeous! Look at you showing up ready to own your power! I'm here for it! What's got you fired up about dating these days?"
    };
    return greetings[coach as keyof typeof greetings] || greetings.grace;
  };

  const getBackground = () => {
    const colors: { [key: string]: string } = {
      grace: 'radial-gradient(ellipse at center, #1e1e1e 0%, #2a1f2e 100%)',
      posie: 'radial-gradient(ellipse at center, #1e1e1e 0%, #2d1f2a 100%)',
      rizzo: 'radial-gradient(ellipse at center, #1e1e1e 0%, #2f1f1f 100%)'
    };
    return colors[coach] || colors.grace;
  };

  const addSessionNote = (note: string) => {
    setSessionNotes([...sessionNotes, note]);
  };

  const handleUserMessage = async (message: string) => {
    if (!message.trim() || isThinking || isSpeaking) return;

    setIsThinking(true);

    try {
      // Get coach response
      const response = await generateCoachResponse(message);
      setCoachMessage(response);

      setIsThinking(false);
      setIsSpeaking(true);

      // Stop speech recognition while AI is speaking
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      }

      // Use voice service to speak the response
      const audioElement = await voiceServiceRef.current.speak(response, coach);

      // Connect audio to analyzer for lip sync
      if (audioElement && analyserRef.current && audioContextRef.current) {
        // Check if we already have a source for this audio element
        let source = audioSourcesRef.current.get(audioElement);

        if (!source) {
          // Create new source and store it
          source = audioContextRef.current.createMediaElementSource(audioElement);
          audioSourcesRef.current.set(audioElement, source);
          source.connect(analyserRef.current);
          analyserRef.current.connect(audioContextRef.current.destination);
        }
      }

      // Wait for response to finish
      if (audioElement) {
        await new Promise((resolve) => {
          audioElement.onended = () => {
            setIsSpeaking(false);
            resolve(undefined);

            // Resume listening after AI finishes speaking
            if (recognitionRef.current && !isListening && recognitionRef.current.state !== 'listening') {
              try {
                recognitionRef.current.start();
                setIsListening(true);
              } catch (error) {
                console.log('Speech recognition already started');
              }
            }
          };
          audioElement.onerror = () => {
            setIsSpeaking(false);
            resolve(undefined);
          };
        });
      }
    } catch (error) {
      console.error('Error handling user message:', error);
      setIsThinking(false);
      setIsSpeaking(false);
    }

    setTranscript('');
  };

  const startCoachingSession = async () => {
    setIsSessionActive(true);
    setIsLoading(false);

    // Start webcam
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setUserVideoEnabled(true);
    } catch (error) {
      console.log('Camera not available:', error);
    }
  };

  useEffect(() => {
    // Initialize voice service
    voiceServiceRef.current = voiceService;

    // Initialize audio context and start animation loop
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      audioDataRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);

      // Start animation loop for audio data
      if (!animationLoopStarted) {
        setAnimationLoopStarted(true);
        const updateAudioData = () => {
          if (analyserRef.current && audioDataRef.current) {
            analyserRef.current.getByteFrequencyData(audioDataRef.current);
            setCurrentAudioData(new Uint8Array(audioDataRef.current));
          }
          requestAnimationFrame(updateAudioData);
        };
        updateAudioData();
      }
    }

    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        // Don't process if AI is speaking
        if (isSpeaking) return;

        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setTranscript(transcript);

        if (event.results[current].isFinal) {
          handleUserMessage(transcript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      // Cleanup
      if (voiceServiceRef.current) {
        voiceServiceRef.current.stop();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      // Clear audio sources map
      audioSourcesRef.current.clear();
    };
  }, []); // Empty dependency array ensures single initialization

  useEffect(() => {
    // Only speak greeting once when component mounts
    const initSession = async () => {
      if (hasGreeted || greetingInProgress) return; // Prevent multiple greetings
      setGreetingInProgress(true);
      
      await startCoachingSession();

      // Delay greeting slightly to ensure everything is initialized
      setTimeout(async () => {
        if (hasGreeted) return; // Double check
        setHasGreeted(true);
        
        const greeting = getCoachGreeting();
        setCoachMessage(greeting);

        setIsSpeaking(true);

        try {
          const audioElement = await voiceServiceRef.current.speak(greeting, coach);

          // Connect audio to analyzer for lip sync
          if (audioElement && analyserRef.current && audioContextRef.current) {
            // Check if we already have a source for this audio element
            let source = audioSourcesRef.current.get(audioElement);

            if (!source) {
              // Create new source and store it
              source = audioContextRef.current.createMediaElementSource(audioElement);
              audioSourcesRef.current.set(audioElement, source);
              source.connect(analyserRef.current);
              analyserRef.current.connect(audioContextRef.current.destination);
            }
          }

          // Wait for greeting to finish
          if (audioElement) {
            await new Promise((resolve) => {
              audioElement.onended = resolve;
              audioElement.onerror = resolve;
            });
          }
        } catch (error) {
          console.error('Error speaking greeting:', error);
        }

        setIsSpeaking(false);
        setGreetingInProgress(false);

        // Resume speech recognition after a delay
        setTimeout(() => {
          if (recognitionRef.current && !isListening && recognitionRef.current.state !== 'listening') {
            try {
              recognitionRef.current.start();
              setIsListening(true);
            } catch (error) {
              console.log('Speech recognition already started');
            }
          }
        }, 500);
      }, 1000);
    };

    // Only run once - strict mode safe
    if (!hasGreeted && !greetingInProgress) {
      initSession();
    }
  }, []); // Empty dependency array, no dependencies to prevent re-runs

  return (
    <div className="immersive-coach-call" style={{ background: getBackground() }}>
      {/* Main 3D Canvas - adjusted for better framing with full controls */}
      <div className="coach-canvas">
        <Canvas camera={{ position: [0, 1.0, 3.5], fov: 35 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 5, 5]} intensity={0.6} />
          <spotLight position={[0, 3, 2]} angle={0.4} penumbra={0.8} intensity={0.5} />
          <spotLight position={[-2, 2, 1]} angle={0.3} penumbra={0.5} intensity={0.3} color="#ffd4e5" />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={0.5}
            maxDistance={10}
            minPolarAngle={0}
            maxPolarAngle={Math.PI}
            target={[0, 1.0, 0]}
            makeDefault
          />
          <ConversationAvatar
            avatarUrl={getAvatarUrl()}
            position={[0, 0.8, 0]}
            scale={1}
            isSpeaking={isSpeaking}
            audioContext={audioContextRef.current}
            audioData={currentAudioData}
          />
        </Canvas>
      </div>

      {/* Camera control instructions */}
      {showCameraInstructions && (
        <div className="camera-instructions" style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          maxWidth: '200px',
          cursor: 'pointer'
        }}
        onClick={() => setShowCameraInstructions(false)}
        title="Click to dismiss"
        >
          <strong>Camera Controls:</strong><br/>
          • Left click + drag: Rotate<br/>
          • Right click + drag: Pan<br/>
          • Scroll: Zoom in/out<br/>
          • Double click: Reset view<br/>
          <small style={{ opacity: 0.7 }}>(Click to dismiss)</small>
        </div>
      )}

      {/* User PIP Video */}
      <div className={`user-pip ${userVideoEnabled ? 'active' : ''} ${useAvatarMode ? 'avatar-mode' : ''}`}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{ display: userVideoEnabled && !useAvatarMode ? 'block' : 'none' }}
        />

        {/* User avatar mode */}
        {userVideoEnabled && useAvatarMode && (
          <div className="user-avatar-container">
            <Canvas camera={{ position: [0, 1.0, 2], fov: 50 }}>
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 5, 5]} intensity={0.4} />
              <OrbitControls
                enablePan={false}
                enableZoom={false}
                minPolarAngle={Math.PI / 3}
                maxPolarAngle={Math.PI / 2.2}
                target={[0, 0.8, 0]}
              />
              <ConversationAvatar
                avatarUrl={getAvatarUrl()}
                position={[0, 0, 0]}
                scale={0.4}
                isSpeaking={false}
              />
            </Canvas>
          </div>
        )}

        {!userVideoEnabled && (
          <div className="pip-placeholder">
            <div className="pip-avatar">
              <span>You</span>
            </div>
          </div>
        )}

        <div className="pip-controls">
          <button className="pip-toggle" onClick={toggleUserVideo}>
            {userVideoEnabled ? '📹' : '📷'}
          </button>
          {userVideoEnabled && (
            <button
              className="pip-mode-toggle"
              onClick={() => setUseAvatarMode(!useAvatarMode)}
              title={useAvatarMode ? "Show video" : "Show avatar"}
            >
              {useAvatarMode ? '🎭' : '👤'}
            </button>
          )}
        </div>

        {/* Face tracker component */}
        {userVideoEnabled && (
          <FaceTracker
            videoElement={videoRef.current}
            onFaceData={setFaceData}
          />
        )}
      </div>

      {/* Coach Info Bar */}
      <div className="coach-info-bar">
        <div className="coach-info">
          <h2>{config.name}</h2>
          <p>{config.specialty.join(', ')}</p>
        </div>
        <div className="status-indicator">
          <span className={`status-dot ${isSpeaking ? 'speaking' : ''}`}></span>
          <span className="status-text">
            {isSpeaking ? 'Coach is speaking' : isListening ? 'Listening to you' : 'Ready to listen'}
          </span>
        </div>
      </div>

      {/* Conversation panel - bottom left overlay */}
      <div className="conversation-panel">
        <div className="conversation-header">
          💬 Conversation
        </div>
        <div className="conversation-content">
          {coachMessage && (
            <div className="message coach">
              <div className="message-label">{config.name}</div>
              {coachMessage}
            </div>
          )}
          {transcript && (
            <div className="message user">
              <div className="message-label">You</div>
              {transcript}
            </div>
          )}
        </div>
      </div>

      {/* Session Notes - right side */}
      {sessionNotes.length > 0 && (
        <div className="session-notes">
          <div className="notes-header">
            📝 Session Notes
          </div>
          <div className="notes-content">
            {sessionNotes.map((note, index) => (
              <div key={index} className="note-item">
                {note}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Call Controls */}
      <div className={`call-controls ${showControls ? '' : 'hidden'}`}>
        <button
          className={`control-btn mic-btn ${isListening ? 'active' : ''}`}
          onClick={toggleListening}
          title={isListening ? "Stop speaking" : "Start speaking"}
        >
          {isListening ? '🎤' : '🎙️'}
        </button>

        <button
          className="control-btn end-btn"
          onClick={onEnd}
          title="End call"
        >
          📱
        </button>

        <button
          className="control-btn"
          onClick={() => addSessionNote('⭐ Marked as important')}
          title="Mark as important"
        >
          ⭐
        </button>

        <button
          className="control-btn settings-btn"
          onClick={() => setShowControls(!showControls)}
          title={showControls ? "Hide controls" : "Show controls"}
        >
          ⚙️
        </button>
      </div>

    </div>
  );
};
