import { z } from "zod";

// Network types
export const NetworkSchema = z.enum([
  "base-sepolia",
  "base",
  "avalanche-fuji",
  "avalanche",
  "iotex",
  "solana-devnet",
  "solana",
  "sei",
  "sei-testnet",
]);

export type Network = z.infer<typeof NetworkSchema>;

// Supported networks
export const SupportedEVMNetworks: Network[] = [
  "base-sepolia",
  "base",
  "avalanche-fuji",
  "avalanche",
  "iotex",
  "sei",
  "sei-testnet",
];

export const SupportedSVMNetworks: Network[] = ["solana-devnet", "solana"];

// Network to chain ID mapping
export const EvmNetworkToChainId = new Map<Network, number>([
  ["base-sepolia", 84532],
  ["base", 8453],
  ["avalanche-fuji", 43113],
  ["avalanche", 43114],
  ["iotex", 4689],
  ["sei", 1329],
  ["sei-testnet", 1328],
]);

export const SvmNetworkToChainId = new Map<Network, number>([
  ["solana-devnet", 103],
  ["solana", 101],
]);

// Payment requirements schema
export const PaymentRequirementsSchema = z.object({
  x402Version: z.number(),
  scheme: z.literal("exact"),
  network: NetworkSchema,
  amount: z.string(),
  currency: z.string(),
  recipient: z.string(),
  validAfter: z.number().optional(),
  validBefore: z.number().optional(),
});

export type PaymentRequirements = z.infer<typeof PaymentRequirementsSchema>;

// EVM Authorization schema
export const EvmAuthorizationSchema = z.object({
  from: z.string(),
  to: z.string(),
  value: z.string(),
  validAfter: z.number(),
  validBefore: z.number(),
  nonce: z.string(),
});

export type EvmAuthorization = z.infer<typeof EvmAuthorizationSchema>;

// EVM Payload schema
export const EvmPayloadSchema = z.object({
  authorization: EvmAuthorizationSchema,
  signature: z.string(),
});

export type EvmPayload = z.infer<typeof EvmPayloadSchema>;

// SVM Transaction schema (simplified)
export const SvmTransactionSchema = z.object({
  transaction: z.string(), // Base64 encoded transaction
});

export type SvmTransaction = z.infer<typeof SvmTransactionSchema>;

// Payment payload schema
export const PaymentPayloadSchema = z.object({
  x402Version: z.number(),
  scheme: z.literal("exact"),
  network: NetworkSchema,
  payload: z.union([EvmPayloadSchema, SvmTransactionSchema]),
});

export type PaymentPayload = z.infer<typeof PaymentPayloadSchema>;

// Response types
export interface VerifyResponse {
  isValid: boolean;
  invalidReason?: string;
  payer?: string;
}

export interface SettleResponse {
  success: boolean;
  errorReason?: string;
  transaction?: string;
  network: string;
  payer?: string;
}

// Supported payment kind
export interface SupportedPaymentKind {
  x402Version: number;
  scheme: string;
  network: string;
  extra?: Record<string, unknown>;
}

// Client types (simplified)
export interface ConnectedClient {
  // This would be a viem PublicClient in real implementation
  getBalance: (params: { address: string }) => Promise<bigint>;
  readContract: (params: unknown) => Promise<unknown>;
  simulateContract: (params: unknown) => Promise<unknown>;
}

export interface Signer {
  // This would be a viem WalletClient or Solana KeyPairSigner
  address: string;
  signTransaction?: (tx: unknown) => Promise<unknown>;
  sendTransaction?: (tx: unknown) => Promise<string>;
}

// Utility type guards
/**
 * Type guard to check if a signer is an SVM signer wallet
 *
 * @param signer - The signer to check
 * @returns True if the signer is an SVM signer wallet
 */
export function isSvmSignerWallet(signer: Signer): signer is Signer & { address: string } {
  return typeof signer.address === "string";
}
