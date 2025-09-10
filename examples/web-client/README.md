# X402 Web Client Example

This example demonstrates how to integrate x402 payments with a web frontend that connects to a user's wallet (like MetaMask).

## Architecture

```
User's Wallet (MetaMask) → Web Page → Provider Server → Facilitator Server
     ↓                        ↓              ↓              ↓
  Signs payment          Makes API call   Verifies payment  Processes payment
  Approves transaction   with payment     Returns 402 if    Settles on blockchain
                         header           no payment
```

## Features

- **Wallet Integration**: Connects to MetaMask or other Web3 wallets
- **Network Selection**: Choose between Base Sepolia, Base Mainnet, or Ethereum
- **Real-time Payments**: Users sign payments directly in their wallet
- **Multiple Endpoints**: Test free, paid, and premium API endpoints
- **Payment Tracking**: See payment status and details
- **Error Handling**: Comprehensive error handling and user feedback

## Setup

### 1. Prerequisites

- A running x402 facilitator server (see main README)
- A running x402 provider server (see examples/servers/express-basic)
- A web browser with MetaMask installed
- Testnet funds in your wallet

### 2. Get Testnet Funds

For Base Sepolia testnet:
1. Install [MetaMask](https://metamask.io/)
2. Add Base Sepolia network to MetaMask
3. Go to [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
4. Request testnet ETH

### 3. Start the Services

**Terminal 1 - Facilitator:**
```bash
# In the main directory
npm run dev
```

**Terminal 2 - Provider Server:**
```bash
cd examples/servers/express-basic
npm run dev
```

### 4. Open the Web Client

Simply open `index.html` in your web browser, or serve it with a local server:

```bash
# Option 1: Open directly
open index.html

# Option 2: Serve with Python
python -m http.server 8000
# Then visit http://localhost:8000

# Option 3: Serve with Node.js
npx serve .
```

## Usage

### 1. Connect Your Wallet

1. Click "Connect Wallet"
2. MetaMask will prompt you to connect
3. Select your account and approve the connection
4. The page will show your wallet address and balance

### 2. Test Free Endpoints

- Click "Test Health Check" to verify the API server is working
- This endpoint doesn't require payment

### 3. Test Paid Endpoints

- Click "Get Weather ($0.001)" to test a basic paid endpoint
- MetaMask will prompt you to sign the payment transaction
- Approve the transaction to complete the payment
- The API response will be displayed

### 4. Test Premium Endpoints

- Click "Premium Analytics (1 USDC)" to test a premium endpoint
- This requires a larger payment (1 USDC)
- Follow the same wallet approval process

## How It Works

### Wallet Integration

The web client uses the browser's `window.ethereum` object to interact with MetaMask:

```javascript
// Request account access
const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts'
});

// Create signer using the connected wallet
const signer = await createSigner(network, window.ethereum);
```

### Payment Flow

1. **User clicks a paid endpoint button**
2. **Client creates payment request** using x402-fetch
3. **MetaMask prompts user** to sign the payment transaction
4. **User approves** the transaction in their wallet
5. **Client sends signed payment** to the provider server
6. **Provider verifies payment** with the facilitator
7. **API response** is returned to the client

### Network Configuration

The client supports multiple networks:

- **Base Sepolia**: Recommended for testing
- **Base Mainnet**: Production Base network
- **Ethereum Mainnet**: Production Ethereum network

## Configuration

### API Server URL

By default, the client connects to `http://localhost:4021`. You can change this in the "API Configuration" section.

### Network Selection

Choose the appropriate network for your use case. Make sure your wallet has funds on the selected network.

## Error Handling

The client handles various error scenarios:

- **Wallet not connected**: Prompts user to connect wallet
- **Insufficient funds**: Shows error message
- **Network mismatch**: Guides user to switch networks
- **API server down**: Shows connection error
- **Payment failed**: Displays payment error details

## Security Considerations

- **Never store private keys** in the web client
- **Always use HTTPS** in production
- **Validate all responses** before processing
- **Use testnet networks** for development
- **Monitor payment status** and handle failures

## Troubleshooting

### Common Issues

1. **"MetaMask is not installed"**
   - Install MetaMask browser extension
   - Refresh the page

2. **"No accounts found"**
   - Make sure MetaMask is unlocked
   - Check that you have accounts in MetaMask

3. **"Insufficient funds"**
   - Get testnet funds from a faucet
   - Check your wallet balance

4. **"Network mismatch"**
   - Switch to the correct network in MetaMask
   - Or change the network selection in the web client

5. **"API server is not reachable"**
   - Make sure the provider server is running
   - Check the API URL configuration
   - Verify the server is accessible

### Debug Steps

1. **Check browser console** for error messages
2. **Verify MetaMask connection** and network
3. **Test with free endpoints** first
4. **Check server logs** for payment processing issues
5. **Verify wallet has sufficient funds**

## Customization

### Adding New Endpoints

To add new paid endpoints:

1. Add a button in the HTML
2. Add an event listener in the JavaScript
3. Create a method to call the endpoint
4. Handle the payment and response

### Styling

The example includes basic styling. You can customize the CSS to match your brand or design requirements.

### Payment Amounts

Payment amounts are configured in the provider server, not the client. The client automatically handles whatever payment requirements the server specifies.

## Production Deployment

For production use:

1. **Use HTTPS** for all communications
2. **Deploy to a web server** (not file://)
3. **Use mainnet networks** for real payments
4. **Implement proper error handling** and user feedback
5. **Add loading states** and progress indicators
6. **Consider rate limiting** and abuse prevention

## Next Steps

- **Add more payment options** (different tokens, networks)
- **Implement payment history** and receipts
- **Add subscription models** for recurring payments
- **Integrate with other wallets** (WalletConnect, Coinbase Wallet)
- **Add mobile support** for mobile wallets

