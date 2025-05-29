import React, { useState, useEffect } from 'react';
import './RizzTrainingModule.css';

interface StoryTemplate {
  id: string;
  category: 'adventure' | 'funny' | 'personal' | 'achievement' | 'vulnerable';
  title: string;
  structure: string[];
  example: string;
  tips: string[];
}

interface JokeTemplate {
  id: string;
  type: 'observational' | 'self-deprecating' | 'playful' | 'witty';
  setup: string;
  punchline: string;
  timing: string;
  appropriateness: number; // 1-10 scale
}

interface QuestionTemplate {
  id: string;
  category: 'deep' | 'playful' | 'hypothetical' | 'personal' | 'creative';
  question: string;
  followUps: string[];
  purpose: string;
}

const STORY_TEMPLATES: StoryTemplate[] = [
  {
    id: 'adventure',
    category: 'adventure',
    title: 'The Adventure Story',
    structure: [
      'Set the scene (where/when)',
      'The challenge/unexpected moment',
      'Your reaction/decision',
      'The outcome/lesson learned',
      'Connect to them/ask follow-up'
    ],
    example: "So last year I decided to hike this trail in Colorado that was supposed to be 'easy'... turns out the map was from 1987 and half the trail had washed out! I ended up having to navigate using just my phone compass and somehow found this incredible hidden waterfall that wasn't on any map. Best mistake I ever made. Do you have any adventures that turned out better than planned?",
    tips: [
      'Keep it under 2 minutes',
      'Include sensory details',
      'Show vulnerability or humor',
      'Always end with a question'
    ]
  },
  {
    id: 'funny',
    category: 'funny',
    title: 'The Funny Mishap',
    structure: [
      'Build up the situation',
      'The moment it went wrong',
      'Your embarrassing reaction',
      'The funny aftermath',
      'Self-deprecating conclusion'
    ],
    example: "I thought I was being so smooth at this coffee shop, trying to impress the barista by ordering something fancy in Italian... turns out I accidentally ordered a kids meal from the restaurant next door. The barista just looked confused and said 'Sir, this is a Starbucks.' I still got my coffee though, and a good story. What's your most embarrassing smooth move that backfired?",
    tips: [
      'Make yourself the target of humor',
      'Exaggerate for effect',
      'Show you can laugh at yourself',
      'Keep it light and relatable'
    ]
  }
];

const JOKE_TEMPLATES: JokeTemplate[] = [
  {
    id: 'observational1',
    type: 'observational',
    setup: "I love how dating apps show 'distance: 2 miles away'",
    punchline: "Like I'm tracking a pizza delivery instead of finding love",
    timing: "Pause after 'away' for effect",
    appropriateness: 8
  },
  {
    id: 'self-deprecating1',
    type: 'self-deprecating',
    setup: "I'm at that age where my back goes out more than I do",
    punchline: "But hey, at least something's getting action",
    timing: "Deliver deadpan, then smile",
    appropriateness: 7
  }
];

const QUESTION_TEMPLATES: QuestionTemplate[] = [
  {
    id: 'deep1',
    category: 'deep',
    question: "What's something you believed as a kid that you're embarrassed about now?",
    followUps: [
      "That's hilarious! How did you find out the truth?",
      "I can totally see kid-you thinking that",
      "Please tell me you didn't share this belief with other kids"
    ],
    purpose: "Creates vulnerability and shared laughter"
  },
  {
    id: 'playful1',
    category: 'playful',
    question: "If you could have dinner with anyone, dead or alive, who would it be and what would you order for them?",
    followUps: [
      "Interesting choice! What would you want to ask them?",
      "I love that you thought about what to order them too",
      "That's such a unique perspective on that question"
    ],
    purpose: "Shows creativity and thoughtfulness"
  }
];

const RIZZ_TECHNIQUES = [
  {
    name: "The Callback",
    description: "Reference something they mentioned earlier",
    example: "You mentioned you're into jazz earlier - I just heard this amazing Miles Davis track that reminded me of our conversation",
    effectiveness: 9
  },
  {
    name: "The Compliment Sandwich",
    description: "Specific compliment + question + future reference",
    example: "I love how passionate you get when talking about your work - what got you into that field? I feel like you probably have some great stories",
    effectiveness: 8
  },
  {
    name: "The Playful Challenge",
    description: "Light teasing that creates banter",
    example: "I'm getting the sense you're one of those people who has strong opinions about pineapple on pizza",
    effectiveness: 7
  }
];

export const RizzTrainingModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stories' | 'jokes' | 'questions' | 'techniques'>('stories');
  const [userStories, setUserStories] = useState<any[]>([]);
  const [practiceMode, setPracticeMode] = useState(false);
  const [currentPractice, setCurrentPractice] = useState<any>(null);

  const [newStory, setNewStory] = useState({
    title: '',
    content: '',
    category: 'adventure' as const,
    practiced: false
  });

  const saveStory = () => {
    if (newStory.title && newStory.content) {
      setUserStories([...userStories, { ...newStory, id: Date.now() }]);
      setNewStory({ title: '', content: '', category: 'adventure', practiced: false });
    }
  };

  const startPractice = (item: any, type: string) => {
    setCurrentPractice({ ...item, type });
    setPracticeMode(true);
  };

  const renderStoryBuilder = () => (
    <div className="story-builder">
      <h3>📚 Build Your Story Bank</h3>
      
      <div className="story-templates">
        <h4>Story Templates</h4>
        {STORY_TEMPLATES.map(template => (
          <div key={template.id} className="template-card">
            <h5>{template.title}</h5>
            <div className="story-structure">
              {template.structure.map((step, index) => (
                <div key={index} className="structure-step">
                  <span className="step-number">{index + 1}</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
            <div className="example-story">
              <strong>Example:</strong>
              <p>"{template.example}"</p>
            </div>
            <div className="story-tips">
              <strong>Tips:</strong>
              <ul>
                {template.tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
            <button 
              className="practice-btn"
              onClick={() => startPractice(template, 'story')}
            >
              Practice This Template
            </button>
          </div>
        ))}
      </div>

      <div className="story-creator">
        <h4>Create Your Own Story</h4>
        <select 
          value={newStory.category}
          onChange={(e) => setNewStory({...newStory, category: e.target.value as any})}
        >
          <option value="adventure">Adventure</option>
          <option value="funny">Funny</option>
          <option value="personal">Personal</option>
          <option value="achievement">Achievement</option>
          <option value="vulnerable">Vulnerable</option>
        </select>
        <input
          type="text"
          placeholder="Story title..."
          value={newStory.title}
          onChange={(e) => setNewStory({...newStory, title: e.target.value})}
        />
        <textarea
          placeholder="Write your story here..."
          value={newStory.content}
          onChange={(e) => setNewStory({...newStory, content: e.target.value})}
          rows={6}
        />
        <button onClick={saveStory} className="save-btn">Save Story</button>
      </div>

      <div className="user-stories">
        <h4>Your Story Bank ({userStories.length})</h4>
        {userStories.map(story => (
          <div key={story.id} className="user-story-card">
            <h5>{story.title}</h5>
            <p>{story.content.substring(0, 100)}...</p>
            <div className="story-actions">
              <button onClick={() => startPractice(story, 'user-story')}>
                Practice
              </button>
              <span className={`practice-status ${story.practiced ? 'practiced' : ''}`}>
                {story.practiced ? '✅ Practiced' : '⏳ Not Practiced'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderJokeTraining = () => (
    <div className="joke-training">
      <h3>😄 Humor & Timing</h3>
      
      <div className="joke-library">
        {JOKE_TEMPLATES.map(joke => (
          <div key={joke.id} className="joke-card">
            <div className="joke-type">{joke.type}</div>
            <div className="joke-content">
              <div className="setup">
                <strong>Setup:</strong> "{joke.setup}"
              </div>
              <div className="punchline">
                <strong>Punchline:</strong> "{joke.punchline}"
              </div>
              <div className="timing">
                <strong>Timing:</strong> {joke.timing}
              </div>
              <div className="appropriateness">
                <strong>Appropriateness:</strong> 
                <div className="rating">
                  {Array.from({length: 10}, (_, i) => (
                    <span key={i} className={i < joke.appropriateness ? 'filled' : ''}>
                      ⭐
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button 
              className="practice-btn"
              onClick={() => startPractice(joke, 'joke')}
            >
              Practice Delivery
            </button>
          </div>
        ))}
      </div>

      <div className="humor-tips">
        <h4>🎯 Humor Guidelines</h4>
        <ul>
          <li><strong>Self-deprecating &gt; Others:</strong> Make fun of yourself, not them</li>
          <li><strong>Read the room:</strong> Match their energy and humor style</li>
          <li><strong>Timing is everything:</strong> Pause before punchlines</li>
          <li><strong>Recovery plan:</strong> If it doesn't land, acknowledge and move on</li>
          <li><strong>Less is more:</strong> One good joke &gt; three mediocre ones</li>
        </ul>
      </div>
    </div>
  );

  const renderQuestionMastery = () => (
    <div className="question-mastery">
      <h3>❓ Question Crafting</h3>
      
      <div className="question-library">
        {QUESTION_TEMPLATES.map(question => (
          <div key={question.id} className="question-card">
            <div className="question-category">{question.category}</div>
            <div className="question-content">
              <div className="main-question">
                <strong>Question:</strong> "{question.question}"
              </div>
              <div className="purpose">
                <strong>Purpose:</strong> {question.purpose}
              </div>
              <div className="follow-ups">
                <strong>Follow-ups:</strong>
                <ul>
                  {question.followUps.map((followUp, index) => (
                    <li key={index}>"{followUp}"</li>
                  ))}
                </ul>
              </div>
            </div>
            <button 
              className="practice-btn"
              onClick={() => startPractice(question, 'question')}
            >
              Practice This Question
            </button>
          </div>
        ))}
      </div>

      <div className="question-tips">
        <h4>🎯 Question Guidelines</h4>
        <ul>
          <li><strong>Open-ended &gt; Yes/No:</strong> "What" and "How" questions create conversation</li>
          <li><strong>Follow the thread:</strong> Build on their answers</li>
          <li><strong>Share after asking:</strong> Answer your own question too</li>
          <li><strong>Emotional questions:</strong> "How did that make you feel?" goes deep</li>
          <li><strong>Hypotheticals are fun:</strong> "What would you do if..." sparks imagination</li>
        </ul>
      </div>
    </div>
  );

  const renderTechniques = () => (
    <div className="rizz-techniques">
      <h3>🔥 Advanced Rizz Techniques</h3>
      
      <div className="techniques-grid">
        {RIZZ_TECHNIQUES.map((technique, index) => (
          <div key={index} className="technique-card">
            <h4>{technique.name}</h4>
            <p>{technique.description}</p>
            <div className="technique-example">
              <strong>Example:</strong>
              <p>"{technique.example}"</p>
            </div>
            <div className="effectiveness">
              <strong>Effectiveness:</strong>
              <div className="rating">
                {Array.from({length: 10}, (_, i) => (
                  <span key={i} className={i < technique.effectiveness ? 'filled' : ''}>
                    🔥
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="advanced-tips">
        <h4>🎯 Master-Level Tips</h4>
        <div className="tips-grid">
          <div className="tip-card">
            <h5>🎭 The Mirror Technique</h5>
            <p>Subtly match their communication style - if they use emojis, you use emojis. If they're formal, be formal.</p>
          </div>
          <div className="tip-card">
            <h5>⏰ The Time Investment</h5>
            <p>Reference future plans together: "When we grab coffee" not "If we grab coffee"</p>
          </div>
          <div className="tip-card">
            <h5>🎪 The Intrigue Loop</h5>
            <p>Start a story but don't finish it: "That reminds me of this crazy thing that happened... actually, I'll tell you over coffee"</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (practiceMode && currentPractice) {
    return (
      <div className="practice-mode">
        <div className="practice-header">
          <h3>🎯 Practice Mode: {currentPractice.title || currentPractice.name}</h3>
          <button onClick={() => setPracticeMode(false)} className="exit-practice">
            Exit Practice
          </button>
        </div>
        
        <div className="practice-content">
          <div className="practice-instructions">
            <h4>Instructions:</h4>
            <p>Record yourself or practice in front of a mirror. Focus on:</p>
            <ul>
              <li>Tone and pacing</li>
              <li>Facial expressions</li>
              <li>Hand gestures</li>
              <li>Eye contact (if practicing with mirror)</li>
            </ul>
          </div>
          
          <div className="practice-material">
            {currentPractice.type === 'story' && (
              <div>
                <h4>Story Structure:</h4>
                {currentPractice.structure?.map((step: string, index: number) => (
                  <div key={index} className="practice-step">
                    <span className="step-number">{index + 1}</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            )}
            
            {currentPractice.type === 'joke' && (
              <div>
                <h4>Delivery Notes:</h4>
                <p><strong>Setup:</strong> {currentPractice.setup}</p>
                <p><strong>Timing:</strong> {currentPractice.timing}</p>
                <p><strong>Punchline:</strong> {currentPractice.punchline}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rizz-training-module">
      <div className="module-header">
        <h2>🔥 Rizz Training Academy</h2>
        <p>Master the art of charming conversation</p>
      </div>

      <div className="tab-navigation">
        <button 
          className={activeTab === 'stories' ? 'active' : ''}
          onClick={() => setActiveTab('stories')}
        >
          📚 Stories
        </button>
        <button 
          className={activeTab === 'jokes' ? 'active' : ''}
          onClick={() => setActiveTab('jokes')}
        >
          😄 Humor
        </button>
        <button 
          className={activeTab === 'questions' ? 'active' : ''}
          onClick={() => setActiveTab('questions')}
        >
          ❓ Questions
        </button>
        <button 
          className={activeTab === 'techniques' ? 'active' : ''}
          onClick={() => setActiveTab('techniques')}
        >
          🔥 Techniques
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'stories' && renderStoryBuilder()}
        {activeTab === 'jokes' && renderJokeTraining()}
        {activeTab === 'questions' && renderQuestionMastery()}
        {activeTab === 'techniques' && renderTechniques()}
      </div>
    </div>
  );
};

export default RizzTrainingModule;
