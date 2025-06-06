import { SwipeProfile } from '../types/DatingTypes';

const firstNames = {
  female: ['Emma', 'Sophia', 'Isabella', 'Olivia', 'Ava', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn', 'Luna', 'Ella', 'Chloe', 'Victoria', 'Grace', 'Zoe', 'Lily', 'Hannah', 'Nora', 'Sarah'],
  male: ['Liam', 'Noah', 'Oliver', 'Ethan', 'Lucas', 'Mason', 'Logan', 'Alexander', 'Jacob', 'Michael', 'Daniel', 'Henry', 'Jackson', 'Sebastian', 'Aiden', 'Matthew', 'David', 'Joseph', 'Carter', 'Luke']
};

const occupations = [
  'Software Engineer', 'Marketing Manager', 'Graphic Designer', 'Teacher', 'Nurse', 
  'Photographer', 'Chef', 'Architect', 'Lawyer', 'Doctor', 'Artist', 'Writer',
  'Entrepreneur', 'Consultant', 'Product Manager', 'Data Scientist', 'UX Designer',
  'Financial Analyst', 'Real Estate Agent', 'Personal Trainer', 'Musician',
  'Social Media Manager', 'Event Planner', 'Interior Designer', 'Therapist'
];

const interests = [
  'Hiking', 'Cooking', 'Travel', 'Photography', 'Yoga', 'Reading', 'Gaming',
  'Wine Tasting', 'Dancing', 'Running', 'Art', 'Music', 'Movies', 'Coffee',
  'Fitness', 'Meditation', 'Podcasts', 'Board Games', 'Camping', 'Surfing',
  'Rock Climbing', 'Cycling', 'Painting', 'Writing', 'Volunteering', 'Fashion',
  'Technology', 'History', 'Psychology', 'Philosophy', 'Sports', 'Theater'
];

const bioTemplates = {
  confident: [
    "Life's too short for boring conversations. Let's skip the small talk and plan an adventure.",
    "CEO of making you laugh. Looking for someone who can keep up with my energy.",
    "I know what I want and I go after it. Swipe right if you can handle that.",
    "Turning dreams into reality, one day at a time. Want to join the journey?"
  ],
  shy: [
    "New to this app and a bit nervous! Love quiet nights in with a good book.",
    "Introvert looking for someone patient and kind. I promise I'm worth getting to know.",
    "I might be quiet at first, but I open up to the right person. Coffee dates are my favorite.",
    "Artist at heart, still finding my voice. Looking for genuine connections."
  ],
  adventurous: [
    "Just got back from {destination}! Where should I go next?",
    "Passport always ready. Looking for a travel partner in crime.",
    "If you're not living on the edge, you're taking up too much space.",
    "Weekend warrior seeking adventure buddy. Bonus points if you can keep up!"
  ],
  intellectual: [
    "Currently reading {book}. Always up for deep conversations over coffee.",
    "Fascinated by how the world works. Let's discuss everything from quantum physics to philosophy.",
    "Museum dates > Club nights. Looking for someone who appreciates intellectual stimulation.",
    "PhD in overthinking, minor in bad puns. Seeking someone who appreciates both."
  ],
  charming: [
    "I've been told I'm trouble in the best way possible. Want to find out?",
    "Expert at making ordinary moments feel extraordinary. Let me prove it to you.",
    "Life's a story - let's write an interesting chapter together.",
    "Fluent in sarcasm, romance, and making you smile. What more could you want?"
  ]
};

const conversationStarters = [
  "What's the most spontaneous thing you've ever done?",
  "If you could have dinner with anyone, dead or alive, who would it be?",
  "What's your idea of a perfect Sunday?",
  "Tell me about the last thing that made you laugh out loud",
  "What's on your bucket list?",
  "Would you rather explore space or the deep ocean?",
  "What's your go-to karaoke song?",
  "If you won the lottery tomorrow, what's the first thing you'd do?",
  "What's the best advice you've ever received?",
  "Describe your perfect date in 3 emojis"
];

const dealBreakers = [
  "No sense of humor",
  "Rude to service workers",
  "Can't hold a conversation",
  "No ambition",
  "Closed-minded",
  "Poor hygiene",
  "Constantly on phone",
  "No emotional intelligence",
  "Dishonesty",
  "Negativity"
];

const greenFlags = [
  "Great communicator",
  "Emotionally available",
  "Has close friendships",
  "Passionate about something",
  "Good relationship with family",
  "Takes care of themselves",
  "Respects boundaries",
  "Growth mindset",
  "Sense of humor",
  "Kind to strangers"
];

export function generateDatingProfiles(
  count: number,
  preferences?: {
    ageRange?: [number, number];
    interests?: string[];
    personalityTypes?: string[];
  }
): SwipeProfile[] {
  const profiles: SwipeProfile[] = [];
  const [minAge, maxAge] = preferences?.ageRange || [22, 35];
  
  for (let i = 0; i < count; i++) {
    const gender = Math.random() > 0.5 ? 'male' : 'female';
    const personality = getRandomPersonality(preferences?.personalityTypes);
    const age = Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;
    
    const profile: SwipeProfile = {
      id: `profile-${Date.now()}-${i}`,
      name: getRandomName(gender),
      age,
      occupation: getRandomItem(occupations),
      bio: generateBio(personality),
      interests: generateInterests(preferences?.interests),
      photos: generatePhotoUrls(gender, 3 + Math.floor(Math.random() * 3)),
      personality,
      matchScore: Math.random() * 30 + 70, // 70-100
      conversationStarters: getRandomItems(conversationStarters, 3),
      dealBreakers: getRandomItems(dealBreakers, 3),
      greenFlags: getRandomItems(greenFlags, 3),
      distance: Math.floor(Math.random() * 25) + 1,
      lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Within last week
      verificationStatus: Math.random() > 0.7 ? 'verified' : 'none',
      compatibilityScore: Math.random() * 40 + 60, // 60-100
      sharedInterests: []
    };
    
    // Calculate shared interests
    if (preferences?.interests) {
      profile.sharedInterests = profile.interests.filter(interest => 
        preferences.interests!.includes(interest)
      );
    }
    
    profiles.push(profile);
  }
  
  return profiles;
}

function getRandomName(gender: 'male' | 'female'): string {
  const names = firstNames[gender];
  return names[Math.floor(Math.random() * names.length)];
}

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomPersonality(preferred?: string[]): 'confident' | 'shy' | 'adventurous' | 'intellectual' | 'charming' {
  const personalities: Array<'confident' | 'shy' | 'adventurous' | 'intellectual' | 'charming'> = 
    ['confident', 'shy', 'adventurous', 'intellectual', 'charming'];
  
  if (preferred && preferred.length > 0) {
    const validPreferred = personalities.filter(p => preferred.includes(p));
    if (validPreferred.length > 0) {
      return getRandomItem(validPreferred);
    }
  }
  
  return getRandomItem(personalities);
}

function generateBio(personality: string): string {
  const templates = bioTemplates[personality as keyof typeof bioTemplates];
  let bio = getRandomItem(templates);
  
  // Replace placeholders
  bio = bio.replace('{destination}', getRandomItem(['Bali', 'Tokyo', 'Iceland', 'Peru', 'New Zealand']));
  bio = bio.replace('{book}', getRandomItem(['Sapiens', '1984', 'The Alchemist', 'Atomic Habits']));
  
  // Add emoji
  const emojis = ['✨', '🌟', '💫', '🎯', '🚀', '🌈', '☕', '🍷', '🎨', '📚', '🏃‍♂️', '🧘‍♀️'];
  bio += ' ' + getRandomItems(emojis, 2).join('');
  
  return bio;
}

function generateInterests(preferredInterests?: string[]): string[] {
  let selectedInterests: string[] = [];
  
  // Include some preferred interests if provided
  if (preferredInterests && preferredInterests.length > 0) {
    const sharedCount = Math.floor(Math.random() * 3) + 1; // 1-3 shared interests
    selectedInterests = getRandomItems(preferredInterests, Math.min(sharedCount, preferredInterests.length));
  }
  
  // Add random interests to reach 5-8 total
  const targetCount = 5 + Math.floor(Math.random() * 4);
  const remainingCount = targetCount - selectedInterests.length;
  
  if (remainingCount > 0) {
    const availableInterests = interests.filter(i => !selectedInterests.includes(i));
    selectedInterests = [...selectedInterests, ...getRandomItems(availableInterests, remainingCount)];
  }
  
  return selectedInterests;
}

function generatePhotoUrls(gender: string, count: number): string[] {
  const photos: string[] = [];
  const baseUrl = 'https://randomuser.me/api/portraits';
  const genderPath = gender === 'male' ? 'men' : 'women';
  
  for (let i = 0; i < count; i++) {
    const photoId = Math.floor(Math.random() * 99) + 1;
    photos.push(`${baseUrl}/${genderPath}/${photoId}.jpg`);
  }
  
  return photos;
}
