import React, { useState, useEffect } from 'react';
import { NPCPersonalities } from '../config/NPCPersonalities';
import { PRELOADED_AVATARS } from '../data/preloadedAvatars';

interface NPCFormData {
  filename: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'neutral';
  occupation: string;
  personality: string;
  interests: string;
  conversationStyle: string;
  systemPrompt: string;
}

export function NPCIntegrationPanel() {
  const [npcForm, setNpcForm] = useState<NPCFormData>({
    filename: '',
    name: '',
    age: 25,
    gender: 'female',
    occupation: '',
    personality: '',
    interests: '',
    conversationStyle: '',
    systemPrompt: ''
  });
  
  const [npcList, setNpcList] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const [generatedConfig, setGeneratedConfig] = useState<any>(null);

  useEffect(() => {
    loadNPCList();
  }, []);

  const loadNPCList = () => {
    const npcs = Object.entries(NPCPersonalities).map(([id, npc]) => ({
      ...npc,
      npcId: id,
      avatarPath: PRELOADED_AVATARS.find(a => a.name === npc.name)?.path || 'Not assigned'
    }));
    setNpcList(npcs);
  };

  const handleInputChange = (field: keyof NPCFormData, value: any) => {
    setNpcForm(prev => ({ ...prev, [field]: value }));
  };

  const generateNPCConfig = () => {
    setStatus('Generating configuration...');
    
    // Validate
    if (!npcForm.filename || !npcForm.name) {
      setStatus('Error: Filename and name are required!');
      return;
    }
    
    // Generate NPC ID
    const npcId = npcForm.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString().slice(-4);
    
    // Parse interests
    const interests = npcForm.interests.split(',').map(i => i.trim()).filter(i => i);
    
    // Generate system prompt if not provided
    const systemPrompt = npcForm.systemPrompt || 
      `You are ${npcForm.name}, a ${npcForm.age}-year-old ${npcForm.occupation}. You're ${npcForm.personality}. ${npcForm.conversationStyle}. Be authentic and engaging in your responses.`;
    
    const config = {
      npcId,
      preloadedAvatar: {
        id: npcId,
        name: npcForm.name,
        type: npcForm.gender,
        path: `/avatars/${npcForm.filename}`,
        originalUrl: `https://models.readyplayer.me/${npcId}.glb`
      },
      npcPersonality: {
        [`"${npcId}"`]: {
          id: `"${npcId}"`,
          name: `"${npcForm.name}"`,
          age: npcForm.age,
          occupation: `"${npcForm.occupation}"`,
          personality: `"${npcForm.personality}"`,
          interests: interests.map(i => `"${i}"`),
          conversationStyle: `"${npcForm.conversationStyle}"`,
          systemPrompt: `\`${systemPrompt}\``
        }
      },
      avatarMapping: `'${npcId}': '/avatars/${npcForm.filename}'`
    };
    
    setGeneratedConfig(config);
    setStatus('Configuration generated! Copy the code below to the appropriate files.');
    
    // Log to console
    console.log('=== NPC Configuration Generated ===');
    console.log('\n1. Add to src/data/preloadedAvatars.ts:');
    console.log(JSON.stringify(config.preloadedAvatar, null, 2));
    console.log('\n2. Add to src/config/NPCPersonalities.ts:');
    console.log(JSON.stringify(config.npcPersonality, null, 2).replace(/"/g, ''));
    console.log('\n3. Add to src/services/AvatarAutoGenerator.ts npcAvatarMap:');
    console.log(config.avatarMapping);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setStatus('Copied to clipboard!');
    setTimeout(() => setStatus(''), 2000);
  };

  return (
    <div className="npc-integration-panel">
      <div className="npc-form" style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h3>Add New NPC to Dating Simulation</h3>
        
        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label>Avatar Filename:</label>
            <input
              type="text"
              value={npcForm.filename}
              onChange={(e) => handleInputChange('filename', e.target.value)}
              placeholder="avatar.glb"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
          
          <div>
            <label>Character Name:</label>
            <input
              type="text"
              value={npcForm.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Sarah"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
          
          <div>
            <label>Age:</label>
            <input
              type="number"
              value={npcForm.age}
              onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 25)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
          
          <div>
            <label>Gender:</label>
            <select
              value={npcForm.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="neutral">Neutral</option>
            </select>
          </div>
          
          <div>
            <label>Occupation:</label>
            <input
              type="text"
              value={npcForm.occupation}
              onChange={(e) => handleInputChange('occupation', e.target.value)}
              placeholder="Software Engineer"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
          
          <div>
            <label>Personality:</label>
            <input
              type="text"
              value={npcForm.personality}
              onChange={(e) => handleInputChange('personality', e.target.value)}
              placeholder="Friendly, outgoing, creative"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
          
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Interests (comma-separated):</label>
            <input
              type="text"
              value={npcForm.interests}
              onChange={(e) => handleInputChange('interests', e.target.value)}
              placeholder="Music, Travel, Photography, Cooking"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
          
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Conversation Style:</label>
            <input
              type="text"
              value={npcForm.conversationStyle}
              onChange={(e) => handleInputChange('conversationStyle', e.target.value)}
              placeholder="Playful banter with deep questions"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
          
          <div style={{ gridColumn: '1 / -1' }}>
            <label>System Prompt (optional):</label>
            <textarea
              value={npcForm.systemPrompt}
              onChange={(e) => handleInputChange('systemPrompt', e.target.value)}
              placeholder="Leave empty for auto-generated prompt"
              style={{ width: '100%', padding: '8px', minHeight: '100px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
        </div>
        
        <button 
          onClick={generateNPCConfig}
          style={{ 
            marginTop: '15px', 
            padding: '10px 20px', 
            backgroundColor: '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Generate NPC Configuration
        </button>
        
        {status && (
          <div style={{ 
            marginTop: '10px', 
            padding: '10px', 
            backgroundColor: status.includes('Error') ? '#ffebee' : '#e8f5e9', 
            borderRadius: '4px',
            color: status.includes('Error') ? '#c62828' : '#2e7d32'
          }}>
            {status}
          </div>
        )}
      </div>

      {generatedConfig && (
        <div className="generated-config" style={{ marginBottom: '30px' }}>
          <h3>Generated Configuration</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <h4>1. Add to preloadedAvatars.ts:</h4>
            <pre style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '4px', overflow: 'auto' }}>
              {JSON.stringify(generatedConfig.preloadedAvatar, null, 2)}
            </pre>
            <button 
              onClick={() => copyToClipboard(JSON.stringify(generatedConfig.preloadedAvatar, null, 2))}
              style={{ marginTop: '5px', padding: '5px 10px' }}
            >
              Copy
            </button>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <h4>2. Add to NPCPersonalities.ts:</h4>
            <pre style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '4px', overflow: 'auto' }}>
              {JSON.stringify(generatedConfig.npcPersonality, null, 2).replace(/\\"/g, '"').replace(/"/g, '')}
            </pre>
            <button 
              onClick={() => copyToClipboard(JSON.stringify(generatedConfig.npcPersonality, null, 2).replace(/\\"/g, '"').replace(/"/g, ''))}
              style={{ marginTop: '5px', padding: '5px 10px' }}
            >
              Copy
            </button>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <h4>3. Add to AvatarAutoGenerator.ts npcAvatarMap:</h4>
            <pre style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '4px' }}>
              {generatedConfig.avatarMapping}
            </pre>
            <button 
              onClick={() => copyToClipboard(generatedConfig.avatarMapping)}
              style={{ marginTop: '5px', padding: '5px 10px' }}
            >
              Copy
            </button>
          </div>
        </div>
      )}
      
      <div className="existing-npcs">
        <h3>Existing NPCs in Dating Simulation</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Name</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Age</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Occupation</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Personality</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Avatar Path</th>
              </tr>
            </thead>
            <tbody>
              {npcList.map((npc) => (
                <tr key={npc.npcId} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>{npc.name}</td>
                  <td style={{ padding: '10px' }}>{npc.age}</td>
                  <td style={{ padding: '10px' }}>{npc.occupation}</td>
                  <td style={{ padding: '10px', fontSize: '14px' }}>{npc.personality}</td>
                  <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '12px' }}>{npc.avatarPath}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
