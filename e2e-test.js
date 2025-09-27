#!/usr/bin/env node

const { createPublicClient, http } = require('viem');
const { base } = require('viem/chains');
const { wrapFetchWithPayment, createSigner } = require('x402-fetch');
require('dotenv').config();

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, details = '') {
  results.tests.push({ name, passed, details });
  if (passed) {
    results.passed++;
    console.log(`   ✅ ${name}`);
  } else {
    results.failed++;
    console.log(`   ❌ ${name}`);
  }
  if (details) {
    console.log(`      ${details}`);
  }
}

async function runComprehensiveE2ETests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 Comprehensive End-to-End Test Suite');
  console.log('═══════════════════════════════════════════════════════\n');

  const privateKey = process.env.EVM_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('EVM_PRIVATE_KEY not found in .env');
  }

  console.log('Setup: Creating wallet signer...');
  const signer = await createSigner('base', privateKey);
  console.log(`✅ Account: ${signer.account.address}\n`);

  const publicClient = createPublicClient({
    chain: base,
    transport: http('https://mainnet.base.org')
  });

  console.log('Setup: Checking USDC balance...');
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
    console.log(`✅ USDC Balance: ${usdcBalance} USDC\n`);

    if (usdcBalance < 0.20) {
      console.log('❌ ERROR: Insufficient USDC balance!');
      console.log(`   Need at least 0.20 USDC for comprehensive testing\n`);
      return;
    }
  } catch (error) {
    console.log('⚠️  Could not check balance:', error.message, '\n');
  }

  // ═══════════════════════════════════════════════════════
  // TEST SUITE 1: Basic Payment Flow (No Credits)
  // ═══════════════════════════════════════════════════════
  console.log('═══════════════════════════════════════════════════════');
  console.log('TEST SUITE 1: Basic Payment Flow (No Credits)');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('Creating project with multiple endpoints (credits disabled)...');
  const basicProject = {
    name: 'Basic Payment Test',
    description: 'Test basic x402 payments without credits',
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
        description: 'Low-cost endpoint'
      },
      {
        url: 'https://api.coingecko.com/api/v3',
        path: '/ping',
        method: 'GET',
        price: 0.02,
        description: 'Medium-cost endpoint'
      },
      {
        url: 'https://api.github.com',
        path: '/zen',
        method: 'GET',
        price: 0.03,
        description: 'High-cost endpoint'
      }
    ]
  };

  const basicResponse = await fetch('http://localhost:3000/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(basicProject)
  });

  const basicResult = await basicResponse.json();
  if (!basicResponse.ok) {
    console.log('❌ Failed to create project:', basicResult);
    return;
  }

  const basicSlug = basicResult.project.slug;
  console.log(`✅ Project created: ${basicSlug}\n`);

  const maxValue = BigInt(1000000);
  const x402fetch = wrapFetchWithPayment(fetch, signer, maxValue);

  console.log('Test 1.1: Payment without X-Payment header (should return 402)');
  try {
    const noPaymentResponse = await fetch(`http://localhost:3000/api/proxy/${basicSlug}/posts/1`);
    logTest(
      'Returns 402 without payment',
      noPaymentResponse.status === 402,
      `Status: ${noPaymentResponse.status}`
    );

    if (noPaymentResponse.status === 402) {
      const body = await noPaymentResponse.json();
      logTest(
        'Includes payment requirements',
        body.accepts && body.accepts.length > 0,
        `Found ${body.accepts?.length || 0} payment options`
      );
    }
  } catch (error) {
    logTest('Returns 402 without payment', false, error.message);
  }

  console.log('\nTest 1.2: Valid payments for different price points');
  const basicEndpoints = [
    { path: '/posts/1', name: 'Low-cost ($0.01)', price: 0.01 },
    { path: '/ping', name: 'Medium-cost ($0.02)', price: 0.02 },
    { path: '/zen', name: 'High-cost ($0.03)', price: 0.03 }
  ];

  for (const endpoint of basicEndpoints) {
    try {
      const url = `http://localhost:3000/api/proxy/${basicSlug}${endpoint.path}`;
      const response = await x402fetch(url, { method: 'GET' });

      const settlement = response.headers.get('X-Proxy-Settlement-Status');
      const creditBalance = response.headers.get('X-Credit-Balance');

      logTest(
        `${endpoint.name} payment successful`,
        response.status === 200,
        `Settlement: ${settlement}, Credits: ${creditBalance || 'N/A'}`
      );
    } catch (error) {
      logTest(`${endpoint.name} payment successful`, false, error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // ═══════════════════════════════════════════════════════
  // TEST SUITE 2: Credit System - Overpayment
  // ═══════════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('TEST SUITE 2: Credit System - Overpayment');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('Creating credit-enabled project...');
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
        description: 'Credit-enabled endpoint'
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
  console.log(`✅ Project: ${creditSlug}\n`);

  console.log('Enabling credits for endpoint...');
  const enableResponse = await fetch(`http://localhost:3000/api/endpoints/${endpointId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creditsEnabled: true, minTopupAmount: 0.01 })
  });

  logTest('Credit enablement', enableResponse.ok, '');
  console.log('');

  console.log('Test 2.1: Overpayment creates credits');
  const overpaymentAmount = 0.05;
  const endpointPrice = 0.01;
  const expectedCredits = 0.04;

  const now = Math.floor(Date.now() / 1000);
  const payToAddress = process.env.ADDRESS || '0xC237b055dd2f9e9B7fDBC531cca9fF44dF6727cf';

  const overpaymentAuth = {
    from: signer.account.address,
    to: payToAddress,
    value: String(Math.floor(overpaymentAmount * 1000000)),
    validAfter: String(now - 60),
    validBefore: String(now + 600),
    nonce: '0x' + Math.random().toString(16).substring(2).padStart(64, '0')
  };

  const domain = {
    name: 'USD Coin',
    version: '2',
    chainId: 8453,
    verifyingContract: usdcAddress
  };

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

  const overpaymentSig = await signer.account.signTypedData({
    domain,
    types,
    primaryType: 'TransferWithAuthorization',
    message: overpaymentAuth
  });

  const overpaymentPayment = {
    x402Version: 1,
    scheme: 'exact',
    network: 'base',
    payload: { signature: overpaymentSig, authorization: overpaymentAuth }
  };

  const overpaymentHeader = Buffer.from(JSON.stringify(overpaymentPayment)).toString('base64');
  const overpaymentUrl = `http://localhost:3000/api/proxy/${creditSlug}/users/1`;

  try {
    const overpaymentResp = await fetch(overpaymentUrl, {
      method: 'GET',
      headers: { 'X-Payment': overpaymentHeader }
    });

    const creditBalance = parseFloat(overpaymentResp.headers.get('X-Credit-Balance') || '0');
    const totalDeposited = parseFloat(overpaymentResp.headers.get('X-Credit-Total-Deposited') || '0');

    logTest(
      'Overpayment accepted',
      overpaymentResp.status === 200,
      `Status: ${overpaymentResp.status}`
    );

    logTest(
      'Correct credit balance created',
      Math.abs(creditBalance - expectedCredits) < 0.001,
      `Expected: $${expectedCredits}, Got: $${creditBalance}`
    );

    logTest(
      'Total deposited tracked correctly',
      Math.abs(totalDeposited - expectedCredits) < 0.001,
      `Total deposited: $${totalDeposited}`
    );
  } catch (error) {
    logTest('Overpayment creates credits', false, error.message);
  }

  // ═══════════════════════════════════════════════════════
  // TEST SUITE 3: Credit Usage with Zero-Value Auth
  // ═══════════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('TEST SUITE 3: Credit Usage with Zero-Value Auth');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('Test 3.1: Zero-value authentication works');
  await new Promise(resolve => setTimeout(resolve, 2000));

  const zeroValueAuth = {
    from: signer.account.address,
    to: payToAddress,
    value: '0',
    validAfter: String(Math.floor(Date.now() / 1000) - 60),
    validBefore: String(Math.floor(Date.now() / 1000) + 600),
    nonce: '0x' + Math.random().toString(16).substring(2).padStart(64, '0')
  };

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
    payload: { signature: zeroValueSig, authorization: zeroValueAuth }
  };

  const zeroValueHeader = Buffer.from(JSON.stringify(zeroValuePayment)).toString('base64');

  try {
    const zeroResp = await fetch(overpaymentUrl, {
      method: 'GET',
      headers: { 'X-Payment': zeroValueHeader }
    });

    const balance = parseFloat(zeroResp.headers.get('X-Credit-Balance') || '0');
    const used = zeroResp.headers.get('X-Credit-Used');
    const settlement = zeroResp.headers.get('X-Proxy-Settlement-Status');

    logTest(
      'Zero-value auth accepted',
      zeroResp.status === 200,
      `Status: ${zeroResp.status}`
    );

    logTest(
      'Credits deducted correctly',
      Math.abs(balance - 0.03) < 0.001,
      `Balance: $${balance} (expected $0.03)`
    );

    logTest(
      'Credits marked as used',
      used === 'true',
      `Credits used: ${used}`
    );

    logTest(
      'Settlement skipped for credit usage',
      settlement === 'skipped_credits',
      `Settlement status: ${settlement}`
    );
  } catch (error) {
    logTest('Zero-value authentication works', false, error.message);
  }

  // ═══════════════════════════════════════════════════════
  // TEST SUITE 4: Credit Exhaustion
  // ═══════════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('TEST SUITE 4: Credit Exhaustion');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('Test 4.1: Using remaining credits');
  let currentBalance = 0.03;
  let requestCount = 0;

  while (currentBalance >= endpointPrice && requestCount < 5) {
    requestCount++;
    await new Promise(resolve => setTimeout(resolve, 1500));

    const auth = {
      from: signer.account.address,
      to: payToAddress,
      value: '0',
      validAfter: String(Math.floor(Date.now() / 1000) - 60),
      validBefore: String(Math.floor(Date.now() / 1000) + 600),
      nonce: '0x' + Math.random().toString(16).substring(2).padStart(64, '0')
    };

    const sig = await signer.account.signTypedData({
      domain,
      types,
      primaryType: 'TransferWithAuthorization',
      message: auth
    });

    const payment = {
      x402Version: 1,
      scheme: 'exact',
      network: 'base',
      payload: { signature: sig, authorization: auth }
    };

    const header = Buffer.from(JSON.stringify(payment)).toString('base64');

    try {
      const resp = await fetch(overpaymentUrl, {
        method: 'GET',
        headers: { 'X-Payment': header }
      });

      if (resp.status === 200) {
        const balance = parseFloat(resp.headers.get('X-Credit-Balance') || '0');
        currentBalance = balance;
        console.log(`   Request ${requestCount}: Balance $${balance}`);
      } else {
        console.log(`   Request ${requestCount}: Failed (${resp.status})`);
        break;
      }
    } catch (error) {
      console.log(`   Request ${requestCount}: Error - ${error.message}`);
      break;
    }
  }

  logTest(
    'Multiple credit requests successful',
    requestCount === 3,
    `Completed ${requestCount} requests (expected 3)`
  );

  logTest(
    'Final balance is zero',
    Math.abs(currentBalance) < 0.001,
    `Final balance: $${currentBalance}`
  );

  console.log('\nTest 4.2: Request fails after credits exhausted');
  await new Promise(resolve => setTimeout(resolve, 1500));

  const finalAuth = {
    from: signer.account.address,
    to: payToAddress,
    value: '0',
    validAfter: String(Math.floor(Date.now() / 1000) - 60),
    validBefore: String(Math.floor(Date.now() / 1000) + 600),
    nonce: '0x' + Math.random().toString(16).substring(2).padStart(64, '0')
  };

  const finalSig = await signer.account.signTypedData({
    domain,
    types,
    primaryType: 'TransferWithAuthorization',
    message: finalAuth
  });

  const finalPayment = {
    x402Version: 1,
    scheme: 'exact',
    network: 'base',
    payload: { signature: finalSig, authorization: finalAuth }
  };

  const finalHeader = Buffer.from(JSON.stringify(finalPayment)).toString('base64');

  try {
    const finalResp = await fetch(overpaymentUrl, {
      method: 'GET',
      headers: { 'X-Payment': finalHeader }
    });

    logTest(
      'Returns 402 when credits exhausted',
      finalResp.status === 402,
      `Status: ${finalResp.status}`
    );

    if (finalResp.status === 402) {
      const errorBody = await finalResp.json();
      logTest(
        'Includes insufficient credits message',
        errorBody.error && errorBody.error.includes('Insufficient credits'),
        `Error: ${errorBody.error}`
      );

      logTest(
        'Provides payment alternatives',
        errorBody.accepts && errorBody.accepts.length > 0,
        `Found ${errorBody.accepts?.length || 0} payment options`
      );
    }
  } catch (error) {
    logTest('Returns 402 when credits exhausted', false, error.message);
  }

  // ═══════════════════════════════════════════════════════
  // TEST SUITE 5: Edge Cases
  // ═══════════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('TEST SUITE 5: Edge Cases');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('Test 5.1: Invalid signature rejected');
  try {
    const invalidPayment = {
      x402Version: 1,
      scheme: 'exact',
      network: 'base',
      payload: {
        signature: '0x0000000000000000000000000000000000000000000000000000000000000000',
        authorization: zeroValueAuth
      }
    };

    const invalidHeader = Buffer.from(JSON.stringify(invalidPayment)).toString('base64');
    const invalidResp = await fetch(overpaymentUrl, {
      method: 'GET',
      headers: { 'X-Payment': invalidHeader }
    });

    logTest(
      'Invalid signature rejected',
      invalidResp.status === 402,
      `Status: ${invalidResp.status}`
    );
  } catch (error) {
    logTest('Invalid signature rejected', false, error.message);
  }

  console.log('\nTest 5.2: Expired timestamp rejected');
  try {
    const expiredAuth = {
      from: signer.account.address,
      to: payToAddress,
      value: '0',
      validAfter: String(Math.floor(Date.now() / 1000) - 3600),
      validBefore: String(Math.floor(Date.now() / 1000) - 1800),
      nonce: '0x' + Math.random().toString(16).substring(2).padStart(64, '0')
    };

    const expiredSig = await signer.account.signTypedData({
      domain,
      types,
      primaryType: 'TransferWithAuthorization',
      message: expiredAuth
    });

    const expiredPayment = {
      x402Version: 1,
      scheme: 'exact',
      network: 'base',
      payload: { signature: expiredSig, authorization: expiredAuth }
    };

    const expiredHeader = Buffer.from(JSON.stringify(expiredPayment)).toString('base64');
    const expiredResp = await fetch(overpaymentUrl, {
      method: 'GET',
      headers: { 'X-Payment': expiredHeader }
    });

    logTest(
      'Expired timestamp rejected',
      expiredResp.status === 402,
      `Status: ${expiredResp.status}`
    );
  } catch (error) {
    logTest('Expired timestamp rejected', false, error.message);
  }

  // ═══════════════════════════════════════════════════════
  // TEST SUITE 6: Headers, Body, and Params
  // ═══════════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('TEST SUITE 6: Headers, Body, and Params');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('Creating project with configured headers, body, and params...');
  const configProject = {
    name: 'Config Test Project',
    description: 'Test headers, body, and params configuration',
    defaultPrice: 0.01,
    currency: 'USD',
    payTo: process.env.ADDRESS || '0xC237b055dd2f9e9B7fDBC531cca9fF44dF6727cf',
    paymentChains: ['base'],
    endpoints: [
      {
        url: 'https://httpbin.org',
        path: '/anything',
        method: 'POST',
        price: 0.01,
        headers: {
          'X-Custom-Header': 'test-value',
          'X-API-Key': 'secret-key-123'
        },
        body: {
          defaultField: 'default-value',
          timestamp: 'server-time'
        },
        params: {
          source: 'xpay2',
          version: '1.0'
        },
        description: 'Endpoint with headers, body, and params'
      }
    ]
  };

  const configResp = await fetch('http://localhost:3000/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(configProject)
  });

  const configData = await configResp.json();
  console.log(`✅ Project: ${configData.project.slug}\n`);

  const configEndpoint = configData.project.endpoints[0];
  const configUrl = `http://localhost:3000/api/proxy/${configData.project.slug}${configEndpoint.path}`;

  console.log('Test 6.1: Configured headers are merged with request');
  try {
    const fetchWithPayment = wrapFetchWithPayment(fetch, signer);
    const resp = await fetchWithPayment(configUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Request': 'from-client'
      },
      body: JSON.stringify({
        userField: 'user-value'
      })
    });

    const respData = await resp.json();

    const hasDefaultHeaders = respData.headers['X-Custom-Header'] === 'test-value' &&
                               respData.headers['X-Api-Key'] === 'secret-key-123';
    const hasRequestHeader = respData.headers['X-Custom-Request'] === 'from-client';
    const hasDefaultBody = respData.json?.defaultField === 'default-value';
    const hasUserBody = respData.json?.userField === 'user-value';
    const hasParams = respData.args?.source === 'xpay2' && respData.args?.version === '1.0';

    logTest(
      'Headers merged correctly',
      hasDefaultHeaders && hasRequestHeader,
      `Default headers: ${hasDefaultHeaders}, Request header: ${hasRequestHeader}`
    );

    logTest(
      'Body merged correctly',
      hasDefaultBody && hasUserBody,
      `Default body: ${hasDefaultBody}, User body: ${hasUserBody}`
    );

    logTest(
      'Params appended correctly',
      hasParams,
      `Params found: source=${respData.args?.source}, version=${respData.args?.version}`
    );

  } catch (error) {
    logTest('Headers merged correctly', false, error.message);
    logTest('Body merged correctly', false, error.message);
    logTest('Params appended correctly', false, error.message);
  }

  // ═══════════════════════════════════════════════════════
  // TEST RESULTS SUMMARY
  // ═══════════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%\n`);

  if (results.failed > 0) {
    console.log('Failed Tests:');
    results.tests.filter(t => !t.passed).forEach(t => {
      console.log(`   ❌ ${t.name}`);
      if (t.details) console.log(`      ${t.details}`);
    });
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log(results.failed === 0 ? '✅ ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED');
  console.log('═══════════════════════════════════════════════════════\n');

  process.exit(results.failed > 0 ? 1 : 0);
}

if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

runComprehensiveE2ETests().catch(error => {
  console.error('\n❌ Test suite crashed:', error);
  process.exit(1);
});