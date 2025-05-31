import React, { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { SkeletonUtils } from 'three-stdlib';

interface DiagnosticInfo {
  avatarLoaded: boolean;
  boneCount: number;
  boneNames: string[];
  animationCount: number;
  animationNames: string[];
  skinnedMeshCount: number;
  animationLoaded: boolean;
  animationClipName: string;
  animationDuration: number;
  mixerTime: number;
  actionPlaying: boolean;
  errors: string[];
}

function DiagnosticAvatar({ avatarUrl, animationUrl }: { avatarUrl: string; animationUrl: string }) {
  const group = useRef<THREE.Group>(null);
  const [diagnosticInfo, setDiagnosticInfo] = useState<DiagnosticInfo>({
    avatarLoaded: false,
    boneCount: 0,
    boneNames: [],
    animationCount: 0,
    animationNames: [],
    skinnedMeshCount: 0,
    animationLoaded: false,
    animationClipName: '',
    animationDuration: 0,
    mixerTime: 0,
    actionPlaying: false,
    errors: []
  });

  // Load avatar
  const { scene, animations } = useGLTF(avatarUrl);
  
  // Clone scene using SkeletonUtils
  const clonedScene = React.useMemo(() => {
    const cloned = SkeletonUtils.clone(scene);
    cloned.traverse((node) => {
      if ((node as THREE.SkinnedMesh).isSkinnedMesh) {
        const mesh = node as THREE.SkinnedMesh;
        mesh.frustumCulled = false;
      }
    });
    return cloned;
  }, [scene]);

  // Set up animations
  const { mixer, actions } = useAnimations(animations, group);
  const currentAction = useRef<THREE.AnimationAction | null>(null);

  // Analyze avatar structure
  useEffect(() => {
    const info: Partial<DiagnosticInfo> = {
      avatarLoaded: true,
      animationCount: animations.length,
      animationNames: animations.map(a => a.name),
      errors: []
    };

    let boneNames: string[] = [];
    let skinnedMeshCount = 0;

    clonedScene.traverse((node) => {
      if ((node as THREE.SkinnedMesh).isSkinnedMesh) {
        skinnedMeshCount++;
        const mesh = node as THREE.SkinnedMesh;
        if (mesh.skeleton) {
          info.boneCount = mesh.skeleton.bones.length;
          boneNames = mesh.skeleton.bones.map(bone => bone.name);
        }
      }
    });

    info.boneNames = boneNames;
    info.skinnedMeshCount = skinnedMeshCount;

    setDiagnosticInfo(prev => ({ ...prev, ...info }));
  }, [clonedScene, animations]);

  // Load external animation
  useEffect(() => {
    const loadAnimation = async () => {
      try {
        console.log(`[DIAGNOSTIC] Loading animation from: ${animationUrl}`);
        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync(animationUrl);
        
        if (gltf.animations && gltf.animations.length > 0) {
          const clip = gltf.animations[0];
          console.log(`[DIAGNOSTIC] Animation loaded: ${clip.name}, duration: ${clip.duration}s`);
          
          // Try different targets for the animation
          let action: THREE.AnimationAction | null = null;
          
          // Method 1: Apply to group
          try {
            action = mixer.clipAction(clip, group.current!);
            console.log('[DIAGNOSTIC] Applied animation to group');
          } catch (e) {
            console.error('[DIAGNOSTIC] Failed to apply to group:', e);
          }
          
          // Method 2: Apply to cloned scene
          if (!action) {
            try {
              action = mixer.clipAction(clip, clonedScene);
              console.log('[DIAGNOSTIC] Applied animation to clonedScene');
            } catch (e) {
              console.error('[DIAGNOSTIC] Failed to apply to clonedScene:', e);
            }
          }
          
          // Method 3: Apply without target
          if (!action) {
            try {
              action = mixer.clipAction(clip);
              console.log('[DIAGNOSTIC] Applied animation without target');
            } catch (e) {
              console.error('[DIAGNOSTIC] Failed to apply without target:', e);
            }
          }
          
          if (action) {
            action.play();
            currentAction.current = action;
            
            setDiagnosticInfo(prev => ({
              ...prev,
              animationLoaded: true,
              animationClipName: clip.name,
              animationDuration: clip.duration,
              actionPlaying: true
            }));
          } else {
            setDiagnosticInfo(prev => ({
              ...prev,
              errors: [...prev.errors, 'Failed to create animation action']
            }));
          }
        } else {
          setDiagnosticInfo(prev => ({
            ...prev,
            errors: [...prev.errors, 'No animations found in file']
          }));
        }
      } catch (error) {
        console.error('[DIAGNOSTIC] Error loading animation:', error);
        setDiagnosticInfo(prev => ({
          ...prev,
          errors: [...prev.errors, `Animation load error: ${error}`]
        }));
      }
    };

    if (animationUrl) {
      loadAnimation();
    }

    return () => {
      if (currentAction.current) {
        currentAction.current.stop();
      }
    };
  }, [animationUrl, mixer, clonedScene]);

  // Update mixer
  React.useEffect(() => {
    const interval = setInterval(() => {
      setDiagnosticInfo(prev => ({
        ...prev,
        mixerTime: mixer.time,
        actionPlaying: currentAction.current ? currentAction.current.isRunning() : false
      }));
    }, 100);

    return () => clearInterval(interval);
  }, [mixer]);

  return (
    <>
      <group ref={group}>
        <primitive object={clonedScene} />
      </group>
      <Html position={[0, 2, 0]} center>
        <div style={{ 
          background: 'rgba(0,0,0,0.8)', 
          color: 'white', 
          padding: '10px', 
          borderRadius: '5px',
          fontSize: '12px',
          width: '300px'
        }}>
          <h3>Avatar Diagnostic</h3>
          <div>Avatar Loaded: {diagnosticInfo.avatarLoaded ? '✅' : '❌'}</div>
          <div>Skinned Meshes: {diagnosticInfo.skinnedMeshCount}</div>
          <div>Bone Count: {diagnosticInfo.boneCount}</div>
          <div>Built-in Animations: {diagnosticInfo.animationCount}</div>
          <div>Animation Loaded: {diagnosticInfo.animationLoaded ? '✅' : '❌'}</div>
          <div>Animation Playing: {diagnosticInfo.actionPlaying ? '✅' : '❌'}</div>
          <div>Mixer Time: {diagnosticInfo.mixerTime.toFixed(2)}s</div>
          {diagnosticInfo.errors.length > 0 && (
            <div style={{ color: 'red' }}>
              Errors: {diagnosticInfo.errors.join(', ')}
            </div>
          )}
        </div>
      </Html>
    </>
  );
}

export default function AvatarDiagnostic() {
  const [selectedAvatar, setSelectedAvatar] = useState('/avatars/AngelChick.glb');
  const [selectedAnimation, setSelectedAnimation] = useState('/animations/feminine/idle/F_Standing_Idle_001.glb');

  const avatars = [
    { name: 'AngelChick (RPM)', path: '/avatars/AngelChick.glb' },
    { name: 'myMan (Working)', path: '/avatars/myMan.glb' },
    { name: 'bro (Original)', path: '/bro.glb' }
  ];

  const animations = [
    { name: 'Feminine Idle 1', path: '/animations/feminine/idle/F_Standing_Idle_001.glb' },
    { name: 'Feminine Idle 2', path: '/animations/feminine/idle/F_Standing_Idle_Variations_001.glb' },
    { name: 'Male Idle 1', path: '/animations/M_Standing_Idle_001.glb' },
    { name: 'Male Idle 2', path: '/animations/M_Standing_Idle_Variations_001.glb' }
  ];

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px', background: '#f0f0f0' }}>
        <h2>Avatar Animation Diagnostic Tool</h2>
        <div style={{ marginBottom: '10px' }}>
          <label>Avatar: </label>
          <select value={selectedAvatar} onChange={(e) => setSelectedAvatar(e.target.value)}>
            {avatars.map(a => (
              <option key={a.path} value={a.path}>{a.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Animation: </label>
          <select value={selectedAnimation} onChange={(e) => setSelectedAnimation(e.target.value)}>
            {animations.map(a => (
              <option key={a.path} value={a.path}>{a.name}</option>
            ))}
          </select>
        </div>
      </div>
      <Canvas 
        camera={{ position: [0, 1.5, 3], fov: 50 }}
        style={{ flex: 1 }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <DiagnosticAvatar 
          avatarUrl={selectedAvatar} 
          animationUrl={selectedAnimation}
        />
        <OrbitControls />
        <gridHelper args={[10, 10]} />
      </Canvas>
    </div>
  );
}
