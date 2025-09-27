#!/usr/bin/env node

const { createPublicClient, http } = require('viem');
const { base } = require('viem/chains');
const { wrapFetchWithPayment, createSigner } = require('x402-fetch');
require('dotenv').config();

async function testCoinGeckoAPI() {
  console.log('💰 Testing CoinGecko API via x402 proxy\\n');

  const privateKey = process.env.EVM_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('EVM_PRIVATE_KEY not found in .env');
  }

  console.log('1. Creating wallet signer from private key...');
  const signer = await createSigner('base', privateKey);
  console.log('✅ Signer created for Base network');
  console.log('✅ Account address:', signer.account.address);

  const publicClient = createPublicClient({
    chain: base,
    transport: http('https://mainnet.base.org')
  });

  console.log('\\n2. Checking USDC balance...');
  const usdcAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

  try {
    const balance = await publicClient.readContract({
      address: usdcAddress,
      abi: [{
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
      }],
      functionName: 'balanceOf',
      args: [signer.account.address]
    });

    const usdcBalance = Number(balance) / 1e6;
    console.log(`✅ USDC Balance: ${usdcBalance} USDC`);

    if (usdcBalance < 0.02) {
      console.log('\\n❌ ERROR: Insufficient USDC balance!');
      console.log(`   You need at least 0.02 USDC, but you have ${usdcBalance} USDC`);
      return;
    }

    console.log('✅ Sufficient balance for payment');

  } catch (error) {
    console.log('⚠️  Could not check USDC balance:', error.message);
    console.log('   Continuing anyway...');
  }

  console.log('\\n3. Creating x402-wrapped fetch with signer...');
  const maxValue = BigInt(1000000);
  const x402fetch = wrapFetchWithPayment(fetch, signer, maxValue);
  console.log('✅ x402 fetch wrapper created');
  console.log(`   Max payment allowed: ${Number(maxValue) / 1e6} USDC`);

  console.log('\\n4. Making request to x402-protected CoinGecko API...');
  console.log('   URL: http://localhost:3000/api/proxy/api-coingecko-com-t7siey/ping');
  console.log('   Price: $0.02 USDC');
  console.log('\\n⏳ This will:');
  console.log('   1. Get payment requirements (402 response)');
  console.log('   2. Create and sign USDC payment transaction');
  console.log('   3. Submit transaction to Base blockchain');
  console.log('   4. Wait for confirmation');
  console.log('   5. Retry request with payment proof');
  console.log('\\n⏳ Please wait, this may take 10-30 seconds...\\n');

  try {
    const startTime = Date.now();
    const response = await x402fetch('http://localhost:3000/api/proxy/api-coingecko-com-t7siey/ping', {
      method: 'GET'
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`\\n📨 Response received in ${duration}s`);
    console.log(`   Status: ${response.status}`);

    if (response.status === 200) {
      console.log('\\n✅ SUCCESS! Payment accepted and request proxied!');
      const data = await response.json();
      console.log('\\n📋 Response from CoinGecko API:');
      console.log(JSON.stringify(data, null, 2));

      console.log('\\n💸 Payment Details:');
      console.log('   Amount: $0.02 USDC');
      console.log('   Network: Base mainnet');
      console.log('   Paid to:', process.env.ADDRESS);

      const paymentResponse = response.headers.get('X-Payment-Response');
      if (paymentResponse) {
        console.log('\\n📜 Payment Receipt:');
        console.log(JSON.parse(paymentResponse));
      }
    } else {
      console.log('\\n❌ Unexpected response status');
      const text = await response.text();
      console.log('Response:', text);
    }

  } catch (error) {
    console.error('\\n❌ Error during payment:', error.message);
    console.error('\\nFull error:', error);
  }
}

if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testCoinGeckoAPI().catch(console.error);