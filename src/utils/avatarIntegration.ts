/**
 * Avatar Integration Guide for XRCupid
 * 
 * This file demonstrates how to integrate your Ready Player Me avatar
 * into the dating simulation with full lip sync and expression support.
 */

// Example configuration for using your downloaded avatar
export const AVATAR_CONFIG = {
  // Path to your avatar GLB file (place in public/avatars/)
  avatarPath: '/avatars/your_avatar_name.glb',
  
  // Morph target names for expressions (these are included in RPM avatars)
  expressions: {
    // Basic emotions
    happy: ['mouthSmile', 'eyeSquintLeft', 'eyeSquintRight'],
    sad: ['mouthFrownLeft', 'mouthFrownRight', 'browInnerUp'],
    surprised: ['mouthOpen', 'eyeWideLeft', 'eyeWideRight', 'browOuterUpLeft', 'browOuterUpRight'],
    angry: ['browDownLeft', 'browDownRight', 'mouthFrownLeft', 'mouthFrownRight'],
    
    // Eye movements
    blink: ['eyeBlinkLeft', 'eyeBlinkRight'],
    wink: ['eyeBlinkLeft'],
    
    // Mouth shapes for speech (visemes)
    visemes: {
      'aa': ['viseme_aa'],
      'E': ['viseme_E'],
      'I': ['viseme_I'],
      'O': ['viseme_O'],
      'U': ['viseme_U'],
      'CH': ['viseme_CH'],
      'DD': ['viseme_DD'],
      'FF': ['viseme_FF'],
      'kk': ['viseme_kk'],
      'nn': ['viseme_nn'],
      'PP': ['viseme_PP'],
      'RR': ['viseme_RR'],
      'sil': ['viseme_sil'],
      'SS': ['viseme_SS'],
      'TH': ['viseme_TH']
    }
  }
};

// Example: How to use your avatar in a component
export const exampleUsage = `
import { Canvas } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useEffect, useRef } from 'react';

function MyAvatar({ avatarUrl, currentViseme, expression }) {
  const { scene } = useGLTF(avatarUrl);
  const mixer = useRef();
  
  useEffect(() => {
    // Apply expression blend shapes
    scene.traverse((child) => {
      if (child.morphTargetDictionary && child.morphTargetInfluences) {
        // Reset all morph targets
        Object.keys(child.morphTargetDictionary).forEach(key => {
          const index = child.morphTargetDictionary[key];
          child.morphTargetInfluences[index] = 0;
        });
        
        // Apply current viseme for lip sync
        if (currentViseme && child.morphTargetDictionary[currentViseme]) {
          const index = child.morphTargetDictionary[currentViseme];
          child.morphTargetInfluences[index] = 1;
        }
        
        // Apply expression
        if (expression && AVATAR_CONFIG.expressions[expression]) {
          AVATAR_CONFIG.expressions[expression].forEach(morphName => {
            if (child.morphTargetDictionary[morphName]) {
              const index = child.morphTargetDictionary[morphName];
              child.morphTargetInfluences[index] = 0.7;
            }
          });
        }
      }
    });
  }, [scene, currentViseme, expression]);
  
  return <primitive object={scene} />;
}

// Usage in your dating simulation
<Canvas>
  <ambientLight intensity={0.5} />
  <directionalLight position={[5, 5, 5]} />
  <MyAvatar 
    avatarUrl="/avatars/my_rpm_avatar.glb"
    currentViseme={currentViseme}
    expression={currentEmotion}
  />
</Canvas>
`;

// Step-by-step integration process
export const INTEGRATION_STEPS = [
  {
    step: 1,
    title: "Create Your Avatar",
    description: "Use the Avatar Manager's 'Create Avatar' tab to design your avatar",
    action: "The iframe will give you an avatar URL when done"
  },
  {
    step: 2,
    title: "Download with Parameters",
    description: "The Avatar Manager automatically converts your URL to include all necessary parameters",
    action: "Click 'Download Avatar GLB' to get the file"
  },
  {
    step: 3,
    title: "Place in Project",
    description: "Save the GLB file to your project's public/avatars/ directory",
    action: "Create the directory if it doesn't exist: mkdir public/avatars"
  },
  {
    step: 4,
    title: "Update Configuration",
    description: "In your dating simulation components, update the avatar path",
    example: `
// In DatingSimulationMaster.tsx or similar
const avatarConfig = {
  url: '/avatars/my_custom_avatar.glb', // Your downloaded avatar
  // ... other config
};
`
  },
  {
    step: 5,
    title: "Test Lip Sync",
    description: "The avatar will automatically sync lips with Hume AI speech",
    features: [
      "Visemes mapped to phonemes",
      "Smooth transitions between mouth shapes",
      "Natural blinking and micro-expressions"
    ]
  }
];

// Troubleshooting common issues
export const TROUBLESHOOTING = {
  "Avatar not loading": [
    "Ensure the file is in public/avatars/",
    "Check the file path (should start with /avatars/)",
    "Verify the GLB file isn't corrupted"
  ],
  "No lip sync": [
    "Confirm the URL included morphTargets=ARKit,Oculus+Visemes",
    "Check that viseme morph targets exist in the model",
    "Ensure Hume AI is sending viseme events"
  ],
  "Expressions not working": [
    "Verify ARKit blend shapes are included",
    "Check morph target names match the expected format",
    "Ensure morphTargetInfluences are being set correctly"
  ]
};
