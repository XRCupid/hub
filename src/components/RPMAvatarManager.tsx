import React, { useState, useEffect, FC, useLayoutEffect } from 'react';
import { ReadyPlayerMeService } from '../services/readyPlayerMeService';

interface StoredAvatar {
  id: string;
  url: string;
  imageUrl: string;
  gender: 'male' | 'female';
  createdAt: string;
}

interface RPMAvatarManagerProps {
  onAvatarCreated?: (avatar: StoredAvatar) => void;
}

export const RPMAvatarManager: React.FC<RPMAvatarManagerProps> = ({ onAvatarCreated }) => {
  const [showCreator, setShowCreator] = useState(false);
  const [storedAvatars, setStoredAvatars] = useState<StoredAvatar[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const rpmService = new ReadyPlayerMeService({
    subdomain: process.env.REACT_APP_RPM_SUBDOMAIN || 'xr-cupid',
    appId: process.env.REACT_APP_RPM_APP_ID
  });

  useEffect(() => {
    // Load stored avatars from localStorage
    const saved = localStorage.getItem('rpm_avatars');
    if (saved) {
      setStoredAvatars(JSON.parse(saved));
    }
  }, []);

  const handleAvatarCreated = (avatarUrl: string) => {
    console.log('handleAvatarCreated called with:', avatarUrl);
    
    const newAvatar: StoredAvatar = {
      id: `avatar_${Date.now()}`,
      url: avatarUrl,
      imageUrl: avatarUrl.replace('.glb', '.png'),
      gender: 'male', // Default, could be determined from avatar data
      createdAt: new Date().toISOString()
    };

    const updatedAvatars = [...storedAvatars, newAvatar];
    console.log('Updating avatars:', updatedAvatars);
    
    setStoredAvatars(updatedAvatars);
    localStorage.setItem('rpm_avatars', JSON.stringify(updatedAvatars));
    
    if (onAvatarCreated) {
      onAvatarCreated(newAvatar);
    }
    
    setShowCreator(false);
    setIsCreating(false);
    
    // Force a re-render by reading from localStorage
    const saved = localStorage.getItem('rpm_avatars');
    if (saved) {
      setStoredAvatars(JSON.parse(saved));
    }
  };

  const createPresetAvatars = async () => {
    setIsCreating(true);
    
    // Create a set of preset avatars using the iframe in hidden mode
    const presets = [
      { gender: 'male', name: 'Alex' },
      { gender: 'female', name: 'Jordan' },
      { gender: 'male', name: 'River' },
      { gender: 'female', name: 'Sam' }
    ];

    // For now, use the manual creation flow
    alert('Please create avatars using the "Create New Avatar" button. Create diverse avatars for the best experience!');
    setIsCreating(false);
  };

  // Set up message listener when component mounts and creator is shown
  React.useEffect(() => {
    if (showCreator) {
      const handleMessage = (event: MessageEvent) => {
        try {
          console.log('Received message:', event.data);
          
          // Check if the message is a direct URL string
          if (typeof event.data === 'string' && event.data.includes('readyplayer.me') && event.data.endsWith('.glb')) {
            console.log('Avatar URL received:', event.data);
            handleAvatarCreated(event.data);
            return;
          }
          
          // Try to parse as JSON
          const json = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          
          // Check for Ready Player Me avatar export
          if (json?.source === 'readyplayerme' && json.eventName === 'v1.avatar.exported') {
            console.log('Avatar exported:', json.data.url);
            handleAvatarCreated(json.data.url);
          }
        } catch (error) {
          console.log('Message parsing error:', error);
        }
      };

      window.addEventListener('message', handleMessage);
      
      return () => {
        window.removeEventListener('message', handleMessage);
      };
    }
  }, [showCreator, handleAvatarCreated]);

  return (
    <div className="rpm-avatar-manager">
      <div className="p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">RPM Avatar Management</h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Stored Avatars: {storedAvatars.length}
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreator(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Create New Avatar
            </button>
            
            {storedAvatars.length === 0 && (
              <button
                onClick={createPresetAvatars}
                disabled={isCreating}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Initialize Preset Avatars'}
              </button>
            )}
          </div>
        </div>

        {storedAvatars.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {storedAvatars.map((avatar) => (
              <div key={avatar.id} className="border rounded p-2">
                <img 
                  src={avatar.imageUrl} 
                  alt="Avatar"
                  className="w-full h-24 object-cover rounded"
                  onError={(e) => {
                    e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatar.id}`;
                  }}
                />
                <p className="text-xs mt-1 truncate">{avatar.id}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-4xl h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create RPM Avatar</h2>
              <button
                onClick={() => setShowCreator(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <iframe
              src={`https://${process.env.REACT_APP_RPM_SUBDOMAIN || 'xr-cupid'}.readyplayer.me/avatar?frameApi=true`}
              className="w-full h-[calc(100%-60px)] border-0"
              allow="camera *; microphone *; clipboard-write"
            />
            
            <div className="mt-2 text-center">
              <button
                onClick={() => {
                  // Manual save for testing
                  const testUrl = prompt('Enter avatar URL (or leave empty for test):');
                  if (testUrl || testUrl === '') {
                    const url = testUrl || 'https://models.readyplayer.me/6838b7c236d1373c05d519f0.glb';
                    handleAvatarCreated(url);
                  }
                }}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Manual Save (Testing)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
