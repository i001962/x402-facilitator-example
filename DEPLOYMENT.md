# Production Deployment Guide

This guide covers deploying the x402 Facilitator Example to production environments.

## 🚀 Quick Start

1. **Copy environment configuration:**

   ```bash
   cp env.production.example .env
   ```

2. **Update production values:**

   - Set your production private key
   - Update all URLs to your production domains
   - Configure your Revnet project ID and addresses

3. **Deploy services:**
   - Deploy facilitator to your hosting platform
   - Deploy provider to your hosting platform
   - Deploy web client to your hosting platform

## 🔧 Environment Variables

### Required Variables

| Variable          | Description                        | Example                           |
| ----------------- | ---------------------------------- | --------------------------------- |
| `EVM_PRIVATE_KEY` | Private key for the escrow account | `0x1234...`                       |
| `FACILITATOR_URL` | URL where facilitator is deployed  | `https://facilitator.example.com` |
| `PROVIDER_URL`    | URL where provider is deployed     | `https://provider.example.com`    |
| `WEB_CLIENT_URL`  | URL where web client is deployed   | `https://client.example.com`      |
| `BASE_URL`        | Base URL for internal API calls    | `https://facilitator.example.com` |

### Optional Variables

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | Server port | `3000` |
| `NETWORK` | Blockchain network | `base` |
| `REVNET_PROJECT_ID` | Revnet project ID | `127` |
| `JB_MULTI_TERMINAL_ADDRESS` | JBMultiTerminal contract address | `0xdb9644369c79c3633cde70d2df50d827d7dc7dbc` |
| `USDC_CONTRACT_ADDRESS` | USDC contract address | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| `ESCROW_ADDRESS` | Escrow account address | `0xAbEa4e7a139FAdBDb2B76179C24f0ff76753C800` |

## 🏗️ Deployment Platforms

### Vercel (Recommended for Frontend)

1. **Deploy Web Client:**

   ```bash
   cd public
   vercel --prod
   ```

2. **Set environment variables in Vercel dashboard**

### Railway (Recommended for Backend)

1. **Deploy Facilitator:**

   ```bash
   railway login
   railway init
   railway up
   ```

2. **Set environment variables in Railway dashboard**

### Docker Deployment

1. **Create Dockerfile:**

   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Build and run:**
   ```bash
   docker build -t x402-facilitator .
   docker run -p 3000:3000 --env-file .env x402-facilitator
   ```

## 🔐 Security Considerations

### Private Key Management

- **Never commit private keys to version control**
- Use secure key management services:
  - AWS Secrets Manager
  - Azure Key Vault
  - HashiCorp Vault
  - Environment variables (for simple deployments)

### CORS Configuration

Update CORS settings for production:

```typescript
app.use(
  cors({
    origin: [process.env.WEB_CLIENT_URL],
    credentials: true,
  }),
);
```

### Rate Limiting

Consider adding rate limiting for production:

```typescript
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use(limiter);
```

## 📊 Monitoring

### Health Checks

The facilitator provides health check endpoints:

- `GET /health` - Basic health check
- `GET /supported` - Supported payment kinds

### Logging

Configure logging for production:

```typescript
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run build
      - run: npm run deploy
        env:
          EVM_PRIVATE_KEY: ${{ secrets.EVM_PRIVATE_KEY }}
          FACILITATOR_URL: ${{ secrets.FACILITATOR_URL }}
```

## 🧪 Testing Production

1. **Health Check:**

   ```bash
   curl https://your-facilitator-domain.com/health
   ```

2. **Supported Networks:**

   ```bash
   curl https://your-facilitator-domain.com/supported
   ```

3. **End-to-End Test:**
   - Open your web client URL
   - Connect MetaMask wallet
   - Test payment flow

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors:**

   - Check `WEB_CLIENT_URL` environment variable
   - Verify CORS configuration

2. **Transaction Failures:**

   - Check gas price settings
   - Verify network configuration
   - Check private key permissions

3. **Connection Issues:**
   - Verify all URLs are accessible
   - Check firewall settings
   - Verify SSL certificates

### Debug Mode

Enable debug logging:

```bash
DEBUG=x402:* npm start
```

## 📚 Additional Resources

- [x402 Protocol Documentation](https://x402.org)
- [Juicebox Protocol](https://juicebox.money)
- [Revnet Documentation](https://docs.juicebox.money)
- [Base Network Documentation](https://docs.base.org)
