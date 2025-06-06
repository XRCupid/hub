import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

// Risograph-inspired shader material
const RisographMaterialImpl = shaderMaterial(
  {
    // Uniforms
    map: null,
    time: 0,
    colorA: new THREE.Color('#FF6B6B'), // Fluorescent Pink
    colorB: new THREE.Color('#4ECDC4'), // Teal
    colorC: new THREE.Color('#FFE66D'), // Yellow
    posterize: 4,
    halftoneScale: 100,
    outlineWidth: 0.01,
    outlineColor: new THREE.Color('#1A1A1A'),
    rimPower: 2.0,
    rimColor: new THREE.Color('#FFFFFF'),
    noiseAmount: 0.05
  },
  // Vertex shader
  `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  // Fragment shader
  `
    uniform sampler2D map;
    uniform float time;
    uniform vec3 colorA;
    uniform vec3 colorB;
    uniform vec3 colorC;
    uniform float posterize;
    uniform float halftoneScale;
    uniform float outlineWidth;
    uniform vec3 outlineColor;
    uniform float rimPower;
    uniform vec3 rimColor;
    uniform float noiseAmount;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;
    
    // Noise function
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    // Halftone pattern
    float halftone(vec2 uv, float size, float value) {
      vec2 p = mod(uv * size, 1.0) - 0.5;
      float d = length(p);
      return smoothstep(0.5 * value, 0.5 * value + 0.01, d);
    }
    
    // Posterize function
    vec3 posterizeColor(vec3 color, float levels) {
      return floor(color * levels) / levels;
    }
    
    // Rim lighting
    float rim(vec3 normal, vec3 viewDir, float power) {
      float d = 1.0 - dot(normalize(normal), normalize(viewDir));
      return pow(d, power);
    }
    
    void main() {
      // Sample texture
      vec4 texColor = texture2D(map, vUv);
      if (texColor.a < 0.1) discard;
      
      // Convert to grayscale for processing
      float gray = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
      
      // Create 3-color separation
      vec3 finalColor;
      if (gray < 0.33) {
        finalColor = mix(colorA, colorB, gray * 3.0);
      } else if (gray < 0.66) {
        finalColor = mix(colorB, colorC, (gray - 0.33) * 3.0);
      } else {
        finalColor = mix(colorC, vec3(1.0), (gray - 0.66) * 3.0);
      }
      
      // Apply halftone effect
      float halftoneValue = halftone(vUv, halftoneScale, gray);
      finalColor *= mix(0.8, 1.0, halftoneValue);
      
      // Posterize
      finalColor = posterizeColor(finalColor, posterize);
      
      // Add rim lighting
      float rimValue = rim(vNormal, vViewPosition, rimPower);
      finalColor += rimColor * rimValue * 0.3;
      
      // Add noise/grain
      float noise = (random(vUv + time * 0.1) - 0.5) * noiseAmount;
      finalColor += vec3(noise);
      
      // Simple edge detection for outline effect
      float edge = 1.0 - dot(normalize(vNormal), normalize(vViewPosition));
      if (edge > 1.0 - outlineWidth) {
        finalColor = outlineColor;
      }
      
      gl_FragColor = vec4(finalColor, texColor.a);
    }
  `
);

// Extend for use in React Three Fiber
extend({ RisographMaterialImpl });

// TypeScript declaration
declare global {
  namespace JSX {
    interface IntrinsicElements {
      risographMaterialImpl: any;
    }
  }
}

// React component wrapper
export const RisographMaterial = ({ 
  texture,
  colorA = '#FF6B6B',
  colorB = '#4ECDC4', 
  colorC = '#FFE66D',
  posterize = 4,
  halftoneScale = 100,
  outlineWidth = 0.01,
  outlineColor = '#1A1A1A',
  rimPower = 2.0,
  rimColor = '#FFFFFF',
  noiseAmount = 0.05,
  ...props 
}: any) => {
  return (
    <risographMaterialImpl
      map={texture}
      colorA={new THREE.Color(colorA)}
      colorB={new THREE.Color(colorB)}
      colorC={new THREE.Color(colorC)}
      posterize={posterize}
      halftoneScale={halftoneScale}
      outlineWidth={outlineWidth}
      outlineColor={new THREE.Color(outlineColor)}
      rimPower={rimPower}
      rimColor={new THREE.Color(rimColor)}
      noiseAmount={noiseAmount}
      {...props}
    />
  );
};

// Toon-style material for simpler look
export const ToonRisographMaterial = shaderMaterial(
  {
    map: null,
    color: new THREE.Color('#FF6B6B'),
    steps: 3,
    rimColor: new THREE.Color('#FFFFFF'),
    rimPower: 2.0
  },
  // Vertex shader
  `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  // Fragment shader
  `
    uniform sampler2D map;
    uniform vec3 color;
    uniform float steps;
    uniform vec3 rimColor;
    uniform float rimPower;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    
    void main() {
      vec4 texColor = texture2D(map, vUv);
      if (texColor.a < 0.1) discard;
      
      // Simple toon shading
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      float NdotL = dot(normal, vec3(0.0, 1.0, 0.5));
      float lightIntensity = floor(NdotL * steps) / steps;
      
      vec3 finalColor = texColor.rgb * color * (0.5 + lightIntensity * 0.5);
      
      // Rim lighting
      float rim = 1.0 - dot(normal, viewDir);
      rim = pow(rim, rimPower);
      finalColor += rimColor * rim * 0.5;
      
      gl_FragColor = vec4(finalColor, texColor.a);
    }
  `
);

extend({ ToonRisographMaterial });
