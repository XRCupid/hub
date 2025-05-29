import { BlendshapeKey } from '../types/blendshapes';

type Phoneme = keyof typeof PHONEME_TO_BLENDSHAPE;

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
  'D': 'tongueOut',
  'DH': 'tongueOut',
  'F': 'mouthFunnel',
  'G': 'jawOpen',
  'HH': 'jawOpen',
  'JH': 'mouthPucker',
  'K': 'jawOpen',
  'L': 'tongueOut',
  'M': 'mouthClose',
  'N': 'tongueOut',
  'NG': 'tongueOut',
  'P': 'mouthClose',
  'R': 'mouthFunnel',
  'S': 'mouthStretchLeft',
  'SH': 'mouthPucker',
  'T': 'tongueOut',
  'TH': 'tongueOut',
  'V': 'mouthFunnel',
  'W': 'mouthFunnel',
  'Y': 'mouthSmileLeft',
  'Z': 'mouthStretchLeft',
  'ZH': 'mouthPucker'
};

export const DEFAULT_BLENDSHAPES: Record<BlendshapeKey, number> = {
  // Eyes
  eyeBlinkLeft: 0,
  eyeBlinkRight: 0,
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
  
  // Jaw and mouth
  jawForward: 0,
  jawLeft: 0,
  jawRight: 0,
  jawOpen: 0,
  mouthClose: 0,
  mouthFunnel: 0,
  mouthPucker: 0,
  mouthLeft: 0,
  mouthRight: 0,
  mouthSmileLeft: 0,
  mouthSmileRight: 0,
  mouthFrownLeft: 0,
  mouthFrownRight: 0,
  mouthDimpleLeft: 0,
  mouthDimpleRight: 0,
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
  browInnerUp: 0,
  browOuterUpLeft: 0,
  browOuterUpRight: 0,
  
  // Cheeks and other expressions
  cheekPuff: 0,
  cheekSquintLeft: 0,
  cheekSquintRight: 0,
  noseSneerLeft: 0,
  noseSneerRight: 0,
  tongueUp: 0,
  tongueDown: 0,
  tongueOut: 0,
  mouthOpen: 0
};
