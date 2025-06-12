# XRCupid Platform Development Plan

## 🎯 Vision
A comprehensive dating training platform that uses AI coaches, gesture recognition, and simulated dates to help users build confidence and skills for real-world romantic connections.

## 📱 User Journey Flow

### 1. **Onboarding & Assessment**
```
Welcome → Profile Creation → Initial Assessment → Personalized Learning Path
```

- **Welcome Experience**: Meet Posie for embodiment assessment
- **Profile Builder**: Create dating profile with photos, bio, preferences
- **Skills Assessment**: 
  - Eye contact comfort level
  - Body language awareness
  - Conversation confidence
  - Past dating experiences
- **Learning Path**: Customized curriculum based on assessment

### 2. **Core Training Modules**

#### **A. Embodiment & Presence (Coach: Posie)**
- Body scan meditation before dates
- Breathing exercises for nervousness
- Grounding techniques
- Energy awareness exercises

#### **B. Body Language Mastery (Coach: Grace)**
- **Posture Module**:
  - Real-time posture tracking using MediaPipe Pose
  - Slouch detection and correction
  - Open vs closed body positions
  - Power poses for confidence
  
- **Gesture Training**:
  - Hand gesture recognition for expressiveness
  - Mirroring exercises
  - Cultural gesture awareness
  - Natural vs nervous gestures

#### **C. Eye Contact Training (Coach: Rizzo)**
- **Progressive Exercises**:
  1. Look at avatar's forehead (beginner)
  2. Brief eye contact with breaks
  3. Sustained eye contact practice
  4. Reading emotions in eyes
  5. Flirty eye contact techniques
  
- **Metrics Tracked**:
  - Duration of eye contact
  - Natural break patterns
  - Comfort level progression

#### **D. Conversation Skills (Coach: Max)**
- Active listening indicators (nodding detection)
- Story banking system
- Humor timing practice
- Question asking techniques
- Vulnerability exercises

### 3. **Practice Date System**

#### **Date Simulation Architecture**
```typescript
interface DateSimulation {
  id: string;
  npcProfile: DatingProfile;
  scenario: DateScenario;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  objectives: LearningObjective[];
  possibleOutcomes: DateOutcome[];
}

interface DatingProfile {
  id: string;
  name: string;
  age: number;
  avatarUrl: string; // RPM avatar image
  bio: string;
  interests: string[];
  personality: PersonalityTraits;
  conversationStyle: ConversationStyle;
  dealBreakers: string[];
  greenFlags: string[];
}

interface DateScenario {
  location: 'coffee_shop' | 'restaurant' | 'park' | 'museum' | 'bar';
  duration: number; // minutes
  challenges: Challenge[];
  conversationTopics: Topic[];
}
```

#### **NPC Date Personalities**
1. **The Nervous One** - Helps practice putting others at ease
2. **The Confident One** - Practice matching energy
3. **The Quiet One** - Practice drawing people out
4. **The Talker** - Practice active listening
5. **The Skeptic** - Practice handling difficult conversations
6. **The Flirt** - Practice reciprocating interest
7. **The Intellectual** - Practice deep conversations
8. **The Jokester** - Practice humor and playfulness

### 4. **Personal Data Ledger System**

#### **Story Banking**
```typescript
interface UserStoryBank {
  stories: Story[];
  jokes: Joke[];
  interestingFacts: Fact[];
  vulnerableShares: VulnerableStory[];
  achievements: Achievement[];
}

interface Story {
  id: string;
  title: string;
  content: string;
  tags: string[]; // ['funny', 'travel', 'family']
  effectiveness: number; // 0-100 based on NPC reactions
  lastUsed: Date;
  source: 'coach_session' | 'practice_date' | 'user_input';
}
```

#### **Automatic Story Extraction**
- AI analyzes coach conversations for story moments
- User confirms/edits before adding to bank
- Stories rated by NPCs during practice dates
- Suggestions for story improvement

### 5. **Progress Tracking & Analytics**

#### **Skill Metrics Dashboard**
```typescript
interface UserProgress {
  overallConfidence: number;
  skills: {
    eyeContact: SkillProgress;
    bodyLanguage: SkillProgress;
    conversation: SkillProgress;
    humor: SkillProgress;
    vulnerability: SkillProgress;
    flirting: SkillProgress;
  };
  practiceStats: {
    totalDates: number;
    successfulDates: number;
    commonChallenges: Challenge[];
    improvements: Improvement[];
  };
}
```

### 6. **Failure Scenarios & Learning**

#### **Things That Go Wrong**
1. **Awkward Silences** - Practice conversation recovery
2. **Misread Signals** - Learn consent and boundaries
3. **Oversharing** - Practice appropriate disclosure
4. **Phone Addiction** - Practice presence
5. **Controversial Topics** - Practice navigation
6. **Rejection** - Practice graceful acceptance
7. **Mixed Signals** - Practice clarification

#### **Debrief System**
- Post-date analysis with coach
- Video replay with annotations
- Specific moment breakdown
- Alternative approach suggestions

## 🏗️ Technical Implementation Plan

### Phase 1: Foundation (Weeks 1-2)
- [ ] Dating profile system with RPM avatar gallery
- [ ] Basic date scheduling interface
- [ ] Story banking data structure
- [ ] User progress tracking system

### Phase 2: Training Modules (Weeks 3-4)
- [ ] Posture detection using MediaPipe
- [ ] Eye gaze tracking implementation
- [ ] Gesture recognition system
- [ ] Nodding detection for active listening

### Phase 3: NPC System (Weeks 5-6)
- [ ] NPC personality engine
- [ ] Dynamic conversation system
- [ ] Reaction and scoring system
- [ ] Multiple date scenarios

### Phase 4: Intelligence Layer (Weeks 7-8)
- [ ] Story extraction from conversations
- [ ] Performance analytics
- [ ] Personalized feedback generation
- [ ] Adaptive difficulty system

### Phase 5: Polish & Launch (Weeks 9-10)
- [ ] UI/UX refinement
- [ ] Achievement system
- [ ] Social features (anonymized success stories)
- [ ] Mobile optimization

## 🎨 UI/UX Considerations

### Dating App Interface
- Swipe-style profile browsing for NPCs
- Match with NPCs based on skill level
- Chat interface before dates
- Calendar for scheduling practice dates

### Training Interface
- Progress rings for each skill
- Video tutorials with coach avatars
- Real-time feedback overlays
- Celebration animations for milestones

### Analytics Dashboard
- Heat maps for eye contact patterns
- Posture improvement graphs
- Conversation flow diagrams
- Success rate trends

## 🔄 Feedback Loops

1. **NPC Feedback** → Skill Adjustments
2. **Coach Analysis** → Personalized Exercises  
3. **Story Performance** → Content Refinement
4. **Date Outcomes** → Curriculum Updates

## 🚀 Future Enhancements

- VR dating simulations
- Group date scenarios
- Cultural dating norms training
- Long-term relationship skills
- Conflict resolution practice
- Real user success story sharing
- Peer practice matching

## 📊 Success Metrics

- User confidence scores (self-reported)
- Skill improvement measurements
- Story bank growth
- Practice date success rates
- Real-world date feedback (optional)
- User retention and engagement

---

This comprehensive plan creates a full ecosystem for dating skill development, combining AI coaching, computer vision, and gamified practice to build real confidence and abilities.
