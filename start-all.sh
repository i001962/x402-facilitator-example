#!/bin/bash

# X402 End-to-End Test Startup Script
# This script starts all three services needed for testing

echo "🚀 Starting X402 End-to-End Test Environment"
echo "=============================================="

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "❌ Port $1 is already in use"
        return 1
    else
        echo "✅ Port $1 is available"
        return 0
    fi
}

# Function to start a service in background
start_service() {
    local name=$1
    local dir=$2
    local port=$3
    local command=$4
    
    echo ""
    echo "🔧 Starting $name on port $port..."
    
    if [ -d "$dir" ]; then
        cd "$dir"
        if [ -f "package.json" ]; then
            # Install dependencies if needed
            if [ ! -d "node_modules" ]; then
                echo "📦 Installing dependencies for $name..."
                npm install
            fi
            
            # Start the service
            echo "▶️  Running: $command"
            eval "$command" &
            local pid=$!
            echo "✅ $name started with PID $pid"
            
            # Wait a moment for the service to start
            sleep 2
            
            # Check if the service is actually running
            if kill -0 $pid 2>/dev/null; then
                echo "✅ $name is running successfully"
            else
                echo "❌ $name failed to start"
                return 1
            fi
        else
            echo "❌ No package.json found in $dir"
            return 1
        fi
    else
        echo "❌ Directory $dir not found"
        return 1
    fi
}

# Check if ports are available
echo ""
echo "🔍 Checking port availability..."
check_port 3000 || exit 1
check_port 3001 || exit 1
check_port 8000 || exit 1

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Start Facilitator Server (port 3000)
start_service "Facilitator Server" "$SCRIPT_DIR" 3000 "npm run dev"

# Start Provider Server (port 3001)
FACILITATOR_URL=${FACILITATOR_URL:-"http://localhost:3000"}
ADDRESS=${ADDRESS:-"0xAbEa4e7a139FAdBDb2B76179C24f0ff76753C800"}
NETWORK=${NETWORK:-"base"}
REVNET_PROJECT_ID=${REVNET_PROJECT_ID:-"127"}
USDC_CONTRACT_ADDRESS=${USDC_CONTRACT_ADDRESS:-"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"}
WEB_CLIENT_URL=${WEB_CLIENT_URL:-"http://localhost:8000"}

start_service "Provider Server" "$SCRIPT_DIR/examples/servers/express-basic" 3001 "FACILITATOR_URL=$FACILITATOR_URL ADDRESS=$ADDRESS NETWORK=$NETWORK REVNET_PROJECT_ID=$REVNET_PROJECT_ID USDC_CONTRACT_ADDRESS=$USDC_CONTRACT_ADDRESS WEB_CLIENT_URL=$WEB_CLIENT_URL npm run dev"

# Start Web Client (port 8000)
echo ""
echo "🔧 Starting Web Client on port 8000..."
cd "$SCRIPT_DIR/public"
if [ -f "index.html" ]; then
    python3 -m http.server 8000 &
    WEB_CLIENT_PID=$!
    echo "✅ Web Client started with PID $WEB_CLIENT_PID"
    sleep 2
    if kill -0 $WEB_CLIENT_PID 2>/dev/null; then
        echo "✅ Web Client is running successfully"
    else
        echo "❌ Web Client failed to start"
    fi
else
    echo "❌ index.html not found in public directory"
fi

echo ""
echo "🎉 All services started!"
echo "========================"
echo ""
echo "📋 Service URLs:"
echo "  🔗 Facilitator:  $FACILITATOR_URL"
echo "  🔗 Provider:     http://localhost:3001"
echo "  🔗 Web Client:   $WEB_CLIENT_URL"
echo ""
echo "🧪 Test URLs:"
echo "  🏥 Health Check: $FACILITATOR_URL/health"
echo "  🏥 Provider Health: http://localhost:3001/health"
echo "  💰 Weather API: http://localhost:3001/weather"
echo ""
echo "📱 To test the complete flow:"
echo "  1. Open $WEB_CLIENT_URL in your browser"
echo "  2. Connect your MetaMask wallet"
echo "  3. Test the free health endpoint"
echo "  4. Test the paid endpoints"
echo ""
echo "🛑 To stop all services:"
echo "  Press Ctrl+C or run: ./stop-all.sh"
echo ""

# Keep the script running
echo "⏳ Services are running... Press Ctrl+C to stop all services"
wait

