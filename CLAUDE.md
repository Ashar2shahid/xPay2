# xPay2 - X402-Enabled Backend Proxy SaaS

A tiny SaaS where developers paste any backend URL and instantly get a paid, x402-enabled public endpoint with pricing, logs, and receipts—no code changes to their backend.

## Project Structure

This is a SaaS application that acts as a proxy layer, enabling HTTP 402 Payment Required functionality for any existing backend service.

## Key Features

- **URL Proxy**: Paste any backend URL to get a paid public endpoint
- **X402 Protocol**: Implements HTTP 402 Payment Required standard
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

# Run tests
npm test

# Lint code
npm run lint

# Type checking
npm run typecheck
```

## Development Notes

- This project implements a proxy service that sits between clients and backend APIs
- Payment processing is handled through the x402 protocol
- The service generates usage logs and receipts automatically
- No modifications are required to existing backend services

## Tech Stack

[To be determined based on package.json and codebase analysis]