# x402 → Revnet Facilitator Example

A custom x402 facilitator implementation that demonstrates **Pattern A (Two-step)** integration with Juicebox Revnet. This example shows how to build a facilitator that handles x402 payments and automatically forwards them to Revnet's `JBMultiTerminal.pay()` function.

## 🎯 **Purpose & Constraints**

This is a **proof-of-concept example** with the following hardcoded constraints:

- **Network**: Base Mainnet only
- **Revnet Project**: Project ID `127` (hardcoded)
- **Terminal**: `JBMultiTerminal` at `0xdb9644369c79c3633cde70d2df50d827d7dc7dbc` (hardcoded)
- **Token**: USDC only (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`)
- **Payment Flow**: Two-step settlement (EIP-3009 → Revnet)

## 🏗️ **Architecture: Two-Step Settlement**

This facilitator implements **Pattern A** from the x402 → Revnet integration spec:

### **Step 1: EIP-3009 Transfer**

```
Buyer → [transferWithAuthorization] → Facilitator Escrow
```

- Buyer signs EIP-3009 `transferWithAuthorization`
- USDC is transferred to facilitator's escrow account
- Standard x402 verification and settlement

### **Step 2: Revnet Payment**

```
Facilitator Escrow → [approve + pay] → Revnet Project 127
```

- Escrow approves `JBMultiTerminal` to spend USDC
- Escrow calls `JBMultiTerminal.pay()` with exact amount
- Buyer receives Revnet tokens as beneficiary

## 🚀 **Quick Start**

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment:**

   ```bash
   cp env.example .env
   # Edit .env with your EVM_PRIVATE_KEY
   ```

3. **Start all services:**

   ```bash
   ./start-all.sh
   ```

4. **Test the flow:**
   - Open http://localhost:8000
   - Click any provider endpoint button
   - Follow the x402 payment flow
   - Watch facilitator logs for Revnet integration

## 📋 **Service Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │   Provider      │    │   Facilitator   │
│   (Port 8000)   │───▶│   (Port 3001)   │───▶│   (Port 3000)   │
│                 │    │                 │    │                 │
│ • Test UI       │    │ • Protected     │    │ • x402 Verify   │
│ • Endpoint      │    │   Endpoints     │    │ • x402 Settle   │
│   Buttons       │    │ • Revnet Headers│    │ • Revnet Pay    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 **Key Components**

### **Facilitator (`index.ts`)**

- **Custom Settle Function**: Wraps x402's `settle()` to add Revnet logic
- **ERC-20 Approval**: Approves `JBMultiTerminal` before payment
- **Gas Management**: Dynamic gas pricing to prevent transaction failures
- **Nonce Management**: Sequential transaction handling
- **Timeout Handling**: Prevents hanging on transaction receipts

### **Provider (`examples/servers/express-basic/index.ts`)**

- **Protected Endpoints**: `/weather`, `/premium/*`, `/api/data`
- **Revnet Headers**: Passes project parameters via `X-Revnet-*` headers
- **Dynamic Beneficiary**: Uses buyer's EOA as Revnet beneficiary

### **Web Client (`public/index.html`)**

- **Launch Pad**: Simple UI for testing provider endpoints
- **Direct Redirects**: Bypasses complex wallet integration
- **Payment Flow**: Triggers x402 → Revnet integration

## 🔄 **Payment Flow Details**

1. **Client Request**: User clicks provider endpoint button
2. **Provider Response**: Returns x402 payment requirements + Revnet headers
3. **Client Payment**: User signs EIP-3009 `transferWithAuthorization`
4. **Facilitator Verify**: Validates payment signature and requirements
5. **Facilitator Settle**:
   - Calls x402's `settle()` (EIP-3009 transfer to escrow)
   - Approves `JBMultiTerminal` to spend USDC
   - Calls `JBMultiTerminal.pay()` with exact amount
   - Buyer receives Revnet tokens

## 🛠️ **Technical Implementation**

### **Custom Settle Function**

```typescript
async function settle(signer, paymentPayload, paymentRequirements) {
  // Step 1: Standard x402 settlement
  const settlementResult = await originalSettle(signer, paymentPayload, paymentRequirements);

  // Step 2: Revnet integration
  if (settlementResult.success) {
    // Approve JBMultiTerminal
    await walletClient.writeContract({
      address: USDC_CONTRACT,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [JB_MULTI_TERMINAL_ADDRESS, amount],
    });

    // Pay into Revnet
    await walletClient.writeContract({
      address: JB_MULTI_TERMINAL_ADDRESS,
      abi: JB_MULTI_TERMINAL_ABI,
      functionName: "pay",
      args: [projectId, token, amount, beneficiary, minReturnedTokens, memo, metadata],
    });
  }

  return settlementResult;
}
```

### **Revnet Parameters**

- **Project ID**: `127` (hardcoded)
- **Beneficiary**: Buyer's EOA (dynamic)
- **Memo**: `"x402-payment"` (add your own for enhanced verification use cases)
- **Min Returned Tokens**: `0`
- **Metadata**: `0x`

## 📚 **Based on x402 Protocol**

This example is built on top of the [x402 protocol](https://github.com/coinbase/x402) and uses:

- **x402/facilitator**: Core verification and settlement functions
- **x402-express**: Express.js middleware for payment protection
- **EIP-3009**: Standard for transfer with authorization
- **EIP-712**: Typed data signing

## ⚠️ **Important Notes**

- **Educational Purpose**: This is a proof-of-concept, not production-ready
- **Hardcoded Values**: Network, project ID, and terminal are fixed
- **USDC Only**: Only supports USDC payments
- **Base Mainnet**: Configured for Base network only
- **Security**: Private keys are stored in environment variables

## 🔗 **Related Resources**

- [x402 Protocol Repository](https://github.com/coinbase/x402)
- [Juicebox Protocol](https://juicebox.money)
- [Revnet Documentation](https://revnet.juicebox.money)
- [EIP-3009 Standard](https://eips.ethereum.org/EIPS/eip-3009)

## 📄 **License**

Apache-2.0

---

**Note**: This example demonstrates the integration pattern but should not be used in production without proper security considerations, key management, and error handling.
