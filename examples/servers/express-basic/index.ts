import { config } from "dotenv";
import express from "express";
import cors from "cors";
import { paymentMiddleware, Resource, type SolanaAddress, type Network } from "x402-express";

config();

const facilitatorUrl = process.env.FACILITATOR_URL as Resource;
const payTo = process.env.ADDRESS as `0x${string}` | SolanaAddress;
const network = (process.env.NETWORK || "base-sepolia") as Network;

if (!facilitatorUrl || !payTo) {
  console.error("Missing required environment variables: FACILITATOR_URL, ADDRESS");
  process.exit(1);
}

const app = express();

// Enable CORS for web client access
app.use(
  cors({
    origin: ["http://localhost:8000", "http://127.0.0.1:8000"],
    credentials: true,
  }),
);

// Basic payment middleware configuration
app.use(
  paymentMiddleware(
    payTo,
    {
      // Simple weather API with fixed price
      "GET /weather": {
        price: {
          amount: "1000", // 0.001 USDC (6 decimals)
          asset: {
            address:
              network === "base"
                ? "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" // USDC on Base Mainnet
                : "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // USDC on Base Sepolia
            decimals: 6,
            eip712: {
              name: "USD Coin",
              version: "2",
            },
          },
        },
        network,
        config: {
          description: "Current weather data",
        },
      },
      // Premium content with custom token pricing
      "/premium/*": {
        price: {
          amount: "1000000", // 1 USDC (6 decimals)
          asset: {
            address:
              network === "base"
                ? "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" // USDC on Base Mainnet
                : "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // USDC on Base Sepolia
            decimals: 6,
            eip712: {
              name: "USD Coin",
              version: "2",
            },
          },
        },
        network,
        config: {
          description: "Premium content access",
        },
      },
      // API endpoint with different pricing
      "POST /api/data": {
        price: {
          amount: "5000", // 0.005 USDC (6 decimals)
          asset: {
            address:
              network === "base"
                ? "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" // USDC on Base Mainnet
                : "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // USDC on Base Sepolia
            decimals: 6,
            eip712: {
              name: "USD Coin",
              version: "2",
            },
          },
        },
        network,
        config: {
          description: "Data processing service",
        },
      },
    },
    {
      url: facilitatorUrl,
    },
  ),
);

// Protected endpoints
app.get("/weather", (req, res) => {
  res.json({
    location: "San Francisco",
    temperature: 72,
    condition: "Sunny",
    humidity: 45,
    timestamp: new Date().toISOString(),
  });
});

app.get("/premium/content", (req, res) => {
  res.json({
    content: "This is premium content that requires payment",
    features: ["Advanced analytics", "Real-time updates", "Priority support"],
    accessLevel: "premium",
  });
});

app.get("/premium/analytics", (req, res) => {
  res.json({
    analytics: {
      users: 1250,
      revenue: "$12,500",
      growth: "+15%",
    },
    reportDate: new Date().toISOString(),
  });
});

app.get("/premium/data", (req, res) => {
  res.json({
    data: {
      insights: "Premium data insights",
      metrics: {
        performance: "98.5%",
        uptime: "99.9%",
        satisfaction: "4.8/5",
      },
      recommendations: [
        "Optimize database queries",
        "Implement caching layer",
        "Scale horizontally",
      ],
    },
    timestamp: new Date().toISOString(),
    accessLevel: "premium",
  });
});

app.post("/api/data", (req, res) => {
  res.json({
    processed: true,
    result: "Data processing completed successfully",
    processingTime: "2.3s",
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint (no payment required)
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🔗 Wallet Connection
Network: 
Base Mainnet
Disconnect
Connected: 0x59733c7cd78d08dab90368ad2cc09c8c81f097c0
Network: Unknown Network (0xa)
Balance: 0.0009 ETH running at http://localhost:${PORT}`);
  console.log(`💰 Payment address: ${payTo}`);
  console.log(`🌐 Network: ${network}`);
  console.log(`🔗 Facilitator: ${facilitatorUrl}`);
  console.log("\n📋 Available endpoints:");
  console.log("  GET  /weather           - $0.001");
  console.log("  GET  /premium/*         - 1 USDC");
  console.log("  POST /api/data          - $0.005");
  console.log("  GET  /health            - Free");
});
