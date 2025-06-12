const https = require('https');
const fs = require('fs');
const path = require('path');

// Example Ready Player Me avatar URLs with proper parameters for mouth sync
const avatarUrls = [
  {
    name: 'male_1.glb',
    url: 'https://models.readyplayer.me/64c3a4a5c91663ff12b6d6f1.glb?morphTargets=ARKit,Oculus%20Visemes&textureAtlas=1024&lod=0'
  },
  {
    name: 'female_1.glb', 
    url: 'https://models.readyplayer.me/64c3a4b8c91663ff12b6d6f3.glb?morphTargets=ARKit,Oculus%20Visemes&textureAtlas=1024&lod=0'
  },
  {
    name: 'bro.glb',
    url: 'https://models.readyplayer.me/64c3a4d2c91663ff12b6d6f5.glb?morphTargets=ARKit,Oculus%20Visemes&textureAtlas=1024&lod=0'
  }
];

const downloadAvatar = (url, filename) => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, '..', 'public', 'avatars', filename);
    const file = fs.createWriteStream(filePath);

    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded: ${filename}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {});
      console.error(`❌ Error downloading ${filename}:`, err.message);
      reject(err);
    });
  });
};

async function downloadAllAvatars() {
  console.log('🚀 Starting Ready Player Me avatar downloads...\n');
  
  // Ensure avatars directory exists
  const avatarsDir = path.join(__dirname, '..', 'public', 'avatars');
  if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
  }

  for (const avatar of avatarUrls) {
    try {
      await downloadAvatar(avatar.url, avatar.name);
    } catch (error) {
      console.error(`Failed to download ${avatar.name}`);
    }
  }

  console.log('\n✨ Avatar download complete!');
  console.log('\nNOTE: These are example URLs. To use your own avatars:');
  console.log('1. Go to https://readyplayer.me/avatar');
  console.log('2. Create your avatar');
  console.log('3. Copy the avatar ID from the URL');
  console.log('4. Replace the IDs in this script');
  console.log('5. Make sure to include morphTargets=ARKit,Oculus%20Visemes in the URL');
}

downloadAllAvatars();
