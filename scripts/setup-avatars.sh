#!/bin/bash

# Create avatars directory if it doesn't exist
mkdir -p ../public/avatars

echo "🎭 Ready Player Me Avatar Setup"
echo "================================"
echo ""
echo "Downloading example avatars with mouth sync support..."
echo ""

# Example avatars with proper parameters for mouth sync
# These are public Ready Player Me avatars

# Avatar 1: Casual male
echo "📥 Downloading male avatar 1..."
curl -L "https://models.readyplayer.me/6729f9b9f1b7ba7b1e0f6b2a.glb?morphTargets=ARKit,Oculus%20Visemes&textureAtlas=1024&lod=0" \
  -o ../public/avatars/male_1_real.glb

# Avatar 2: Professional female  
echo "📥 Downloading female avatar 1..."
curl -L "https://models.readyplayer.me/6729fa1cf1b7ba7b1e0f6b2b.glb?morphTargets=ARKit,Oculus%20Visemes&textureAtlas=1024&lod=0" \
  -o ../public/avatars/female_1_real.glb

# Avatar 3: Casual avatar (bro style)
echo "📥 Downloading bro avatar..."
curl -L "https://models.readyplayer.me/64c3a4d2c91663ff12b6d6f5.glb?morphTargets=ARKit,Oculus%20Visemes&textureAtlas=1024&lod=0" \
  -o ../public/avatars/bro.glb

echo ""
echo "✅ Avatar download complete!"
echo ""
echo "To add your own avatars:"
echo "1. Go to https://readyplayer.me/avatar"
echo "2. Create your avatar"
echo "3. Use the RPM Avatar Helper page in the app to get the proper URL"
echo "4. Download and save to /public/avatars/"
