import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SampleLessons.css';
import { ImmersiveCoachCall } from './ImmersiveCoachCall';

interface LessonContent {
  coach: 'grace' | 'posie' | 'rizzo';
  title: string;
  duration: string;
  objectives: string[];
  segments: {
    type: 'intro' | 'teaching' | 'practice' | 'reflection';
    content: string;
    coachDialogue?: string;
    userPrompt?: string;
    exercise?: {
      title: string;
      instructions: string;
    };
  }[];
}

const sampleLessons: Record<string, LessonContent> = {
  grace: {
    coach: 'grace',
    title: "The Art of Magnetic First Impressions",
    duration: "15 minutes",
    objectives: [
      "Master the 3-second rule of first impressions",
      "Develop your signature greeting style",
      "Learn to read and match social energy"
    ],
    segments: [
      {
        type: 'intro',
        content: 'Setting the stage for connection',
        coachDialogue: "Darling, let me share something I learned at a gallery opening in Paris. The most captivating person in the room wasn't the artist or the celebrity guest—it was a woman who understood that first impressions are like a perfectly aged wine: they should intrigue immediately but reveal depth over time."
      },
      {
        type: 'teaching',
        content: 'The 3-Second Rule',
        coachDialogue: "In those first three seconds, people decide if they want to know more. It's not about being perfect—it's about being perfectly present. Let me teach you my SPARK method: Smile genuinely, Posture open, Acknowledge their presence, Radiate warmth, Keep it natural."
      },
      {
        type: 'practice',
        content: 'Crafting Your Signature Greeting',
        userPrompt: "Practice introducing yourself as if you're meeting someone interesting at a coffee shop",
        exercise: {
          title: "The Coffee Shop Introduction",
          instructions: "Imagine you've just noticed someone reading your favorite book. Practice a warm, engaging introduction that feels natural to you."
        }
      },
      {
        type: 'reflection',
        content: 'Integration and Refinement',
        coachDialogue: "Beautiful work, darling. Remember, charm isn't about impressing—it's about expressing genuine interest in another human being. What felt most natural to you in that practice?"
      }
    ]
  },
  posie: {
    coach: 'posie',
    title: "Embodied Presence: Dating from Your Center",
    duration: "18 minutes",
    objectives: [
      "Connect with your body's natural confidence",
      "Learn to ground yourself before dates",
      "Develop intuitive awareness of chemistry"
    ],
    segments: [
      {
        type: 'intro',
        content: 'Tuning into your embodied wisdom',
        coachDialogue: "Close your eyes for a moment and take a deep breath with me. *pause* Feel your feet on the ground. When we're truly present in our bodies, we radiate an authentic magnetism that no amount of clever conversation can match."
      },
      {
        type: 'teaching',
        content: 'The Grounding Practice',
        coachDialogue: "I want to teach you my pre-date grounding ritual. It's like yoga for your nervous system. Start by placing one hand on your heart, one on your belly. Breathe into both spaces. This is your center—your home base. From here, you can handle any dating situation with grace."
      },
      {
        type: 'practice',
        content: 'Body Scan for Dating Confidence',
        userPrompt: "Let's do a confidence body scan together",
        exercise: {
          title: "The Confidence Scan",
          instructions: "Starting from your feet, slowly scan up your body. Notice where you feel strong, where you feel tender. Send breath and appreciation to every part."
        }
      },
      {
        type: 'reflection',
        content: 'Integrating embodied awareness',
        coachDialogue: "How does your body feel now compared to when we started? This centered feeling—this is what you want to cultivate before every date. Your body knows things your mind hasn't figured out yet. Trust it."
      }
    ]
  },
  rizzo: {
    coach: 'rizzo',
    title: "Flirting Like You Mean It: The Bold Approach",
    duration: "20 minutes",
    objectives: [
      "Master the art of playful banter",
      "Build bulletproof confidence",
      "Learn when to lean in and when to lean back"
    ],
    segments: [
      {
        type: 'intro',
        content: 'Time to turn up the heat',
        coachDialogue: "Alright hot stuff, let's get one thing straight—flirting isn't about following some boring script. It's about being so damn comfortable in your own skin that other people can't help but want to join the party. Ready to stop playing it safe?"
      },
      {
        type: 'teaching',
        content: 'The Push-Pull Dynamic',
        coachDialogue: "Here's the secret sauce: interest plus intrigue. You show you're into them, then you playfully challenge them. Like this: 'That's actually a brilliant point... for someone who puts pineapple on pizza.' See? Compliment, then tease. It creates this delicious tension."
      },
      {
        type: 'practice',
        content: 'Banter Bootcamp',
        userPrompt: "Let's practice some spicy banter. I'll throw scenarios at you",
        exercise: {
          title: "The Banter Challenge",
          instructions: "I'll give you a dating app message. Your job: respond with something flirty that shows interest but keeps them guessing. Remember: confident, playful, never mean."
        }
      },
      {
        type: 'reflection',
        content: 'Owning your bold side',
        coachDialogue: "Hell yes! See how good that felt? That's because you stopped overthinking and started BEING. The sexiest thing you can do is be unapologetically yourself—with a little extra spice on top. What surprised you about how that felt?"
      }
    ]
  }
};

export const SampleLessons: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCoach, setSelectedCoach] = useState<'grace' | 'posie' | 'rizzo'>('grace');
  const [currentSegment, setCurrentSegment] = useState(0);
  const [activeSegment, setActiveSegment] = useState<'practice' | null>(null);
  const [useHumeAI, setUseHumeAI] = useState(false);

  const lesson = sampleLessons[selectedCoach];
  const segment = lesson.segments[currentSegment];

  const handleNext = () => {
    if (currentSegment < lesson.segments.length - 1) {
      setCurrentSegment(currentSegment + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSegment > 0) {
      setCurrentSegment(currentSegment - 1);
    }
  };

  const coachAvatars = {
    grace: '👗',
    posie: '🧘‍♀️',
    rizzo: '💋'
  };

  return (
    <div className="sample-lessons-container">
      <div className="lessons-header">
        <h1>Experience a Sample Lesson</h1>
        <p>Try a mini coaching session with each of our expert coaches</p>
        
        <div className="ai-toggle">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={useHumeAI}
              onChange={(e) => setUseHumeAI(e.target.checked)}
              className="toggle-checkbox"
            />
            <span className="toggle-slider"></span>
            <span className="toggle-text">
              {useHumeAI ? 'Hume AI (Emotional Intelligence)' : 'Standard AI'}
            </span>
          </label>
        </div>
      </div>

      <div className="coach-selector">
        {Object.keys(sampleLessons).map((coach) => (
          <button
            key={coach}
            className={`coach-button ${selectedCoach === coach ? 'active' : ''}`}
            onClick={() => {
              setSelectedCoach(coach as 'grace' | 'posie' | 'rizzo');
              setCurrentSegment(0);
            }}
          >
            <span className="coach-avatar">{coachAvatars[coach as keyof typeof coachAvatars]}</span>
            <span className="coach-name">{coach.charAt(0).toUpperCase() + coach.slice(1)}</span>
          </button>
        ))}
      </div>

      <div className="lesson-content">
        <div className="lesson-header">
          <h2>{lesson.title}</h2>
          <div className="lesson-meta">
            <span className="duration">🕐 {lesson.duration}</span>
            <span className="progress">
              {currentSegment + 1} of {lesson.segments.length}
            </span>
          </div>
        </div>

        <div className="lesson-objectives">
          <h3>What you'll learn:</h3>
          <ul>
            {lesson.objectives.map((objective, idx) => (
              <li key={idx}>{objective}</li>
            ))}
          </ul>
        </div>

        <div className="segment-container">
          <div className="segment-type">
            {segment.type.charAt(0).toUpperCase() + segment.type.slice(1)}
          </div>
          
          <div className="segment-content">
            <h3>{segment.content}</h3>
            
            {segment.coachDialogue && (
              <div className="coach-dialogue">
                <div className="coach-avatar-large">
                  {coachAvatars[selectedCoach]}
                </div>
                <div className="dialogue-bubble">
                  <p>{segment.coachDialogue}</p>
                  <button 
                    className="play-audio-btn"
                  >
                    ▶️ Play Audio
                  </button>
                </div>
              </div>
            )}

            {segment.exercise && (
              <div className="exercise-box">
                <h4>{segment.exercise.title}</h4>
                <p>{segment.exercise.instructions}</p>
                {segment.userPrompt && (
                  <div className="user-prompt">
                    <strong>Your turn:</strong> {segment.userPrompt}
                  </div>
                )}
                <button 
                  className="practice-btn"
                  onClick={() => {
                    if (useHumeAI) {
                      navigate(`/hume-coach/${selectedCoach}`);
                    } else {
                      setActiveSegment('practice');
                    }
                  }}
                >
                  Start Practice
                </button>
              </div>
            )}

            {segment.type === 'practice' && activeSegment === 'practice' && !useHumeAI && (
              <ImmersiveCoachCall 
                onEnd={() => setActiveSegment(null)}
              />
            )}
          </div>
        </div>

        <div className="lesson-navigation">
          <button 
            onClick={handlePrevious}
            disabled={currentSegment === 0}
            className="nav-btn"
          >
            ← Previous
          </button>
          <div className="segment-dots">
            {lesson.segments.map((_, idx) => (
              <span 
                key={idx}
                className={`dot ${idx === currentSegment ? 'active' : ''}`}
                onClick={() => setCurrentSegment(idx)}
              />
            ))}
          </div>
          <button 
            onClick={handleNext}
            disabled={currentSegment === lesson.segments.length - 1}
            className="nav-btn"
          >
            Next →
          </button>
        </div>
      </div>

      <div className="voice-options">
        <h3>Voice Options (Coming Soon)</h3>
        <div className="voice-providers">
          <div className="provider">
            <span className="provider-icon">🎙️</span>
            <span>OpenAI Voice</span>
          </div>
          <div className="provider">
            <span className="provider-icon">🔊</span>
            <span>ElevenLabs</span>
          </div>
          <div className="provider">
            <span className="provider-icon">🎵</span>
            <span>Hume AI</span>
          </div>
        </div>
      </div>
    </div>
  );
};
