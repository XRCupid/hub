import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ProceduralAvatar } from '../components/ProceduralAvatar';
import { RPMWorkingAvatar } from '../components/RPMWorkingAvatar';
import { simpleFacialTracking } from '../services/SimpleFacialTracking';
import { FacialBlendShapes } from '../services/AvatarMirrorSystem';

const AvatarTest: React.FC = () => {
  const [blendShapes, setBlendShapes] = useState<FacialBlendShapes>({});
  const [useRPM, setUseRPM] = useState(false);
  const [rpmUrl, setRpmUrl] = useState('');
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    // Check for stored RPM avatars
    const storedAvatars = localStorage.getItem('rpm_avatars');
    if (storedAvatars) {
      try {
        const avatars = JSON.parse(storedAvatars);
        if (avatars.length > 0) {
          setRpmUrl(avatars[0].url);
          setUseRPM(true);
        }
      } catch (e) {
        console.error('Error parsing stored avatars:', e);
      }
    }
  }, []);

  const toggleTracking = () => {
    if (isTracking) {
      simpleFacialTracking.stopTracking();
      setIsTracking(false);
    } else {
      simpleFacialTracking.startTracking((shapes) => {
        setBlendShapes(shapes);
      });
      setIsTracking(true);
    }
  };

  const addTestAvatar = () => {
    const testAvatar = {
      id: 'test-avatar-' + Date.now(),
      url: 'https://models.readyplayer.me/6729f9b9f1b7ba7b1e0f6b2a.glb',
      name: 'Test Avatar',
      createdAt: new Date().toISOString()
    };
    
    const existingAvatars = JSON.parse(localStorage.getItem('rpm_avatars') || '[]');
    existingAvatars.push(testAvatar);
    localStorage.setItem('rpm_avatars', JSON.stringify(existingAvatars));
    
    setRpmUrl(testAvatar.url);
    setUseRPM(true);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px', background: '#f0f0f0' }}>
        <h1>Avatar Test Page</h1>
        <div style={{ marginBottom: '10px' }}>
          <button onClick={toggleTracking}>
            {isTracking ? 'Stop' : 'Start'} Facial Tracking
          </button>
          <button onClick={() => setUseRPM(!useRPM)} style={{ marginLeft: '10px' }}>
            Switch to {useRPM ? 'Procedural' : 'RPM'} Avatar
          </button>
          {!useRPM && (
            <button onClick={addTestAvatar} style={{ marginLeft: '10px' }}>
              Add Test RPM Avatar
            </button>
          )}
        </div>
        <div>
          <strong>Current Avatar:</strong> {useRPM ? 'RPM Avatar' : 'Procedural Avatar'}
        </div>
        <div>
          <strong>Tracking:</strong> {isTracking ? 'Active' : 'Inactive'}
        </div>
        <div>
          <strong>Blend Shapes:</strong>
          <pre style={{ fontSize: '10px', maxHeight: '100px', overflow: 'auto' }}>
            {JSON.stringify(blendShapes, null, 2)}
          </pre>
        </div>
      </div>
      
      <div style={{ flex: 1 }}>
        {useRPM && rpmUrl ? (
          <RPMWorkingAvatar
            avatarUrl={rpmUrl}
            blendShapes={blendShapes}
            position={[0, -1, 0]}
            scale={1}
          />
        ) : (
          <Canvas camera={{ position: [0, 0, 2], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <ProceduralAvatar
              gender="male"
              skinTone="#F5DEB3"
              hairColor="#4A4A4A"
              hairStyle="short"
              clothingColor="#4A90E2"
              position={[0, 0, 0]}
              blendShapes={blendShapes}
            />
            <OrbitControls />
          </Canvas>
        )}
      </div>
    </div>
  );
};

export default AvatarTest;
