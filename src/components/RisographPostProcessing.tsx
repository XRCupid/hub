import React, { useRef, useMemo } from 'react';
import { useFrame, useThree, extend } from '@react-three/fiber';
import { EffectComposer } from '@react-three/postprocessing';
import { 
  ChromaticAberration, 
  Noise, 
  Vignette, 
  Bloom,
  DotScreen,
  HueSaturation,
  BrightnessContrast,
  ToneMapping,
  DepthOfField
} from '@react-three/postprocessing';
import { BlendFunction, KernelSize, ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { Pass } from 'three/examples/jsm/postprocessing/Pass';

// Custom Risograph-style shader
const RisographShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    paperTexture: { value: 0.15 },
    inkBleed: { value: 0.02 },
    registration: { value: new THREE.Vector2(0.001, 0.001) },
    colorSeparation: { value: 0.003 },
    grainAmount: { value: 0.08 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float paperTexture;
    uniform float inkBleed;
    uniform vec2 registration;
    uniform float colorSeparation;
    uniform float grainAmount;
    
    varying vec2 vUv;
    
    // Simple noise function
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    // Paper texture simulation
    float paperNoise(vec2 uv) {
      vec2 i = floor(uv * 300.0);
      vec2 f = fract(uv * 300.0);
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
    
    // Halftone pattern
    float halftone(vec2 uv, float size) {
      vec2 p = mod(uv * size, 1.0);
      float d = distance(p, vec2(0.5));
      return smoothstep(0.3, 0.32, d);
    }
    
    void main() {
      // Misregistration effect
      vec2 uvR = vUv + registration * sin(time * 0.5);
      vec2 uvG = vUv;
      vec2 uvB = vUv - registration * cos(time * 0.3);
      
      // Color separation
      vec3 colorR = texture2D(tDiffuse, uvR + vec2(colorSeparation, 0.0)).rgb;
      vec3 colorG = texture2D(tDiffuse, uvG).rgb;
      vec3 colorB = texture2D(tDiffuse, uvB - vec2(colorSeparation, 0.0)).rgb;
      
      vec3 color = vec3(colorR.r, colorG.g, colorB.b);
      
      // Convert to limited color palette (risograph style)
      vec3 risoColors[5];
      risoColors[0] = vec3(1.0, 0.4, 0.6);  // Fluorescent Pink
      risoColors[1] = vec3(0.0, 0.7, 0.9);  // Blue
      risoColors[2] = vec3(1.0, 0.9, 0.0);  // Yellow
      risoColors[3] = vec3(0.0, 0.6, 0.4);  // Green
      risoColors[4] = vec3(1.0, 0.3, 0.0);  // Orange
      
      // Find closest riso color
      float minDist = 999.0;
      vec3 closestColor = risoColors[0];
      for (int i = 0; i < 5; i++) {
        float dist = distance(color, risoColors[i]);
        if (dist < minDist) {
          minDist = dist;
          closestColor = risoColors[i];
        }
      }
      
      // Mix original with riso color
      color = mix(color, closestColor, 0.3);
      
      // Add halftone effect
      float lum = dot(color, vec3(0.299, 0.587, 0.114));
      float pattern = halftone(vUv, 120.0);
      color *= mix(0.8, 1.0, pattern * lum);
      
      // Ink bleeding simulation
      vec2 bleedOffset = vec2(
        sin(vUv.y * 200.0 + time) * inkBleed,
        cos(vUv.x * 200.0 + time) * inkBleed
      );
      vec3 bleedColor = texture2D(tDiffuse, vUv + bleedOffset).rgb;
      color = mix(color, bleedColor, 0.1);
      
      // Paper texture
      float paper = paperNoise(vUv + time * 0.01);
      color = mix(color, vec3(0.95, 0.93, 0.88), paper * paperTexture);
      
      // Film grain
      float grain = random(vUv + time) * grainAmount;
      color += vec3(grain) - grainAmount * 0.5;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
};

interface RisographPostProcessingProps {
  intensity?: number;
  preset?: 'subtle' | 'medium' | 'intense';
}

export const RisographPostProcessing: React.FC<RisographPostProcessingProps> = ({ 
  intensity = 0.5,
  preset = 'medium' 
}) => {
  const { gl, size } = useThree();
  const composer = useRef<any>();
  
  // Preset configurations
  const presets = {
    subtle: {
      chromaticAberration: 0.0002,
      bloom: 0.3,
      noise: 0.02,
      vignette: 0.3,
      dotScreen: 0,
      saturation: -0.1,
      contrast: 0.1,
      colorA: '#FF69B4',
      colorB: '#34A85A',
      colorC: '#FFC107',
      halftoneScale: 120,
      inkBleed: 0.02,
      paperTexture: 0.15,
      noiseAmount: 0.08
    },
    medium: {
      chromaticAberration: 0.0005,
      bloom: 0.5,
      noise: 0.05,
      vignette: 0.5,
      dotScreen: 0.3,
      saturation: -0.2,
      contrast: 0.2,
      colorA: '#FF69B4',
      colorB: '#34A85A',
      colorC: '#FFC107',
      halftoneScale: 120,
      inkBleed: 0.02,
      paperTexture: 0.15,
      noiseAmount: 0.08
    },
    intense: {
      chromaticAberration: 0.001,
      bloom: 0.7,
      noise: 0.08,
      vignette: 0.7,
      dotScreen: 0.5,
      saturation: -0.3,
      contrast: 0.3,
      colorA: '#FF69B4',
      colorB: '#34A85A',
      colorC: '#FFC107',
      halftoneScale: 120,
      inkBleed: 0.02,
      paperTexture: 0.15,
      noiseAmount: 0.08
    }
  };
  
  const config = presets[preset];
  
  const risographPass = useMemo(() => {
    const pass = new ShaderPass(RisographShader);
    pass.uniforms.resolution.value.set(size.width, size.height);
    pass.uniforms.colorSeparation.value = 0.002 * intensity;
    pass.uniforms.grainAmount.value = 0.05 * intensity;
    pass.uniforms.paperTexture.value = config.paperTexture * intensity;
    pass.uniforms.inkBleed.value = config.inkBleed * intensity;
    return pass;
  }, [size, intensity, config]);
  
  // Update time uniform
  useFrame((state) => {
    if (risographPass) {
      risographPass.uniforms.time.value = state.clock.elapsedTime;
    }
  });
  
  return (
    <EffectComposer ref={composer}>
      <Bloom
        intensity={config.bloom}
        kernelSize={KernelSize.LARGE}
        luminanceThreshold={0.9}
        luminanceSmoothing={0.025}
        mipmapBlur
      />
      
      <ChromaticAberration
        offset={[config.chromaticAberration, config.chromaticAberration * 0.5]}
        radialModulation={true}
        modulationOffset={0.15}
      />
      
      <HueSaturation
        hue={0}
        saturation={config.saturation}
        blendFunction={BlendFunction.NORMAL}
      />
      
      <BrightnessContrast
        brightness={0}
        contrast={config.contrast}
        blendFunction={BlendFunction.NORMAL}
      />
      
      <Noise
        premultiply
        blendFunction={BlendFunction.ADD}
        opacity={config.noise}
      />
      
      <Vignette
        darkness={config.vignette}
        offset={0.3}
        blendFunction={BlendFunction.NORMAL}
      />
      
      <ToneMapping
        mode={ToneMappingMode.ACES_FILMIC}
        resolution={256}
        whitePoint={4.0}
        middleGrey={0.6}
        minLuminance={0.01}
        averageLuminance={1.0}
        adaptationRate={1.0}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
};

// Export individual effect components for custom compositions
export { ChromaticAberration, Noise, Vignette, Bloom, DotScreen, HueSaturation, BrightnessContrast };
