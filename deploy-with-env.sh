#!/bin/bash

# Deploy script that ensures environment variables are properly included in the build

echo "🚀 XRCupid Deployment Script"
echo "============================"

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found!"
    echo "Please create .env.production with your Hume API credentials."
    exit 1
fi

# Check if required environment variables are in .env.production
echo "📋 Checking .env.production for required variables..."
REQUIRED_VARS=("REACT_APP_HUME_API_KEY" "REACT_APP_HUME_SECRET_KEY" "REACT_APP_HUME_CONFIG_ID")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^$var=" .env.production; then
        MISSING_VARS+=($var)
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo "❌ Error: Missing required environment variables in .env.production:"
    printf '%s\n' "${MISSING_VARS[@]}"
    echo ""
    echo "Please add these to your .env.production file."
    exit 1
fi

echo "✅ All required environment variables found!"

# Build the app with production environment
echo ""
echo "🔨 Building app with production environment..."
NODE_ENV=production npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build completed successfully!"

# Deploy to GitHub Pages
echo ""
echo "📤 Deploying to GitHub Pages..."
npm run deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "🌐 Your app should be live at: https://xrcupid.github.io/hub/"
    echo ""
    echo "🔍 Debug URLs:"
    echo "   - Environment Check: https://xrcupid.github.io/hub/env-check"
    echo "   - Hume Connection Debug: https://xrcupid.github.io/hub/hume-debug"
    echo "   - Coach Grace: https://xrcupid.github.io/hub/coach-call/grace"
else
    echo "❌ Deployment failed!"
    exit 1
fi
