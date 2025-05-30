import React, { useState, useEffect } from 'react';
import { VoiceProvider, useVoice } from '@humeai/voice-react';
import { NPCPersonalities, NPCPersonality, getRandomNPC } from '../config/NPCPersonalities';

interface HumeNPCManagerProps {
  npcId: string;
  onPersonalityChange?: (npc: NPCPersonality) => void;
}

// Inner component that uses the voice hook
const HumeNPCInterface: React.FC<{
  npc: NPCPersonality;
  onChangeNPC: (npcId: string) => void;
}> = ({ npc, onChangeNPC }) => {
  const { connect, disconnect, status, sendSessionSettings } = useVoice();

  // Update system prompt when NPC changes
  useEffect(() => {
    if (status.value === 'connected' && sendSessionSettings) {
      // Send the new system prompt as a session setting
      sendSessionSettings({
        systemPrompt: npc.systemPrompt
      });
    }
  }, [npc, status, sendSessionSettings]);

  return (
    <div className="hume-npc-interface">
      <div className="npc-selector">
        <label>Current NPC: {npc.name}</label>
        <select 
          value={npc.id} 
          onChange={(e) => onChangeNPC(e.target.value)}
        >
          {Object.entries(NPCPersonalities).map(([id, personality]) => (
            <option key={id} value={id}>
              {personality.name} - {personality.personality}
            </option>
          ))}
        </select>
      </div>
      
      <div className="npc-info">
        <h3>{npc.name}, {npc.age}</h3>
        <p>{npc.occupation}</p>
        <p>Personality: {npc.personality}</p>
        <p>Conversation Style: {npc.conversationStyle}</p>
      </div>

      <div className="voice-controls">
        {status.value === 'connected' ? (
          <button onClick={() => disconnect()}>Disconnect</button>
        ) : (
          <button onClick={() => connect()}>Connect</button>
        )}
        <span>Status: {status.value}</span>
      </div>
    </div>
  );
};

export const HumeNPCManager: React.FC<HumeNPCManagerProps> = ({ 
  npcId, 
  onPersonalityChange 
}) => {
  const [currentNPC, setCurrentNPC] = useState<NPCPersonality>(
    NPCPersonalities[npcId] || Object.values(NPCPersonalities)[0]
  );

  const updateHumePersonality = (newNpcId: string) => {
    const newNPC = NPCPersonalities[newNpcId];
    if (newNPC) {
      setCurrentNPC(newNPC);
      onPersonalityChange?.(newNPC);
    }
  };

  // Since VoiceProvider is already in App.js, we don't need to wrap it here
  // Just use the voice context
  return (
    <HumeNPCInterface 
      npc={currentNPC} 
      onChangeNPC={updateHumePersonality}
    />
  );
};

export default HumeNPCManager;
