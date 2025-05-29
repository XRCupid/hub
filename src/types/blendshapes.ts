// Define all possible blendshape keys
export type BlendshapeKey = 
  | 'eyeBlinkLeft' | 'eyeBlinkRight'
  | 'eyeLookDownLeft' | 'eyeLookDownRight'
  | 'eyeLookInLeft' | 'eyeLookInRight'
  | 'eyeLookOutLeft' | 'eyeLookOutRight'
  | 'eyeLookUpLeft' | 'eyeLookUpRight'
  | 'eyeSquintLeft' | 'eyeSquintRight'
  | 'eyeWideLeft' | 'eyeWideRight'
  | 'jawForward' | 'jawLeft' | 'jawRight' | 'jawOpen'
  | 'mouthClose' | 'mouthFunnel' | 'mouthPucker' | 'mouthLeft' | 'mouthRight'
  | 'mouthSmileLeft' | 'mouthSmileRight' | 'mouthFrownLeft' | 'mouthFrownRight'
  | 'mouthDimpleLeft' | 'mouthDimpleRight' | 'mouthStretchLeft' | 'mouthStretchRight'
  | 'mouthRollLower' | 'mouthRollUpper' | 'mouthShrugLower' | 'mouthShrugUpper'
  | 'mouthPressLeft' | 'mouthPressRight' | 'mouthLowerDownLeft' | 'mouthLowerDownRight'
  | 'mouthUpperUpLeft' | 'mouthUpperUpRight' | 'browDownLeft' | 'browDownRight'
  | 'browInnerUp' | 'browOuterUpLeft' | 'browOuterUpRight' | 'cheekPuff'
  | 'cheekSquintLeft' | 'cheekSquintRight' | 'noseSneerLeft' | 'noseSneerRight'
  | 'tongueOut' | 'tongueUp' | 'tongueDown' // Added tongueUp and tongueDown
  | 'mouthOpen';

export type BlendShapeMap = Record<BlendshapeKey, number>;

export const ARKitBlendshapeNamesList: BlendshapeKey[] = [
  'eyeBlinkLeft', 'eyeBlinkRight',
  'eyeLookDownLeft', 'eyeLookDownRight',
  'eyeLookInLeft', 'eyeLookInRight',
  'eyeLookOutLeft', 'eyeLookOutRight',
  'eyeLookUpLeft', 'eyeLookUpRight',
  'eyeSquintLeft', 'eyeSquintRight',
  'eyeWideLeft', 'eyeWideRight',
  'jawForward', 'jawLeft', 'jawRight', 'jawOpen',
  'mouthClose', 'mouthFunnel', 'mouthPucker', 'mouthLeft', 'mouthRight',
  'mouthSmileLeft', 'mouthSmileRight', 'mouthFrownLeft', 'mouthFrownRight',
  'mouthDimpleLeft', 'mouthDimpleRight', 'mouthStretchLeft', 'mouthStretchRight',
  'mouthRollLower', 'mouthRollUpper', 'mouthShrugLower', 'mouthShrugUpper',
  'mouthPressLeft', 'mouthPressRight', 'mouthLowerDownLeft', 'mouthLowerDownRight',
  'mouthUpperUpLeft', 'mouthUpperUpRight', 'browDownLeft', 'browDownRight',
  'browInnerUp', 'browOuterUpLeft', 'browOuterUpRight', 'cheekPuff',
  'cheekSquintLeft', 'cheekSquintRight', 'noseSneerLeft', 'noseSneerRight',
  'tongueOut', 'tongueUp', 'tongueDown', // Added tongueUp and tongueDown
  'mouthOpen'
];
