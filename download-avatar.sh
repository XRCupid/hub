#!/bin/bash

echo "🎭 Downloading Ready Player Me Avatar with mouth sync support..."
echo ""

# Create avatars directory if it doesn't exist
mkdir -p public/avatars

# Download a working RPM avatar with proper parameters
echo "📥 Downloading avatar..."
curl -L "https://models.readyplayer.me/64c3a4d2c91663ff12b6d6f5.glb?morphTargets=ARKit,Oculus%20Visemes&textureAtlas=1024&lod=0" \
  -o public/avatars/bro_rpm.glb

echo ""
echo "✅ Download complete!"
echo "📁 Avatar saved to: public/avatars/bro_rpm.glb"
echo ""
echo "You can now:"
echo "1. Visit /avatar-manager to manage avatars"
echo "2. Visit /simulation-test to test the avatar"
echo ""
