#!/bin/bash

echo "🚨 STARTING XRCUPID IN EMERGENCY LOW-MEMORY MODE"

# Kill any existing React processes
pkill -f "react-app-rewired" 2>/dev/null
pkill -f "node.*start" 2>/dev/null
sleep 2

# Copy emergency config
cp .env.development.emergency .env.development.local

# Limit Node.js memory and start with reduced features
export NODE_OPTIONS="--max-old-space-size=1024 --max-semi-space-size=128"
export FAST_REFRESH=false
export GENERATE_SOURCEMAP=false
export BROWSER_ARGS="--memory-pressure-off --max_old_space_size=512"

echo "📊 Starting with memory limits:"
echo "   Node.js: 1GB max"
echo "   Browser: 512MB max"
echo "   Source maps: Disabled"
echo "   Hot reload: Disabled"

# Start with reduced memory usage
npm start 2>&1 | tee emergency.log
