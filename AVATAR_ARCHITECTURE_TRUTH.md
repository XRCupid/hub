# XRCupid Avatar Architecture - Source of Truth

## 🚨 CRITICAL DEFINITIONS - NEVER VIOLATE THESE

### PresenceAvatar Component
**THE PRESENCEAVATAR IS THE TRACKED EMBODIMENT OF THE USER**
- It represents the USER, not the coach
- It tracks the USER's facial expressions and emotions
- It is the USER's visual representation in the conversation

### Picture-in-Picture (PiP) Architecture

#### What Goes in PiP:
- **USER'S PresenceAvatar** - This is the SOURCE OF TRUTH for the user's presence
- Located in pink circular frame (top-right corner)
- Shows the USER's avatar with real-time face tracking
- MUST ALWAYS BE VISIBLE during active sessions
- Uses UserAvatarPiP component which internally renders PresenceAvatar

#### What Goes in Main View:
- **COACH's PresenceAvatar** - This is the coach/AI partner
- Located in center of screen with venue background
- Shows the coach's avatar with voice-driven animations
- Responds to Hume voice synthesis with mouth movements

### Visual Layout (GOLDEN STANDARD)

```
+----------------------------------+
|                                  |
|                         [USER]   |  <- Pink circle PiP
|                         Avatar   |     (PresenceAvatar tracking USER)
|                           O      |
|                                  |
|        +----------------+        |
|        |                |        |
|        |  COACH Avatar  |        |  <- Main view 
|        | (PresenceAvatar|        |     (Coach's avatar)
|        |  with voice)   |        |
|        +----------------+        |
|                                  |
+----------------------------------+
```

### Component Usage

#### UserAvatarPiP (PiP Component)
```tsx
<UserAvatarPiP 
  avatarUrl="/avatars/user_avatar.glb"  // USER's avatar file
  position="top-right"
  size="medium"
/>
```
- This component INTERNALLY uses PresenceAvatar
- It adds face tracking capabilities
- It creates the pink circular frame
- It represents the USER, not the coach

#### Coach PresenceAvatar (Main View)
```tsx
<PresenceAvatar
  avatarUrl={coach.avatar}  // COACH's avatar file
  audioData={audioData}      // Voice-driven animation
  isSpeaking={isSpeaking}
  currentEmotion={currentEmotion}
/>
```
- This is the COACH's avatar
- Animated by Hume voice synthesis
- Shows coach's emotions and speech

### CSS Classes

#### .pip-avatar (User's PiP)
```css
.pip-avatar {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 200px !important;
  height: 200px !important;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #ff69b4;  /* Pink border */
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  z-index: 100;
  background: rgba(255, 105, 180, 0.3);
}
```

#### .coach-avatar-scene (Coach's Main View)
```css
.coach-avatar-scene {
  width: 100%;
  height: 100%;
  background-image: url(coach.venueBackground);
  background-size: cover;
  background-position: center;
}
```

## ❌ COMMON MISTAKES TO AVOID

1. **NEVER** put the coach avatar in the PiP
2. **NEVER** remove the user's PiP avatar
3. **NEVER** confuse which PresenceAvatar represents whom
4. **NEVER** use PresenceAvatar directly for the user's PiP (use UserAvatarPiP)
5. **NEVER** forget that PresenceAvatar in PiP = USER, PresenceAvatar in main = COACH

## ✅ REMEMBER

- **PiP = USER'S tracked avatar** (via UserAvatarPiP component)
- **Main View = COACH's voice-animated avatar** (direct PresenceAvatar)
- Both use the PresenceAvatar component internally, but for DIFFERENT people
- The PiP is the "source of truth" for the user's presence in EVERY conversation

## Implementation Checklist

- [ ] UserAvatarPiP in top-right pink circle = USER
- [ ] PresenceAvatar in main view with venue = COACH
- [ ] Face tracking active in PiP
- [ ] Voice animation active in main view
- [ ] Both avatars visible during connection
- [ ] Proper cleanup on unmount
