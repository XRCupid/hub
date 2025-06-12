# XRCupid Conference Demo Setup Guide

## 🎯 Quick Start for Tomorrow's Demo

### Core Demo URLs:
- **Main Conference Demo**: http://localhost:3001/conference-demo
- **NPC Speed Dating**: http://localhost:3001/speed-dating
- **Video Chat Demo**: http://localhost:3001/video-chat

### Environment Setup (Already Complete ✅)
1. **Hume AI Keys**: Update in `.env.local` (see UPDATE_HUME_KEYS.md)
2. **Firebase**: Using mock database for offline demo reliability
3. **Development Server**: Run `npm start` in the hub directory

## 🎪 Conference Booth Setup

### Display Configuration:
1. **Participant Screens** (2 laptops/tablets)
   - Open http://localhost:3001/conference-demo
   - Select "Participant Mode"
   - Enter participant names
   - Create/join rooms for video chat

2. **Audience Display** (Large monitor/projector)
   - Open http://localhost:3001/conference-demo
   - Select "Audience Mode"
   - Toggle between:
     - ✅ Presence Avatars (privacy mode)
     - ✅ Live Video Feeds
   - Shows real-time analytics dashboard

### Features to Showcase:

#### 1. **Presence Avatar System**
- Real-time facial expression mapping
- ML5 face mesh tracking
- Blendshape animations
- Avatar selection catalog
- Privacy-preserving display

#### 2. **Real-Time Analytics Dashboard**
- Emotion analysis
- Body language tracking
- Chemistry scoring
- Conversation flow metrics
- Coaching insights

#### 3. **NPC Speed Dating Demo**
- 3-minute rounds with AI personalities
- 4 unique NPC archetypes
- Chemistry scoring
- Match results summary

## 🎨 Risographic Design Theme
- Vibrant color offsets
- Bold typography with shadows
- Playful card-based layouts
- Animated hover effects
- Modern, approachable aesthetic

## 🚀 Demo Flow Script

### Opening (2 min)
"Welcome to XRCupid - the world's first AI-powered dating coach platform!"

1. Show the conference demo launcher
2. Explain the concept: real participants, virtual coaching
3. Highlight privacy features with presence avatars

### Live Demo (5 min)
1. Two volunteers join as participants
2. They have a natural conversation
3. Audience watches on the big screen:
   - Toggle between avatars and video
   - Point out real-time emotion tracking
   - Show chemistry scores building
   - Highlight coaching insights

### NPC Speed Dating (3 min)
1. Quick transition to /speed-dating
2. Show one 3-minute date with an NPC
3. Demonstrate emotion tracking
4. Show match results

### Closing (1 min)
- Mention upcoming features
- Invite questions
- Share contact/follow-up info

## 🛠️ Troubleshooting

### Common Issues:
1. **Camera not working**: 
   - Check browser permissions
   - Refresh and re-allow camera access

2. **WebRTC connection issues**:
   - Ensure both participants are on same network
   - Use Chrome/Edge for best compatibility

3. **Avatar not displaying**:
   - Check console for Three.js errors
   - Refresh the audience view

### Backup Plans:
- Pre-recorded demo video on USB
- Static screenshots of key features
- NPC demo works offline (no WebRTC needed)

## 📱 Mobile Optimization
- Responsive design works on tablets
- Touch-friendly interface
- Reduced animations for performance

## 🎯 Key Talking Points
1. **Privacy First**: Presence avatars protect user identity
2. **Real-Time AI**: Live emotion and body language analysis
3. **Actionable Insights**: Coaching tips during conversations
4. **Fun & Engaging**: Gamified dating practice
5. **Science-Based**: Built on psychology research

## 📊 Metrics to Highlight
- Eye contact percentage
- Emotional engagement score
- Body language openness
- Conversation chemistry
- Real-time coaching effectiveness

## 🔗 Follow-Up Resources
- Demo video link
- Beta signup form
- Technical whitepaper
- Partnership opportunities

---

## Quick Command Reference:
```bash
# Start the demo
cd ~/XRCupid_Clone/hub
npm start

# Open URLs
# Participant 1: http://localhost:3001/conference-demo
# Participant 2: http://localhost:3001/conference-demo
# Audience: http://localhost:3001/conference-demo (Audience Mode)
# NPC Demo: http://localhost:3001/speed-dating
```

## Remember:
- Test all equipment 30 min before booth opens
- Have water and backup laptop ready
- Keep demos short and engaging
- Focus on the "wow" moments
- Collect contact info from interested visitors

Good luck at the conference! 🎉
