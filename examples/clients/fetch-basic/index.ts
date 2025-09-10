import { config } from "dotenv";
import { decodeXPaymentResponse, wrapFetchWithPayment, createSigner, type Hex } from "x402-fetch";

config();

const privateKey = process.env.PRIVATE_KEY as Hex | string;
const baseURL = process.env.RESOURCE_SERVER_URL as string;
const network = process.env.NETWORK || "base-sepolia";

if (!baseURL || !privateKey) {
  console.error("Missing required environment variables: PRIVATE_KEY, RESOURCE_SERVER_URL");
  process.exit(1);
}

/**
 * Basic x402-fetch client example
 *
 * This example demonstrates how to use the x402-fetch package to make
 * authenticated requests to x402-protected services.
 */
async function main(): Promise<void> {
  console.log("🚀 Starting x402-fetch client example");
  console.log(`🌐 Network: ${network}`);
  console.log(`🔗 Server: ${baseURL}`);

  // Create signer for the specified network
  const signer = await createSigner(network, privateKey);
  console.log(`👤 Signer address: ${signer.address}`);

  // Wrap fetch with payment functionality
  const fetchWithPayment = wrapFetchWithPayment(fetch, signer);

  // Test different endpoints
  await testWeatherAPI(fetchWithPayment);
  await testPremiumContent(fetchWithPayment);
  await testHealthCheck(fetchWithPayment);
}

/**
 * Test weather API endpoint
 *
 * @param fetchWithPayment - The fetch function wrapped with payment functionality
 */
async function testWeatherAPI(fetchWithPayment: typeof fetch): Promise<void> {
  console.log("\n🌤️  Testing weather API...");

  try {
    const response = await fetchWithPayment(`${baseURL}/weather`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ Weather data received:", data);

    // Decode payment response
    const paymentResponse = response.headers.get("x-payment-response");
    if (paymentResponse) {
      const decoded = decodeXPaymentResponse(paymentResponse);
      console.log("💰 Payment response:", decoded);
    }
  } catch (error) {
    console.error("❌ Weather API error:", error);
  }
}

/**
 * Test premium content endpoint
 *
 * @param fetchWithPayment - The fetch function wrapped with payment functionality
 */
async function testPremiumContent(fetchWithPayment: typeof fetch): Promise<void> {
  console.log("\n💎 Testing premium content...");

  try {
    const response = await fetchWithPayment(`${baseURL}/premium/analytics`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ Premium content received:", data);

    // Decode payment response
    const paymentResponse = response.headers.get("x-payment-response");
    if (paymentResponse) {
      const decoded = decodeXPaymentResponse(paymentResponse);
      console.log("💰 Payment response:", decoded);
    }
  } catch (error) {
    console.error("❌ Premium content error:", error);
  }
}

/**
 * Test health check endpoint (no payment required)
 *
 * @param fetchWithPayment - The fetch function wrapped with payment functionality
 */
async function testHealthCheck(fetchWithPayment: typeof fetch): Promise<void> {
  console.log("\n🏥 Testing health check...");

  try {
    const response = await fetchWithPayment(`${baseURL}/health`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ Health check passed:", data);
  } catch (error) {
    console.error("❌ Health check error:", error);
  }
}

// Run the example
main().catch(error => {
  console.error("💥 Fatal error:", error?.response?.data?.error ?? error);
  process.exit(1);
});
