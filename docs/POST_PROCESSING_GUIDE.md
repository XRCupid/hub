# Three.js Post-Processing Guide for XRCupid Avatars

## Overview

This guide covers lightweight post-processing effects that enhance the visual appeal of avatars while maintaining performance. The effects are designed to complement a risograph aesthetic with retro, printed media vibes.

## Available Post-Processing Styles

### 1. Lightweight Post-Processing
Best for performance while still adding visual flair:
- **Bloom**: Soft glow on bright areas
- **Chromatic Aberration**: Subtle color fringing for retro feel
- **Film Grain**: Adds texture and warmth
- **Vignette**: Darkens edges for focus
- **SMAA**: Anti-aliasing for smooth edges

### 2. Risograph Style Processing
More intensive but creates unique printed aesthetic:
- **Color Separation**: Mimics CMYK printing misalignment
- **Halftone Patterns**: Dot-based shading
- **Limited Color Palette**: Reduces to risograph ink colors
- **Paper Texture**: Adds subtle paper grain
- **Ink Bleeding**: Simulates ink spread

### 3. Custom Shader Materials
For per-avatar stylization:
- **Toon Shading**: Cell-shaded look with stepped lighting
- **Rim Lighting**: Glowing edges for emphasis
- **Posterization**: Reduces color gradients
- **Outline Effects**: Black outlines for comic style

## Integration Examples

### Basic Setup with Lightweight Effects

```tsx
import { Canvas } from '@react-three/fiber';
import { PresenceAvatar } from './components/PresenceAvatar';
import { LightweightPostProcessing } from './components/LightweightPostProcessing';

function App() {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} />
      
      <PresenceAvatar avatarUrl="/avatars/coach_grace.glb" />
      
      {/* Add post-processing */}
      <LightweightPostProcessing quality="medium" />
    </Canvas>
  );
}
```

### Advanced Risograph Style

```tsx
import { RisographPostProcessing } from './components/RisographPostProcessing';

// In your Canvas:
<RisographPostProcessing 
  intensity={0.7}
  preset="intense"
/>
```

### Custom Material on Avatar

```tsx
import { RisographMaterial } from './materials/RisographMaterial';

// In your avatar component:
<mesh>
  <RisographMaterial
    texture={avatarTexture}
    colorA="#FF6B6B"  // Pink
    colorB="#4ECDC4"  // Teal
    colorC="#FFE66D"  // Yellow
    posterize={4}
    halftoneScale={100}
  />
</mesh>
```

## Performance Optimization Tips

1. **Quality Presets**: Use 'low' for mobile, 'medium' for desktop, 'high' for powerful GPUs
2. **Selective Effects**: Enable only needed effects
3. **Resolution**: Lower effect resolution for better performance
4. **Multisampling**: Disable when using post-processing (set to 0)

## Visual Combinations

### Dating App Romantic Look
```tsx
<LightweightPostProcessing quality="medium" />
// + Warm lighting colors
// + Soft bloom intensity
// + Minimal chromatic aberration
```

### Retro Gaming Style
```tsx
<RisographPostProcessing intensity={0.8} preset="intense" />
// + High posterization
// + Strong halftone patterns
// + Vibrant rim lighting
```

### Professional Coach Look
```tsx
<LightweightPostProcessing quality="high" />
// + Subtle vignette
// + Clean SMAA anti-aliasing
// + Minimal grain
```

## Color Palettes

### Risograph Ink Colors
- Fluorescent Pink: `#FF6B6B`
- Blue: `#4ECDC4`
- Yellow: `#FFE66D`
- Green: `#95E1D3`
- Orange: `#FFA502`
- Black: `#1A1A1A`

### Romantic Gradients
- Sunset: `#FF6B6B` → `#FFE66D`
- Ocean: `#4ECDC4` → `#95E1D3`
- Twilight: `#C44569` → `#3C1053`

## Troubleshooting

### Performance Issues
- Reduce effect quality
- Disable SMAA
- Lower bloom kernel size
- Reduce shadow map size

### Visual Artifacts
- Check texture filtering
- Adjust chromatic aberration offset
- Tweak noise opacity
- Verify proper gamma correction

### Mobile Compatibility
- Use 'low' quality preset
- Disable shadows
- Reduce canvas resolution
- Limit to 2-3 effects maximum

## Advanced Techniques

### Dynamic Effect Intensity
```tsx
// Adjust effects based on user interaction
const [intensity, setIntensity] = useState(0.5);

// Increase on hover
<mesh onPointerOver={() => setIntensity(0.8)}>
```

### Time-based Effects
```tsx
// Animate post-processing over time
useFrame((state) => {
  postProcessRef.current.intensity = 
    Math.sin(state.clock.elapsedTime) * 0.5 + 0.5;
});
```

### Conditional Effects
```tsx
// Enable effects based on context
{isRomanticMode && <RisographPostProcessing />}
{isProfessionalMode && <LightweightPostProcessing />}
```

## Best Practices

1. **Test on Target Devices**: Effects look different on various screens
2. **User Preferences**: Allow users to disable effects
3. **Consistent Style**: Match post-processing to overall app aesthetic
4. **Progressive Enhancement**: Start simple, add effects as needed
5. **Monitor Performance**: Use Chrome DevTools to check frame rate

## Future Enhancements

- **AI-Driven Effects**: Adjust based on conversation mood
- **Seasonal Themes**: Holiday-specific color palettes
- **User Customization**: Let users pick their preferred style
- **AR Mode Effects**: Lighter effects for AR experiences
