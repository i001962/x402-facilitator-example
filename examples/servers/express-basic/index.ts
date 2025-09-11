import { config } from "dotenv";
import express from "express";
import cors from "cors";
import { paymentMiddleware, Resource, type SolanaAddress, type Network } from "x402-express";

config();

const facilitatorUrl = process.env.FACILITATOR_URL as Resource;
const payTo = process.env.ADDRESS as `0x${string}` | SolanaAddress;
const network = (process.env.NETWORK || "base") as Network;
const revnetProjectId = process.env.REVNET_PROJECT_ID || "127";
const usdcContractAddress =
  process.env.USDC_CONTRACT_ADDRESS || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const webClientUrl = process.env.WEB_CLIENT_URL || "http://localhost:8000";

if (!facilitatorUrl || !payTo) {
  console.error("Missing required environment variables: FACILITATOR_URL, ADDRESS");
  process.exit(1);
}

const app = express();

// Enable CORS for web client access
app.use(
  cors({
    origin: [webClientUrl, "http://127.0.0.1:8000"],
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
            address: usdcContractAddress, // USDC contract address from environment
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
            address: usdcContractAddress, // USDC contract address from environment
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
            address: usdcContractAddress, // USDC contract address from environment
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

// Helper function to decode X-PAYMENT header and get payer address
function getPayerFromPaymentHeader(req: any): string | null {
  try {
    const paymentHeader = req.header("X-PAYMENT");
    if (!paymentHeader) return null;

    const decoded = Buffer.from(paymentHeader, "base64").toString("utf-8");
    const paymentData = JSON.parse(decoded);
    return paymentData.payer || null;
  } catch (error) {
    console.error("Error decoding X-PAYMENT header:", error);
    return null;
  }
}

// Protected endpoints
app.get("/weather", (req, res) => {
  // Get the actual payer from the payment header
  const payer = getPayerFromPaymentHeader(req);

  // Add Revnet configuration to response headers
  res.set({
    "X-Revnet-ProjectId": "127",
    "X-Revnet-Memo": "env=production&CID=weather-api&fid=1",
    "X-Revnet-MinReturnedTokens": "0",
    "X-Revnet-Metadata": "0x",
  });

  res.json({
    location: "San Francisco",
    temperature: 72,
    condition: "Sunny",
    humidity: 45,
    timestamp: new Date().toISOString(),
    revnetProjectId: "127", // Include Revnet project info in response
    beneficiary: payer || "unknown", // Use actual payer address
  });
});

app.get("/premium/content", (req, res) => {
  // Get the actual payer from the payment header
  const payer = getPayerFromPaymentHeader(req);

  // Add Revnet configuration to response headers
  res.set({
    "X-Revnet-ProjectId": "127",
    "X-Revnet-Memo": "env=production&CID=premium-content&fid=1",
    "X-Revnet-MinReturnedTokens": "0",
    "X-Revnet-Metadata": "0x",
  });

  res.json({
    content: "This is premium content that requires payment",
    features: ["Advanced analytics", "Real-time updates", "Priority support"],
    accessLevel: "premium",
    revnetProjectId: "127",
    beneficiary: payer || "unknown", // Use actual payer address
  });
});

app.get("/premium/analytics", (req, res) => {
  // Get the actual payer from the payment header
  const payer = getPayerFromPaymentHeader(req);

  res.json({
    analytics: {
      users: 1250,
      revenue: "$12,500",
      growth: "+15%",
    },
    reportDate: new Date().toISOString(),
    revnetProjectId: "127",
    beneficiary: payer || "unknown", // Use actual payer address
  });
});

app.get("/premium/data", (req, res) => {
  // Get the actual payer from the payment header
  const payer = getPayerFromPaymentHeader(req);

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
    revnetProjectId: "127",
    beneficiary: payer || "unknown", // Use actual payer address
  });
});

app.post("/api/data", (req, res) => {
  // Get the actual payer from the payment header
  const payer = getPayerFromPaymentHeader(req);

  res.json({
    processed: true,
    result: "Data processing completed successfully",
    processingTime: "2.3s",
    timestamp: new Date().toISOString(),
    revnetProjectId: "127",
    beneficiary: payer || "unknown", // Use actual payer address
  });
});

// Health check endpoint (no payment required)
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    revnetIntegration: true,
    projectId: "1",
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Provider server running at http://localhost:${PORT}`);
  console.log(`💰 Payment address: ${payTo}`);
  console.log(`🌐 Network: ${network}`);
  console.log(`🔗 Facilitator: ${facilitatorUrl}`);
  console.log(`🏗️  Revnet Integration: Enabled (Project ID: 1)`);
  console.log("\n📋 Available endpoints:");
  console.log("  GET  /weather           - $0.001 → Revnet Project 1");
  console.log("  GET  /premium/*         - 1 USDC → Revnet Project 1");
  console.log("  POST /api/data          - $0.005 → Revnet Project 1");
  console.log("  GET  /health            - Free");
});
