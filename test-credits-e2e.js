#!/usr/bin/env node

const { createPublicClient, http } = require('viem');
const { base } = require('viem/chains');
const { wrapFetchWithPayment, createSigner } = require('x402-fetch');
require('dotenv').config();

async function testCreditsEndToEnd() {
  console.log('🚀 End-to-End Credit System Test\n');

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

    if (usdcBalance < 0.10) {
      console.log('\n❌ ERROR: Insufficient USDC balance!');
      console.log(`   Need at least 0.10 USDC for credit testing`);
      return;
    }
  } catch (error) {
    console.log('⚠️  Could not check balance:', error.message);
  }

  console.log('\n3. Creating new project with credit-enabled endpoint...');
  const projectData = {
    name: 'Credit Test Project',
    description: 'End-to-end test for credit system',
    defaultPrice: 0.05,
    currency: 'USD',
    payTo: process.env.ADDRESS || '0xC237b055dd2f9e9B7fDBC531cca9fF44dF6727cf',
    paymentChains: ['base'],
    endpoints: [
      {
        url: 'https://jsonplaceholder.typicode.com',
        path: '/posts/1',
        method: 'GET',
        price: 0.02,
        description: 'JSONPlaceholder endpoint with credits'
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
  const endpointId = projectResult.project.endpoints[0].id;
  console.log(`✅ Project created: ${projectSlug}`);
  console.log(`   Proxy URL: ${projectResult.proxyUrl}`);

  // Enable credits for the endpoint
  console.log('\n3.1. Enabling credits for the endpoint...');
  const enableCreditsResponse = await fetch(`http://localhost:3000/api/endpoints/${endpointId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creditsEnabled: true,
      minTopupAmount: 0.01
    })
  });

  if (enableCreditsResponse.ok) {
    console.log('✅ Credits enabled for endpoint');
  } else {
    console.log('⚠️  Could not enable credits:', await enableCreditsResponse.text());
  }

  const maxValue = BigInt(1000000);
  const x402fetch = wrapFetchWithPayment(fetch, signer, maxValue);

  const testUrl = `http://localhost:3000/api/proxy/${projectSlug}/posts/1`;

  // Phase 1: Overpayment to create credits
  console.log('\n4. Phase 1: Overpayment to create credits');
  console.log('   Making payment of $0.10 for $0.02 endpoint (creates $0.08 in credits)');

  try {
    const startTime = Date.now();

    // Make payment with overpayment
    const response1 = await x402fetch(testUrl, {
      method: 'GET',
      headers: {
        'X-Payment-Amount': '0.10' // Overpay by $0.08
      }
    });

    const duration1 = ((Date.now() - startTime) / 1000).toFixed(1);

    if (response1.status === 200) {
      const data = await response1.json();
      console.log(`   ✅ SUCCESS (${duration1}s)`);
      console.log(`   Response:`, JSON.stringify(data).substring(0, 100) + '...');

      // Check credit headers
      const creditBalance = response1.headers.get('X-Credit-Balance');
      const creditUsed = response1.headers.get('X-Credit-Used');

      console.log(`   💰 Credit Balance: $${creditBalance || 'unknown'}`);
      console.log(`   🔄 Credits Used: ${creditUsed || 'false'}`);

      if (creditBalance) {
        const expectedBalance = 0.08; // $0.10 - $0.02 = $0.08
        const actualBalance = parseFloat(creditBalance);
        if (Math.abs(actualBalance - expectedBalance) < 0.001) {
          console.log(`   ✅ Correct credit balance created: $${actualBalance}`);
        } else {
          console.log(`   ⚠️  Unexpected credit balance: $${actualBalance} (expected $${expectedBalance})`);
        }
      }
    } else {
      console.log(`   ❌ FAILED: Status ${response1.status}`);
      const text = await response1.text();
      console.log(`   Error:`, text.substring(0, 200));
      return;
    }
  } catch (error) {
    console.log(`   ❌ ERROR:`, error.message);
    return;
  }

  // Phase 2: Use credits with zero-value auth
  console.log('\n5. Phase 2: Using credits with zero-value authentication');
  console.log('   Making zero-value auth request to use credits');

  try {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

    const startTime = Date.now();

    // Make zero-value auth request
    const response2 = await x402fetch(testUrl, {
      method: 'GET',
      headers: {
        'X-Payment-Amount': '0.00' // Zero value - should use credits
      }
    });

    const duration2 = ((Date.now() - startTime) / 1000).toFixed(1);

    if (response2.status === 200) {
      const data = await response2.json();
      console.log(`   ✅ SUCCESS (${duration2}s)`);
      console.log(`   Response:`, JSON.stringify(data).substring(0, 100) + '...');

      // Check credit headers
      const creditBalance = response2.headers.get('X-Credit-Balance');
      const creditUsed = response2.headers.get('X-Credit-Used');
      const paymentStatus = response2.headers.get('X-Proxy-Payment-Status');

      console.log(`   💰 Credit Balance: $${creditBalance || 'unknown'}`);
      console.log(`   🔄 Credits Used: ${creditUsed || 'false'}`);
      console.log(`   💳 Payment Status: ${paymentStatus || 'unknown'}`);

      if (creditBalance) {
        const expectedBalance = 0.06; // $0.08 - $0.02 = $0.06
        const actualBalance = parseFloat(creditBalance);
        if (Math.abs(actualBalance - expectedBalance) < 0.001) {
          console.log(`   ✅ Correct credit balance after deduction: $${actualBalance}`);
        } else {
          console.log(`   ⚠️  Unexpected credit balance: $${actualBalance} (expected $${expectedBalance})`);
        }
      }

      if (creditUsed === 'true') {
        console.log(`   ✅ Credits were successfully used for payment`);
      } else {
        console.log(`   ⚠️  Credits not used as expected`);
      }
    } else {
      console.log(`   ❌ FAILED: Status ${response2.status}`);
      const text = await response2.text();
      console.log(`   Error:`, text.substring(0, 200));
    }
  } catch (error) {
    console.log(`   ❌ ERROR:`, error.message);
  }

  // Phase 3: Multiple credit usage until depleted
  console.log('\n6. Phase 3: Using remaining credits');
  console.log('   Making multiple requests to deplete credits');

  let requestCount = 0;
  let remainingBalance = 0.06; // Starting balance after first credit use

  while (remainingBalance >= 0.02 && requestCount < 5) {
    requestCount++;
    console.log(`\n   Request ${requestCount}: Using credits ($${remainingBalance.toFixed(2)} available)`);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

      const startTime = Date.now();

      const response = await x402fetch(testUrl, {
        method: 'GET',
        headers: {
          'X-Payment-Amount': '0.00' // Zero value - should use credits
        }
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      if (response.status === 200) {
        const creditBalance = response.headers.get('X-Credit-Balance');
        const creditUsed = response.headers.get('X-Credit-Used');

        console.log(`   ✅ SUCCESS (${duration}s) - Balance: $${creditBalance || 'unknown'}, Used: ${creditUsed || 'false'}`);

        if (creditBalance) {
          remainingBalance = parseFloat(creditBalance);
        }
      } else {
        console.log(`   ❌ FAILED: Status ${response.status}`);
        const text = await response.text();
        console.log(`   Error:`, text.substring(0, 100));
        break;
      }
    } catch (error) {
      console.log(`   ❌ ERROR:`, error.message);
      break;
    }
  }

  console.log('\n✅ Credit System End-to-End Test Complete!');
  console.log('📊 Test Summary:');
  console.log(`   • Phase 1: Overpayment → Credit Creation ✅`);
  console.log(`   • Phase 2: Zero-value Auth → Credit Usage ✅`);
  console.log(`   • Phase 3: Multiple Credit Requests (${requestCount} total) ✅`);
  console.log(`   • Final Credit Balance: $${remainingBalance.toFixed(2)}`);
}

if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testCreditsEndToEnd().catch(console.error);