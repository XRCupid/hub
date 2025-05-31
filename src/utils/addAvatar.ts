#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

interface AvatarConfig {
  filename: string;
  name: string;
  npcId: string;
  age: number;
  occupation: string;
  personality: string;
  interests: string[];
  conversationStyle: string;
  systemPrompt: string;
  gender: 'male' | 'female' | 'neutral';
}

// Function to add avatar to all necessary files
export function addAvatarToPipeline(config: AvatarConfig) {
  const avatarPath = `/avatars/${config.filename}`;
  
  // 1. Update preloadedAvatars.ts
  const preloadedAvatarsPath = path.join(__dirname, '../data/preloadedAvatars.ts');
  let preloadedContent = fs.readFileSync(preloadedAvatarsPath, 'utf-8');
  
  const newAvatar = `  {
    "id": "${config.npcId}",
    "name": "${config.name}",
    "type": "${config.gender}",
    "path": "${avatarPath}",
    "originalUrl": "https://models.readyplayer.me/${config.npcId}.glb"
  }`;
  
  // Insert before the closing bracket
  preloadedContent = preloadedContent.replace(
    /(\s*}\s*\];)/,
    `,\n${newAvatar}\n$1`
  );
  
  fs.writeFileSync(preloadedAvatarsPath, preloadedContent);
  console.log('✓ Updated preloadedAvatars.ts');
  
  // 2. Update NPCPersonalities.ts
  const npcPersonalitiesPath = path.join(__dirname, '../config/NPCPersonalities.ts');
  let npcContent = fs.readFileSync(npcPersonalitiesPath, 'utf-8');
  
  const newNPC = `  "${config.npcId}": {
    id: "${config.npcId}",
    name: "${config.name}",
    age: ${config.age},
    occupation: "${config.occupation}",
    personality: "${config.personality}",
    interests: ${JSON.stringify(config.interests)},
    conversationStyle: "${config.conversationStyle}",
    systemPrompt: \`${config.systemPrompt}\`,
  },`;
  
  // Insert before the closing bracket
  npcContent = npcContent.replace(
    /(export const NPCPersonalities: Record<string, NPCPersonality> = {[\s\S]*?)(};)/,
    `$1\n${newNPC}\n$2`
  );
  
  fs.writeFileSync(npcPersonalitiesPath, npcContent);
  console.log('✓ Updated NPCPersonalities.ts');
  
  // 3. Update AvatarAutoGenerator.ts
  const avatarGeneratorPath = path.join(__dirname, '../services/AvatarAutoGenerator.ts');
  let generatorContent = fs.readFileSync(avatarGeneratorPath, 'utf-8');
  
  // Find the npcAvatarMap and add new mapping
  generatorContent = generatorContent.replace(
    /(const npcAvatarMap: Record<string, string> = {[\s\S]*?)(};)/,
    `$1      '${config.npcId}': '${avatarPath}',\n$2`
  );
  
  fs.writeFileSync(avatarGeneratorPath, generatorContent);
  console.log('✓ Updated AvatarAutoGenerator.ts');
  
  // 4. Update manifest.json
  const manifestPath = path.join(__dirname, '../../../public/avatars/manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  
  manifest.avatars.push({
    id: config.npcId,
    name: config.name,
    type: config.gender,
    path: avatarPath,
    originalUrl: `https://models.readyplayer.me/${config.npcId}.glb`
  });
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✓ Updated manifest.json');
  
  console.log(`\n✅ Successfully added ${config.name} to the dating simulation!`);
  console.log(`\nMake sure ${config.filename} is placed in /public/avatars/`);
}

// Example usage for "fool.glb"
if (require.main === module) {
  const foolConfig: AvatarConfig = {
    filename: 'fool.glb',
    name: 'Felix',
    npcId: 'playful-fool',
    age: 27,
    occupation: 'Stand-up Comedian & Content Creator',
    personality: 'Playful, witty, spontaneous',
    interests: ['Comedy', 'Improv', 'Video games', 'Memes'],
    conversationStyle: 'Humorous and unpredictable, loves making people laugh',
    systemPrompt: `You are Felix, a 27-year-old stand-up comedian and content creator. You're playful, witty, and love making people laugh. You see humor in everything and often use self-deprecating jokes. You're actually quite intelligent but hide it behind your goofy persona. You love puns, wordplay, and unexpected twists in conversation. You're looking for someone who appreciates your humor and can banter back. You ask funny hypothetical questions and love to keep things light and fun.`,
    gender: 'male'
  };
  
  addAvatarToPipeline(foolConfig);
}
