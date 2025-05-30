import React, { useState, useEffect } from 'react';
import { RPMWorkingAvatar } from '../components/RPMWorkingAvatar';
import { RPMAvatar } from '../services/RPMIntegrationService';
import { FacialBlendShapes } from '../services/AvatarMirrorSystem';

export const RPMTest: React.FC = () => {
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [loadedAvatar, setLoadedAvatar] = useState<RPMAvatar | null>(null);
  const [currentAnimation, setCurrentAnimation] = useState<string>('');
  const [currentViseme, setCurrentViseme] = useState<string>('');
  const [blendShapes, setBlendShapes] = useState<Partial<FacialBlendShapes>>({});
  
  // Load stored avatars on mount
  useEffect(() => {
    const stored = localStorage.getItem('rpm_avatars');
    if (stored) {
      try {
        const avatars = JSON.parse(stored);
        if (avatars.length > 0) {
          setAvatarUrl(avatars[0].url);
        }
      } catch (e) {
        console.error('Error loading stored avatars:', e);
      }
    }
  }, []);

  const handleAvatarLoaded = (avatar: RPMAvatar) => {
    setLoadedAvatar(avatar);
    console.log('Avatar loaded with capabilities:', {
      expressions: avatar.morphTargets.size,
      animations: avatar.animations.size
    });
  };

  const testExpressions = () => {
    if (!loadedAvatar) return;
    
    // Test sequence of expressions
    const expressions = [
      { name: 'Happy', data: { mouthSmileLeft: 0.8, mouthSmileRight: 0.8, eyeSquintLeft: 0.3, eyeSquintRight: 0.3 } },
      { name: 'Sad', data: { mouthFrownLeft: 0.7, mouthFrownRight: 0.7, browDownLeft: 0.5, browDownRight: 0.5 } },
      { name: 'Surprised', data: { eyeWideLeft: 0.9, eyeWideRight: 0.9, jawOpen: 0.3, browInnerUp: 0.8 } },
      { name: 'Angry', data: { browDownLeft: 0.9, browDownRight: 0.9, mouthFrownLeft: 0.5, mouthFrownRight: 0.5 } },
      { name: 'Neutral', data: {} }
    ];
    
    let index = 0;
    const interval = setInterval(() => {
      const expr = expressions[index % expressions.length];
      console.log(`Testing expression: ${expr.name}`);
      setBlendShapes(expr.data);
      index++;
      
      if (index >= expressions.length * 2) {
        clearInterval(interval);
        setBlendShapes({});
      }
    }, 2000);
  };

  const testVisemes = () => {
    if (!loadedAvatar) return;
    
    // Test lip sync with common visemes
    const visemes = ['sil', 'aa', 'E', 'I', 'O', 'U', 'PP', 'FF', 'TH', 'DD', 'kk', 'CH', 'SS', 'nn', 'RR'];
    let index = 0;
    
    const interval = setInterval(() => {
      const viseme = visemes[index % visemes.length];
      console.log(`Testing viseme: ${viseme}`);
      setCurrentViseme(viseme);
      index++;
      
      if (index >= visemes.length * 2) {
        clearInterval(interval);
        setCurrentViseme('');
      }
    }, 500);
  };

  const testBlinking = () => {
    if (!loadedAvatar) return;
    
    // Natural blinking pattern
    const blink = () => {
      setBlendShapes(prev => ({ ...prev, eyeBlinkLeft: 1, eyeBlinkRight: 1 }));
      setTimeout(() => {
        setBlendShapes(prev => ({ ...prev, eyeBlinkLeft: 0, eyeBlinkRight: 0 }));
      }, 150);
    };
    
    // Blink every 2-4 seconds
    const blinkInterval = setInterval(() => {
      blink();
      // Random double blink sometimes
      if (Math.random() > 0.7) {
        setTimeout(blink, 300);
      }
    }, 2000 + Math.random() * 2000);
    
    // Stop after 20 seconds
    setTimeout(() => clearInterval(blinkInterval), 20000);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">RPM Avatar Test Suite</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Avatar Display */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Avatar Preview</h2>
            <div className="h-96 bg-gray-50 rounded-lg overflow-hidden">
              {avatarUrl ? (
                <RPMWorkingAvatar
                  avatarUrl={avatarUrl}
                  blendShapes={blendShapes as FacialBlendShapes}
                  viseme={currentViseme}
                  animation={currentAnimation}
                  enableOrbitControls={true}
                  onAvatarLoaded={handleAvatarLoaded}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No avatar loaded. Please create one in RPM Setup first.
                </div>
              )}
            </div>
          </div>
          
          {/* Controls */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
            
            {/* Avatar URL Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Avatar URL</label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="https://models.readyplayer.me/..."
              />
            </div>
            
            {/* Test Buttons */}
            <div className="space-y-4">
              <button
                onClick={testExpressions}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                disabled={!loadedAvatar}
              >
                Test Facial Expressions
              </button>
              
              <button
                onClick={testVisemes}
                className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                disabled={!loadedAvatar}
              >
                Test Lip Sync (Visemes)
              </button>
              
              <button
                onClick={testBlinking}
                className="w-full bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
                disabled={!loadedAvatar}
              >
                Test Natural Blinking
              </button>
              
              {/* Animation Selector */}
              {loadedAvatar && loadedAvatar.animations.size > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">Animations</label>
                  <select
                    value={currentAnimation}
                    onChange={(e) => setCurrentAnimation(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">No Animation</option>
                    {Array.from(loadedAvatar.animations.keys()).map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            {/* Status */}
            {loadedAvatar && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm">
                <h3 className="font-semibold mb-2">Avatar Capabilities:</h3>
                <ul className="space-y-1">
                  <li>✅ {loadedAvatar.morphTargets.size} Morph Targets</li>
                  <li>✅ {loadedAvatar.animations.size} Animations</li>
                  <li>✅ Viseme Mapping Ready</li>
                  <li>✅ Expression System Active</li>
                </ul>
              </div>
            )}
          </div>
        </div>
        
        {/* Expression Sliders */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Manual Expression Control</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              'eyeBlinkLeft', 'eyeBlinkRight', 'browDownLeft', 'browDownRight',
              'mouthSmileLeft', 'mouthSmileRight', 'jawOpen', 'mouthPucker',
              'eyeWideLeft', 'eyeWideRight', 'browInnerUp', 'cheekSquintLeft'
            ].map(shape => (
              <div key={shape}>
                <label className="text-sm font-medium">{shape}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={blendShapes[shape as keyof FacialBlendShapes] || 0}
                  onChange={(e) => setBlendShapes(prev => ({
                    ...prev,
                    [shape]: parseFloat(e.target.value)
                  }))}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
