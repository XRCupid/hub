import React, { useState, useEffect } from 'react';
import { SimpleAvatarSystem } from '../components/SimpleAvatarSystem';
import { simpleFacialTracking } from '../services/SimpleFacialTracking';
import { FacialBlendShapes } from '../services/AvatarMirrorSystem';

const AvatarTest: React.FC = () => {
  const [blendShapes, setBlendShapes] = useState<FacialBlendShapes>({});
  const [isTracking, setIsTracking] = useState(false);
  const [avatarType, setAvatarType] = useState<'male' | 'female' | 'neutral'>('male');

  useEffect(() => {
    if (isTracking) {
      simpleFacialTracking.startTracking();
      simpleFacialTracking.onUpdate((shapes) => {
        setBlendShapes(shapes);
      });
    } else {
      simpleFacialTracking.stopTracking();
    }

    return () => {
      simpleFacialTracking.stopTracking();
    };
  }, [isTracking]);

  const toggleTracking = () => {
    setIsTracking(!isTracking);
  };

  const cycleAvatarType = () => {
    const types: ('male' | 'female' | 'neutral')[] = ['male', 'female', 'neutral'];
    const currentIndex = types.indexOf(avatarType);
    const nextIndex = (currentIndex + 1) % types.length;
    setAvatarType(types[nextIndex]);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f0f0f0' }}>
      <div style={{ width: '300px', padding: '20px', backgroundColor: '#fff', overflowY: 'auto' }}>
        <h2>Avatar Test Page</h2>
        
        <button 
          onClick={toggleTracking}
          style={{
            padding: '10px 20px',
            margin: '10px 0',
            backgroundColor: isTracking ? '#e74c3c' : '#2ecc71',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {isTracking ? 'Stop Facial Tracking' : 'Start Facial Tracking'}
        </button>

        <button 
          onClick={cycleAvatarType}
          style={{
            padding: '10px 20px',
            margin: '10px 0',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            display: 'block'
          }}
        >
          Change Avatar Type ({avatarType})
        </button>

        <div style={{ marginTop: '20px' }}>
          <h3>Current Avatar: {avatarType}</h3>
          <h3>Tracking: {isTracking ? 'Active' : 'Inactive'}</h3>
          <h3>Blend Shapes:</h3>
          <pre style={{ fontSize: '10px', maxHeight: '400px', overflow: 'auto' }}>
            {JSON.stringify(blendShapes, null, 2)}
          </pre>
        </div>
      </div>
      
      <div style={{ flex: 1, padding: '20px' }}>
        <SimpleAvatarSystem
          avatarType={avatarType}
          blendShapes={blendShapes}
          showControls={true}
        />
      </div>
    </div>
  );
};

export default AvatarTest;
