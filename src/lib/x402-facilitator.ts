// Real x402 facilitator implementation using the x402 package
import { verify, settle } from 'x402/src/facilitator/facilitator';
import { Hex } from 'viem';
import {
  PaymentPayload,
  PaymentRequirements,
  VerifyResponse,
  SettleResponse,
  ExactEvmPayload
} from 'x402/src/types/verify/x402Specs';
import { SupportedEVMNetworks, Network } from 'x402/src/types/shared/network';
import { createConnectedClient, createSigner } from 'x402/src/types/shared/wallet';

// Use x402's built-in client creation functions

/**
 * Verify payment using real x402 facilitator
 */
export async function verifyX402Payment(
  paymentPayload: PaymentPayload,
  paymentRequirements: PaymentRequirements
): Promise<VerifyResponse> {
  try {
    console.log('[X402 Facilitator] Verifying payment:', {
      network: paymentRequirements.network,
      scheme: paymentRequirements.scheme
    });

    // Create connected client for verification using x402's function
    const client = createConnectedClient(paymentRequirements.network);

    // Use real x402 verify function
    const result = await verify(client as any, paymentPayload, paymentRequirements);

    console.log('[X402 Facilitator] Verification result:', {
      isValid: result.isValid,
      invalidReason: result.invalidReason,
      payer: result.payer
    });

    return result;

  } catch (error) {
    console.error('[X402 Facilitator] Verification error:', error);
    return {
      isValid: false,
      invalidReason: 'unexpected_verify_error',
      payer: ''
    };
  }
}

/**
 * Settle payment using real x402 facilitator
 */
export async function settleX402Payment(
  paymentPayload: PaymentPayload,
  paymentRequirements: PaymentRequirements,
  privateKey: Hex
): Promise<SettleResponse> {
  try {
    console.log('[X402 Facilitator] Settling payment:', {
      network: paymentRequirements.network,
      scheme: paymentRequirements.scheme
    });

    // Create signer for settlement using x402's function
    const signer = await createSigner(paymentRequirements.network, privateKey);

    // Use real x402 settle function
    const result = await settle(signer as any, paymentPayload, paymentRequirements);

    console.log('[X402 Facilitator] Settlement result:', {
      success: result.success,
      transaction: result.transaction,
      errorReason: result.errorReason
    });

    return result;

  } catch (error) {
    console.error('[X402 Facilitator] Settlement error:', error);
    return {
      success: false,
      errorReason: 'unexpected_settle_error',
      transaction: '',
      network: paymentRequirements.network,
      payer: ''
    };
  }
}

// Helper to convert our payment headers to x402 PaymentPayload format
export function convertToX402PaymentPayload(
  paymentHeaders: {
    'x-payment': string;
    'x-payment-signature': string;
  },
  network: Network
): PaymentPayload {
  try {
    const paymentData = JSON.parse(paymentHeaders['x-payment']);

    // Create x402 PaymentPayload structure
    const x402Payload: PaymentPayload = {
      x402Version: 1,
      scheme: 'exact',
      network: network,
      payload: {
        signature: paymentHeaders['x-payment-signature'],
        authorization: {
          from: paymentData.fromAddress,
          to: paymentData.toAddress,
          value: paymentData.amount,
          validAfter: paymentData.validAfter || '0',
          validBefore: paymentData.validBefore || String(Math.floor(Date.now() / 1000) + 3600),
          nonce: paymentData.nonce || `0x${'0'.repeat(64)}`
        }
      } as ExactEvmPayload
    };

    return x402Payload;
  } catch (error) {
    throw new Error(`Failed to convert payment payload: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper to create PaymentRequirements in x402 format
export function createX402PaymentRequirements(
  maxAmountRequired: string,
  network: Network,
  payTo: string,
  resource: string,
  description?: string
): PaymentRequirements {
  return {
    scheme: 'exact',
    network: network,
    maxAmountRequired: maxAmountRequired,
    resource: resource,
    description: description || `Payment for API access`,
    mimeType: 'application/json',
    payTo: payTo,
    maxTimeoutSeconds: 3600, // 1 hour
    asset: payTo // Using payTo as asset for simplicity
  };
}