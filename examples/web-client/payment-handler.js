// X402 Payment Handler for Web Client
// This module handles the complete x402 payment flow

import { createWalletClient, custom, formatUnits, parseUnits } from 'https://cdn.skypack.dev/viem@2.21.26';
import { baseSepolia, base } from 'https://cdn.skypack.dev/viem@2.21.26/chains';

export class X402PaymentHandler {
  constructor(walletClient, account) {
    this.walletClient = walletClient;
    this.account = account;
  }

  async handlePaymentRequest(url, options = {}) {
    // First, try the request without payment
    let response = await fetch(url, options);

    if (response.status !== 402) {
      return response;
    }

    // Got 402 Payment Required, parse the payment requirements
    const paymentInfo = await response.json();
    console.log("Payment required:", paymentInfo);

    // Parse payment requirements
    const paymentReq = paymentInfo.accepts[0];
    const amount = BigInt(paymentReq.maxAmountRequired);
    const assetAddress = paymentReq.asset;
    const payToAddress = paymentReq.payTo;
    const network = paymentReq.network;

    // Create and sign payment transaction
    const paymentTx = await this.createPaymentTransaction({
      to: payToAddress,
      value: amount,
      asset: assetAddress,
      network: network
    });

    // Submit payment to facilitator
    const paymentProof = await this.submitPayment(paymentTx, paymentInfo);

    // Retry the original request with payment header
    const newOptions = {
      ...options,
      headers: {
        ...(options.headers || {}),
        'X-PAYMENT': paymentProof
      }
    };

    return await fetch(url, newOptions);
  }

  async createPaymentTransaction({ to, value, asset, network }) {
    try {
      // For USDC payments, we need to create an ERC-20 transfer
      if (asset && asset !== '0x0000000000000000000000000000000000000000') {
        // ERC-20 transfer
        const transferData = this.encodeERC20Transfer(to, value);
        
        return {
          to: asset,
          data: transferData,
          value: 0n
        };
      } else {
        // Native ETH transfer
        return {
          to: to,
          value: value,
          data: '0x'
        };
      }
    } catch (error) {
      throw new Error(`Failed to create payment transaction: ${error.message}`);
    }
  }

  encodeERC20Transfer(to, amount) {
    // ERC-20 transfer function signature: transfer(address,uint256)
    const functionSignature = '0xa9059cbb';
    const paddedTo = to.slice(2).padStart(64, '0');
    const paddedAmount = amount.toString(16).padStart(64, '0');
    
    return functionSignature + paddedTo + paddedAmount;
  }

  async submitPayment(paymentTx, paymentInfo) {
    try {
      // For demo purposes, we'll create a mock payment proof
      // In a real implementation, this would:
      // 1. Sign the transaction with MetaMask
      // 2. Submit to the blockchain
      // 3. Get the transaction hash
      // 4. Submit to the facilitator
      // 5. Get the payment proof

      console.log("Submitting payment transaction:", paymentTx);
      
      // Mock payment proof for demo
      const mockProof = btoa(JSON.stringify({
        transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
        amount: paymentTx.value?.toString() || '0',
        timestamp: Date.now(),
        network: paymentInfo.accepts[0].network
      }));

      return mockProof;
    } catch (error) {
      throw new Error(`Failed to submit payment: ${error.message}`);
    }
  }

  async signTransaction(tx) {
    try {
      // Sign the transaction with MetaMask
      const signedTx = await this.walletClient.sendTransaction(tx);
      return signedTx;
    } catch (error) {
      throw new Error(`Failed to sign transaction: ${error.message}`);
    }
  }
}

// Utility function to create a payment handler
export function createPaymentHandler(ethereum, account) {
  const walletClient = createWalletClient({
    chain: baseSepolia, // Default to Base Sepolia for testing
    transport: custom(ethereum),
    account: account,
  });

  return new X402PaymentHandler(walletClient, account);
}
