import React, { useState, useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';


import { useLipsync } from '../hooks/useLipsync';

const PHONEME_TO_BLENDSHAPE: Record<string, string> = {
  "AA": "jawOpen",
  "AE": "jawOpen",
  "AH": "jawOpen",
  "AO": "jawOpen",
  "EH": "mouthSmileLeft",
  "ER": "mouthSmileRight",
  "EY": "mouthSmileLeft",
  "IH": "mouthSmileRight",
  "IY": "mouthSmileLeft",
  "OW": "mouthFunnel",
  "UH": "mouthFunnel",
  "UW": "mouthFunnel",
  "B": "mouthPressLeft",
  "CH": "mouthPressRight",
  "D": "mouthPressLeft",
  "F": "mouthStretchLeft",
  "G": "mouthPressRight",
  "JH": "mouthPressLeft",
  "K": "mouthPressRight",
  "L": "mouthDimpleLeft",
  "M": "mouthPressLeft",
  "N": "mouthPressRight",
  "P": "mouthPressLeft",
  "R": "mouthDimpleRight",
  "S": "mouthStretchRight",
  "SH": "mouthStretchRight",
  "T": "mouthPressRight",
  "TH": "mouthStretchLeft",
  "V": "mouthStretchRight",
  "Z": "mouthStretchLeft",
  "ZH": "mouthStretchRight"
};

const GLBModelWithBlendshapes = ({ url, audioUrl, blendShapes, position = [0, -1.1, 0], rotation = [0, 0, 0], scale = [1.4, 1.4, 1.4] }: any) => {
  const gltf: any = useGLTF(url);
  const scene = gltf.scene;
  const groupRef = useRef<any>(null);

  // DEBUG: Log all morph target names for each mesh
  useEffect(() => {
    if (!scene) return;
    scene.traverse((child: any) => {
      if (child.isMesh && child.morphTargetDictionary) {
        console.log('Mesh:', child.name, 'Morph Targets:', Object.keys(child.morphTargetDictionary));
      }
    });
  }, [scene]);

  // Lipsync state
  const [currentPhoneme, setCurrentPhoneme] = useState<string | null>(null);
  useLipsync(audioUrl, setCurrentPhoneme);

  // Scale factor for blendshapes to prevent exaggerated expressions on non-RPM avatars
  const BLENDSHAPE_SCALE = 0.1;

  useEffect(() => {
    if (!scene) return;
    scene.traverse((child: any) => {
      if (child.isMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
        const dict = child.morphTargetDictionary;
        const influences = child.morphTargetInfluences;
        // Zero all influences
        Object.keys(dict).forEach(name => {
          influences[dict[name]] = 0;
        });
        // 1. Always apply blendShapes (including blinks) first
        if (blendShapes) {
          Object.entries(blendShapes).forEach(([name, value]) => {
            if (dict[name] !== undefined) {
              const scaled = Math.max(0, Math.min(1, (value as number) * BLENDSHAPE_SCALE));
              influences[dict[name]] = scaled;
            }
          });
        }
        // 2. If lipsync is active, boost the phoneme blendshape (especially jawOpen) for wider mouth opening
        if (currentPhoneme) {
          const blendshape = PHONEME_TO_BLENDSHAPE[currentPhoneme];
          if (blendshape && dict[blendshape] !== undefined) {
            // Only boost if not a blink
            if (blendshape !== 'eyeBlinkLeft' && blendshape !== 'eyeBlinkRight') {
              // Use a higher scale for jawOpen and mouth-related phonemes
              const phonemeScale = (blendshape === 'jawOpen') ? 0.85 : 0.55;
              influences[dict[blendshape]] = Math.max(influences[dict[blendshape]], phonemeScale);
            }
          }
        }
      }
    });
  }, [scene, currentPhoneme, blendShapes]);

  return (
    // @ts-ignore: 'primitive' is provided by @react-three/fiber
    // @ts-ignore
    <primitive
      ref={groupRef}
      object={scene}
      scale={scale}
      position={position}
      rotation={rotation}
    />
  );
};

export default GLBModelWithBlendshapes;
