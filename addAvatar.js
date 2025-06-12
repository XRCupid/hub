#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: node addAvatar.js <filename> <name> [options]');
  console.log('Example: node addAvatar.js fool.glb Felix');
  console.log('\nOptions:');
  console.log('  --age <number>         Age of the character (default: 25)');
  console.log('  --gender <m|f|n>       Gender: m=male, f=female, n=neutral (default: based on name)');
  console.log('  --occupation <string>  Job/occupation (default: "Creative Professional")');
  console.log('  --personality <string> Personality traits (default: "Friendly and engaging")');
  process.exit(1);
}

const filename = args[0];
const name = args[1];

// Parse optional arguments
let age = 25;
let gender = 'neutral';
let occupation = 'Creative Professional';
let personality = 'Friendly and engaging';

for (let i = 2; i < args.length; i += 2) {
  switch (args[i]) {
    case '--age':
      age = parseInt(args[i + 1]) || 25;
      break;
    case '--gender':
      gender = args[i + 1] === 'm' ? 'male' : args[i + 1] === 'f' ? 'female' : 'neutral';
      break;
    case '--occupation':
      occupation = args[i + 1];
      break;
    case '--personality':
      personality = args[i + 1];
      break;
  }
}

// Generate NPC ID from name
const npcId = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString().slice(-4);

console.log(`\nAdding avatar: ${filename}`);
console.log(`Character name: ${name}`);
console.log(`NPC ID: ${npcId}`);
console.log(`Gender: ${gender}`);
console.log(`Age: ${age}`);
console.log(`Occupation: ${occupation}\n`);

// 1. Update preloadedAvatars.ts
try {
  const preloadedPath = path.join(__dirname, 'src/data/preloadedAvatars.ts');
  let content = fs.readFileSync(preloadedPath, 'utf-8');
  
  const newEntry = `  {
    "id": "${npcId}",
    "name": "${name}",
    "type": "${gender}",
    "path": "/avatars/${filename}",
    "originalUrl": "https://models.readyplayer.me/${npcId}.glb"
  }`;
  
  // Add before the last closing bracket
  content = content.replace(/(\s*}\s*\];)/, `,\n${newEntry}\n$1`);
  fs.writeFileSync(preloadedPath, content);
  console.log('✓ Updated preloadedAvatars.ts');
} catch (e) {
  console.error('✗ Failed to update preloadedAvatars.ts:', e.message);
}

// 2. Update NPCPersonalities.ts
try {
  const npcPath = path.join(__dirname, 'src/config/NPCPersonalities.ts');
  let content = fs.readFileSync(npcPath, 'utf-8');
  
  const interests = personality.toLowerCase().includes('playful') 
    ? ['Games', 'Comedy', 'Music', 'Adventures']
    : ['Art', 'Culture', 'Travel', 'Philosophy'];
  
  const newEntry = `  "${npcId}": {
    id: "${npcId}",
    name: "${name}",
    age: ${age},
    occupation: "${occupation}",
    personality: "${personality}",
    interests: ${JSON.stringify(interests)},
    conversationStyle: "Engaging and ${personality.toLowerCase()}",
    systemPrompt: \`You are ${name}, a ${age}-year-old ${occupation}. You're ${personality.toLowerCase()}. You enjoy meaningful conversations and connecting with people. Be authentic and engaging in your responses.\`,
  },`;
  
  // Find the last entry and add after it
  const lastEntry = content.lastIndexOf('},');
  if (lastEntry !== -1) {
    content = content.slice(0, lastEntry + 2) + '\n  \n' + newEntry + content.slice(lastEntry + 2);
    fs.writeFileSync(npcPath, content);
    console.log('✓ Updated NPCPersonalities.ts');
  }
} catch (e) {
  console.error('✗ Failed to update NPCPersonalities.ts:', e.message);
}

// 3. Update AvatarAutoGenerator.ts
try {
  const generatorPath = path.join(__dirname, 'src/services/AvatarAutoGenerator.ts');
  let content = fs.readFileSync(generatorPath, 'utf-8');
  
  // Find npcAvatarMap and add new entry
  const mapMatch = content.match(/(const npcAvatarMap: Record<string, string> = {[\s\S]*?)(};)/);
  if (mapMatch) {
    const newMapping = `      '${npcId}': '/avatars/${filename}',`;
    content = content.replace(
      mapMatch[0],
      mapMatch[1] + newMapping + '\n' + mapMatch[2]
    );
    fs.writeFileSync(generatorPath, content);
    console.log('✓ Updated AvatarAutoGenerator.ts');
  }
} catch (e) {
  console.error('✗ Failed to update AvatarAutoGenerator.ts:', e.message);
}

// 4. Update manifest.json
try {
  const manifestPath = path.join(__dirname, 'public/avatars/manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  
  manifest.avatars.push({
    id: npcId,
    name: name,
    type: gender,
    path: `/avatars/${filename}`,
    originalUrl: `https://models.readyplayer.me/${npcId}.glb`
  });
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✓ Updated manifest.json');
} catch (e) {
  console.error('✗ Failed to update manifest.json:', e.message);
}

console.log(`\n✅ Successfully added ${name} to the dating simulation!`);
console.log(`\n⚠️  Make sure to:`);
console.log(`1. Place ${filename} in /public/avatars/`);
console.log(`2. Restart the development server`);
console.log(`3. ${name} will appear in the Dating Simulation with ID: ${npcId}`);
