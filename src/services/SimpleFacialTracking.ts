import { FacialBlendShapes } from './AvatarMirrorSystem';

export class SimpleFacialTracking {
  private isTracking = false;
  private animationFrame: number | null = null;
  private onUpdateCallback?: (blendShapes: FacialBlendShapes) => void;

  startTracking(onUpdate: (blendShapes: FacialBlendShapes) => void) {
    this.isTracking = true;
    this.onUpdateCallback = onUpdate;
    this.animate();
  }

  stopTracking() {
    this.isTracking = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  private animate = () => {
    if (!this.isTracking) return;

    // Generate realistic facial expressions
    const time = Date.now() / 1000;
    
    // Natural blinking pattern
    const blinkCycle = Math.sin(time * 0.5) + Math.sin(time * 3);
    const shouldBlink = blinkCycle > 1.8;
    
    // Subtle smile variations
    const smileBase = 0.3;
    const smileVariation = Math.sin(time * 0.3) * 0.2;
    
    // Eyebrow movements
    const browMovement = Math.sin(time * 0.2) * 0.1;
    
    // Jaw movement (simulating speech)
    const jawBase = Math.abs(Math.sin(time * 4)) * 0.2;
    const jawVariation = Math.random() * 0.1;

    const blendShapes: FacialBlendShapes = {
      // Eyes
      eyeBlinkLeft: shouldBlink ? 1 : 0,
      eyeBlinkRight: shouldBlink ? 1 : 0,
      eyeLookDownLeft: 0,
      eyeLookDownRight: 0,
      eyeLookInLeft: 0,
      eyeLookInRight: 0,
      eyeLookOutLeft: 0,
      eyeLookOutRight: 0,
      eyeLookUpLeft: 0,
      eyeLookUpRight: 0,
      eyeSquintLeft: 0,
      eyeSquintRight: 0,
      eyeWideLeft: 0,
      eyeWideRight: 0,
      
      // Brows
      browDownLeft: Math.max(0, -browMovement),
      browDownRight: Math.max(0, -browMovement),
      browInnerUp: Math.max(0, browMovement),
      browOuterUpLeft: Math.max(0, browMovement * 0.5),
      browOuterUpRight: Math.max(0, browMovement * 0.5),
      
      // Mouth
      mouthSmileLeft: smileBase + smileVariation,
      mouthSmileRight: smileBase + smileVariation,
      mouthFrownLeft: 0,
      mouthFrownRight: 0,
      mouthOpen: jawBase + jawVariation,
      jawOpen: jawBase + jawVariation,
      mouthPucker: 0,
      mouthLeft: 0,
      mouthRight: 0,
      mouthRollLower: 0,
      mouthRollUpper: 0,
      mouthShrugLower: 0,
      mouthShrugUpper: 0,
      
      // Cheeks and nose
      cheekPuff: 0,
      cheekSquintLeft: smileBase * 0.3,
      cheekSquintRight: smileBase * 0.3,
      noseSneerLeft: 0,
      noseSneerRight: 0
    };

    if (this.onUpdateCallback) {
      this.onUpdateCallback(blendShapes);
    }

    this.animationFrame = requestAnimationFrame(this.animate);
  };
}

export const simpleFacialTracking = new SimpleFacialTracking();
