#!/bin/bash

echo "This script will update your Hume API key in .env.local"
echo ""
echo "Please paste your NEW Hume API key and press Enter:"
read -r NEW_KEY

if [ -z "$NEW_KEY" ]; then
    echo "Error: No key provided"
    exit 1
fi

# Backup the current .env.local
cp .env.local .env.local.backup

# Update the key in .env.local
if grep -q "REACT_APP_HUME_API_KEY=" .env.local; then
    # Key exists, update it
    sed -i '' "s/REACT_APP_HUME_API_KEY=.*/REACT_APP_HUME_API_KEY=$NEW_KEY/" .env.local
    echo "✅ Updated REACT_APP_HUME_API_KEY in .env.local"
else
    # Key doesn't exist, add it
    echo "REACT_APP_HUME_API_KEY=$NEW_KEY" >> .env.local
    echo "✅ Added REACT_APP_HUME_API_KEY to .env.local"
fi

echo ""
echo "✅ Done! Your new API key has been saved."
echo "📁 A backup of your old .env.local was saved as .env.local.backup"
echo ""
echo "⚠️  IMPORTANT: You need to restart your development server for the changes to take effect!"
echo "   1. Stop the current server (Ctrl+C)"
echo "   2. Run: npm start"
