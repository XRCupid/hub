#!/bin/bash

# Setup script for XRCupid animation library
# Creates the most performant animation setup for production

echo "🎬 Setting up XRCupid Animation Library..."

# Create animation directories
mkdir -p public/assets/animations
mkdir -p src/data/animations

# Create animation manifest
cat > src/data/animations/manifest.json << 'EOF'
{
  "version": "1.0.0",
  "animations": {
    "core": {
      "greeting_wave": {
        "description": "Friendly wave for initial greetings",
        "duration": 2.0,
        "tags": ["greeting", "friendly", "opener"]
      },
      "flirty_hair_flip": {
        "description": "Playful hair flip showing interest",
        "duration": 2.5,
        "tags": ["flirty", "playful", "interest"]
      },
      "confident_stance": {
        "description": "Power pose showing confidence",
        "duration": 3.0,
        "tags": ["confident", "strong", "assured"]
      },
      "nervous_fidget": {
        "description": "Subtle fidgeting showing nervousness",
        "duration": 2.0,
        "tags": ["nervous", "anxious", "uncertain"]
      },
      "interested_lean": {
        "description": "Leaning forward showing engagement",
        "duration": 3.0,
        "tags": ["interested", "engaged", "attentive"]
      },
      "genuine_laugh": {
        "description": "Natural laughter response",
        "duration": 2.5,
        "tags": ["happy", "joyful", "responsive"]
      }
    },
    "subtle": {
      "subtle_smile": {
        "description": "Gentle smile reaction",
        "duration": 1.5,
        "tags": ["happy", "pleased", "subtle"]
      },
      "thoughtful_nod": {
        "description": "Understanding nod",
        "duration": 1.0,
        "tags": ["understanding", "agreement", "listening"]
      },
      "playful_wink": {
        "description": "Quick playful wink",
        "duration": 0.8,
        "tags": ["flirty", "playful", "quick"]
      }
    },
    "idle": {
      "idle_relaxed": {
        "description": "Relaxed idle state",
        "duration": 4.0,
        "tags": ["idle", "relaxed", "neutral"]
      },
      "idle_engaged": {
        "description": "Engaged idle state",
        "duration": 4.0,
        "tags": ["idle", "attentive", "ready"]
      }
    }
  }
}
EOF

# Create placeholder animation files (for testing)
echo "📁 Creating placeholder animations..."
for anim in greeting_wave flirty_hair_flip confident_stance nervous_fidget interested_lean genuine_laugh subtle_smile thoughtful_nod playful_wink idle_relaxed idle_engaged; do
  # Create empty FBX placeholder
  touch "public/assets/animations/${anim}.fbx"
  echo "  ✓ Created ${anim}.fbx"
done

# Download some actual free animations from Mixamo (if available)
echo ""
echo "🎯 Next Steps:"
echo "1. Go to https://www.krikey.ai/ai-for-animation"
echo "2. Create these animations:"
echo "   - Greeting wave (2 seconds)"
echo "   - Flirty hair flip (2.5 seconds)"
echo "   - Confident power pose (3 seconds)"
echo "   - Nervous fidgeting (2 seconds)"
echo "   - Interested lean forward (3 seconds)"
echo "   - Natural laugh (2.5 seconds)"
echo "   - Subtle smile (1.5 seconds)"
echo "   - Thoughtful nod (1 second)"
echo "   - Playful wink (0.8 seconds)"
echo "   - Relaxed idle (4 seconds, looping)"
echo "   - Engaged idle (4 seconds, looping)"
echo ""
echo "3. Export each as FBX and save to: public/assets/animations/"
echo "4. Test with: npm start"
echo ""
echo "💡 Pro tip: Use Ready Player Me avatars in Krikey for consistency!"

# Make script executable
chmod +x scripts/setup-animations.sh
