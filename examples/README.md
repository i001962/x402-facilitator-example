# X402 Examples

This directory contains comprehensive examples demonstrating how to implement and use the x402 payment protocol.

## What is X402?

X402 is an internet-native payments protocol that enables API providers to require payments for access to their services. It uses HTTP status code 402 (Payment Required) and blockchain-based payments to create a seamless pay-per-use API economy.

## Examples Structure

```
examples/
├── servers/                    # Provider server examples
│   └── express-basic/          # Basic Express.js server with x402 middleware
├── clients/                    # Client examples
│   └── fetch-basic/           # Basic fetch client for consuming x402 APIs
└── README.md                  # This file
```

## Quick Start Guide

### 1. Choose Your Role

**Provider (Server)**: You want to protect your API endpoints with payments
**Client**: You want to consume payment-protected APIs

### 2. Get Started

#### For Providers (Servers)

1. **Basic Express Server**:
   ```bash
   cd servers/express-basic
   npm install
   cp env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

#### For Clients

1. **Basic Fetch Client**:
   ```bash
   cd clients/fetch-basic
   npm install
   cp env.example .env
   # Edit .env with your configuration
   npm start
   ```

## Configuration

### Required Environment Variables

**For Servers:**
- `FACILITATOR_URL`: The x402 facilitator service endpoint
- `ADDRESS`: Your payment address (0x format for EVM, base58 for Solana)
- `NETWORK`: Blockchain network (e.g., "base-sepolia", "base", "solana")

**For Clients:**
- `PRIVATE_KEY`: Your private key for signing payments
- `RESOURCE_SERVER_URL`: URL of the x402-protected server
- `NETWORK`: Blockchain network

### Network Options

- `base-sepolia`: Base Sepolia testnet (recommended for testing)
- `base`: Base mainnet
- `ethereum`: Ethereum mainnet
- `solana-devnet`: Solana devnet
- `solana`: Solana mainnet

## Testing Your Implementation

### 1. Start a Server

```bash
cd servers/express-basic
npm run dev
```

### 2. Test with curl

```bash
# Health check (no payment required)
curl http://localhost:4021/health

# Protected endpoint (returns 402 Payment Required)
curl http://localhost:4021/weather
```

### 3. Test with Client

```bash
cd clients/fetch-basic
npm start
```

## Example Scenarios

### Basic API Protection

Protect a simple weather API with a fixed price:

```typescript
// Server
app.use(paymentMiddleware(payTo, {
  "GET /weather": {
    price: "$0.001",
    network: "base-sepolia",
  },
}));

// Client
const response = await fetchWithPayment("http://localhost:4021/weather");
```

### Premium Content

Protect premium content with higher pricing:

```typescript
// Server
"/premium/*": {
  price: "$0.01",
  network: "base-sepolia",
  description: "Premium content access",
}

// Client
const response = await fetchWithPayment(`${baseURL}/premium/analytics`);
```

## Security Best Practices

### For Servers
- Never commit `.env` files with real private keys
- Use testnet networks for development
- Validate all payment requirements
- Implement proper error handling
- Monitor payment settlement status
- Use HTTPS in production

### For Clients
- Keep private keys secure
- Validate all responses before processing
- Implement proper error handling
- Use testnet networks for development
- Monitor payment success rates

## Troubleshooting

### Common Issues

1. **Missing environment variables**: Ensure all required variables are set
2. **Invalid payment address**: Check address format for your network
3. **Network connectivity**: Verify facilitator URL is accessible
4. **Payment failures**: Check network and token balances
5. **Invalid private key**: Check key format for your network

### Getting Help

1. Check the example README files for specific guidance
2. Verify your environment configuration
3. Test with the health check endpoint first
4. Check network connectivity and balances
5. Review error messages and logs

## Contributing

When adding new examples:

1. Follow the existing directory structure
2. Include comprehensive README documentation
3. Provide environment example files
4. Add proper error handling
5. Include health check endpoints
6. Test with both curl and x402 clients
7. Document any special requirements or considerations

## Resources

- [X402 Protocol Documentation](https://github.com/coinbase/x402)
- [Base Network Documentation](https://docs.base.org/)
- [Solana Documentation](https://docs.solana.com/)
- [Ethereum Documentation](https://ethereum.org/developers/)
