// Real x402 implementation based on the reference code
import { exact } from "x402/schemes";
import {
  Network,
  PaymentPayload,
  PaymentRequirements,
  Price,
  Resource,
  settleResponseHeader,
} from "x402/types";
import { useFacilitator } from "x402/verify";
import { processPriceToAtomicAmount, findMatchingPaymentRequirements, getDefaultAsset } from "x402/shared";

// Environment configuration
const facilitatorUrl = process.env.FACILITATOR_URL as Resource || 'https://facilitator.coinbase.com' as Resource;
const payTo = process.env.ADDRESS as `0x${string}` || '0x0000000000000000000000000000000000000000' as `0x${string}`;

// Initialize facilitator
// eslint-disable-next-line react-hooks/rules-of-hooks
const { verify, settle } = useFacilitator({ url: facilitatorUrl });
const x402Version = 1;

/**
 * Creates payment requirements for a given price and network
 * Based on the reference implementation
 */
function createExactPaymentRequirements(
  price: Price,
  network: Network,
  resource: Resource,
  description = "",
): PaymentRequirements {
  const atomicAmountForAsset = processPriceToAtomicAmount(price, network);
  if ("error" in atomicAmountForAsset) {
    throw new Error(atomicAmountForAsset.error);
  }
  const { maxAmountRequired, asset } = atomicAmountForAsset;

  return {
    scheme: "exact",
    network,
    maxAmountRequired,
    resource,
    description,
    mimeType: "",
    payTo: payTo,
    maxTimeoutSeconds: 60,
    asset: asset.address,
    outputSchema: undefined,
    extra: {
      name: 'eip712' in asset ? asset.eip712.name : 'USDC',
      version: 'eip712' in asset ? asset.eip712.version : '2',
    },
  };
}

/**
 * Verifies a payment and handles the response
 * Based on the reference implementation
 */
export async function verifyX402Payment(
  paymentHeader: string,
  paymentRequirements: PaymentRequirements[],
): Promise<{ isValid: boolean; invalidReason?: string; payer?: string; decodedPayment?: PaymentPayload }> {
  try {
    if (!paymentHeader) {
      return {
        isValid: false,
        invalidReason: "X-PAYMENT header is required"
      };
    }

    let decodedPayment: PaymentPayload;
    try {
      decodedPayment = exact.evm.decodePayment(paymentHeader);
      decodedPayment.x402Version = x402Version;
    } catch (error) {
      return {
        isValid: false,
        invalidReason: String(error) || "Invalid or malformed payment header"
      };
    }

    try {
      const selectedPaymentRequirement =
        findMatchingPaymentRequirements(paymentRequirements, decodedPayment) ||
        paymentRequirements[0];
      const response = await verify(decodedPayment, selectedPaymentRequirement);
      if (!response.isValid) {
        return {
          isValid: false,
          invalidReason: response.invalidReason,
          payer: response.payer
        };
      }

      return {
        isValid: true,
        payer: response.payer,
        decodedPayment: decodedPayment
      };
    } catch (error) {
      return {
        isValid: false,
        invalidReason: String(error)
      };
    }
  } catch (error) {
    console.error('[X402 Facilitator] Verification error:', error);
    return {
      isValid: false,
      invalidReason: 'unexpected_verify_error'
    };
  }
}

/**
 * Settles a payment and returns the response header
 * Based on the reference implementation
 */
export async function settleX402Payment(
  decodedPayment: PaymentPayload,
  paymentRequirement: PaymentRequirements
): Promise<{ success: boolean; responseHeader?: string; errorReason?: string }> {
  try {
    const settleResponse = await settle(decodedPayment, paymentRequirement);
    const responseHeader = settleResponseHeader(settleResponse);

    return {
      success: true,
      responseHeader: responseHeader
    };
  } catch (error) {
    console.error('[X402 Facilitator] Settlement error:', error);
    return {
      success: false,
      errorReason: String(error)
    };
  }
}

/**
 * Helper to create PaymentRequirements for our SaaS use case
 */
export function createX402PaymentRequirements(
  price: Price,
  network: Network,
  resource: Resource,
  description?: string
): PaymentRequirements {
  return createExactPaymentRequirements(price, network, resource, description);
}

/**
 * Creates a 402 error response with payment requirements
 */
export function create402Response(
  errorMessage: string,
  paymentRequirements: PaymentRequirements[],
  payer?: string
) {
  return {
    status: 402,
    body: {
      x402Version,
      error: errorMessage,
      accepts: paymentRequirements,
      ...(payer && { payer })
    }
  };
}

/**
 * Converts atomic amount (micro-USDC) to dollar amount using x402 library's asset info
 */
export function atomicAmountToDollars(atomicAmount: string, network: Network): number {
  const asset = getDefaultAsset(network);
  const decimals = asset.decimals;
  return parseFloat(atomicAmount) / Math.pow(10, decimals);
}

// Export types for convenience
export type { PaymentPayload, PaymentRequirements, Network, Price, Resource };