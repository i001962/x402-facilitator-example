/* eslint-env node */
import { config } from "dotenv";
import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { verify, settle } from "x402/facilitator";
import {
  PaymentRequirementsSchema,
  type PaymentRequirements,
  type PaymentPayload,
  PaymentPayloadSchema,
  createConnectedClient,
  createSigner,
  SupportedEVMNetworks,
  Signer,
  ConnectedClient,
  SupportedPaymentKind,
} from "x402/types";
import { createPublicClient, http, publicActions } from "viem";
import { base } from "viem/chains";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config();

const EVM_PRIVATE_KEY = process.env.EVM_PRIVATE_KEY || "";

if (!EVM_PRIVATE_KEY) {
  console.error("Missing required environment variable: EVM_PRIVATE_KEY");
  process.exit(1);
}

// Custom function to create a connected client with Alchemy RPC
function createConnectedClientWithRPC(network: string): ConnectedClient {
  if (network === "base") {
    return createPublicClient({
      chain: base,
      transport: http("https://base-mainnet.g.alchemy.com/v2/ClOKwqeAGcaXIYc2YcP61"),
    }).extend(publicActions) as ConnectedClient;
  }
  // Fallback to default for other networks
  return createConnectedClient(network);
}

const app = express();

// Configure express to parse JSON bodies
app.use(express.json());

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "public")));

type VerifyRequest = {
  paymentPayload: PaymentPayload;
  paymentRequirements: PaymentRequirements;
};

type SettleRequest = {
  paymentPayload: PaymentPayload;
  paymentRequirements: PaymentRequirements;
};

app.post("/verify", async (req: Request, res: Response) => {
  try {
    const body: VerifyRequest = req.body;

    // Debug: log what we received
    console.log("🔍 /verify received body:", JSON.stringify(body, null, 2));

    const paymentRequirements = PaymentRequirementsSchema.parse(body.paymentRequirements);
    const paymentPayload = PaymentPayloadSchema.parse(body.paymentPayload);

    // Debug: log parsed data
    console.log("🔍 Parsed payment requirements:", JSON.stringify(paymentRequirements, null, 2));
    console.log("🔍 Parsed payment payload:", JSON.stringify(paymentPayload, null, 2));

    // use the correct client/signer based on the requested network
    let client: Signer | ConnectedClient;
    if (SupportedEVMNetworks.includes(paymentRequirements.network)) {
      client = createConnectedClientWithRPC(paymentRequirements.network);
    } else {
      throw new Error("Unsupported network. Only EVM networks are supported.");
    }

    // verify
    const valid = await verify(client, paymentPayload, paymentRequirements);

    // Debug: log verification result
    console.log("🔍 Verification result:", JSON.stringify(valid, null, 2));

    res.json(valid);
  } catch (error) {
    console.error("error", error);
    res.status(400).json({ error: `Invalid request: ${error}` });
  }
});

app.get("/verify", (req: Request, res: Response) => {
  res.json({
    endpoint: "/verify",
    description: "POST to verify x402 payments",
    body: {
      paymentPayload: "PaymentPayload",
      paymentRequirements: "PaymentRequirements",
    },
  });
});

app.get("/settle", (req: Request, res: Response) => {
  res.json({
    endpoint: "/settle",
    description: "POST to settle x402 payments",
    body: {
      paymentPayload: "PaymentPayload",
      paymentRequirements: "PaymentRequirements",
    },
  });
});

app.get("/supported", async (req: Request, res: Response) => {
  const kinds: SupportedPaymentKind[] = [
    {
      x402Version: 1,
      scheme: "exact",
      network: "base",
    },
    {
      x402Version: 1,
      scheme: "exact",
      network: "base-sepolia",
    },
  ];

  res.json({
    kinds,
  });
});

app.post("/settle", async (req: Request, res: Response) => {
  try {
    const body: SettleRequest = req.body;
    const paymentRequirements = PaymentRequirementsSchema.parse(body.paymentRequirements);
    const paymentPayload = PaymentPayloadSchema.parse(body.paymentPayload);

    // use the correct private key based on the requested network
    let signer: Signer;
    if (SupportedEVMNetworks.includes(paymentRequirements.network)) {
      signer = await createSigner(paymentRequirements.network, EVM_PRIVATE_KEY);
    } else {
      throw new Error("Unsupported network. Only EVM networks are supported.");
    }

    // settle
    const response = await settle(signer, paymentPayload, paymentRequirements);
    res.json(response);
  } catch (error) {
    console.error("error", error);
    res.status(400).json({ error: `Invalid request: ${error}` });
  }
});

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Root endpoint - serve the client page
app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// API info endpoint
app.get("/api", (req: Request, res: Response) => {
  res.json({
    name: "x402 Facilitator Example",
    version: "1.0.0",
    description: "A standalone x402 payment protocol facilitator implementation",
    endpoints: {
      "/health": "Health check endpoint",
      "/supported": "GET - Returns supported payment kinds",
      "/verify": "GET/POST - Verify x402 payment payloads",
      "/settle": "GET/POST - Settle x402 payments",
    },
    documentation: "https://x402.org",
  });
});

// Test resource endpoint that demonstrates x402 flow
app.get("/api/data", async (req: Request, res: Response) => {
  const paymentHeader = req.headers["x-payment"] as string;

  if (!paymentHeader) {
    // Return 402 Payment Required with payment requirements
    return res.status(402).json({
      x402Version: 1,
      accepts: [
        {
          scheme: "exact",
          network: "base",
          maxAmountRequired: "10000", // 0.01 USDC
          resource: "https://example.com/api/data",
          description: "Test API data access",
          mimeType: "application/json",
          payTo: "0xAbEa4e7a139FAdBDb2B76179C24f0ff76753C800", // Facilitator address
          maxTimeoutSeconds: 3600,
          asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base Mainnet
        },
      ],
    });
  }

  // If payment header is present, verify with facilitator
  try {
    const paymentPayload = JSON.parse(paymentHeader);

    // Create payment requirements for verification
    const paymentRequirements = {
      scheme: "exact",
      network: "base",
      maxAmountRequired: "10000",
      resource: "https://example.com/api/data",
      description: "Test API data access",
      mimeType: "application/json",
      payTo: "0xAbEa4e7a139FAdBDb2B76179C24f0ff76753C800",
      maxTimeoutSeconds: 3600,
      asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    };

    // Debug: log the payload being sent for verification
    console.log("🔍 Verifying payment payload:", JSON.stringify(paymentPayload, null, 2));
    console.log("🔍 Payment requirements:", JSON.stringify(paymentRequirements, null, 2));

    // Verify payment with facilitator
    const verifyResponse = await fetch(`http://localhost:${port}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentPayload: paymentPayload,
        paymentRequirements: paymentRequirements,
      }),
    });

    const verifyResult = await verifyResponse.json();

    if (!verifyResult.isValid) {
      return res.status(402).json({
        error: "Payment verification failed",
        reason: verifyResult.invalidReason,
      });
    }

    // Payment verified! Now settle it to actually move funds
    const settleResponse = await fetch(`http://localhost:${port}/settle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentPayload: paymentPayload,
        paymentRequirements: paymentRequirements,
      }),
    });

    const settleResult = await settleResponse.json();

    if (!settleResponse.ok) {
      return res.status(500).json({
        error: "Payment settlement failed",
        details: settleResult,
      });
    }

    // Payment verified and settled! Serve the resource
    res.json({
      message: "Payment verified and settled! Here's your data:",
      data: {
        timestamp: new Date().toISOString(),
        randomValue: Math.floor(Math.random() * 1000),
        paymentVerified: true,
        paymentSettled: true,
        transactionHash: settleResult.transactionHash,
      },
    });
  } catch (error) {
    res.status(400).json({ error: "Invalid payment header", details: String(error) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`x402 Facilitator Example server listening at http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`Supported networks: http://localhost:${port}/supported`);
});
