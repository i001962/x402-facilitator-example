# X402 Quick Start Guide

## 🚀 Start All Services

To start the complete x402 test environment:

```bash
./start-all.sh
```

This will start:
- **Facilitator Server** on port 3000
- **Provider Server** on port 3001  
- **Web Client** on port 8000

## 🛑 Stop All Services

To stop all services:

```bash
./stop-all.sh
```

## 🧪 Test the System

1. **Open the web client**: http://localhost:8000
2. **Connect your MetaMask wallet**
3. **Test endpoints**:
   - Health check (free)
   - Weather API ($0.001)
   - Premium Analytics (1 USDC)

## 📋 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Facilitator | http://localhost:3000 | Payment processing service |
| Provider | http://localhost:3001 | API server with payment protection |
| Web Client | http://localhost:8000 | Browser-based test client |

## 🔧 Manual Startup (if needed)

If the script doesn't work, start each service manually:

**Terminal 1 - Facilitator:**
```bash
npm run dev
```

**Terminal 2 - Provider:**
```bash
cd examples/servers/express-basic
npm run dev
```

**Terminal 3 - Web Client:**
```bash
cd examples/web-client
python3 -m http.server 8000
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill processes on specific ports
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
lsof -ti:8000 | xargs kill -9
```

### Services Not Starting
1. Check if all dependencies are installed: `npm install`
2. Check if environment variables are set
3. Check console output for error messages

### Web Client Not Loading
1. Make sure you're accessing http://localhost:8000 (not file://)
2. Check browser console for errors
3. Ensure MetaMask is installed

## 📝 Environment Setup

Make sure you have:
- Node.js 20+
- MetaMask browser extension
- Testnet funds (Base Sepolia recommended)

## 🎯 What to Test

1. **Wallet Connection**: Connect MetaMask to the web client
2. **Free Endpoints**: Test health check (no payment required)
3. **Paid Endpoints**: Test weather API (shows 402 Payment Required)
4. **Payment Flow**: See how the system handles payment requirements

The web client is currently a **demo** that shows the 402 Payment Required responses. For full payment processing, you'd need to integrate the complete x402-fetch library.

