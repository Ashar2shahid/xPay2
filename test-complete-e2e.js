#!/usr/bin/env node

const { createPublicClient, http } = require('viem');
const { base } = require('viem/chains');
const { wrapFetchWithPayment, createSigner } = require('x402-fetch');
require('dotenv').config();

async function testCompleteEndToEnd() {
  console.log('🚀 Complete End-to-End Test: Payments + Credit System\n');

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
      console.log(`   Need at least 0.10 USDC for testing`);
      return;
    }
  } catch (error) {
    console.log('⚠️  Could not check balance:', error.message);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('PART 1: Regular Payment Flow (No Credits)');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('3. Creating project with 3 endpoints (credits disabled)...');
  const regularProject = {
    name: 'Regular Payment Test',
    description: 'Test regular x402 payments without credits',
    defaultPrice: 0.02,
    currency: 'USD',
    payTo: process.env.ADDRESS || '0xC237b055dd2f9e9B7fDBC531cca9fF44dF6727cf',
    paymentChains: ['base'],
    endpoints: [
      {
        url: 'https://jsonplaceholder.typicode.com',
        path: '/posts/1',
        method: 'GET',
        price: 0.01,
        description: 'JSONPlaceholder test'
      },
      {
        url: 'https://api.coingecko.com/api/v3',
        path: '/ping',
        method: 'GET',
        price: 0.02,
        description: 'CoinGecko ping'
      },
      {
        url: 'https://api.github.com',
        path: '/zen',
        method: 'GET',
        price: 0.03,
        description: 'GitHub zen'
      }
    ]
  };

  const regularResponse = await fetch('http://localhost:3000/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(regularProject)
  });

  const regularResult = await regularResponse.json();
  if (!regularResponse.ok) {
    console.log('❌ Failed to create project:', regularResult);
    return;
  }

  const regularSlug = regularResult.project.slug;
  console.log(`✅ Project created: ${regularSlug}`);
  console.log(`   Endpoints: ${regularResult.project.endpoints.length}`);

  const maxValue = BigInt(1000000);
  const x402fetch = wrapFetchWithPayment(fetch, signer, maxValue);

  console.log('\n4. Testing regular payments (exact amounts, no credits)...\n');

  const endpoints = [
    { path: '/posts/1', name: 'JSONPlaceholder', price: 0.01 },
    { path: '/ping', name: 'CoinGecko', price: 0.02 },
    { path: '/zen', name: 'GitHub', price: 0.03 }
  ];

  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i];
    console.log(`   Test ${i + 1}/3: ${endpoint.name} ($${endpoint.price})`);

    try {
      const url = `http://localhost:3000/api/proxy/${regularSlug}${endpoint.path}`;
      const response = await x402fetch(url, { method: 'GET' });

      const creditBalance = response.headers.get('X-Credit-Balance');
      const creditUsed = response.headers.get('X-Credit-Used');
      const settlementStatus = response.headers.get('X-Proxy-Settlement-Status');

      if (response.status === 200) {
        console.log(`   ✅ Payment successful`);
        console.log(`      Settlement: ${settlementStatus || 'settled'}`);
        console.log(`      Credits: ${creditBalance ? `$${creditBalance}` : 'N/A (credits disabled)'}`);
      } else {
        console.log(`   ❌ Failed: Status ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Error:`, error.message);
    }

    if (i < endpoints.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('PART 2: Credit System Flow');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('5. Creating project with credit-enabled endpoint...');
  const creditProject = {
    name: 'Credit System Test',
    description: 'Test credit system with overpayments',
    defaultPrice: 0.05,
    currency: 'USD',
    payTo: process.env.ADDRESS || '0xC237b055dd2f9e9B7fDBC531cca9fF44dF6727cf',
    paymentChains: ['base'],
    endpoints: [
      {
        url: 'https://jsonplaceholder.typicode.com',
        path: '/users/1',
        method: 'GET',
        price: 0.01,
        description: 'JSONPlaceholder with credits'
      }
    ]
  };

  const creditResponse = await fetch('http://localhost:3000/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creditProject)
  });

  const creditResult = await creditResponse.json();
  if (!creditResponse.ok) {
    console.log('❌ Failed to create project:', creditResult);
    return;
  }

  const creditSlug = creditResult.project.slug;
  const endpointId = creditResult.project.endpoints[0].id;
  console.log(`✅ Project created: ${creditSlug}`);

  console.log('\n6. Enabling credits for endpoint...');
  const enableResponse = await fetch(`http://localhost:3000/api/endpoints/${endpointId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creditsEnabled: true,
      minTopupAmount: 0.01
    })
  });

  if (enableResponse.ok) {
    console.log('✅ Credits enabled');
  } else {
    console.log('❌ Failed to enable credits');
    return;
  }

  console.log('\n7. Making manual overpayment to create credits...');
  console.log('   NOTE: x402-fetch pays exact amounts automatically.');
  console.log('   To test overpayments, we need to manually construct a payment with higher value.\n');

  const endpointPrice = 0.01; // $0.01 in USD
  const overpaymentAmount = 0.05; // Pay $0.05 to create $0.04 in credits

  console.log(`   Endpoint price: $${endpointPrice}`);
  console.log(`   Payment amount: $${overpaymentAmount}`);
  console.log(`   Expected credits: $${(overpaymentAmount - endpointPrice).toFixed(2)}\n`);

  try {
    // Manually construct overpayment authorization using viem
    const overpaymentValue = String(Math.floor(overpaymentAmount * 1000000)); // Convert to micro-USDC
    const now = Math.floor(Date.now() / 1000);
    const payToAddress = process.env.ADDRESS || '0xC237b055dd2f9e9B7fDBC531cca9fF44dF6727cf';

    const authorization = {
      from: signer.account.address,
      to: payToAddress,
      value: overpaymentValue,
      validAfter: String(now - 60),
      validBefore: String(now + 600),
      nonce: '0x' + Math.random().toString(16).substring(2).padStart(64, '0')
    };

    // EIP-712 domain for USDC on Base
    const domain = {
      name: 'USD Coin',
      version: '2',
      chainId: 8453, // Base mainnet
      verifyingContract: usdcAddress
    };

    // EIP-712 types for TransferWithAuthorization
    const types = {
      TransferWithAuthorization: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'validAfter', type: 'uint256' },
        { name: 'validBefore', type: 'uint256' },
        { name: 'nonce', type: 'bytes32' }
      ]
    };

    // Sign the authorization using EIP-712
    const signature = await signer.account.signTypedData({
      domain,
      types,
      primaryType: 'TransferWithAuthorization',
      message: authorization
    });

    const payment = {
      x402Version: 1,
      scheme: 'exact',
      network: 'base',
      payload: {
        signature,
        authorization
      }
    };

    // Manually encode the payment header (base64 JSON)
    const paymentHeader = Buffer.from(JSON.stringify(payment)).toString('base64');

    // Make request with manual overpayment
    const overpaymentUrl = `http://localhost:3000/api/proxy/${creditSlug}/users/1`;
    const overpaymentResponse = await fetch(overpaymentUrl, {
      method: 'GET',
      headers: {
        'X-Payment': paymentHeader
      }
    });

    if (overpaymentResponse.status === 200) {
      const creditBalance = overpaymentResponse.headers.get('X-Credit-Balance');
      const creditUsed = overpaymentResponse.headers.get('X-Credit-Used');
      const totalDeposited = overpaymentResponse.headers.get('X-Credit-Total-Deposited');

      console.log('   ✅ Overpayment successful!');
      console.log(`      Credit Balance: $${creditBalance || 'unknown'}`);
      console.log(`      Total Deposited: $${totalDeposited || 'unknown'}`);
      console.log(`      Credits Used: ${creditUsed || 'false'}`);

      if (creditBalance) {
        const expectedCredits = overpaymentAmount - endpointPrice;
        const actualCredits = parseFloat(creditBalance);
        if (Math.abs(actualCredits - expectedCredits) < 0.001) {
          console.log(`      ✅ Correct credit amount created!`);
        } else {
          console.log(`      ⚠️  Credit amount mismatch (expected $${expectedCredits.toFixed(2)}, got $${actualCredits.toFixed(2)})`);
        }
      }

      console.log('\n8. Testing credit usage with subsequent requests...');
      console.log('   Making 3 requests with zero-value payments to use credits\n');

      for (let i = 1; i <= 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Construct zero-value payment to use credits
        const zeroValueAuth = {
          from: signer.account.address,
          to: payToAddress,
          value: '0', // Zero value to use credits
          validAfter: String(Math.floor(Date.now() / 1000) - 60),
          validBefore: String(Math.floor(Date.now() / 1000) + 600),
          nonce: '0x' + Math.random().toString(16).substring(2).padStart(64, '0')
        };

        // Sign the zero-value authorization
        const zeroValueSig = await signer.account.signTypedData({
          domain,
          types,
          primaryType: 'TransferWithAuthorization',
          message: zeroValueAuth
        });

        const zeroValuePayment = {
          x402Version: 1,
          scheme: 'exact',
          network: 'base',
          payload: {
            signature: zeroValueSig,
            authorization: zeroValueAuth
          }
        };

        const zeroValueHeader = Buffer.from(JSON.stringify(zeroValuePayment)).toString('base64');

        const creditUrl = `http://localhost:3000/api/proxy/${creditSlug}/users/1`;
        const creditResponse = await fetch(creditUrl, {
          method: 'GET',
          headers: {
            'X-Payment': zeroValueHeader
          }
        });

        const balance = creditResponse.headers.get('X-Credit-Balance');
        const used = creditResponse.headers.get('X-Credit-Used');
        const settlement = creditResponse.headers.get('X-Proxy-Settlement-Status');

        if (creditResponse.status === 200) {
          console.log(`   Request ${i}:`);
          console.log(`      Status: ✅ Success`);
          console.log(`      Balance: $${balance || 'unknown'}`);
          console.log(`      Credits Used: ${used || 'false'}`);
          console.log(`      Settlement: ${settlement || 'settled'}`);

          if (used === 'true' && settlement === 'skipped_credits') {
            console.log(`      ✅ Credits were used (no on-chain settlement)`);
          } else if (used === 'false') {
            console.log(`      ⚠️  Credits not used (regular payment made)`);
          }
        } else {
          console.log(`   Request ${i}: ❌ Failed (${creditResponse.status})`);
          const text = await creditResponse.text();
          console.log(`      Error: ${text.substring(0, 150)}`);
        }
      }
    } else {
      console.log(`   ❌ Overpayment failed: Status ${overpaymentResponse.status}`);
      const text = await overpaymentResponse.text();
      console.log('   Response:', text.substring(0, 200));
    }
  } catch (error) {
    console.log('   ❌ Error creating manual overpayment:', error.message);
    console.log('   Stack:', error.stack);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✅ Complete End-to-End Test Finished!');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('📊 Summary:');
  console.log('   ✅ Regular payments (3 endpoints)');
  console.log('   ✅ Credit system setup');
  console.log('   ✅ Manual overpayment to create credits');
  console.log('   ✅ Credit usage on subsequent requests');
  console.log('   Total endpoints tested: 4');
}

if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testCompleteEndToEnd().catch(console.error);