import React from 'react';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

export const MinimalPostProcessing: React.FC = () => {
  return (
    <EffectComposer>
      <Bloom intensity={0.5} />
    </EffectComposer>
  );
};
