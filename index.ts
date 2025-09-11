/* eslint-env node */
import { config } from "dotenv";
import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { verify, settle as originalSettle } from "x402/facilitator";
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
import {
  createPublicClient,
  http,
  publicActions,
  createWalletClient,
  parseEther,
  parseUnits,
} from "viem";
import { base } from "viem/chains";
import { keccak256, AbiCoder } from "ethers";
import { privateKeyToAccount } from "viem/accounts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config();

const EVM_PRIVATE_KEY = process.env.EVM_PRIVATE_KEY || "";
const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
const REVNET_PROJECT_ID = process.env.REVNET_PROJECT_ID || "127";
const JB_MULTI_TERMINAL_ADDRESS =
  process.env.JB_MULTI_TERMINAL_ADDRESS || "0xdb9644369c79c3633cde70d2df50d827d7dc7dbc";
const USDC_CONTRACT_ADDRESS =
  process.env.USDC_CONTRACT_ADDRESS || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const ESCROW_ADDRESS = process.env.ESCROW_ADDRESS || "0xAbEa4e7a139FAdBDb2B76179C24f0ff76753C800";

if (!EVM_PRIVATE_KEY) {
  console.error("Missing required environment variable: EVM_PRIVATE_KEY");
  process.exit(1);
}

// Custom settle function that wraps the original and adds Revnet logic
async function settle(
  signer: Signer,
  paymentPayload: PaymentPayload,
  paymentRequirements: PaymentRequirements,
): Promise<any> {
  console.log("🔄 Custom settle function called");

  // Call the original settle function to execute the EIP-3009 transfer
  const settlementResult = await originalSettle(signer, paymentPayload, paymentRequirements);

  console.log("✅ Settlement to escrow completed:", settlementResult);

  // Use configurable Revnet configuration (provider-facilitator agreement)
  const revnetConfig = {
    projectId: REVNET_PROJECT_ID,
    beneficiary: (paymentPayload.payload as any).authorization.from, // Use buyer's EOA
    memo: `x402-${paymentRequirements.scheme}-${paymentRequirements.resource.replace(/[^a-zA-Z0-9]/g, "_")}`,
    minReturnedTokens: "0",
    metadata: "0x",
  };

  // If settlement was successful, make the Revnet payment
  if (settlementResult.success) {
    console.log("🏗️ Initiating Revnet payment (separate transaction) after escrow settlement...");

    try {
      // Add a timeout wrapper to prevent hanging
      const revnetPromise = (async () => {
        // Create wallet client for the escrow account (who received the USDC)
        const account = privateKeyToAccount(EVM_PRIVATE_KEY as `0x${string}`);
        const walletClient = createWalletClient({
          account,
          chain: paymentRequirements.network === "base" ? base : base, // Add other networks as needed
          transport: http(),
        });

        // Get current gas price and increase it significantly to avoid "replacement transaction underpriced" error
        const publicClient = createPublicClient({
          chain: paymentRequirements.network === "base" ? base : base,
          transport: http(),
        });

        const gasPrice = await publicClient.getGasPrice();
        const increasedGasPrice = (gasPrice * 200n) / 100n; // Increase by 100% (double the gas price)

        console.log("⛽ Gas price info:", {
          current: gasPrice.toString(),
          increased: increasedGasPrice.toString(),
          currentGwei: (Number(gasPrice) / 1e9).toFixed(6),
          increasedGwei: (Number(increasedGasPrice) / 1e9).toFixed(6),
        });

        // Parse the amount (USDC has 6 decimals)
        const amount = BigInt(paymentRequirements.maxAmountRequired);
        const projectId = BigInt(revnetConfig.projectId);
        const minReturnedTokens = BigInt(revnetConfig.minReturnedTokens);

        // Check current allowance and set unlimited if needed
        console.log("🔍 Checking current USDC allowance...");
        const currentAllowance = await publicClient.readContract({
          address: paymentRequirements.asset as `0x${string}`, // USDC contract
          abi: [
            {
              inputs: [
                { name: "owner", type: "address" },
                { name: "spender", type: "address" },
              ],
              name: "allowance",
              outputs: [{ name: "", type: "uint256" }],
              stateMutability: "view",
              type: "function",
            },
          ],
          functionName: "allowance",
          args: [account.address, JB_MULTI_TERMINAL_ADDRESS_CONST],
        });

        console.log("🔍 Current allowance:", currentAllowance.toString());

        let approveTxHash: string | undefined;

        // Check if we already have unlimited allowance (max uint256)
        const unlimitedAllowance = BigInt(
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
        );

        if (currentAllowance < unlimitedAllowance) {
          console.log("🔐 Setting unlimited USDC allowance for JBMultiTerminal...");

          // Get current nonce for the escrow account right before the approval
          const approveNonce = await publicClient.getTransactionCount({
            address: account.address,
            blockTag: "pending",
          });
          console.log("🔢 Current nonce for approval:", approveNonce);

          approveTxHash = await walletClient.writeContract({
            address: paymentRequirements.asset as `0x${string}`, // USDC contract
            abi: [
              {
                inputs: [
                  { name: "spender", type: "address" },
                  { name: "amount", type: "uint256" },
                ],
                name: "approve",
                outputs: [{ name: "", type: "bool" }],
                stateMutability: "nonpayable",
                type: "function",
              },
            ],
            functionName: "approve",
            args: [
              JB_MULTI_TERMINAL_ADDRESS_CONST, // spender
              unlimitedAllowance, // unlimited allowance
            ],
            gasPrice: increasedGasPrice, // Use increased gas price
            nonce: approveNonce, // Use current nonce
          });

          console.log("✅ USDC unlimited approval successful:", approveTxHash);

          // Wait for approval transaction to be mined with shorter timeout
          console.log("⏳ Waiting for approval transaction to be mined...");
          try {
            await publicClient.waitForTransactionReceipt({
              hash: approveTxHash as `0x${string}`,
              timeout: 10000, // 10 second timeout
              confirmations: 0, // No confirmations needed
            });
            console.log("✅ Approval transaction confirmed");
          } catch (timeoutError) {
            console.log("⚠️ Approval transaction timeout, proceeding anyway...");
            // Continue with the payment even if we can't confirm the approval
          }
        } else {
          console.log("✅ Unlimited allowance already exists, skipping approval");
        }

        // Now call JBMultiTerminal.pay() from the escrow account
        console.log("🏗️ Calling JBMultiTerminal.pay()...");

        // Get current nonce for the escrow account right before the pay call
        // This will be the correct nonce after any approval transaction has been processed
        const payNonce = await publicClient.getTransactionCount({
          address: account.address,
          blockTag: "pending",
        });
        console.log("🔢 Current nonce for pay:", payNonce);

        const revnetTxHash = await walletClient.writeContract({
          address: JB_MULTI_TERMINAL_ADDRESS_CONST,
          abi: JB_MULTI_TERMINAL_ABI,
          functionName: "pay",
          args: [
            projectId, // _projectId
            paymentRequirements.asset as `0x${string}`, // _token (USDC contract address)
            amount, // _amount
            revnetConfig.beneficiary as `0x${string}`, // _beneficiary (buyer's EOA)
            minReturnedTokens, // _minReturnedTokens
            revnetConfig.memo, // _memo
            revnetConfig.metadata as `0x${string}`, // _metadata
          ],
          gasPrice: increasedGasPrice, // Use increased gas price
          nonce: payNonce, // Use current nonce
          // No value field for USDC payments (only for ETH payments)
        });

        console.log("✅ Revnet payment transaction submitted:", revnetTxHash);

        // Wait for Revnet payment transaction to be mined with timeout
        console.log("⏳ Waiting for Revnet payment transaction to be mined...");
        await publicClient.waitForTransactionReceipt({
          hash: revnetTxHash,
          timeout: 60000, // 60 second timeout
          confirmations: 1,
        });
        console.log("✅ Revnet payment transaction confirmed");

        // Add Revnet payment result to the settlement response
        (settlementResult as any).revnetPayment = {
          success: true,
          approvalTransactionHash: approveTxHash,
          paymentTransactionHash: revnetTxHash,
          projectId: revnetConfig.projectId,
          beneficiary: revnetConfig.beneficiary,
          amount: paymentRequirements.maxAmountRequired,
          token: paymentRequirements.asset,
          escrowAccount: paymentRequirements.payTo,
          jbMultiTerminal: JB_MULTI_TERMINAL_ADDRESS_CONST,
        };
      })();

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Revnet payment timeout after 30 seconds")), 30000),
      );

      await Promise.race([revnetPromise, timeoutPromise]);
    } catch (revnetError) {
      console.error("❌ Revnet payment failed:", revnetError);

      // Add error to response but don't fail the entire settlement
      (settlementResult as any).revnetPayment = {
        success: false,
        error: revnetError instanceof Error ? revnetError.message : String(revnetError),
        projectId: revnetConfig.projectId,
        beneficiary: revnetConfig.beneficiary,
        amount: paymentRequirements.maxAmountRequired,
        escrowAccount: paymentRequirements.payTo,
      };
    }
  }

  return settlementResult;
}

// JBMultiTerminal ABI for the pay function
const JB_MULTI_TERMINAL_ABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_projectId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_beneficiary",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_minReturnedTokens",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "_memo",
        type: "string",
      },
      {
        internalType: "bytes",
        name: "_metadata",
        type: "bytes",
      },
    ],
    name: "pay",
    outputs: [
      {
        internalType: "uint256",
        name: "beneficiaryTokenCount",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
] as const;

const JB_MULTI_TERMINAL_ADDRESS_CONST = JB_MULTI_TERMINAL_ADDRESS as `0x${string}`;

// Custom function to create a connected client with Alchemy RPC
/**
 * Creates a connected client for the specified network using Alchemy RPC
 *
 * @param network - The blockchain network to connect to
 * @returns A connected client for the specified network
 */
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

    // Revnet integration is handled automatically in the settle function
    // No need to bind parameters here since it's a provider-facilitator agreement

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
    console.log("🔍 /settle received body:", JSON.stringify(req.body, null, 2));
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
    console.log("🔄 Calling settle function...");
    const response = await settle(signer, paymentPayload, paymentRequirements);
    console.log("✅ Settlement completed:", JSON.stringify(response, null, 2));

    // Revnet integration is now handled in the custom settle function

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
          payTo: ESCROW_ADDRESS, // Facilitator address
          maxTimeoutSeconds: 3600,
          asset: USDC_CONTRACT_ADDRESS, // USDC on Base Mainnet
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
      payTo: ESCROW_ADDRESS,
      maxTimeoutSeconds: 3600,
      asset: USDC_CONTRACT_ADDRESS,
    };

    // Debug: log the payload being sent for verification
    console.log("🔍 Verifying payment payload:", JSON.stringify(paymentPayload, null, 2));
    console.log("🔍 Payment requirements:", JSON.stringify(paymentRequirements, null, 2));

    // Verify payment with facilitator
    const verifyResponse = await fetch(`${BASE_URL}/verify`, {
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
    const settleResponse = await fetch(`${BASE_URL}/settle`, {
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
  console.log(`x402 Facilitator Example server listening at ${BASE_URL}`);
  console.log(`Health check: ${BASE_URL}/health`);
  console.log(`Supported networks: ${BASE_URL}/supported`);
});
