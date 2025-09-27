// Payment validation utilities for x402 protocol
// Simplified utility functions for header parsing and challenges

export interface PaymentChallenge {
  x402Version: 1;
  scheme: 'exact';
  network: string;
  paymentRequirements: any;
  timestamp: number;
  nonce: string;
}

// Extract payment data from request headers (simplified for compatibility)
export function extractPaymentFromHeaders(headers: Record<string, string | string[] | undefined>): any | null {
  const xPayment = headers['x-payment'] as string;
  const xPaymentSignature = headers['x-payment-signature'] as string;

  if (!xPayment || !xPaymentSignature) {
    return null;
  }

  try {
    const paymentData = JSON.parse(xPayment);

    return {
      signature: xPaymentSignature,
      timestamp: paymentData.timestamp || Date.now(),
      amount: paymentData.amount,
      currency: paymentData.currency,
      network: paymentData.network,
      fromAddress: paymentData.fromAddress,
      toAddress: paymentData.toAddress,
      transactionHash: paymentData.transactionHash
    };
  } catch (error) {
    console.error('Failed to parse payment data:', error);
    return null;
  }
}

// Create payment challenge for HTTP 402 responses
export function createPaymentChallenge(requirements: any): PaymentChallenge {
  return {
    x402Version: 1,
    scheme: 'exact',
    network: requirements.network,
    paymentRequirements: requirements,
    timestamp: Date.now(),
    nonce: Math.random().toString(36).substring(2, 15)
  };
}

// Format payment requirements for HTTP 402 response headers
export function formatPaymentHeaders(challenge: PaymentChallenge): Record<string, string> {
  return {
    'WWW-Authenticate': `X402 version=${challenge.x402Version}`,
    'X-Payment-Required': JSON.stringify(challenge.paymentRequirements),
    'X-Payment-Challenge': JSON.stringify(challenge),
    'Access-Control-Expose-Headers': 'X-Payment-Required, X-Payment-Challenge'
  };
}