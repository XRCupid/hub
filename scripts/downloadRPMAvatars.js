const fs = require('fs');
const path = require('path');
const https = require('https');

// Define the avatars we want to preload
const AVATARS = [
  {
    id: '6729f9b9f1b7ba7b1e0f6b2a',
    name: 'male_1',
    type: 'male'
  },
  {
    id: '6729fa1cf1b7ba7b1e0f6b2b',
    name: 'female_1',
    type: 'female'
  },
  {
    id: '6729fa3ef1b7ba7b1e0f6b2c',
    name: 'male_2',
    type: 'male'
  },
  {
    id: '6729fa5df1b7ba7b1e0f6b2d',
    name: 'female_2',
    type: 'female'
  },
  {
    id: '6729fa7cf1b7ba7b1e0f6b2e',
    name: 'neutral_1',
    type: 'neutral'
  }
];

// Create avatars directory in public folder
const avatarsDir = path.join(__dirname, '..', 'public', 'avatars');
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

// Function to download a file
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

// Download all avatars
async function downloadAllAvatars() {
  console.log('Starting RPM avatar download...\n');
  
  const manifest = [];
  
  for (const avatar of AVATARS) {
    // Configure the avatar URL with all necessary parameters
    // Based on Ready Player Me API documentation
    const params = new URLSearchParams({
      'morphTargets': 'ARKit,Oculus Visemes',
      'textureAtlas': '1024',
      'pose': 'T',
      'lod': '0',
      'textureSizeLimit': '1024',
      'textureFormat': 'png',
      'meshLod': '0',
      'meshCompression': 'false',
      'useHands': 'true',
      'fingerSpacing': '0'
    });
    
    const url = `https://models.readyplayer.me/${avatar.id}.glb?${params.toString()}`;
    const filename = `${avatar.name}.glb`;
    const dest = path.join(avatarsDir, filename);
    
    console.log(`Downloading ${avatar.name}...`);
    console.log(`URL: ${url}`);
    
    try {
      await downloadFile(url, dest);
      console.log(`✓ Downloaded ${avatar.name}`);
      
      // Add to manifest
      manifest.push({
        id: avatar.id,
        name: avatar.name,
        type: avatar.type,
        path: `/avatars/${filename}`,
        originalUrl: `https://models.readyplayer.me/${avatar.id}.glb`
      });
    } catch (error) {
      console.error(`✗ Failed to download ${avatar.name}:`, error.message);
    }
  }
  
  // Save manifest
  const manifestPath = path.join(avatarsDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('\n✓ Avatar manifest saved to public/avatars/manifest.json');
  
  // Create TypeScript types
  const typesContent = `// Auto-generated avatar types
export interface PreloadedAvatar {
  id: string;
  name: string;
  type: 'male' | 'female' | 'neutral';
  path: string;
  originalUrl: string;
}

export const PRELOADED_AVATARS: PreloadedAvatar[] = ${JSON.stringify(manifest, null, 2)};
`;
  
  const typesPath = path.join(__dirname, '..', 'src', 'data', 'preloadedAvatars.ts');
  const dataDir = path.join(__dirname, '..', 'src', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(typesPath, typesContent);
  console.log('✓ TypeScript types generated at src/data/preloadedAvatars.ts');
}

// Run the download
downloadAllAvatars().catch(console.error);
