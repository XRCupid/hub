# PiP Camera Configuration - Source of Truth

## Overview
This document contains the optimal camera configuration values for the Picture-in-Picture (PiP) avatar display in the Dougie Speed Date Demo V3. These values were determined through manual testing to achieve perfect face framing and user experience.

## Optimal Camera Values

### Camera Position
```javascript
cameraPosition: [0.70, 1.70, 1.80]
```
- **X (0.70)**: Slightly offset to the right for natural angle
- **Y (1.70)**: Eye-level positioning for natural face-to-face interaction
- **Z (1.80)**: Close proximity for intimate portrait framing

### Field of View
```javascript
cameraFOV: 25
```
- **25 degrees**: Tight portrait zoom that focuses on face and upper shoulders
- Creates intimate, personal viewing experience
- Eliminates unnecessary background space

### Camera Target (Look-At Point)
```javascript
cameraTarget: [0, 2.10, 0]
```
- **X (0)**: Centered horizontally on avatar
- **Y (2.10)**: Slightly above eye level for flattering angle
- **Z (0)**: Direct forward gaze

## Configuration Implementation

### Default State Values
```javascript
const [pipCameraX] = useState(0.70);
const [pipCameraY] = useState(1.70); 
const [pipCameraZ] = useState(1.80);
const [pipCameraFOV] = useState(25);
const [pipTargetX] = useState(0);
const [pipTargetY] = useState(2.10);
const [pipTargetZ] = useState(0);
```

### Component Props
```javascript
<UserAvatarPiP
  avatarUrl="/avatars/user_avatar.glb"
  position="bottom-right"  // Valid corner position (not "fixed")
  size={pipSize as 'small' | 'medium' | 'large'}
  trackingData={null}
  enableOwnTracking={true}
  onClose={() => setShowPiP(false)}
  cameraPosition={[pipCameraX, pipCameraY, pipCameraZ]}
  cameraFOV={pipCameraFOV}
  cameraTarget={[pipTargetX, pipTargetY, pipTargetZ]}
  disableAutoCamera={true} // Always use manual camera for consistent framing
/>
```

### Container Styling
```javascript
// PiP container positioned in bottom-right corner
<div style={{ 
  position: 'absolute', 
  bottom: '20px', 
  right: '20px', 
  zIndex: 1000
}}>
```

### PiP Header Styling
```javascript
// Clean header with dark background
<div className="pip-header" style={{
  background: 'rgba(0,0,0,0.8)',
  padding: '8px',
  borderRadius: '8px 8px 0 0',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}}>
```

## Design Rationale

### Why These Values Work
1. **Portrait Framing**: The tight FOV (25°) creates a portrait-style view that focuses attention on the avatar's face
2. **Natural Eye Level**: Y position (1.70) places camera at natural eye level for comfortable interaction
3. **Intimate Distance**: Z position (1.80) provides close but not uncomfortably close viewing distance
4. **Flattering Angle**: Target Y (2.10) creates a slightly upward gaze that's flattering and engaging

### Visual Results
- Clean face framing without competing visual elements
- Consistent positioning that doesn't change based on posture
- Professional portrait-style appearance
- Optimal for face-to-face conversation simulation

## Technical Implementation Notes

### Position Prop Values
The `position` prop accepts only specific corner values:
- `"bottom-right"` 
- `"bottom-left"`
- `"top-right"`
- `"top-left"`

**Note**: Do NOT use `"fixed"` - it will cause a TypeScript error.

### TypeScript Considerations
When using TypeScript, ensure that the `position` prop is typed correctly to avoid errors. For example:
```typescript
interface UserAvatarPiPProps {
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  // ... other props
}
```
### Manual Camera Controller
- Uses `ManualCameraController` component to actively set camera position
- Overrides React Three Fiber's default camera behavior
- Disables automatic camera pitch adjustment from `CameraController`

### Frame Styling
- **Border Radius**: 12px (not 50% to avoid competing circular frames)
- **Border**: Purple theme color
- **Background**: Dark for contrast
- **Size**: Medium default for optimal visibility

## Troubleshooting

### If Camera Values Don't Apply
1. Ensure `disableAutoCamera={true}` is set
2. Verify `ManualCameraController` is rendering when manual controls are active
3. Check console for camera position updates: `[ManualCameraController] Setting camera position`

### If Framing Looks Off
1. Verify avatar scale and position in 3D scene
2. Check that avatar model is properly centered
3. Ensure no other camera controllers are interfering

## Version History

### v1.0 (2025-01-17)
- Initial optimal camera values determined through manual testing
- Values: Position(0.70, 1.70, 1.80), FOV(25), Target(0, 2.10, 0)
- Provides perfect face framing for speed dating demo

## Future Considerations

### Potential Enhancements
- **Adaptive sizing**: Different camera values for different PiP sizes (small/medium/large)
- **Avatar-specific tuning**: Slight adjustments based on different avatar models
- **User preferences**: Optional user customization of framing preferences

### Maintenance
- Test these values whenever avatar models are updated
- Verify compatibility with new React Three Fiber versions
- Monitor user feedback on framing quality

---

**Last Updated**: January 17, 2025  
**Tested With**: Dougie Speed Date Demo V3  
**Avatar Model**: `/avatars/user_avatar.glb`  
**Framework**: React Three Fiber + Drei
