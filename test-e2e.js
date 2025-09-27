#!/usr/bin/env node

const { createPublicClient, http } = require('viem');
const { base } = require('viem/chains');
const { wrapFetchWithPayment, createSigner } = require('x402-fetch');
require('dotenv').config();

async function testEndToEnd() {
  console.log('🚀 End-to-End Test: Create Project + Test 3 Cross-Domain Endpoints\n');

  const privateKey = process.env.EVM_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('EVM_PRIVATE_KEY not found in .env');
  }

  console.log('1. Creating wallet signer...');
  const signer = await createSigner('base', privateKey);
  console.log('✅ Account:', signer.account.address);

  const publicClient = createPublicClient({
    chain: base,
    transport: http('https://mainnet.base.org')
  });

  console.log('\n2. Checking USDC balance...');
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

    if (usdcBalance < 0.06) {
      console.log('\n❌ ERROR: Insufficient USDC balance!');
      console.log(`   Need at least 0.06 USDC (0.01 + 0.02 + 0.03)`);
      return;
    }
  } catch (error) {
    console.log('⚠️  Could not check balance:', error.message);
  }

  console.log('\n3. Creating new project with 3 cross-domain endpoints...');
  const projectData = {
    name: 'E2E Test Project',
    description: 'End-to-end test with 3 different APIs',
    defaultPrice: 0.10,
    currency: 'USD',
    payTo: process.env.ADDRESS || '0xC237b055dd2f9e9B7fDBC531cca9fF44dF6727cf',
    paymentChains: ['base'],
    endpoints: [
      {
        url: 'https://jsonplaceholder.typicode.com',
        path: '/posts/1',
        method: 'GET',
        price: 0.01,
        description: 'JSONPlaceholder post endpoint'
      },
      {
        url: 'https://api.coingecko.com/api/v3',
        path: '/ping',
        method: 'GET',
        price: 0.02,
        description: 'CoinGecko ping endpoint'
      },
      {
        url: 'https://api.github.com',
        path: '/zen',
        method: 'GET',
        price: 0.03,
        description: 'GitHub zen endpoint'
      }
    ]
  };

  const projectResponse = await fetch('http://localhost:3000/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(projectData)
  });

  const projectResult = await projectResponse.json();

  if (!projectResponse.ok) {
    console.log('❌ Failed to create project:', projectResult);
    return;
  }

  const projectSlug = projectResult.project.slug;
  console.log(`✅ Project created: ${projectSlug}`);
  console.log(`   Proxy URL: ${projectResult.proxyUrl}`);
  console.log(`   Endpoints: ${projectResult.project.endpoints.length}`);

  const maxValue = BigInt(1000000);
  const x402fetch = wrapFetchWithPayment(fetch, signer, maxValue);

  const endpoints = [
    { path: '/posts/1', name: 'JSONPlaceholder', price: 0.01, expectedKey: 'userId' },
    { path: '/ping', name: 'CoinGecko', price: 0.02, expectedKey: 'gecko_says' },
    { path: '/zen', name: 'GitHub', price: 0.03, expectedKey: null }
  ];

  console.log('\n4. Testing all 3 endpoints with real payments...\n');

  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i];
    console.log(`\n📍 Test ${i + 1}/3: ${endpoint.name} (${endpoint.path})`);
    console.log(`   Price: $${endpoint.price} USDC`);
    console.log(`   ⏳ Making payment and fetching...`);

    try {
      const startTime = Date.now();
      const url = `http://localhost:3000/api/proxy/${projectSlug}${endpoint.path}`;

      const response = await x402fetch(url, { method: 'GET' });
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      if (response.status === 200) {
        const data = await response.json();
        console.log(`   ✅ SUCCESS (${duration}s)`);
        console.log(`   Response:`, JSON.stringify(data).substring(0, 100) + '...');

        if (endpoint.expectedKey && data[endpoint.expectedKey]) {
          console.log(`   ✅ Verified: Contains expected key '${endpoint.expectedKey}'`);
        }
      } else {
        console.log(`   ❌ FAILED: Status ${response.status}`);
        const text = await response.text();
        console.log(`   Error:`, text.substring(0, 200));
      }
    } catch (error) {
      console.log(`   ❌ ERROR:`, error.message);
    }

    if (i < endpoints.length - 1) {
      console.log('   Waiting 2 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n\n✅ End-to-End Test Complete!');
  console.log('   Total endpoints tested: 3');
  console.log('   Total cost: $0.06 USDC');
}

if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testEndToEnd().catch(console.error);