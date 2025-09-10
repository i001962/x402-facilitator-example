# Revnet x402 Facilitator Proof of Concept

A standalone implementation of an x402 facilitator service for Revnet that handles payment verification and settlement for the x402 payment protocol. This proof of concept demonstrates how to build a facilitator service that can be deployed to platforms like Vercel and integrated with Revnet's payment infrastructure.

## Overview

The facilitator provides three main endpoints:

- `/verify`: Verifies x402 payment payloads
- `/settle`: Settles x402 payments by signing and broadcasting transactions
- `/supported`: Returns the payment kinds that are supported by the facilitator

This Revnet proof of concept demonstrates how to:

1. Set up a basic Express server to handle x402 payment verification and settlement
2. Integrate with the x402 protocol's verification and settlement functions
3. Handle payment payload validation and error cases
4. Deploy to Vercel or other serverless platforms
5. Integrate with Revnet's payment infrastructure and workflows

## Revnet Integration

This facilitator is designed to work with Revnet's payment infrastructure:

- **Payment Verification**: Verifies x402 payment signatures for Revnet transactions
- **Settlement**: Handles on-chain settlement of verified payments
- **Multi-chain Support**: Supports Base, Ethereum, and Solana networks
- **API Integration**: Provides RESTful endpoints for Revnet services to interact with

## Prerequisites

- Node.js v20+ (install via [nvm](https://github.com/nvm-sh/nvm))
- npm or pnpm package manager
- A valid Ethereum private key and/or Solana private key
- Base Sepolia testnet ETH and/or Solana Devnet SOL for transaction fees

## Setup

1. Clone this repository:

```bash
git clone <repository-url>
cd x402-facilitator-example
```

2. Install dependencies:

```bash
npm install
# or
pnpm install
```

3. Create a `.env` file with the following variables:

```env
EVM_PRIVATE_KEY=0xYourPrivateKey
SVM_PRIVATE_KEY=solanaprivatekey
PORT=3000
```

4. Start the development server:

```bash
npm run dev
# or
pnpm dev
```

The server will start on http://localhost:3000

## API Endpoints

### GET /

Returns basic information about the facilitator service.

### GET /health

Health check endpoint that returns the service status.

### GET /supported

Returns information about the payment kinds that the facilitator supports.

Sample Response:

```json
{
  "kinds": [
    {
      "x402Version": 1,
      "scheme": "exact",
      "network": "base-sepolia"
    },
    {
      "x402Version": 1,
      "scheme": "exact",
      "network": "solana-devnet",
      "extra": {
        "feePayer": "SolanaAddress"
      }
    }
  ]
}
```

### GET /verify

Returns information about the verify endpoint.

### POST /verify

Verifies an x402 payment payload.

Request body:

```typescript
{
  paymentPayload: PaymentPayload;
  paymentRequirements: PaymentRequirements;
}
```

### GET /settle

Returns information about the settle endpoint.

### POST /settle

Settles an x402 payment by signing and broadcasting the transaction.

Request body:

```typescript
{
  paymentPayload: PaymentPayload;
  paymentRequirements: PaymentRequirements;
}
```

## Deployment

### Vercel Deployment

1. Install Vercel CLI:

```bash
npm i -g vercel
```

2. Build the project:

```bash
npm run build
```

3. Deploy to Vercel:

```bash
vercel
```

4. Set environment variables in Vercel dashboard:
   - `EVM_PRIVATE_KEY`
   - `SVM_PRIVATE_KEY`

### Other Platforms

This application can be deployed to any Node.js hosting platform that supports:
- Node.js 20+
- Environment variables
- Express.js applications

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `EVM_PRIVATE_KEY` | Ethereum private key for EVM networks | No* |
| `SVM_PRIVATE_KEY` | Solana private key for SVM networks | No* |
| `PORT` | Port number for the server | No (defaults to 3000) |

*At least one private key is required for the facilitator to function.

## Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the TypeScript code
- `npm start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Code Style

This project uses:
- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety

## Learning Resources

This example is designed to help you understand how x402 facilitators work. For more information about the x402 protocol and its implementation, visit:

- [x402 Protocol Documentation](https://x402.org)
- [Coinbase Developer Platform](https://www.coinbase.com/developer-platform)
- [Original x402 Repository](https://github.com/coinbase/x402)

## Production Considerations

For production use, we recommend using:

- Testnet: https://x402.org/facilitator
- Production: https://api.cdp.coinbase.com/platform/v2/x402

This example is for educational purposes and should not be used in production without proper security considerations, including:

- Secure key management
- Rate limiting
- Input validation
- Error handling
- Monitoring and logging

## License

Apache-2.0

## Contributing

This is an example repository. For contributions to the main x402 protocol, please visit the [main repository](https://github.com/coinbase/x402).
