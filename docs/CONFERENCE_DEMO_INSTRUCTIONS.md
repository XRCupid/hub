# XRCupid Conference Booth Demo - Setup Instructions 🎥

## Overview
This demo showcases real-time emotion tracking, presence avatars, and live coaching advice for speed dating sessions. The audience can see participants' emotions and provide coaching in real-time.

## Prerequisites
- Node.js installed
- Webcam on computer
- Mobile phone with camera
- Chrome or Firefox browser (for best WebRTC support)

## Quick Start (2 Minutes)

### Step 1: Start the Application
```bash
cd /Users/douglasgoldstein/XRCupid_Clone/hub
npm start
```
The app will open at `http://localhost:3000`

### Step 2: Set Up the Host Computer (with Webcam)
1. Open Chrome/Firefox on the computer
2. Navigate to: **`http://localhost:3000/conference`**
3. Allow camera and microphone permissions when prompted
4. Click **"Create New Room"**
5. Note the 6-character room code (e.g., "ABC123")
6. The screen will show:
   - Your webcam preview
   - Waiting for mobile participant to join

### Step 3: Connect the Mobile Phone
1. On the mobile phone browser
2. Navigate to: **`http://localhost:3000/conference-mobile`**
3. Enter the room code from Step 2
4. Allow camera and microphone permissions
5. Click **"Join Room"**

### Step 4: Analytics Dashboard Activates! 🚀
Once both devices are connected, the host computer automatically switches to the **Audience Analytics Dashboard** showing:

#### Left Panel - Participant Videos
- **Both video feeds** with real-time emotion overlays
- **Top 3 emotions** displayed as colored bars
- **Presence avatars** (toggle with button)
- **Chemistry score** between participants

#### Center Panel - Real-Time Metrics
- **Emotional Sync %** - How aligned their emotions are
- **Eye Contact Score** - Are they looking at camera?
- **Engagement Level** - Facial expression engagement
- **Dominant Emotions** - Big emoji display

#### Right Panel - Live Coaching Advice
- **Priority-based insights** (High/Medium/Low)
- **Real-time suggestions** the audience can share:
  - "Try to maintain eye contact"
  - "Show more enthusiasm"
  - "Your joy is creating chemistry!"
- **Chemistry moments** highlighted

## Features Demonstrated

### 1. Real-Time Emotion Detection 🎭
- Powered by **Hume AI** voice analysis
- Detects emotions from speech prosody
- Updates every 1-2 seconds
- Shows confidence levels for each emotion

### 2. Presence Avatars 👥
- 3D avatars mirror facial expressions
- Uses ML5 face tracking + Hume emotions
- Toggle between video/avatar view
- Great for privacy-conscious participants

### 3. Live Coaching System 💡
- **Eye Contact**: Tracks if looking at camera
- **Emotions**: Suggests emotional adjustments
- **Engagement**: Encourages active participation
- **Body Language**: Posture recommendations

### 4. Chemistry Scoring ❤️
- Calculates emotional synchronization
- Highlights "chemistry moments"
- Shows compatibility percentage
- Tracks mutual positive emotions

## Demo Script for Presenters

### Opening (30 seconds)
"Welcome to XRCupid's real-time emotion coaching system. We're going to show how AI can help create better connections in speed dating by providing live feedback to both participants and audience coaches."

### Setup (1 minute)
1. "First, I'll create a room on this computer with webcam"
2. "Now joining from mobile with code [XXXXXX]"
3. "Watch as the analytics dashboard automatically appears..."

### Key Points to Highlight (2 minutes)
1. **Emotion Detection**: "Notice how emotions update in real-time as they speak"
2. **Coaching Advice**: "The audience sees suggestions they can share"
3. **Chemistry Moments**: "Watch the chemistry score spike when they laugh together"
4. **Presence Avatars**: "For privacy, we can switch to avatar mode"

### Audience Interaction (1 minute)
"Audience members, what coaching advice do you see? Share it with our daters!"

## Troubleshooting

### Camera/Mic Not Working?
- Check browser permissions (Settings > Privacy > Camera/Microphone)
- Refresh the page and allow permissions again
- Try Chrome or Firefox (Safari has WebRTC limitations)

### Emotions Not Showing?
- Ensure participants are speaking (Hume analyzes voice)
- Check console for Hume API errors
- Verify HUME_API_KEY is set in environment

### Mobile Connection Issues?
- Ensure both devices are on same network
- Check room code is entered correctly
- Try refreshing both pages

### Low Performance?
- Close other browser tabs
- Reduce video quality in settings
- Check network bandwidth

## Technical Details

### URLs
- **Host + Audience**: `/conference`
- **Mobile Participant**: `/conference-mobile`
- **Direct Analytics**: `/audience-analytics` (for testing)

### Data Flow
1. WebRTC captures audio/video
2. Hume AI analyzes voice for emotions
3. ML5 tracks facial expressions
4. Firebase Firestore syncs between devices
5. React updates UI in real-time

### Key Components
- `ConferenceSetup.tsx` - Room management
- `AudienceAnalyticsDashboard.tsx` - Analytics display
- `HumeVoiceService.ts` - Emotion detection
- `PresenceAvatar.tsx` - 3D avatar rendering

## Tips for Best Results

1. **Good Lighting**: Ensure faces are well-lit for ML5 tracking
2. **Clear Audio**: Speak clearly for better emotion detection
3. **Natural Interaction**: Encourage genuine conversation
4. **Active Coaching**: Have audience participate with suggestions
5. **Show Chemistry**: Demonstrate moments of connection

## Next Steps
After the demo, explain how this technology can:
- Train better daters through real-time feedback
- Help shy participants gain confidence
- Create more meaningful connections
- Scale to virtual speed dating events
- Integrate with AR/VR experiences

---

**Questions?** The system is designed to be intuitive and engaging. Let the magic of real-time emotion tracking speak for itself! 🚀
