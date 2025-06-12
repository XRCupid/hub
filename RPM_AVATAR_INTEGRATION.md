# RPM Avatar Integration for XRCupid

## Overview

This document outlines the integration of Ready Player Me (RPM) avatars into the XRCupid dating skills platform, enhancing the video chat and simulation experiences with realistic 3D avatars.

## Components Added

### 1. RPMAvatar Component (`src/components/RPMAvatar.tsx`)

**Purpose**: Renders 3D RPM avatars with emotion mapping and animation support.

**Key Features**:
- Loads RPM avatar models using GLTFLoader
- Maps Hume AI emotions to RPM blendshapes for realistic expressions
- Supports real-time emotion updates during conversations
- Optimized rendering with Three.js and React Three Fiber

**Usage**:
```tsx
<RPMAvatar
  avatarUrl="https://models.readyplayer.me/avatar-id.glb"
  emotions={{
    joy: 0.8,
    surprise: 0.3,
    concentration: 0.2
  }}
  isAnimating={true}
  className="video-avatar"
/>
```

### 2. RPMAvatarGenerator Component (`src/components/RPMAvatarGenerator.tsx`)

**Purpose**: Provides avatar selection and generation interface for users.

**Key Features**:
- Preset avatar gallery with diverse options
- Custom avatar URL input
- Integration with Ready Player Me avatar creation
- Preview functionality for selected avatars

**Usage**:
```tsx
<RPMAvatarGenerator
  onAvatarSelect={(avatarUrl) => setSelectedAvatar(avatarUrl)}
  selectedAvatar={currentAvatar}
/>
```

### 3. RPMVideoCall Component (`src/components/RPMVideoCall.tsx`)

**Purpose**: Enhanced video call interface with RPM avatar integration.

**Key Features**:
- Real-time emotion mapping from Hume AI to RPM avatars
- Video call simulation with realistic avatar expressions
- Performance analytics and engagement metrics
- Scenario-based conversation tips and guidance

**Usage**:
```tsx
<RPMVideoCall
  npcProfile={{
    id: 'alex',
    name: 'Alex',
    avatarUrl: 'https://models.readyplayer.me/avatar-id.glb',
    personality: {
      traits: ['intellectual', 'thoughtful'],
      responseStyle: 'intellectual'
    }
  }}
  scenario="video-date"
  onCallEnd={() => handleCallEnd()}
/>
```

## Integration Points

### Dating Simulation Flow

The RPM avatars are integrated throughout the dating simulation experience:

1. **Profile Display**: Each NPC profile includes an `avatarUrl` field
2. **Chat Interface**: Avatar thumbnails enhance the messaging experience
3. **Video Calls**: Full 3D avatar rendering with emotion mapping during video dates

### Emotion Mapping

The system maps Hume AI emotion scores to RPM blendshapes:

```typescript
// Hume emotions → RPM blendshapes
const emotionMapping = {
  joy: ['mouthSmile_L', 'mouthSmile_R', 'cheekSquint_L', 'cheekSquint_R'],
  sadness: ['mouthFrown_L', 'mouthFrown_R', 'browInnerUp'],
  anger: ['browDown_L', 'browDown_R', 'mouthPress_L', 'mouthPress_R'],
  // ... additional mappings
};
```

## Technical Architecture

### Dependencies

- `@react-three/fiber`: React renderer for Three.js
- `@react-three/drei`: Useful helpers for React Three Fiber
- `three`: 3D graphics library
- `@humeai/voice-react`: Emotion AI integration

### Performance Considerations

1. **Model Optimization**: RPM avatars are optimized for web delivery
2. **Emotion Caching**: Emotion states are cached to reduce computation
3. **Lazy Loading**: Avatars load on-demand to improve initial page load
4. **Memory Management**: Proper cleanup of Three.js resources

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
REACT_APP_HUME_API_KEY=your_hume_api_key
REACT_APP_HUME_HOSTNAME=api.hume.ai
```

### Avatar URLs

RPM avatar URLs follow this format:
```
https://models.readyplayer.me/{avatar-id}.glb
```

## Usage Examples

### Basic Avatar Display

```tsx
import RPMAvatar from './components/RPMAvatar';

function ProfileCard({ profile }) {
  return (
    <div className="profile-card">
      <RPMAvatar
        avatarUrl={profile.avatarUrl}
        emotions={{ neutral: 0.5, joy: 0.3 }}
        isAnimating={false}
      />
      <h3>{profile.name}</h3>
    </div>
  );
}
```

### Video Call with Emotions

```tsx
import { useVoice } from '@humeai/voice-react';
import RPMVideoCall from './components/RPMVideoCall';

function VideoDatePage({ npcProfile }) {
  const handleCallEnd = () => {
    // Handle call completion
    console.log('Video call ended');
  };

  return (
    <RPMVideoCall
      npcProfile={npcProfile}
      scenario="video-date"
      onCallEnd={handleCallEnd}
    />
  );
}
```

## Customization

### Adding New Emotions

To add new emotion mappings:

1. Update the `EMOTION_BLENDSHAPE_MAP` in `RPMAvatar.tsx`
2. Add corresponding emotion handling in `RPMVideoCall.tsx`
3. Test with various RPM avatar models

### Styling Avatars

Avatars can be styled using CSS classes:

```css
.video-avatar {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.profile-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
}
```

## Troubleshooting

### Common Issues

1. **Avatar Not Loading**
   - Verify the avatar URL is accessible
   - Check CORS settings for the avatar host
   - Ensure the GLB file is valid

2. **Emotions Not Updating**
   - Verify Hume AI connection
   - Check emotion mapping configuration
   - Ensure avatar has the required blendshapes

3. **Performance Issues**
   - Reduce avatar polygon count
   - Limit simultaneous avatar instances
   - Use lower quality settings for mobile

### Debug Mode

Enable debug logging:

```typescript
// In RPMAvatar.tsx
const DEBUG_EMOTIONS = process.env.NODE_ENV === 'development';

if (DEBUG_EMOTIONS) {
  console.log('Emotion update:', emotions);
}
```

## Future Enhancements

1. **Custom Avatar Creation**: Direct integration with RPM avatar builder
2. **Gesture Mapping**: Map hand gestures to avatar animations
3. **Lip Sync**: Synchronize avatar mouth movements with speech
4. **Outfit Customization**: Dynamic clothing and accessory changes
5. **Environment Integration**: Contextual backgrounds and lighting

## Support

For issues related to RPM avatar integration:

1. Check the browser console for Three.js errors
2. Verify network connectivity to RPM servers
3. Test with different avatar models
4. Review Hume AI emotion data format

This integration transforms XRCupid into a more immersive and engaging dating skills platform, providing users with realistic practice scenarios that closely mirror real-world video dating experiences.
