// Animation configuration for different avatar types
export interface AnimationSet {
  idle: string[];
  talk: string[];
  flirt?: string[];
  laugh?: string[];
  think?: string[];
}

export const AVATAR_ANIMATIONS: Record<string, AnimationSet> = {
  male: {
    idle: [
      '/animations/M_Standing_Idle_001.glb',
      '/animations/M_Standing_Idle_002.glb',
      '/animations/M_Standing_Idle_Variations_001.glb',
      '/animations/M_Standing_Idle_Variations_002.glb',
      '/animations/M_Standing_Idle_Variations_003.glb',
    ],
    talk: [
      '/animations/M_Talking_Variations_001.glb',
      '/animations/M_Talking_Variations_002.glb',
      '/animations/M_Talking_Variations_003.glb',
      '/animations/M_Talking_Variations_004.glb',
      '/animations/M_Talking_Variations_005.glb',
    ]
  },
  female: {
    idle: [
      '/animations/feminine/idle/F_Standing_Idle_001.glb',
      '/animations/feminine/idle/F_Standing_Idle_Variations_001.glb',
      '/animations/feminine/idle/F_Standing_Idle_Variations_002.glb',
      '/animations/feminine/idle/F_Standing_Idle_Variations_003.glb',
      '/animations/feminine/idle/F_Standing_Idle_Variations_004.glb',
      '/animations/feminine/idle/F_Standing_Idle_Variations_005.glb',
      '/animations/feminine/idle/F_Standing_Idle_Variations_006.glb',
      '/animations/feminine/idle/F_Standing_Idle_Variations_007.glb',
      '/animations/feminine/idle/F_Standing_Idle_Variations_008.glb',
      '/animations/feminine/idle/F_Standing_Idle_Variations_009.glb',
    ],
    talk: [
      '/animations/feminine/talk/F_Talking_Variations_001.glb',
      '/animations/feminine/talk/F_Talking_Variations_002.glb',
      '/animations/feminine/talk/F_Talking_Variations_003.glb',
      '/animations/feminine/talk/F_Talking_Variations_004.glb',
      '/animations/feminine/talk/F_Talking_Variations_005.glb',
      '/animations/feminine/talk/F_Talking_Variations_006.glb',
    ]
  },
  neutral: {
    // Fallback to male animations for neutral/undefined types
    idle: [
      '/animations/M_Standing_Idle_001.glb',
      '/animations/M_Standing_Idle_Variations_001.glb',
    ],
    talk: [
      '/animations/M_Talking_Variations_001.glb',
      '/animations/M_Talking_Variations_002.glb',
    ]
  }
};

// Helper function to get random animation from a set
export function getRandomAnimation(type: 'male' | 'female' | 'neutral', category: keyof AnimationSet): string {
  const animations = AVATAR_ANIMATIONS[type][category];
  if (!animations || animations.length === 0) {
    // Fallback to first idle animation if category doesn't exist
    return AVATAR_ANIMATIONS[type].idle[0];
  }
  return animations[Math.floor(Math.random() * animations.length)];
}

// Helper to get animation set for avatar
export function getAnimationsForAvatar(avatarType: 'male' | 'female' | 'neutral' | undefined): AnimationSet {
  return AVATAR_ANIMATIONS[avatarType || 'neutral'];
}
