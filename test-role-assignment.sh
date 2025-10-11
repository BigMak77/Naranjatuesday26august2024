#!/bin/bash

echo "🚀 Starting Naranja Role Assignment Test Suite"
echo "=============================================="

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found!"
    echo "Please create .env.local with your Supabase credentials"
    exit 1
fi

echo "📋 Starting development server..."
echo "   (This will run in the background)"

# Start dev server in background
npm run dev > dev-server.log 2>&1 &
DEV_PID=$!

echo "   Development server PID: $DEV_PID"
echo "   Waiting 5 seconds for server to start..."
sleep 5

echo ""
echo "🧪 Running role assignment API test..."
echo "======================================"

# Run the test
node scripts/test-update-role-api.js

echo ""
echo "📊 Test completed!"
echo ""
echo "🛑 Stopping development server..."
kill $DEV_PID 2>/dev/null

echo "✅ All done! Check the results above."
