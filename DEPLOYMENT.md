# Deployment Guide

This guide covers deploying the x402 Facilitator Example to various platforms.

## Vercel Deployment

### Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Vercel CLI installed: `npm i -g vercel`
3. Node.js 20+ (Vercel will use this automatically)

### Steps

1. **Prepare the repository:**
   ```bash
   # Ensure all files are committed
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel:**
   ```bash
   # From the project root
   vercel
   
   # Follow the prompts:
   # - Link to existing project? No
   # - Project name: x402-facilitator-example (or your preferred name)
   # - Directory: ./
   # - Override settings? No
   ```

3. **Set environment variables in Vercel dashboard:**
   - Go to your project dashboard on Vercel
   - Navigate to Settings → Environment Variables
   - Add the following variables:
     - `EVM_PRIVATE_KEY`: Your Ethereum private key (for Base Sepolia)
     - `SVM_PRIVATE_KEY`: Your Solana private key (for Solana Devnet)
     - `NODE_ENV`: production

4. **Redeploy:**
   ```bash
   vercel --prod
   ```

### Vercel Configuration

The project includes a `vercel.json` file with the following configuration:

- **Runtime**: Node.js 20+ (automatically detected)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Function Timeout**: 30 seconds (for blockchain operations)

### Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `EVM_PRIVATE_KEY` | Ethereum private key for EVM networks | No* | `0x1234...` |
| `SVM_PRIVATE_KEY` | Solana private key for SVM networks | No* | `your-solana-key` |
| `NODE_ENV` | Environment mode | No | `production` |

*At least one private key is required for the facilitator to function.

## Other Platforms

### Railway

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push

### Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Add environment variables

### Heroku

1. Create a new Heroku app
2. Connect your GitHub repository
3. Set environment variables:
   ```bash
   heroku config:set EVM_PRIVATE_KEY=your_key
   heroku config:set SVM_PRIVATE_KEY=your_key
   ```
4. Deploy

## Testing the Deployment

After deployment, test your facilitator:

1. **Health check:**
   ```bash
   curl https://your-app.vercel.app/health
   ```

2. **Check supported networks:**
   ```bash
   curl https://your-app.vercel.app/supported
   ```

3. **Test verification endpoint:**
   ```bash
   curl -X GET https://your-app.vercel.app/verify
   ```

## Security Considerations

### Private Keys

- **Never commit private keys to version control**
- Use environment variables for all sensitive data
- Consider using a key management service for production
- Rotate keys regularly

### Network Security

- The facilitator handles blockchain transactions
- Ensure HTTPS is enabled in production
- Consider implementing rate limiting
- Monitor for unusual activity

### Error Handling

- The facilitator includes basic error handling
- Consider adding logging and monitoring
- Implement proper error responses for production

## Monitoring

### Health Checks

The facilitator includes a `/health` endpoint that returns:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Logging

Consider adding structured logging for:
- Payment verification attempts
- Settlement transactions
- Error conditions
- Performance metrics

## Troubleshooting

### Common Issues

1. **Node.js Version Mismatch**
   - Ensure your deployment platform supports Node.js 20+
   - Check the `engines` field in `package.json`

2. **Environment Variables Not Set**
   - Verify all required environment variables are configured
   - Check the deployment platform's environment variable settings

3. **Build Failures**
   - Ensure all dependencies are properly specified
   - Check for TypeScript compilation errors
   - Verify the build command in deployment configuration

4. **Runtime Errors**
   - Check logs for specific error messages
   - Verify private keys are valid and have sufficient funds
   - Ensure network connectivity to blockchain networks

### Getting Help

- Check the [x402 documentation](https://x402.org)
- Review the [original x402 repository](https://github.com/coinbase/x402)
- Open an issue in this repository for deployment-specific problems
