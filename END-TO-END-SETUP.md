# X402 End-to-End Setup Guide

This guide walks you through setting up a complete x402 payment system with three components:

1. **Facilitator Server** - The main x402 facilitator service
2. **Provider Server** - Your API server that requires payments
3. **Client** - Consumer of your paid API

## Architecture Overview

### Command Line Client
```
Client (x402-fetch) → Provider Server (x402-express) → Facilitator Server (x402/facilitator)
     ↓                        ↓                              ↓
  Signs payment          Verifies payment              Processes payment
  Makes request          Returns 402 if no payment     Settles on blockchain
```

### Web Client (Recommended)
```
User's Wallet → Web Page → Provider Server → Facilitator Server
     ↓              ↓            ↓              ↓
  Signs payment  Makes API call Verifies payment Processes payment
  Approves tx    with payment   Returns 402 if   Settles on blockchain
                 header         no payment
```

## Prerequisites

- Node.js 20+
- A private key with testnet funds (Base Sepolia recommended)
- Understanding of blockchain wallets and private keys

## Step 1: Set Up the Facilitator Server

The facilitator is the central service that handles payment verification and settlement.

### 1.1 Configure Environment

```bash
# Copy the environment template
cp env.example .env

# Edit .env with your configuration
```

**Required Environment Variables:**
```bash
# Your private key for the facilitator (needs testnet funds)
EVM_PRIVATE_KEY=0xYourPrivateKeyHere

# Server port (optional, defaults to 3000)
PORT=3000
```

### 1.2 Get Testnet Funds

For Base Sepolia testnet:
1. Go to [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
2. Enter your wallet address (derived from your private key)
3. Request testnet ETH

### 1.3 Start the Facilitator

```bash
# Install dependencies
npm install

# Start the facilitator server
npm run dev
```

The facilitator will be running at `http://localhost:3000`

## Step 2: Set Up the Provider Server

Your API server that requires payments for access.

### 2.1 Configure Environment

```bash
cd examples/servers/express-basic
cp env.example .env
```

**Required Environment Variables:**
```bash
# The facilitator server URL (your local facilitator)
FACILITATOR_URL=http://localhost:3000

# Your payment address (where payments go)
ADDRESS=0xYourPaymentAddress

# Network to use
NETWORK=base-sepolia

# Server port
PORT=4021
```

### 2.2 Install Dependencies

```bash
npm install
```

### 2.3 Start the Provider Server

```bash
npm run dev
```

The provider server will be running at `http://localhost:3001`

## Step 3: Set Up the Client

Choose between a command-line client or a web-based client:

### Option A: Web Client (Recommended)

The web client connects to the user's wallet (MetaMask) for a better user experience.

#### 3A.1 Open the Web Client

```bash
cd examples/web-client
open index.html
# Or serve with: python -m http.server 8000
```

#### 3A.2 Connect Your Wallet

1. Install [MetaMask](https://metamask.io/) browser extension
2. Get testnet funds from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
3. Click "Connect Wallet" in the web interface
4. Approve the connection in MetaMask

### Option B: Command Line Client

The command-line client uses a private key directly.

#### 3B.1 Configure Environment

```bash
cd examples/clients/fetch-basic
cp env.example .env
```

**Required Environment Variables:**
```bash
# Your private key for signing payments
PRIVATE_KEY=0xYourPrivateKeyHere

# The provider server URL
RESOURCE_SERVER_URL=http://localhost:3001

# Network to use
NETWORK=base-sepolia
```

#### 3B.2 Install Dependencies

```bash
npm install
```

#### 3B.3 Start the Client

```bash
npm start
```

## Complete Flow Test

### 1. Start All Services

**Terminal 1 - Facilitator:**
```bash
npm run dev
# Should show: "Facilitator server running on port 3000"
```

**Terminal 2 - Provider Server:**
```bash
cd examples/servers/express-basic
npm run dev
# Should show: "Provider server running at http://localhost:4021"
```

**Terminal 3 - Client:**
```bash
cd examples/clients/fetch-basic
npm start
# Should make requests and show payment responses
```

### 2. Test Individual Components

**Test Facilitator Health:**
```bash
curl http://localhost:3000/health
```

**Test Provider Health (no payment required):**
```bash
curl http://localhost:3001/health
```

**Test Protected Endpoint (should return 402):**
```bash
curl http://localhost:3001/weather
# Should return: {"x402Version":1,"error":"X-PAYMENT header is required",...}
```

## Environment Variable Summary

### Facilitator Server (.env)
```bash
EVM_PRIVATE_KEY=0x...  # Your private key (needs testnet funds)
PORT=3000              # Facilitator port
```

### Provider Server (.env)
```bash
FACILITATOR_URL=http://localhost:3000  # Your facilitator URL
ADDRESS=0x...                          # Your payment address
NETWORK=base-sepolia                   # Blockchain network
PORT=3001                              # Provider server port
```

### Client (.env)
```bash
PRIVATE_KEY=0x...                      # Your private key
RESOURCE_SERVER_URL=http://localhost:3001  # Provider server URL
NETWORK=base-sepolia                   # Blockchain network
```

## Key Points

### Private Keys
- **Facilitator**: Needs a private key with testnet funds to process payments
- **Client**: Needs a private key to sign payment requests
- **Provider**: Only needs a payment address (public key) to receive payments

### Network Configuration
- All components must use the same network (e.g., `base-sepolia`)
- The facilitator and client need to be on the same network to process payments
- The provider just needs to know which network to expect payments on

### URLs
- **Facilitator URL**: Where the facilitator server is running (usually `http://localhost:3000`)
- **Provider URL**: Where your API server is running (usually `http://localhost:4021`)
- **Client**: Points to the provider URL to make requests

## Troubleshooting

### Common Issues

1. **"Missing required environment variables"**
   - Check that all required variables are set in each component's `.env` file

2. **"Payment verification failed"**
   - Ensure the facilitator has testnet funds
   - Check that all components are using the same network
   - Verify the facilitator URL is correct in the provider configuration

3. **"Connection refused"**
   - Make sure all services are running
   - Check that ports are not conflicting
   - Verify URLs in configuration files

4. **"Invalid private key"**
   - Ensure private keys are in correct format (0x prefix for EVM)
   - Check that private keys have testnet funds

### Debug Steps

1. **Check service health:**
   ```bash
   curl http://localhost:3000/health  # Facilitator
   curl http://localhost:3001/health  # Provider
   ```

2. **Check logs:**
   - Look at console output for each service
   - Check for error messages about missing variables or network issues

3. **Verify network connectivity:**
   - Ensure all services can reach each other
   - Check firewall settings if using different machines

## Next Steps

Once you have the basic flow working:

1. **Customize pricing** in the provider server
2. **Add more endpoints** with different payment requirements
3. **Implement dynamic pricing** based on usage or other factors
4. **Add error handling** and retry logic in the client
5. **Deploy to production** with mainnet networks

## Security Notes

- Never commit `.env` files with real private keys
- Use testnet networks for development
- Keep private keys secure and never share them
- Use HTTPS in production environments
- Monitor payment settlement status
