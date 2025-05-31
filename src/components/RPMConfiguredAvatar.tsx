import React, { useRef, useEffect, useState, Suspense } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';
import { FacialBlendShapes } from '../services/AvatarMirrorSystem';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

interface RPMConfiguredAvatarProps {
  avatarUrl: string;
  blendShapes?: FacialBlendShapes;
  position?: [number, number, number];
  scale?: number;
  fallbackComponent?: React.ReactNode;
}

// Component to handle the actual GLB loading
const RPMModel: React.FC<{
  url: string;
  blendShapes?: FacialBlendShapes;
  position?: [number, number, number];
  scale?: number;
}> = ({ url, blendShapes, position = [0, 0, 0], scale = 1 }) => {
  const gltf = useLoader(GLTFLoader, url);
  const modelRef = useRef<THREE.Group>(null);
  const mixer = useRef<THREE.AnimationMixer | null>(null);

  useEffect(() => {
    if (gltf && modelRef.current) {
      // Set up animation mixer if animations exist
      if (gltf.animations && gltf.animations.length > 0) {
        mixer.current = new THREE.AnimationMixer(modelRef.current);
        const action = mixer.current.clipAction(gltf.animations[0]);
        action.play();
      }

      // Find mesh with morph targets for blend shapes
      modelRef.current.traverse((child) => {
        if (child instanceof THREE.SkinnedMesh) {
          child.frustumCulled = false;
          
          // Apply blend shapes if available
          if (child.morphTargetDictionary && child.morphTargetInfluences && blendShapes) {
            Object.entries(blendShapes).forEach(([key, value]) => {
              const index = child.morphTargetDictionary![key];
              if (index !== undefined) {
                child.morphTargetInfluences![index] = value;
              }
            });
          }
        }
      });
    }
  }, [gltf, blendShapes]);

  useFrame((state, delta) => {
    if (mixer.current) {
      mixer.current.update(delta);
    }
  });

  return (
    <primitive
      ref={modelRef}
      object={gltf.scene}
      position={position}
      scale={scale}
    />
  );
};

// Error boundary for handling loading failures
class RPMErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Main component with proper error handling and CORS configuration
export const RPMConfiguredAvatar: React.FC<RPMConfiguredAvatarProps> = ({
  avatarUrl,
  blendShapes,
  position = [0, 0, 0],
  scale = 1,
  fallbackComponent
}) => {
  const [processedUrl, setProcessedUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { gl } = useThree();

  useEffect(() => {
    // Process the avatar URL to ensure it works with CORS
    const processAvatarUrl = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Extract avatar ID from URL
        let avatarId = '';
        
        // Handle different URL formats
        if (avatarUrl.includes('models.readyplayer.me')) {
          // Direct model URL: https://models.readyplayer.me/[id].glb
          const match = avatarUrl.match(/models\.readyplayer\.me\/([^\/]+)\.glb/);
          if (match) {
            avatarId = match[1];
          }
        } else if (avatarUrl.includes('readyplayer.me/')) {
          // Avatar page URL: https://[subdomain].readyplayer.me/[id]
          const match = avatarUrl.match(/readyplayer\.me\/([^\/\?]+)/);
          if (match) {
            avatarId = match[1];
          }
        } else {
          // Assume it's just the avatar ID
          avatarId = avatarUrl.replace('.glb', '');
        }

        if (!avatarId) {
          throw new Error('Invalid avatar URL or ID');
        }

        // Construct proper GLB URL with quality parameters
        const params = new URLSearchParams({
          morphTargets: 'ARKit,Oculus Visemes',
          textureAtlas: '1024',
          pose: 'T',
          lod: '0',
          useHands: 'true',
          meshCompression: 'false'
        });
        const glbUrl = `https://models.readyplayer.me/${avatarId}.glb?${params.toString()}`;
        
        // Test if URL is accessible
        const response = await fetch(glbUrl, { method: 'HEAD' });
        if (!response.ok) {
          throw new Error(`Avatar not accessible: ${response.status}`);
        }

        setProcessedUrl(glbUrl);
        setIsLoading(false);
      } catch (err) {
        console.error('Error processing avatar URL:', err);
        setError(err instanceof Error ? err.message : 'Failed to load avatar');
        setIsLoading(false);
      }
    };

    if (avatarUrl) {
      processAvatarUrl();
    }
  }, [avatarUrl]);

  // Default fallback
  const defaultFallback = (
    <mesh position={position} scale={scale}>
      <boxGeometry args={[1, 2, 0.5]} />
      <meshStandardMaterial color="#4A90E2" />
    </mesh>
  );

  if (isLoading) {
    return (
      <mesh position={position} scale={scale}>
        <boxGeometry args={[1, 2, 0.5]} />
        <meshStandardMaterial color="#cccccc" wireframe />
      </mesh>
    );
  }

  if (error || !processedUrl) {
    console.error('RPM Avatar Error:', error);
    return <>{fallbackComponent || defaultFallback}</>;
  }

  const loader = new GLTFLoader();
  const ktx2Loader = new KTX2Loader();
  ktx2Loader.setTranscoderPath('/basis/');
  ktx2Loader.detectSupport(gl);
  loader.setKTX2Loader(ktx2Loader);

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('/draco/');
  loader.setDRACOLoader(dracoLoader);

  loader.setMeshoptDecoder(MeshoptDecoder);

  return (
    <RPMErrorBoundary fallback={fallbackComponent || defaultFallback}>
      <Suspense fallback={
        <mesh position={position} scale={scale}>
          <boxGeometry args={[1, 2, 0.5]} />
          <meshStandardMaterial color="#cccccc" wireframe />
        </mesh>
      }>
        <RPMModel
          url={processedUrl}
          blendShapes={blendShapes}
          position={position}
          scale={scale}
        />
      </Suspense>
    </RPMErrorBoundary>
  );
};
