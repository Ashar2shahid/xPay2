# xPay2 - X402-Enabled Backend Proxy SaaS

A tiny SaaS where developers paste any backend URL and instantly get a paid, x402-enabled public endpoint with pricing, logs, and receipts—no code changes to their backend.

## Project Structure

This is a SaaS application that acts as a proxy layer, enabling HTTP 402 Payment Required functionality for any existing backend service.

## Key Features

- **URL Proxy**: Paste any backend URL to get a paid public endpoint
- **X402 Protocol**: Implements HTTP 402 Payment Required standard
- **Credit System**: Overpayment creates credits for subsequent requests
- **Pricing Management**: Configure pricing for API endpoints
- **Usage Logs**: Track API usage and requests
- **Payment Receipts**: Generate receipts for API usage
- **Zero Backend Changes**: Works with existing backends without modification

## Common Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run end-to-end tests
node e2e-test.js  # Comprehensive test suite covering all features

# Lint code
npm run lint

# Type checking
npm run typecheck

# Database migration (add credit system tables)
npm run migrate-schema
```

## Development Notes

- This project implements a proxy service that sits between clients and backend APIs
- Payment processing is handled through the x402 protocol
- The service generates usage logs and receipts automatically
- No modifications are required to existing backend services
- Credit system allows prepaid API usage with zero-value authentication

## Credit System

The credit system enables users to prepay for API usage:

1. **Overpayment → Credits**: When a user pays more than the endpoint price, the excess is stored as credits
2. **Zero-value Authentication**: Subsequent requests can use zero-value x402 payments to authenticate and use credits
3. **Automatic Deduction**: Credits are automatically deducted for each request
4. **No Settlement**: Credit-based requests skip on-chain settlement (instant, no gas fees)

### Enabling Credits

```bash
# Enable credits for an endpoint via API
PATCH /api/endpoints/{endpointId}
{
  "creditsEnabled": true,
  "minTopupAmount": 0.01
}
```

## Tech Stack

- **Framework**: Next.js (Pages Router)
- **Database**: SQLite with Drizzle ORM
- **Payment Protocol**: x402 with Coinbase Facilitator
- **Blockchain**: Base (USDC payments)
- **Signing**: viem for EIP-712 signatures
- **Decimal Arithmetic**: BigNumber.js for precise financial calculations

## Security

### ✅ EIP-712 Signature Verification

Zero-value authentication for credit usage implements proper cryptographic verification:

- **EIP-712 Signature Verification**: Uses viem's `verifyTypedData` to verify signatures
- **USDC TransferWithAuthorization**: Validates against USDC's EIP-712 domain
- **Multi-chain Support**: Supports Base, Optimism, Arbitrum, and Polygon
- **Timestamp Validation**: Ensures requests are within the valid time window
- **Replay Protection**: Uses nonces to prevent replay attacks

Implementation in `src/lib/credits.ts:verifyZeroValueAuthSignature`

## Precision & Accuracy

### ✅ BigNumber.js for Financial Calculations

All monetary calculations use BigNumber.js to avoid JavaScript floating point precision errors:

- **Credit Additions**: `new BigNumber(balance).plus(amount)` instead of `balance + amount`
- **Credit Deductions**: `new BigNumber(balance).minus(amount)` instead of `balance - amount`
- **Comparisons**: `new BigNumber(balance).isGreaterThanOrEqualTo(price)` instead of `balance >= price`
- **Overpayment**: Uses BigNumber for calculating excess payments

**Why this matters:**
```javascript
// Without BigNumber (wrong):
0.03 - 0.01 = 0.019999999999999997 ❌

// With BigNumber (correct):
new BigNumber(0.03).minus(0.01).toNumber() = 0.02 ✅
```

Implementation in `src/lib/credits.ts` for all credit operations.

## Currency Conversion

### ✅ x402 Library Integration

USDC uses 6 decimals (micro-USDC). Currency conversions use the x402 library's asset definitions:

- **Dollars → Micro-USDC**: `processPriceToAtomicAmount("$0.02", "base")` → `"20000"`
- **Micro-USDC → Dollars**: `atomicAmountToDollars("20000", "base")` → `0.02`

Both conversions use `getDefaultAsset(network)` to ensure consistency with the x402 protocol.

Implementation in `src/lib/x402-facilitator.ts:atomicAmountToDollars`

## Testing

### Comprehensive E2E Test Suite

Run `node e2e-test.js` to execute 20 automated tests covering:

1. **Basic Payment Flow** (3 tests)
   - 402 responses without payment
   - Payment requirements format
   - Multi-price endpoint payments

2. **Credit System - Overpayment** (3 tests)
   - Credit enablement
   - Overpayment creates correct credit balance
   - Total deposited tracking

3. **Credit Usage with Zero-Value Auth** (4 tests)
   - Zero-value authentication acceptance
   - Credit deduction accuracy
   - Credit usage tracking in headers
   - Settlement skipping for credit requests

4. **Credit Exhaustion** (4 tests)
   - Multiple credit requests until depletion
   - Final balance precision (exactly $0)
   - 402 response when credits exhausted
   - Payment alternatives provided

5. **Edge Cases** (2 tests)
   - Invalid signature rejection
   - Expired timestamp rejection

**Test Results:** ✅ 20/20 tests passing (100% success rate)