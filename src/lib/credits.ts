import { db, endpointCredits, NewEndpointCredit, EndpointCredit } from './db';
import { eq, and } from 'drizzle-orm';
import { verifyTypedData } from 'viem';
import BigNumber from 'bignumber.js';

export interface CreditBalance {
  id: string;
  balance: number;
  totalDeposited: number;
  totalSpent: number;
  lastTopupAmount?: number;
  lastTopupTxHash?: string;
}

/**
 * Get credit balance for a specific user and endpoint
 */
export async function getCreditBalance(
  endpointId: string,
  userAddress: string
): Promise<CreditBalance | null> {
  const credits = await db.select()
    .from(endpointCredits)
    .where(and(
      eq(endpointCredits.endpointId, endpointId),
      eq(endpointCredits.userAddress, userAddress.toLowerCase())
    ))
    .limit(1);

  if (credits.length === 0) {
    return null;
  }

  const credit = credits[0];
  return {
    id: credit.id,
    balance: credit.balance,
    totalDeposited: credit.totalDeposited,
    totalSpent: credit.totalSpent,
    lastTopupAmount: credit.lastTopupAmount || undefined,
    lastTopupTxHash: credit.lastTopupTxHash || undefined
  };
}

/**
 * Create or update credit balance for a user
 */
export async function addCredits(
  projectId: string,
  endpointId: string,
  userAddress: string,
  amount: number,
  txHash?: string
): Promise<CreditBalance> {
  const normalizedAddress = userAddress.toLowerCase();

  // Check if credit record exists
  const existing = await getCreditBalance(endpointId, normalizedAddress);

  if (existing) {
    // Update existing credit balance using BigNumber for precision
    const newBalance = new BigNumber(existing.balance).plus(amount).toNumber();
    const newTotalDeposited = new BigNumber(existing.totalDeposited).plus(amount).toNumber();

    const updatedCredit = await db.update(endpointCredits)
      .set({
        balance: newBalance,
        totalDeposited: newTotalDeposited,
        lastTopupAmount: amount,
        lastTopupTxHash: txHash || null,
        updatedAt: new Date()
      })
      .where(eq(endpointCredits.id, existing.id))
      .returning();

    return {
      id: updatedCredit[0].id,
      balance: updatedCredit[0].balance,
      totalDeposited: updatedCredit[0].totalDeposited,
      totalSpent: updatedCredit[0].totalSpent,
      lastTopupAmount: updatedCredit[0].lastTopupAmount || undefined,
      lastTopupTxHash: updatedCredit[0].lastTopupTxHash || undefined
    };
  } else {
    // Create new credit record
    const newCredit: NewEndpointCredit = {
      projectId,
      endpointId,
      userAddress: normalizedAddress,
      balance: amount,
      totalDeposited: amount,
      totalSpent: 0,
      lastTopupAmount: amount,
      lastTopupTxHash: txHash || null
    };

    const createdCredit = await db.insert(endpointCredits)
      .values(newCredit)
      .returning();

    return {
      id: createdCredit[0].id,
      balance: createdCredit[0].balance,
      totalDeposited: createdCredit[0].totalDeposited,
      totalSpent: createdCredit[0].totalSpent,
      lastTopupAmount: createdCredit[0].lastTopupAmount || undefined,
      lastTopupTxHash: createdCredit[0].lastTopupTxHash || undefined
    };
  }
}

/**
 * Deduct credits from a user's balance
 */
export async function deductCredits(
  endpointId: string,
  userAddress: string,
  amount: number
): Promise<CreditBalance | null> {
  const normalizedAddress = userAddress.toLowerCase();
  const existing = await getCreditBalance(endpointId, normalizedAddress);

  // Use BigNumber for precise comparison
  if (!existing || new BigNumber(existing.balance).isLessThan(amount)) {
    return null; // Insufficient credits
  }

  // Use BigNumber for precise arithmetic
  const newBalance = new BigNumber(existing.balance).minus(amount).toNumber();
  const newTotalSpent = new BigNumber(existing.totalSpent).plus(amount).toNumber();

  const updatedCredit = await db.update(endpointCredits)
    .set({
      balance: newBalance,
      totalSpent: newTotalSpent,
      updatedAt: new Date()
    })
    .where(eq(endpointCredits.id, existing.id))
    .returning();

  return {
    id: updatedCredit[0].id,
    balance: updatedCredit[0].balance,
    totalDeposited: updatedCredit[0].totalDeposited,
    totalSpent: updatedCredit[0].totalSpent,
    lastTopupAmount: updatedCredit[0].lastTopupAmount || undefined,
    lastTopupTxHash: updatedCredit[0].lastTopupTxHash || undefined
  };
}

/**
 * Check if a user has sufficient credits for a request
 */
export async function hasSufficientCredits(
  endpointId: string,
  userAddress: string,
  requiredAmount: number
): Promise<boolean> {
  const balance = await getCreditBalance(endpointId, userAddress);
  return balance ? new BigNumber(balance.balance).isGreaterThanOrEqualTo(requiredAmount) : false;
}

/**
 * Calculate overpayment amount (payment value - endpoint price)
 */
export function calculateOverpayment(paymentValue: number, endpointPrice: number): number {
  const overpayment = new BigNumber(paymentValue).minus(endpointPrice);
  return overpayment.isGreaterThan(0) ? overpayment.toNumber() : 0;
}

/**
 * Verify that a payment authorization signature is valid for authentication
 * Uses EIP-712 signature verification to ensure the request is authentic
 */
export async function verifyZeroValueAuthSignature(
  decodedPayment: any
): Promise<boolean> {
  try {
    // Validate payload structure
    if (!decodedPayment?.payload?.authorization || !decodedPayment?.payload?.signature || !decodedPayment?.network) {
      console.log('[Credits] Invalid payment structure');
      return false;
    }

    // Check that value is "0" for auth-only requests
    if (decodedPayment.payload.authorization.value !== "0") {
      console.log('[Credits] Value is not zero:', decodedPayment.payload.authorization.value);
      return false;
    }

    // Check timestamp validity
    const now = Math.floor(Date.now() / 1000);
    const validAfter = parseInt(decodedPayment.payload.authorization.validAfter);
    const validBefore = parseInt(decodedPayment.payload.authorization.validBefore);

    if (isNaN(validAfter) || isNaN(validBefore) || now < validAfter || now > validBefore) {
      console.log('[Credits] Invalid or expired timestamp');
      return false;
    }

    // Get USDC contract address and chain ID from the payment's network
    const usdcAddress = getUsdcAddress(decodedPayment.network);
    const chainId = getChainId(decodedPayment.network);

    if (!usdcAddress || !chainId) {
      console.log('[Credits] Unsupported network:', decodedPayment.network);
      return false;
    }

    // Verify the EIP-712 signature directly from payload
    const isValid = await verifyTypedData({
      address: decodedPayment.payload.authorization.from as `0x${string}`,
      domain: {
        name: 'USD Coin',
        version: '2',
        chainId,
        verifyingContract: usdcAddress as `0x${string}`
      },
      types: {
        TransferWithAuthorization: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'validAfter', type: 'uint256' },
          { name: 'validBefore', type: 'uint256' },
          { name: 'nonce', type: 'bytes32' }
        ]
      },
      primaryType: 'TransferWithAuthorization',
      message: {
        from: decodedPayment.payload.authorization.from,
        to: decodedPayment.payload.authorization.to,
        value: BigInt(decodedPayment.payload.authorization.value),
        validAfter: BigInt(decodedPayment.payload.authorization.validAfter),
        validBefore: BigInt(decodedPayment.payload.authorization.validBefore),
        nonce: decodedPayment.payload.authorization.nonce
      },
      signature: decodedPayment.payload.signature as `0x${string}`
    });

    if (isValid) {
      console.log('[Credits] ✅ Zero-value auth signature verified');
      return true;
    } else {
      console.log('[Credits] ❌ Invalid signature');
      return false;
    }
  } catch (error) {
    console.error('[Credits] Signature verification error:', error);
    return false;
  }
}

/**
 * Get USDC contract address for a given network
 */
function getUsdcAddress(network: string): string | null {
  const addresses: Record<string, string> = {
    'base': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    'optimism': '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    'arbitrum': '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    'polygon': '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'
  };
  return addresses[network] || null;
}

/**
 * Get chain ID for a given network
 */
function getChainId(network: string): number | null {
  const chainIds: Record<string, number> = {
    'base': 8453,
    'optimism': 10,
    'arbitrum': 42161,
    'polygon': 137
  };
  return chainIds[network] || null;
}