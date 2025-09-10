#!/bin/bash

# X402 End-to-End Test Stop Script
# This script stops all services

echo "🛑 Stopping X402 End-to-End Test Environment"
echo "============================================="

# Function to stop services on specific ports
stop_port() {
    local port=$1
    local name=$2
    
    echo "🔍 Looking for services on port $port..."
    
    # Find processes using the port
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ -n "$pids" ]; then
        echo "🛑 Stopping $name on port $port (PIDs: $pids)..."
        echo $pids | xargs kill -9 2>/dev/null
        echo "✅ $name stopped"
    else
        echo "ℹ️  No services found on port $port"
    fi
}

# Stop all services
stop_port 3000 "Facilitator Server"
stop_port 3001 "Provider Server" 
stop_port 8000 "Web Client"

# Also stop any remaining Node.js processes related to our services
echo ""
echo "🔍 Looking for remaining Node.js processes..."
pkill -f "tsx.*index.ts" 2>/dev/null && echo "✅ Stopped tsx processes"
pkill -f "python3.*http.server.*8000" 2>/dev/null && echo "✅ Stopped Python HTTP server"

# Kill any remaining Python HTTP servers on port 8000
echo ""
echo "🔍 Looking for any remaining Python HTTP servers..."
PYTHON_PIDS=$(lsof -ti:8000 2>/dev/null | xargs ps -p 2>/dev/null | grep "python.*http.server" | awk '{print $1}' 2>/dev/null)
if [ -n "$PYTHON_PIDS" ]; then
    echo "🛑 Killing remaining Python HTTP servers: $PYTHON_PIDS"
    echo $PYTHON_PIDS | xargs kill -9 2>/dev/null
    echo "✅ Cleaned up Python HTTP servers"
fi

echo ""
echo "✅ All services stopped!"
echo "========================"

