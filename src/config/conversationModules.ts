export interface ConversationModule {
  id: string;
  category: 'anecdotes' | 'questions' | 'hypotheticals' | 'storytelling' | 'curiosity';
  title: string;
  description: string;
  examples: ConversationExample[];
  tips: string[];
  practiceExercises: PracticeExercise[];
}

export interface ConversationExample {
  type: 'starter' | 'response' | 'follow-up';
  text: string;
  context?: string;
  coachNote?: string;
}

export interface PracticeExercise {
  prompt: string;
  guidancePoints: string[];
  exampleResponses?: string[];
}

export const CONVERSATION_MODULES: ConversationModule[] = [
  // Personal Anecdotes Module
  {
    id: 'personal-anecdotes',
    category: 'anecdotes',
    title: 'The Art of Personal Storytelling',
    description: 'Learn to share compelling personal stories that create connection without oversharing',
    examples: [
      {
        type: 'starter',
        text: "So I had the weirdest thing happen at the farmer's market this morning...",
        context: "Opening with intrigue",
        coachNote: "Notice how this creates curiosity without giving everything away"
      },
      {
        type: 'starter',
        text: "That reminds me of this time in Barcelona when I accidentally joined a protest march...",
        context: "Connecting to their story",
        coachNote: "Links their experience to yours while adding adventure"
      },
      {
        type: 'response',
        text: "...and that's how I learned that octopi are escape artists. What's the strangest animal encounter you've had?",
        context: "Ending with engagement",
        coachNote: "Always loop back to them after your story"
      }
    ],
    tips: [
      "Keep anecdotes under 2 minutes unless they're deeply engaged",
      "Include sensory details - what you saw, heard, felt",
      "Have a point or punchline - stories need landing spots",
      "Practice your top 5 go-to stories until they flow naturally",
      "Match energy - read if they want quick & light or deep & meaningful"
    ],
    practiceExercises: [
      {
        prompt: "Turn a mundane daily experience into an engaging 30-second story",
        guidancePoints: [
          "Find the unexpected angle",
          "Add one vivid detail",
          "Include your emotional reaction",
          "End with a question or observation"
        ]
      }
    ]
  },

  // Have You Ever Module
  {
    id: 'have-you-ever',
    category: 'questions',
    title: 'Have You Ever? The Gateway to Stories',
    description: 'Master the art of "Have you ever?" questions that unlock great conversations',
    examples: [
      {
        type: 'starter',
        text: "Have you ever had a moment where you thought 'I can't believe this is my life right now'?",
        coachNote: "Open-ended and emotionally evocative"
      },
      {
        type: 'starter',
        text: "Have you ever completely changed your mind about something you were certain about?",
        coachNote: "Reveals growth and self-awareness"
      },
      {
        type: 'starter',
        text: "Have you ever had a random encounter that changed your perspective?",
        coachNote: "Invites meaningful sharing"
      },
      {
        type: 'follow-up',
        text: "What was going through your mind in that moment?",
        coachNote: "Deepens their story"
      }
    ],
    tips: [
      "Start broad, then narrow based on their interests",
      "Share your own 'have you ever' story if they seem stuck",
      "Use these to discover shared experiences",
      "Avoid yes/no versions - make them story-prompting",
      "Save intimate ones for when rapport is established"
    ],
    practiceExercises: [
      {
        prompt: "Create 5 'Have you ever' questions for different conversation depths",
        guidancePoints: [
          "Level 1: Light and fun (travel, food, hobbies)",
          "Level 2: Meaningful (perspective changes, surprises)",
          "Level 3: Vulnerable (fears faced, dreams pursued)",
          "Make each one story-inducing, not yes/no",
          "Test which ones get the best responses"
        ]
      }
    ]
  },

  // Would You Rather Module
  {
    id: 'would-you-rather',
    category: 'questions',
    title: 'Would You Rather: Playful Philosophy',
    description: 'Use creative dilemmas to reveal values, humor, and thinking styles',
    examples: [
      {
        type: 'starter',
        text: "Would you rather have the ability to fly but only at walking speed, or run at 100mph but only backwards?",
        coachNote: "Absurd and playful - great icebreaker"
      },
      {
        type: 'starter',
        text: "Would you rather know the history of every object you touch, or be able to talk to animals but they're all pessimistic?",
        coachNote: "Creative with personality hints"
      },
      {
        type: 'starter',
        text: "Would you rather live in a world where all lies glow purple, or where everyone's thoughts appear as subtitles?",
        coachNote: "Philosophical but accessible"
      },
      {
        type: 'follow-up',
        text: "Ooh interesting choice! How would you handle [specific scenario based on their choice]?",
        coachNote: "Dig deeper into their reasoning"
      }
    ],
    tips: [
      "Create scenarios that reveal personality, not just preferences",
      "Mix silly with profound - gauge their mood",
      "Build on their answers: 'Okay but what if...'",
      "Share your reasoning too - make it a dialogue",
      "Use these to transition to deeper topics naturally"
    ],
    practiceExercises: [
      {
        prompt: "Design 3 'Would You Rather' questions that subtly explore values",
        guidancePoints: [
          "Hidden theme: adventure vs security",
          "Hidden theme: connection vs independence",
          "Hidden theme: knowledge vs experience",
          "Make both options appealing but different",
          "Add unexpected twists to standard formats"
        ]
      }
    ]
  },

  // Favorites Module
  {
    id: 'all-time-favorites',
    category: 'questions',
    title: "What's Your All-Time Favorite?",
    description: 'Go beyond basic favorites to unlock passionate conversations',
    examples: [
      {
        type: 'starter',
        text: "What's your all-time favorite 'I probably shouldn't love this but I do' movie?",
        coachNote: "Adds vulnerability and humor"
      },
      {
        type: 'starter',
        text: "What's your favorite tiny moment that most people don't notice? Like the sound of coffee brewing or that golden hour light...",
        coachNote: "Shows depth and awareness"
      },
      {
        type: 'starter',
        text: "What's your favorite story about yourself that you never get to tell?",
        coachNote: "Incredibly revealing and engaging"
      },
      {
        type: 'follow-up',
        text: "What is it about that [movie/moment/story] that speaks to you?",
        coachNote: "Gets to emotional connection"
      }
    ],
    tips: [
      "Add qualifiers to make favorites more interesting",
      "Ask about the WHY, not just the WHAT",
      "Share enthusiastically about their favorites first",
      "Use favorites to find unexpected common ground",
      "Layer in specificity: 'favorite rainy day album' vs 'favorite music'"
    ],
    practiceExercises: [
      {
        prompt: "Transform 5 basic favorite questions into conversation starters",
        guidancePoints: [
          "Basic: 'Favorite food?' → Better: 'Favorite meal that tells a story?'",
          "Add emotional context or specific scenarios",
          "Include 'guilty pleasure' or 'unexpectedly' modifiers",
          "Frame to encourage storytelling, not one-word answers"
        ]
      }
    ]
  },

  // Hypotheticals & Worldbuilding Module
  {
    id: 'hypothetical-worlds',
    category: 'hypotheticals',
    title: 'Hypotheticals & Collaborative Imagination',
    description: 'Build worlds together through creative scenarios and "what if" questions',
    examples: [
      {
        type: 'starter',
        text: "If you could add one rule to society that everyone had to follow, what would create the most interesting chaos?",
        coachNote: "Playful but reveals values"
      },
      {
        type: 'starter',
        text: "Imagine we discover that trees have been conscious this whole time. How does the world change?",
        coachNote: "Collaborative worldbuilding opportunity"
      },
      {
        type: 'starter',
        text: "You wake up tomorrow and everyone else has vanished for exactly 24 hours. After checking on loved ones, what do you do?",
        coachNote: "Reveals authentic desires"
      },
      {
        type: 'follow-up',
        text: "Ooh yes, and then what if [build on their idea]...?",
        coachNote: "Yes-and their creativity"
      }
    ],
    tips: [
      "Start scenarios simply, add complexity together",
      "Use 'Yes, and...' from improv to build together",
      "Balance serious thought experiments with playful ones",
      "Let them lead sometimes - be the curious questioner",
      "Connect hypotheticals back to real insights about them"
    ],
    practiceExercises: [
      {
        prompt: "Create a hypothetical scenario that naturally branches into deeper conversation",
        guidancePoints: [
          "Start with an intriguing 'what if'",
          "Have 3 follow-up questions ready",
          "Include moral, practical, and creative angles",
          "Practice building on whatever direction they take it"
        ]
      }
    ]
  },

  // Collaborative Storytelling Module
  {
    id: 'collaborative-storytelling',
    category: 'storytelling',
    title: 'Story Building: Creative Connection',
    description: 'Create stories together that reveal imagination and compatibility',
    examples: [
      {
        type: 'starter',
        text: "Let's create a story. I'll start: 'The lighthouse keeper noticed something odd about the waves that morning...' What happened next?",
        coachNote: "Intriguing but open setup"
      },
      {
        type: 'starter',
        text: "Want to play story tennis? We each add one sentence. Genre: noir detective meets cooking show.",
        coachNote: "Playful with clear rules"
      },
      {
        type: 'follow-up',
        text: "I love where you took that! Now the plot thickens because...",
        coachNote: "Encourage and escalate"
      }
    ],
    tips: [
      "Set simple rules: sentence limits, genre mixing, etc.",
      "Celebrate their additions enthusiastically",
      "Keep it light unless they go deep",
      "Use this to gauge humor compatibility",
      "Transition to real stories: 'That reminds me of...'"
    ],
    practiceExercises: [
      {
        prompt: "Practice three different story-building formats",
        guidancePoints: [
          "One sentence each, building tension",
          "Character creation: build a person together",
          "Genre mash-up: combine two unlikely genres",
          "Know when to end - don't let it drag"
        ]
      }
    ]
  }
];

// Curiosity Tracking System
export interface CuriosityItem {
  id: string;
  type: 'article' | 'idea' | 'movie' | 'book' | 'podcast' | 'question' | 'fact';
  title: string;
  description?: string;
  source?: string;
  dateAdded: Date;
  tags: string[];
  personalNote?: string;
  sharedInConversation?: boolean;
}

export interface CuriosityBank {
  items: CuriosityItem[];
  categories: CuriosityCategory[];
  conversationStarters: ConversationStarter[];
}

export interface CuriosityCategory {
  id: string;
  name: string;
  icon: string;
  prompts: string[];
}

export interface ConversationStarter {
  curiosityItemId: string;
  opener: string;
  context: string;
}

export const CURIOSITY_CATEGORIES: CuriosityCategory[] = [
  {
    id: 'mind-blown',
    name: 'Mind-Blowing Facts',
    icon: '🤯',
    prompts: [
      "I just learned the most incredible thing about...",
      "Did you know that...? It completely changed how I think about...",
      "I fell down a Wikipedia rabbit hole and discovered..."
    ]
  },
  {
    id: 'culture-pulse',
    name: 'Cultural Pulse',
    icon: '🎭',
    prompts: [
      "Have you seen/heard about [movie/show/artist]? I'm curious because...",
      "I've been meaning to check out [thing] - have you experienced it?",
      "Everyone's talking about [cultural phenomenon] and I'm fascinated by..."
    ]
  },
  {
    id: 'big-questions',
    name: 'Big Questions',
    icon: '🌌',
    prompts: [
      "I've been pondering this question: [philosophical query]",
      "Someone asked me [thought-provoking question] and I can't stop thinking about it",
      "What's your take on [existential topic]?"
    ]
  },
  {
    id: 'rabbit-holes',
    name: 'Fascinating Rabbit Holes',
    icon: '🐰',
    prompts: [
      "I went down the most interesting internet rabbit hole about...",
      "Started researching [simple topic], ended up learning about [complex topic]",
      "You know those 3am Wikipedia journeys? Last night I discovered..."
    ]
  },
  {
    id: 'fresh-perspectives',
    name: 'Fresh Perspectives',
    icon: '👁️',
    prompts: [
      "I heard this perspective that completely reframed how I see...",
      "Someone pointed out [observation] and now I can't unsee it",
      "This article/podcast made me rethink..."
    ]
  }
];

export const CURIOSITY_PROMPTS = {
  daily: [
    "What made you curious today?",
    "What question popped into your head that you want to explore?",
    "What's something you noticed that others might have missed?"
  ],
  weekly: [
    "What's the most interesting thing you learned this week?",
    "What article/video/podcast left you thinking?",
    "What assumption did you question this week?"
  ],
  conversation: [
    "What's something you're genuinely curious about right now?",
    "What's a question you've been sitting with lately?",
    "What's the last thing that sent you down an internet rabbit hole?"
  ]
};

// Integration with Dating Practice
export const CONVERSATION_SKILL_METRICS = {
  storytelling: {
    pacing: "How well-timed are your anecdotes?",
    engagement: "Do your stories invite participation?",
    relevance: "Are your stories contextually appropriate?"
  },
  questioning: {
    depth: "Do your questions go beyond surface level?",
    creativity: "Are your questions unexpected and interesting?",
    followThrough: "Do you build on their responses?"
  },
  curiosity: {
    breadth: "Do you show interest in diverse topics?",
    enthusiasm: "Is your curiosity contagious?",
    sharing: "Do you offer your own perspectives?"
  },
  collaboration: {
    building: "Do you 'yes-and' their contributions?",
    balance: "Is creative control shared equally?",
    energy: "Do you match and elevate their energy?"
  }
};
