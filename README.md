# xPay2 - HTTP 402 Payment Gateway

> Turn any API into a paid service instantly with HTTP 402 Payment Required protocol

xPay2 is a proxy service that adds payment functionality to any existing API without requiring code changes. Developers paste their backend URL, set a price, and get a paid public endpoint powered by the x402 protocol and USDC payments on Base.

## 🚀 Features

- **🔌 Zero Backend Integration** - Works with any HTTP API, no code changes needed
- **💳 HTTP 402 Protocol** - Standards-compliant payment-required responses
- **⚡ Credit System** - Prepaid API usage with instant, gasless requests
- **🔐 EIP-712 Signatures** - Cryptographically secure authentication
- **📊 Usage Analytics** - Track all requests, payments, and settlements
- **🌐 Multi-Chain Support** - Base, Optimism, Arbitrum, Polygon
- **💰 USDC Payments** - Stable, predictable pricing

## 🎯 Quick Start

### Prerequisites

- Node.js 18+
- USDC on Base network
- Private key with USDC balance

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd ethindia-xPay2

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your EVM_PRIVATE_KEY and ADDRESS to .env

# Initialize the database
npm run init-db

# Start the development server
npm run dev
```

### Create Your First Paid Endpoint

```bash
# 1. Create a project with a paid endpoint
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My API",
    "description": "My paid API service",
    "defaultPrice": 0.01,
    "currency": "USD",
    "payTo": "0xYourAddress",
    "paymentChains": ["base"],
    "endpoints": [{
      "url": "https://api.example.com",
      "path": "/data",
      "method": "GET",
      "price": 0.01,
      "description": "Get data endpoint"
    }]
  }'

# 2. Your proxy URL is now live!
# http://localhost:3000/api/proxy/{project-slug}/data

# 3. Requests without payment return 402
curl http://localhost:3000/api/proxy/{project-slug}/data
# Returns: 402 Payment Required with payment instructions

# 4. Use x402-fetch to make paid requests
# See examples/ directory for client code
```

## 💡 Credit System

The credit system enables prepaid API usage with instant, gasless requests:

### How It Works

1. **Overpay once** - Pay $0.05 for a $0.01 endpoint
2. **Get $0.04 in credits** - Automatically stored in your account
3. **Use credits instantly** - Make requests with zero-value signatures
4. **No gas fees** - Credit usage skips on-chain settlement

### Example Flow

```javascript
// First request: Pay $0.05 for $0.01 endpoint
// → Creates $0.04 in credits

// Subsequent requests: Use zero-value authentication
// → Deducts $0.01 from credits (now $0.03)
// → Instant response, no on-chain transaction
// → No gas fees

// Continue until credits depleted
// → System returns 402 asking for payment
```

### Enable Credits

```bash
# Enable credits for an endpoint
curl -X PATCH http://localhost:3000/api/endpoints/{endpoint-id} \
  -H "Content-Type: application/json" \
  -d '{
    "creditsEnabled": true,
    "minTopupAmount": 0.01
  }'
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
node e2e-test.js
```

**Test Coverage:**
- ✅ 20/20 tests passing
- Basic payment flow
- Credit creation via overpayment
- Zero-value authentication
- Credit exhaustion handling
- Edge cases (invalid signatures, expired timestamps)

## 🏗️ Architecture

```
┌─────────────┐
│   Client    │
│ (x402-fetch)│
└──────┬──────┘
       │ X-Payment: <signature>
       ▼
┌─────────────────────────────────┐
│        xPay2 Proxy              │
│  ┌──────────────────────────┐   │
│  │ 1. Verify Payment        │   │
│  │    - EIP-712 signature   │   │
│  │    - Credit balance      │   │
│  └──────────────────────────┘   │
│  ┌──────────────────────────┐   │
│  │ 2. Forward Request       │   │
│  │    - Add headers         │   │
│  │    - Proxy to backend    │   │
│  └──────────────────────────┘   │
│  ┌──────────────────────────┐   │
│  │ 3. Settle Payment        │   │
│  │    - On-chain (if paid)  │   │
│  │    - Skip (if credits)   │   │
│  └──────────────────────────┘   │
└────────┬────────────────────────┘
         │ Response + Receipt
         ▼
┌─────────────────┐
│  Your Backend   │
│ (no changes!)   │
└─────────────────┘
```

## 🔧 API Reference

### Create Project

```http
POST /api/projects
Content-Type: application/json

{
  "name": "My API",
  "description": "API description",
  "defaultPrice": 0.02,
  "currency": "USD",
  "payTo": "0xYourAddress",
  "paymentChains": ["base"],
  "endpoints": [...]
}
```

### Enable Credits

```http
PATCH /api/endpoints/{endpointId}
Content-Type: application/json

{
  "creditsEnabled": true,
  "minTopupAmount": 0.01
}
```

### Make Paid Request

```http
GET /api/proxy/{project-slug}/{endpoint-path}
X-Payment: <base64-encoded-x402-payment>
```

## 📊 Response Headers

All proxied requests include tracking headers:

- `X-Proxy-Payment-Status` - Payment verification status
- `X-Proxy-Settlement-Status` - On-chain settlement status
- `X-Credit-Balance` - Remaining credit balance (if credits enabled)
- `X-Credit-Used` - Whether credits were used for this request
- `X-Credit-Total-Deposited` - Total credits ever deposited
- `X-Credit-Total-Spent` - Total credits ever spent

## 🛠️ Tech Stack

- **Next.js** - Pages Router for API routes
- **SQLite + Drizzle ORM** - Lightweight database
- **viem** - Ethereum interactions and EIP-712 signing
- **x402** - HTTP 402 protocol implementation
- **BigNumber.js** - Precise decimal arithmetic
- **Base Network** - Layer 2 for cheap USDC transfers

## 🔐 Security Features

### EIP-712 Signature Verification
- Full cryptographic verification of all signatures
- Validates against USDC's EIP-712 domain
- Timestamp validation (validAfter/validBefore)
- Nonce-based replay protection

### BigNumber Arithmetic
- Eliminates JavaScript floating-point errors
- Ensures exact credit calculations
- Prevents balance discrepancies

Example:
```javascript
// Without BigNumber ❌
0.03 - 0.01 = 0.019999999999999997

// With BigNumber ✅
new BigNumber(0.03).minus(0.01) = 0.02
```

## 📝 Environment Variables

```bash
# Required
EVM_PRIVATE_KEY=0x...           # Private key for settlement
ADDRESS=0x...                   # Address to receive payments

# Optional
FACILITATOR_URL=https://facilitator.coinbase.com
ENABLE_SETTLEMENT=true          # Enable on-chain settlement
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🚀 Deployment

```bash
# Build for production
npm run build

# Start production server
npm start

# Or deploy to Vercel
vercel deploy
```

## 📚 Examples

See the `examples/` directory for:
- Client implementation with x402-fetch
- Credit usage patterns
- Error handling
- Multi-endpoint projects

## 🤝 Contributing

Contributions welcome! Please read [CLAUDE.md](./CLAUDE.md) for development guidelines.

## 📄 License

MIT

## 🔗 Links

- [x402 Protocol](https://github.com/coinbase/x402)
- [Base Network](https://base.org)
- [USDC on Base](https://www.circle.com/usdc)
- [EIP-712 Standard](https://eips.ethereum.org/EIPS/eip-712)

---

Built with ❤️ for ETHIndia 2024