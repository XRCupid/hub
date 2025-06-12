# Conference Demo - Quick Fix & Run Guide 🔧

## Fixed Firebase Issue ✅
The Firebase error has been resolved. The app now uses the mock Firebase database for room management during local development.

## Start the Demo in 3 Steps

### 1. Start the Application
```bash
cd /Users/douglasgoldstein/XRCupid_Clone/hub
npm start
```

### 2. Open Two Browser Windows

**Window 1 - Host Computer (with webcam):**
- Go to: `http://localhost:3000/conference`
- Enter your name (optional)
- Click "Create New Room"
- Copy the 6-character room code shown

**Window 2 - Mobile Simulation:**
- Go to: `http://localhost:3000/conference-mobile`
- Enter the room code from Window 1
- Enter a name (optional)
- Click "Join Room with Camera"

### 3. Analytics Dashboard Appears! 🎉
Once connected, Window 1 automatically switches to show:
- Both video feeds with emotion overlays
- Real-time coaching advice
- Chemistry scoring
- Presence avatars (toggle button)

## What Was Fixed
- Replaced Firestore with Firebase Realtime Database mock
- Fixed TypeScript type issues
- Added proper video stream handling
- Simplified room creation/joining logic

## Features Working Now
✅ Room creation with simple codes
✅ Multi-device connection
✅ Real-time emotion detection (Hume AI)
✅ Live coaching suggestions
✅ Chemistry scoring
✅ Presence avatar overlays

## Demo Tips
- Allow camera/microphone permissions
- Speak naturally to see emotions update
- Watch coaching advice appear in real-time
- Show how chemistry score increases with positive emotions
- Toggle presence avatars for privacy demo

The system is now ready for your conference demo!
