import React from 'react';
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette, SMAA } from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';

interface LightweightPostProcessingProps {
  enabled?: boolean;
  quality?: 'low' | 'medium' | 'high';
}

export const LightweightPostProcessing: React.FC<LightweightPostProcessingProps> = ({ 
  enabled = true,
  quality = 'medium' 
}) => {
  // Quality presets for performance
  const qualitySettings = {
    low: {
      bloom: { intensity: 0.5, kernelSize: KernelSize.SMALL },
      chromatic: 0.0002,
      noise: 0.02,
      vignette: 0.3,
      smaa: false
    },
    medium: {
      bloom: { intensity: 0.8, kernelSize: KernelSize.MEDIUM },
      chromatic: 0.0003,
      noise: 0.03,
      vignette: 0.4,
      smaa: true
    },
    high: {
      bloom: { intensity: 1.0, kernelSize: KernelSize.LARGE },
      chromatic: 0.0004,
      noise: 0.04,
      vignette: 0.5,
      smaa: true
    }
  };

  const settings = qualitySettings[quality];

  if (!enabled) {
    return <></>;
  }

  // Common effects
  const commonEffects = (
    <>
      <Bloom
        intensity={settings.bloom.intensity}
        kernelSize={settings.bloom.kernelSize}
        luminanceThreshold={0.9}
        luminanceSmoothing={0.025}
      />
      
      <ChromaticAberration
        offset={[settings.chromatic, settings.chromatic]}
        radialModulation={false}
        modulationOffset={0}
      />
      
      <Noise
        premultiply
        blendFunction={BlendFunction.ADD}
        opacity={settings.noise}
      />
      
      <Vignette
        darkness={settings.vignette}
        offset={0.2}
      />
    </>
  );

  // Return with SMAA if enabled
  if (settings.smaa) {
    return (
      <EffectComposer multisampling={0}>
        <SMAA />
        {commonEffects}
      </EffectComposer>
    );
  }

  // Return without SMAA
  return (
    <EffectComposer multisampling={0}>
      {commonEffects}
    </EffectComposer>
  );
};
