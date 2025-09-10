#!/bin/bash

# Quick script to kill processes on port 8000
echo "🔍 Looking for processes on port 8000..."

PIDS=$(lsof -ti:8000 2>/dev/null)

if [ -n "$PIDS" ]; then
    echo "🛑 Found processes on port 8000: $PIDS"
    echo $PIDS | xargs kill -9 2>/dev/null
    echo "✅ Killed processes on port 8000"
else
    echo "ℹ️  No processes found on port 8000"
fi

# Double check
sleep 1
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "❌ Port 8000 is still in use"
    exit 1
else
    echo "✅ Port 8000 is now free"
fi
