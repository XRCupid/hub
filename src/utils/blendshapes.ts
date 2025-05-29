// Standard ARKit blendshape keys
export const BLENDSHAPE_KEYS = [
  // Eyes
  'eyeBlinkLeft',
  'eyeBlinkRight',
  'eyeLookDownLeft',
  'eyeLookDownRight',
  'eyeLookInLeft',
  'eyeLookInRight',
  'eyeLookOutLeft',
  'eyeLookOutRight',
  'eyeLookUpLeft',
  'eyeLookUpRight',
  'eyeSquintLeft',
  'eyeSquintRight',
  'eyeWideLeft',
  'eyeWideRight',
  
  // Jaw and mouth
  'jawOpen',
  'jawForward',
  'jawLeft',
  'jawRight',
  'mouthClose',
  'mouthFunnel',
  'mouthPucker',
  'mouthLeft',
  'mouthRight',
  'mouthSmileLeft',
  'mouthSmileRight',
  'mouthFrownLeft',
  'mouthFrownRight',
  'mouthDimpleLeft',
  'mouthDimpleRight',
  'mouthStretchLeft',
  'mouthStretchRight',
  'mouthRollLower',
  'mouthRollUpper',
  'mouthShrugLower',
  'mouthShrugUpper',
  'mouthPressLeft',
  'mouthPressRight',
  'mouthLowerDownLeft',
  'mouthLowerDownRight',
  'mouthUpperUpLeft',
  'mouthUpperUpRight',
  
  // Brows
  'browDownLeft',
  'browDownRight',
  'browInnerUp',
  'browOuterUpLeft',
  'browOuterUpRight',
  
  // Cheeks and other
  'cheekPuff',
  'cheekSquintLeft',
  'cheekSquintRight',
  'noseSneerLeft',
  'noseSneerRight',
  'tongueOut'
] as const;

export type BlendshapeKey = typeof BLENDSHAPE_KEYS[number];

export interface BlendshapeMap {
  [key: string]: number;
}

export const DEFAULT_BLENDSHAPES: Record<BlendshapeKey, number> = {
  // Eyes
  eyeBlinkLeft: 0,
  eyeBlinkRight: 0,
  eyeLookDownLeft: 0,
  eyeLookDownRight: 0,
  eyeLookInLeft: 0.2,
  eyeLookInRight: 0.2,
  eyeLookOutLeft: 0,
  eyeLookOutRight: 0,
  eyeLookUpLeft: 0,
  eyeLookUpRight: 0,
  eyeSquintLeft: 0,
  eyeSquintRight: 0,
  eyeWideLeft: 0,
  eyeWideRight: 0,
  
  // Jaw and mouth
  jawOpen: 0.1,
  jawForward: 0,
  jawLeft: 0,
  jawRight: 0,
  mouthClose: 0.8,
  mouthFunnel: 0,
  mouthPucker: 0,
  mouthLeft: 0,
  mouthRight: 0,
  mouthSmileLeft: 0.2,
  mouthSmileRight: 0.2,
  mouthFrownLeft: 0,
  mouthFrownRight: 0,
  mouthDimpleLeft: 0.1,
  mouthDimpleRight: 0.1,
  mouthStretchLeft: 0,
  mouthStretchRight: 0,
  mouthRollLower: 0,
  mouthRollUpper: 0,
  mouthShrugLower: 0,
  mouthShrugUpper: 0,
  mouthPressLeft: 0,
  mouthPressRight: 0,
  mouthLowerDownLeft: 0,
  mouthLowerDownRight: 0,
  mouthUpperUpLeft: 0,
  mouthUpperUpRight: 0,
  
  // Brows
  browDownLeft: 0,
  browDownRight: 0,
  browInnerUp: 0.3,
  browOuterUpLeft: 0,
  browOuterUpRight: 0,
  
  // Cheeks and other
  cheekPuff: 0,
  cheekSquintLeft: 0,
  cheekSquintRight: 0,
  noseSneerLeft: 0,
  noseSneerRight: 0,
  tongueOut: 0
};

export const PHONEME_TO_BLENDSHAPE: Record<string, BlendshapeKey> = {
  // Vowels
  'AA': 'jawOpen', // father
  'AE': 'jawOpen', // cat
  'AH': 'jawOpen', // cut
  'AO': 'jawOpen', // dog
  'AW': 'mouthFunnel', // cow
  'AY': 'jawOpen', // hide
  'EH': 'mouthStretchLeft', // bed
  'ER': 'mouthFunnel', // bird
  'EY': 'mouthSmileLeft', // hey
  'IH': 'mouthStretchLeft', // it
  'IY': 'mouthSmileLeft', // happy
  'OW': 'mouthFunnel', // show
  'OY': 'mouthFunnel', // boy
  'UH': 'jawOpen', // book
  'UW': 'mouthFunnel', // you
  // Consonants
  'B': 'mouthClose',
  'CH': 'mouthPucker',
  'D': 'mouthClose',
  'DH': 'mouthClose',
  'F': 'mouthLowerDownLeft',
  'G': 'jawOpen',
  'HH': 'jawOpen',
  'JH': 'mouthPucker',
  'K': 'jawOpen',
  'L': 'tongueOut',
  'M': 'mouthClose',
  'N': 'mouthClose',
  'NG': 'mouthClose',
  'P': 'mouthClose',
  'R': 'mouthStretchLeft',
  'S': 'mouthStretchLeft',
  'SH': 'mouthPucker',
  'T': 'mouthClose',
  'TH': 'tongueOut',
  'V': 'mouthLowerDownLeft',
  'W': 'mouthFunnel',
  'Y': 'mouthSmileLeft',
  'Z': 'mouthStretchLeft',
  'ZH': 'mouthPucker',
};

export const EMOTION_TO_BLENDSHAPE: Record<string, Partial<Record<BlendshapeKey, number>>> = {
  happy: {
    mouthSmileLeft: 0.7,
    mouthSmileRight: 0.7,
    cheekSquintLeft: 0.5,
    cheekSquintRight: 0.5,
    eyeSquintLeft: 0.3,
    eyeSquintRight: 0.3,
  },
  sad: {
    mouthFrownLeft: 0.6,
    mouthFrownRight: 0.6,
    browInnerUp: 0.5,
    eyeLookDownLeft: 0.3,
    eyeLookDownRight: 0.3,
  },
  surprised: {
    jawOpen: 0.5,
    browInnerUp: 0.7,
    browOuterUpLeft: 0.5,
    browOuterUpRight: 0.5,
    eyeWideLeft: 0.7,
    eyeWideRight: 0.7,
  },
  angry: {
    browDownLeft: 0.7,
    browDownRight: 0.7,
    mouthFrownLeft: 0.5,
    mouthFrownRight: 0.5,
    noseSneerLeft: 0.5,
    noseSneerRight: 0.5,
  },
  neutral: {
    // Neutral expression with slight smile
    mouthSmileLeft: 0.2,
    mouthSmileRight: 0.2,
    mouthClose: 0.8,
    eyeSquintLeft: 0.1,
    eyeSquintRight: 0.1,
  },
};
